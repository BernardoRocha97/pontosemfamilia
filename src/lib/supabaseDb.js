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
  return data.map((t) => ({ id: t.id, name: t.name, icon: t.icon, points: t.points, active: t.active }))
}

export async function createTask({ name, icon, points }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name, icon: icon || '⭐', points })
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
    .subscribe()
  return () => supabase.removeChannel(channel)
}
