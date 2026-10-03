<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <SettingSection :title="t('pages.settings.system.languageAndAppearance')" :icon="Globe">
      <SettingCard>
        <CustomSelect
          v-model="currentLanguage"
          :select-list="languageList"
          :title="t('pages.settings.system.chooseLanguage')"
          :icon="Globe"
        />
      </SettingCard>

      <SettingCard>
        <CustomSelect v-model="currentStartMode" :title="t('pages.settings.system.startMode')" :icon="Monitor">
          <template #extra>
            <option value="quiet">{{ t('pages.settings.system.quietMode') }}</option>
            <option v-if="osGlobal !== 'darwin'" value="mini">{{ t('pages.settings.system.miniMode') }}</option>
            <option v-if="osGlobal === 'darwin'" value="no-tray">
              {{ t('pages.settings.system.noTrayMode') }}
            </option>
            <option value="main">{{ t('pages.settings.system.mainMode') }}</option>
          </template>
        </CustomSelect>
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="isDisableGPU"
          no-border
          small
          :title="t('pages.settings.system.isDisableGPU')"
          :description="t('pages.settings.system.isDisableGPUDesc')"
          @update:model-value="handleIsDisableGPUChange"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="formOfSetting.enableAdvancedAnimation"
          no-border
          small
          :title="t('pages.settings.system.enableAdvancedAnimation')"
          :description="t('pages.settings.system.enableAdvancedAnimationDesc')"
        />
      </SettingCard>

      <SettingCard class="theme-dropdown">
        <SingleSelect
          v-model="currentTheme"
          :title="t('pages.settings.system.chooseTheme')"
          :fronticon="false"
          :key-list="themeList.map(item => item.value)"
          :placeholder="themeList.find(theme => theme.value === currentTheme)?.label || ''"
        >
          <template #item="{ item }">
            {{ themeList.find(theme => theme.value === item)?.label || item }}
          </template>
        </SingleSelect>
        <template #extra>
          <div class="mt-3 flex gap-4">
            <CustomButton
              :disabled="downloadingThemes"
              :text="
                downloadingThemes
                  ? t('pages.settings.system.downloadingThemes')
                  : t('pages.settings.system.downloadThemes')
              "
              :icon-size="14"
              :icon="Download"
              type="secondary"
              @click="handleDownloadThemes"
            />
            <CustomButton
              :icon="Import"
              :text="t('pages.settings.system.importThemes')"
              type="secondary"
              :icon-size="14"
              @click="handleImportThemes"
            />
            <CustomButton
              :icon="Edit2"
              :text="t('pages.settings.system.editTheme')"
              :icon-size="14"
              @click="handleEditTheme"
            />
          </div>
        </template>
      </SettingCard>

      <SettingCard p1 class="flex flex-col justify-center">
        <CustomSwitch
          v-model="formOfSetting.enableCustomBgImg"
          no-border
          small
          :title="t('pages.settings.system.enableCustomBgImg')"
        />
      </SettingCard>

      <CustomNavCard
        v-if="formOfSetting.enableCustomBgImg"
        :icon="ImageIcon"
        :clickable="false"
        :title="t('pages.settings.system.customBgImgPath')"
      >
        <template #extra>
          <CustomButton :text="t('pages.settings.clickToSet')" @click="handleCustomBgImg" />
        </template>
      </CustomNavCard>
      <SettingCard v-if="formOfSetting.enableCustomBgImg">
        <CustomInput
          v-model="formOfSetting.customBgImgOpacity"
          type="number"
          min="0"
          max="1"
          step="0.01"
          :title="t('pages.settings.system.customBgImgOpacity')"
          placeholder="0.7"
          @blur="handleBlurCustomBgImgOpacity"
        />
      </SettingCard>
      <SettingCard v-if="formOfSetting.enableCustomBgImg">
        <CustomInput
          v-model="formOfSetting.customBgImgBlur"
          type="number"
          min="1"
          step="1"
          :title="t('pages.settings.system.customBgImgBlur')"
          placeholder="5"
          @blur="handleBlurCustomBgImgBlur"
        />
      </SettingCard>
    </SettingSection>

    <!-- Window Behavior Section -->
    <SettingSection :icon="Monitor" :title="t('pages.settings.system.windowBehavior')">
      <!-- Main Window Size Card -->

      <CustomNavCard
        :title="t('pages.settings.system.mainWindowSize')"
        :icon="Monitor"
        @click="mainWindowSizeVisible = true"
      />
      <!-- Window Behavior Toggles -->

      <SettingCard v-if="osGlobal === 'darwin'" p1>
        <CustomSwitch
          v-model="formOfSetting.isHideDock"
          small
          no-border
          :title="t('pages.settings.system.isHideDock')"
          @change="handleHideDockChange"
        />
      </SettingCard>

      <SettingCard v-if="osGlobal !== 'darwin'" p1>
        <CustomSwitch
          v-model="formOfSetting.autoCloseMiniWindow"
          small
          no-border
          :title="t('pages.settings.system.autoCloseMiniWindow')"
        />
      </SettingCard>

      <SettingCard v-if="osGlobal !== 'darwin'" p1>
        <CustomSwitch
          v-model="formOfSetting.autoCloseMainWindow"
          small
          no-border
          :title="t('pages.settings.system.autoCloseMainWindow')"
        />
      </SettingCard>

      <SettingCard v-if="osGlobal !== 'darwin'" p1>
        <CustomSwitch
          v-model="formOfSetting.miniWindowOntop"
          small
          no-border
          :title="t('pages.settings.system.miniWindowOnTop')"
          @change="handleMiniWindowOntop"
        />
      </SettingCard>

      <SettingCard v-if="osGlobal !== 'darwin'" p1>
        <CustomSwitch
          v-model="formOfSetting.isCustomMiniIcon"
          small
          no-border
          :title="t('pages.settings.system.isCustomMiniIcon')"
        />
      </SettingCard>

      <CustomNavCard
        v-if="osGlobal !== 'darwin' && formOfSetting.isCustomMiniIcon"
        :icon="ImageIcon"
        :clickable="false"
        :title="t('pages.settings.system.customMiniIconPath')"
      >
        <template #extra>
          <CustomButton :text="t('pages.settings.clickToSet')" @click="handleMiniIconPath" />
        </template>
      </CustomNavCard>
    </SettingSection>
    <!-- Startup & Shortcuts Section -->
    <SettingSection :icon="Keyboard" :title="t('pages.settings.system.startupAndShortcuts')">
      <!-- Auto Launch Toggle -->
      <SettingCard p1>
        <CustomSwitch
          v-model="formOfSetting.autoStart"
          small
          no-border
          :title="t('pages.settings.system.autoLaunch')"
          :description="t('pages.settings.system.autoLaunchDesc')"
          @change="handleAutoStartChange"
        />
      </SettingCard>
      <CustomNavCard
        :title="t('pages.settings.system.setShortCuts')"
        :description="t('pages.settings.system.setShortCutsDesc')"
        :icon="Keyboard"
        @click="goShortCutPage"
      />
    </SettingSection>
  </div>

  <CustomModal
    v-model:visible="mainWindowSizeVisible"
    height="auto"
    width="600px"
    :title="t('pages.settings.system.setMainWindowSize')"
  >
    <SettingSection>
      <SettingCard>
        <CustomInput
          v-model="formOfSetting.mainWindowWidth"
          type="number"
          min="1"
          max="10000"
          :title="t('pages.settings.system.mainWindowWidth')"
          placeholder="1200"
        />
      </SettingCard>
      <SettingCard>
        <CustomInput
          v-model="formOfSetting.mainWindowHeight"
          type="number"
          min="1"
          max="10000"
          :title="t('pages.settings.system.mainWindowHeight')"
          placeholder="800"
        />
      </SettingCard>
      <CustomSwitch
        v-model="rawPicGoSize"
        small
        :title="t('pages.settings.system.rawPicGoSize')"
        :description="t('pages.settings.system.rawPicGoSizeHint')"
      />
    </SettingSection>
  </CustomModal>
  <SettingsFileEditor ref="editor" @theme-saved="loadThemes" />
