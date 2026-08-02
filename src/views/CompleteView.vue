<script setup lang="ts">
defineProps<{
  completedRounds: number
}>()

const emit = defineEmits<{
  repeat: []
  settings: []
}>()
</script>

<template>
  <section class="complete" data-testid="complete-view">
    <div class="complete__glow" aria-hidden="true" />
    <p class="complete__symbol" aria-hidden="true">★</p>
    <h1 class="complete__title">Workout Complete</h1>
    <p class="complete__summary" data-testid="completed-rounds">
      {{ completedRounds }} round{{ completedRounds === 1 ? '' : 's' }} finished
    </p>
    <div class="complete__actions">
      <button
        type="button"
        class="complete__btn complete__btn--primary"
        data-testid="repeat-workout"
        @click="emit('repeat')"
      >
        Repeat Workout
      </button>
      <button
        type="button"
        class="complete__btn"
        data-testid="change-settings"
        @click="emit('settings')"
      >
        Change Settings
      </button>
    </div>
  </section>
</template>

<style scoped>
.complete {
  position: relative;
  min-height: 100dvh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1rem;
  padding: max(1.5rem, env(safe-area-inset-top)) 1.5rem max(1.5rem, env(safe-area-inset-bottom));
  text-align: center;
  background:
    radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255, 200, 70, 0.18), transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 80%, rgba(60, 200, 120, 0.1), transparent 55%),
    #080a08;
  overflow: hidden;
}

.complete__glow {
  position: absolute;
  inset: 20% 10% auto;
  height: 40%;
  background: radial-gradient(circle, rgba(255, 196, 60, 0.2), transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}

.complete__symbol {
  position: relative;
  margin: 0;
  font-size: clamp(2.5rem, 8vw, 4rem);
  color: var(--phase-complete);
}

.complete__title {
  position: relative;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 9vw, 4.5rem);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff6d8;
  line-height: 1;
}

.complete__summary {
  position: relative;
  margin: 0 0 1rem;
  font-size: clamp(1.1rem, 3vw, 1.4rem);
  color: var(--text-muted);
}

.complete__actions {
  position: relative;
  display: grid;
  gap: 0.75rem;
  width: min(100%, 22rem);
}

.complete__btn {
  min-height: 3.5rem;
  border-radius: 0.9rem;
  border: 1px solid var(--border-strong);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
}

.complete__btn--primary {
  border: 0;
  background: linear-gradient(135deg, #f0c14b, #7dcc6a);
  color: #141008;
}
</style>
