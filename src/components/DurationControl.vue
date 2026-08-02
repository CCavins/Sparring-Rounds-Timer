<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatSeconds, parseDurationInput } from '../utils/duration'

const props = defineProps<{
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

const draft = ref(formatSeconds(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    draft.value = formatSeconds(value)
  },
)

const display = computed(() => formatSeconds(props.modelValue))

function adjust(delta: number): void {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + delta))
  emit('update:modelValue', next)
}

function commit(): void {
  const parsed = parseDurationInput(draft.value)
  if (parsed === null) {
    draft.value = formatSeconds(props.modelValue)
    return
  }
  const next = Math.min(props.max, Math.max(props.min, parsed))
  emit('update:modelValue', next)
  draft.value = formatSeconds(next)
}
</script>

<template>
  <div class="duration">
    <label :for="id" class="duration__label">{{ label }}</label>
    <div class="duration__controls">
      <button
        type="button"
        class="duration__btn"
        :aria-label="`Decrease ${label}`"
        :disabled="modelValue <= min"
        @click="adjust(-(step ?? 15))"
      >
        −
      </button>
      <div class="duration__field">
        <input
          :id="id"
          class="duration__input"
          type="text"
          inputmode="numeric"
          :value="draft"
          :aria-label="`${label}, currently ${display}`"
          @focus="($event.target as HTMLInputElement).select()"
          @input="draft = ($event.target as HTMLInputElement).value"
          @change="commit"
          @keydown.enter.prevent="commit"
        />
        <span class="duration__hint" aria-hidden="true">MM:SS</span>
      </div>
      <button
        type="button"
        class="duration__btn"
        :aria-label="`Increase ${label}`"
        :disabled="modelValue >= max"
        @click="adjust(step ?? 15)"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.duration {
  display: grid;
  gap: 0.5rem;
}

.duration__label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.duration__controls {
  display: grid;
  grid-template-columns: 3.5rem 1fr 3.5rem;
  gap: 0.5rem;
  align-items: stretch;
}

.duration__btn {
  min-width: 3.5rem;
  min-height: 3.5rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #2a2a2e, #1a1a1d);
  color: var(--text);
  font-size: 1.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
}

.duration__btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.duration__btn:active:not(:disabled) {
  transform: scale(0.97);
}

.duration__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.duration__field {
  position: relative;
  display: grid;
}

.duration__input {
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
  letter-spacing: 0.04em;
}

.duration__hint {
  position: absolute;
  right: 0.65rem;
  bottom: 0.35rem;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  pointer-events: none;
}
</style>
