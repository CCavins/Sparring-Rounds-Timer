<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DurationControl from '../components/DurationControl.vue'
import NumberStepper from '../components/NumberStepper.vue'
import PresetSelector from '../components/PresetSelector.vue'
import SavedPresetsModal from '../components/SavedPresetsModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import SoundPackModal from '../components/SoundPackModal.vue'
import type { SavedCustomPreset } from '../types/presets'
import { DEFAULT_SOUND_PACK_ID } from '../types/sounds'
import {
  LIMITS,
  PREPARATION_OPTIONS,
  PRESETS,
  type TimerConfiguration,
} from '../types/timer'
import { saveConfiguration } from '../utils/storage'

const props = defineProps<{
  config: TimerConfiguration
  audioNotice?: string
  showIosHint?: boolean
  playingPackId?: string | null
}>()

const emit = defineEmits<{
  'update:config': [value: TimerConfiguration]
  start: []
  testSound: []
  previewSound: [packId: string]
}>()

const settingsOpen = ref(false)
const savedOpen = ref(false)
const soundModalOpen = ref(false)

const vibrationSupported = computed(
  () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
)

function patch(partial: Partial<TimerConfiguration>): void {
  const next = { ...props.config, ...partial }
  emit('update:config', next)
  saveConfiguration(next)
}

function onPreset(id: string): void {
  const preset = PRESETS.find((item) => item.id === id)
  if (!preset) return
  if (id === 'custom') {
    patch({ presetId: 'custom' })
    return
  }
  patch({
    presetId: id,
    roundDurationSeconds: preset.roundDurationSeconds,
    restDurationSeconds: preset.restDurationSeconds,
  })
}

function markCustomIfNeeded(
  key: 'roundDurationSeconds' | 'restDurationSeconds',
  value: number,
): void {
  const presetId = props.config.presetId
  if (!presetId || presetId === 'custom' || presetId.startsWith('saved:')) {
    patch({ [key]: value, presetId: 'custom' })
    return
  }
  const preset = PRESETS.find((item) => item.id === presetId)
  if (!preset) {
    patch({ [key]: value, presetId: 'custom' })
    return
  }
  const nextRound = key === 'roundDurationSeconds' ? value : props.config.roundDurationSeconds
  const nextRest = key === 'restDurationSeconds' ? value : props.config.restDurationSeconds
  const matches =
    nextRound === preset.roundDurationSeconds && nextRest === preset.restDurationSeconds
  patch({
    [key]: value,
    presetId: matches ? props.config.presetId : 'custom',
  })
}

function loadSavedPreset(preset: SavedCustomPreset): void {
  patch({
    presetId: `saved:${preset.id}`,
    rounds: preset.rounds,
    roundDurationSeconds: preset.roundDurationSeconds,
    restDurationSeconds: preset.restDurationSeconds,
    preparationDurationSeconds: preset.preparationDurationSeconds,
  })
}

function resetSoundPack(): void {
  patch({ soundPackId: DEFAULT_SOUND_PACK_ID })
  emit('previewSound', DEFAULT_SOUND_PACK_ID)
}

function openSoundPacks(): void {
  soundModalOpen.value = true
}

watch(
  () => props.config,
  (value) => saveConfiguration(value),
  { deep: true },
)

function onKeydown(event: KeyboardEvent): void {
  if (settingsOpen.value || savedOpen.value || soundModalOpen.value) return
  const target = event.target as HTMLElement | null
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('start')
  }
}

