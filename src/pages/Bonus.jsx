import { useEffect, useState } from 'react'
import { listProfiles, addEntry } from '../lib/db'
import { useSession } from '../context/SessionContext'
import './Bonus.css'

export default function Bonus() {
  const { profile } = useSession()
  const [profiles, setProfiles] = useState([])
  const [profileId, setProfileId] = useState(null)
  const [sign, setSign] = useState('positive')
  const [value, setValue] = useState(10)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    listProfiles().then((p) => {
      setProfiles(p)
      setProfileId(profile?.id ?? p[0]?.id)
    })
  }, [profile])

  const valid = profileId && Number(value) > 0 && reason.trim().length > 0

  async function submit() {
    if (!valid) return
    setSaving(true)
    try {
      const target = profiles.find((p) => p.id === profileId)
      const points = sign === 'negative' ? -Math.abs(Number(value)) : Math.abs(Number(value))
      await addEntry({
        taskId: null,
        profileId,
        points,
        reason: reason.trim(),
        taskIcon: sign === 'negative' ? '⚠️' : '🎁',
        profileName: target?.name,
        profileColor: target?.color,
      })
      setToast(`${target?.name} ${points >= 0 ? 'ganhou' : 'perdeu'} ${Math.abs(points)} pts`)
      setReason('')
      setValue(10)
      setTimeout(() => setToast(null), 2200)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-main">
      <h1 className="page-title">Pontos bónus</h1>
      <p className="page-subtitle">Para aquelas coisas que não estão na lista de tarefas</p>

      {toast && <div className="toast">{toast}</div>}

      <div className="card">
        <div className="form-field">
          <label>Quem?</label>
          <div className="profile-choice-grid">
            {profiles.map((p) => (
              <button
                key={p.id}
                className={`profile-choice${profileId === p.id ? ' selected' : ''}`}
                style={{ '--profile-color': p.color }}
                onClick={() => setProfileId(p.id)}
              >
                <span className="profile-avatar" style={{ '--profile-color': p.color }}>
                  {p.name.charAt(0)}
                </span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Tipo</label>
          <div className="points-toggle">
            <button
              type="button"
              className={sign === 'positive' ? 'active-positive' : ''}
              onClick={() => setSign('positive')}
            >
              + Pontos
            </button>
            <button
              type="button"
              className={sign === 'negative' ? 'active-negative' : ''}
              onClick={() => setSign('negative')}
            >
              − Pontos
            </button>
          </div>
        </div>

        <div className="form-field">
          <label>Quantos pontos?</label>
          <input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Motivo</label>
          <textarea
            placeholder="Ex: Surpreendeu-me com o pequeno-almoço"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-block" onClick={submit} disabled={!valid || saving}>
          {saving ? 'A guardar…' : 'Atribuir pontos'}
        </button>
      </div>
    </div>
  )
}
