import { beforeEach, describe, expect, it } from 'vitest'
import {
  CUSTOM_PRESETS_KEY,
  loadCustomPresets,
  saveCustomPresets,
  validateSavedPreset,
} from './presets'

describe('custom presets storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('validates and restores saved custom presets', () => {
    const preset = {
      id: 'abc',
      name: 'Morning pads',
      rounds: 6,
      roundDurationSeconds: 150,
      restDurationSeconds: 45,
      preparationDurationSeconds: 10,
      createdAt: 100,
    }
    expect(validateSavedPreset(preset)).toEqual(preset)
    saveCustomPresets([preset])
    expect(loadCustomPresets()).toEqual([preset])
  })

  it('rejects invalid custom presets', () => {
    expect(validateSavedPreset(null)).toBeNull()
    expect(validateSavedPreset({ id: 'x', name: '' })).toBeNull()
    localStorage.setItem(CUSTOM_PRESETS_KEY, '[{bad')
    expect(loadCustomPresets()).toEqual([])
  })
})
