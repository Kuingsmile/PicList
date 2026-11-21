<template>
  <button
    v-tooltip="label"
    type="button"
    class="flex min-h-6 max-w-full min-w-0 cursor-pointer items-center gap-1 rounded text-left text-secondary hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
    :aria-label="label"
    @click.stop="emit('edit')"
    @dblclick.stop
  >
    <TagIcon v-if="!tags.length" :size="15" class="mx-1" aria-hidden="true" />
    <GalleryTagChip v-for="tag in tags.slice(0, 2)" :key="tag" :tag />
    <span v-if="tags.length > 2" class="shrink-0 text-xs tabular-nums">+{{ tags.length - 2 }}</span>
  </button>
</template>

<script setup lang="ts">
import { TagIcon } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import GalleryTagChip from './GalleryTagChip.vue'

const { tags, name } = defineProps<{ tags: string[]; name: string }>()
const emit = defineEmits<{ edit: [] }>()
const { t } = useI18n()
const label = computed(() => [t('pages.gallery.tags.editFor', { name }), ...tags].join(' · '))
</script>
