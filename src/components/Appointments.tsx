import { appointments as mockAppointments } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useFhqData } from '../hooks/useFhqData'
import type { CalendarEvent } from '../lib/calendar'

const NEW_EVENT_URL = 'https://calendar.google.com/calendar/u/0/r/eventedit'

function NewAppointmentButton() {
  return (
    <a
      href={NEW_EVENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="appt-new"
    >
      <span className="appt-new-plus" aria-hidden="true">+</span>
      <span>New appointment</span>
    </a>
  )
}

function groupByDate(events: CalendarEvent[]): { key: string; label: string; events: CalendarEvent[] }[] {
  const buckets = new Map<string, { label: string; events: CalendarEvent[] }>()
  for (const ev of events) {
    const bucket = buckets.get(ev.dateKey)
    if (bucket) {
      bucket.events.push(ev)
    } else {
      buckets.set(ev.dateKey, { label: ev.dateLabel, events: [ev] })
    }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, ...value }))
}

function EventRow({ event }: { event: CalendarEvent }) {
  const meta = [event.location, event.durationLabel].filter(Boolean).join(' · ')
  return (
    <li>
      <a
        href={event.htmlLink}
        target="_blank"
        rel="noopener noreferrer"
        className="appt-row appt-row-link"
      >
        <span className="appt-time">{event.startLabel}</span>
        <div className="appt-body">
          <p className="appt-title">{event.summary}</p>
          {meta && <p className="appt-meta">{meta}</p>}
        </div>
      </a>
    </li>
  )
}

export default function Appointments() {
  const { isSignedIn } = useAuth()
  const { events, loading, error, refetch } = useFhqData()

  if (!isSignedIn) {
    return (
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Upcoming</h2>
          <span className="card-meta card-meta-muted">
            {mockAppointments.length} EVENTS
          </span>
        </div>
        <ul className="appt-list">
          {mockAppointments.map((appt) => (
            <li key={appt.id} className="appt-row">
              <span className="appt-time">{appt.time}</span>
              <div className="appt-body">
                <p className="appt-title">
                  {appt.title}{' '}
                  <span className="appt-contact">— {appt.contact}</span>
                </p>
                <p className="appt-meta">
                  {appt.business} · {appt.duration}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <NewAppointmentButton />
      </section>
    )
  }

  const showSkeleton = loading && !events
  const showError = !!error && !events
  const items = events ?? []
  const groups = groupByDate(items)

  return (
    <section className="card" aria-busy={loading || undefined}>
      <div className="card-head">
        <h2 className="card-title">Upcoming</h2>
        <span className="card-meta card-meta-muted">
          {items.length === 0 ? '5 DAYS' : `${items.length} EVENTS`}
        </span>
      </div>

      {showError ? (
        <div className="inbox-error">
          <p className="inbox-error-text">Couldn't reach Calendar.</p>
          <button type="button" className="inbox-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : showSkeleton ? (
        <ul className="appt-list" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="appt-row appt-row-skeleton">
              <span className="appt-skel skel-appt-time" />
              <div className="appt-body">
                <span className="appt-skel skel-appt-title" />
                <span className="appt-skel skel-appt-meta" />
              </div>
            </li>
          ))}
        </ul>
      ) : groups.length === 0 ? (
        <p className="appt-empty">Nothing scheduled this week</p>
      ) : (
        <div className="appt-days">
          {groups.map((group) => (
            <div key={group.key} className="appt-day-group">
              <h3 className="appt-day-header">{group.label}</h3>
              <ul className="appt-list">
                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <NewAppointmentButton />
    </section>
  )
}
