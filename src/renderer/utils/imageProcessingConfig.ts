import type { IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'

export type ProcessingConfigSource = 'config' | 'provider' | 'global' | 'default'
export type ProcessingOptionValue = boolean | number | string | Record<string, string>

export interface ResolvedProcessingOption {
  value: ProcessingOptionValue
  source: ProcessingConfigSource
}

export interface ProcessingUploader {
  type: string
  id: string
  providerName: string
  configName: string
}

export interface ImageProcessingGlobals {
  compress?: IBuildInCompressOptions
  watermark?: IBuildInWaterMarkOptions
  skipProcess?: { skipProcessExtList?: string }
  rename?: { enable?: boolean; format?: string }
  autoRename?: boolean
  manualRename?: boolean
}

/** Source extensions that format rules can map from. */
export const convertibleExtensions = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'svg',
  'ico',
  'avif',
  'heif',
  'heic',
]

/** Output formats sharp can write, common web formats first. */
export const outputFormats = [
  'webp',
  'jpg',
  'png',
  'avif',
  'gif',
  'jpeg',
  'tiff',
  'tif',
  'heif',
  'svg',
  'input',
  'dz',
  'fits',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'ppm',
  'raw',
  'v',
]

export function normalizeWatermarkPosition(value: ProcessingOptionValue) {
  return value === 'center' ? 'centre' : String(value)
}

/** Match the upload lifecycle's comma-only parsing and extension normalization. */
export function parseSkipProcessExtensions(value: ProcessingOptionValue) {
  return [
    ...new Set(
      String(value)
        .split(',')
        .map(extension => extension.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean),
    ),
  ]
}

// These are processing fallbacks, not the suggested values in the settings inputs.
const compressDefaults = {
  quality: 100,
  isRemoveExif: false,
  isConvert: false,
  convertFormat: 'jpg',
  formatConvertObj: {},
  isFlip: false,
  isFlop: false,
  isRotate: false,
  rotateDegree: 0,
  isReSize: false,
  reSizeWidth: 0,
  reSizeHeight: 0,
  longEdgeAsHeight: false,
  skipReSizeOfSmallImg: false,
  isReSizeByPercent: false,
  reSizePercent: 0,
}

const watermarkDefaults = {
  isAddWatermark: false,
  watermarkType: 'text',
  isFullScreenWatermark: false,
  watermarkDegree: 0,
  watermarkScaleRatio: 0.15,
  watermarkText: '',
  watermarkFontPath: '',
  watermarkColor: '#CCCCCC73',
  watermarkImagePath: '',
  watermarkImageOpacity: 0,
  watermarkPosition: 'southeast',
}

export const imageProcessingDefaults = {
  compress: compressDefaults,
  watermark: watermarkDefaults,
  skipProcess: { skipProcessExtList: 'zip,rar,7z,tar,gz,tar.gz,tar.bz2,tar.xz' },
  rename: { enable: false, format: '{filename}' },
  naming: { autoRename: false, manualRename: false },
}

export type ProcessingGroup = keyof typeof imageProcessingDefaults
export type ProcessingScope = Exclude<ProcessingConfigSource, 'default'>

type ResolvedGroup<T> = { [K in keyof T]: ResolvedProcessingOption }

function resolveGroup<T extends Record<string, ProcessingOptionValue>>(
  defaults: T,
  global: Record<string, unknown> = {},
  profile: Record<string, unknown> = {},
  provider = '',
): ResolvedGroup<T> {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      // PicList's processing pipeline only reads global/profile font paths.
      const map = key === 'watermarkFontPath' ? undefined : (global[`${key}Map`] as Record<string, unknown> | undefined)
      const candidates = [
        ['config', profile[key]],
        ['provider', provider ? map?.[provider] : undefined],
        ['global', global[key]],
      ] as const
      const [source, value] = candidates.find(([, value]) => value !== undefined && value !== null) ?? [
        'default',
        fallback,
      ]
      return [key, { value, source }]
    }),
  ) as ResolvedGroup<T>
}

function normalizeNumber(option: ResolvedProcessingOption) {
  const number = Number(option.value)
  option.value = Number.isFinite(number) ? number : 0
}

function normalizeGroup<T extends Record<string, ProcessingOptionValue>>(defaults: T, group: ResolvedGroup<T>) {
  for (const [key, fallback] of Object.entries(defaults)) {
    const option = group[key]
    if (typeof fallback === 'boolean') option.value = !!option.value
    if (typeof fallback === 'number') normalizeNumber(option)
    if (typeof fallback === 'string') option.value = String(option.value || fallback)
  }
}

/** Resolve only processing options; uploader credentials must never enter the preview. */
export function resolveImageProcessingConfig(
  global: ImageProcessingGlobals,
  profile: ImageProcessingGlobals = {},
  provider = '',
) {
  const compress = resolveGroup(compressDefaults, global.compress ?? {}, profile.compress ?? {}, provider)
  const watermark = resolveGroup(watermarkDefaults, global.watermark ?? {}, profile.watermark ?? {}, provider)
  normalizeGroup(compressDefaults, compress)
  normalizeGroup(watermarkDefaults, watermark)
  watermark.watermarkPosition.value = normalizeWatermarkPosition(watermark.watermarkPosition.value)

  // Match encoder quality and watermark scaling fallbacks in PicList's processor.
  const quality = compress.quality.value as number
  compress.quality.value = quality > 0 && quality < 100 ? Math.max(1, Math.round(quality)) : 100
  const scale = watermark.watermarkScaleRatio.value as number
  watermark.watermarkScaleRatio.value = scale > 0 && scale <= 1 ? scale : 0.15
  try {
    const mapping = compress.formatConvertObj.value
    const parsed = typeof mapping === 'string' ? JSON.parse(mapping) : mapping
    compress.formatConvertObj.value = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    compress.formatConvertObj.value = {}
  }

  // Empty exclusion lists inherit in the upload lifecycle (unlike other string settings).
  const skipProcess = resolveGroup(
    imageProcessingDefaults.skipProcess,
    { skipProcessExtList: global.skipProcess?.skipProcessExtList || undefined },
    { skipProcessExtList: profile.skipProcess?.skipProcessExtList || undefined },
  )
  const rename = resolveGroup(imageProcessingDefaults.rename, global.rename ?? {}, profile.rename ?? {})
  const naming = resolveGroup(
    imageProcessingDefaults.naming,
    { autoRename: global.autoRename, manualRename: global.manualRename },
    { autoRename: profile.autoRename, manualRename: profile.manualRename },
  )
  normalizeGroup(imageProcessingDefaults.rename, rename)
  normalizeGroup(imageProcessingDefaults.naming, naming)

  return { compress, watermark, skipProcess, rename, naming }
}

export type ResolvedImageProcessingConfig = ReturnType<typeof resolveImageProcessingConfig>
