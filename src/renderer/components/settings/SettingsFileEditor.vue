<template>
  <CustomModal v-model:visible="editorVisible" :title="`${t('common.edit')} · ${currentEditFile}`">
    <Editor v-model="editorContent" :language="editorLanguage" />
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="editorVisible = false" />
      <CustomButton :text="t('common.save')" :loading="savingEditor" @click="saveEditorContent" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import useMessage from '@/composables/useMessage'
import { invokeRPC, showRpcError } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'

const Editor = defineAsyncComponent(() => import('@/components/Editor.vue'))

const editorVisible = ref(false)

const savingEditor = ref(false)

const editorContent = ref('')

const editorLanguage = ref('json')

const currentEditFile = ref('')

const buildInThemesList = [
  'adwaita.css',
  'anime.css',
  'bilibili.css',
  'Catppuccin.css',
  'CoolApk.css',
  'Cupertino.css',
  'default.css',
  'goldensand.css',
  'Huorong.css',
  'purple.css',
  'wechat.css',
  'win11.css',
]
const { t } = useI18n()
const message = useMessage()
const emit = defineEmits<{ 'theme-saved': [] }>()
async function editFile(file: string) {
  const content = (await window.electron.triggerRPC<string>(IRPCActionType.READ_FILE_CONTENT, file)) || ''
  try {
    editorContent.value = JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    editorContent.value = content
  }
  currentEditFile.value = file
  editorLanguage.value = 'json'
  editorVisible.value = true
}

async function saveEditorContent() {
  if (savingEditor.value) return
  savingEditor.value = true
  const content = editorContent.value
  try {
    if (currentEditFile.value === 'data.json' || currentEditFile.value === 'manage.json') {
      if (!(await saveFile(currentEditFile.value, content))) return
      if (editorContent.value === content) {
        editorVisible.value = false
        window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
      }
    } else if (currentEditFile.value.endsWith('.css')) {
      const themeFileName = buildInThemesList.includes(currentEditFile.value)
        ? `custom-${currentEditFile.value}`
        : currentEditFile.value
      await invokeRPC(IRPCActionType.THEME_WRITE_THEME, themeFileName, content)
      message.success(t('pages.settings.advanced.saveFileSuccess'))
      if (editorContent.value === content) editorVisible.value = false
      emit('theme-saved')
      await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, themeFileName)
    }
  } catch (error) {
    showRpcError(error)
  } finally {
    savingEditor.value = false
  }
}

async function saveFile(file: string, content: string) {
  let formattedContent: string
  try {
    formattedContent = JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    message.error(t('pages.settings.advanced.invalidJson'))
    return false
  }
  try {
    await invokeRPC(IRPCActionType.WRITE_FILE_CONTENT, file, formattedContent)
    message.success(t('pages.settings.advanced.saveFileSuccess'))
    return true
  } catch (error) {
    showRpcError(error)
    return false
  }
}
async function editTheme(file: string) {
  try {
    editorContent.value = (await window.electron.triggerRPC<string>(IRPCActionType.THEME_READ_THEME, file)) || ''
    currentEditFile.value = file
    editorLanguage.value = 'css'
    editorVisible.value = true
  } catch {
    message.error(t('pages.settings.system.getThemeContentFailed'))
  }
}
defineExpose({ editFile, editTheme })
</script>
