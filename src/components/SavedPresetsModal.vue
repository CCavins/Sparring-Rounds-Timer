<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { SavedCustomPreset } from '../types/presets'
import type { TimerConfiguration } from '../types/timer'
import SavedPresets from './SavedPresets.vue'

const props = defineProps<{
  open: boolean
  config: TimerConfiguration
}>()

const emit = defineEmits<{
  close: []
  load: [preset: SavedCustomPreset]
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    const el = dialogRef.value
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      await nextTick()
      closeBtn.value?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  },
)

onMounted(() => {
  if (props.open) dialogRef.value?.showModal()
})

function onCancel(): void {
  emit('close')
}

function onLoad(preset: SavedCustomPreset): void {
  emit('load', preset)
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <dialog
    ref="dialogRef"
    class="saved-modal"
    aria-labelledby="saved-modal-title"
    @cancel.prevent="onCancel"
  >
    <div class="saved-modal__panel">
      <header class="saved-modal__header">
        <h2 id="saved-modal-title" class="saved-modal__title">Saved Setups</h2>
        <button
          ref="closeBtn"
          type="button"
          class="saved-modal__close"
          aria-label="Close saved setups"
          @click="onCancel"
        >
          Done
        </button>
      </header>
      <SavedPresets compact :config="config" @load="onLoad" />
    </div>
  </dialog>
</template>

<style scoped>
.saved-modal {
  border: 1px solid var(--border-strong);
  border-radius: 1rem;
  padding: 0;
  background: #121214;
  color: var(--text);
  width: min(34rem, calc(100vw - 1.25rem));
  max-height: min(85dvh, 40rem);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}

.saved-modal::backdrop {
  background: rgba(0, 0, 0, 0.72);
}

.saved-modal__panel {
  display: grid;
  gap: 1rem;
  padding: 1rem 1rem 1.15rem;
  max-height: min(85dvh, 40rem);
  overflow: auto;
}

.saved-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.saved-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.saved-modal__close {
  min-height: 3rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  border: 0;
  background: linear-gradient(135deg, #ff5c2d, #ff8c28);
  color: #1a0800;
  font-family: var(--font-ui);
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
}
</style>
