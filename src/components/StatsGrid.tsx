import { stats as mockStats } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useFhqData } from '../hooks/useFhqData'
import { LABEL_ORDER, LABEL_QUERIES } from '../lib/gmail'

function gmailSearchUrl(query: string) {
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`
}

export default function StatsGrid() {
  const { isSignedIn } = useAuth()
  const { counts, loading } = useFhqData()

  if (!isSignedIn) {
    return (
      <section className="stats-grid" aria-label="Unread by business">
        {mockStats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-number">{stat.count}</p>
            <p className="stat-sublabel">unread</p>
          </article>
        ))}
      </section>
    )
  }

  return (
    <section
      className="stats-grid"
      aria-label="Unread by business"
      aria-busy={loading || undefined}
    >
      {LABEL_ORDER.map((label) => {
        const value = counts?.[label]
        const showPulse = loading && value === undefined
        return (
          <a
            key={label}
            href={gmailSearchUrl(LABEL_QUERIES[label])}
            target="_blank"
            rel="noopener noreferrer"
            className="stat-card stat-card-link"
          >
            <p className="stat-label">{label}</p>
            <p className="stat-number">
              {showPulse ? (
                <span className="stat-pulse" aria-hidden="true" />
              ) : value === undefined ? (
                '—'
              ) : (
                value
              )}
            </p>
            <p className="stat-sublabel">unread</p>
          </a>
        )
      })}
    </section>
  )
}
