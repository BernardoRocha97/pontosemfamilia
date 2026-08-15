import { startOfDay, startOfWeek } from './period'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

function bucketStart(date, unit) {
  return unit === 'semana' ? startOfWeek(date) : startOfDay(date)
}

function bucketStep(unit) {
  return unit === 'semana' ? WEEK_MS : DAY_MS
}

// Sequência de dias/semanas seguidos (terminando agora) em que o perfil tem
// pelo menos uma entrada para essa tarefa. streakStart identifica o início
// dessa sequência, para não premiar a mesma sequência duas vezes.
export function computeTaskStreak(entries, taskId, unit) {
  const buckets = new Set(
    entries.filter((e) => e.taskId === taskId).map((e) => bucketStart(new Date(e.createdAt), unit))
  )
  const step = bucketStep(unit)
  let cursor = bucketStart(new Date(), unit)
  let length = 0
  let streakStart = null
  while (buckets.has(cursor)) {
    length += 1
    streakStart = cursor
    cursor -= step
  }
  return { length, streakStart }
}

export function evaluateChallenges(challenges, entries, profiles) {
  const results = []
  for (const challenge of challenges) {
    for (const profile of profiles) {
      const profileEntries = entries.filter((e) => e.profileId === profile.id)
      const { length, streakStart } = computeTaskStreak(profileEntries, challenge.taskId, challenge.unit)
      results.push({
        challenge,
        profile,
        progress: Math.min(length, challenge.target),
        achieved: length >= challenge.target,
        streakKey: streakStart === null ? null : String(streakStart),
      })
    }
  }
  return results
}
