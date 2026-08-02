<script setup lang="ts">
import { computed } from 'vue'
import { progressRatio } from '../utils/duration'

const props = defineProps<{
  currentRound: number
  totalRounds: number
  remainingMilliseconds: number
  phaseDurationMilliseconds: number
  phase: string
  paused?: boolean
}>()

const ratio = computed(() =>
  progressRatio(props.remainingMilliseconds, props.phaseDurationMilliseconds),
)

const markers = computed(() =>
  Array.from({ length: props.totalRounds }, (_, index) => {
    const round = index + 1
    if (round < props.currentRound) return 'done'
    if (round === props.currentRound && props.phase !== 'preparing') return 'current'
    return 'upcoming'
  }),
)
</script>

<template>
  <div class="progress" aria-hidden="true">
    <div class="progress__bar">
      <div
        class="progress__fill"
        :class="`progress__fill--${paused ? 'paused' : phase}`"
        :style="{ transform: `scaleX(${ratio})` }"
      />
    </div>
    <ol class="progress__rounds">
      <li
        v-for="(status, index) in markers"
        :key="index"
        class="progress__dot"
        :class="`progress__dot--${status}`"
      />
    </ol>
  </div>
</template>

<style scoped>
.progress {
  display: grid;
  gap: 0.55rem;
  width: min(100%, 36rem);
}

.progress__bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  transition: transform 0.1s linear;
  background: var(--phase-active);
}

.progress__fill--preparing {
  background: var(--phase-prep);
}

.progress__fill--resting {
  background: var(--phase-rest);
}

.progress__fill--paused {
  background: var(--phase-paused);
}

.progress__rounds {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.progress__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.progress__dot--done {
  background: rgba(255, 255, 255, 0.55);
}

.progress__dot--current {
  background: var(--phase-active);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--phase-active) 35%, transparent);
}
</style>
