import { useState } from 'react'
import Modal from './Modal'

export default function AssignPointsModal({ task, profiles, defaultProfileId, onConfirm, onClose }) {
  const [profileId, setProfileId] = useState(defaultProfileId ?? profiles[0]?.id)
  const [saving, setSaving] = useState(false)

  async function confirm() {
    setSaving(true)
    try {
      await onConfirm(profileId)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Quem ganha os pontos?" onClose={onClose}>
      <p className="page-subtitle" style={{ marginBottom: 16 }}>
        {task.icon} {task.name} · {task.points >= 0 ? '+' : ''}
        {task.points} pts
      </p>
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
      <button className="btn btn-primary btn-block" onClick={confirm} disabled={saving}>
        {saving ? 'A guardar…' : 'Confirmar'}
      </button>
    </Modal>
  )
}
