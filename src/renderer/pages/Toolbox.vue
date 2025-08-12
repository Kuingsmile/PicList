<template>
  <div class="toolbox-container">
    <!-- Header Card -->
    <div class="toolbox-card header-card">
      <div class="card-header">
        <div class="header-content">
          <img
            class="header-logo"
            :src="defaultLogo"
            alt="Toolbox Logo"
          >
          <div class="header-text">
            <h1 class="header-title">
              {{ t('pages.toolbox.title') }}
            </h1>
            <p class="header-subtitle">
              {{ t('pages.toolbox.description') }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <template v-if="progress !== 100">
            <button
              class="action-button"
              :class="{ disabled: isLoading }"
              :disabled="isLoading"
              @click="handleCheck"
            >
              <span>{{ t('pages.toolbox.startScan') }}</span>
            </button>
          </template>
          <template v-else-if="isAllSuccess">
            <div class="success-tips">
              {{ t('pages.toolbox.success') }}
            </div>
          </template>
          <template v-else-if="!isAllSuccess">
            <template v-if="canFixLength !== 0">
              <button
                class="action-button"
                @click="handleFix"
              >
                <span>{{ t('pages.toolbox.startFix') }}</span>
              </button>
            </template>
            <template v-else>
              <div class="cant-fix-container">
                <span class="cant-fix-text">{{ $t('pages.toolbox.autoFixFail') }}</span>
                <button
                  class="action-button secondary small"
                  @click="handleCheck"
                >
                  <span>{{ t('pages.toolbox.reScan') }}</span>
                </button>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Progress Card -->
    <div class="toolbox-card progress-card">
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <span class="progress-text">{{ Math.round(progress) }}%</span>
      </div>
    </div>

    <!-- Items Card -->
    <div class="toolbox-card items-card">
      <div class="items-list">
        <div
          v-for="(item, key) in fixList"
          :key="key"
          class="item"
          :class="{
            'item-active': activeTypes.includes(key),
            'item-error': item.status === IToolboxItemCheckStatus.ERROR,
            'item-success': item.status === IToolboxItemCheckStatus.SUCCESS,
            'item-loading': item.status === IToolboxItemCheckStatus.LOADING
          }"
        >
          <div
            class="item-header"
            @click="toggleItem(key)"
          >
            <div class="item-title">
              <span>{{ item.title }}</span>
              <toolbox-status-icon :status="item.status" />
            </div>
            <div class="item-chevron">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>
          </div>
          <transition name="item-content">
            <div
              v-if="activeTypes.includes(key)"
              class="item-content"
            >
              <div class="item-message">
                {{ item.msg || '' }}
              </div>
              <template v-if="item.handler && item.handlerText && item.value">
                <div class="item-actions">
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
</template>

<script lang="ts" setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ToolboxHandler from '@/components/ToolboxHandler.vue'
import ToolboxStatusIcon from '@/components/ToolboxStatusIcon.vue'
import useConfirm from '@/hooks/useConfirm'
import { IRPCActionType, IToolboxItemCheckStatus, IToolboxItemType } from '@/utils/enum'
import type { IToolboxCheckRes } from '#/types/rpc'
import type { IToolboxMap } from '#/types/view'

const { t } = useI18n()
const { confirm } = useConfirm()
const activeTypes = ref<string[]>([])
const defaultLogo = computed(() => `${import.meta.env.BASE_URL}roundLogo.png`)
const fixList = reactive<IToolboxMap>({
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: {
    title: t('pages.toolbox.checkConfigFileBroken'),
    status: IToolboxItemCheckStatus.INIT,
    handlerText: t('pages.toolbox.openConfigFile'),
    handler (value: string) {
      window.electron.sendRPC(IRPCActionType.OPEN_FILE, value)
    }
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: {
    title: t('pages.toolbox.checkGalleryFileBroken'),
    status: IToolboxItemCheckStatus.INIT
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: {
    title: t('pages.toolbox.checkProblemWithClipboardPicUpload'), // picgo-image-clipboard folder
    status: IToolboxItemCheckStatus.INIT,
    handlerText: t('pages.toolbox.openFilePath'),
    handler (value: string) {
      window.electron.sendRPC(IRPCActionType.OPEN_FILE, value)
    }
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: {
    title: t('pages.toolbox.checkProblemWithProxy'),
    status: IToolboxItemCheckStatus.INIT,
    hasNoFixMethod: true
  }
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
      })
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
    center: true
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
  name: 'ToolBoxPage'
}
</script>

<style scoped src="./css/ToolboxPage.css"></style>
