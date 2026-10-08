<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <!-- Upload Behavior Section -->
    <SettingSection :icon="Server" :title="t('pages.settings.upload.controlShow')">
      <SettingCard>
        <MultiSelect
          v-model:choosed="visiblePicBeds"
          :icon="Server"
          :tight="false"
          :title="t('pages.settings.upload.chooseShowedPicBed')"
          :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
          :all-list="picBedG"
        />
      </SettingCard>
      <SettingCard>
        <MultiSelect
          v-model:choosed="settings.galleryPicBedFilter"
          :icon="ImageIcon"
          :tight="false"
          :title="t('pages.settings.upload.galleryPicBedFilter')"
          :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
          :all-list="picBedG"
        />
      </SettingCard>
    </SettingSection>
    <SettingSection :icon="CloudUpload" :title="t('pages.settings.upload.uploadBehavior')">
      <!-- Auto Import Card -->
      <SettingCard p1>
        <CustomSwitch
          v-model="settings.autoImport"
          small
          no-border
          :title="t('pages.settings.upload.autoImportInManage')"
          :description="t('pages.settings.upload.autoImportInManageHint')"
        />
      </SettingCard>
      <!-- Auto Import PicBed Selection -->
      <SettingCard v-if="settings.autoImport">
        <MultiSelect
          v-model:choosed="settings.autoImportPicBed"
          :icon="ImageIcon"
          :tight="false"
          :title="t('pages.settings.upload.autoImportPicBed')"
          :zero-placeholder="t('pages.settings.upload.autoImportPicBed')"
          :all-list="picBedG"
        />
      </SettingCard>
      <!-- Second PicBed Card -->
      <SettingCard p1>
        <CustomSwitch
          v-model="settings.enableSecondUploader"
          small
          no-border
          :title="t('pages.settings.upload.enableSecondPicBed')"
          :description="t('pages.settings.upload.enableSecondPicBedHint')"
        />
      </SettingCard>

      <CustomNavCard
        v-if="settings.enableSecondUploader"
        :title="t('pages.settings.upload.setSecondPicBed')"
        :icon="CloudUpload"
        :description="t('pages.settings.upload.setSecondPicBedDesc')"
        @click="handleChangeSecondPicBed"
      />

      <SettingCard v-if="settings.enableSecondUploader">
        <SingleSelect
          v-model="settings.secondPicBedMode"
          :fronticon="false"
          :tight="false"
          :select-list="secondModeList"
          :title="t('pages.settings.upload.chooseSecondPicBedMode')"
          :icon="Settings2Icon"
        />
      </SettingCard>
    </SettingSection>

    <!-- Upload Processing Section -->
    <SettingSection :icon="ImageIcon" :title="t('pages.settings.upload.uploadProcessing')">
      <CustomNavCard
        :title="t('pages.settings.upload.advancedRname')"
        :icon="Edit"
        :description="t('pages.settings.upload.advancedRnameDesc')"
        @click="advancedRenameVisible = true"
      />
      <CustomNavCard
        :title="t('pages.settings.upload.imageProcessing')"
        :icon="ImageIcon"
        :description="t('pages.settings.upload.imageProcessingDesc')"
        @click="imageProcessDialogVisible = true"
      />

      <SettingCard p1 class="flex flex-col justify-center">
        <CustomSwitch v-model="settings.rename" small no-border :title="t('pages.settings.upload.manualRename')" />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.autoRename"
          small
          no-border
          :title="t('pages.settings.upload.timestampRename')"
          description="YYYYMMDDHHmmssSSS"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.deleteLocalFile"
          small
          no-border
          :title="t('pages.settings.upload.deleteLocalFileAfterUpload')"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.deleteCloudFile"
          small
          no-border
          :title="t('pages.settings.upload.deleteCloud')"
        />
      </SettingCard>
    </SettingSection>

    <!-- Clipboard & Notification Section -->
    <SettingSection :icon="ClipboardList" :title="t('pages.settings.upload.clipboardAndNotification')">
      <SettingCard p1>
        <CustomSwitch
          v-model="settings.uploadNotification"
          small
          no-border
          :title="t('pages.settings.upload.enableUploadNotification')"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.uploadResultNotification"
          small
          no-border
          :title="t('pages.settings.upload.enableUploadResultNotification')"
        />
      </SettingCard>

      <SettingCard p1 class="flex flex-col justify-center">
        <CustomSwitch
          v-model="settings.autoCopy"
          small
          no-border
          :title="t('pages.settings.upload.autoCopyUrlAfterUpload')"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.useBuiltinClipboard"
          small
          no-border
          :title="t('pages.settings.upload.useBuiltInClipboardUpload')"
          :description="t('pages.settings.upload.useBuiltInClipboardUploadHint')"
        />
      </SettingCard>

      <SettingCard p1 class="col-span-full">
        <CustomSwitch
          v-model="settings.isAutoListenClipboard"
          small
          no-border
          :title="t('pages.settings.upload.isAutoListenClipboard')"
        />
      </SettingCard>
    </SettingSection>

    <!-- URL Format & Link Type Section -->
    <SettingSection :icon="Link" :title="t('pages.settings.upload.urlFormatAndLinkType')">
      <!-- Custom Link Format Action -->
      <CustomNavCard
        :title="t('pages.settings.upload.customLinkFormat')"
        :icon="Link"
        :description="t('pages.settings.upload.customLinkFormatDesc')"
        @click="customLinkVisible = true"
      />
      <SettingCard p1>
        <CustomSwitch
          v-model="settings.useShortUrl"
          small
          no-border
          :title="t('pages.settings.upload.enableShortUrl')"
          :description="t('pages.settings.upload.enableShortUrlDesc')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl">
        <SingleSelect
          v-model="settings.shortUrlServer"
          :fronticon="false"
          :tight="false"
          :select-list="shortUrlServerList"
          :title="t('pages.settings.upload.shortUrlServer')"
          :icon="Link"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'c1n'">
        <CustomInput
          v-model="settings.c1nToken"
          :title="t('pages.settings.upload.c1nToken')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.c1nToken')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'yourls'">
        <CustomInput
          v-model="settings.yourlsDomain"
          :title="t('pages.settings.upload.yourlsDomain')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.yourlsDomain')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'yourls'">
        <CustomInput
          v-model="settings.yourlsSignature"
          :title="t('pages.settings.upload.yourlsSignature')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.yourlsSignature')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'cf_worker'">
        <CustomInput
          v-model="settings.cfWorkerHost"
          :title="t('pages.settings.upload.cfWorkerHost')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.cfWorkerHost')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'sink'">
        <CustomInput
          v-model="settings.sinkDomain"
          :title="t('pages.settings.upload.sinkDomain')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.sinkDomain')"
        />
      </SettingCard>

      <SettingCard v-if="settings.useShortUrl && settings.shortUrlServer === 'sink'">
        <CustomInput
          v-model="settings.sinkToken"
          :title="t('pages.settings.upload.sinkToken')"
          :icon="Link"
          :placeholder="t('pages.settings.upload.sinkToken')"
        />
      </SettingCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.encodeOutputURL"
          small
          no-border
          :title="t('pages.settings.upload.encodeOutputUrl')"
        />
      </SettingCard>
    </SettingSection>
  </div>

  <CustomModal
    v-model:visible="customLinkVisible"
    height="auto"
    width="600px"
    :title="t('pages.settings.upload.customLinkFormat')"
  >
    <div class="flex flex-col gap-4 p-4">
      <SettingCard>
        <CustomInput
          ref="customLinkInput"
          v-model="settings.customLink"
          spellcheck="false"
          :title="t('pages.settings.upload.customLinkFormatInput')"
          :placeholder="'![$fileName]($url)'"
        />
        <template #extra>
          <div class="mt-3 flex min-w-0 items-center gap-2 rounded-md bg-bg-tertiary px-3 py-2">
            <span class="shrink-0 text-xs font-semibold text-secondary">{{
              t('pages.settings.upload.formatPreview')
            }}</span>
            <code class="min-w-0 truncate font-mono text-sm text-main" :title="customLinkPreview">{{
              customLinkPreview
            }}</code>
          </div>
        </template>
      </SettingCard>
      <SettingCard>
        <div class="mb-3 flex items-center gap-2">
          <FileText :size="16" class="text-accent" aria-hidden="true" />
          <span class="text-sm font-semibold text-main">{{
            t('pages.settings.upload.availablePlaceholdersTitle')
          }}</span>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="item in placeholderList" :key="item.code" class="flex items-center gap-3">
            <button
              type="button"
              class="min-w-[90px] shrink-0 cursor-pointer rounded-sm border border-border bg-bg-tertiary px-2 py-1 text-center font-mono text-sm font-semibold text-main transition-colors duration-fast ease-apple hover:border-accent hover:text-accent focus-visible:focus-ring"
              :aria-label="t('pages.settings.upload.placeholderInsert', { code: item.code })"
              @click="insertPlaceholder(customLinkInput, 'customLink', item.code)"
            >
              {{ item.code }}
            </button>
            <span class="text-sm text-secondary">{{ t(`pages.settings.upload.${item.description}`) }}</span>
          </div>
        </div>
        <p class="mt-3 text-xs text-secondary">{{ t('pages.settings.upload.placeholderInsertHint') }}</p>
      </SettingCard>
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="advancedRenameVisible"
    height="auto"
    width="760px"
    :title="t('pages.settings.upload.advancedRname')"
  >
    <div class="flex flex-col gap-4 p-4">
      <SettingSection>
        <SettingCard p1 class="col-span-full">
          <CustomSwitch
            v-model="advancedRename.enable"
            small
            no-border
            :title="t('pages.settings.upload.enableAdvancedRname')"
            :description="t('pages.settings.upload.enableAdvancedRnameDesc')"
          />
        </SettingCard>
        <SettingCard v-if="advancedRename.enable" class="col-span-full">
          <CustomInput
            ref="renameFormatInput"
            v-model="advancedRename.format"
            spellcheck="false"
            :title="t('pages.settings.upload.advancedRnameFormat')"
            placeholder="Ex. {Y}-{m}-{uuid}"
          />
          <template #extra>
            <div class="mt-3 flex min-w-0 items-center gap-2 rounded-md bg-bg-tertiary px-3 py-2">
              <span class="shrink-0 text-xs font-semibold text-secondary">{{
                t('pages.settings.upload.formatPreview')
              }}</span>
              <code class="min-w-0 truncate font-mono text-sm text-main" :title="renamePreview">{{
                renamePreview
              }}</code>
            </div>
          </template>
        </SettingCard>
      </SettingSection>
      <SettingSection
        v-if="advancedRename.enable"
        :icon="Braces"
        :title="t('pages.settings.upload.availablePlaceholders')"
        :description="t('pages.settings.upload.placeholderInsertHint')"
        only-one-row
      >
        <PlaceholderTable
          :list="advancedRenameList"
          :title-list="advancedRenameTitleList"
          @select="insertPlaceholder(renameFormatInput, 'rename', $event)"
        />
      </SettingSection>
    </div>
  </CustomModal>

  <ImageProcessDialog v-if="imageProcessDialogVisible" v-model:visible="imageProcessDialogVisible" />
