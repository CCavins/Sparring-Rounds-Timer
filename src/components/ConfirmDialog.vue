<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const cancelBtn = ref<HTMLButtonElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    const el = dialogRef.value
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      await nextTick()
      cancelBtn.value?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  },
)

onMounted(() => {
  if (props.open) dialogRef.value?.showModal()
})

function onCancel(): void {
  emit('cancel')
}

function onConfirm(): void {
  emit('confirm')
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="dialog"
    :aria-labelledby="'dialog-title'"
    @cancel.prevent="onCancel"
  >
    <form method="dialog" class="dialog__panel" @submit.prevent>
      <h2 id="dialog-title" class="dialog__title">{{ title }}</h2>
      <p class="dialog__message">{{ message }}</p>
      <div class="dialog__actions">
        <button
          ref="cancelBtn"
          type="button"
          class="dialog__btn dialog__btn--secondary"
          @click="onCancel"
        >
          {{ cancelLabel ?? 'Cancel' }}
        </button>
        <button
          type="button"
          class="dialog__btn"
          :class="danger ? 'dialog__btn--danger' : 'dialog__btn--primary'"
          @click="onConfirm"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.dialog {
  border: 1px solid var(--border-strong);
  border-radius: 1rem;
  padding: 0;
  margin: auto;
  background: #141417;
  color: var(--text);
  max-width: min(
    26rem,
    calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 1.5rem)
  );
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}

.dialog::backdrop {
  background: rgba(0, 0, 0, 0.72);
}

.dialog__panel {
  display: grid;
  gap: 1rem;
  padding:
    max(1.25rem, env(safe-area-inset-top))
    max(1.25rem, env(safe-area-inset-right))
    max(1.25rem, env(safe-area-inset-bottom))
    max(1.25rem, env(safe-area-inset-left));
}

.dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dialog__message {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.dialog__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.dialog__btn {
  min-height: 3rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  font-family: var(--font-ui);
  font-weight: 700;
  cursor: pointer;
  white-space: normal;
}

.dialog__btn--secondary {
  background: transparent;
  border-color: var(--border-strong);
  color: var(--text);
}

.dialog__btn--primary {
  background: linear-gradient(135deg, #ff5c2d, #ff8c28);
  color: #1a0a00;
}

.dialog__btn--danger {
  background: linear-gradient(135deg, #ff3b3b, #c91818);
  color: #fff;
}

@media (max-width: 420px) {
  .dialog__actions {
    grid-template-columns: 1fr;
  }
}
</style>
