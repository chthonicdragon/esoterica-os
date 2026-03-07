/**
 * Bridge module for auto-logging altar ritual sessions into the Ritual Tracker.
 * Called after a ritual completes in RitualPanel so the session appears in the
 * RitualTracker history alongside manually logged rituals.
 */
import { db } from '../lib/platformClient'
import { getMoonPhase, moonEmoji } from '../utils/moonPhase'

const RITUAL_META_STORAGE_KEY = 'esoterica_ritual_meta_v2'

interface RitualLogParams {
  userId: string
  durationMinutes: number
  mode: 'soft' | 'strict'
  pointsEarned: number
  lang: 'en' | 'ru'
}

function writeRitualMeta(id: string, meta: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(RITUAL_META_STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : {}
    current[id] = { ...(current[id] || {}), ...meta }
    localStorage.setItem(RITUAL_META_STORAGE_KEY, JSON.stringify(current))
  } catch { /* ignore */ }
}

/**
 * Create an entry in the rituals table + localStorage meta for an altar session.
 * Fire-and-forget — errors are swallowed so UI is never blocked.
 */
export async function logAltarRitualSession(params: RitualLogParams): Promise<void> {
  const { userId, durationMinutes, mode, pointsEarned, lang } = params
  const moonPhase = getMoonPhase()

  const title = lang === 'ru'
    ? `Алтарная сессия ${durationMinutes}мин (${mode})`
    : `Altar session ${durationMinutes}min (${mode})`

  const description = lang === 'ru'
    ? `Завершённый ${mode === 'strict' ? 'строгий' : 'мягкий'} ритуал на ${durationMinutes} минут. Получено ${pointsEarned} XP.`
    : `Completed ${durationMinutes}min ${mode} ritual. Earned ${pointsEarned} XP.`

  try {
    const ritual = await db.rituals.create({
      userId,
      title,
      type: 'meditation',
      intention: description,
      moonPhase,
      energyLevel: mode === 'strict' ? 8 : 6,
      outcome: null,
      notes: null,
      createdAt: new Date().toISOString(),
    }) as { id: string }

    writeRitualMeta(ritual.id, {
      description,
      moon_phase: moonPhase,
      result_rating: mode === 'strict' ? 4 : 3,
      emotional_state: '',
      sensations_during: '',
      outcome_later: '',
    })
  } catch (e) {
    console.warn('[ritualBridge] failed to log altar session:', e)
  }
}
