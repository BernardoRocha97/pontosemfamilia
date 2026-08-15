const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingCard({ standings }) {
  if (!standings.length) return null
  const leader = standings[0]

  return (
    <div className="card ranking-card">
      <div className="ranking-header">
        <h3>Ranking</h3>
        <span className="ranking-trophy">🏆</span>
      </div>
      <div className="ranking-list">
        {standings.map((s, i) => (
          <div key={s.id} className={`ranking-row${i === 0 && s.points > 0 ? ' leading' : ''}`}>
            <span className="ranking-medal">{MEDALS[i] ?? `${i + 1}º`}</span>
            <span className="ranking-avatar" style={{ '--profile-color': s.color }}>
              {s.name.charAt(0)}
            </span>
            <span className="ranking-name">{s.name}</span>
            <span className="ranking-points">{s.points} pts</span>
          </div>
        ))}
      </div>
      {standings.length > 1 && standings[0].points !== standings[1].points && leader.points > 0 && (
        <p className="ranking-lead-note">
          {leader.name} está a ganhar por {leader.points - standings[1].points} pts
        </p>
      )}
    </div>
  )
}
