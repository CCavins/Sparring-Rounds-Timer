<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AudioSettings from './AudioSettings.vue'

const props = defineProps<{
  open: boolean
  soundEnabled: boolean
  warningEnabled: boolean
  vibrationEnabled: boolean
  volume: number
  soundPackId: string
  notice?: string
  vibrationSupported?: boolean
  showIosHint?: boolean
}>()

const emit = defineEmits<{
  close: []
  'update:soundEnabled': [value: boolean]
  'update:warningEnabled': [value: boolean]
  'update:vibrationEnabled': [value: boolean]
  'update:volume': [value: number]
  test: []
  openSoundPacks: []
  resetSoundPack: []
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
    class="settings-modal"
    aria-labelledby="settings-modal-title"
    @cancel.prevent="onCancel"
  >
    <div class="settings-modal__panel">
      <header class="settings-modal__header">
        <h2 id="settings-modal-title" class="settings-modal__title">Settings</h2>
        <button
          ref="closeBtn"
          type="button"
          class="settings-modal__close"
          aria-label="Close settings"
          @click="onCancel"
        >
          Done
        </button>
      </header>

      <AudioSettings
        :sound-enabled="soundEnabled"
        :warning-enabled="warningEnabled"
        :vibration-enabled="vibrationEnabled"
        :volume="volume"
        :sound-pack-id="soundPackId"
        :notice="notice"
        :vibration-supported="vibrationSupported"
        @update:sound-enabled="emit('update:soundEnabled', $event)"
        @update:warning-enabled="emit('update:warningEnabled', $event)"
        @update:vibration-enabled="emit('update:vibrationEnabled', $event)"
        @update:volume="emit('update:volume', $event)"
        @test="emit('test')"
        @open-sound-packs="emit('openSoundPacks')"
        @reset-sound-pack="emit('resetSoundPack')"
      />

      <p v-if="showIosHint" class="settings-modal__ios">
        Tip: Share → Add to Home Screen for a full-screen app experience.
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.settings-modal {
  border: 1px solid var(--border-strong);
  border-radius: 1rem;
  padding: 0;
  background: #121214;
  color: var(--text);
  width: min(34rem, calc(100vw - 1.25rem));
  max-height: min(85dvh, 40rem);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}

.settings-modal::backdrop {
  background: rgba(0, 0, 0, 0.72);
}

.settings-modal__panel {
  display: grid;
  gap: 1rem;
  padding: 1rem 1rem 1.15rem;
  max-height: min(85dvh, 40rem);
  overflow: auto;
}

.settings-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.settings-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.settings-modal__close {
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

.settings-modal__ios {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-dim);
  line-height: 1.35;
}
</style>
