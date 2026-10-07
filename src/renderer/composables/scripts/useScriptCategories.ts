import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type ScriptGroup = 'lifecycle' | 'upload' | 'gallery' | 'manual' | 'uploader'

export interface ScriptCategory {
  type: string
  name: string
  hint: string
  group: ScriptGroup
  // Manual and uploader scripts are never run by a stage, so they can't be switched off.
  toggleable: boolean
}

// Listed in the order PicList runs them; upload stages follow the core lifecycle.
const CATEGORY_DEFINITIONS: { type: string; group: ScriptGroup; hintKey?: string }[] = [
  { type: 'onSoftwareOpen', group: 'lifecycle' },
  { type: 'onSoftwareClose', group: 'lifecycle' },
  { type: 'preProcess', group: 'upload' },
  { type: 'beforeTransform', group: 'upload' },
  { type: 'transform', group: 'upload' },
  { type: 'beforeUpload', group: 'upload' },
  { type: 'upload', group: 'upload' },
  { type: 'afterUpload', group: 'upload' },
  { type: 'onUploadSuccess', group: 'upload' },
  { type: 'onGalleryRemove', group: 'gallery' },
  { type: 'manualTrigger', group: 'manual' },
  { type: 'uploader.advancedplist', group: 'uploader', hintKey: 'advancedplist' },
]

export const SCRIPT_GROUPS: ScriptGroup[] = ['lifecycle', 'upload', 'gallery', 'manual', 'uploader']

export function isToggleableCategory(type: string) {
  return type !== 'manualTrigger' && type !== 'uploader.advancedplist'
}

export function useScriptCategories() {
  const { t } = useI18n()

  const scriptCategories = computed<ScriptCategory[]>(() =>
    CATEGORY_DEFINITIONS.map(({ type, group, hintKey }) => ({
      type,
      group,
      name: t(`pages.scripts.scriptsTypes.${type}`),
      hint: t(`pages.scripts.stageHints.${hintKey ?? type}`),
      toggleable: isToggleableCategory(type),
    })),
  )

  const categoryName = (type: string) => scriptCategories.value.find(cat => cat.type === type)?.name || type

  return { scriptCategories, categoryName }
}
