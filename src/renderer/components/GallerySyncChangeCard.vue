<template>
  <details
    :open="change.kind === 'conflict'"
    class="group/change min-w-0 rounded-lg border bg-bg-tertiary"
    :class="change.kind === 'conflict' && !resolution ? 'border-warning/40' : 'border-border'"
  >
    <summary class="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-secondary"
        :class="kindStyle.color"
      >
        <component :is="kindStyle.icon" :size="18" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-semibold" :title="recordName">{{ recordName }}</h3>
        <p class="mt-0.5 text-xs text-secondary">{{ syncText('versionCount', { count: change.versions.length }) }}</p>
      </div>
      <span class="rounded-md bg-bg-secondary px-2 py-1 text-xs font-medium" :class="kindStyle.color">{{
        syncText(change.kind)
      }}</span>
      <CircleCheck
        v-if="change.kind === 'conflict' && resolution"
        :size="16"
        class="shrink-0 text-success"
        :aria-label="syncText('resolved')"
      />
      <ChevronDown :size="16" class="shrink-0 text-secondary transition-transform group-open/change:rotate-180" />
    </summary>

    <div class="space-y-4 border-t border-border p-4">
      <div class="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
        <section v-for="side in sides" :key="side" class="min-w-0 space-y-3">
          <h4 class="flex items-center gap-2 text-sm font-semibold">
            <component :is="side === 'local' ? Monitor : Cloud" :size="16" class="text-accent" />{{ syncText(side) }}
          </h4>
          <div
            v-for="version in versionsFor(side)"
            :key="version.source"
            class="min-w-0 rounded-md border border-border bg-bg-secondary p-3"
          >
            <p class="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-secondary">
              {{ syncText(version.source) }}
              <span v-if="version.deleted" class="text-danger">{{ syncText('deleted') }}</span>
            </p>
            <p v-if="version.deleted" class="text-sm text-secondary">{{ syncText('deletedDescription') }}</p>
            <dl v-else class="space-y-2 text-sm">
              <div
                v-for="(value, field) in version.details"
                :key="field"
                class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2"
              >
                <dt class="text-secondary">{{ fieldLabel(field) }}</dt>
                <dd class="min-w-0 wrap-anywhere">{{ value }}</dd>
              </div>
              <div v-if="!Object.keys(version.details).length" class="text-secondary">
                {{ version.name || syncText('record') }}
              </div>
            </dl>
          </div>
          <p
            v-if="!versionsFor(side).length"
            class="rounded-md border border-dashed border-border p-3 text-sm text-secondary"
          >
            {{ syncText('noVersion') }}
          </p>
        </section>
      </div>

      <fieldset v-if="change.kind === 'conflict'" :disabled="disabled" class="min-w-0 border-t border-border pt-4">
        <legend class="px-1 text-sm font-semibold">{{ syncText('choose') }}</legend>
        <div class="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
          <label v-for="choice in choices" :key="choice" class="relative">
            <input
              v-model="resolution"
              type="radio"
              :name="`resolution-${change.key}`"
              :value="choice"
              :disabled="!canChoose(choice)"
              class="peer sr-only"
            />
            <span
              class="flex h-full cursor-pointer items-start gap-2 rounded-md border border-border bg-bg-secondary p-3 transition-colors peer-checked:border-accent peer-checked:bg-accent/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-50 hover:border-accent"
            >
              <span
                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                :class="resolution === choice ? 'border-accent bg-accent text-white' : 'border-border'"
              >
                <Check v-if="resolution === choice" :size="12" />
              </span>
              <span>
                <span class="block text-sm font-semibold">{{ syncText(choice) }}</span>
                <span class="mt-1 block text-xs leading-relaxed text-secondary">{{
                  syncText(`${choice}Description`)
                }}</span>
              </span>
            </span>
          </label>
        </div>
        <p class="mt-3 flex items-center gap-1.5 text-xs" :class="resolution ? 'text-secondary' : 'text-warning'">
          <CircleCheck v-if="resolution" :size="14" class="text-success" />
          <Info v-else :size="14" />
          {{
            resolution
              ? syncText('selectedResolution', { choice: syncText(resolution) })
              : syncText('selectionRequired')
          }}
        </p>
        <p v-if="change.legacySuggestion" class="mt-2 text-xs text-secondary">
          {{ syncText('legacy') }} {{ syncText(change.legacySuggestion) }}
        </p>
      </fieldset>
    </div>
  </details>
</template>

<script setup lang="ts">
import { Check, ChevronDown, CircleCheck, Cloud, GitMerge, Info, Monitor, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { GallerySyncChange, GallerySyncResolution } from '#/types/gallerySync'

const { change, disabled } = defineProps<{ change: GallerySyncChange; disabled: boolean }>()
const resolution = defineModel<GallerySyncResolution | ''>({ default: '' })
const { t, te } = useI18n()
const syncText = (key: string, params: Record<string, string | number> = {}) =>
  t(`pages.settings.sync.galleryPlan.${key}`, params)
const sides = ['local', 'remote'] as const
const choices: GallerySyncResolution[] = ['keep-local', 'keep-remote', 'preserve-both']
const kindStyles = {
  addition: { icon: Plus, color: 'text-success' },
  update: { icon: Pencil, color: 'text-accent' },
  conflict: { icon: GitMerge, color: 'text-warning' },
  deletion: { icon: Trash2, color: 'text-danger' },
}
const kindStyle = computed(() => kindStyles[change.kind])
const recordName = computed(() => change.versions.find(version => version.name)?.name || syncText('record'))
const versionsFor = (side: 'local' | 'remote') => change.versions.filter(version => version.source.startsWith(side))
const canChoose = (choice: GallerySyncResolution) =>
  choice === 'preserve-both' || versionsFor(choice === 'keep-local' ? 'local' : 'remote').length > 0
const fieldLabel = (field: string) =>
  te(`pages.settings.sync.galleryPlan.fields.${field}`) ? syncText(`fields.${field}`) : field
</script>
