import { useState } from 'react'
import Modal from './Modal'

const COMMON_ICONS = ['🧹', '🍽️', '🧺', '🍳', '🛒', '🗑️', '🚽', '🛋️', '🐶', '📚', '💢', '😤']

const FREQUENCIES = [
  { value: 'ilimitada', label: 'Ilimitada' },
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
]

export default function TaskFormModal({ task, onSave, onDelete, onClose }) {
  const [name, setName] = useState(task?.name ?? '')
  const [icon, setIcon] = useState(task?.icon ?? '⭐')
  const [sign, setSign] = useState(task && task.points < 0 ? 'negative' : 'positive')
  const [value, setValue] = useState(task ? Math.abs(task.points) : 10)
  const [frequency, setFrequency] = useState(task?.frequency ?? 'ilimitada')
  const [saving, setSaving] = useState(false)

  const valid = name.trim().length > 0 && Number(value) > 0

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const points = sign === 'negative' ? -Math.abs(Number(value)) : Math.abs(Number(value))
      await onSave({ name: name.trim(), icon, points, frequency })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={task ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}>
      <div className="form-field">
        <label>Nome da tarefa</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Passar a ferro" />
      </div>

      <div className="form-field">
        <label>Ícone</label>
        <div className="icon-picker">
          {COMMON_ICONS.map((i) => (
            <button
              key={i}
              className={`icon-choice${icon === i ? ' selected' : ''}`}
              onClick={() => setIcon(i)}
              type="button"
            >
              {i}
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
        <label>Valor</label>
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label>Com que frequência pode dar pontos?</label>
        <div className="frequency-grid">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`frequency-choice${frequency === f.value ? ' selected' : ''}`}
              onClick={() => setFrequency(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={save} disabled={saving || !valid}>
        {saving ? 'A guardar…' : 'Guardar tarefa'}
      </button>

      {task && onDelete && (
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 10 }}
          onClick={async () => {
            setSaving(true)
            try {
              await onDelete(task.id)
              onClose()
            } finally {
              setSaving(false)
            }
          }}
          disabled={saving}
        >
          Apagar tarefa
        </button>
      )}
    </Modal>
  )
}
