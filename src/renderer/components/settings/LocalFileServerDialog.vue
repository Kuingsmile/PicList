<template>
  <CustomModal
    v-model:visible="visible"
    :title="t('pages.localFileServer.title')"
    width="560px"
    height="auto"
    :close-disabled="saving"
  >
    <div v-if="draft" class="flex flex-col gap-4 p-5">
      <CustomSwitch v-model="draft.enable" :title="t('pages.localFileServer.enable')" :disabled="saving" small />
      <template v-if="draft.enable">
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <CustomInput
              v-model="draft.root"
              :title="t('pages.localFileServer.folder')"
              placeholder=""
              :disabled="saving"
            />
          </div>
          <CustomButton
            type="secondary"
            :text="t('pages.imageProcess.studio.browse')"
            :disabled="saving"
            @click="chooseFolder"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <CustomInput
            v-model.trim="draft.host"
            :title="t('pages.settings.advanced.serverHost')"
            placeholder="127.0.0.1"
            :disabled="saving"
          />
          <CustomInput
            v-model="draft.port"
            type="number"
            min="1"
            max="65535"
            :title="t('pages.settings.advanced.serverPort')"
            placeholder="37777"
            :disabled="saving"
          />
        </div>
        <p class="text-sm text-secondary">{{ t('pages.localFileServer.hint', { url: baseUrl }) }}</p>
      </template>
    </div>
    <p v-else class="p-5" role="status">{{ t('pages.configForm.loading') }}</p>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" :disabled="saving" @click="visible = false" />
      <CustomButton :text="t('common.save')" :disabled="!draft" :loading="saving" @click="save" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import useMessage from '@/composables/useMessage'
import { invokeRPC, showRpcError } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'
import { RpcError } from '#/rpc'

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const message = useMessage()
const draft = ref<ILocalFileServerConfig>()
const saving = ref(false)
const baseUrl = computed(() => {
  const host = draft.value?.host || '127.0.0.1'
  const address = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '[::1]' : host.includes(':') ? `[${host}]` : host
  return `http://${address}:${draft.value?.port}/`
})

onMounted(async () => {
  try {
    draft.value = await window.electron.triggerRPC<ILocalFileServerConfig>(IRPCActionType.GET_LOCAL_FILE_SERVER)
  } catch (error) {
    showRpcError(error)
    visible.value = false
  }
})

async function chooseFolder() {
  if (!draft.value) return
  const paths = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG, {
    properties: ['openDirectory'],
    defaultPath: draft.value.root,
  })
  if (paths?.length) draft.value.root = paths[0]
}

async function save() {
  if (!draft.value || saving.value) return
  saving.value = true
  try {
    await invokeRPC(IRPCActionType.SAVE_LOCAL_FILE_SERVER, { ...draft.value, port: Number(draft.value.port) })
    visible.value = false
  } catch (error) {
    if (error instanceof RpcError && error.code === 'FILE_SERVER_ROOT')
      message.error(t('pages.localFileServer.invalidFolder'))
    else if (error instanceof RpcError && error.code === 'FILE_SERVER_ADDRESS')
      message.error(t('pages.localFileServer.invalidAddress'))
    else showRpcError(error)
  } finally {
    saving.value = false
  }
}
</script>
