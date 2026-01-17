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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  background: var(--color-background-secondary);
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
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: 2px;
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
  cursor: pointer;
}

.info-icon:hover {
  color: var(--color-accent);
  background: var(--color-background-secondary);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  min-width: 200px;
  max-width: 300px;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  line-height: 1.4;
}

.switch-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 20px;
}

.switch-input {
  width: 0;
  height: 0;
  opacity: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(180deg, #d0d3d9 0%, #c0c4cc 100%);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 15%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.switch-button {
  position: absolute;
  bottom: 2px;
  left: 2px;
  border-radius: 50%;
  width: 17px;
  height: 17px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
  box-shadow:
    0 2px 6px rgb(0 0 0 / 20%),
    0 1px 2px rgb(0 0 0 / 10%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  content: '';
}

.switch-input:checked + .switch-slider {
  background: var(--color-accent);
  box-shadow:
    inset 0 1px 3px rgb(0 0 0 / 10%),
    0 2px 8px color-mix(in srgb, var(--color-accent), transparent 30%);
}

.switch-input:checked + .switch-slider .switch-button {
  transform: translateX(23px);
}

.switch-input:focus + .switch-slider {
  box-shadow: 0 0 0 2px rgb(0 122 255 / 20%);
}

.switch-text {
  min-width: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.switch-input:checked ~ .switch-text {
  color: var(--color-accent);
}
</style>
