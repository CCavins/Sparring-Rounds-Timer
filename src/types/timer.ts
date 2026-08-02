export type TimerPhase =
  | 'idle'
  | 'preparing'
  | 'active'
  | 'resting'
  | 'paused'
  | 'completed'

export type ActivePhase = Exclude<TimerPhase, 'paused' | 'idle' | 'completed'>

export interface TimerConfiguration {
  rounds: number
  roundDurationSeconds: number
  restDurationSeconds: number
  preparationDurationSeconds: number
  soundEnabled: boolean
  warningEnabled: boolean
  vibrationEnabled: boolean
  volume: number
  presetId: string | null
}

export interface TimerSessionState {
  phase: TimerPhase
  phaseBeforePause: Exclude<TimerPhase, 'paused'> | null
  currentRound: number
  totalRounds: number
  remainingMilliseconds: number
  phaseDurationMilliseconds: number
}

export interface TimerPreset {
  id: string
  label: string
  roundDurationSeconds: number
  restDurationSeconds: number
}

export type TimerEventType =
  | 'phase-change'
  | 'warning'
  | 'tick'
  | 'prep-beep'
  | 'completed'

export interface TimerEvent {
  type: TimerEventType
  phase: TimerPhase
  currentRound: number
  totalRounds: number
  remainingMilliseconds: number
}

export const PRESETS: TimerPreset[] = [
  { id: 'boxing', label: 'Boxing', roundDurationSeconds: 180, restDurationSeconds: 60 },
  { id: 'amateur', label: 'Amateur Boxing', roundDurationSeconds: 120, restDurationSeconds: 60 },
  { id: 'mma', label: 'MMA', roundDurationSeconds: 300, restDurationSeconds: 60 },
  { id: 'muay-thai', label: 'Muay Thai', roundDurationSeconds: 180, restDurationSeconds: 60 },
  { id: 'bjj', label: 'BJJ', roundDurationSeconds: 360, restDurationSeconds: 90 },
  { id: 'custom', label: 'Custom', roundDurationSeconds: 180, restDurationSeconds: 60 },
]

export const PREPARATION_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
  { label: '15 seconds', value: 15 },
  { label: '30 seconds', value: 30 },
] as const

export const DEFAULT_CONFIGURATION: TimerConfiguration = {
  rounds: 5,
  roundDurationSeconds: 180,
  restDurationSeconds: 60,
  preparationDurationSeconds: 10,
  soundEnabled: true,
  warningEnabled: true,
  vibrationEnabled: false,
  volume: 0.85,
  presetId: 'boxing',
}

export const LIMITS = {
  rounds: { min: 1, max: 99 },
  roundDurationSeconds: { min: 10, max: 3600 },
  restDurationSeconds: { min: 0, max: 1800 },
  preparationDurationSeconds: { min: 0, max: 60 },
  volume: { min: 0, max: 1 },
} as const