</template>

<script setup lang="ts">
import { Download, Edit2, Globe, Image as ImageIcon, Import, Keyboard, Monitor } from '@lucide/vue'
import { onBeforeMount, ref } from 'vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { osGlobal } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { SHORTKEY_PAGE } from '@/router/config'
import { IRPCActionType } from '#/constants/rpcActions'

import SettingsFileEditor from './SettingsFileEditor.vue'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const {
  formOfSetting,
  currentTheme,
  currentLanguage,
  currentStartMode,
  isDisableGPU,
  rawPicGoSize,
  handleBlurCustomBgImgBlur,
  handleBlurCustomBgImgOpacity,
  handleIsDisableGPUChange,
  handleHideDockChange,
  handleAutoStartChange,
  handleMiniWindowOntop,
  handleCustomBgImg,
  handleMiniIconPath,
} = useSettingsContext()
const $router = useRouter()
const message = useMessage()
const editor = useTemplateRef('editor')
function handleEditTheme() {
  void editor.value?.editTheme(currentTheme.value)
}
onBeforeMount(loadThemes)
const themeList = ref<{ value: string; label: string }[]>([{ value: 'default.css', label: '默认' }])

const downloadingThemes = ref(false)

const mainWindowSizeVisible = ref(false)

const languageList = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en' },
]

async function loadThemes() {
  try {
    const themes = await window.electron.triggerRPC<{ key: string; label: string }[]>(
      IRPCActionType.THEME_RESOLVE_THEMES,
    )
    if (themes && themes.length > 0) {
      const sortedThemes = themes.sort((a, b) => {
        if (a.key === 'default.css') return -1
        if (b.key === 'default.css') return 1
        return a.label.localeCompare(b.label)
      })
      themeList.value = sortedThemes.map(theme => ({
        value: theme.key,
        label: theme.label,
      }))
    }
  } catch (error) {
    console.error('Failed to load themes:', error)
  }
}

async function handleDownloadThemes() {
  try {
    downloadingThemes.value = true
    const result = await window.electron.triggerRPC(IRPCActionType.THEME_FETCH_THEMES)
    if (!result) {
      throw new Error('No themes were downloaded.')
    }
    message.success(t('pages.settings.system.downloadThemesSuccess'))
    await loadThemes()
  } catch (error) {
    console.error('Failed to download themes:', error)
    message.error(t('pages.settings.system.downloadThemesFailed'))
  } finally {
    downloadingThemes.value = false
  }
}

async function handleImportThemes() {
  try {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG, {
      title: t('pages.settings.system.importThemes'),
      filters: [{ name: 'CSS Files', extensions: ['css'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (result && result.length > 0) {
      await window.electron.triggerRPC(IRPCActionType.THEME_IMPORT_THEMES, result)
      message.success(t('pages.settings.system.importThemesSuccess'))
      await loadThemes()
    }
  } catch (error) {
    console.error('Failed to import themes:', error)
    message.error(t('pages.settings.system.importThemesFailed'))
  }
}

function goShortCutPage() {
  $router.push({ name: SHORTKEY_PAGE })
}
</script>
