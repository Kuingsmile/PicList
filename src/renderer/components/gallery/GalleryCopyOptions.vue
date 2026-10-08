<template>
  <div ref="dropdownRef" class="relative" @focusout="handleFocusOut">
    <button
      ref="triggerRef"
      v-tooltip="t('pages.gallery.copyOptions')"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="dropDownOpen"
      :aria-controls="dropDownOpen ? panelId : undefined"
      :aria-label="`${t('pages.gallery.copyOptions')}: ${formatLabel(pasteStyle)}`"
      class="flex h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3 text-sm font-semibold whitespace-nowrap text-main transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/10 focus-visible:focus-ring"
      :class="{ 'border-accent bg-accent/10 text-accent': dropDownOpen }"
      @click="toggleDropdown()"
      @keydown="handleTriggerKeydown"
    >
      <ClipboardIcon :size="15" class="shrink-0" aria-hidden="true" />
      <span class="max-sm:sr-only">{{ formatLabel(pasteStyle) }}</span>
      <span
        v-if="noCache"
        class="h-[6px] w-[6px] shrink-0 rounded-full bg-accent max-sm:hidden"
        :title="t('pages.gallery.isAlwaysForceReload')"
        aria-hidden="true"
      />
      <ChevronDownIcon
        :size="14"
        class="shrink-0 text-secondary transition-transform duration-fast ease-apple"
        :class="{ 'rotate-180': dropDownOpen }"
        aria-hidden="true"
      />
    </button>

    <!-- v-if, not v-show: the gallery pauses its shortcuts while any dialog is in the document. -->
    <div
      v-if="dropDownOpen"
      :id="panelId"
      ref="optionsRef"
      role="dialog"
      :aria-label="t('pages.gallery.copyOptions')"
      class="fixed z-10000 flex flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-border-secondary bg-bg-tertiary p-4 shadow-lg"
      @keydown.esc.stop.prevent="closeDropdown(true)"
    >
      <div class="flex flex-col gap-1.5" role="group" :aria-labelledby="`${panelId}-format`">
        <span :id="`${panelId}-format`" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">
          {{ t('pages.gallery.pasteFormat') }}
        </span>
        <div class="flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5">
          <CustomButton
            v-for="style in pasteStyles"
            :key="style"
            type="tab"
            :active="pasteStyle === style"
            :text="formatLabel(style)"
            class="h-full px-2! py-0!"
            @click="pasteStyle = style"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5" role="group" :aria-labelledby="`${panelId}-url`">
        <span :id="`${panelId}-url`" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">
          {{ t('pages.gallery.urlType') }}
        </span>
        <div class="flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5">
          <CustomButton
            v-for="type in urlTypes"
            :key="type"
            type="tab"
            :active="urlType === type"
            :text="t(`pages.gallery.${type}`)"
            class="h-full px-2! py-0!"
            @click="urlType = type"
          />
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-border-secondary pt-3">
        <span class="flex min-w-0 items-center gap-1">
          <span class="truncate text-[0.925rem] leading-[1.4] font-semibold text-secondary">
            {{ t('pages.gallery.isAlwaysForceReload') }}
          </span>
          <HelpTooltip :content="t('pages.gallery.isAlwaysForceReloadTip')" />
        </span>
        <CustomSwitch
          v-model="noCache"
          :aria-label="t('pages.gallery.isAlwaysForceReload')"
          small
          tighter
          no-border
          no-hover
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ClipboardIcon } from '@lucide/vue'
import { nextTick, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import { useDropdown } from '@/composables/useDropdown'
import { IPasteStyle } from '#/constants/app'

const pasteStyle = defineModel<string>('pasteStyle', { required: true })
const urlType = defineModel<string>('urlType', { required: true })
const noCache = defineModel<boolean>('noCache', { required: true })

const { t } = useI18n()

const panelId = useId()

const pasteStyles = Object.values(IPasteStyle) as string[]

const urlTypes = ['longUrl', 'shortUrl']

const { dropDownOpen, toggleDropdown, closeDropdown, handleTriggerKeydown, dropdownRef, optionsRef } = useDropdown({
  minWidth: 340,
  maxHeight: 480,
})

function formatLabel(style: string) {
  return style === IPasteStyle.MARKDOWN ? 'Markdown' : style
}

// Start keyboard users on the format that is currently in use.
watch(dropDownOpen, async open => {
  if (!open) return
  await nextTick()
  optionsRef.value?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
})

function handleFocusOut(event: FocusEvent) {
  if (!dropDownOpen.value) return
  const next = event.relatedTarget as Node | null
  if (next && !dropdownRef.value?.contains(next)) closeDropdown()
}
</script>
