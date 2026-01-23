<template>
  <div class="relative no-scrollbar flex h-full w-full items-center justify-center bg-bg-tertiary">
    <div
      class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-6 overflow-auto rounded-xl border-none p-8 shadow-sm"
    >
      <!-- Header Card -->
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <div class="flex flex-1 items-center gap-4">
            <img class="h-[48px] w-[48px] rounded-full object-cover" :src="defaultLogo" alt="Toolbox Logo" />
            <div class="flex flex-col gap-1">
              <h1 class="m-0 text-2xl font-semibold text-main">
                {{ t('pages.toolbox.title') }}
              </h1>
              <p class="m-0 text-sm text-secondary">
                {{ t('pages.toolbox.description') }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <template v-if="progress !== 100">
              <CustomButton
                type="primary"
                :text="t('pages.toolbox.startScan')"
                :disabled="isLoading"
                @click="handleCheck"
              />
            </template>
            <template v-else-if="isAllSuccess">
              <div class="border border-success/50 bg-bg-secondary px-5 py-3 text-sm font-semibold text-secondary">
                {{ t('pages.toolbox.success') }}
              </div>
            </template>
            <template v-else-if="!isAllSuccess">
              <template v-if="canFixLength !== 0">
                <CustomButton type="secondary" :text="t('pages.toolbox.startFix')" @click="handleFix" />
              </template>
              <template v-else>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-sm text-secondary">{{ $t('pages.toolbox.autoFixFail') }}</span>
                  <CustomButton type="secondary" :text="t('pages.toolbox.reScan')" @click="handleCheck" />
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- Progress Card -->
      <div class="w-full rounded-md border border-border-secondary shadow-sm">
        <div class="flex items-center p-2">
          <div class="relative mr-3 h-2 flex-1 overflow-hidden rounded-full bg-surface-elevated">
            <div class="absolute top-0 left-0 h-2 rounded-full bg-success" :style="{ width: `${progress}%` }" />
          </div>
          <span class="text-sm text-secondary">{{ Math.round(progress) }}%</span>
        </div>
      </div>

      <!-- Items Card -->
      <div class="w-full flex-1 overflow-hidden rounded-md border border-border-secondary shadow-sm">
        <div class="h-full w-full overflow-auto p-4">
          <div class="border border-border-secondary shadow-sm">
            <div
              v-for="(item, key) in fixList"
              :key="key"
              class="border-b border-border-secondary last:border-0 hover:bg-surface-elevated"
              :class="{
                'bg-surface-elevated': activeTypes.includes(key),
                'border-l-3 border-danger': item.status === IToolboxItemCheckStatus.ERROR,
                'border-l-3 border-success': item.status === IToolboxItemCheckStatus.SUCCESS,
                'border-l-3 border-accent': item.status === IToolboxItemCheckStatus.LOADING,
              }"
            >
              <div class="flex cursor-pointer items-center justify-between px-6 py-4" @click="toggleItem(key)">
                <div class="flex flex-1 items-center gap-3 text-sm font-semibold text-secondary">
                  <span>{{ item.title }}</span>
                  <toolbox-status-icon :status="item.status" />
                </div>
                <div class="flex items-center text-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </div>
              </div>
              <transition name="item-content">
                <div v-if="activeTypes.includes(key)" class="border-t border-border-secondary bg-surface p-2">
                  <div class="mb-3 text-sm leading-[1.5] text-secondary">
                    {{ item.msg || '' }}
                  </div>
                  <template v-if="item.handler && item.handlerText && item.value">
                    <div class="flex justify-start">
                      <toolbox-handler
                        :value="item.value"
                        :status="item.status"
                        :handler="item.handler"
                        :handler-text="item.handlerText"
                      />
                    </div>
                  </template>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import ToolboxHandler from '@/components/toolbox/ToolboxHandler.vue'
import ToolboxStatusIcon from '@/components/toolbox/ToolboxStatusIcon.vue'
import useConfirm from '@/hooks/useConfirm'
import { IRPCActionType, IToolboxItemCheckStatus, IToolboxItemType } from '@/utils/enum'

