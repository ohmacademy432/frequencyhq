import { inbox as mockInbox } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useFhqData } from '../hooks/useFhqData'
import { buildQuickAddUrl } from '../lib/calendar'

export default function Inbox() {
  const { isSignedIn } = useAuth()
  const { inbox, loading, error, refetch } = useFhqData()

  if (!isSignedIn) {
    return (
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Priority Inbox</h2>
          <span className="card-meta card-meta-muted">UNIFIED</span>
        </div>
        <ul className="inbox-list">
          {mockInbox.map((item) => (
            <li key={item.id}>
              <div className="inbox-row">
                <div className="inbox-row-main">
                  <span className="inbox-business">{item.business}</span>
                  <span className="inbox-subject">{item.subject}</span>
                  <span className="inbox-time">{item.timestamp}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const showSkeleton = loading && !inbox
  const showError = !!error && !inbox
  const items = inbox ? inbox.slice(0, 10) : []
  const priorityCount = items.filter((i) => i.isPriority).length
  const hasPriority = priorityCount > 0

  return (
    <section className="card" aria-busy={loading || undefined}>
      <div className="card-head">
        <h2 className="card-title">Priority Inbox</h2>
        <span className={`card-meta${hasPriority ? '' : ' card-meta-muted'}`}>
          {hasPriority ? `${priorityCount} PRIORITY` : 'UNIFIED'}
        </span>
      </div>

      {showError ? (
        <div className="inbox-error">
          <p className="inbox-error-text">Couldn't reach Gmail.</p>
          <button type="button" className="inbox-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : showSkeleton ? (
        <ul className="inbox-list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="inbox-row inbox-row-skeleton">
                <div className="inbox-row-main">
                  <span className="inbox-skel skel-business" />
                  <span className="inbox-skel skel-subject" />
                  <span className="inbox-skel skel-time" />
                </div>
                <span className="inbox-quick-add-placeholder" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="inbox-zero">Inbox zero</p>
      ) : (
        <ul className="inbox-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="inbox-row">
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inbox-row-main inbox-row-link"
                >
                  <span className="inbox-business">
                    {item.isPriority && (
                      <span
                        className="inbox-priority-dot"
                        aria-label="Priority"
                      />
                    )}
                    {item.label}
                  </span>
                  <span className="inbox-subject">{item.subject}</span>
                  <span className="inbox-time">{item.timeAgo}</span>
                </a>
                <a
                  href={buildQuickAddUrl(item.senderName, item.subject)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inbox-quick-add"
                  aria-label="Add to calendar"
                  title="Add to calendar"
                >
                  +
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
