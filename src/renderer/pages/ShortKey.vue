<template>
  <div class="shortkey-container">
    <!-- Header -->
    <div class="shortkey-header">
      <div class="header-content">
        <KeyboardIcon
          :size="24"
          class="header-icon"
        />
        <div>
          <h1>{{ t('pages.shortKey.title') }}</h1>
          <p>{{ ' ' }}</p>
        </div>
      </div>
    </div>

    <!-- Shortcuts Table Card -->
    <div class="shortkey-card">
      <div class="table-container">
        <table class="shortkey-table">
          <thead>
            <tr>
              <th>{{ t('pages.shortKey.name') }}</th>
              <th>{{ t('pages.shortKey.bind') }}</th>
              <th>{{ t('pages.shortKey.status') }}</th>
              <th>{{ t('pages.shortKey.source') }}</th>
              <th>{{ t('pages.shortKey.handle') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in list"
              :key="item.name"
              class="table-row"
            >
              <td class="name-cell">
                <div class="shortcut-name">
                  {{ item.label ? item.label : item.name }}
                </div>
              </td>
              <td class="key-cell">
                <div class="key-binding">
                  <kbd
                    v-if="item.key"
                    class="key-display"
                  >{{ item.key }}</kbd>
                  <span
                    v-else
                    class="no-binding"
                  >{{ t('pages.shortKey.noBinding') }}</span>
                </div>
              </td>
              <td class="status-cell">
                <span
                  class="status-badge"
                  :class="{ 'status-enabled': item.enable, 'status-disabled': !item.enable }"
                >
                  {{ item.enable ? t('pages.shortKey.enabled') : t('pages.shortKey.disabled') }}
                </span>
              </td>
              <td class="source-cell">
                <span class="source-name">{{ calcOriginShowName(item.from || '') }}</span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    class="btn btn-sm"
                    :class="item.enable ? 'btn-danger' : 'btn-success'"
                    @click="toggleEnable(item)"
                  >
                    {{ item.enable ? t('pages.shortKey.disable') : t('pages.shortKey.enable') }}
                  </button>
                  <button
                    class="btn btn-sm btn-secondary"
                    @click="openKeyBindingDialog(item, index)"
                  >
                    <Edit :size="14" />
                    {{ t('pages.shortKey.edit') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Key Binding Modal -->
    <transition name="modal">
      <div
        v-if="keyBindingVisible"
        class="modal-overlay"
        @click.self="cancelKeyBinding"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ t('pages.shortKey.changeUpload') }}
            </h3>
            <button
              class="modal-close"
              @click="cancelKeyBinding"
            >
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ t('pages.shortKey.keyBinding') }}</label>
              <input
                v-model="shortKey"
                class="form-input key-input"
                :placeholder="t('pages.shortKey.pressKeys')"
                readonly
                @keydown.prevent="keyDetect($event as KeyboardEvent)"
              >
              <div class="input-hint">
                {{ t('pages.shortKey.pressHint') }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="cancelKeyBinding"
            >
              {{ $t('CANCEL') }}
            </button>
            <button
              class="btn btn-primary"
              @click="confirmKeyBinding"
            >
              {{ $t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { Edit, KeyboardIcon, XIcon } from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import keyBinding from '@/utils/key-binding'
import type { IShortKeyConfig, IShortKeyConfigs } from '#/types/types'

const { t } = useI18n()
const list = ref<IShortKeyConfig[]>([])
const keyBindingVisible = ref(false)
const command = ref('')
const shortKey = ref('')
const currentIndex = ref(0)

onBeforeMount(async () => {
  const shortKeyConfig = (await getConfig<IShortKeyConfigs>(configPaths.settings.shortKey._path))!
  list.value = Object.keys(shortKeyConfig).map(item => {
    return {
      ...shortKeyConfig[item],
      from: calcOrigin(item)
    }
  })
})

watch(keyBindingVisible, (val: boolean) => {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, val)
})

function calcOrigin (item: string) {
  const [origin] = item.split(':')
  return origin
}

function calcOriginShowName (item: string) {
  return item.replace('picgo-plugin-', '')
}

function toggleEnable (item: IShortKeyConfig) {
  const status = !item.enable
  item.enable = status
  window.electron.sendRPC(IRPCActionType.SHORTKEY_BIND_OR_UNBIND, item, item.from)
}

function keyDetect (event: KeyboardEvent) {
  shortKey.value = keyBinding(event).join('+')
}

async function openKeyBindingDialog (config: IShortKeyConfig, index: number) {
  command.value = `${config.from}:${config.name}`
  shortKey.value = (await getConfig(`settings.shortKey.${command.value}.key`)) || ''
  currentIndex.value = index
  keyBindingVisible.value = true
}

async function cancelKeyBinding () {
  keyBindingVisible.value = false
  shortKey.value = (await getConfig<string>(`settings.shortKey.${command.value}.key`)) || ''
}

async function confirmKeyBinding () {
  const oldKey = await getConfig<string>(`settings.shortKey.${command.value}.key`)
  const config = { ...list.value[currentIndex.value] }
  config.key = shortKey.value
  const result = await window.electron.triggerRPC<boolean>(IRPCActionType.SHORTKEY_UPDATE, config, oldKey, config.from)
  if (result) {
    keyBindingVisible.value = false
    list.value[currentIndex.value].key = shortKey.value
  }
}

onBeforeUnmount(() => {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, false)
})
</script>

<script lang="ts">
export default {
  name: 'ShortkeyPage'
}
</script>

<style scoped>
.shortkey-container {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.shortkey-container::-webkit-scrollbar {
  display: none;
}

/* Header */
.shortkey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: var(--color-accent);
}

.shortkey-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.shortkey-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Card */
.shortkey-card {
  background: var(--color-background-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--color-border);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.shortkey-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.shortkey-table th {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.shortkey-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-secondary);
  vertical-align: middle;
}

.table-row:hover {
  background: var(--color-background-tertiary);
}

.table-row:last-child td {
  border-bottom: none;
}

/* Table Cells */
.name-cell {
  font-weight: 500;
  color: var(--color-text-primary);
  width: 25%;
}

.key-cell {
  width: 20%;
}

.key-binding {
  display: flex;
  align-items: center;
}

.key-display {
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.no-binding {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 0.875rem;
}

.status-cell {
  width: 15%;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-enabled {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.2);
}

.status-disabled {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.source-cell {
  width: 15%;
}

.source-name {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.actions-cell {
  width: 25%;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: fit-content;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-secondary {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-accent);
}

.btn-success {
  background: #67c23a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #85ce61;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #f78989;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-background-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-secondary);
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border-secondary);
  background: var(--color-background-tertiary);
}

/* Form Elements */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.key-input {
  font-family: monospace;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: center;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: all 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .shortkey-container {
    padding: 1rem;
  }

  .shortkey-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-container {
    overflow-x: auto;
  }

  .shortkey-table th,
  .shortkey-table td {
    padding: 0.75rem 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .modal-content {
    margin: 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .shortkey-container {
    padding: 0.75rem;
  }

  .shortkey-header h1 {
    font-size: 1.25rem;
  }

  .shortkey-table {
    font-size: 0.875rem;
  }

  .shortkey-table th,
  .shortkey-table td {
    padding: 0.5rem 0.375rem;
  }
}

/* Focus styles for accessibility */
.btn:focus-visible,
.modal-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.form-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