const { t } = useI18n()
const { confirm } = useConfirm()
const activeTypes = ref<string[]>([])
const defaultLogo = computed(() => `${import.meta.env.BASE_URL}roundLogo.png`)
const fixList = reactive<IToolboxMap>({
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: {
    title: t('pages.toolbox.checkConfigFileBroken'),
    status: IToolboxItemCheckStatus.INIT,
    handlerText: t('pages.toolbox.openConfigFile'),
    handler(value: string) {
      window.electron.sendRPC(IRPCActionType.OPEN_FILE, value)
    },
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: {
    title: t('pages.toolbox.checkGalleryFileBroken'),
    status: IToolboxItemCheckStatus.INIT,
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: {
    title: t('pages.toolbox.checkProblemWithClipboardPicUpload'), // picgo-image-clipboard folder
    status: IToolboxItemCheckStatus.INIT,
    handlerText: t('pages.toolbox.openFilePath'),
    handler(value: string) {
      window.electron.sendRPC(IRPCActionType.OPEN_FILE, value)
    },
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: {
    title: t('pages.toolbox.checkProblemWithProxy'),
    status: IToolboxItemCheckStatus.INIT,
    hasNoFixMethod: true,
  },
})

const progress = computed(() => {
  const total = Object.keys(fixList).length
  const done = Object.keys(fixList).filter(key => {
    const status = fixList[key].status
    return status !== IToolboxItemCheckStatus.INIT && status !== IToolboxItemCheckStatus.LOADING
  }).length
  return (done / total) * 100
})

const isAllSuccess = computed(() => {
  return Object.keys(fixList).every(key => {
    const status = fixList[key].status
    return status === IToolboxItemCheckStatus.SUCCESS
  })
})

const isLoading = computed(() => {
  return Object.keys(fixList).some(key => {
    const status = fixList[key].status
    return status === IToolboxItemCheckStatus.LOADING
  })
})

const canFixLength = computed(() => {
  return Object.keys(fixList).filter(key => {
    const status = fixList[key].status
    return status === IToolboxItemCheckStatus.ERROR && !fixList[key].hasNoFixMethod
  }).length
})

const toggleItem = (key: string) => {
  const index = activeTypes.value.indexOf(key)
  if (index > -1) {
    activeTypes.value.splice(index, 1)
  } else {
    activeTypes.value.push(key)
  }
}

const toolboxCheckResHandler = ({ type, msg = '', status, value = '' }: IToolboxCheckRes) => {
  fixList[type].status = status
  fixList[type].msg = msg
  fixList[type].value = value
  if (status === IToolboxItemCheckStatus.ERROR) {
    activeTypes.value.push(type)
  }
}

window.electron.ipcRendererOn(IRPCActionType.TOOLBOX_CHECK_RES, toolboxCheckResHandler)

const handleCheck = () => {
  activeTypes.value = []
  Object.keys(fixList).forEach(key => {
    fixList[key].status = IToolboxItemCheckStatus.LOADING
    fixList[key].msg = ''
    fixList[key].value = ''
  })
  window.electron.sendRPC(IRPCActionType.TOOLBOX_CHECK)
}

const handleFix = async () => {
  const fixRes = await Promise.all(
    Object.keys(fixList)
      .filter(key => {
        const status = fixList[key].status
        return status === IToolboxItemCheckStatus.ERROR && !fixList[key].hasNoFixMethod
      })
      .map(async key => {
        return window.electron.triggerRPC<IToolboxCheckRes>(IRPCActionType.TOOLBOX_CHECK_FIX, key)
      }),
  )

  fixRes
    .filter(item => item !== null)
    .forEach(item => {
      if (item) {
        fixList[item.type].status = item.status
        fixList[item.type].msg = item.msg
        fixList[item.type].value = item.value
      }
    })

  confirm({
    title: t('pages.toolbox.notice'),
    message: t('pages.toolbox.fixDoneNeedReload'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (!result) return
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  })
}

onUnmounted(() => {
  window.electron.ipcRendererRemoveAllListeners(IRPCActionType.TOOLBOX_CHECK_RES)
})
</script>
<script lang="ts">
export default {
  name: 'ToolBoxPage',
}
</script>
