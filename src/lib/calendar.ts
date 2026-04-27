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

export async function fetchTodaysEvents(
  accessToken: string,
): Promise<CalendarEvent[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20',
  })

  const res = await fetch(`${CAL_BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) throw new Error('AUTH_EXPIRED')
  if (!res.ok) throw new Error(`Calendar API ${res.status}`)

  const data = (await res.json()) as GcalListResponse
  return (data.items ?? []).map(toCalendarEvent)
}

function toCalendarEvent(e: GcalEvent): CalendarEvent {
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

export function buildQuickAddUrl(senderName: string, subject: string): string {
  const title = `${senderName} — ${subject}`
  return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}`
}
