import { useEffect, useState } from 'react'
import { listTasks, listProfiles, updateTask, deleteTask, setPin, usingMockData } from '../lib/db'
import { useSession } from '../context/SessionContext'
import TaskFormModal from '../components/TaskFormModal'
import './Settings.css'

export default function Settings() {
  const { profile, logout } = useSession()
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [editing, setEditing] = useState(null)
  const [pinDrafts, setPinDrafts] = useState({})
  const [pinStatus, setPinStatus] = useState({})

  async function refresh() {
    const [t, p] = await Promise.all([listTasks(), listProfiles()])
    setTasks(t)
    setProfiles(p)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function savePin(profileId) {
    const pin = pinDrafts[profileId]
    if (!pin || pin.length !== 4) {
      setPinStatus((s) => ({ ...s, [profileId]: 'O PIN tem de ter 4 dígitos.' }))
      return
    }
    await setPin(profileId, pin)
    setPinStatus((s) => ({ ...s, [profileId]: 'PIN atualizado ✓' }))
    setPinDrafts((d) => ({ ...d, [profileId]: '' }))
  }

  return (
    <div className="app-main">
      <h1 className="page-title">Definições</h1>
      <p className="page-subtitle">Gerir tarefas e PINs</p>

      {usingMockData && (
        <div className="mock-banner">
          A app está a usar dados de demonstração locais. Segue as instruções no README
          para ligar o Supabase e sincronizar entre os dois telemóveis.
        </div>
      )}

      <h3 className="section-label">Tarefas</h3>
      <div className="settings-task-list">
        {tasks.map((t) => (
          <button key={t.id} className="settings-task-row" onClick={() => setEditing(t)}>
            <span>{t.icon}</span>
            <span className="settings-task-name">{t.name}</span>
            <span className={t.points >= 0 ? 'positive' : 'negative'}>
              {t.points >= 0 ? '+' : ''}
              {t.points}
            </span>
          </button>
        ))}
      </div>

      <h3 className="section-label">PINs</h3>
      <div className="card">
        {profiles.map((p) => (
          <div key={p.id} className="pin-edit-row">
            <span className="profile-avatar" style={{ '--profile-color': p.color }}>
              {p.name.charAt(0)}
            </span>
            <div className="pin-edit-fields">
              <span className="pin-edit-name">{p.name}</span>
              <div className="pin-edit-input-row">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Novo PIN"
                  value={pinDrafts[p.id] ?? ''}
                  onChange={(e) =>
                    setPinDrafts((d) => ({ ...d, [p.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                  }
                />
                <button className="btn btn-ghost" onClick={() => savePin(p.id)}>
                  Guardar
                </button>
              </div>
              {pinStatus[p.id] && <span className="pin-edit-status">{pinStatus[p.id]}</span>}
            </div>
          </div>
        ))}
      </div>

      {profile && (
        <button className="btn btn-ghost btn-block" style={{ marginTop: 20 }} onClick={logout}>
          Trocar de perfil
        </button>
      )}

      {editing && (
        <TaskFormModal
          task={editing}
          onSave={(data) => updateTask(editing.id, data)}
          onDelete={(id) => deleteTask(id)}
          onClose={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
