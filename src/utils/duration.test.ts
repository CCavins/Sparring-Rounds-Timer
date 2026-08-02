import { describe, expect, it } from 'vitest'
import { clamp, formatDuration, formatSeconds, parseDurationInput, progressRatio } from './duration'

describe('duration utils', () => {
  it('formats milliseconds as MM:SS using ceil', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(1)).toBe('00:01')
    expect(formatDuration(1000)).toBe('00:01')
    expect(formatDuration(59_001)).toBe('01:00')
    expect(formatDuration(180_000)).toBe('03:00')
  })

  it('formats seconds as MM:SS', () => {
    expect(formatSeconds(0)).toBe('00:00')
    expect(formatSeconds(65)).toBe('01:05')
    expect(formatSeconds(3600)).toBe('60:00')
  })

  it('parses duration input', () => {
    expect(parseDurationInput('90')).toBe(90)
    expect(parseDurationInput('3:00')).toBe(180)
    expect(parseDurationInput('1:05')).toBe(65)
    expect(parseDurationInput('bad')).toBeNull()
    expect(parseDurationInput('')).toBeNull()
  })

  it('clamps values', () => {
    expect(clamp(5, 1, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it('computes progress ratio', () => {
    expect(progressRatio(50_000, 100_000)).toBe(0.5)
    expect(progressRatio(0, 100_000)).toBe(1)
    expect(progressRatio(100, 0)).toBe(1)
  })
})
