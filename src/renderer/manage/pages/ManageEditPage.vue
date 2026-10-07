<template>
  <div ref="rootRef" class="@container flex h-full min-h-0 w-full flex-col" @keydown.enter="handleEnter">
    <!-- Editor header -->
    <div class="flex shrink-0 flex-wrap items-center gap-3 border-b border-border-secondary px-4 py-3">
      <button
        v-tooltip="t('pages.manage.login.backToList')"
        type="button"
        class="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-secondary text-secondary transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
        :aria-label="t('pages.manage.login.backToList')"
        @click="requestClose"
      >
        <ArrowLeftIcon :size="16" aria-hidden="true" />
      </button>
      <div
        class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary"
      >
        <img :src="`./assets/${platform.icon}.webp`" class="h-[24px] w-[24px] object-contain" alt="" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="m-0 truncate text-lg font-semibold tracking-tight text-main">
          {{
            aliasName
              ? t('pages.manage.login.editTitle', { alias: aliasName })
              : t('pages.manage.login.newTitle', { name: platform.name })
          }}
        </h2>
        <p class="m-0 truncate text-xs text-secondary">{{ platform.name }}</p>
      </div>
      <CustomButton
        type="secondary"
        :icon="BookOpenIcon"
        :text="t('pages.manage.login.setupGuide')"
        @click="openReference"
      />
    </div>

    <!-- Form -->
    <div class="no-scrollbar min-h-0 flex-1 overflow-auto p-4">
      <div class="flex flex-col gap-4">
        <div
          v-if="platform.explain"
          class="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-main"
        >
          <InfoIcon :size="16" class="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <p class="m-0 leading-normal">{{ platform.explain }}</p>
        </div>

        <p class="m-0 text-xs text-secondary">
          <span class="text-danger" aria-hidden="true">*</span>
          {{ t('pages.configForm.requiredHint') }}
        </p>

        <SettingSection
          :icon="KeyRoundIcon"
          :title="t('pages.manage.login.connectionSection')"
          :description="t('pages.manage.login.connectionSectionDesc')"
          only-one-row
        >
          <div class="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <SettingCard
              v-for="option in connectionFields"
              :key="option"
              :class="{ 'col-span-full': option === 'alias', 'border-error/50!': formErrors[option] }"
              :data-invalid="!!formErrors[option] || undefined"
            >
              <SingleSelect
                v-if="fieldOf(option).type === 'select'"
                v-model="configResult[option]"
                :fronticon="false"
                :icon="null"
                :title="fieldOf(option).description"
                :required="fieldOf(option).required"
                :tips="fieldOf(option).tooltip || ''"
                :aria-invalid="!!formErrors[option]"
                class="mt-1 bg-bg-tertiary px-3! py-3!"
                :class="formErrors[option] ? 'border-error!' : 'border-border!'"
                :select-list="selectListOf(option)"
                @change="validateField(option)"
              >
                <template #pre-info>
                  <option value="" disabled>{{ t('pages.manage.login.selectPlaceholder') }}</option>
                </template>
              </SingleSelect>
              <CustomInput
                v-else-if="fieldOf(option).type === 'number'"
                v-model.number="configResult[option]"
                type="number"
                :title="fieldOf(option).description"
                :placeholder="fieldOf(option).placeholder || ''"
                :required="fieldOf(option).required"
                :tips="fieldOf(option).tooltip || ''"
                :aria-invalid="!!formErrors[option]"
                :aria-describedby="formErrors[option] ? errorId(option) : undefined"
                :class="{ 'border-error!': formErrors[option] }"
                @blur="validateField(option)"
                @input="clearFieldError(option)"
              />
              <CustomInput
                v-else
                v-model.trim="configResult[option]"
                :is-password="SECRET_FIELDS.has(option)"
                :autocomplete="SECRET_FIELDS.has(option) ? 'off' : undefined"
                spellcheck="false"
                :title="fieldOf(option).description"
                :placeholder="fieldOf(option).placeholder || ''"
                :required="fieldOf(option).required"
                :tips="fieldOf(option).tooltip || ''"
                :aria-invalid="!!formErrors[option]"
                :aria-describedby="formErrors[option] ? errorId(option) : undefined"
                :class="{ 'border-error!': formErrors[option] }"
                @blur="validateField(option)"
                @input="clearFieldError(option)"
              />
              <template v-if="formErrors[option]" #extra>
                <p :id="errorId(option)" class="mt-2 mb-0 flex items-center gap-1.5 text-xs text-error">
                  <CircleAlertIcon :size="14" class="shrink-0" aria-hidden="true" />
                  {{ formErrors[option] }}
                </p>
              </template>
            </SettingCard>
          </div>
        </SettingSection>

        <SettingSection
          v-if="optionFields.length"
          :icon="SlidersHorizontalIcon"
          :title="t('pages.manage.login.optionsSection')"
          :description="t('pages.manage.login.optionsSectionDesc')"
          only-one-row
        >
          <div class="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <SettingCard
              v-for="option in optionFields"
              :key="option"
              :p1="fieldOf(option).type === 'boolean'"
              :class="{
                'flex flex-col justify-center': fieldOf(option).type === 'boolean',
                'border-error/50!': formErrors[option],
              }"
              :data-invalid="!!formErrors[option] || undefined"
            >
              <CustomSwitch
                v-if="fieldOf(option).type === 'boolean'"
                v-model="configResult[option]"
                no-border
                small
                :title="fieldOf(option).description"
                :tips="fieldOf(option).tooltip || ''"
              >
                <template #switch-text>
                  <span
                    class="ml-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="configResult[option] ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary text-secondary'"
                  >
                    {{ configResult[option] ? t('pages.configForm.yes') : t('pages.configForm.no') }}
                  </span>
                </template>
              </CustomSwitch>
              <CustomInput
                v-else
                v-model.number="configResult[option]"
                type="number"
                :title="fieldOf(option).description"
                :placeholder="fieldOf(option).placeholder || ''"
                :required="fieldOf(option).required"
                :tips="fieldOf(option).tooltip || ''"
                :disabled="option === 'itemsPerPage' && configResult.paging === false"
                :aria-invalid="!!formErrors[option]"
                :aria-describedby="formErrors[option] ? errorId(option) : undefined"
                :class="{ 'border-error!': formErrors[option] }"
                @blur="validateField(option)"
                @input="clearFieldError(option)"
              />
              <template v-if="formErrors[option]" #extra>
                <p :id="errorId(option)" class="mt-2 mb-0 flex items-center gap-1.5 text-xs text-error">
                  <CircleAlertIcon :size="14" class="shrink-0" aria-hidden="true" />
                  {{ formErrors[option] }}
                </p>
              </template>
            </SettingCard>
          </div>
        </SettingSection>
      </div>
    </div>

    <!-- Action bar -->
    <div
      class="flex shrink-0 flex-wrap items-center gap-3 rounded-b-2xl border-t border-border-secondary bg-bg-secondary/90 px-4 py-3 backdrop-blur-md"
    >
      <div v-if="importCandidates.length > 0" class="relative">
        <CustomButton
          type="secondary"
          :icon="ImportIcon"
          :text="t('pages.manage.login.import')"
          :disabled="saving"
          aria-haspopup="menu"
          :aria-expanded="importMenuVisible"
          @click="importMenuVisible = !importMenuVisible"
          @blur="handleImportBlur"
          @keydown.esc="importMenuVisible = false"
        />
        <Transition name="dropdown">
          <div
            v-show="importMenuVisible"
            role="menu"
            class="absolute bottom-[calc(100%+8px)] left-0 z-1000 min-w-[220px] overflow-auto rounded-xl border border-border bg-surface shadow-md"
          >
            <div class="bg-bg-tertiary px-4 py-3 text-xs font-semibold tracking-wider text-main uppercase">
              {{ t('pages.manage.login.importFrom') }}
            </div>
            <div class="max-h-[250px] overflow-y-auto">
              <button
                v-for="item in importCandidates"
                :key="item.alias"
                type="button"
                role="menuitem"
                class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-bg-tertiary px-4 py-3 text-left text-sm text-main hover:text-accent focus-visible:focus-ring"
                @click="handleConfigImport(item)"
                @blur="handleImportBlur"
                @focus="cancelImportClose"
              >
                <FileJsonIcon :size="14" class="shrink-0 text-accent" aria-hidden="true" />
                <span class="min-w-0 truncate">{{ item.alias }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
      <CustomButton
        type="secondary"
        :icon="RotateCcwIcon"
        :text="t('pages.manage.login.restoreDefaults')"
        :disabled="saving"
        @click="handleConfigReset"
      />

      <span v-if="isDirty" role="status" class="ml-auto flex items-center gap-1.5 text-xs font-medium text-secondary">
        <span class="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
        {{ t('pages.configForm.unsavedChanges') }}
      </span>
      <CustomButton
        type="secondary"
        :class="{ 'ml-auto': !isDirty }"
        :text="t('common.cancel')"
        :disabled="saving"
        @click="requestClose"
      />
      <CustomButton :icon="CheckIcon" :text="t('pages.manage.login.save')" :loading="saving" @click="handleSave" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  CircleAlertIcon,
  FileJsonIcon,
  ImportIcon,
  InfoIcon,
  KeyRoundIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
} from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { getConfig, removeConfig, saveConfig } from '@/manage/services/configService'
import { useManageStore } from '@/manage/stores/manageStore'
import { getSupportedPicBedList } from '@/manage/utils/constants'
import { IRPCActionType } from '#/constants/rpcActions'
import { formatEndpoint } from '#/utils/url'
import { enforceBoolean } from '#/utils/values'

