import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchPriorityInbox, fetchUnreadCounts } from '../lib/gmail'
import type { InboxItem } from '../lib/gmail'
import { fetchTodaysEvents } from '../lib/calendar'
import type { CalendarEvent } from '../lib/calendar'

const REFRESH_MS = 5 * 60 * 1000

type FhqDataValue = {
  counts: Record<string, number> | null
  inbox: InboxItem[] | null
  events: CalendarEvent[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const FhqDataContext = createContext<FhqDataValue | null>(null)

export function FhqDataProvider({ children }: { children: ReactNode }) {
  const { accessToken, signOut } = useAuth()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [inbox, setInbox] = useState<InboxItem[] | null>(null)
  const [events, setEvents] = useState<CalendarEvent[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenRef = useRef(accessToken)
  tokenRef.current = accessToken

  const load = useCallback(async () => {
    const token = tokenRef.current
    if (!token) {
      setCounts(null)
      setInbox(null)
      setEvents(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [nextCounts, nextInbox, nextEvents] = await Promise.all([
        fetchUnreadCounts(token),
        fetchPriorityInbox(token),
        fetchTodaysEvents(token),
      ])
      setCounts(nextCounts)
      setInbox(nextInbox)
      setEvents(nextEvents)
      setLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setLoading(false)
      if (message === 'AUTH_EXPIRED') {
        signOut()
        return
      }
      setError(message)
    }
  }, [signOut])

  useEffect(() => {
    if (!accessToken) {
      setCounts(null)
      setInbox(null)
      setEvents(null)
      setError(null)
      setLoading(false)
      return
    }
    load()
  }, [accessToken, load])

  useEffect(() => {
    if (!accessToken) return
    const id = window.setInterval(() => load(), REFRESH_MS)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [accessToken, load])

  const value: FhqDataValue = {
    counts,
    inbox,
    events,
    loading,
    error,
    refetch: load,
  }

  return (
    <FhqDataContext.Provider value={value}>{children}</FhqDataContext.Provider>
  )
}

export function useFhqData(): FhqDataValue {
  const ctx = useContext(FhqDataContext)
  if (!ctx) {
    throw new Error('useFhqData must be used inside an FhqDataProvider')
  }
  return ctx
}
