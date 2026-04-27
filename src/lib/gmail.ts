export const ACCOUNT_LABELS: Record<string, string> = {
  'ohmacademy432@gmail.com': 'Ohm Academy',
  'inneralchemyhealing432@gmail.com': 'Ohm Academy',
  'timelessrnwellnessspa@gmail.com': 'Timeless RN',
  'thefreqlab@gmail.com': 'Frequency Lab',
  'thefrequencylab369@gmail.com': 'Frequency Lab',
  'abila.bogle@gmail.com': 'Personal',
  'abila.louise@gmail.com': 'Personal',
}

export const LABEL_ORDER = ['Ohm Academy', 'Timeless RN', 'Frequency Lab', 'Personal']

export const LABEL_QUERIES: Record<string, string> = {
  'Ohm Academy': 'is:unread label:"Ohm Academy"',
  'Timeless RN': 'is:unread label:"Timeless RN"',
  'Frequency Lab': 'is:unread label:"Frequency Lab"',
  Personal: 'is:unread label:Personal',
}

export const PRIORITY_KEYWORDS = [
  'appointment',
  'booking',
  'consultation',
  'session',
  'schedule',
  'reservation',
  'inquiry',
]

const PRIORITY_CLAUSE = `(${PRIORITY_KEYWORDS.map((k) => `subject:${k}`).join(' OR ')})`

export const PRIORITY_LABEL_QUERIES: Record<string, string> = Object.fromEntries(
  LABEL_ORDER.map((label) => [label, `${LABEL_QUERIES[label]} ${PRIORITY_CLAUSE}`]),
)

export type InboxItem = {
  id: string
  threadId: string
  permalink: string
  subject: string
  senderName: string
  snippet: string
  to: string
  label: string
  date: Date
  timeAgo: string
  isPriority: boolean
}

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

type GmailHeader = { name: string; value: string }
type GmailMessageMeta = {
  id: string
  threadId: string
  snippet?: string
  internalDate?: string
  payload?: { headers?: GmailHeader[] }
}
type GmailListResponse = {
  messages?: { id: string; threadId: string }[]
  resultSizeEstimate?: number
}