onMounted(() => {
  document.documentElement.classList.add('setup-active')
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.documentElement.classList.remove('setup-active')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <section class="setup" data-testid="setup-view">
    <header class="setup__top">
      <div class="setup__brand-block">
        <h1 class="setup__brand">Spar Timer</h1>
        <p class="setup__tagline">Rounds · Rest · Go</p>
      </div>
      <div class="setup__top-actions">
        <button type="button" class="setup__chip" @click="savedOpen = true">Saved</button>
        <button
          type="button"
          class="setup__icon"
          aria-label="Open settings"
          title="Settings"
          @click="settingsOpen = true"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.1 2.7-1.1-.2a6.8 6.8 0 0 0-.7-1.7l.7-.9a1 1 0 0 0-.1-1.3l-1.4-1.4a1 1 0 0 0-1.3-.1l-.9.7a6.8 6.8 0 0 0-1.7-.7l-.2-1.1A1 1 0 0 0 12.4 3h-2a1 1 0 0 0-1 .8l-.2 1.1a6.8 6.8 0 0 0-1.7.7l-.9-.7a1 1 0 0 0-1.3.1L3.9 6.4a1 1 0 0 0-.1 1.3l.7.9a6.8 6.8 0 0 0-.7 1.7l-1.1.2a1 1 0 0 0-.8 1v2a1 1 0 0 0 .8 1l1.1.2c.16.6.4 1.17.7 1.7l-.7.9a1 1 0 0 0 .1 1.3l1.4 1.4a1 1 0 0 0 1.3.1l.9-.7c.53.3 1.1.54 1.7.7l.2 1.1a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.2-1.1c.6-.16 1.17-.4 1.7-.7l.9.7a1 1 0 0 0 1.3-.1l1.4-1.4a1 1 0 0 0 .1-1.3l-.7-.9c.3-.53.54-1.1.7-1.7l1.1-.2a1 1 0 0 0 .8-1v-2a1 1 0 0 0-.8-1Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </header>

    <div class="setup__body">
      <PresetSelector compact :model-value="config.presetId" @select="onPreset" />

      <div class="setup__controls">
        <NumberStepper
          id="rounds"
          label="Rounds"
          compact
          :model-value="config.rounds"
          :min="LIMITS.rounds.min"
          :max="LIMITS.rounds.max"
          @update:model-value="patch({ rounds: $event })"
        />
        <DurationControl
          id="round-duration"
          label="Round"
          compact
          :model-value="config.roundDurationSeconds"
          :min="LIMITS.roundDurationSeconds.min"
          :max="LIMITS.roundDurationSeconds.max"
          :step="15"
          @update:model-value="markCustomIfNeeded('roundDurationSeconds', $event)"
        />
        <DurationControl
          id="rest-duration"
          label="Rest"
          compact
          :model-value="config.restDurationSeconds"
          :min="LIMITS.restDurationSeconds.min"
          :max="LIMITS.restDurationSeconds.max"
          :step="15"
          @update:model-value="markCustomIfNeeded('restDurationSeconds', $event)"
        />
      </div>

      <fieldset class="setup__prep">
        <legend>Prep</legend>
        <div class="setup__prep-options">
          <label
            v-for="option in PREPARATION_OPTIONS"
            :key="option.value"
            class="setup__prep-option"
            :class="{
              'setup__prep-option--active': config.preparationDurationSeconds === option.value,
            }"
          >
            <input
              type="radio"
              name="preparation"
              :value="option.value"
              :checked="config.preparationDurationSeconds === option.value"
              @change="patch({ preparationDurationSeconds: option.value })"
            />
            <span>{{ option.value === 0 ? 'Off' : `${option.value}s` }}</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="setup__footer">
      <button
        type="button"
        class="setup__start"
        data-testid="start-timer"
        @click="emit('start')"
      >
        Start
      </button>
    </div>

    <SettingsModal
      :open="settingsOpen"
      :sound-enabled="config.soundEnabled"
      :warning-enabled="config.warningEnabled"
      :vibration-enabled="config.vibrationEnabled"
      :volume="config.volume"
      :sound-pack-id="config.soundPackId"
      :notice="audioNotice"
      :vibration-supported="vibrationSupported"
      :show-ios-hint="showIosHint"
      @close="settingsOpen = false"
      @update:sound-enabled="patch({ soundEnabled: $event })"
      @update:warning-enabled="patch({ warningEnabled: $event })"
      @update:vibration-enabled="patch({ vibrationEnabled: $event })"
      @update:volume="patch({ volume: $event })"
      @test="emit('testSound')"
      @open-sound-packs="openSoundPacks"
      @reset-sound-pack="resetSoundPack"
    />

    <SavedPresetsModal
      :open="savedOpen"
      :config="config"
      @close="savedOpen = false"
      @load="loadSavedPreset"
    />

    <SoundPackModal
      :open="soundModalOpen"
      :model-value="config.soundPackId"
      :playing-pack-id="playingPackId"
      @update:model-value="patch({ soundPackId: $event })"
      @close="soundModalOpen = false"
      @preview="emit('previewSound', $event)"
      @reset="patch({ soundPackId: DEFAULT_SOUND_PACK_ID })"
    />
  </section>
</template>

<style scoped>
.setup {
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.55rem;
  padding:
    max(0.5rem, env(safe-area-inset-top))
    max(0.75rem, env(safe-area-inset-right))
    max(0.55rem, env(safe-area-inset-bottom))
    max(0.75rem, env(safe-area-inset-left));
  background:
    radial-gradient(ellipse 80% 45% at 12% -8%, rgba(255, 92, 45, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 35% at 92% 0%, rgba(40, 160, 255, 0.1), transparent 50%),
    linear-gradient(180deg, #121214 0%, #0a0a0b 55%, #080809 100%);
}

.setup__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  min-height: 2.5rem;
}

.setup__brand-block {
  min-width: 0;
}

.setup__brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 5.8vw, 2.1rem);
  line-height: 1;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.setup__tagline {
  margin: 0.18rem 0 0;
  color: var(--text-dim);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.setup__top-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.setup__chip,
.setup__icon {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  touch-action: manipulation;
}

.setup__chip {
  min-height: 2.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.setup__icon {
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
}

.setup__icon svg {
  width: 1.15rem;
  height: 1.15rem;
}

.setup__body {
  min-height: 0;
  overflow: hidden;
  display: grid;
  align-content: start;
  gap: 0.55rem;
  width: min(100%, 42rem);
  margin-inline: auto;
}

.setup__controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.setup__prep {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.setup__prep legend {
  font-family: var(--font-display);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0;
}

.setup__prep-options {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 0.1rem;
}

.setup__prep-options::-webkit-scrollbar {
  display: none;
}

.setup__prep-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1 0 auto;
  min-height: 2.25rem;
  min-width: 2.75rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 650;
  touch-action: manipulation;
}

.setup__prep-option input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  clip: rect(0, 0, 0, 0);
}

.setup__prep-option--active {
  border-color: var(--phase-prep);
  color: #ffe7a8;
  background: rgba(255, 196, 60, 0.12);
}

.setup__footer {
  width: min(100%, 42rem);
  margin-inline: auto;
}

.setup__start {
  width: 100%;
  min-height: 3.25rem;
  border: 0;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, #ff5c2d 0%, #ff8c28 55%, #ffb347 100%);
  color: #1a0800;
  font-family: var(--font-display);
  font-size: 1.3rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(255, 92, 45, 0.26);
  touch-action: manipulation;
}

.setup__start:active {
  transform: scale(0.985);
}

@media (max-width: 420px) {
  .setup__controls {
    grid-template-columns: 1fr 1fr;
  }

  .setup__controls > :first-child {
    grid-column: 1 / -1;
  }
}

@media (max-height: 700px) {
  .setup {
    gap: 0.4rem;
  }

  .setup__tagline {
    display: none;
  }

  .setup__body {
    gap: 0.4rem;
  }

  .setup__start {
    min-height: 3rem;
    font-size: 1.15rem;
  }
}

@media (max-height: 560px) {
  .setup__brand {
    font-size: 1.35rem;
  }

  .setup__chip {
    min-height: 2.1rem;
  }

  .setup__icon {
    width: 2.1rem;
    height: 2.1rem;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .setup {
    gap: 0.3rem;
    padding-top: max(0.3rem, env(safe-area-inset-top));
    padding-bottom: max(0.3rem, env(safe-area-inset-bottom));
  }

  .setup__controls {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .setup__controls > :first-child {
    grid-column: auto;
  }

  .setup__tagline {
    display: none;
  }
}
</style>
