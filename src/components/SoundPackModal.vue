<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  DEFAULT_SOUND_PACK_ID,
  SOUND_PACKS,
  type SoundPack,
  type SoundPackCategory,
} from '../types/sounds'

const props = defineProps<{
  open: boolean
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  close: []
  preview: [packId: string]
  reset: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

const serious = computed(() => SOUND_PACKS.filter((p) => p.category === 'serious'))
const fun = computed(() => SOUND_PACKS.filter((p) => p.category === 'fun'))

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

function select(pack: SoundPack): void {
  emit('update:modelValue', pack.id)
}

function preview(pack: SoundPack, event: Event): void {
  event.stopPropagation()
  emit('preview', pack.id)
}

function resetDefault(): void {
  emit('update:modelValue', DEFAULT_SOUND_PACK_ID)
  emit('reset')
  emit('preview', DEFAULT_SOUND_PACK_ID)
}

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

function categoryTitle(category: SoundPackCategory): string {
  return category === 'serious' ? 'Serious' : 'Fun / Funny'
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="sound-modal"
    aria-labelledby="sound-modal-title"
    @cancel.prevent="onCancel"
  >
    <div class="sound-modal__panel">
      <header class="sound-modal__header">
        <h2 id="sound-modal-title" class="sound-modal__title">Sound Effects</h2>
        <button
          ref="closeBtn"
          type="button"
          class="sound-modal__close"
          aria-label="Close sound effects"
          @click="onCancel"
        >
          Close
        </button>
      </header>

      <p class="sound-modal__intro">
        Pick a sound pack for round start, end, warnings, and completion. Preview before choosing.
      </p>

      <section class="sound-modal__group" aria-labelledby="serious-heading">
        <h3 id="serious-heading" class="sound-modal__group-title">{{ categoryTitle('serious') }}</h3>
        <div class="sound-modal__list">
          <div
            v-for="pack in serious"
            :key="pack.id"
            class="sound-modal__item"
            :class="{ 'sound-modal__item--active': modelValue === pack.id }"
          >
            <button
              type="button"
              class="sound-modal__select"
              :aria-pressed="modelValue === pack.id"
              @click="select(pack)"
            >
              <span class="sound-modal__item-label">{{ pack.label }}</span>
              <span class="sound-modal__item-desc">{{ pack.description }}</span>
            </button>
            <button
              type="button"
              class="sound-modal__preview"
              :aria-label="`Preview ${pack.label}`"
              @click="preview(pack, $event)"
            >
              Preview
            </button>
          </div>
        </div>
      </section>

      <section class="sound-modal__group" aria-labelledby="fun-heading">
        <h3 id="fun-heading" class="sound-modal__group-title">{{ categoryTitle('fun') }}</h3>
        <div class="sound-modal__list">
          <div
            v-for="pack in fun"
            :key="pack.id"
            class="sound-modal__item"
            :class="{ 'sound-modal__item--active': modelValue === pack.id }"
          >
            <button
              type="button"
              class="sound-modal__select"
              :aria-pressed="modelValue === pack.id"
              @click="select(pack)"
            >
              <span class="sound-modal__item-label">{{ pack.label }}</span>
              <span class="sound-modal__item-desc">{{ pack.description }}</span>
            </button>
            <button
              type="button"
              class="sound-modal__preview"
              :aria-label="`Preview ${pack.label}`"
              @click="preview(pack, $event)"
            >
              Preview
            </button>
          </div>
        </div>
      </section>

      <footer class="sound-modal__footer">
        <button type="button" class="sound-modal__reset" @click="resetDefault">
          Reset to Default
        </button>
        <button type="button" class="sound-modal__done" @click="onCancel">Done</button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.sound-modal {
  border: 1px solid var(--border-strong);
  border-radius: 1rem;
  padding: 0;
  background: #121214;
  color: var(--text);
  width: min(34rem, calc(100vw - 1.5rem));
  max-height: min(85dvh, 40rem);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}

.sound-modal::backdrop {
  background: rgba(0, 0, 0, 0.72);
}

.sound-modal__panel {
  display: grid;
  gap: 1rem;
  padding: 1.15rem 1.15rem 1.25rem;
  max-height: min(85dvh, 40rem);
  overflow: auto;
}

.sound-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sound-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sound-modal__close,
.sound-modal__reset,
.sound-modal__done,
.sound-modal__preview {
  min-height: 3rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
}

.sound-modal__close {
  padding: 0 0.9rem;
}

.sound-modal__intro {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.4;
}

.sound-modal__group {
  display: grid;
  gap: 0.55rem;
}

.sound-modal__group-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sound-modal__list {
  display: grid;
  gap: 0.45rem;
}

.sound-modal__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.45rem;
  align-items: stretch;
  width: 100%;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
}

.sound-modal__item--active {
  border-color: var(--accent-warm);
  background: linear-gradient(135deg, rgba(255, 92, 45, 0.2), rgba(255, 140, 40, 0.08));
}

.sound-modal__select {
  display: grid;
  gap: 0.15rem;
  min-height: 3.25rem;
  padding: 0.45rem 0.65rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}

.sound-modal__item-label {
  font-weight: 700;
  font-size: 1.05rem;
}

.sound-modal__item-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.3;
}

.sound-modal__preview {
  min-height: 2.75rem;
  align-self: center;
  padding: 0 0.75rem;
  font-size: 0.9rem;
}

.sound-modal__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  position: sticky;
  bottom: 0;
  padding-top: 0.35rem;
  background: linear-gradient(180deg, transparent, #121214 30%);
}

.sound-modal__done {
  background: linear-gradient(135deg, #ff5c2d, #ff8c28);
  border: 0;
  color: #1a0800;
}
</style>
