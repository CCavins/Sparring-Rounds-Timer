<script setup lang="ts">
import { computed } from 'vue'
import type { TimerPhase } from '../types/timer'

const props = defineProps<{
  phase: TimerPhase
  paused?: boolean
}>()

const label = computed(() => {
  if (props.paused || props.phase === 'paused') return 'PAUSED'
  switch (props.phase) {
    case 'preparing':
      return 'GET READY'
    case 'active':
      return 'SPARRING'
    case 'resting':
      return 'REST'
    case 'completed':
      return 'COMPLETE'
    default:
      return 'READY'
  }
})

const symbol = computed(() => {
  if (props.paused || props.phase === 'paused') return '❚❚'
  switch (props.phase) {
    case 'preparing':
      return '◆'
    case 'active':
      return '▮'
    case 'resting':
      return '○'
    case 'completed':
      return '★'
    default:
      return '●'
  }
})
</script>

<template>
  <div
    class="badge"
    :class="[
      `badge--${paused || phase === 'paused' ? 'paused' : phase}`,
    ]"
    role="status"
  >
    <span class="badge__symbol" aria-hidden="true">{{ symbol }}</span>
    <span class="badge__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 2.75rem;
  padding: 0.35rem 1.1rem;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 3.5vw, 1.85rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.28);
}

.badge__symbol {
  font-size: 0.85em;
  opacity: 0.9;
}

.badge--preparing {
  color: var(--phase-prep);
  box-shadow: 0 0 28px color-mix(in srgb, var(--phase-prep) 25%, transparent);
}

.badge--active {
  color: var(--phase-active);
  box-shadow: 0 0 28px color-mix(in srgb, var(--phase-active) 28%, transparent);
}

.badge--resting {
  color: var(--phase-rest);
  box-shadow: 0 0 28px color-mix(in srgb, var(--phase-rest) 25%, transparent);
}

.badge--paused {
  color: var(--phase-paused);
  box-shadow: none;
}

.badge--completed {
  color: var(--phase-complete);
}

.badge--idle {
  color: var(--text-muted);
}
</style>
