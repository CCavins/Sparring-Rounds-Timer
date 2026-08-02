<script setup lang="ts">
import { PRESETS } from '../types/timer'

defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [id: string]
}>()

function onSelect(id: string): void {
  emit('update:modelValue', id)
  emit('select', id)
}
</script>

<template>
  <fieldset class="presets">
    <legend class="presets__legend">Presets</legend>
    <div class="presets__grid" role="group" aria-label="Training presets">
      <button
        v-for="preset in PRESETS"
        :key="preset.id"
        type="button"
        class="presets__item"
        :class="{ 'presets__item--active': modelValue === preset.id }"
        :aria-pressed="modelValue === preset.id"
        @click="onSelect(preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.presets {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.presets__legend {
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0;
  margin-bottom: 0.25rem;
}

.presets__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.presets__item {
  min-height: 3rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.presets__item:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.presets__item--active {
  border-color: var(--accent-warm);
  background: linear-gradient(135deg, rgba(255, 92, 45, 0.22), rgba(255, 140, 40, 0.08));
  color: #fff4ec;
  box-shadow: 0 0 0 1px rgba(255, 92, 45, 0.25);
}
</style>
