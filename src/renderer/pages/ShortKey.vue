<template>
  <div class="shortkey-container">
    <!-- Header -->
    <div class="shortkey-header">
      <div class="header-content">
        <KeyboardIcon :size="24" class="header-icon" />
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
            <tr v-for="(item, index) in list" :key="item.name" class="table-row">
              <td class="name-cell">
                <div class="shortcut-name">
                  {{ item.label ? item.label : item.name }}
                </div>
              </td>
              <td class="key-cell">
                <div class="key-binding">
                  <kbd v-if="item.key" class="key-display">{{ item.key }}</kbd>
                  <span v-else class="no-binding">{{ t('pages.shortKey.noBinding') }}</span>
                </div>
              </td>
              <td class="status-cell">
                <span class="status-badge" :class="{ 'status-enabled': item.enable, 'status-disabled': !item.enable }">
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
                  <button class="btn btn-sm btn-secondary" @click="openKeyBindingDialog(item, index)">
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
      <div v-if="keyBindingVisible" class="modal-overlay" @click.self="cancelKeyBinding">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ t('pages.shortKey.changeUpload') }}
            </h3>
            <button class="modal-close" @click="cancelKeyBinding">
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
              />
              <div class="input-hint">
                {{ t('pages.shortKey.pressHint') }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cancelKeyBinding">
              {{ $t('common.cancel') }}
            </button>
            <button class="btn btn-primary" @click="confirmKeyBinding">
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

import { getRawData } from '@/utils/common'
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
      from: calcOrigin(item),
    }
  })
})

watch(keyBindingVisible, (val: boolean) => {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, val)
})

function calcOrigin(item: string) {
  const [origin] = item.split(':')
  return origin
}

function calcOriginShowName(item: string) {
  return item.replace('picgo-plugin-', '')
}

function toggleEnable(item: IShortKeyConfig) {
  const status = !item.enable
  item.enable = status
  window.electron.sendRPC(IRPCActionType.SHORTKEY_BIND_OR_UNBIND, getRawData(item), item.from || '')
}

function keyDetect(event: KeyboardEvent) {
  shortKey.value = keyBinding(event).join('+')
}

async function openKeyBindingDialog(config: IShortKeyConfig, index: number) {
  command.value = `${config.from}:${config.name}`
  shortKey.value = (await getConfig(`settings.shortKey.${command.value}.key`)) || ''
  currentIndex.value = index
  keyBindingVisible.value = true
}

async function cancelKeyBinding() {
  keyBindingVisible.value = false
  shortKey.value = (await getConfig<string>(`settings.shortKey.${command.value}.key`)) || ''
}

async function confirmKeyBinding() {
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
  name: 'ShortkeyPage',
}
</script>

<style scoped src="./css/ShortKey.css"></style>
