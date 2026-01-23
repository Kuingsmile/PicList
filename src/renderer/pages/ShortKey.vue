<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <!-- Header -->
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary p-4 shadow-md max-md:items-stretch"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <KeyboardIcon :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.shortKey.title') }}</h1>
          </div>
        </div>
      </div>

      <!-- Shortcuts Table Card -->
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <div class="h-full w-full overflow-hidden rounded-xl shadow-sm">
          <table class="w-full table-auto bg-white text-left text-sm text-main">
            <thead class="bg-bg-secondary text-sm text-main uppercase">
              <tr>
                <th class="px-6 py-4 font-semibold">{{ t('pages.shortKey.name') }}</th>
                <th class="px-6 py-4 font-semibold">{{ t('pages.shortKey.bind') }}</th>
                <th class="px-6 py-4 font-semibold">{{ t('pages.shortKey.status') }}</th>
                <th class="px-6 py-4 font-semibold">{{ t('pages.shortKey.source') }}</th>
                <th class="px-6 py-4 font-semibold">{{ t('pages.shortKey.handle') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(item, index) in list"
                :key="item.name"
                class="rounded-md transition-colors odd:bg-white even:bg-gray-50/30 hover:bg-accent/10"
              >
                <td class="px-6 py-4">
                  <div class="text-sm font-semibold text-secondary">
                    {{ item.label ? item.label : item.name }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-1">
                    <kbd
                      v-if="item.key"
                      class="rounded-md border border-b-4 border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-main shadow-sm"
                      >{{ item.key }}</kbd
                    >
                    <span v-else class="text-xs text-secondary italic">{{ t('pages.shortKey.noBinding') }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center rounded-md p-2 text-sm font-semibold text-secondary',
                      item.enable ? 'bg-success/10' : 'bg-danger/10',
                    ]"
                  >
                    {{ item.enable ? t('pages.shortKey.enabled') : t('pages.shortKey.disabled') }}
                  </span>
                </td>
                <td class="px-6 py-4 text-secondary">
                  <span class="rounded-md bg-accent/10 p-2 font-bold text-main">{{
                    calcOriginShowName(item.from || '')
                  }}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-start gap-3">
                    <button
                      :class="item.enable ? 'text-danger' : 'text-success'"
                      class="w-[80px] rounded-md border border-border p-2 text-center text-sm font-semibold transition-colors hover:bg-accent/10"
                      @click="toggleEnable(item)"
                    >
                      {{ item.enable ? t('pages.shortKey.disable') : t('pages.shortKey.enable') }}
                    </button>
                    <button
                      class="w-[80px] rounded-md border border-border p-2 text-center text-sm font-semibold text-secondary transition-colors hover:bg-accent/10"
                      @click="openKeyBindingDialog(item, index)"
                    >
                      {{ t('pages.shortKey.edit') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- Key Binding Modal -->
    <transition name="modal">
      <CustomModal
        v-if="keyBindingVisible"
        v-model:visible="keyBindingVisible"
        :title="t('pages.shortKey.changeUpload')"
        width="600px"
        height="auto"
      >
        <div class="p-4">
          <label class="mb-4 block text-sm font-semibold text-secondary">{{ t('pages.shortKey.keyBinding') }}</label>
          <input
            v-model="shortKey"
            class="box-border w-full rounded-md border border-border bg-bg-secondary p-3 text-center font-mono text-sm tracking-wider text-main focus:border-accent focus:outline-none"
            :placeholder="t('pages.shortKey.pressKeys')"
            readonly
            @keydown.prevent="keyDetect($event as KeyboardEvent)"
          />
          <div class="mt-2 text-center text-sm text-secondary">
            {{ t('pages.shortKey.pressHint') }}
          </div>
        </div>
        <template #footer>
          <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelKeyBinding" />
          <CustomButton type="primary" :text="t('common.confirm')" @click="confirmKeyBinding" />
        </template>
      </CustomModal>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { KeyboardIcon } from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import keyBinding from '@/utils/key-binding'

const { t } = useI18n()
const list = ref<IShortKeyConfig[]>([])
const keyBindingVisible = ref(false)
const command = ref('')
const shortKey = ref('')
const currentIndex = ref(0)

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

onBeforeMount(async () => {
  const shortKeyConfig = (await getConfig<IShortKeyConfigs>(configPaths.settings.shortKey._path))!
  list.value = Object.keys(shortKeyConfig).map(item => {
    return {
      ...shortKeyConfig[item],
      from: calcOrigin(item),
    }
  })
})

onBeforeUnmount(() => {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, false)
})
</script>

<script lang="ts">
export default {
  name: 'ShortkeyPage',
}
</script>
