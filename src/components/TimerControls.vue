<script setup lang="ts">
defineProps<{
  paused: boolean
  fullscreenSupported: boolean
  isFullscreen: boolean
  skipArmed?: boolean
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
</script>

<template>
  <div class="controls" :class="{ 'controls--quad': fullscreenSupported }">
    <button
      type="button"
      class="controls__btn controls__btn--primary"
      :aria-label="paused ? 'Resume timer' : 'Pause timer'"
      data-testid="pause-resume"
      @click="paused ? emit('resume') : emit('pause')"
    >
      {{ paused ? 'Resume' : 'Pause' }}
    </button>

    <button
      type="button"
      class="controls__btn"
      :class="{ 'controls__btn--armed': skipArmed }"
      aria-label="Skip to next phase. Hold to skip an active round."
      data-testid="skip"
      @click="emit('skip')"
      @pointerdown="emit('skipHoldStart')"
      @pointerup="emit('skipHoldEnd')"
      @pointerleave="emit('skipHoldEnd')"
      @pointercancel="emit('skipHoldEnd')"
    >
      Skip
    </button>

    <button
      type="button"
      class="controls__btn"
      aria-label="End session"
      data-testid="end-session"
      @click="emit('end')"
    >
      End
    </button>

    <button
      v-if="fullscreenSupported"
      type="button"
      class="controls__btn"
      :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
      data-testid="fullscreen"
      @click="emit('fullscreen')"
    >
      {{ isFullscreen ? 'Exit' : 'Full' }}
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  width: min(100%, 40rem);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.controls--quad {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.controls__btn {
  min-height: 3.25rem;
  min-width: 0;
  padding: 0.55rem 0.35rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: clamp(0.95rem, 3.2vw, 1.15rem);
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
}

.controls__btn:hover {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.08);
}

.controls__btn:active {
  transform: scale(0.98);
}

.controls__btn--primary {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
  border-color: rgba(255, 255, 255, 0.35);
}

.controls__btn--armed {
  border-color: var(--phase-active);
  color: var(--phase-active);
}

@media (orientation: landscape) and (max-height: 520px) {
  .controls__btn {
    min-height: 2.75rem;
    padding: 0.4rem 0.35rem;
  }
}
</style>
