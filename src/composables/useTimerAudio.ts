import { ref } from 'vue'
import { PACK_CUES, resolveCueUrl } from '../audio/soundManifest'
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

interface PlayHandle {
  durationMs: number
  stop: () => void
}

/**
 * Sample-based timer audio (BigSoundBank CC0 files) with Web Audio playback.
 */
export function useTimerAudio() {
  const unlocked = ref(false)
  const initFailed = ref(false)
  const notice = ref('')
  const isPreviewPlaying = ref(false)

  let ctx: AudioContext | null = null
  let masterGain: GainNode | null = null
  const buffers = new Map<string, AudioBuffer>()
  let preloadPromise: Promise<void> | null = null
  let activeSources: AudioBufferSourceNode[] = []
  let previewTimer: ReturnType<typeof setTimeout> | null = null

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

  async function loadBuffer(fileName: string): Promise<AudioBuffer | null> {
    if (buffers.has(fileName)) return buffers.get(fileName) ?? null
    const audio = ensureContext()
    if (!audio) return null
    try {
      const response = await fetch(resolveCueUrl(fileName))
      if (!response.ok) throw new Error(`Failed to load ${fileName}`)
      const data = await response.arrayBuffer()
      const buffer = await audio.decodeAudioData(data.slice(0))
      buffers.set(fileName, buffer)
      return buffer
    } catch {
      return null
    }
  }

  async function preloadAll(): Promise<void> {
    if (preloadPromise) return preloadPromise
    preloadPromise = (async () => {
      const files = new Set<string>()
      for (const pack of Object.values(PACK_CUES)) {
        for (const file of Object.values(pack)) files.add(file)
      }
      await Promise.all([...files].map((file) => loadBuffer(file)))
    })()
    return preloadPromise
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
      void preloadAll()
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

  function stopActiveSources(): void {
    for (const source of activeSources) {
      try {
        source.stop()
      } catch {
        // already stopped
      }
    }
    activeSources = []
  }

  function cueFile(packId: string, sound: SoundId): string {
    const pack = PACK_CUES[packId] ?? PACK_CUES[DEFAULT_SOUND_PACK_ID]!
    return pack[sound]
  }

  async function playBuffer(
    fileName: string,
    options: { gain?: number; whenOffset?: number; rate?: number } = {},
  ): Promise<PlayHandle> {
    const audio = ensureContext()
    if (!audio || !masterGain) {
      return { durationMs: 0, stop: () => undefined }
    }

    const buffer = (await loadBuffer(fileName)) ?? buffers.get(fileName)
    if (!buffer) {
      return { durationMs: 0, stop: () => undefined }
    }

    if (audio.state === 'suspended') {
      await audio.resume()
    }

    const source = audio.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = options.rate ?? 1

    const gain = audio.createGain()
    gain.gain.value = options.gain ?? 1
    source.connect(gain)
    gain.connect(masterGain)

    const startAt = audio.currentTime + (options.whenOffset ?? 0)
    source.start(startAt)
    activeSources.push(source)
    source.onended = () => {
      activeSources = activeSources.filter((item) => item !== source)
    }

    const durationMs = (buffer.duration / (options.rate ?? 1)) * 1000 + (options.whenOffset ?? 0) * 1000
    return {
      durationMs,
      stop: () => {
        try {
          source.stop()
        } catch {
          // ignore
        }
      },
    }
  }

  async function playPackSound(sound: SoundId, packId = settings.soundPackId): Promise<number> {
    const file = cueFile(packId, sound)

    if (sound === 'warning') {
      const first = await playBuffer(file, { gain: 0.95 })
      const second = await playBuffer(file, { gain: 0.95, whenOffset: 0.22 })
      vibrate([40, 30, 40])
      return Math.max(first.durationMs, second.durationMs)
    }

    if (sound === 'prep-beep') {
      const handle = await playBuffer(file, { gain: 0.7, rate: 1.15 })
      vibrate(30)
      return handle.durationMs
    }

    if (sound === 'round-end' && packId === 'gym-buzzer') {
      const first = await playBuffer(file, { gain: 1 })
      const second = await playBuffer(file, { gain: 1, whenOffset: 0.35, rate: 0.92 })
      vibrate([80, 50, 100])
      return Math.max(first.durationMs, second.durationMs)
    }

    if (sound === 'complete') {
      vibrate([80, 50, 80, 50, 140])
      if (packId === 'gym-buzzer' || packId === 'boxing-bell') {
        const a = await playBuffer(file, { gain: 1 })
        const b = await playBuffer(file, { gain: 0.9, whenOffset: 0.35 })
        return Math.max(a.durationMs, b.durationMs)
      }
      const a = await playBuffer(file, { gain: 1 })
      const b = await playBuffer(file, { gain: 0.95, whenOffset: 0.28, rate: 1.08 })
      const c = await playBuffer(file, { gain: 0.9, whenOffset: 0.56, rate: 1.15 })
      return Math.max(a.durationMs, b.durationMs, c.durationMs)
    }

    const handle = await playBuffer(file, { gain: 1 })
    vibrate(sound === 'round-start' ? 100 : 60)
    return handle.durationMs
  }

  async function play(sound: SoundId): Promise<number> {
    if (!settings.soundEnabled) return 0
    if (!unlocked.value) return 0
    if (sound === 'warning' && !settings.warningEnabled) return 0
    return playPackSound(sound)
  }

  async function testSound(packId?: string): Promise<number> {
    const ok = await unlock()
    if (!ok) return 0
    if (!settings.soundEnabled) return 0

    stopActiveSources()
    if (previewTimer) {
      clearTimeout(previewTimer)
      previewTimer = null
    }

    isPreviewPlaying.value = true
    const durationMs = await playPackSound('round-start', packId ?? settings.soundPackId)
    const waitMs = Math.max(400, Math.min(durationMs + 80, 3000))

    await new Promise<void>((resolve) => {
      previewTimer = setTimeout(() => {
        previewTimer = null
        isPreviewPlaying.value = false
        resolve()
      }, waitMs)
    })

    return durationMs
  }

  function stopAll(): void {
    stopActiveSources()
    if (previewTimer) {
      clearTimeout(previewTimer)
      previewTimer = null
    }
    isPreviewPlaying.value = false
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
    isPreviewPlaying,
    unlock,
    updateSettings,
    play,
    testSound,
    stopAll,
    resumeContext,
    preloadAll,
  }
}
