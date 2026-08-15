import { useEffect, useMemo, useState } from 'react'
import { listProfiles, listEntries, subscribe } from '../lib/db'
import { startOfWeek, startOfMonth, startOfYear } from '../lib/period'
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
  const [tab, setTab] = useState('semana')

  async function refresh() {
    const [p, e] = await Promise.all([listProfiles(), listEntries()])
    setProfiles(p)
    setEntries(e)
  }

  useEffect(() => {
    refresh()
    const unsubscribe = subscribe(refresh)
    return unsubscribe
  }, [])

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
