import { createContext, useContext, useEffect, useState } from 'react'

const SessionContext = createContext(null)
const STORAGE_KEY = 'pontos-de-familia-session'

export function SessionProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(STORAGE_KEY)
  }, [profile])

  return (
    <SessionContext.Provider value={{ profile, login: setProfile, logout: () => setProfile(null) }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession deve ser usado dentro de SessionProvider')
  return ctx
}