</template>

<script setup lang="ts">
import {
  Braces,
  ClipboardList,
  CloudUpload,
  Edit,
  FileText,
  Image as ImageIcon,
  Link,
  Server,
  Settings2Icon,
} from '@lucide/vue'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import ImageProcessDialog from '@/components/ImageProcessDialog.vue'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { renameFileNameWithCustomString } from '@/manage/utils/fileName'
import { IRPCActionType } from '#/constants/rpcActions'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { settings, visiblePicBeds, picBedG, advancedRename } = useSettingsContext()

const customLinkVisible = ref(false)

const customLinkInput = useTemplateRef<InstanceType<typeof CustomInput>>('customLinkInput')

const renameFormatInput = useTemplateRef<InstanceType<typeof CustomInput>>('renameFormatInput')

const customLinkPreview = computed(() =>
  (settings.value.customLink || '![$fileName]($url)')
    .replaceAll('$url', 'https://example.com/image.png')
    .replaceAll('$fileName', 'image')
    .replaceAll('$extName', '.png'),
)

// {localFolder:n} depends on the source path, so the preview substitutes a sample folder.
const renamePreview = computed(() => {
  const format = (advancedRename.value.format || '{filename}').replace(/{localFolder:\d+}/g, 'photos')
  try {
    return renameFileNameWithCustomString('example.png', format)
  } catch {
    return format
  }
})

