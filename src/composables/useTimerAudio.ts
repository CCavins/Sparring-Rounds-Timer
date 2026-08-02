import { ref } from 'vue'

export type SoundId =
  | 'prep-beep'
  | 'round-start'
  | 'warning'
  | 'round-end'
  | 'complete'

interface AudioSettings {
  soundEnabled: boolean
  warningEnabled: boolean
  vibrationEnabled: boolean
  volume: number
}

/**
 * Gym-ready synthesized audio via Web Audio API.
 * Harsh fight-timer buzzers — unlocked from Start Timer / Test Sound.
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
        // unsupported pattern / denied
      }
    }
  }

  /**
   * Harsh dual-oscillator gym buzzer.
   * Square + slight detune saw = classic fight-timer rasp.
   */
  function buzz(
    frequency: number,
    startOffset: number,
    duration: number,
    gainValue = 0.7,
  ): void {
    if (!ctx || !masterGain || !settings.soundEnabled) return
    const t0 = ctx.currentTime + startOffset
    const t1 = t0 + duration

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency * 1.4, t0)
    filter.Q.setValueAtTime(1.1, t0)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.008)
    gain.gain.setValueAtTime(gainValue, t1 - 0.04)
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

  function playBuzzer(kind: 'start' | 'end' | 'complete' | 'warning' | 'prep'): void {
    if (!ctx || !masterGain || !settings.soundEnabled) return

    if (kind === 'prep') {
      // Short countdown chirp-buzz
      buzz(920, 0, 0.1, 0.55)
      vibrate(30)
      return
    }

    if (kind === 'warning') {
      // Two sharp warning buzzes
      buzz(680, 0, 0.14, 0.65)
      buzz(680, 0.22, 0.14, 0.65)
      vibrate([40, 30, 40])
      return
    }

    if (kind === 'start') {
      // Single strong go-buzzer — short and piercing
      buzz(440, 0, 0.55, 0.85)
      buzz(880, 0, 0.55, 0.35)
      vibrate(100)
      return
    }

    if (kind === 'end') {
      // Longer double-buzz — clearly different from start
      buzz(320, 0, 0.35, 0.85)
      buzz(320, 0.45, 0.45, 0.85)
      buzz(160, 0.45, 0.45, 0.4)
      vibrate([80, 50, 100])
      return
    }

    // Workout complete: three rising buzz blasts
    buzz(280, 0, 0.28, 0.75)
    buzz(360, 0.36, 0.28, 0.8)
    buzz(480, 0.72, 0.45, 0.9)
    buzz(960, 0.72, 0.45, 0.35)
    vibrate([80, 50, 80, 50, 140])
  }

  function play(sound: SoundId): void {
    if (!settings.soundEnabled && sound !== 'prep-beep') return
    if (!unlocked.value) return
    const audio = ensureContext()
    if (!audio) return

    if (audio.state === 'suspended') {
      void audio.resume()
    }

    switch (sound) {
      case 'prep-beep':
        if (!settings.soundEnabled) return
        playBuzzer('prep')
        break
      case 'round-start':
        playBuzzer('start')
        break
      case 'warning':
        if (!settings.warningEnabled || !settings.soundEnabled) return
        playBuzzer('warning')
        break
      case 'round-end':
        playBuzzer('end')
        break
      case 'complete':
        playBuzzer('complete')
        break
    }
  }

  async function testSound(): Promise<void> {
    const ok = await unlock()
    if (!ok) return
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
