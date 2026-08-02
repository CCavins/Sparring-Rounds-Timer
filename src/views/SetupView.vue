<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import AudioSettings from '../components/AudioSettings.vue'
import DurationControl from '../components/DurationControl.vue'
import NumberStepper from '../components/NumberStepper.vue'
import PresetSelector from '../components/PresetSelector.vue'
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
}>()

const emit = defineEmits<{
  'update:config': [value: TimerConfiguration]
  start: []
  testSound: []
}>()

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

function markCustomIfNeeded(key: 'roundDurationSeconds' | 'restDurationSeconds', value: number): void {
  const preset = PRESETS.find((item) => item.id === props.config.presetId)
  if (!preset || props.config.presetId === 'custom') {
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

watch(
  () => props.config,
  (value) => saveConfiguration(value),
  { deep: true },
)

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('start')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="setup" data-testid="setup-view">
    <header class="setup__hero">
      <p class="setup__eyebrow">Interval training</p>
      <h1 class="setup__brand">Spar Timer</h1>
      <p class="setup__tagline">
        Configure rounds, rest, and prep — then fill the room with a gym-readable countdown.
      </p>
    </header>

    <div class="setup__panel">
      <PresetSelector :model-value="config.presetId" @select="onPreset" />

      <NumberStepper
        id="rounds"
        label="Rounds"
        :model-value="config.rounds"
        :min="LIMITS.rounds.min"
        :max="LIMITS.rounds.max"
        @update:model-value="patch({ rounds: $event })"
      />

      <DurationControl
        id="round-duration"
        label="Round duration"
        :model-value="config.roundDurationSeconds"
        :min="LIMITS.roundDurationSeconds.min"
        :max="LIMITS.roundDurationSeconds.max"
        :step="15"
        @update:model-value="markCustomIfNeeded('roundDurationSeconds', $event)"
      />

      <DurationControl
        id="rest-duration"
        label="Rest duration"
        :model-value="config.restDurationSeconds"
        :min="LIMITS.restDurationSeconds.min"
        :max="LIMITS.restDurationSeconds.max"
        :step="15"
        @update:model-value="markCustomIfNeeded('restDurationSeconds', $event)"
      />

      <fieldset class="setup__prep">
        <legend>Preparation countdown</legend>
        <div class="setup__prep-options">
          <label
            v-for="option in PREPARATION_OPTIONS"
            :key="option.value"
            class="setup__prep-option"
            :class="{ 'setup__prep-option--active': config.preparationDurationSeconds === option.value }"
          >
            <input
              type="radio"
              name="preparation"
              :value="option.value"
              :checked="config.preparationDurationSeconds === option.value"
              @change="patch({ preparationDurationSeconds: option.value })"
            />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>

      <AudioSettings
        :sound-enabled="config.soundEnabled"
        :warning-enabled="config.warningEnabled"
        :vibration-enabled="config.vibrationEnabled"
        :volume="config.volume"
        :notice="audioNotice"
        :vibration-supported="vibrationSupported"
        @update:sound-enabled="patch({ soundEnabled: $event })"
        @update:warning-enabled="patch({ warningEnabled: $event })"
        @update:vibration-enabled="patch({ vibrationEnabled: $event })"
        @update:volume="patch({ volume: $event })"
        @test="emit('testSound')"
      />

      <button
        type="button"
        class="setup__start"
        data-testid="start-timer"
        @click="emit('start')"
      >
        Start Timer
      </button>

      <p v-if="showIosHint" class="setup__ios-hint">
        Tip: Add Spar Timer to your Home Screen for a more app-like fullscreen experience on iOS.
      </p>
    </div>
  </section>
</template>

<style scoped>
.setup {
  min-height: 100dvh;
  padding: max(1.25rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right))
    max(1.5rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
  display: grid;
  align-content: start;
  gap: 1.5rem;
  background:
    radial-gradient(ellipse 80% 50% at 10% -10%, rgba(255, 92, 45, 0.22), transparent 55%),
    radial-gradient(ellipse 60% 40% at 90% 0%, rgba(40, 160, 255, 0.12), transparent 50%),
    linear-gradient(180deg, #121214 0%, #0a0a0b 55%, #080809 100%);
}

.setup__hero {
  max-width: 40rem;
}

.setup__eyebrow {
  margin: 0 0 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.setup__brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3.2rem, 12vw, 5.5rem);
  line-height: 0.95;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 0 40px rgba(255, 92, 45, 0.25);
}

.setup__tagline {
  margin: 0.85rem 0 0;
  max-width: 32rem;
  color: var(--text-muted);
  font-size: clamp(1rem, 2.5vw, 1.15rem);
  line-height: 1.45;
}

.setup__panel {
  display: grid;
  gap: 1.35rem;
  width: min(100%, 36rem);
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.015));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.setup__prep {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.setup__prep legend {
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0;
}

.setup__prep-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.setup__prep-option {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
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

.setup__start {
  min-height: 3.75rem;
  border: 0;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, #ff5c2d 0%, #ff8c28 55%, #ffb347 100%);
  color: #1a0800;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 36px rgba(255, 92, 45, 0.28);
  transition: transform 0.12s ease, filter 0.12s ease;
}

.setup__start:hover {
  filter: brightness(1.05);
}

.setup__start:active {
  transform: scale(0.985);
}

.setup__ios-hint {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-dim);
  line-height: 1.4;
}

@media (min-width: 900px) {
  .setup {
    grid-template-columns: minmax(16rem, 1fr) minmax(22rem, 36rem);
    align-items: center;
    gap: 3rem;
    padding-inline: clamp(2rem, 6vw, 5rem);
  }

  .setup__panel {
    justify-self: end;
  }
}
</style>
