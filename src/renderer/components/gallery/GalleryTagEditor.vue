<template>
  <CustomModal
    v-model:visible="visible"
    width="440px"
    height="auto"
    :title="t('pages.gallery.tags.edit')"
    :description="description"
    :close-disabled="saving"
    :initial-focus="searchInput"
  >
    <div class="flex flex-col gap-3 p-4">
      <input
        ref="searchInput"
        v-model="search"
        type="search"
        :aria-label="t('pages.gallery.tags.find')"
        :placeholder="t('pages.gallery.tags.find')"
        :disabled="saving"
        class="w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-main focus:border-accent focus:outline-none focus-visible:focus-ring"
        @keydown.enter="onSearchEnter"
      />
      <div class="max-h-[40vh] overflow-y-auto">
        <button
          v-if="query && !exactMatch"
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
          :disabled="saving"
          @click="addFromSearch"
        >
          <PlusIcon :size="16" class="shrink-0" aria-hidden="true" />
          <span class="min-w-0 wrap-anywhere">{{ t('pages.gallery.tags.create', { tag: search.trim() }) }}</span>
        </button>
        <button
          v-for="{ tag, state } in filteredChoices"
          :key="tag"
          type="button"
          role="checkbox"
          :aria-checked="state"
          :aria-label="tag"
          :disabled="saving"
          class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/10 focus-visible:focus-ring"
          @click="toggle(tag)"
        >
          <span
            class="flex size-4 shrink-0 items-center justify-center rounded-sm border"
            :class="state ? 'border-accent bg-accent text-white' : 'border-border'"
            aria-hidden="true"
          >
            <MinusIcon v-if="state === 'mixed'" :size="12" />
            <CheckIcon v-else-if="state" :size="12" />
          </span>
          <GalleryTagChip :tag :title="tag" />
          <span v-if="state === 'mixed'" class="ml-auto shrink-0 text-xs text-secondary">{{
            t('pages.gallery.tags.some')
          }}</span>
        </button>
      </div>
      <p v-if="error" role="alert" class="m-0 text-sm text-danger">{{ error }}</p>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" :disabled="saving" @click="visible = false" />
      <CustomButton :text="t('common.save')" :disabled="!changes.size" :loading="saving" @click="save" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { CheckIcon, MinusIcon, PlusIcon } from '@lucide/vue'
import { computed, reactive, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import useMessage from '@/composables/useMessage'
import { invokeRPC } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'
import { galleryTagKey } from '#/galleryTags'
import { RpcError } from '#/rpc'

import GalleryTagChip from './GalleryTagChip.vue'

const { availableTags } = defineProps<{ availableTags: string[] }>()
const emit = defineEmits<{ refresh: [] }>()
const { t } = useI18n()
const message = useMessage()
const visible = ref(false)
const saving = ref(false)
const error = ref('')
const selectedIds = shallowRef<string[]>([])
const description = ref('')
const counts = shallowRef(new Map<string, number>())
const choices = ref<string[]>([])
const changes = reactive(new Map<string, boolean>())
const search = ref('')
const searchInput = useTemplateRef('searchInput')
const query = computed(() => galleryTagKey(search.value))
const exactMatch = computed(() => choices.value.find(tag => galleryTagKey(tag) === query.value))
function initialState(tag: string): boolean | 'mixed' {
  const count = counts.value.get(galleryTagKey(tag)) ?? 0
  if (!count) return false
  return count === selectedIds.value.length ? true : 'mixed'
}
const filteredChoices = computed(() =>
  choices.value
    .filter(tag => galleryTagKey(tag).includes(query.value))
    .map(tag => ({ tag, state: changes.get(tag) ?? initialState(tag) })),
)

function open(items: IGalleryItem[]) {
  if (!items.length || saving.value) return
  selectedIds.value = items.map(item => item.id!)
  description.value = items.length === 1 ? items[0].fileName || '' : t('pages.gallery.selectedCount', items.length)
  const usage = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.galleryTags) {
      const key = galleryTagKey(tag)
      usage.set(key, (usage.get(key) ?? 0) + 1)
    }
  }
  counts.value = usage
  choices.value = [...availableTags]
  changes.clear()
  search.value = ''
  error.value = ''
  visible.value = true
}

function toggle(tag: string) {
  const initial = initialState(tag)
  const current = changes.get(tag) ?? initial
  // A mixed selection cycles through all, none and its original assignments.
  const next = initial === 'mixed' && current === false ? 'mixed' : current !== true
  if (next === initial) changes.delete(tag)
  else if (next !== 'mixed') changes.set(tag, next)
}

function addFromSearch() {
  if (!query.value) return
  const tag = exactMatch.value ?? search.value.trim().normalize()
  if (!exactMatch.value) choices.value.unshift(tag)
  if (initialState(tag) === true) changes.delete(tag)
  else changes.set(tag, true)
  search.value = ''
  searchInput.value?.focus()
}

function onSearchEnter(event: KeyboardEvent) {
  if (event.isComposing) return
  event.preventDefault()
  addFromSearch()
}

async function save() {
  if (saving.value || !changes.size) return
  saving.value = true
  error.value = ''
  try {
    const add: string[] = []
    const remove: string[] = []
    for (const [tag, checked] of changes) {
      if (checked) add.push(tag)
      else remove.push(tag)
    }
    await invokeRPC(IRPCActionType.GALLERY_EDIT_TAGS, selectedIds.value, add, remove)
    visible.value = false
    emit('refresh')
    message.success(t('pages.gallery.tags.saved'))
  } catch (cause) {
    const missing = cause instanceof RpcError && cause.code === 'NOT_FOUND'
    error.value = t(missing ? 'pages.gallery.tags.missing' : 'pages.gallery.tags.saveFailed')
    if (missing) emit('refresh')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
