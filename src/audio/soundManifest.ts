import type { SoundId } from '../composables/soundIds'

/** Versioned sample root — bump when replacing audio assets. */
export const SOUND_ASSET_VERSION = 'v2'
export const SOUND_BASE_PATH = `sounds/${SOUND_ASSET_VERSION}`

type CueMap = Record<SoundId, string>

/**
 * Maps each sound pack to BigSoundBank-derived sample files.
 * Paths are relative to SOUND_BASE_PATH.
 */
export const PACK_CUES: Record<string, CueMap> = {
  'gym-buzzer': {
    'prep-beep': 'warning-beep.mp3',
    warning: 'warning-beep.mp3',
    'round-start': 'buzzer.mp3',
    'round-end': 'buzzer.mp3',
    complete: 'buzzer.mp3',
  },
  'boxing-bell': {
    'prep-beep': 'digital-beep.mp3',
    warning: 'boxing-bell-short.mp3',
    'round-start': 'boxing-bell-short.mp3',
    'round-end': 'boxing-bell-long.mp3',
    complete: 'boxing-bell-long.mp3',
  },
  'air-horn': {
    'prep-beep': 'warning-beep.mp3',
    warning: 'warning-beep.mp3',
    'round-start': 'air-horn.mp3',
    'round-end': 'air-horn.mp3',
    complete: 'air-horn.mp3',
  },
  whistle: {
    'prep-beep': 'digital-beep.mp3',
    warning: 'whistle.mp3',
    'round-start': 'whistle.mp3',
    'round-end': 'whistle.mp3',
    complete: 'whistle.mp3',
  },
  'digital-beep': {
    'prep-beep': 'digital-beep.mp3',
    warning: 'digital-beep.mp3',
    'round-start': 'digital-beep.mp3',
    'round-end': 'digital-end.mp3',
    complete: 'digital-end.mp3',
  },
  duck: {
    'prep-beep': 'digital-beep.mp3',
    warning: 'duck.mp3',
    'round-start': 'duck.mp3',
    'round-end': 'duck.mp3',
    complete: 'duck.mp3',
  },
  cat: {
    'prep-beep': 'digital-beep.mp3',
    warning: 'cat.mp3',
    'round-start': 'cat.mp3',
    'round-end': 'cat.mp3',
    complete: 'cat.mp3',
  },
  dog: {
    'prep-beep': 'digital-beep.mp3',
    warning: 'dog.mp3',
    'round-start': 'dog.mp3',
    'round-end': 'dog.mp3',
    complete: 'dog.mp3',
  },
  chicken: {
    'prep-beep': 'digital-beep.mp3',
    warning: 'chicken.mp3',
    'round-start': 'chicken.mp3',
    'round-end': 'chicken.mp3',
    complete: 'chicken.mp3',
  },
  fart: {
    'prep-beep': 'fart.mp3',
    warning: 'fart.mp3',
    'round-start': 'fart.mp3',
    'round-end': 'fart.mp3',
    complete: 'fart.mp3',
  },
  boing: {
    'prep-beep': 'boing.mp3',
    warning: 'boing.mp3',
    'round-start': 'boing.mp3',
    'round-end': 'boing.mp3',
    complete: 'boing.mp3',
  },
  laser: {
    'prep-beep': 'laser.mp3',
    warning: 'laser.mp3',
    'round-start': 'laser.mp3',
    'round-end': 'laser.mp3',
    complete: 'laser.mp3',
  },
  trombone: {
    'prep-beep': 'fail-horn.mp3',
    warning: 'fail-horn.mp3',
    'round-start': 'fail-horn.mp3',
    'round-end': 'fail-horn.mp3',
    complete: 'fail-horn.mp3',
  },
}

export function resolveCueUrl(fileName: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}${SOUND_BASE_PATH}/${fileName}`
}
