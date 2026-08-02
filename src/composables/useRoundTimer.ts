import { computed, onUnmounted, reactive, readonly, ref } from 'vue'
import type {
  TimerConfiguration,
  TimerEvent,
  TimerPhase,
  TimerSessionState,
} from '../types/timer'

export type Clock = () => number

export type TimerEventListener = (event: TimerEvent) => void

export interface RoundTimerEngineOptions {
  now?: Clock
  tickIntervalMs?: number
  warningThresholdMs?: number
}

/**
 * Drift-resistant round timer state machine.
 * Remaining time is derived from absolute target timestamps.
 */
export class RoundTimerEngine {
  private readonly now: Clock
  private readonly tickIntervalMs: number
  private readonly warningThresholdMs: number
  private listeners = new Set<TimerEventListener>()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private targetEndMs = 0
  private pausedRemainingMs = 0
  private warningFired = false
  private prepBeepSeconds = new Set<number>()
  private config: TimerConfiguration | null = null
  private transitioning = false

  readonly state: TimerSessionState = reactive({
    phase: 'idle',
    phaseBeforePause: null,
    currentRound: 0,
    totalRounds: 0,
    remainingMilliseconds: 0,
    phaseDurationMilliseconds: 0,
  })

  constructor(options: RoundTimerEngineOptions = {}) {
    this.now = options.now ?? (() => performance.now())
    this.tickIntervalMs = options.tickIntervalMs ?? 100
    this.warningThresholdMs = options.warningThresholdMs ?? 10_000
  }

  subscribe(listener: TimerEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start(config: TimerConfiguration): void {
    this.stopTimers()
    this.config = { ...config }
    this.state.totalRounds = config.rounds
    this.state.currentRound = 1
    this.state.phaseBeforePause = null
    this.warningFired = false
    this.prepBeepSeconds = new Set()
    this.transitioning = false

    if (config.preparationDurationSeconds > 0) {
      this.enterPhase('preparing', config.preparationDurationSeconds * 1000)
    } else {
      this.enterPhase('active', config.roundDurationSeconds * 1000)
    }
  }

  pause(): void {
    if (!this.isRunningPhase(this.state.phase)) return
    this.pausedRemainingMs = Math.max(0, this.targetEndMs - this.now())
    this.stopTimers()
    this.state.phaseBeforePause = this.state.phase
    this.state.phase = 'paused'
    this.state.remainingMilliseconds = this.pausedRemainingMs
    this.emit('phase-change')
  }

  resume(): void {
    if (this.state.phase !== 'paused' || !this.state.phaseBeforePause) return
    const next = this.state.phaseBeforePause
    this.state.phase = next
    this.state.phaseBeforePause = null
    this.targetEndMs = this.now() + this.pausedRemainingMs
    this.state.remainingMilliseconds = this.pausedRemainingMs
    this.warningFired =
      this.pausedRemainingMs <= this.warningThresholdMs &&
      (next === 'active' || next === 'resting')
    this.startTimers()
    this.emit('phase-change')
  }

  skip(): void {
    if (this.state.phase === 'paused') {
      // Skip the paused phase by restoring it then advancing
      if (this.state.phaseBeforePause) {
        this.state.phase = this.state.phaseBeforePause
        this.state.phaseBeforePause = null
      }
    }

    if (this.state.phase === 'idle' || this.state.phase === 'completed') return

    this.advancePhase()
  }

  reset(): void {
    this.stopTimers()
    this.config = null
    this.targetEndMs = 0
    this.pausedRemainingMs = 0
    this.warningFired = false
    this.prepBeepSeconds = new Set()
    this.transitioning = false
    this.state.phase = 'idle'
    this.state.phaseBeforePause = null
    this.state.currentRound = 0
    this.state.totalRounds = 0
    this.state.remainingMilliseconds = 0
    this.state.phaseDurationMilliseconds = 0
  }

  /** Recalculate immediately (e.g. after visibilitychange). */
  sync(): void {
    if (!this.isRunningPhase(this.state.phase)) return
    this.tick()
  }

  dispose(): void {
    this.stopTimers()
    this.listeners.clear()
  }

  private isRunningPhase(phase: TimerPhase): phase is 'preparing' | 'active' | 'resting' {
    return phase === 'preparing' || phase === 'active' || phase === 'resting'
  }

  private enterPhase(phase: 'preparing' | 'active' | 'resting', durationMs: number): void {
    this.warningFired = false
    this.prepBeepSeconds = new Set()
    this.state.phase = phase
    this.state.phaseDurationMilliseconds = durationMs
    this.state.remainingMilliseconds = durationMs
    this.targetEndMs = this.now() + durationMs
    this.startTimers()
    this.emit('phase-change')

    // Zero-duration rest: advance immediately
    if (durationMs <= 0) {
      this.advancePhase()
    }
  }

  private advancePhase(): void {
    if (this.transitioning) return
    this.transitioning = true

    try {
      const config = this.config
      if (!config) return

      const phase = this.state.phase

      if (phase === 'preparing') {
        this.enterPhase('active', config.roundDurationSeconds * 1000)
        return
      }

      if (phase === 'active') {
        if (this.state.currentRound >= this.state.totalRounds) {
          this.complete()
          return
        }
        if (config.restDurationSeconds <= 0) {
          this.state.currentRound += 1
          this.enterPhase('active', config.roundDurationSeconds * 1000)
          return
        }
        this.enterPhase('resting', config.restDurationSeconds * 1000)
        return
      }

      if (phase === 'resting') {
        this.state.currentRound += 1
        this.enterPhase('active', config.roundDurationSeconds * 1000)
      }
    } finally {
      this.transitioning = false
    }
  }

  private complete(): void {
    this.stopTimers()
    this.state.phase = 'completed'
    this.state.remainingMilliseconds = 0
    this.state.phaseDurationMilliseconds = 0
    this.emit('completed')
    this.emit('phase-change')
  }

  private tick(): void {
    if (!this.isRunningPhase(this.state.phase)) return

    const remaining = Math.max(0, this.targetEndMs - this.now())
    this.state.remainingMilliseconds = remaining

    if (this.state.phase === 'preparing') {
      const secondsLeft = Math.ceil(remaining / 1000)
      if (secondsLeft >= 1 && secondsLeft <= 3 && !this.prepBeepSeconds.has(secondsLeft)) {
        this.prepBeepSeconds.add(secondsLeft)
        this.emit('prep-beep')
      }
    }

    if (
      (this.state.phase === 'active' || this.state.phase === 'resting') &&
      !this.warningFired &&
      remaining > 0 &&
      remaining <= this.warningThresholdMs &&
      this.state.phaseDurationMilliseconds > this.warningThresholdMs
    ) {
      this.warningFired = true
      this.emit('warning')
    }

    this.emit('tick')

    if (remaining <= 0) {
      this.advancePhase()
    }
  }

  private startTimers(): void {
    this.stopTimers()
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs)
  }

