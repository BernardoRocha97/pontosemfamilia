import { useState } from 'react'
import Modal from './Modal'

const CHALLENGE_ICONS = ['🏅', '🔥', '🏆', '⭐', '💪', '🍳', '🧹', '🧺']

export default function ChallengeFormModal({ challenge, tasks, onSave, onDelete, onClose }) {
  const [name, setName] = useState(challenge?.name ?? '')
  const [icon, setIcon] = useState(challenge?.icon ?? '🏅')
  const [taskId, setTaskId] = useState(challenge?.taskId ?? tasks[0]?.id ?? '')
  const [unit, setUnit] = useState(challenge?.unit ?? 'dia')
  const [target, setTarget] = useState(challenge?.target ?? 7)
  const [bonusPoints, setBonusPoints] = useState(challenge?.bonusPoints ?? 50)
  const [saving, setSaving] = useState(false)

  const valid = name.trim().length > 0 && taskId && Number(target) > 0 && Number(bonusPoints) > 0

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        icon,
        taskId,
        unit,
        target: Number(target),
        bonusPoints: Number(bonusPoints),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={challenge ? 'Editar desafio' : 'Novo desafio'} onClose={onClose}>
      <div className="form-field">
        <label>Nome do desafio</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Semana de jantares"
        />
      </div>

      <div className="form-field">
        <label>Ícone</label>
        <div className="icon-picker">
          {CHALLENGE_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={`icon-choice${icon === i ? ' selected' : ''}`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label>Qual tarefa?</label>
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>Seguidos, quantos... ?</label>
        <div className="points-toggle">
          <button type="button" className={unit === 'dia' ? 'active-positive' : ''} onClick={() => setUnit('dia')}>
            Dias
          </button>
          <button
            type="button"
            className={unit === 'semana' ? 'active-positive' : ''}
            onClick={() => setUnit('semana')}
          >
            Semanas
          </button>
        </div>
      </div>

      <div className="form-field">
        <label>Quantos {unit === 'dia' ? 'dias' : 'semanas'} seguidos?</label>
        <input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>

      <div className="form-field">
        <label>Bónus ao completar</label>
        <input type="number" min="1" value={bonusPoints} onChange={(e) => setBonusPoints(e.target.value)} />
      </div>

      <button className="btn btn-primary btn-block" onClick={save} disabled={saving || !valid}>
        {saving ? 'A guardar…' : 'Guardar desafio'}
      </button>

      {challenge && onDelete && (
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 10 }}
          onClick={async () => {
            setSaving(true)
            try {
              await onDelete(challenge.id)
              onClose()
            } finally {
              setSaving(false)
            }
          }}
          disabled={saving}
        >
          Apagar desafio
        </button>
      )}
    </Modal>
  )
}
