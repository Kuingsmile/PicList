<template>
  <div
    :id="formId"
    ref="formRef"
    class="@container no-scrollbar flex h-full w-full flex-1 overflow-auto"
    :aria-busy="isLoading"
    @keydown.enter="handleEnter"
  >
    <SettingSection class="h-full flex-1 border-none! shadow-none!" only-one-row>
      <div class="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
        <p v-if="isLoading" role="status" class="sr-only">{{ t('pages.configForm.loading') }}</p>

        <SettingCard v-if="loadFailed" class="col-span-full border-error/40!">
          <div role="alert" class="flex flex-wrap items-center justify-between gap-3 text-sm text-main">
            <span class="flex min-w-0 items-center gap-2">
              <CircleAlert :size="18" class="shrink-0 text-error" aria-hidden="true" />
              {{ t('pages.configForm.loadFailed') }}
            </span>
            <CustomButton
              type="secondary"
              :icon="RefreshCw"
              :text="t('pages.gallery.refresh')"
              :loading="isLoading"
              @click="handleConfig(configProp)"
            />
          </div>
        </SettingCard>

        <!-- First load: placeholders keep the layout steady -->
        <template v-else-if="isLoading && !hasLoaded">
          <SettingCard v-for="n in 4" :key="n" aria-hidden="true" class="motion-safe:animate-pulse">
            <div class="mb-2 h-4 w-1/3 rounded-sm bg-bg-tertiary" />
            <div class="h-[46px] rounded-md bg-bg-tertiary" />
          </SettingCard>
        </template>

        <template v-else>
          <p v-if="hasRequired" class="col-span-full m-0 text-xs text-secondary">
            <span class="text-danger" aria-hidden="true">*</span>
            {{ t('pages.configForm.requiredHint') }}
          </p>

          <SettingCard
            v-if="mode === 'picbed'"
            class="col-span-full"
            :class="{ 'border-error/50!': validationErrors._configName }"
            :data-invalid="!!validationErrors._configName || undefined"
          >
            <CustomInput
              v-model="ruleForm._configName"
              :title="t('pages.configForm.configName')"
              :placeholder="t('pages.configForm.configNamePlaceholder')"
              required
              :disabled="isLoading"
              :aria-invalid="!!validationErrors._configName"
              :aria-describedby="validationErrors._configName ? errorId('_configName') : undefined"
              :class="{ 'border-error!': validationErrors._configName }"
              @blur="touchField('_configName')"
              @input="clearFieldError('_configName')"
            />
            <template v-if="validationErrors._configName" #extra>
              <p :id="errorId('_configName')" class="mt-2 mb-0 flex items-center gap-1.5 text-xs text-error">
                <CircleAlert :size="14" class="shrink-0" aria-hidden="true" />
                {{ validationErrors._configName }}
              </p>
            </template>
          </SettingCard>

          <!-- Dynamic Config Fields -->
          <SettingCard
            v-for="(item, index) in configList"
            :key="item.name + index"
            :p1="item.type === 'confirm'"
            :class="{
              'flex flex-col justify-center': item.type === 'confirm',
              'border-error/50!': validationErrors[item.name],
            }"
            :data-invalid="!!validationErrors[item.name] || undefined"
          >
            <CustomInput
              v-if="item.type === 'input' || item.type === 'password'"
              v-model="ruleForm[item.name]"
              :is-password="item.type === 'password'"
              :disabled="isLoading"
              :aria-invalid="!!validationErrors[item.name]"
              :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
              :autocomplete="item.type === 'password' ? 'off' : undefined"
              spellcheck="false"
              :placeholder="item.message || item.name"
              :class="{ 'border-error!': validationErrors[item.name] }"
              :title="item.alias || item.name"
              :required="item.required || false"
              :tips="item.tips"
              @blur="touchField(item.name)"
              @input="clearFieldError(item.name)"
            />
            <CustomSwitch
              v-if="item.type === 'confirm'"
              v-model="ruleForm[item.name]"
              :disabled="isLoading"
              :aria-invalid="!!validationErrors[item.name]"
              :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
              :title="item.alias || item.name"
              :description="item.message || ''"
              no-border
              small
              :required="item.required || false"
              :tips="item.tips"
              @update:model-value="clearFieldError(item.name)"
            >
              <template #switch-text>
                <span
                  class="ml-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="ruleForm[item.name] ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary text-secondary'"
                >
                  {{
                    ruleForm[item.name]
                      ? item.confirmText || t('pages.configForm.yes')
                      : item.cancelText || t('pages.configForm.no')
                  }}
                </span>
              </template>
            </CustomSwitch>
            <SingleSelect
              v-if="item.type === 'list' && item.choices"
              v-model="ruleForm[item.name]"
              :fronticon="false"
              :disabled="isLoading"
              :aria-invalid="!!validationErrors[item.name]"
              :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
              :title="item.alias || item.name"
              :placeholder="item.message || item.name"
              class="mt-1 bg-bg-tertiary px-3! py-3!"
              :class="validationErrors[item.name] ? 'border-error!' : 'border-border!'"
              :required="item.required || false"
              :tips="item.tips"
              :select-list="toSelectList(item.choices)"
              :icon="null"
              @change="clearFieldError(item.name)"
            >
              <template #pre-info>
                <option value="" disabled>
                  {{ item.message || item.name }}
                </option>
              </template>
            </SingleSelect>
            <MultiSelect
              v-if="item.type === 'checkbox' && item.choices"
              v-model:choosed="ruleForm[item.name]"
              :disabled="isLoading"
              :aria-invalid="!!validationErrors[item.name]"
              :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
              :title="item.alias || item.name"
              :zero-placeholder="item.message || item.name"
              :icon="null"
              :required="item.required || false"
              :tips="item.tips"
              :trigger-class="[
                'mt-1 bg-bg-tertiary px-3! py-3!',
                validationErrors[item.name] ? 'border-error!' : 'border-border!',
              ]"
              :all-list="toMultiList(item.choices)"
              @change="clearFieldError(item.name)"
            />

            <!-- Validation Error -->
            <template v-if="validationErrors[item.name]" #extra>
              <p
                :id="errorId(item.name)"
                class="mt-2 mb-0 flex items-center gap-1.5 text-xs text-error"
                :class="{ 'px-4 pb-2': item.type === 'confirm' }"
              >
                <CircleAlert :size="14" class="shrink-0" aria-hidden="true" />
                {{ validationErrors[item.name] }}
              </p>
            </template>
          </SettingCard>
        </template>

        <div v-if="$slots['extra-config']" class="col-span-full">
          <slot name="extra-config" />
        </div>
        <!-- Actions stay reachable while scrolling long forms -->
        <div v-if="$slots.default" class="sticky bottom-0 z-10 col-span-full">
          <slot />
        </div>
      </div>
    </SettingSection>
  </div>
