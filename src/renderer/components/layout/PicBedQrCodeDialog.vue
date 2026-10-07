<template>
  <CustomModal
    v-model:visible="visible"
    :title="t('navigation.picBedQrCode')"
    :description="t('navigation.qrCodeDescription')"
    height="auto"
    width="calc(100vw - 2rem)"
    max-width="46rem"
  >
    <div class="grid gap-4 p-5 max-md:p-4 sm:grid-cols-[minmax(0,1fr)_16.5rem]">
      <section class="flex min-w-0 flex-col gap-2" :aria-labelledby="listTitleId">
        <div class="flex items-center justify-between gap-2">
          <h4 :id="listTitleId" class="m-0 text-sm font-semibold text-secondary">
            {{ t('navigation.choosePicBed') }}
          </h4>
          <div v-if="configuredPicBeds.length" class="flex items-center gap-1">
            <button
              type="button"
              :disabled="selected.length === configuredPicBeds.length"
              class="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-accent transition-colors duration-fast ease-apple not-disabled:hover:bg-accent/10 focus-visible:focus-ring disabled:cursor-default disabled:opacity-40"
              @click="selected = configuredPicBeds.map(item => item.type)"
            >
              {{ t('navigation.selectAll') }}
            </button>
            <button
              type="button"
              :disabled="!selected.length"
              class="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-secondary transition-colors duration-fast ease-apple not-disabled:hover:bg-accent/10 not-disabled:hover:text-main focus-visible:focus-ring disabled:cursor-default disabled:opacity-40"
              @click="selected = []"
            >
              {{ t('common.clear') }}
            </button>
          </div>
        </div>

        <div
          v-if="loading"
          role="status"
          class="flex min-h-[10rem] items-center justify-center gap-2 rounded-lg border border-border-secondary text-sm text-secondary"
        >
          <LoaderCircle :size="16" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ t('navigation.loading') }}
        </div>
        <p
          v-else-if="!configuredPicBeds.length"
          class="m-0 flex min-h-[10rem] items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-secondary"
        >
          {{ t('navigation.noConfiguredPicBeds') }}
        </p>
        <div
          v-else
          role="group"
          :aria-labelledby="listTitleId"
          class="flex max-h-[18rem] flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-lg border border-border-secondary p-1.5"
        >
          <label
            v-for="picBed in configuredPicBeds"
            :key="picBed.type"
            class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-secondary transition-colors duration-fast ease-apple hover:bg-accent/10 has-checked:bg-accent/10 has-checked:text-main"
          >
            <input v-model="selected" type="checkbox" :value="picBed.type" class="m-0 size-4 shrink-0 accent-accent" />
            <span class="min-w-0 flex-1 truncate">{{ picBed.name }}</span>
            <span
              v-if="picBed.type === defaultPicBedG"
              class="shrink-0 rounded-full bg-accent/10 px-1.5 text-[10px] leading-4 font-semibold text-accent"
            >
              {{ t('navigation.defaultPicBed') }}
            </span>
          </label>
        </div>
      </section>

      <section
        class="flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-xl border border-border-secondary bg-bg-secondary p-4 text-center"
        aria-live="polite"
      >
        <template v-if="qrState === 'ready'">
          <div class="rounded-lg bg-white p-3 shadow-sm">
            <QrcodeVue
              :value="configString"
              :size="200"
              :margin="1"
              level="L"
              role="img"
              :aria-label="t('navigation.picBedQrCode')"
            />
          </div>
          <p class="m-0 flex items-start gap-1.5 text-left text-xs leading-normal text-secondary">
            <ShieldAlert :size="14" class="mt-px shrink-0 text-warning" aria-hidden="true" />
            {{ t('navigation.qrCodeSensitive') }}
          </p>
        </template>
        <template v-else-if="qrState === 'tooLarge'">
          <TriangleAlert :size="28" class="text-warning" aria-hidden="true" />
          <p class="m-0 text-sm text-secondary">{{ t('navigation.qrCodeTooLarge') }}</p>
        </template>
        <template v-else>
          <QrCode :size="32" class="text-tertiary" aria-hidden="true" />
          <p class="m-0 text-sm text-secondary">{{ t('navigation.qrCodeEmpty') }}</p>
        </template>
      </section>
    </div>

    <template #footer>
      <CustomButton type="secondary" :text="t('common.close')" @click="visible = false" />
      <CustomButton
        :icon="CopyIcon"
        :disabled="!selected.length"
        :text="t('navigation.copyPicBedConfig')"
        @click="copyConfig"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon, LoaderCircle, QrCode, ShieldAlert, TriangleAlert } from '@lucide/vue'
import { pick } from 'lodash-es'
import QrcodeVue from 'qrcode.vue'
import { computed, onBeforeMount, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { getConfig } from '@/services/configService'
import { showRpcError } from '@/services/rpcService'
import { SHOW_MAIN_PAGE_QRCODE } from '#/constants/ipcChannels'

// Byte-mode capacity of the largest QR code (version 40) at error correction level L.
const QR_MAX_BYTES = 2953

const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG } = usePicBed()

const visible = ref(false)
const loading = ref(false)
const picBedConfig = ref<IStringKeyMap>({})
const selected = ref<string[]>([])
const listTitleId = `qr-picbeds-${useId()}`

const configuredPicBeds = computed(() =>
  picBedG.value.filter(item => {
    const config = picBedConfig.value[item.type]
    return config && typeof config === 'object' && Object.keys(config).length > 0
  }),
)
const selectedConfig = computed(() => pick(picBedConfig.value, ...selected.value))
const configString = computed(() => (selected.value.length ? JSON.stringify(selectedConfig.value) : ''))
const qrState = computed(() => {
  if (!configString.value) return 'empty'
  return new TextEncoder().encode(configString.value).length > QR_MAX_BYTES ? 'tooLarge' : 'ready'
})

watch(visible, async (isVisible, _previous, onCleanup) => {
  if (!isVisible) return
  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })
  loading.value = true
  try {
    const config = (await getConfig<IStringKeyMap>('picBed')) || {}
    if (cancelled) return
    picBedConfig.value = config
    const available = new Set(configuredPicBeds.value.map(item => item.type))
    selected.value = selected.value.filter(type => available.has(type))
    if (!selected.value.length && available.has(defaultPicBedG.value)) selected.value = [defaultPicBedG.value]
  } catch (error) {
    if (!cancelled) showRpcError(error)
  } finally {
    if (!cancelled) loading.value = false
  }
})

function copyConfig() {
  window.electron.clipboard.writeText(JSON.stringify(selectedConfig.value, null, 2))
  message.success(t('navigation.copySuccess'))
}

let removeIpcListener: () => void = () => {}

onBeforeMount(() => {
  removeIpcListener = window.electron.ipcRendererOn(SHOW_MAIN_PAGE_QRCODE, () => {
    visible.value = true
  })
})

onBeforeUnmount(() => {
  removeIpcListener()
})
</script>
