import { formatRelativeTime } from '../lib/period'

export default function ActivityFeed({ entries, emptyLabel = 'Ainda sem atividade.' }) {
  if (!entries.length) {
    return <p className="activity-empty">{emptyLabel}</p>
  }

  return (
    <div className="activity-list">
      {entries.map((e) => (
        <div key={e.id} className="activity-row">
          <span className="activity-icon">{e.taskIcon}</span>
          <div className="activity-info">
            <span className="activity-title">{e.taskName || e.reason || 'Pontos bónus'}</span>
            <span className="activity-meta">
              {e.profileName} · {formatRelativeTime(e.createdAt)}
            </span>
          </div>
          <span className={`activity-points ${e.points >= 0 ? 'positive' : 'negative'}`}>
            {e.points >= 0 ? '+' : ''}
            {e.points}
          </span>
        </div>
      ))}
    </div>
  )
}
