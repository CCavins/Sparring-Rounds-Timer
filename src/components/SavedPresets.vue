<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  createPresetId,
  loadCustomPresets,
  MAX_CUSTOM_PRESETS,
  MAX_PRESET_NAME_LENGTH,
  saveCustomPresets,
  type SavedCustomPreset,
} from '../types/presets'
import type { TimerConfiguration } from '../types/timer'
import { formatSeconds } from '../utils/duration'

const props = defineProps<{
  config: TimerConfiguration
}>()

const emit = defineEmits<{
  load: [preset: SavedCustomPreset]
}>()

const presets = ref<SavedCustomPreset[]>(loadCustomPresets())
const nameDraft = ref('')
const error = ref('')

const canSaveMore = computed(() => presets.value.length < MAX_CUSTOM_PRESETS)

function persist(): void {
  saveCustomPresets(presets.value)
}

function saveCurrent(): void {
  error.value = ''
  const name = nameDraft.value.trim()
  if (!name) {
    error.value = 'Enter a name for this custom setup.'
    return
  }
  if (!canSaveMore.value) {
    error.value = `You can save up to ${MAX_CUSTOM_PRESETS} custom setups.`
    return
  }

  const next: SavedCustomPreset = {
    id: createPresetId(),
    name: name.slice(0, MAX_PRESET_NAME_LENGTH),
    rounds: props.config.rounds,
    roundDurationSeconds: props.config.roundDurationSeconds,
    restDurationSeconds: props.config.restDurationSeconds,
    preparationDurationSeconds: props.config.preparationDurationSeconds,
    createdAt: Date.now(),
  }

  presets.value = [next, ...presets.value]
  persist()
  nameDraft.value = ''
}

function loadPreset(preset: SavedCustomPreset): void {
  emit('load', preset)
}

function removePreset(id: string): void {
  presets.value = presets.value.filter((item) => item.id !== id)
  persist()
}

function summary(preset: SavedCustomPreset): string {
  return `${preset.rounds}× ${formatSeconds(preset.roundDurationSeconds)} / ${formatSeconds(preset.restDurationSeconds)}`
}
</script>

<template>
  <section class="saved" aria-labelledby="saved-heading">
    <h2 id="saved-heading" class="saved__heading">Saved Custom Setups</h2>
    <p class="saved__hint">Save the current rounds, times, and prep for quick reuse on this device.</p>

    <div class="saved__form">
      <label class="saved__label" for="custom-preset-name">Name</label>
      <div class="saved__row">
        <input
          id="custom-preset-name"
          v-model="nameDraft"
          class="saved__input"
          type="text"
          maxlength="40"
          placeholder="e.g. Morning pads"
          autocomplete="off"
          @keydown.enter.prevent="saveCurrent"
        />
        <button type="button" class="saved__save" :disabled="!canSaveMore" @click="saveCurrent">
          Save
        </button>
      </div>
      <p v-if="error" class="saved__error" role="alert">{{ error }}</p>
    </div>

    <ul v-if="presets.length" class="saved__list">
      <li v-for="preset in presets" :key="preset.id" class="saved__item">
        <button type="button" class="saved__load" @click="loadPreset(preset)">
          <span class="saved__name">{{ preset.name }}</span>
          <span class="saved__meta">{{ summary(preset) }}</span>
        </button>
        <button
          type="button"
          class="saved__delete"
          :aria-label="`Delete saved setup ${preset.name}`"
          @click="removePreset(preset.id)"
        >
          Delete
        </button>
      </li>
    </ul>
    <p v-else class="saved__empty">No saved setups yet.</p>
  </section>
</template>

<style scoped>
.saved {
  display: grid;
  gap: 0.75rem;
}

.saved__heading {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.saved__hint,
.saved__empty {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.88rem;
  line-height: 1.35;
}

.saved__form {
  display: grid;
  gap: 0.4rem;
}

.saved__label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.saved__row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.saved__input,
.saved__save,
.saved__delete,
.saved__load {
  touch-action: manipulation;
}

.saved__input {
  min-height: 3rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: #0d0d0f;
  color: var(--text);
  padding: 0 0.85rem;
  font-size: max(1rem, 16px);
}

.saved__save,
.saved__delete {
  min-height: 3rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-weight: 700;
  cursor: pointer;
}

.saved__save {
  background: rgba(255, 140, 40, 0.16);
  border-color: rgba(255, 140, 40, 0.45);
}

.saved__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.saved__error {
  margin: 0;
  color: #ffb4a8;
  font-size: 0.88rem;
}

.saved__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.saved__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.45rem;
}

.saved__load {
  display: grid;
  gap: 0.15rem;
  min-height: 3.25rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.saved__name {
  font-weight: 700;
}

.saved__meta {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-muted);
}

.saved__delete {
  color: #ffb4a8;
}
</style>
