import { supabase } from './supabaseClient'

export async function verifyPin(profileId, pin) {
  const { data, error } = await supabase.rpc('verify_pin', { profile_id: profileId, pin })
  if (error) throw error
  return data && data.length ? data[0] : null
}

export async function setPin(profileId, newPin) {
  const { error } = await supabase.rpc('set_pin', { profile_id: profileId, new_pin: newPin })
  if (error) throw error
}

export async function listProfiles() {
  const { data, error } = await supabase.from('public_profiles').select('*').order('name')
  if (error) throw error
  return data
}

export async function listTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    points: t.points,
    frequency: t.frequency,
    active: t.active,
  }))
}

export async function createTask({ name, icon, points, frequency }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name, icon: icon || '⭐', points, frequency: frequency || 'ilimitada' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

function hydrateEntry(row, tasksById, profilesById) {
  const task = tasksById.get(row.task_id) || null
  const profile = profilesById.get(row.profile_id) || null
  return {
    id: row.id,
    taskId: row.task_id,
    points: row.points,
    reason: row.reason,
    createdAt: new Date(row.created_at).getTime(),
    taskName: task ? task.name : null,
    taskIcon: task ? task.icon : '🎁',
    profileId: row.profile_id,
    profileName: profile ? profile.name : '—',
    profileColor: profile ? profile.color : '#999',
  }
}

export async function listEntries({ since } = {}) {
  let query = supabase.from('entries').select('*').order('created_at', { ascending: false })
  if (since) query = query.gte('created_at', new Date(since).toISOString())
  const [{ data: entries, error: entriesError }, tasks, profiles] = await Promise.all([
    query,
    listTasks(),
    listProfiles(),
  ])
  if (entriesError) throw entriesError
  const tasksById = new Map(tasks.map((t) => [t.id, t]))
  const profilesById = new Map(profiles.map((p) => [p.id, p]))
  return entries.map((row) => hydrateEntry(row, tasksById, profilesById))
}

export async function addEntry({ taskId, profileId, points, reason, taskName, taskIcon, profileName, profileColor }) {
  const { data, error } = await supabase
    .from('entries')
    .insert({ task_id: taskId || null, profile_id: profileId, points, reason: reason || null })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    taskId: data.task_id,
    points: data.points,
    reason: data.reason,
    createdAt: new Date(data.created_at).getTime(),
    taskName: taskName ?? null,
    taskIcon: taskIcon ?? '🎁',
    profileId,
    profileName,
    profileColor,
  }
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}

export function subscribe(callback) {
  const channel = supabase
    .channel('pontos-de-familia-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function listChallenges() {
  const { data, error } = await supabase.from('challenges').select('*').eq('active', true).order('name')
  if (error) throw error
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    taskId: c.task_id,
    unit: c.unit,
    target: c.target,
    bonusPoints: c.bonus_points,
    active: c.active,
  }))
}

export async function createChallenge({ name, icon, taskId, unit, target, bonusPoints }) {
  const { data, error } = await supabase
    .from('challenges')
    .insert({ name, icon: icon || '🏅', task_id: taskId, unit, target, bonus_points: bonusPoints })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateChallenge(id, patch) {
  const dbPatch = {}
  if (patch.name !== undefined) dbPatch.name = patch.name
  if (patch.icon !== undefined) dbPatch.icon = patch.icon
  if (patch.taskId !== undefined) dbPatch.task_id = patch.taskId
  if (patch.unit !== undefined) dbPatch.unit = patch.unit
  if (patch.target !== undefined) dbPatch.target = patch.target
  if (patch.bonusPoints !== undefined) dbPatch.bonus_points = patch.bonusPoints
  const { data, error } = await supabase.from('challenges').update(dbPatch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteChallenge(id) {
  const { error } = await supabase.from('challenges').delete().eq('id', id)
  if (error) throw error
}

export async function listChallengeAwards() {
  const { data, error } = await supabase.from('challenge_awards').select('*')
  if (error) throw error
  return data.map((a) => ({
    id: a.id,
    challengeId: a.challenge_id,
    profileId: a.profile_id,
    streakKey: a.streak_key,
  }))
}

// Devolve null se já havia um prémio registado para esta sequência (outro
// dispositivo chegou primeiro) — só regista o bónus se este insert vencer.
export async function recordChallengeAward({ challengeId, profileId, streakKey }) {
  const { data, error } = await supabase
    .from('challenge_awards')
    .insert({ challenge_id: challengeId, profile_id: profileId, streak_key: streakKey })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return null
    throw error
  }
  return data
}