const { aliasName, platformName } = defineProps<{
  aliasName: string
  platformName: string
}>()

const emit = defineEmits<{
  close: []
  saved: [alias: string]
}>()

// Credentials are masked by default; the eye toggle in CustomInput reveals them.
const SECRET_FIELDS = new Set([
  'token',
  'secretKey',
  'accessKeySecret',
  'secretAccessKey',
  'password',
  'passphrase',
  'accessToken',
  'antiLeechToken',
])

const { t } = useI18n()
const { confirm } = useConfirm()
const supportedPicBedList = computed(() => getSupportedPicBedList(t))
const platform = computed(() => supportedPicBedList.value[platformName])
const manageStore = useManageStore()
const message = useMessage()
const rootRef = useTemplateRef('rootRef')
const formId = useId()
const errorId = (field: string) => `${formId}-error-${field}`

const formErrors = ref<IStringKeyMap>({})
const configResult = ref<IStringKeyMap>({})
const existingConfiguration = ref<IStringKeyMap>({})
const allAliases = ref<IStringKeyMap>({})
const pristineSnapshot = ref('')
const saving = ref(false)
const importMenuVisible = ref(false)
let importBlurTimer: ReturnType<typeof setTimeout> | undefined

const fieldOf = (option: string) => platform.value.configOptions[option]

