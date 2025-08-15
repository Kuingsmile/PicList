<template>
  <div class="switch-container">
    <div class="switch-label-wrapper">
      <span class="switch-label-text">
        <span v-for="(segment, index) in segments" :key="index" :style="segment.style">
          {{ segment.text }}
        </span>
        <div v-if="tooltip" class="tooltip-wrapper">
          <div class="info-icon" @click="toggleTooltip">
            <svg viewBox="0 0 20 20" fill="currentColor" class="info-svg">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div v-show="showTooltip" class="tooltip-content">
            {{ tooltip }}
          </div>
        </div>
      </span>
    </div>
    <div class="switch-control">
      <label class="switch">
        <input v-model="value" type="checkbox" class="switch-input" />
        <span class="switch-slider">
          <span class="switch-button" />
        </span>
      </label>
      <div v-if="activeText || inactiveText" class="switch-text">
        {{ value ? activeText : inactiveText }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

defineProps<{
  tooltip?: string
  activeText?: string
  inactiveText?: string
  segments?: { text: string; style: string }[]
}>()

const value = defineModel<boolean>()
const showTooltip = ref(false)

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value
}
</script>

<style scoped>
.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
}

.switch-label-wrapper {
  flex: 1;
}

.switch-label-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.tooltip-wrapper {
  position: relative;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
  border-radius: 50%;
  padding: 2px;
}

.info-icon:hover {
  color: var(--color-accent);
  background: rgba(0, 122, 255, 0.1);
}

.info-svg {
  width: 16px;
  height: 16px;
}

.tooltip-content {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  padding: 0.75rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-text-primary);
}

.switch-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.5rem;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-border);
  border-radius: 0.75rem;
  transition: var(--transition-fast);
}

.switch-button {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 50%;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.switch-input:checked + .switch-slider {
  background: var(--color-accent);
}

.switch-input:checked + .switch-slider .switch-button {
  transform: translateX(1.5rem);
}

.switch-input:focus + .switch-slider {
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.switch-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 50px;
}

.switch-input:checked ~ .switch-text {
  color: var(--color-accent);
}

/* Dark mode adjustments */
:root.dark .switch-slider,
:root.auto.dark .switch-slider {
  background: var(--color-border);
}

:root.dark .tooltip-content,
:root.auto.dark .tooltip-content {
  background: var(--color-surface-elevated);
  border-color: var(--color-border);
}
</style>
