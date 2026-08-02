<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DurationControl from '../components/DurationControl.vue'
import NumberStepper from '../components/NumberStepper.vue'
import PresetSelector from '../components/PresetSelector.vue'
import SettingsModal from '../components/SettingsModal.vue'
import SoundPackModal from '../components/SoundPackModal.vue'
import type { SavedCustomPreset } from '../types/presets'
import { DEFAULT_SOUND_PACK_ID, getSoundPack } from '../types/sounds'
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
const soundModalOpen = ref(false)

const vibrationSupported = computed(
  () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
)

const soundPackLabel = computed(() => getSoundPack(props.config.soundPackId).label)

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
  // Always write fresh round/rest values so duration inputs re-sync on iOS.
  patch({
    presetId: id,
    roundDurationSeconds: Number(preset.roundDurationSeconds),
    restDurationSeconds: Number(preset.restDurationSeconds),
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

function persistNow(): void {
  saveConfiguration(props.config)
}

function onVisibilityPersist(): void {
  if (document.visibilityState === 'hidden') persistNow()
}

function onKeydown(event: KeyboardEvent): void {
  if (settingsOpen.value || soundModalOpen.value) return
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
  // iOS Safari can drop in-memory state on background; flush storage on hide.
  window.addEventListener('pagehide', persistNow)
  document.addEventListener('visibilitychange', onVisibilityPersist)
})

onUnmounted(() => {
  document.documentElement.classList.remove('setup-active')
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', persistNow)
  document.removeEventListener('visibilitychange', onVisibilityPersist)
  persistNow()
})
</script>

<template>
  <section class="setup" data-testid="setup-view">
    <header class="setup__top">
      <div class="setup__brand-block">
        <h1 class="setup__brand">Spar Timer</h1>
        <p class="setup__tagline">Rounds · Rest · Go</p>
      </div>
      <button
        type="button"
        class="setup__settings"
        data-testid="open-settings"
        aria-label="Open settings"
        @click="settingsOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.1 2.7-1.1-.2a6.8 6.8 0 0 0-.7-1.7l.7-.9a1 1 0 0 0-.1-1.3l-1.4-1.4a1 1 0 0 0-1.3-.1l-.9.7a6.8 6.8 0 0 0-1.7-.7l-.2-1.1A1 1 0 0 0 12.4 3h-2a1 1 0 0 0-1 .8l-.2 1.1a6.8 6.8 0 0 0-1.7.7l-.9-.7a1 1 0 0 0-1.3.1L3.9 6.4a1 1 0 0 0-.1 1.3l.7.9a6.8 6.8 0 0 0-.7 1.7l-1.1.2a1 1 0 0 0-.8 1v2a1 1 0 0 0 .8 1l1.1.2c.16.6.4 1.17.7 1.7l-.7.9a1 1 0 0 0 .1 1.3l1.4 1.4a1 1 0 0 0 1.3.1l.9-.7c.53.3 1.1.54 1.7.7l.2 1.1a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.2-1.1c.6-.16 1.17-.4 1.7-.7l.9.7a1 1 0 0 0 1.3-.1l1.4-1.4a1 1 0 0 0 .1-1.3l-.7-.9c.3-.53.54-1.1.7-1.7l1.1-.2a1 1 0 0 0 .8-1v-2a1 1 0 0 0-.8-1Z"
            fill="currentColor"
          />
        </svg>
        <span class="setup__settings-copy">
          <span class="setup__settings-label">Settings</span>
          <span class="setup__settings-meta">{{ soundPackLabel }}</span>
        </span>
      </button>
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
          :key="`round-${config.presetId}-${config.roundDurationSeconds}`"
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
          :key="`rest-${config.presetId}-${config.restDurationSeconds}`"
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
      :config="config"
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
      @load-saved="loadSavedPreset"
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
  gap: clamp(0.55rem, 2.2vh, 1.25rem);
  padding:
    max(0.85rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(0.85rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  background:
    radial-gradient(ellipse 80% 45% at 12% -8%, rgba(255, 92, 45, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 35% at 92% 0%, rgba(40, 160, 255, 0.1), transparent 50%),
    linear-gradient(180deg, #121214 0%, #0a0a0b 55%, #080809 100%);
}

.setup__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  min-height: 3rem;
}

.setup__brand-block {
  min-width: 0;
}

.setup__brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 6.5vw, 2.55rem);
  line-height: 1;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.setup__tagline {
  margin: 0.3rem 0 0;
  color: var(--text-dim);
  font-size: 0.88rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.setup__settings {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 3rem;
  max-width: min(48vw, 13rem);
  padding: 0.4rem 0.85rem 0.4rem 0.65rem;
  border-radius: 0.95rem;
  border: 1px solid var(--border-strong);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  cursor: pointer;
  touch-action: manipulation;
  flex-shrink: 0;
}

.setup__settings svg {
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.setup__settings-copy {
  display: grid;
  gap: 0.05rem;
  min-width: 0;
  text-align: left;
}

.setup__settings-label {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.1;
}

.setup__settings-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.setup__body {
  min-height: 0;
  overflow: hidden;
  display: grid;
  align-content: space-evenly;
  gap: clamp(0.65rem, 2.4vh, 1.35rem);
  width: min(100%, 46rem);
  margin-inline: auto;
}

.setup__controls {
  display: grid;
  /* iPhone / narrow phones: stack rounds + times for full-width readability */
  grid-template-columns: 1fr;
  gap: 0.7rem;
}

.setup__prep {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.setup__prep legend {
  font-family: var(--font-display);
  font-size: 0.86rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0;
}

.setup__prep-options {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.45rem;
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
  flex: 1 1 0;
  min-height: 2.75rem;
  min-width: 3.1rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.95rem;
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
  width: min(100%, 46rem);
  margin-inline: auto;
}

.setup__start {
  width: 100%;
  min-height: clamp(3.35rem, 7.5vh, 4.1rem);
  border: 0;
  border-radius: 1.05rem;
  background: linear-gradient(135deg, #ff5c2d 0%, #ff8c28 55%, #ffb347 100%);
  color: #1a0800;
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 3.5vh, 1.55rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(255, 92, 45, 0.28);
  touch-action: manipulation;
}

.setup__start:active {
  transform: scale(0.985);
}

@media (min-width: 700px) {
  .setup__controls {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

@media (max-height: 700px) {
  .setup {
    gap: 0.45rem;
    padding:
      max(0.55rem, env(safe-area-inset-top))
      max(0.8rem, env(safe-area-inset-right))
      max(0.55rem, env(safe-area-inset-bottom))
      max(0.8rem, env(safe-area-inset-left));
  }

  .setup__tagline {
    display: none;
  }

  .setup__body {
    align-content: start;
    gap: 0.45rem;
  }

  .setup__controls {
    gap: 0.4rem;
  }

  .setup__prep-option {
    min-height: 2.3rem;
    font-size: 0.86rem;
  }

  .setup__start {
    min-height: 3.1rem;
    font-size: 1.2rem;
  }
}

@media (max-height: 560px) {
  .setup__brand {
    font-size: 1.4rem;
  }

  .setup__settings {
    min-height: 2.35rem;
  }

  .setup__settings-meta {
    display: none;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .setup {
    gap: 0.35rem;
    padding-top: max(0.35rem, env(safe-area-inset-top));
    padding-bottom: max(0.35rem, env(safe-area-inset-bottom));
  }

  .setup__body {
    align-content: start;
  }

  .setup__controls {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .setup__tagline {
    display: none;
  }
}
</style>
