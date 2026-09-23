import { LIMITS } from './timer'
import { clamp } from '../utils/duration'

export interface SavedCustomPreset {
  id: string
  name: string
  rounds: number
  roundDurationSeconds: number
  restDurationSeconds: number
  preparationDurationSeconds: number
  createdAt: number
}

export const CUSTOM_PRESETS_KEY = 'spar-timer-custom-presets-v1'
export const MAX_CUSTOM_PRESETS = 20
export const MAX_PRESET_NAME_LENGTH = 40

export function validateSavedPreset(raw: unknown): SavedCustomPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>

  if (
    typeof data.id !== 'string' ||
    !data.id ||
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    typeof data.rounds !== 'number' ||
    !Number.isFinite(data.rounds) ||
    typeof data.roundDurationSeconds !== 'number' ||
    !Number.isFinite(data.roundDurationSeconds) ||
    typeof data.restDurationSeconds !== 'number' ||
    !Number.isFinite(data.restDurationSeconds) ||
    typeof data.preparationDurationSeconds !== 'number' ||
    !Number.isFinite(data.preparationDurationSeconds) ||
    typeof data.createdAt !== 'number' ||
    !Number.isFinite(data.createdAt)
  ) {
    return null
  }

  return {
    id: data.id,
    name: data.name.trim().slice(0, MAX_PRESET_NAME_LENGTH),
    rounds: Math.round(clamp(data.rounds, LIMITS.rounds.min, LIMITS.rounds.max)),
    roundDurationSeconds: Math.round(
      clamp(
        data.roundDurationSeconds,
        LIMITS.roundDurationSeconds.min,
        LIMITS.roundDurationSeconds.max,
      ),
    ),
    restDurationSeconds: Math.round(
      clamp(
        data.restDurationSeconds,
        LIMITS.restDurationSeconds.min,
        LIMITS.restDurationSeconds.max,
      ),
    ),
    preparationDurationSeconds: Math.round(
      clamp(
        data.preparationDurationSeconds,
        LIMITS.preparationDurationSeconds.min,
        LIMITS.preparationDurationSeconds.max,
      ),
    ),
    createdAt: data.createdAt,
  }
}

export function loadCustomPresets(): SavedCustomPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => validateSavedPreset(item))
      .filter((item): item is SavedCustomPreset => item !== null)
      .slice(0, MAX_CUSTOM_PRESETS)
  } catch {
    return []
  }
}

export function saveCustomPresets(presets: SavedCustomPreset[]): void {
  const cleaned = presets
    .map((item) => validateSavedPreset(item))
    .filter((item): item is SavedCustomPreset => item !== null)
    .slice(0, MAX_CUSTOM_PRESETS)
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(cleaned))
  } catch {
    // ignore
  }
}

export function createPresetId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
