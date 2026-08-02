<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useFullscreen } from './composables/useFullscreen'
import { useRoundTimer } from './composables/useRoundTimer'
import { useTimerAudio } from './composables/useTimerAudio'
import { useWakeLock } from './composables/useWakeLock'
import type { TimerConfiguration, TimerEvent } from './types/timer'
import { loadConfiguration, saveConfiguration } from './utils/storage'
import CompleteView from './views/CompleteView.vue'
import SetupView from './views/SetupView.vue'
import TimerView from './views/TimerView.vue'

const config = ref<TimerConfiguration>(loadConfiguration())
const screen = ref<'setup' | 'timer' | 'complete'>('setup')
const announcement = ref('')
const endDialogOpen = ref(false)
const skipDialogOpen = ref(false)
const skipArmed = ref(false)
const showIosHint = ref(false)
const playingPackId = ref<string | null>(null)

let skipHoldTimer: ReturnType<typeof setTimeout> | null = null
let previousPhaseForAudio: string | null = null
let wakeDesired = false

const timer = useRoundTimer()
const audio = useTimerAudio()
const fullscreen = useFullscreen()
const wakeLock = useWakeLock()

const isPaused = computed(() => timer.phase.value === 'paused')

function detectIosHint(): void {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  showIosHint.value = isIOS && !isStandalone
}

function announce(message: string): void {
  announcement.value = ''
  requestAnimationFrame(() => {
    announcement.value = message
  })
}

async function ensureWakeLock(): Promise<void> {
  if (!wakeDesired) return
  await wakeLock.request()
}

function syncAudioSettings(): void {
  audio.updateSettings({
    soundEnabled: config.value.soundEnabled,
    warningEnabled: config.value.warningEnabled,
    vibrationEnabled: config.value.vibrationEnabled,
    volume: config.value.volume,
    soundPackId: config.value.soundPackId,
  })
}

async function startWorkout(): Promise<void> {
  saveConfiguration(config.value)
  syncAudioSettings()
  await audio.unlock()
  await audio.resumeContext()
  previousPhaseForAudio = null
  timer.start(config.value)
  screen.value = 'timer'
  wakeDesired = true
  await ensureWakeLock()
}

async function previewSound(packId: string): Promise<void> {
  if (playingPackId.value) return
  playingPackId.value = packId
  syncAudioSettings()
  try {
    await audio.testSound(packId)
  } finally {
    playingPackId.value = null
  }
}

function onTimerEvent(event: TimerEvent): void {
  if (event.type === 'prep-beep') {
    audio.play('prep-beep')
    return
  }

  if (event.type === 'warning') {
    if (event.phase === 'active' || event.phase === 'resting') {
      audio.play('warning')
      announce('Ten seconds remaining.')
    }
    return
  }

  if (event.type === 'completed') {
    audio.play('round-end')
    window.setTimeout(() => {
      void audio.resumeContext().then(() => audio.play('complete'))
    }, 320)
    screen.value = 'complete'
    wakeDesired = false
    void wakeLock.release()
    announce(`Workout complete. ${event.totalRounds} rounds finished.`)
    previousPhaseForAudio = 'completed'
    return
  }

  if (event.type === 'phase-change') {
    handlePhaseAudio(event)
  }
}

function handlePhaseAudio(event: TimerEvent): void {
  const phase = event.phase
  const prev = previousPhaseForAudio

  if (phase === 'paused') {
    audio.stopAll()
    announce('Timer paused.')
    previousPhaseForAudio = phase
    return
  }

  void audio.resumeContext()

  if (phase === 'preparing') {
    announce(`Get ready. Round 1 of ${event.totalRounds}.`)
  } else if (phase === 'active') {
    if (prev === 'paused') {
      // Resume — no bell
    } else if (prev === 'active' && config.value.restDurationSeconds === 0) {
      audio.play('round-end')
      window.setTimeout(() => {
        void audio.resumeContext().then(() => audio.play('round-start'))
      }, 280)
    } else {
      audio.play('round-start')
    }
    announce(`Round ${event.currentRound} started.`)
  } else if (phase === 'resting') {
    if (prev === 'active') {
      audio.play('round-end')
    }
    announce(`Rest started. Next round ${event.currentRound + 1} of ${event.totalRounds}.`)
  }

  previousPhaseForAudio = phase
}

const unsubscribe = timer.subscribe(onTimerEvent)

function pause(): void {
  timer.pause()
  audio.stopAll()
}

function resume(): void {
  void audio.resumeContext()
  timer.resume()
  announce('Timer resumed.')
}

function requestSkip(): void {
  if (timer.phase.value === 'paused') {
    // skip paused underlying phase
    const before = timer.phaseBeforePause.value
    if (before === 'active') {
      skipDialogOpen.value = true
      return
    }
    timer.skip()
    return
  }

  if (timer.phase.value === 'active') {
    skipDialogOpen.value = true
    return
  }

  timer.skip()
}

