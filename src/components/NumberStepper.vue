<script setup lang="ts">
defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step?: number
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function adjust(delta: number, min: number, max: number, current: number): void {
  emit('update:modelValue', Math.min(max, Math.max(min, current + delta)))
}

function onInput(event: Event, min: number, max: number): void {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return
  emit('update:modelValue', Math.min(max, Math.max(min, Math.round(parsed))))
}
</script>

<template>
  <div class="stepper">
    <label :for="id" class="stepper__label">{{ label }}</label>
    <div class="stepper__controls">
      <button
        type="button"
        class="stepper__btn"
        :aria-label="`Decrease ${label}`"
        :disabled="modelValue <= min"
        @click="adjust(-(step ?? 1), min, max, modelValue)"
      >
        −
      </button>
      <input
        :id="id"
        class="stepper__input"
        type="number"
        inputmode="numeric"
        :min="min"
        :max="max"
        :value="modelValue"
        :aria-label="label"
        @change="onInput($event, min, max)"
      />
      <button
        type="button"
        class="stepper__btn"
        :aria-label="`Increase ${label}`"
        :disabled="modelValue >= max"
        @click="adjust(step ?? 1, min, max, modelValue)"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper {
  display: grid;
  gap: 0.5rem;
}

.stepper__label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stepper__controls {
  display: grid;
  grid-template-columns: 3.5rem 1fr 3.5rem;
  gap: 0.5rem;
  align-items: center;
}

.stepper__btn {
  min-width: 3.5rem;
  min-height: 3.5rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #2a2a2e, #1a1a1d);
  color: var(--text);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.stepper__btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: linear-gradient(180deg, #333338, #222226);
}

.stepper__btn:active:not(:disabled) {
  transform: scale(0.97);
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__input {
  min-height: 3.5rem;
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: #0d0d0f;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  text-align: center;
  -moz-appearance: textfield;
}

.stepper__input::-webkit-outer-spin-button,
.stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
