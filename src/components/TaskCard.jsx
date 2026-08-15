import { FREQUENCY_LABELS } from '../lib/period'

export default function TaskCard({ task, done, onClick, onLongPress }) {
  const positive = task.points >= 0
  const freqLabel = FREQUENCY_LABELS[task.frequency]

  return (
    <button
      className={`task-card ${positive ? 'task-positive' : 'task-negative'}${done ? ' task-done' : ''}`}
      onClick={() => onClick(task)}
      onContextMenu={(e) => {
        if (!onLongPress) return
        e.preventDefault()
        onLongPress(task)
      }}
    >
      <span className="task-icon-badge">{done ? '✅' : task.icon}</span>
      <span className="task-name">{task.name}</span>
      <span className="task-points">
        {positive ? '+' : ''}
        {task.points} pts
      </span>
      {freqLabel && <span className="task-frequency">{done ? `Feito · ${freqLabel}` : freqLabel}</span>}
    </button>
  )
}