function confirmSkip(): void {
  skipDialogOpen.value = false
  skipArmed.value = false
  timer.skip()
}

function onSkipHoldStart(): void {
  if (timer.phase.value !== 'active' && !(timer.phase.value === 'paused' && timer.phaseBeforePause.value === 'active')) {
    return
  }
  skipHoldTimer = setTimeout(() => {
    skipArmed.value = true
    confirmSkip()
  }, 650)
}

function onSkipHoldEnd(): void {
  if (skipHoldTimer) {
    clearTimeout(skipHoldTimer)
    skipHoldTimer = null
  }
  skipArmed.value = false
}

function requestEnd(): void {
  endDialogOpen.value = true
}

function confirmEnd(): void {
  endDialogOpen.value = false
  timer.reset()
  screen.value = 'setup'
  wakeDesired = false
  void wakeLock.release()
  void fullscreen.exit()
  announce('Session ended.')
}

function repeatWorkout(): void {
  void startWorkout()
}

function changeSettings(): void {
  timer.reset()
  screen.value = 'setup'
  wakeDesired = false
  void wakeLock.release()
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function onKeydown(event: KeyboardEvent): void {
  if (isTypingTarget(event.target)) return

  if (event.key === 'Escape') {
    if (endDialogOpen.value) {
      endDialogOpen.value = false
      return
    }
    if (skipDialogOpen.value) {
      skipDialogOpen.value = false
      return
    }
    if (fullscreen.isFullscreen.value) {
      void fullscreen.exit()
    }
    return
  }

  if (endDialogOpen.value || skipDialogOpen.value) return

  if (event.key === ' ' || event.code === 'Space') {
    if (screen.value !== 'timer') return
    event.preventDefault()
    if (isPaused.value) resume()
    else pause()
    return
  }

  if (event.key === 'ArrowRight') {
    if (screen.value !== 'timer') return
    event.preventDefault()
    requestSkip()
    return
  }

  if (event.key === 'f' || event.key === 'F') {
    if (screen.value !== 'timer') return
    event.preventDefault()
    void fullscreen.toggle()
  }
}

function onVisibility(): void {
  if (document.visibilityState === 'visible') {
    timer.sync()
    if (wakeDesired) void ensureWakeLock()
  }
}

watch(
  config,
  (value) => {
    syncAudioSettings()
    saveConfiguration(value)
  },
  { deep: true },
)

onMounted(() => {
  detectIosHint()
  syncAudioSettings()
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => {
  unsubscribe()
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('visibilitychange', onVisibility)
  if (skipHoldTimer) clearTimeout(skipHoldTimer)
  wakeDesired = false
  void wakeLock.release()
})
</script>

<template>
  <div class="app">
    <SetupView
      v-if="screen === 'setup'"
      :config="config"
      :audio-notice="audio.notice.value"
      :show-ios-hint="showIosHint"
      :playing-pack-id="playingPackId"
      @update:config="config = $event"
      @start="startWorkout()"
      @test-sound="audio.testSound()"
      @preview-sound="previewSound"
    />

    <TimerView
      v-else-if="screen === 'timer'"
      :phase="timer.phase.value"
      :phase-before-pause="timer.phaseBeforePause.value"
      :current-round="timer.currentRound.value"
      :total-rounds="timer.totalRounds.value"
      :remaining-milliseconds="timer.remainingMilliseconds.value"
      :phase-duration-milliseconds="timer.phaseDurationMilliseconds.value"
      :fullscreen-supported="fullscreen.supported.value"
      :is-fullscreen="fullscreen.isFullscreen.value"
      :skip-armed="skipArmed"
      :announcement="announcement"
      @pause="pause"
      @resume="resume"
      @skip="requestSkip"
      @skip-hold-start="onSkipHoldStart"
      @skip-hold-end="onSkipHoldEnd"
      @end="requestEnd"
      @fullscreen="fullscreen.toggle()"
    />

    <CompleteView
      v-else
      :completed-rounds="timer.totalRounds.value"
      @repeat="repeatWorkout"
      @settings="changeSettings"
    />

    <ConfirmDialog
      :open="endDialogOpen"
      title="End session?"
      message="This stops the current workout and returns you to settings."
      cancel-label="Continue Session"
      confirm-label="End Session"
      danger
      @cancel="endDialogOpen = false"
      @confirm="confirmEnd"
    />

    <ConfirmDialog
      :open="skipDialogOpen"
      title="Skip round?"
      message="Skip the current sparring round and move to the next phase?"
      cancel-label="Keep Sparring"
      confirm-label="Skip Round"
      @cancel="skipDialogOpen = false"
      @confirm="confirmSkip"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100dvh;
}
</style>
