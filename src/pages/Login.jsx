import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProfiles, verifyPin, usingMockData } from '../lib/db'
import { useSession } from '../context/SessionContext'
import './Login.css'

export default function Login() {
  const [profiles, setProfiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    listProfiles().then(setProfiles)
  }, [])

  useEffect(() => {
    if (pin.length === 4 && selected) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const profile = await verifyPin(selected.id, pin)
      if (!profile) {
        setError('PIN incorreto. Tenta outra vez.')
        setPin('')
        return
      }
      login(profile)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  function pressDigit(digit) {
    if (pin.length >= 4) return
    setPin((p) => p + digit)
  }

  function backspace() {
    setPin((p) => p.slice(0, -1))
  }

  if (!selected) {
    return (
      <div className="app-main login-page">
        <h1 className="page-title">Pontos de Família</h1>
        <p className="page-subtitle">Quem és tu?</p>
        {usingMockData && (
          <div className="mock-banner">
            Modo de demonstração: sem Supabase ligado ainda, os dados ficam guardados
            só neste browser. PIN de todos os perfis: <strong>0000</strong>.
          </div>
        )}
        <div className="profile-grid">
          {profiles.map((p) => (
            <button
              key={p.id}
              className="profile-card"
              style={{ '--profile-color': p.color }}
              onClick={() => {
                setSelected(p)
                setPin('')
                setError('')
              }}
            >
              <span className="profile-avatar">{p.name.charAt(0)}</span>
              <span className="profile-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="app-main login-page">
      <button className="link-back" onClick={() => setSelected(null)}>
        ← Trocar perfil
      </button>
      <div className="pin-header">
        <span className="profile-avatar" style={{ '--profile-color': selected.color }}>
          {selected.name.charAt(0)}
        </span>
        <h2>{selected.name}</h2>
        <p className="page-subtitle">Introduz o teu PIN</p>
      </div>
      <div className="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
        ))}
      </div>
      {error && <p className="pin-error">{error}</p>}
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => {
          if (key === '') return <span key={i} />
          if (key === '⌫') {
            return (
              <button key={i} className="pin-key" onClick={backspace} disabled={loading}>
                ⌫
              </button>
            )
          }
          return (
            <button key={i} className="pin-key" onClick={() => pressDigit(key)} disabled={loading}>
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
