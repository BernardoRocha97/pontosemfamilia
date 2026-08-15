import { isSupabaseConfigured } from './supabaseClient'
import * as mock from './mockDb'
import * as real from './supabaseDb'

export const usingMockData = !isSupabaseConfigured

if (usingMockData) {
  console.info(
    '[Pontos de Família] Sem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY configuradas — ' +
      'a usar dados de exemplo guardados no browser (localStorage). Configura o .env para ligar ao Supabase real.'
  )
}

const impl = usingMockData ? mock : real

export const {
  verifyPin,
  setPin,
  listProfiles,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listEntries,
  addEntry,
  deleteEntry,
  subscribe,
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  listChallengeAwards,
  recordChallengeAward,
} = impl
