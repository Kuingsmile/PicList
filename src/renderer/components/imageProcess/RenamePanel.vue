<template>
  <SettingSection
    :icon="PenLine"
    :title="t('pages.imageProcess.design.categoryLabels.rename')"
    :description="t('pages.imageProcess.studio.renameDescription')"
  >
    <ProcessingField field="rename.enable" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.rename.enable"
        :title="t('pages.imageProcess.guide.customName')"
        :description="t('pages.imageProcess.studio.customNameHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField
      v-if="form.rename.enable"
      field="rename.format"
      class="col-span-full"
      :inactive="form.naming.autoRename ? t('pages.imageProcess.studio.patternReplaced') : ''"
    >
      <CustomInput
        :id="controlId('rename-format')"
        v-model="form.rename.format"
        class="font-mono"
        :title="t('pages.imageProcess.studio.pattern')"
        placeholder="{Y}-{m}-{d}-{filename}"
      />
      <p
        class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-secondary"
        data-testid="processing-rename-example"
      >
        <span>{{ t('pages.imageProcess.studio.example', { name: `${sample.name}${sample.extension}` }) }}</span>
        <ArrowRight :size="12" class="self-center text-tertiary" aria-hidden="true" />
        <code class="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono font-semibold wrap-anywhere text-accent">{{
          example
        }}</code>
      </p>
    </ProcessingField>
    <ProcessingField field="naming.autoRename" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.naming.autoRename"
        :title="t('pages.imageProcess.guide.timestampName')"
        :description="t('pages.imageProcess.studio.timestampHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField field="naming.manualRename" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.naming.manualRename"
        :title="t('pages.imageProcess.guide.askName')"
        :description="t('pages.imageProcess.studio.askHint')"
        no-border
        small
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
    <PlaceholderTable :list="placeholders" :title-list="placeholderTitles" @select="insertPlaceholder" />
  </SettingSection>
</template>

<script setup lang="ts">
import { ArrowRight, Braces, PenLine } from '@lucide/vue'
import { computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomInput from '@/components/common/CustomInput.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form, controlId } = useImageProcessContext()

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

// Insert at the caret the pattern input last had; an input keeps its selection after losing focus.
async function insertPlaceholder(value: string) {
  const token = value.replace(/-n}$/, '-8}').replace(':n}', ':1}')
  const element = document.getElementById(controlId('rename-format')) as HTMLInputElement | null
  const current = String(form.rename.format ?? '')
  const start = element?.selectionStart ?? current.length
  const end = element?.selectionEnd ?? current.length
  form.rename.format = current.slice(0, start) + token + current.slice(end)
  await nextTick()
  element?.focus()
  element?.setSelectionRange(start + token.length, start + token.length)
}

// Mirrors the substitutions PicList applies, using fixed sample values so the preview stays stable while typing.
const sample = { name: 'holiday-photo', extension: '.png', folders: ['Pictures', 'Trips'] }
const md5 = '9e107d9d372bb6826bd81d3542a419d6'
const sha1 = '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'
const sha256 = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
const example = computed(() => {
  const now = new Date()
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  const tokens: Record<string, string> = {
    '{Y}': String(now.getFullYear()),
    '{y}': String(now.getFullYear()).slice(2),
    '{m}': pad(now.getMonth() + 1),
    '{d}': pad(now.getDate()),
    '{h}': pad(now.getHours()),
    '{i}': pad(now.getMinutes()),
    '{s}': pad(now.getSeconds()),
    '{ms}': pad(now.getMilliseconds(), 3),
    '{md5}': md5,
    '{sha1}': sha1,
    '{sha256}': sha256,
    '{md5-16}': md5.slice(0, 16),
    '{filename}': sample.name,
    '{uuid}': '3f2a9c4be1d04a7f8c6e5b2d1a0f9e8c',
    '{ulid}': '01JA2B3C4D5E6F7G8H9J0KMNPQ',
    '{timestampS}': String(Math.floor(now.getTime() / 1000)),
    '{timestamp}': String(now.getTime()),
  }
  const pattern = String(form.rename.format ?? '')
  const dynamic = /localFolder:|str-|{sha256-\d+}|{sha1-\d+}/.test(pattern)
  if (!dynamic && !Object.keys(tokens).some(token => pattern.includes(token))) return sample.name + sample.extension
  return (
    Object.entries(tokens).reduce((name, [token, value]) => name.replaceAll(token, value), pattern) + sample.extension
  )
    .replace(/{str-(\d+)}/gi, (_, length) => 'k7x2m9q4p8r1s5t3'.repeat(8).slice(0, Number(length)))
    .replace(/{sha256-(\d+)}/gi, (_, length) => sha256.slice(0, Number(length)))
    .replace(/{sha1-(\d+)}/gi, (_, length) => sha1.slice(0, Number(length)))
    .replace(/{localFolder:?(\d+)?}/gi, (_, depth) => sample.folders.slice(-Math.max(1, Number(depth) || 0)).join('/'))
})
</script>
