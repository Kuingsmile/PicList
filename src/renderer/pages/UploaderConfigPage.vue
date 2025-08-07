<template>
  <div class="config-container">
    <!-- Header Card -->
    <div class="config-card header-card">
      <div class="card-header">
        <h1 class="page-title">
          {{ t('pages.uploaderConfig.title') }}
        </h1>
      </div>
    </div>

    <!-- Config Items Card -->
    <div class="config-card main-card">
      <div class="config-grid">
        <div
          v-for="item in curConfigList"
          :key="item._id"
          :class="`config-item ${defaultConfigId === item._id ? 'selected' : ''}`"
          @click="() => selectItem(item._id)"
        >
          <div class="config-content">
            <div class="config-name">
              {{ item._configName }}
            </div>
            <div class="config-update-time">
              {{ formatTime(item._updatedAt) }}
            </div>
            <div
              v-if="defaultConfigId === item._id"
              class="default-badge"
            >
              {{ t('pages.uploaderConfig.selected') }}
            </div>
          </div>
          <div class="config-actions">
            <button
              class="action-btn edit-btn"
              :title="t('pages.uploaderConfig.edit')"
              @click.stop="openEditPage(item._id)"
            >
              <Edit :size="16" />
            </button>
            <button
              class="action-btn delete-btn"
              :class="curConfigList.length <= 1 ? 'disabled' : ''"
              :title="t('pages.uploaderConfig.delete')"
              :disabled="curConfigList.length <= 1"
              @click.stop="() => deleteConfig(item._id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <!-- Add New Config Button -->
        <div
          class="config-item config-item-add"
          @click="addNewConfig"
        >
          <div class="add-content">
            <Plus :size="32" />
            <span class="add-text">{{ t('pages.uploaderConfig.addNew') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <div class="config-card actions-card">
      <div class="card-actions">
        <button
          class="primary-button"
          :disabled="store?.state.defaultPicBed === type"
          @click="setDefaultPicBed(type)"
        >
          <DatabaseIcon :size="16" />
          <span>{{ t('pages.uploaderConfig.setAsDefault') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { DatabaseIcon, Edit, Plus, Trash2 } from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { useStore } from '@/hooks/useStore'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import { configPaths } from '@/utils/configPaths'
import { saveConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import type { IStringKeyMap, IUploaderConfigItem } from '#/types/types'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()

const type = ref('')
const curConfigList = ref<IStringKeyMap[]>([])
const defaultConfigId = ref('')
const store = useStore()

async function selectItem (id: string) {
  await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_SELECT, type.value, id)
  if (store?.state.defaultPicBed === type.value) {
    window.electron.sendRPC(
      IRPCActionType.TRAY_SET_TOOL_TIP,
      `${type.value} ${curConfigList.value.find(item => item._id === id)?._configName || ''}`
    )
  }
  defaultConfigId.value = id
}

onBeforeRouteUpdate((to, _, next) => {
  if (to.params.type && to.name === UPLOADER_CONFIG_PAGE) {
    type.value = to.params.type as string
    getCurrentConfigList()
  }
  next()
})

onBeforeMount(() => {
  type.value = route.params.type as string
  getCurrentConfigList()
})

async function getCurrentConfigList () {
  const configList = await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value)
  curConfigList.value = configList?.configList ?? []
  defaultConfigId.value = configList?.defaultId ?? ''
}

function openEditPage (configId: string) {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId
    },
    query: {
      defaultConfigId: defaultConfigId.value
    }
  })
}

function formatTime (time: number): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function deleteConfig (id: string) {
  confirm({
    title: t('pages.uploaderConfig.deleteTitle'),
    message: t('pages.uploaderConfig.deleteConfirm'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true
  }).then(async result => {
    if (!result) return
    const res = await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_DELETE_CONFIG, type.value, id)
    if (!res) return
    curConfigList.value = res.configList
    defaultConfigId.value = res.defaultId
    message.success(t('pages.uploaderConfig.deleteSuccess'))
  })
}

function addNewConfig () {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId: ''
    }
  })
}

function setDefaultPicBed (type: string) {
  saveConfig({
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type
  })

  store?.setDefaultPicBed(type)
  const currentConfigName = curConfigList.value.find(item => item._id === defaultConfigId.value)?._configName
  window.electron.sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${type} ${currentConfigName || ''}`)
  message.success(t('pages.uploaderConfig.setSuccess'))
}
</script>
<script lang="ts">
export default {
  name: 'UploaderConfigPage'
}
</script>
<style scoped>
/* Container */
.config-container {
  padding: 1rem;
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Card Base */
.config-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: var(--transition-medium);
  box-shadow: var(--shadow-sm);
}

.config-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

/* Header Card */
.header-card .card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border-secondary);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

/* Main Card */
.main-card {
  background: var( --color-background-tertiary);
  padding: 1.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

@media (min-width: 1200px) {
  .config-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }
}

/* Config Items */
.config-item {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  cursor: pointer;
  transition: var(--transition-medium);
  position: relative;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.config-item:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.config-item.selected {
  border-color: var(--color-accent);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.config-content {
  flex: 1;
  margin-right: 2rem;
}

.config-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.config-update-time {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.default-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: var(--color-accent);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.config-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--color-text-secondary);
}

.action-btn:hover {
  background: var(--color-surface);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.edit-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.delete-btn:hover:not(.disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.delete-btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Add New Config Item */
.config-item-add {
  border: 2px dashed var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.config-item-add:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-elevated);
  transform: translateY(-2px);
}

.add-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
}

.config-item-add:hover .add-content {
  color: var(--color-accent);
}

.add-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Actions Card */
.actions-card {
  border-radius: var(--radius-lg);
}

.card-actions {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: center;
}

.primary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
  min-width: 200px;
  justify-content: center;
}

.primary-button:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.primary-button:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .config-container {
    padding: 0.75rem;
    gap: 1rem;
  }

  .header-card .card-header {
    padding: 1rem 1.25rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .main-card {
    padding: 1rem;
  }

  .config-item {
    padding: 1rem;
    min-height: 100px;
  }

  .config-actions {
    top: 0.75rem;
    right: 0.75rem;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }

  .primary-button {
    padding: 0.75rem 1.5rem;
    min-width: 180px;
  }
}

@media (min-width: 1024px) {
  .config-container {
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
