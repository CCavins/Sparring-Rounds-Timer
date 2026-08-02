import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIGURATION, type TimerConfiguration } from '../types/timer'
import { RoundTimerEngine } from './useRoundTimer'

function makeConfig(overrides: Partial<TimerConfiguration> = {}): TimerConfiguration {
  return { ...DEFAULT_CONFIGURATION, ...overrides }
}

describe('RoundTimerEngine', () => {
  let now = 0
  let engine: RoundTimerEngine

  beforeEach(() => {
    now = 0
    vi.useFakeTimers()
    engine = new RoundTimerEngine({
      now: () => now,
      tickIntervalMs: 100,
      warningThresholdMs: 10_000,
    })
  })

  afterEach(() => {
    engine.dispose()
    vi.useRealTimers()
  })

  function advance(ms: number): void {
    now += ms
    vi.advanceTimersByTime(ms)
  }

  it('starts preparation when enabled', () => {
    engine.start(makeConfig({ preparationDurationSeconds: 10, rounds: 3 }))
    expect(engine.state.phase).toBe('preparing')
    expect(engine.state.currentRound).toBe(1)
    expect(engine.state.totalRounds).toBe(3)
    expect(engine.state.remainingMilliseconds).toBe(10_000)
  })

  it('starts active immediately without preparation', () => {
    engine.start(makeConfig({ preparationDurationSeconds: 0, rounds: 2 }))
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(1)
    expect(engine.state.remainingMilliseconds).toBe(180_000)
  })

  it('transitions from preparation to active', () => {
    const events: string[] = []
    engine.subscribe((e) => {
      if (e.type === 'phase-change') events.push(e.phase)
    })
    engine.start(makeConfig({ preparationDurationSeconds: 3, roundDurationSeconds: 30 }))
    advance(3000)
    expect(engine.state.phase).toBe('active')
    expect(events).toContain('active')
  })

  it('transitions from active to rest', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 20,
        restDurationSeconds: 10,
        rounds: 3,
      }),
    )
    advance(20_000)
    expect(engine.state.phase).toBe('resting')
    expect(engine.state.currentRound).toBe(1)
    expect(engine.state.remainingMilliseconds).toBe(10_000)
  })

  it('transitions from rest to the next round', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 15,
        restDurationSeconds: 5,
        rounds: 3,
      }),
    )
    advance(15_000)
    expect(engine.state.phase).toBe('resting')
    advance(5_000)
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(2)
  })

  it('completes after the final round without final rest', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 10,
        restDurationSeconds: 5,
        rounds: 2,
      }),
    )
    advance(10_000) // round 1 -> rest
    advance(5_000) // rest -> round 2
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(2)
    advance(10_000)
    expect(engine.state.phase).toBe('completed')
    expect(engine.state.currentRound).toBe(2)
  })

  it('pauses and resumes with exact remaining time', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 60,
        restDurationSeconds: 30,
        rounds: 2,
      }),
    )
    advance(12_500)
    engine.pause()
    expect(engine.state.phase).toBe('paused')
    expect(engine.state.phaseBeforePause).toBe('active')
    expect(engine.state.remainingMilliseconds).toBe(47_500)

    advance(5_000) // wall time while paused should not change remaining
    expect(engine.state.remainingMilliseconds).toBe(47_500)

    engine.resume()
    expect(engine.state.phase).toBe('active')
    expect(engine.state.remainingMilliseconds).toBe(47_500)
    advance(47_500)
    expect(engine.state.phase).toBe('resting')
  })

  it('skips preparation to round 1', () => {
    engine.start(makeConfig({ preparationDurationSeconds: 15, rounds: 3 }))
    engine.skip()
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(1)
  })

  it('skips active round to rest', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 60,
        restDurationSeconds: 30,
        rounds: 3,
      }),
    )
    engine.skip()
    expect(engine.state.phase).toBe('resting')
  })

  it('skips rest to next active round', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 20,
        restDurationSeconds: 30,
        rounds: 3,
      }),
    )
    advance(20_000)
    engine.skip()
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(2)
  })

  it('skips final active round to completion', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 20,
        restDurationSeconds: 10,
        rounds: 1,
      }),
    )
    engine.skip()
    expect(engine.state.phase).toBe('completed')
  })

  it('handles zero-second rest by going directly to next round', () => {
    const phases: string[] = []
    engine.subscribe((e) => {
      if (e.type === 'phase-change') phases.push(`${e.phase}:${e.currentRound}`)
    })
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 10,
        restDurationSeconds: 0,
        rounds: 3,
      }),
    )
    advance(10_000)
    expect(engine.state.phase).toBe('active')
    expect(engine.state.currentRound).toBe(2)
    expect(phases).not.toContain(expect.stringMatching(/^resting/))
    expect(phases.some((p) => p.startsWith('resting'))).toBe(false)
  })

  it('corrects for browser time drift via absolute timestamps', () => {
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 30,
        restDurationSeconds: 10,
        rounds: 2,
      }),
    )
    // Simulate a delayed interval tick (throttle) — jump clock without many ticks
    now += 25_000
    engine.sync()
    expect(engine.state.remainingMilliseconds).toBe(5_000)
  })

  it('prevents duplicate state transitions at boundary', () => {
    let phaseChanges = 0
    engine.subscribe((e) => {
      if (e.type === 'phase-change' && e.phase === 'resting') phaseChanges += 1
    })
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 5,
        restDurationSeconds: 5,
        rounds: 2,
      }),
    )
    advance(5_000)
    engine.sync()
    engine.sync()
    expect(phaseChanges).toBe(1)
    expect(engine.state.phase).toBe('resting')
  })

  it('emits warning once near the end of an active round', () => {
    let warnings = 0
    engine.subscribe((e) => {
      if (e.type === 'warning') warnings += 1
    })
    engine.start(
      makeConfig({
        preparationDurationSeconds: 0,
        roundDurationSeconds: 30,
        restDurationSeconds: 20,
        rounds: 2,
      }),
    )
    advance(20_000)
    expect(warnings).toBe(1)
    advance(2_000)
    expect(warnings).toBe(1)
  })

  it('emits prep beeps in the final three seconds', () => {
    let beeps = 0
    engine.subscribe((e) => {
      if (e.type === 'prep-beep') beeps += 1
    })
    engine.start(makeConfig({ preparationDurationSeconds: 5, rounds: 1 }))
    advance(2_000) // 3s left
    advance(1_000) // 2s left
    advance(1_000) // 1s left
    expect(beeps).toBe(3)
  })

  it('resets to idle', () => {
    engine.start(makeConfig({ preparationDurationSeconds: 0, rounds: 2 }))
    engine.reset()
    expect(engine.state.phase).toBe('idle')
    expect(engine.state.currentRound).toBe(0)
    expect(engine.state.remainingMilliseconds).toBe(0)
  })
})