  private stopTimers(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private emit(type: TimerEvent['type']): void {
    const event: TimerEvent = {
      type,
      phase: this.state.phase,
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      remainingMilliseconds: this.state.remainingMilliseconds,
    }
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export function useRoundTimer(options: RoundTimerEngineOptions = {}) {
  const engine = new RoundTimerEngine(options)
  const announcement = ref('')

  const phase = computed(() => engine.state.phase)
  const currentRound = computed(() => engine.state.currentRound)
  const totalRounds = computed(() => engine.state.totalRounds)
  const remainingMilliseconds = computed(() => engine.state.remainingMilliseconds)
  const phaseDurationMilliseconds = computed(() => engine.state.phaseDurationMilliseconds)
  const phaseBeforePause = computed(() => engine.state.phaseBeforePause)

  const isRunning = computed(
    () =>
      engine.state.phase === 'preparing' ||
      engine.state.phase === 'active' ||
      engine.state.phase === 'resting' ||
      engine.state.phase === 'paused',
  )

  const displayPhase = computed(() => {
    if (engine.state.phase === 'paused') {
      return engine.state.phaseBeforePause ?? 'paused'
    }
    return engine.state.phase
  })

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      engine.sync()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    engine.dispose()
  })

  return {
    state: readonly(engine.state),
    phase,
    displayPhase,
    currentRound,
    totalRounds,
    remainingMilliseconds,
    phaseDurationMilliseconds,
    phaseBeforePause,
    isRunning,
    announcement,
    start: (config: TimerConfiguration) => engine.start(config),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    skip: () => engine.skip(),
    reset: () => engine.reset(),
    sync: () => engine.sync(),
    subscribe: (listener: TimerEventListener) => engine.subscribe(listener),
    engine,
  }
}
