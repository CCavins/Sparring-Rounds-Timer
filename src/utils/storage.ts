import { DEFAULT_SOUND_PACK_ID, isSoundPackId } from '../types/sounds'
import {
  DEFAULT_CONFIGURATION,
  LIMITS,
  PRESETS,
  type TimerConfiguration,
} from '../types/timer'
import { clamp } from './duration'

export const STORAGE_KEY = 'spar-timer-settings-v1'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function validateConfiguration(raw: unknown): TimerConfiguration | null {
  if (!raw || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>

  if (
    !isFiniteNumber(data.rounds) ||
    !isFiniteNumber(data.roundDurationSeconds) ||
    !isFiniteNumber(data.restDurationSeconds) ||
    !isFiniteNumber(data.preparationDurationSeconds) ||
    !isBoolean(data.soundEnabled) ||
    !isBoolean(data.warningEnabled) ||
    !isBoolean(data.vibrationEnabled) ||
    !isFiniteNumber(data.volume)
  ) {
    return null
  }

  const presetId =
    data.presetId === null
      ? null
      : typeof data.presetId === 'string' &&
          (PRESETS.some((p) => p.id === data.presetId) || data.presetId.startsWith('saved:'))
        ? data.presetId
        : 'custom'

  const soundPackId = isSoundPackId(data.soundPackId)
    ? data.soundPackId
    : DEFAULT_SOUND_PACK_ID

  return {
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
    soundEnabled: data.soundEnabled,
    warningEnabled: data.warningEnabled,
    vibrationEnabled: data.vibrationEnabled,
    volume: clamp(data.volume, LIMITS.volume.min, LIMITS.volume.max),
    presetId,
    soundPackId,
  }
}

export function loadConfiguration(): TimerConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIGURATION }
    const parsed: unknown = JSON.parse(raw)
    return validateConfiguration(parsed) ?? { ...DEFAULT_CONFIGURATION }
  } catch {
    return { ...DEFAULT_CONFIGURATION }
  }
}

export function saveConfiguration(config: TimerConfiguration): void {
  const validated = validateConfiguration(config)
  if (!validated) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
  } catch {
    // Ignore quota / private mode errors
  }
}
