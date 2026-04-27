export type CalendarEvent = {
  id: string
  summary: string
  start: Date
  end: Date
  location?: string
  htmlLink: string
  startLabel: string
  durationLabel: string
  isAllDay: boolean
  dateKey: string
  dateLabel: string
}

type GcalDate = { dateTime?: string; date?: string; timeZone?: string }
type GcalEvent = {
  id: string
  summary?: string
  location?: string
  htmlLink?: string
  start: GcalDate
  end: GcalDate
}
type GcalListResponse = { items?: GcalEvent[] }

const CAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export async function fetchUpcomingEvents(
  accessToken: string,
  days = 5,
): Promise<CalendarEvent[]> {
  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMax.getDate() + days)

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(`${CAL_BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) throw new Error('AUTH_EXPIRED')
  if (!res.ok) throw new Error(`Calendar API ${res.status}`)

  const data = (await res.json()) as GcalListResponse
  return (data.items ?? []).map(parseEvent)
}

function parseEvent(e: GcalEvent): CalendarEvent {
  const isAllDay = !!e.start.date && !e.start.dateTime
  const start = isAllDay
    ? parseAllDayDate(e.start.date!)
    : new Date(e.start.dateTime!)
  const end = isAllDay
    ? parseAllDayDate(e.end.date!)
    : new Date(e.end.dateTime!)

  return {
    id: e.id,
    summary: e.summary || '(no title)',
    start,
    end,
    location: e.location,
    htmlLink: e.htmlLink ?? 'https://calendar.google.com/calendar',
    startLabel: isAllDay ? 'All day' : formatStartTime(start),
    durationLabel: isAllDay ? '' : formatDuration(start, end),
    isAllDay,
    dateKey: formatDateKey(start),
    dateLabel: formatDateLabel(start),
  }
}

function parseAllDayDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatStartTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  if (Number.isInteger(hours)) return `${hours} hr`
  return `${hours.toFixed(1)} hr`
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(d: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function buildQuickAddUrl(senderName: string, subject: string): string {
  const title = `${senderName} — ${subject}`
  return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}`
}
