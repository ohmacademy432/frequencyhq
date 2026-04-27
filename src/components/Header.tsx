import { summary, userName } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { useFhqData } from '../hooks/useFhqData'
import { useTasks } from '../contexts/TasksContext'

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

function formatDate(now: Date) {
  return `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}`
}

function getGreeting(now: Date, name: string) {
  const hour = now.getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

function ConnectionStatus() {
  const { isSignedIn, signIn, signOut } = useAuth()

  if (!isSignedIn) {
    return (
      <button type="button" className="connect-btn" onClick={signIn}>
        Connect Google
      </button>
    )
  }

  return (
    <div className="connection">
      <span className="connection-status" aria-live="polite">
        <span className="connection-dot" aria-hidden="true">●</span>
        Connected
      </span>
      <button type="button" className="connection-signout" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}

export default function Header() {
  const now = new Date()
  const { isSignedIn } = useAuth()
  const { counts, events } = useFhqData()
  const { tasks } = useTasks()

  const totalUnread =
    isSignedIn && counts
      ? Object.values(counts).reduce((sum, n) => sum + n, 0)
      : summary.unread
  const apptCount = isSignedIn && events ? events.length : summary.appointments
  const pendingCount = isSignedIn
    ? tasks.filter((t) => !t.completed).length
    : summary.pendingTasks

  return (
    <header className="header">
      <div className="header-top">
        <p className="eyebrow">{formatDate(now)}</p>
        <ConnectionStatus />
      </div>
      <h1 className="greeting">{getGreeting(now, userName)}</h1>
      <p className="subtitle">
        {apptCount} appointments · {totalUnread} unread · {pendingCount} pending tasks
      </p>
    </header>
  )
}
