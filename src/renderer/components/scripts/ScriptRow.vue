<template>
  <li
    class="group/script flex min-w-0 items-center gap-3 px-3 py-2 transition-colors duration-fast ease-apple hover:bg-accent/5"
  >
    <div
      class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg transition-colors duration-fast ease-apple"
      :class="muted ? 'bg-bg-tertiary text-secondary' : 'bg-accent/10 text-accent'"
      aria-hidden="true"
    >
      <FileCode :size="16" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <button
        type="button"
        class="min-w-0 cursor-pointer truncate text-left text-sm font-semibold hover:text-accent hover:underline focus-visible:focus-ring"
        :class="muted ? 'text-secondary' : 'text-main'"
        :title="t('pages.scripts.editThing', { name: item.fileName })"
        @click="emit('edit', item)"
      >
        {{ item.fileName }}
      </button>
      <span class="flex items-center gap-1 text-xs text-secondary tabular-nums" :title="fullDate">
        <Clock :size="11" aria-hidden="true" />{{ t('pages.scripts.modifiedAt', { time: shortDate }) }}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <div
        class="flex items-center gap-1 opacity-60 transition-opacity duration-fast ease-apple group-focus-within/script:opacity-100 group-hover/script:opacity-100"
      >
        <button
          v-for="action in iconActions"
          :key="action.key"
          v-tooltip="action.label"
          type="button"
          class="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast ease-apple focus-visible:focus-ring"
          :class="action.danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-accent/10 hover:text-accent'"
          :aria-label="`${action.label}: ${item.fileName}`"
          @click="action.run"
        >
          <component :is="action.icon" :size="15" aria-hidden="true" />
        </button>
      </div>

      <CustomButton
        v-if="category === 'manualTrigger'"
        class="ml-1 h-[30px] px-3! py-0!"
        :icon="Play"
        :icon-size="14"
        :loading="running"
        :text="t('pages.scripts.run')"
        :aria-label="`${t('pages.scripts.runScript')}: ${item.fileName}`"
        @click="emit('run', item)"
      />
      <CustomSwitch
        v-else-if="toggleable"
        v-tooltip="item.enabled ? t('pages.scripts.disableScript') : t('pages.scripts.enableScript')"
        :model-value="item.enabled"
        small
        no-border
        no-hover
        tighter
        class="ml-2"
        :aria-label="`${t('pages.scripts.enabled')}: ${item.fileName}`"
        @update:model-value="emit('toggle', item)"
      />
    </div>
  </li>
</template>

<script setup lang="ts">
import { Clock, FileCode, Pencil, Play, Share2Icon, Trash2 } from '@lucide/vue'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import { isToggleableCategory } from '@/composables/scripts/useScriptCategories'

const { item, running = false } = defineProps<{ item: IStringKeyMap; running?: boolean }>()
const emit = defineEmits<{
  edit: [item: IStringKeyMap]
  share: [item: IStringKeyMap]
  delete: [item: IStringKeyMap]
  toggle: [item: IStringKeyMap]
  run: [item: IStringKeyMap]
}>()
const { t } = useI18n()

const category = computed<string>(() => item.category)
const toggleable = computed(() => isToggleableCategory(category.value))
const muted = computed(() => toggleable.value && !item.enabled)
const fullDate = computed(() => dayjs(item.mtimeMs).format('YYYY/MM/DD HH:mm:ss'))
const shortDate = computed(() => {
  const date = dayjs(item.mtimeMs)
  return date.format(date.isSame(dayjs(), 'year') ? 'MM/DD HH:mm' : 'YYYY/MM/DD')
})

const iconActions = computed(() => [
  { key: 'edit', icon: Pencil, label: t('pages.scripts.editScript'), run: () => emit('edit', item) },
  { key: 'share', icon: Share2Icon, label: t('pages.scripts.marketplace.shareScript'), run: () => emit('share', item) },
  {
    key: 'delete',
    icon: Trash2,
    label: t('pages.scripts.deleteScript'),
    danger: true,
    run: () => emit('delete', item),
  },
])
</script>