</template>

<script lang="ts" setup>
import { CircleAlert, RefreshCw } from '@lucide/vue'
import { cloneDeep, union } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, reactive, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { getConfig } from '@/services/configService'
import { enforceBoolean } from '#/utils/values'

defineSlots<{
  'extra-config'?: () => unknown
  default?: () => unknown
}>()

interface IProps {
  config: IPicGoPluginConfig[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  mode?: 'picbed' | 'plugin'
}

const { config: configProp, type, id, mode = 'picbed' } = defineProps<IProps>()
const emit = defineEmits<{ submit: [] }>()

const $route = useRoute()
const { t } = useI18n()

const configList = ref<IPicGoPluginConfig[]>([])
const ruleForm = reactive<IStringKeyMap>({})
const validationErrors = reactive<IStringKeyMap>({})
const isLoading = ref(true)
const loadFailed = ref(false)
const hasLoaded = ref(false)
const pristineSnapshot = ref('')
const formRef = useTemplateRef('formRef')
const formId = useId()
const errorId = (field: string) => `${formId}-error-${encodeURIComponent(field)}`
let loadVersion = 0

const hasRequired = computed(() => mode === 'picbed' || configList.value.some(item => item.required))
const isDirty = computed(
  () => !isLoading.value && !loadFailed.value && JSON.stringify(ruleForm) !== pristineSnapshot.value,
)

// Watch for config changes
watch(
  [() => configProp, () => type, () => id, () => mode, () => $route.params.configId],
  () => {
    void handleConfig(configProp)
  },
  {
    deep: true,
    immediate: true,
  },
)

function toSelectList(choices: any[]) {
  return choices.map(choice => ({
    value: choice.value ?? choice,
    label: choice.name ?? choice.value ?? choice,
  }))
}

function toMultiList(choices: any[]) {
  return choices.map(choice => ({
    type: choice.value ?? choice,
    name: choice.name ?? choice.value ?? choice,
  }))
}

function validateField(fieldName: string, value: any, config?: IPicGoPluginConfig): string | null {
  if (fieldName === '_configName') {
    if (typeof value !== 'string' || value.trim() === '') {
      return t('pages.configForm.configNameRequired')
    }
    return null
  }

  if (
    config?.required &&
    (value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0))
  ) {
    return t('pages.configForm.fieldRequired', { name: config.alias || config.name })
  }

