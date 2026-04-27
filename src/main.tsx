import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { FhqDataProvider } from './hooks/useFhqData'
import { TasksProvider } from './contexts/TasksContext'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!clientId) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId ?? ''}>
      <AuthProvider>
        <FhqDataProvider>
          <TasksProvider>
            <App />
          </TasksProvider>
        </FhqDataProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
