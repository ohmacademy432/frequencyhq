import { appointments as mockAppointments } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useFhqData } from '../hooks/useFhqData'

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

export default function Appointments() {
  const { isSignedIn } = useAuth()
  const { events, loading, error, refetch } = useFhqData()

  if (!isSignedIn) {
    return (
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Today's Appointments</h2>
          <span className="card-meta">{mockAppointments.length} TODAY</span>
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

  return (
    <section className="card" aria-busy={loading || undefined}>
      <div className="card-head">
        <h2 className="card-title">Today's Appointments</h2>
        <span className="card-meta">{items.length} TODAY</span>
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
      ) : items.length === 0 ? (
        <p className="appt-empty">Nothing scheduled today</p>
      ) : (
        <ul className="appt-list">
          {items.map((event) => {
            const meta = [event.location, event.durationLabel]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={event.id}>
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
          })}
        </ul>
      )}

      <NewAppointmentButton />
    </section>
  )
}