  return null
}

function validateForm(): boolean {
  const errors: IStringKeyMap = {}

  const configNameError = mode === 'picbed' ? validateField('_configName', ruleForm._configName) : null
  if (configNameError) {
    errors._configName = configNameError
  }

  configList.value.forEach(config => {
    const error = validateField(config.name, ruleForm[config.name], config)
    if (error) {
      errors[config.name] = error
    }
  })
  for (const key in validationErrors) delete validationErrors[key]

  Object.assign(validationErrors, errors)

  return Object.keys(errors).length === 0
}

// Validate only the field the user just left, so untouched fields stay quiet
function touchField(fieldName: string) {
  if (isLoading.value || loadFailed.value) return
  const config = configList.value.find(item => item.name === fieldName)
  const error = validateField(fieldName, ruleForm[fieldName], config)
  if (error) validationErrors[fieldName] = error
  else clearFieldError(fieldName)
}

function clearFieldError(fieldName: string) {
  if (validationErrors[fieldName]) {
    delete validationErrors[fieldName]
  }
}

function handleEnter(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement | null
  if (
    isLoading.value ||
    loadFailed.value ||
    event.isComposing ||
    target?.tagName !== 'INPUT' ||
    !['text', 'password'].includes(target.type)
  )
    return
  event.preventDefault()
  emit('submit')
}

async function focusFirstInvalid() {
  await nextTick()
  const card = formRef.value?.querySelector<HTMLElement>('[data-invalid]')
  if (!card) return
  card.scrollIntoView({ block: 'center' })
  const target =
    card.querySelector<HTMLElement>('[aria-invalid="true"]:not([tabindex="-1"])') ??
    card.querySelector<HTMLElement>('input:not([tabindex="-1"]), button')
  target?.focus({ preventScroll: true })
}

async function validate(): Promise<IStringKeyMap | false> {
  if (isLoading.value || loadFailed.value) return false
  if (validateForm()) return ruleForm
  await focusFirstInvalid()
  return false
}

function getConfigType() {
  switch (type) {
    case 'plugin': {
      return id
    }
    case 'uploader': {
      return `picBed.${id}`
    }
    case 'transformer': {
      return `transformer.${id}`
    }
    default:
      return 'unknown'
  }
}

async function handleConfig(val: IPicGoPluginConfig[]) {
  const version = ++loadVersion
  isLoading.value = true
  loadFailed.value = false
  try {
    const config = await getCurConfigFormData()
    if (version !== loadVersion) return
    for (const key of Object.keys(ruleForm)) delete ruleForm[key]
    for (const key of Object.keys(validationErrors)) delete validationErrors[key]
    Object.assign(ruleForm, config)
    configList.value = cloneDeep(val).map(item => {
      let defaultValue = item.default !== undefined ? item.default : item.type === 'checkbox' ? [] : null
      if (item.type === 'checkbox') {
        const defaults = item.choices?.filter((i: any) => i.checked).map((i: any) => i.value) || []
        defaultValue = union(Array.isArray(defaultValue) ? defaultValue : [], defaults)
      }
      if (config[item.name] !== undefined) {
        defaultValue = config[item.name]
      }
      ruleForm[item.name] = item.type === 'confirm' ? enforceBoolean(defaultValue) : defaultValue
      return item
    })
    pristineSnapshot.value = JSON.stringify(ruleForm)
    hasLoaded.value = true
  } catch {
    if (version === loadVersion) loadFailed.value = true
  } finally {
    if (version === loadVersion) isLoading.value = false
  }
}

async function getCurConfigFormData() {
  if (mode === 'plugin') {
    return (await getConfig<IStringKeyMap>(getConfigType())) || {}
  } else {
    const configId = $route.params.configId
    if (!configId) return {}
    const curTypeConfigList = await getConfig<IStringKeyMap[]>(`uploader.${id}.configList`)
    const selected = Array.isArray(curTypeConfigList) ? curTypeConfigList.find(i => i?._id === configId) : undefined
    if (!selected) throw new Error('The selected configuration is unavailable')
    return selected
  }
}

function updateRuleForm(key: string, value: any) {
  if (isLoading.value || loadFailed.value) return false
  const config = configList.value.find(item => item.name === key)
  ruleForm[key] = config?.type === 'confirm' ? enforceBoolean(value) : value
  clearFieldError(key)
  return true
}

onBeforeUnmount(() => loadVersion++)

defineExpose({
  updateRuleForm,
  validate,
  getConfigType,
  isLoading,
  loadFailed,
  isDirty,
})
</script>