// Fixed values (e.g. WebDAV's bucket name) aren't editable, so they stay out of the form.
const visibleFields = computed<string[]>(() =>
  (platform.value?.options ?? []).filter((option: string) => !fieldOf(option).disabled),
)
const isOptionField = (option: string) => fieldOf(option).type === 'boolean' || option === 'itemsPerPage'
const connectionFields = computed(() => visibleFields.value.filter(option => !isOptionField(option)))
const optionFields = computed(() => visibleFields.value.filter(isOptionField))

const importCandidates = computed(() =>
  Object.values(existingConfiguration.value).filter((item: IStringKeyMap) => item.alias !== aliasName),
)
const isDirty = computed(
  () => !!pristineSnapshot.value && JSON.stringify(configResult.value) !== pristineSnapshot.value,
)

function selectListOf(option: string) {
  return Object.entries(fieldOf(option).selectOptions || {}).map(([value, label]) => ({
    value,
    label: label as string,
  }))
}

const openReference = () => window.electron.sendRPC(IRPCActionType.OPEN_URL, platform.value.refLink)

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

function validateField(optionKey: string) {
  const configOption = fieldOf(optionKey)
  const value = configResult.value[optionKey]
  if (!configOption) return

  delete formErrors.value[optionKey]
  if (configOption.type === 'boolean') return
  if (optionKey === 'itemsPerPage' && configResult.value.paging === false) return

  if (configOption.required && isEmpty(value)) {
    formErrors.value[optionKey] = t('pages.manage.constant.pleaseInput', { name: configOption.description })
    return
  }

  if (Array.isArray(configOption.rule)) {
    for (const rule of configOption.rule) {
      if (rule.validator) {
        try {
          rule.validator(rule, value, (error: Error | null) => {
            if (error) formErrors.value[optionKey] = error.message
          })
        } catch (e) {
          console.error('Validation error:', e)
        }
      } else if (rule.type === 'number' && !isEmpty(value) && isNaN(Number(value))) {
        formErrors.value[optionKey] = rule.message || t('pages.manage.constant.itemsPPBeNumber')
        return
      }
    }
  }

  if (optionKey === 'alias' && value) {
    if (!/^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u.test(value)) {
      formErrors.value[optionKey] = t('pages.manage.login.aliasMsg')
    } else if (value !== aliasName && Object.hasOwn(allAliases.value, value)) {
      formErrors.value[optionKey] = t('pages.manage.login.aliasExistMsg')
    }
  }

  if (optionKey === 'itemsPerPage' && !isEmpty(value)) {
    const numValue = Number(value)
    if (!Number.isInteger(numValue) || numValue < 20 || numValue > 1000) {
      formErrors.value[optionKey] = t('pages.manage.login.itemsPerPageMsg')
    }
  }
}

