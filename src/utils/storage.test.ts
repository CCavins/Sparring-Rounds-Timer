import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CONFIGURATION } from '../types/timer'
import { loadConfiguration, saveConfiguration, STORAGE_KEY, validateConfiguration } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores valid saved settings', () => {
    const valid = {
      ...DEFAULT_CONFIGURATION,
      rounds: 8,
      roundDurationSeconds: 120,
      restDurationSeconds: 45,
      preparationDurationSeconds: 15,
      volume: 0.5,
      presetId: 'amateur',
    }
    expect(validateConfiguration(valid)).toEqual(valid)
    saveConfiguration(valid)
    expect(loadConfiguration()).toEqual(valid)
  })

  it('rejects invalid saved settings', () => {
    expect(validateConfiguration(null)).toBeNull()
    expect(validateConfiguration({})).toBeNull()
    expect(validateConfiguration({ ...DEFAULT_CONFIGURATION, rounds: 'five' })).toBeNull()
    expect(validateConfiguration({ ...DEFAULT_CONFIGURATION, soundEnabled: 'yes' })).toBeNull()
  })

  it('clamps out-of-range values when validating', () => {
    const result = validateConfiguration({
      ...DEFAULT_CONFIGURATION,
      rounds: 500,
      roundDurationSeconds: 5,
      restDurationSeconds: -10,
      preparationDurationSeconds: 999,
      volume: 4,
    })
    expect(result).toMatchObject({
      rounds: 99,
      roundDurationSeconds: 10,
      restDurationSeconds: 0,
      preparationDurationSeconds: 60,
      volume: 1,
    })
  })

  it('returns defaults when storage is empty or corrupt', () => {
    expect(loadConfiguration()).toEqual(DEFAULT_CONFIGURATION)
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(loadConfiguration()).toEqual(DEFAULT_CONFIGURATION)
  })
})
