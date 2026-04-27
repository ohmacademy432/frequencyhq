import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { googleLogout, useGoogleLogin } from '@react-oauth/google'

const STORAGE_KEY = 'fhq_auth'
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

type StoredAuth = {
  accessToken: string
  expiresAt: number
}

type AuthContextValue = {
  accessToken: string | null
  isSignedIn: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (
      typeof parsed?.accessToken !== 'string' ||
      typeof parsed?.expiresAt !== 'number'
    ) {
      return null
    }
    if (parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null)

  useEffect(() => {
    const stored = readStored()
    if (stored) {
      setAuth(stored)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const login = useGoogleLogin({
    flow: 'implicit',
    scope: SCOPES,
    onSuccess: (response) => {
      const next: StoredAuth = {
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setAuth(next)
    },
    onError: (error) => {
      console.error('Google sign-in failed', error)
    },
  })

  const signIn = useCallback(() => {
    login()
  }, [login])

  const signOut = useCallback(() => {
    googleLogout()
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: auth?.accessToken ?? null,
      isSignedIn: auth !== null,
      signIn,
      signOut,
    }),
    [auth, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