const advancedRenameVisible = ref(false)

const imageProcessDialogVisible = ref(false)

const secondModeList = computed(() => [
  { label: t('pages.settings.upload.secondPicBedMode.backup'), value: 'backup' },
  { label: t('pages.settings.upload.secondPicBedMode.separate'), value: 'separate' },
])

const shortUrlServerList = [
  { label: 'c1n', value: 'c1n' },
  { label: 'yourls', value: 'yourls' },
  { label: 'xyTom/Url-Shorten-Worker', value: 'cf_worker' },
  { label: 'ccbikai/Sink', value: 'sink' },
]

const advancedRenameList = computed(() => ({
  categoryTime: [
    { label: t('pages.settings.upload.placeholder.year4'), value: '{Y}' },
    { label: t('pages.settings.upload.placeholder.year2'), value: '{y}' },
    { label: t('pages.settings.upload.placeholder.month'), value: '{m}' },
    { label: t('pages.settings.upload.placeholder.date'), value: '{d}' },
    { label: t('pages.settings.upload.placeholder.hour'), value: '{h}' },
    { label: t('pages.settings.upload.placeholder.minute'), value: '{i}' },
    { label: t('pages.settings.upload.placeholder.second'), value: '{s}' },
    { label: t('pages.settings.upload.placeholder.millisecond'), value: '{ms}' },
    { label: t('pages.settings.upload.placeholder.timestamp'), value: '{timestamp}' },
    { label: t('pages.settings.upload.placeholder.timestampS'), value: '{timestampS}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.ulid'), value: '{ulid}' },
    { label: t('pages.settings.upload.placeholder.sha1'), value: '{sha1}' },
    { label: t('pages.settings.upload.placeholder.sha1-n'), value: '{sha1-n}' },
    { label: t('pages.settings.upload.placeholder.sha256'), value: '{sha256}' },
    { label: t('pages.settings.upload.placeholder.sha256-n'), value: '{sha256-n}' },
  ],
  categoryFile: [
    { label: t('pages.settings.upload.placeholder.filename'), value: '{filename}' },
    { label: t('pages.settings.upload.placeholder.localFolder'), value: '{localFolder:n}' },
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-n}' },
  ],
}))

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

const placeholderList = [
  {
    code: '$url',
    description: 'urlPlaceholder',
  },
  {
    code: '$fileName',
    description: 'fileNamePlaceholder',
  },
  {
    code: '$extName',
    description: 'extNamePlaceholder',
  },
]

// Inserts at the caret position, replacing any selection; appends when the input was never focused.
async function insertPlaceholder(
  field: InstanceType<typeof CustomInput> | null,
  target: 'customLink' | 'rename',
  code: string,
) {
  const input = (field?.$el as HTMLElement | undefined)?.querySelector('input')
  const value = (target === 'customLink' ? settings.value.customLink : advancedRename.value.format) || ''
  const start = input?.selectionStart ?? value.length
  const end = input?.selectionEnd ?? value.length
  const next = value.slice(0, start) + code + value.slice(end)
  if (target === 'customLink') settings.value.customLink = next
  else advancedRename.value.format = next
  await nextTick()
  input?.focus()
  input?.setSelectionRange(start + code.length, start + code.length)
}

async function handleChangeSecondPicBed() {
  window.electron.sendRPC(IRPCActionType.SHOW_SECOND_UPLOADER_MENU)
}
</script>
