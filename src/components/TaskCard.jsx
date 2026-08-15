export default function TaskCard({ task, onClick, onLongPress }) {
  const positive = task.points >= 0

  return (
    <button
      className={`task-card ${positive ? 'task-positive' : 'task-negative'}`}
      onClick={() => onClick(task)}
      onContextMenu={(e) => {
        if (!onLongPress) return
        e.preventDefault()
        onLongPress(task)
      }}
    >
      <span className="task-icon-badge">{task.icon}</span>
      <span className="task-name">{task.name}</span>
      <span className="task-points">
        {positive ? '+' : ''}
        {task.points} pts
      </span>
    </button>
  )
}
