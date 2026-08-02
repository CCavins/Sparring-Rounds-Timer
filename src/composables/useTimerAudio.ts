import { ref } from 'vue'
import { DEFAULT_SOUND_PACK_ID } from '../types/sounds'
import type { SoundId } from './soundIds'

export type { SoundId } from './soundIds'

interface AudioSettings {
  soundEnabled: boolean
  warningEnabled: boolean
  vibrationEnabled: boolean
  volume: number
  soundPackId: string
}

/**
 * Gym-ready synthesized audio via Web Audio API.
 * Supports multiple serious and fun sound packs.
 */
export function useTimerAudio() {
  const unlocked = ref(false)
  const initFailed = ref(false)
  const notice = ref('')

  let ctx: AudioContext | null = null
  let masterGain: GainNode | null = null
  let settings: AudioSettings = {
    soundEnabled: true,
    warningEnabled: true,
    vibrationEnabled: false,
    volume: 0.85,
    soundPackId: DEFAULT_SOUND_PACK_ID,
  }

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AudioCtx()
      masterGain = ctx.createGain()
      masterGain.gain.value = settings.volume
      masterGain.connect(ctx.destination)
      return ctx
    } catch {
      initFailed.value = true
      notice.value = 'Sound could not be initialized in this browser.'
      return null
    }
  }

  async function unlock(): Promise<boolean> {
    const audio = ensureContext()
    if (!audio || !masterGain) {
      initFailed.value = true
      notice.value = 'Sound could not be initialized in this browser.'
      return false
    }

    try {
      if (audio.state === 'suspended') {
        await audio.resume()
      }
      const buffer = audio.createBuffer(1, 1, audio.sampleRate)
      const source = audio.createBufferSource()
      source.buffer = buffer
      source.connect(masterGain)
      source.start(0)
      unlocked.value = true
      initFailed.value = false
      notice.value = ''
      return true
    } catch {
      initFailed.value = true
      notice.value = 'Tap Test Sound or Start Timer again to enable audio.'
      unlocked.value = false
      return false
    }
  }

  function updateSettings(next: Partial<AudioSettings>): void {
    settings = { ...settings, ...next }
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(settings.volume, ctx.currentTime)
    }
  }

  function vibrate(pattern: number | number[]): void {
    if (!settings.vibrationEnabled) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // unsupported
      }
    }
  }

  function osc(
    frequency: number,
    startOffset: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
    freqEnd?: number,
  ): void {
    if (!ctx || !masterGain) return
    const t0 = ctx.currentTime + startOffset
    const t1 = t0 + duration
    const node = ctx.createOscillator()
    const gain = ctx.createGain()
    node.type = type
    node.frequency.setValueAtTime(frequency, t0)
    if (freqEnd !== undefined) {
      node.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t1)
    }
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t1)
    node.connect(gain)
    gain.connect(masterGain)
    node.start(t0)
    node.stop(t1 + 0.02)
  }

  function buzz(
    frequency: number,
    startOffset: number,
    duration: number,
    gainValue = 0.7,
  ): void {
    if (!ctx || !masterGain) return
    const t0 = ctx.currentTime + startOffset
    const t1 = t0 + duration
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency * 1.4, t0)
    filter.Q.setValueAtTime(1.1, t0)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.008)
    gain.gain.setValueAtTime(gainValue, Math.max(t0 + 0.01, t1 - 0.04))
    gain.gain.exponentialRampToValueAtTime(0.0001, t1)
    filter.connect(gain)
    gain.connect(masterGain)
    const square = ctx.createOscillator()
    square.type = 'square'
    square.frequency.setValueAtTime(frequency, t0)
    square.connect(filter)
    const saw = ctx.createOscillator()
    saw.type = 'sawtooth'
    saw.frequency.setValueAtTime(frequency * 1.01, t0)
    const sawGain = ctx.createGain()
    sawGain.gain.value = 0.45
    saw.connect(sawGain)
    sawGain.connect(filter)
    square.start(t0)
    saw.start(t0)
    square.stop(t1 + 0.02)
    saw.stop(t1 + 0.02)
  }

  function noiseBurst(startOffset: number, duration: number, gainValue: number, freq = 400): void {
    if (!ctx || !masterGain) return
    const t0 = ctx.currentTime + startOffset
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(freq, t0)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(gainValue, t0)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)
    source.start(t0)
    source.stop(t0 + duration + 0.02)
  }

  function playPackSound(sound: SoundId): void {
    const pack = settings.soundPackId

    if (sound === 'prep-beep') {
      switch (pack) {
        case 'boxing-bell':
          osc(880, 0, 0.08, 'sine', 0.35)
          break
        case 'whistle':
          osc(1800, 0, 0.08, 'sine', 0.3)
          break
        case 'duck':
          osc(420, 0, 0.1, 'sawtooth', 0.35, 280)
          break
        case 'cat':
          osc(700, 0, 0.12, 'triangle', 0.3, 900)
          break
        case 'dog':
          osc(220, 0, 0.08, 'square', 0.3)
          break
        case 'chicken':
          osc(650, 0, 0.06, 'square', 0.28, 900)
          break
        case 'fart':
          osc(120, 0, 0.12, 'sawtooth', 0.35, 70)
          break
        case 'boing':
          osc(500, 0, 0.12, 'sine', 0.35, 200)
          break
        case 'laser':
          osc(1200, 0, 0.08, 'square', 0.25, 600)
          break
        case 'trombone':
          osc(220, 0, 0.12, 'sawtooth', 0.3, 180)
          break
        case 'air-horn':
          buzz(380, 0, 0.1, 0.45)
          break
        case 'digital-beep':
          osc(1000, 0, 0.07, 'square', 0.3)
          break
        default:
          buzz(920, 0, 0.1, 0.55)
      }
      vibrate(30)
      return
    }

    if (sound === 'warning') {
      switch (pack) {
        case 'boxing-bell':
          osc(990, 0, 0.12, 'triangle', 0.45)
          osc(990, 0.18, 0.12, 'triangle', 0.45)
          break
        case 'whistle':
          osc(2000, 0, 0.12, 'sine', 0.4)
          osc(2000, 0.18, 0.12, 'sine', 0.4)
          break
        case 'duck':
          osc(380, 0, 0.12, 'sawtooth', 0.4, 240)
          osc(380, 0.2, 0.12, 'sawtooth', 0.4, 240)
          break
        case 'cat':
          osc(800, 0, 0.15, 'triangle', 0.4, 1100)
          osc(800, 0.22, 0.15, 'triangle', 0.4, 1100)
          break
        case 'dog':
          osc(180, 0, 0.1, 'square', 0.4)
          osc(180, 0.18, 0.1, 'square', 0.4)
          break
        case 'chicken':
          osc(700, 0, 0.08, 'square', 0.35, 1000)
          osc(700, 0.14, 0.08, 'square', 0.35, 1000)
          break
        case 'fart':
          osc(140, 0, 0.16, 'sawtooth', 0.45, 80)
          osc(130, 0.22, 0.16, 'sawtooth', 0.45, 70)
          break
        case 'boing':
          osc(600, 0, 0.15, 'sine', 0.4, 180)
          osc(600, 0.22, 0.15, 'sine', 0.4, 180)
          break
        case 'laser':
          osc(1400, 0, 0.1, 'square', 0.35, 400)
          osc(1400, 0.18, 0.1, 'square', 0.35, 400)
          break
        case 'trombone':
          osc(196, 0, 0.18, 'sawtooth', 0.4, 160)
          osc(175, 0.24, 0.2, 'sawtooth', 0.4, 140)
          break
        case 'air-horn':
          buzz(420, 0, 0.14, 0.55)
          buzz(420, 0.22, 0.14, 0.55)
          break
        case 'digital-beep':
          osc(880, 0, 0.1, 'square', 0.4)
          osc(880, 0.18, 0.1, 'square', 0.4)
          break
        default:
          buzz(680, 0, 0.14, 0.65)
          buzz(680, 0.22, 0.14, 0.65)
      }
      vibrate([40, 30, 40])
      return
    }

    if (sound === 'round-start') {
      switch (pack) {
        case 'boxing-bell':
          osc(880, 0, 0.5, 'triangle', 0.7)
          osc(1320, 0.02, 0.55, 'sine', 0.35)
          osc(880, 0.18, 0.4, 'triangle', 0.45)
          break
        case 'air-horn':
          buzz(280, 0, 0.7, 0.9)
          buzz(560, 0, 0.7, 0.35)
          noiseBurst(0, 0.15, 0.2, 800)
          break
        case 'whistle':
          osc(1800, 0, 0.35, 'sine', 0.55)
          osc(2100, 0.08, 0.3, 'sine', 0.4)
          osc(1900, 0.2, 0.25, 'sine', 0.35)
          break
        case 'digital-beep':
          osc(880, 0, 0.12, 'square', 0.55)
          osc(1175, 0.14, 0.18, 'square', 0.55)
          break
        case 'duck':
          osc(380, 0, 0.16, 'sawtooth', 0.55, 220)
          osc(360, 0.18, 0.16, 'sawtooth', 0.5, 200)
          osc(400, 0.36, 0.2, 'sawtooth', 0.55, 240)
          break
        case 'cat':
          osc(600, 0, 0.2, 'triangle', 0.45, 950)
          osc(700, 0.18, 0.28, 'triangle', 0.5, 1200)
          break
        case 'dog':
          osc(160, 0, 0.12, 'square', 0.55)
          osc(140, 0.16, 0.14, 'square', 0.55)
          osc(180, 0.34, 0.18, 'square', 0.6)
          break
        case 'chicken':
          osc(700, 0, 0.07, 'square', 0.4, 1000)
          osc(650, 0.1, 0.07, 'square', 0.4, 950)
          osc(800, 0.22, 0.22, 'sawtooth', 0.55, 1200)
          break
        case 'fart':
          osc(180, 0, 0.18, 'sawtooth', 0.6, 90)
          noiseBurst(0.05, 0.2, 0.25, 220)
          osc(120, 0.22, 0.35, 'sawtooth', 0.65, 55)
          break
        case 'boing':
          osc(700, 0, 0.35, 'sine', 0.6, 120)
          osc(900, 0.05, 0.3, 'triangle', 0.35, 160)
          break
        case 'laser':
          osc(1600, 0, 0.18, 'square', 0.5, 220)
          osc(1800, 0.16, 0.18, 'square', 0.45, 280)
          break
        case 'trombone':
          osc(392, 0, 0.25, 'sawtooth', 0.5)
          osc(349, 0.28, 0.35, 'sawtooth', 0.55, 300)
          break
        default:
          buzz(440, 0, 0.55, 0.85)
          buzz(880, 0, 0.55, 0.35)
      }
      vibrate(100)
      return
    }

    if (sound === 'round-end') {
      switch (pack) {
        case 'boxing-bell':
          osc(660, 0, 0.55, 'triangle', 0.7)
          osc(440, 0.15, 0.6, 'triangle', 0.55)
          osc(330, 0.35, 0.55, 'sine', 0.4)
          break
        case 'air-horn':
          buzz(240, 0, 0.35, 0.85)
          buzz(240, 0.45, 0.5, 0.85)
          break
        case 'whistle':
          osc(1600, 0, 0.2, 'sine', 0.5)
          osc(1400, 0.25, 0.35, 'sine', 0.45)
          break
        case 'digital-beep':
          osc(660, 0, 0.14, 'square', 0.5)
          osc(440, 0.18, 0.22, 'square', 0.5)
          break
        case 'duck':
          osc(300, 0, 0.2, 'sawtooth', 0.5, 180)
          osc(280, 0.28, 0.28, 'sawtooth', 0.55, 150)
          break
        case 'cat':
          osc(900, 0, 0.25, 'triangle', 0.45, 500)
          osc(700, 0.28, 0.35, 'triangle', 0.5, 400)
          break
        case 'dog':
          osc(200, 0, 0.2, 'square', 0.5, 120)
          osc(150, 0.28, 0.3, 'square', 0.55)
          break
        case 'chicken':
          osc(900, 0, 0.35, 'sawtooth', 0.55, 400)
          noiseBurst(0.1, 0.2, 0.15, 1200)
          break
        case 'fart':
          osc(200, 0, 0.25, 'sawtooth', 0.65, 70)
          noiseBurst(0.1, 0.35, 0.3, 180)
          osc(90, 0.3, 0.45, 'sawtooth', 0.7, 40)
          break
        case 'boing':
          osc(400, 0, 0.2, 'sine', 0.5, 90)
          osc(300, 0.22, 0.3, 'sine', 0.55, 70)
          break
        case 'laser':
          osc(900, 0, 0.2, 'square', 0.45, 120)
          osc(700, 0.22, 0.28, 'square', 0.45, 80)
          break
        case 'trombone':
          osc(294, 0, 0.28, 'sawtooth', 0.5)
          osc(247, 0.32, 0.28, 'sawtooth', 0.5)
          osc(196, 0.64, 0.45, 'sawtooth', 0.55, 160)
          break
        default:
          buzz(320, 0, 0.35, 0.85)
          buzz(320, 0.45, 0.45, 0.85)
          buzz(160, 0.45, 0.45, 0.4)
      }
      vibrate([80, 50, 100])
      return
    }

    // complete
    switch (pack) {
      case 'boxing-bell':
        osc(660, 0, 0.25, 'triangle', 0.55)
        osc(880, 0.22, 0.25, 'triangle', 0.55)
        osc(1100, 0.44, 0.45, 'triangle', 0.65)
        break
      case 'air-horn':
        buzz(300, 0, 0.25, 0.7)
        buzz(360, 0.3, 0.25, 0.75)
        buzz(420, 0.6, 0.45, 0.85)
        break
      case 'whistle':
        osc(1700, 0, 0.15, 'sine', 0.4)
        osc(1900, 0.18, 0.15, 'sine', 0.45)
        osc(2100, 0.36, 0.35, 'sine', 0.5)
        break
      case 'digital-beep':
        osc(523, 0, 0.12, 'square', 0.45)
        osc(659, 0.14, 0.12, 'square', 0.45)
        osc(784, 0.28, 0.12, 'square', 0.45)
        osc(1046, 0.42, 0.28, 'square', 0.55)
        break
      case 'duck':
        osc(360, 0, 0.14, 'sawtooth', 0.5, 220)
        osc(400, 0.18, 0.14, 'sawtooth', 0.5, 240)
        osc(440, 0.36, 0.22, 'sawtooth', 0.55, 260)
        break
      case 'cat':
        osc(700, 0, 0.2, 'triangle', 0.4, 1100)
        osc(850, 0.24, 0.35, 'triangle', 0.5, 1300)
        break
      case 'dog':
        osc(170, 0, 0.1, 'square', 0.5)
        osc(190, 0.14, 0.1, 'square', 0.5)
        osc(210, 0.28, 0.2, 'square', 0.6)
        break
      case 'chicken':
        osc(750, 0, 0.08, 'square', 0.4, 1100)
        osc(800, 0.12, 0.08, 'square', 0.4, 1150)
        osc(900, 0.28, 0.35, 'sawtooth', 0.55, 1400)
        break
      case 'fart':
        osc(160, 0, 0.2, 'sawtooth', 0.55, 80)
        osc(140, 0.24, 0.25, 'sawtooth', 0.6, 60)
        osc(100, 0.52, 0.45, 'sawtooth', 0.7, 40)
        noiseBurst(0.55, 0.4, 0.28, 160)
        break
      case 'boing':
        osc(500, 0, 0.2, 'sine', 0.45, 140)
        osc(700, 0.22, 0.2, 'sine', 0.5, 160)
        osc(900, 0.44, 0.35, 'sine', 0.55, 180)
        break
      case 'laser':
        osc(1400, 0, 0.12, 'square', 0.4, 300)
        osc(1600, 0.14, 0.12, 'square', 0.4, 350)
        osc(1900, 0.28, 0.28, 'square', 0.5, 200)
        break
      case 'trombone':
        osc(392, 0, 0.22, 'sawtooth', 0.45)
        osc(349, 0.26, 0.22, 'sawtooth', 0.45)
        osc(294, 0.52, 0.22, 'sawtooth', 0.45)
        osc(196, 0.78, 0.5, 'sawtooth', 0.55, 150)
        break
      default:
        buzz(280, 0, 0.28, 0.75)
        buzz(360, 0.36, 0.28, 0.8)
        buzz(480, 0.72, 0.45, 0.9)
        buzz(960, 0.72, 0.45, 0.35)
    }
    vibrate([80, 50, 80, 50, 140])
  }

  function play(sound: SoundId): void {
    if (!settings.soundEnabled) return
    if (!unlocked.value) return
    const audio = ensureContext()
    if (!audio) return
    if (audio.state === 'suspended') void audio.resume()

    if (sound === 'warning' && !settings.warningEnabled) return
    playPackSound(sound)
  }

  async function testSound(packId?: string): Promise<void> {
    const ok = await unlock()
    if (!ok) return
    if (!settings.soundEnabled) return

    if (packId) {
      const previous = settings.soundPackId
      settings.soundPackId = packId
      playPackSound('round-start')
      settings.soundPackId = previous
      return
    }

    play('round-start')
  }

  function stopAll(): void {
    if (ctx && ctx.state === 'running') {
      void ctx.suspend()
    }
  }

  async function resumeContext(): Promise<void> {
    if (ctx && ctx.state === 'suspended' && unlocked.value) {
      try {
        await ctx.resume()
      } catch {
        // ignore
      }
    }
  }

  return {
    unlocked,
    initFailed,
    notice,
    unlock,
    updateSettings,
    play,
    testSound,
    stopAll,
    resumeContext,
  }
}
