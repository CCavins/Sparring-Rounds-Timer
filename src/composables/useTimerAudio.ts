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
 * Unlocks from a user gesture (Start Timer / Test Sound).
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
      // Silent buffer primes playback pipeline
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

  function tone(
    frequency: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue = 0.55,
  ): void {
    if (!ctx || !masterGain || !settings.soundEnabled) return
    const t0 = ctx.currentTime + startOffset
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  function playBell(kind: 'start' | 'end' | 'complete'): void {
    if (!ctx || !masterGain || !settings.soundEnabled) return

    if (kind === 'start') {
      // Bright ascending bell
      tone(660, 0, 0.35, 'triangle', 0.7)
      tone(880, 0.08, 0.4, 'triangle', 0.55)
      tone(1320, 0.16, 0.5, 'sine', 0.35)
      vibrate(80)
      return
    }

    if (kind === 'end') {
      // Lower descending end bell — distinct from start
      tone(440, 0, 0.45, 'triangle', 0.75)
      tone(330, 0.12, 0.5, 'triangle', 0.55)
      tone(220, 0.28, 0.55, 'sine', 0.4)
      vibrate([60, 40, 60])
      return
    }

    // Completion sequence
    tone(523.25, 0, 0.25, 'triangle', 0.65)
    tone(659.25, 0.22, 0.25, 'triangle', 0.65)
    tone(783.99, 0.44, 0.3, 'triangle', 0.7)
    tone(1046.5, 0.7, 0.55, 'sine', 0.55)
    vibrate([80, 50, 80, 50, 120])
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
        tone(880, 0, 0.12, 'square', 0.45)
        vibrate(30)
        break
      case 'round-start':
        playBell('start')
        break
      case 'warning':
        if (!settings.warningEnabled || !settings.soundEnabled) return
        tone(740, 0, 0.15, 'square', 0.5)
        tone(740, 0.2, 0.15, 'square', 0.5)
        vibrate([40, 30, 40])
        break
      case 'round-end':
        playBell('end')
        break
      case 'complete':
        playBell('complete')
        break
    }
  }

  async function testSound(): Promise<void> {
    const ok = await unlock()
    if (!ok) return
    play('round-start')
  }

  function stopAll(): void {
    // Oscillators are short-lived; suspend context to mute lingering tails when paused
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
