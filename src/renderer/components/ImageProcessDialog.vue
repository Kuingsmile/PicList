<template>
  <CustomModal
    v-model:visible="visible"
    :title="t('pages.imageProcess.editor.title')"
    :scrollable="false"
    height="92vh"
    max-height="92vh"
    max-width="1120px"
  >
    <ImageProcessSetting :config-id="configId" :current-picbed-name="currentPicbedName" @done="visible = false" />
  </CustomModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import CustomModal from '@/components/common/CustomModal.vue'
import ImageProcessSetting from '@/components/ImageProcessSetting.vue'

const visible = defineModel<boolean>('visible', { required: true })
const { configId = '', currentPicbedName = '' } = defineProps<{ configId?: string; currentPicbedName?: string }>()
const { t } = useI18n()
</script>
