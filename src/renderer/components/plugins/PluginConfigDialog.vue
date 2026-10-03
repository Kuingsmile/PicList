<template>
  <CustomModal
    v-model:visible="dialogVisible"
    :title="t('pages.plugin.configThing', { c: configName })"
    width="600px"
    height="auto"
  >
    <div class="flex-1 overflow-y-auto p-4">
      <ConfigForm :id="configName" ref="$configForm" :config :type="currentType" mode="plugin" />
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
      <CustomButton
        :text="t('common.confirm')"
        :disabled="!$configForm || $configForm.isLoading || $configForm.loadFailed"
        @click="handleConfirmConfig"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import ConfigForm from '@/components/UnifiedConfigForm.vue'
import { saveConfig } from '@/services/configService'

const dialogVisible = defineModel<boolean>('visible', { required: true })
defineProps<{ configName: string; currentType: 'plugin' | 'uploader' | 'transformer'; config: any[] }>()
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const $configForm = useTemplateRef('$configForm')

async function handleConfirmConfig() {
  const configForm = $configForm.value
  if (!configForm) return

  const result = await configForm.validate()
  if (result !== false) {
    if (!(await saveConfig(configForm.getConfigType(), result))) return
    if ('Notification' in window) {
      const successNotification = new Notification(t('pages.plugin.setResult'), {
        body: t('pages.plugin.setSuccess'),
      })
      successNotification.onclick = () => {
        return true
      }
    }
    dialogVisible.value = false
    emit('saved')
  }
}
</script>
