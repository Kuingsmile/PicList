import { useStorage } from '@vueuse/core'
import { inject, type InjectionKey, provide, ref, useId } from 'vue'

import { useImageProcessingSettings } from '@/composables/useImageProcessingSettings'
import type { ProcessingGroup, ProcessingScope } from '@/utils/imageProcessingConfig'

export const processingCategories = ['general', 'watermark', 'transform', 'skipProcess', 'rename'] as const
export type ProcessingCategory = (typeof processingCategories)[number]

// Provider overrides are only stored for compress and watermark options.
export const globalOrConfigCategories: readonly ProcessingCategory[] = ['skipProcess', 'rename']

export function useImageProcessStudio(configId: () => string, provider: () => string) {
  const settings = useImageProcessingSettings(configId, provider)
  const processingId = useId()
  const activeCategory = useStorage<ProcessingCategory>('image-process-setting-active-tab', 'general')
  if (!processingCategories.includes(activeCategory.value)) activeCategory.value = 'general'
  const view = ref<'edit' | 'review'>('edit')
  const showSources = ref(false)

  function controlId(field: string) {
    return `${processingId}-${field}`
  }
  function inheritSetting(field: string) {
    const [group, key] = field.split('.')
    settings.updateSetting(group as ProcessingGroup, key)
  }
  function editScope(level: ProcessingScope) {
    settings.scope.value = level
    view.value = 'edit'
  }

  return { ...settings, activeCategory, view, showSources, controlId, inheritSetting, editScope }
}

type ImageProcessContext = ReturnType<typeof useImageProcessStudio>
const imageProcessKey: InjectionKey<ImageProcessContext> = Symbol('imageProcess')

export function provideImageProcess(context: ImageProcessContext) {
  provide(imageProcessKey, context)
}

export function useImageProcessContext() {
  const context = inject(imageProcessKey)
  if (!context) throw new Error('Image processing panels must be rendered inside ImageProcessSetting.')
  return context
}