async function gmailFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) {
    throw new Error('AUTH_EXPIRED')
  }
  if (!res.ok) {
    throw new Error(`Gmail API ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchUnreadCounts(
  accessToken: string,
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    LABEL_ORDER.map(async (label) => {
      const q = encodeURIComponent(LABEL_QUERIES[label])
      const data = await gmailFetch<GmailListResponse>(
        `${GMAIL_BASE}/messages?q=${q}&maxResults=500`,
        accessToken,
      )
      return [label, data.messages?.length ?? 0] as const
    }),
  )
  return Object.fromEntries(entries)
}

type MessageRef = { id: string; threadId: string }
type EnrichedRef = MessageRef & { forcedLabel: string; isPriority: boolean }

async function fetchMessageRefs(
  accessToken: string,
  query: string,
  maxResults: number,
): Promise<MessageRef[]> {
  const q = encodeURIComponent(query)
  const data = await gmailFetch<GmailListResponse>(
    `${GMAIL_BASE}/messages?q=${q}&maxResults=${maxResults}`,
    accessToken,
  )
  return (data.messages ?? []).map((m) => ({
    id: m.id,
    threadId: m.threadId,
  }))
}

async function fetchMessageMetadata(
  accessToken: string,
  ref: EnrichedRef,
): Promise<InboxItem> {
  const params = new URLSearchParams()
  params.append('format', 'metadata')
  params.append('metadataHeaders', 'From')
  params.append('metadataHeaders', 'Subject')
  params.append('metadataHeaders', 'Date')
  params.append('metadataHeaders', 'To')

  const url = `${GMAIL_BASE}/messages/${ref.id}?${params.toString()}`
  const msg = await gmailFetch<GmailMessageMeta>(url, accessToken)
  return parseMessage(msg, ref.forcedLabel, ref.isPriority)
}

export async function fetchPriorityInbox(
  accessToken: string,
  perLabel = 5,
): Promise<InboxItem[]> {
  const priorityResults = await Promise.all(
    LABEL_ORDER.map(async (label) => {
      const refs = await fetchMessageRefs(accessToken, PRIORITY_LABEL_QUERIES[label], 5)
      return refs.map<EnrichedRef>((r) => ({
        ...r,
        forcedLabel: label,
        isPriority: true,
      }))
    }),
  )

  const standardResults = await Promise.all(
    LABEL_ORDER.map(async (label) => {
      const refs = await fetchMessageRefs(accessToken, LABEL_QUERIES[label], perLabel)
      return refs.map<EnrichedRef>((r) => ({
        ...r,
        forcedLabel: label,
        isPriority: false,
      }))
    }),
  )

  const allRefs: EnrichedRef[] = []
  for (const refs of priorityResults) allRefs.push(...refs)
  for (const refs of standardResults) allRefs.push(...refs)

  const seen = new Map<string, EnrichedRef>()
  for (const ref of allRefs) {
    const existing = seen.get(ref.id)
    if (!existing || (ref.isPriority && !existing.isPriority)) {
      seen.set(ref.id, ref)
    }
  }
  const uniqueRefs = Array.from(seen.values())
  if (uniqueRefs.length === 0) return []

  const items = await Promise.all(
    uniqueRefs.map((ref) => fetchMessageMetadata(accessToken, ref)),
  )

  if (
    typeof window !== 'undefined' &&
    !(window as unknown as { __fhq_diag_logged?: boolean }).__fhq_diag_logged
  ) {
    ;(window as unknown as { __fhq_diag_logged?: boolean }).__fhq_diag_logged = true
    console.group('[FHQ Diagnostic]')
    console.log(
      'Priority counts per label:',
      priorityResults.map((r, i) => `${LABEL_ORDER[i]}: ${r.length}`),
    )
    console.log(
      'Standard counts per label:',
      standardResults.map((r, i) => `${LABEL_ORDER[i]}: ${r.length}`),
    )
    console.log('After dedup:', uniqueRefs.length, 'unique items')
    console.log(
      'Sample item labels and isPriority:',
      items.slice(0, 5).map((i) => ({
        label: i.label,
        priority: i.isPriority,
        subject: i.subject,
      })),
    )
    console.groupEnd()
  }

  return items
    .sort((a, b) => {
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1
      return b.date.getTime() - a.date.getTime()
    })
    .slice(0, 10)
}

function parseMessage(
  msg: GmailMessageMeta,
  forcedLabel: string,
  isPriority: boolean,
): InboxItem {
  const headers = msg.payload?.headers ?? []
  const get = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

  const subject = get('Subject') || '(no subject)'
  const toRaw = get('To')
  const dateHeader = get('Date')
  const internalMs = msg.internalDate ? Number(msg.internalDate) : NaN
  const date =
    Number.isFinite(internalMs) && internalMs > 0
      ? new Date(internalMs)
      : new Date(dateHeader || Date.now())

  return {
    id: msg.id,
    threadId: msg.threadId,
    permalink: `https://mail.google.com/mail/u/0/#all/${msg.threadId}`,
    subject,
    senderName: parseSenderName(get('From')),
    snippet: msg.snippet ?? '',
    to: toRaw,
    label: forcedLabel,
    date,
    timeAgo: formatTimeAgo(date),
    isPriority,
  }
}

function extractEmail(value: string): string {
  const match = value.match(/[\w.+-]+@[\w.-]+/)
  return match ? match[0].toLowerCase() : ''
}

function parseSenderName(value: string): string {
  if (!value) return 'Unknown'
  const trimmed = value.trim()

  const named = trimmed.match(/^(.*?)\s*<([^>]+)>$/)
  if (named) {
    const rawName = named[1].trim().replace(/^["']+|["']+$/g, '').trim()
    if (rawName && !rawName.includes('@')) return rawName
    return capitalizeLocalPart(named[2].trim())
  }

  const email = extractEmail(trimmed)
  if (email) return capitalizeLocalPart(email)
  return trimmed
}

function capitalizeLocalPart(email: string): string {
  const local = email.split('@')[0] ?? ''
  if (!local) return 'Unknown'
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  if (sameDay(date, now)) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
