import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { listProfiles, listEntries } from '../lib/db'
import { startOfWeek, startOfDay } from '../lib/period'
import './WeeklySummary.css'

function computeStreak(entries) {
  const daysWithActivity = new Set(
    entries.filter((e) => e.points > 0).map((e) => startOfDay(new Date(e.createdAt)))
  )
  let streak = 0
  let cursor = startOfDay()
  while (daysWithActivity.has(cursor)) {
    streak += 1
    cursor -= 24 * 60 * 60 * 1000
  }
  return streak
}

export default function WeeklySummary() {
  const [profiles, setProfiles] = useState([])
  const [entries, setEntries] = useState([])
  const [celebrated, setCelebrated] = useState(false)

  useEffect(() => {
    Promise.all([listProfiles(), listEntries()]).then(([p, e]) => {
      setProfiles(p)
      setEntries(e)
    })
  }, [])

  const standings = useMemo(() => {
    const since = startOfWeek()
    const totals = new Map(profiles.map((p) => [p.id, { ...p, points: 0 }]))
    entries
      .filter((e) => e.createdAt >= since)
      .forEach((e) => {
        const row = totals.get(e.profileId)
        if (row) row.points += e.points
      })
    return [...totals.values()].sort((a, b) => b.points - a.points)
  }, [profiles, entries])

  const streak = useMemo(() => computeStreak(entries), [entries])
  const champion = standings[0]
  const runnerUp = standings[1]
  const isTie = champion && runnerUp && champion.points === runnerUp.points

  useEffect(() => {
    if (!celebrated && champion && champion.points > 0 && !isTie) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } })
      setCelebrated(true)
    }
  }, [champion, isTie, celebrated])

  const weekLabel = new Date(startOfWeek()).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
  })

  return (
    <div className="app-main">
      <h1 className="page-title">Resumo da semana</h1>
      <p className="page-subtitle">Semana de {weekLabel}</p>

      {streak > 0 && (
        <div className="streak-badge">
          🔥 Sequência de {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
        </div>
      )}

      {champion && champion.points > 0 && !isTie ? (
        <div className="champion-card">
          <span className="champion-crown">👑</span>
          <span className="champion-avatar" style={{ '--profile-color': champion.color }}>
            {champion.name.charAt(0)}
          </span>
          <span className="champion-label">Campeã(o) da semana</span>
          <span className="champion-name">{champion.name}</span>
          <span className="champion-points">{champion.points} pts</span>
        </div>
      ) : (
        <div className="card champion-card-empty">
          <p>{isTie ? 'Empate esta semana — os dois estão a ganhar! 🤝' : 'Ainda sem pontos esta semana. Vão a jogo!'}</p>
        </div>
      )}

      <div className="standings-row">
        {standings.slice(champion && champion.points > 0 && !isTie ? 1 : 0).map((s) => (
          <div key={s.id} className="card standing-mini">
            <span className="profile-avatar" style={{ '--profile-color': s.color }}>
              {s.name.charAt(0)}
            </span>
            <span className="standing-name">{s.name}</span>
            <span className="standing-points">{s.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}
