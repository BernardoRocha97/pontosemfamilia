// Base de dados falsa em localStorage, usada apenas enquanto não há um projeto
// Supabase real ligado (ver isSupabaseConfigured em supabaseClient.js). Implementa
// a mesma forma de API que db.js espera, para trocar de backend sem tocar nas páginas.

const STORAGE_KEY = 'pontos-de-familia-mock-db'
const bus = new EventTarget()

function seed() {
  const now = Date.now()
  return {
    profiles: [
      { id: 'p-bernardo', name: 'Bernardo', pin: '0000', color: '#3b82f6' },
      { id: 'p-beatriz', name: 'Beatriz', pin: '0000', color: '#ec4899' },
    ],
    tasks: [
      { id: 't1', name: 'Lavar a loiça', icon: '🍽️', points: 15, active: true },
      { id: 't2', name: 'Aspirar a casa', icon: '🧹', points: 20, active: true },
      { id: 't3', name: 'Tirar o lixo', icon: '🗑️', points: 10, active: true },
      { id: 't4', name: 'Cozinhar o jantar', icon: '🍳', points: 20, active: true },
      { id: 't5', name: 'Tratar da roupa', icon: '🧺', points: 15, active: true },
      { id: 't6', name: 'Limpar a casa de banho', icon: '🚽', points: 20, active: true },
      { id: 't7', name: 'Fazer as compras', icon: '🛒', points: 15, active: true },
      { id: 't8', name: 'Arrumar a sala', icon: '🛋️', points: 10, active: true },
      { id: 't9', name: 'Deixou loiça suja', icon: '💢', points: -15, active: true },
      { id: 't10', name: 'Esqueceu uma tarefa combinada', icon: '😤', points: -10, active: true },
    ],
    entries: [
      { id: 'e1', taskId: 't1', profileId: 'p-beatriz', points: 15, reason: null, createdAt: now - 1000 * 60 * 60 * 3 },
      { id: 'e2', taskId: 't3', profileId: 'p-bernardo', points: 10, reason: null, createdAt: now - 1000 * 60 * 60 * 20 },
      { id: 'e3', taskId: null, profileId: 'p-beatriz', points: 25, reason: 'Surpresa com o pequeno-almoço', createdAt: now - 1000 * 60 * 60 * 44 },
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignora e reconstrói
  }
  const initial = seed()
  save(initial)
  return initial
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function notify() {
  bus.dispatchEvent(new Event('change'))
}

function uid() {
  return crypto.randomUUID()
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 120))

export async function verifyPin(profileId, pin) {
  await delay()
  const db = load()
  const profile = db.profiles.find((p) => p.id === profileId && p.pin === pin)
  return profile ? { id: profile.id, name: profile.name, color: profile.color } : null
}

export async function setPin(profileId, newPin) {
  await delay()
  const db = load()
  const profile = db.profiles.find((p) => p.id === profileId)
  if (profile) {
    profile.pin = newPin
    save(db)
    notify()
  }
}

export async function listProfiles() {
  await delay()
  const db = load()
  return db.profiles.map(({ id, name, color }) => ({ id, name, color }))
}

export async function listTasks() {
  await delay()
  const db = load()
  return db.tasks.filter((t) => t.active).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createTask({ name, icon, points }) {
  await delay()
  const db = load()
  const task = { id: uid(), name, icon: icon || '⭐', points, active: true }
  db.tasks.push(task)
  save(db)
  notify()
  return task
}

export async function updateTask(id, patch) {
  await delay()
  const db = load()
  const task = db.tasks.find((t) => t.id === id)
  if (task) {
    Object.assign(task, patch)
    save(db)
    notify()
  }
  return task
}

export async function deleteTask(id) {
  await delay()
  const db = load()
  db.tasks = db.tasks.filter((t) => t.id !== id)
  save(db)
  notify()
}

function hydrateEntry(entry, db) {
  const task = db.tasks.find((t) => t.id === entry.taskId) || null
  const profile = db.profiles.find((p) => p.id === entry.profileId) || null
  return {
    id: entry.id,
    points: entry.points,
    reason: entry.reason,
    createdAt: entry.createdAt,
    taskName: task ? task.name : null,
    taskIcon: task ? task.icon : '🎁',
    profileId: entry.profileId,
    profileName: profile ? profile.name : '—',
    profileColor: profile ? profile.color : '#999',
  }
}

export async function listEntries({ since } = {}) {
  await delay()
  const db = load()
  let entries = [...db.entries]
  if (since) entries = entries.filter((e) => e.createdAt >= since)
  return entries
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((e) => hydrateEntry(e, db))
}

export async function addEntry({ taskId, profileId, points, reason }) {
  await delay()
  const db = load()
  const entry = { id: uid(), taskId: taskId || null, profileId, points, reason: reason || null, createdAt: Date.now() }
  db.entries.push(entry)
  save(db)
  notify()
  return hydrateEntry(entry, db)
}

export async function deleteEntry(id) {
  await delay()
  const db = load()
  db.entries = db.entries.filter((e) => e.id !== id)
  save(db)
  notify()
}

export function subscribe(callback) {
  bus.addEventListener('change', callback)
  window.addEventListener('storage', callback)
  return () => {
    bus.removeEventListener('change', callback)
    window.removeEventListener('storage', callback)
  }
}
