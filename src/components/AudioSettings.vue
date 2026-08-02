<script setup lang="ts">
import { computed } from 'vue'
import { getSoundPack } from '../types/sounds'

const props = defineProps<{
  soundEnabled: boolean
  warningEnabled: boolean
  vibrationEnabled: boolean
  volume: number
  soundPackId: string
  notice?: string
  vibrationSupported?: boolean
}>()

const emit = defineEmits<{
  'update:soundEnabled': [value: boolean]
  'update:warningEnabled': [value: boolean]
  'update:vibrationEnabled': [value: boolean]
  'update:volume': [value: number]
  test: []
  openSoundPacks: []
  resetSoundPack: []
}>()

const packLabel = computed(() => getSoundPack(props.soundPackId).label)
</script>

<template>
  <section class="audio" aria-labelledby="audio-heading">
    <h2 id="audio-heading" class="audio__heading">Sound</h2>

    <div class="audio__rows">
      <label class="audio__toggle">
        <input
          type="checkbox"
          :checked="soundEnabled"
          @change="emit('update:soundEnabled', ($event.target as HTMLInputElement).checked)"
        />
        <span>Master sound</span>
      </label>

      <label class="audio__toggle">
        <input
          type="checkbox"
          :checked="warningEnabled"
          :disabled="!soundEnabled"
          @change="emit('update:warningEnabled', ($event.target as HTMLInputElement).checked)"
        />
        <span>10-second warning</span>
      </label>

      <label v-if="vibrationSupported !== false" class="audio__toggle">
        <input
          type="checkbox"
          :checked="vibrationEnabled"
          @change="emit('update:vibrationEnabled', ($event.target as HTMLInputElement).checked)"
        />
        <span>Vibration</span>
      </label>
    </div>

    <label class="audio__volume">
      <span class="audio__volume-label">Volume</span>
      <input
        class="audio__slider"
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="volume"
        :disabled="!soundEnabled"
        :aria-valuetext="`${Math.round(volume * 100)} percent`"
        @input="emit('update:volume', Number(($event.target as HTMLInputElement).value))"
      />
      <span class="audio__volume-value" aria-hidden="true">{{ Math.round(volume * 100) }}%</span>
    </label>

    <div class="audio__pack">
      <div class="audio__pack-info">
        <span class="audio__pack-label">Sound pack</span>
        <span class="audio__pack-name" data-testid="sound-pack-name">{{ packLabel }}</span>
      </div>
      <div class="audio__pack-actions">
        <button type="button" class="audio__test" data-testid="choose-sounds" @click="emit('openSoundPacks')">
          Choose Sounds
        </button>
        <button type="button" class="audio__test" @click="emit('resetSoundPack')">
          Reset Sounds
        </button>
      </div>
    </div>

    <button type="button" class="audio__test" @click="emit('test')">
      Test Sound
    </button>

    <p v-if="notice" class="audio__notice" role="status">{{ notice }}</p>
  </section>
</template>

<style scoped>
.audio {
  display: grid;
  gap: 1rem;
}

.audio__heading {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.audio__rows {
  display: grid;
  gap: 0.65rem;
}

.audio__toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  font-size: 1rem;
  color: var(--text);
  cursor: pointer;
}

.audio__toggle input {
  width: 1.35rem;
  height: 1.35rem;
  accent-color: var(--accent-warm);
}

.audio__volume {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.audio__volume-label,
.audio__volume-value {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.audio__slider {
  width: 100%;
  min-height: 2rem;
  accent-color: var(--accent-warm);
}

.audio__pack {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.02);
}

.audio__pack-info {
  display: grid;
  gap: 0.15rem;
}

.audio__pack-label {
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.audio__pack-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.audio__pack-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.audio__test {
  min-height: 3rem;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-weight: 650;
  cursor: pointer;
  touch-action: manipulation;
}

.audio__test:hover {
  border-color: var(--accent);
}

.audio__notice {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 0.65rem;
  background: rgba(255, 180, 50, 0.12);
  border: 1px solid rgba(255, 180, 50, 0.35);
  color: #ffd789;
  font-size: 0.9rem;
}
</style>