const clearFieldError = (fieldKey: string) => {
  delete formErrors.value[fieldKey]
}

function validateAllFields(): boolean {
  visibleFields.value.forEach(validateField)
  return Object.keys(formErrors.value).length === 0
}

async function focusFirstInvalid() {
  await nextTick()
  const card = rootRef.value?.querySelector<HTMLElement>('[data-invalid]')
  if (!card) return
  card.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const target =
    card.querySelector<HTMLElement>('[aria-invalid="true"]:not([tabindex="-1"])') ??
    card.querySelector<HTMLElement>('input:not([tabindex="-1"])')
  target?.focus({ preventScroll: true })
}

function handleEnter(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement | null
  if (saving.value || event.isComposing || target?.tagName !== 'INPUT') return
  event.preventDefault()
  handleSave()
}

async function handleSave() {
  if (saving.value) return
  if (!validateAllFields()) {
    message.error(t('pages.manage.login.noRequiredMsg'))
    await focusFirstInvalid()
    return
  }

  const configOptions = platform.value.configOptions
  const resultMap: IStringKeyMap = {}
  for (const key of Object.keys(configOptions)) {
    let value = configResult.value[key]
    if (key === 'customUrl' && typeof value === 'string' && value !== '') {
      const sslEnabled = configResult.value.sslEnabled ?? configOptions.sslEnabled?.default ?? false
      value = value
        .split(',')
        .map((url: string) => {
          const customUrl = url.trim()
          // Only use the provider's TLS setting when the custom domain has no explicit scheme.
          return customUrl && !/^https?:\/\//i.test(customUrl) ? formatEndpoint(customUrl, sslEnabled) : customUrl
        })
        .join(',')
    }

    const defaultValue = configOptions[key].default
    if (value === undefined || value === '') {
      resultMap[key] = defaultValue !== undefined ? defaultValue : ''
    } else {
      resultMap[key] = value
    }
  }
  resultMap.picBedName = platformName
  if (resultMap.bucketName !== undefined) {
    const transformedConfig: IStringKeyMap = {}
    const bucketName = String(resultMap.bucketName).split(',')
    const baseDir = resultMap.baseDir?.split(',')
    const area = resultMap.area?.split(',')
    const customUrl = resultMap.customUrl?.split(',')
    const operator = resultMap.operator?.split(',')
    const password = resultMap.password?.split(',')
    for (let i = 0; i < bucketName.length; i++) {
      if (bucketName[i]) {
        transformedConfig[bucketName[i]] = {
          baseDir: baseDir?.[i] || '/',
          area: area?.[i] || '',
          customUrl: customUrl?.[i] || '',
          operator: operator?.[i] || '',
          password: password?.[i] || '',
        }
      }
    }
    resultMap.transformedConfig = JSON.stringify(transformedConfig)
  }

  saving.value = true
  try {
    if (!(await saveConfig(`picBed.${resultMap.alias}`, resultMap))) return
    // Changing the alias renames the configuration instead of leaving a stale copy behind.
    if (aliasName && aliasName !== resultMap.alias) {
      await removeConfig('picBed', aliasName)
    }
    await manageStore.refreshConfig()
    pristineSnapshot.value = JSON.stringify(configResult.value)
    message.success(`${t('pages.manage.login.configSaveMsg')} ${resultMap.alias}`)
    emit('saved', resultMap.alias)
  } finally {
    saving.value = false
  }
}

