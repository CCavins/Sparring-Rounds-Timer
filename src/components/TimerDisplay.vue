<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '../utils/duration'

const props = defineProps<{
  remainingMilliseconds: number
  phase: string
  paused?: boolean
}>()

const time = computed(() => formatDuration(props.remainingMilliseconds))
</script>

<template>
  <div
    class="timer"
    :class="[`timer--${paused ? 'paused' : phase}`, { 'timer--pulse': !paused && phase === 'active' }]"
    aria-live="off"
  >
    <p class="timer__value" data-testid="countdown">{{ time }}</p>
  </div>
</template>

<style scoped>
.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  flex: 1;
}

.timer__value {
  margin: 0;
  font-family: var(--font-mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 0.92;
  color: var(--text);
  text-shadow: 0 0 40px color-mix(in srgb, currentColor 22%, transparent);
  font-size: clamp(4.5rem, 28vmin, 18rem);
  user-select: none;
}

.timer--preparing .timer__value {
  color: var(--phase-prep);
}

.timer--active .timer__value {
  color: var(--phase-active);
}

.timer--resting .timer__value {
  color: var(--phase-rest);
}

.timer--paused .timer__value {
  color: var(--phase-paused);
  opacity: 0.85;
}

@media (orientation: landscape) {
  .timer__value {
    font-size: clamp(5rem, 32vmin, 20rem);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .timer--pulse .timer__value {
    animation: subtle-glow 2.4s ease-in-out infinite;
  }
}

@keyframes subtle-glow {
  0%,
  100% {
    text-shadow: 0 0 28px color-mix(in srgb, var(--phase-active) 18%, transparent);
  }
  50% {
    text-shadow: 0 0 48px color-mix(in srgb, var(--phase-active) 35%, transparent);
  }
}
</style>
