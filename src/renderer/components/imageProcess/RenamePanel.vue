<template>
  <SettingSection
    :icon="PenLine"
    :title="t('pages.imageProcess.renameSettings')"
    :description="t('pages.imageProcess.guide.categoryHints.rename')"
  >
    <ProcessingField field="naming.autoRename" p1>
      <CustomSwitch
        v-model="form.naming.autoRename"
        :title="t('pages.imageProcess.guide.timestampName')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField field="naming.manualRename" p1>
      <CustomSwitch v-model="form.naming.manualRename" :title="t('pages.imageProcess.guide.askName')" no-border small />
    </ProcessingField>
    <ProcessingField field="rename.enable" p1 class="col-span-full">
      <CustomSwitch v-model="form.rename.enable" :title="t('pages.imageProcess.guide.customName')" no-border small />
    </ProcessingField>
    <ProcessingField v-if="form.rename.enable" field="rename.format" class="col-span-full">
      <CustomInput
        v-model="form.rename.format"
        :title="t('pages.settings.upload.advancedRnameFormat')"
        placeholder="Ex. {Y}-{m}-{uuid}"
      />
    </ProcessingField>
  </SettingSection>

  <SettingSection
    v-if="form.rename.enable"
    :icon="Braces"
    :title="t('pages.settings.upload.availablePlaceholders')"
    :description="t('pages.imageProcess.studio.placeholdersHint')"
    only-one-row
  >
    <PlaceholderTable :list="placeholders" :title-list="placeholderTitles" />
  </SettingSection>
</template>

<script setup lang="ts">
import { Braces, PenLine } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomInput from '@/components/common/CustomInput.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form } = useImageProcessContext()

const placeholder = (key: string, value: string) => ({ label: t(`pages.settings.upload.placeholder.${key}`), value })
const placeholders = computed(() => ({
  categoryTime: [
    placeholder('year4', '{Y}'),
    placeholder('year2', '{y}'),
    placeholder('month', '{m}'),
    placeholder('date', '{d}'),
    placeholder('hour', '{h}'),
    placeholder('minute', '{i}'),
    placeholder('second', '{s}'),
    placeholder('millisecond', '{ms}'),
    placeholder('timestamp', '{timestamp}'),
    placeholder('timestampS', '{timestampS}'),
  ],
  categoryHash: [
    placeholder('md5', '{md5}'),
    placeholder('md5-16', '{md5-16}'),
    placeholder('uuid', '{uuid}'),
    placeholder('ulid', '{ulid}'),
    placeholder('sha1', '{sha1}'),
    placeholder('sha1-n', '{sha1-n}'),
    placeholder('sha256', '{sha256}'),
    placeholder('sha256-n', '{sha256-n}'),
  ],
  categoryFile: [
    placeholder('filename', '{filename}'),
    placeholder('localFolder', '{localFolder:n}'),
    placeholder('randomString', '{str-n}'),
  ],
}))
const placeholderTitles = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))
</script>