function defaultValueOf(option: string) {
  const configOption = fieldOf(option)
  if (configOption.default !== undefined) return configOption.default
  return configOption.type === 'boolean' ? false : ''
}

function uniqueAlias() {
  const base = platform.value.configOptions.alias?.default?.replace(/-A$/, '') || platformName
  for (let i = 0; i < 26; i++) {
    const candidate = `${base}-${String.fromCharCode(65 + i)}`
    if (!Object.hasOwn(allAliases.value, candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

function applyConfig(source: IStringKeyMap, includeAlias: boolean) {
  for (const option of platform.value.options as string[]) {
    if (option === 'alias' && !includeAlias) continue
    if (source[option] === undefined) continue
    configResult.value[option] = fieldOf(option).type === 'boolean' ? enforceBoolean(source[option]) : source[option]
  }
}

async function loadConfig() {
  const result = (await getConfig<IStringKeyMap>('picBed')) || {}
  allAliases.value = result
  existingConfiguration.value = Object.fromEntries(
    Object.entries(result).filter(([, value]) => value?.picBedName === platformName),
  )

  const next: IStringKeyMap = {}
  for (const option of platform.value.options as string[]) next[option] = defaultValueOf(option)
  configResult.value = next
  const current = aliasName ? existingConfiguration.value[aliasName] : undefined
  if (current) applyConfig(current, true)
  else configResult.value.alias = uniqueAlias()
  pristineSnapshot.value = JSON.stringify(configResult.value)
}

function cancelImportClose() {
  clearTimeout(importBlurTimer)
}

function handleImportBlur() {
  clearTimeout(importBlurTimer)
  importBlurTimer = setTimeout(() => {
    importMenuVisible.value = false
  }, 200)
}

function handleConfigImport(item: IStringKeyMap) {
  applyConfig(item, false)
  formErrors.value = {}
  importMenuVisible.value = false
  message.success(t('pages.manage.login.importSuccess'))
}

function handleConfigReset() {
  const alias = configResult.value.alias
  for (const option of platform.value.options as string[]) configResult.value[option] = defaultValueOf(option)
  configResult.value.alias = alias
  formErrors.value = {}
}

async function confirmDiscard() {
  if (!isDirty.value) return true
  return confirm({
    title: t('pages.manage.login.discardTitle'),
    message: t('pages.manage.login.discardMsg'),
    type: 'warning',
    confirmButtonText: t('pages.manage.login.discard'),
    cancelButtonText: t('pages.manage.login.keepEditing'),
    center: true,
  })
}

async function requestClose() {
  if (saving.value) return
  if (await confirmDiscard()) emit('close')
}

onMounted(loadConfig)
onBeforeUnmount(() => clearTimeout(importBlurTimer))

defineExpose({ isDirty, confirmDiscard })
</script>
