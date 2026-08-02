<script setup lang="ts">
import { computed } from 'vue'
import PhaseBadge from '../components/PhaseBadge.vue'
import RoundProgress from '../components/RoundProgress.vue'
import TimerControls from '../components/TimerControls.vue'
import TimerDisplay from '../components/TimerDisplay.vue'
import type { TimerPhase } from '../types/timer'

const props = defineProps<{
  phase: TimerPhase
  phaseBeforePause: Exclude<TimerPhase, 'paused'> | null
  currentRound: number
  totalRounds: number
  remainingMilliseconds: number
  phaseDurationMilliseconds: number
  fullscreenSupported: boolean
  isFullscreen: boolean
  skipArmed?: boolean
  announcement?: string
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  skip: []
  skipHoldStart: []
  skipHoldEnd: []
  end: []
  fullscreen: []
}>()

const paused = computed(() => props.phase === 'paused')
const visualPhase = computed(() =>
  paused.value ? (props.phaseBeforePause ?? 'paused') : props.phase,
)

const roundLabel = computed(() => {
  if (visualPhase.value === 'preparing') {
    return `Round 1 of ${props.totalRounds}`
  }
  if (visualPhase.value === 'resting') {
    const next = Math.min(props.currentRound + 1, props.totalRounds)
    return `Next: Round ${next} of ${props.totalRounds}`
  }
  return `Round ${props.currentRound} of ${props.totalRounds}`
})

const roundHighlight = computed(() => {
  if (visualPhase.value === 'resting') {
    return String(Math.min(props.currentRound + 1, props.totalRounds))
  }
  return String(props.currentRound)
})
</script>

<template>
  <section
    class="timer-view"
    :class="[`timer-view--${paused ? 'paused' : visualPhase}`]"
    data-testid="timer-view"
  >
    <div class="timer-view__pattern" aria-hidden="true" />

    <header class="timer-view__top">
      <PhaseBadge :phase="visualPhase" :paused="paused" />
      <p class="timer-view__round-num" data-testid="round-number">{{ roundHighlight }}</p>
      <p class="timer-view__round-label" data-testid="round-label">{{ roundLabel }}</p>
    </header>

    <TimerDisplay
      :remaining-milliseconds="remainingMilliseconds"
      :phase="visualPhase"
      :paused="paused"
    />

    <div class="timer-view__bottom">
      <RoundProgress
        :current-round="currentRound"
        :total-rounds="totalRounds"
        :remaining-milliseconds="remainingMilliseconds"
        :phase-duration-milliseconds="phaseDurationMilliseconds"
        :phase="visualPhase"
        :paused="paused"
      />
      <TimerControls
        :paused="paused"
        :fullscreen-supported="fullscreenSupported"
        :is-fullscreen="isFullscreen"
        :skip-armed="skipArmed"
        @pause="emit('pause')"
        @resume="emit('resume')"
        @skip="emit('skip')"
        @skip-hold-start="emit('skipHoldStart')"
        @skip-hold-end="emit('skipHoldEnd')"
        @end="emit('end')"
        @fullscreen="emit('fullscreen')"
      />
    </div>

    <div class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
  </section>
</template>

<style scoped>
.timer-view {
  position: relative;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: clamp(0.5rem, 2vh, 1.25rem);
  padding: max(0.85rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
    max(0.85rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  background: #070708;
  transition: background 0.25s ease;
}

.timer-view--preparing {
  background:
    radial-gradient(ellipse 70% 55% at 50% 30%, rgba(255, 196, 60, 0.16), transparent 60%),
    #0b0a07;
}

.timer-view--active {
  background:
    radial-gradient(ellipse 75% 60% at 50% 35%, rgba(255, 70, 40, 0.2), transparent 62%),
    #0c0807;
}

.timer-view--resting {
  background:
    radial-gradient(ellipse 75% 60% at 50% 35%, rgba(40, 170, 220, 0.18), transparent 62%),
    #070b0e;
}

.timer-view--paused {
  background:
    radial-gradient(ellipse 70% 50% at 50% 30%, rgba(160, 160, 170, 0.12), transparent 60%),
    #0a0a0c;
}

.timer-view__pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  background-image: repeating-linear-gradient(
    -18deg,
    transparent,
    transparent 12px,
    rgba(255, 255, 255, 0.04) 12px,
    rgba(255, 255, 255, 0.04) 13px
  );
}

.timer-view--resting .timer-view__pattern {
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 18px 18px;
}

.timer-view--paused .timer-view__pattern {
  opacity: 0.04;
}

.timer-view__top,
.timer-view__bottom {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
}

.timer-view__round-num {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.92);
}

.timer-view__round-label {
  margin: 0;
  font-family: var(--font-ui);
  font-size: clamp(0.95rem, 2.8vw, 1.25rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.timer-view__bottom {
  gap: 0.85rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (orientation: landscape) {
  .timer-view {
    grid-template-columns: minmax(8rem, 18vw) 1fr minmax(10rem, 22vw);
    grid-template-rows: 1fr auto;
    align-items: center;
  }

  .timer-view__top {
    grid-column: 1;
    grid-row: 1;
    justify-items: start;
    align-content: center;
    padding-left: 0.25rem;
  }

  .timer-view :deep(.timer) {
    grid-column: 2;
    grid-row: 1;
  }

  .timer-view__bottom {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (orientation: landscape) and (max-height: 480px) {
  .timer-view__round-num {
    font-size: clamp(1.5rem, 6vh, 2.25rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .timer-view {
    transition: none;
  }
}
</style>
