import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  listProfiles,
  listEntries,
  listChallenges,
  listChallengeAwards,
  addEntry,
  recordChallengeAward,
  subscribe,
} from '../lib/db'
import { startOfWeek, startOfMonth, startOfYear } from '../lib/period'
import { evaluateChallenges } from '../lib/challenges'
import RankingCard from '../components/RankingCard'
import ActivityFeed from '../components/ActivityFeed'
import { useSession } from '../context/SessionContext'
import './Dashboard.css'

const TABS = [
  { key: 'semana', label: 'Semana', since: startOfWeek },
  { key: 'mes', label: 'Mês', since: startOfMonth },
  { key: 'ano', label: 'Ano', since: startOfYear },
]

export default function Dashboard() {
  const { profile } = useSession()
  const [profiles, setProfiles] = useState([])
  const [entries, setEntries] = useState([])
  const [challenges, setChallenges] = useState([])
  const [awards, setAwards] = useState([])
  const [tab, setTab] = useState('semana')
  const [celebration, setCelebration] = useState(null)
  const processingRef = useRef(new Set())

  async function refresh() {
    const [p, e, c, a] = await Promise.all([
      listProfiles(),
      listEntries(),
      listChallenges(),
      listChallengeAwards(),
    ])
    setProfiles(p)
    setEntries(e)
    setChallenges(c)
    setAwards(a)
  }

  useEffect(() => {
    refresh()
    const unsubscribe = subscribe(refresh)
    return unsubscribe
  }, [])

  // Verifica se algum desafio acabou de ser cumprido e, se sim, atribui o
  // bónus automaticamente (uma única vez por sequência — ver lib/challenges.js).
  useEffect(() => {
    if (!challenges.length || !profiles.length) return
    const results = evaluateChallenges(challenges, entries, profiles)
    const pending = results.filter((r) => {
      if (!r.achieved || !r.streakKey) return false
      const already = awards.some(
        (a) => a.challengeId === r.challenge.id && a.profileId === r.profile.id && a.streakKey === r.streakKey
      )
      if (already) return false
      const lockKey = `${r.challenge.id}:${r.profile.id}:${r.streakKey}`
      return !processingRef.current.has(lockKey)
    })
    if (!pending.length) return

    pending.forEach(async (r) => {
      const lockKey = `${r.challenge.id}:${r.profile.id}:${r.streakKey}`
      processingRef.current.add(lockKey)
      try {
        const award = await recordChallengeAward({
          challengeId: r.challenge.id,
          profileId: r.profile.id,
          streakKey: r.streakKey,
        })
        if (!award) return
        await addEntry({
          taskId: null,
          profileId: r.profile.id,
          points: r.challenge.bonusPoints,
          reason: `Desafio: ${r.challenge.name}`,
          taskIcon: r.challenge.icon,
          profileName: r.profile.name,
          profileColor: r.profile.color,
        })
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.3 } })
        setCelebration(
          `${r.challenge.icon} ${r.profile.name} completou "${r.challenge.name}" — +${r.challenge.bonusPoints} pts!`
        )
        setTimeout(() => setCelebration(null), 3600)
      } finally {
        processingRef.current.delete(lockKey)
      }
    })
  }, [challenges, entries, awards, profiles])

  const standings = useMemo(() => {
    const since = TABS.find((t) => t.key === tab).since()
    const totals = new Map(profiles.map((p) => [p.id, { ...p, points: 0 }]))
    entries
      .filter((e) => e.createdAt >= since)
      .forEach((e) => {
        const row = totals.get(e.profileId)
        if (row) row.points += e.points
      })
    return [...totals.values()].sort((a, b) => b.points - a.points)
  }, [profiles, entries, tab])

  const greetingName = profile?.name ?? ''

  return (
    <div className="app-main">
      <h1 className="page-title">Olá, {greetingName} 👋</h1>
      <p className="page-subtitle">Vejam quem está a ganhar esta {tab === 'semana' ? 'semana' : tab === 'mes' ? 'mês' : 'ano'}</p>

      {celebration && <div className="celebration-banner">{celebration}</div>}

      <div className="period-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`period-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <RankingCard standings={standings} />

      <div className="card activity-card">
        <h3>Atividade recente</h3>
        <ActivityFeed entries={entries.slice(0, 12)} />
      </div>
    </div>
  )
}
