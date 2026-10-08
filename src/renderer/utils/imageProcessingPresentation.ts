import type { ComposerTranslation } from 'vue-i18n'

import {
  normalizeWatermarkPosition,
  parseSkipProcessExtensions,
  type ProcessingConfigSource,
  type ProcessingOptionValue,
  type ProcessingUploader,
  type ResolvedImageProcessingConfig,
  type ResolvedProcessingOption,
} from '@/utils/imageProcessingConfig'

type Translate = ComposerTranslation

const preview = 'pages.imageProcess.preview'

const positionLabels: Record<string, string> = {
  northwest: 'topLeft',
  north: 'top',
  northeast: 'topRight',
  west: 'left',
  centre: 'center',
  east: 'right',
  southwest: 'bottomLeft',
  south: 'bottom',
  southeast: 'bottomRight',
}
export const watermarkPositions = Object.keys(positionLabels)

export function formatWatermarkPosition(value: ProcessingOptionValue, t: Translate) {
  return t(
    `pages.imageProcess.watermark.positionOptions.${positionLabels[normalizeWatermarkPosition(value)] || 'bottomRight'}`,
  )
}

// The processor's 0-255 alpha reads more naturally as a percentage.
export function formatOpacity(value: ProcessingOptionValue) {
  return `${Math.round(((Number(value) || 0) / 255) * 100)}%`
}

export function formatProcessingValue(key: string, value: ProcessingOptionValue, t: Translate): string {
  if (typeof value === 'boolean') return t(`${preview}.${value ? 'enabled' : 'disabled'}`)
  if (key === 'watermarkType') return t(`pages.imageProcess.watermark.${value}`)
  if (key === 'watermarkPosition') return formatWatermarkPosition(value, t)
  if (key === 'convertFormat') return String(value).toUpperCase()
  if (key === 'quality' || key === 'reSizePercent') return `${value}%`
  if (key === 'watermarkScaleRatio') return `${Math.round(Number(value) * 100)}%`
  if (key === 'watermarkImageOpacity') return formatOpacity(value)
  if (key === 'rotateDegree' || key === 'watermarkDegree') return `${value}°`
  if (key === 'reSizeWidth' || key === 'reSizeHeight') return value === 0 ? t(`${preview}.automatic`) : `${value} px`
  if (key === 'skipProcessExtList')
    return (
      parseSkipProcessExtensions(value)
        .map(extension => `.${extension}`)
        .join(' ') || t('pages.imageProcess.studio.nav.extensions', 0)
    )
  if (typeof value === 'object')
    return Object.keys(value).length
      ? Object.entries(value)
          .map(([from, to]) => `${from.toUpperCase()} → ${String(to).toUpperCase()}`)
          .join(', ')
      : t(`${preview}.noRules`)
  if (value === '' && (key === 'watermarkFontPath' || key === 'watermarkImagePath')) return t(`${preview}.defaultAsset`)
  return String(value) || t(`${preview}.empty`)
}

export function formatProcessingSource(source: ProcessingConfigSource, uploader: ProcessingUploader, t: Translate) {
  return t(`pages.imageProcess.design.sources.${source}`, {
    provider: uploader.providerName || uploader.type,
    config: uploader.configName || t(`${preview}.unnamedConfig`),
  })
}

/**
 * A summary has one source only when every option behind it comes from the same level.
 * Built-in defaults count as the all-uploads level, so they don't make a summary look mixed.
 */
function commonSource(...options: ResolvedProcessingOption[]): ProcessingConfigSource | undefined {
  const sources = new Set(options.map(option => option.source))
  if (sources.size === 1) return options[0].source
  return sources.size === 2 && sources.has('global') && sources.has('default') ? 'global' : undefined
}

export interface ProcessingSummary {
  id: 'quality' | 'format' | 'dimensions' | 'orientation' | 'watermark' | 'naming'
  category: 'general' | 'transform' | 'watermark' | 'rename'
  label: string
  value: string
  active: boolean
  source?: ProcessingConfigSource
}

function dimensionsSummary({ compress: c }: ResolvedImageProcessingConfig, t: Translate) {
  if (c.isReSizeByPercent.value) {
    const active = Number(c.reSizePercent.value) > 0
    return {
      active,
      value: active
        ? t(`${preview}.percentDimensions`, { value: c.reSizePercent.value })
        : t(`${preview}.originalDimensions`),
      source: commonSource(c.isReSizeByPercent, c.reSizePercent),
    }
  }
  const width = Number(c.reSizeWidth.value)
  const height = Number(c.reSizeHeight.value)
  if (!c.isReSize.value || (width <= 0 && height <= 0)) {
    return {
      active: false,
      value: t(`${preview}.originalDimensions`),
      source: commonSource(c.isReSizeByPercent, c.isReSize),
    }
  }
  const source = commonSource(
    c.isReSizeByPercent,
    c.isReSize,
    ...(width > 0 ? [c.reSizeWidth] : []),
    ...(height > 0 ? [c.reSizeHeight] : []),
    ...(width === 0 && c.longEdgeAsHeight.value ? [c.longEdgeAsHeight] : []),
  )
  let value = `${width} × ${height} px`
  if (height <= 0) value = t(`${preview}.widthDimensions`, { value: width })
  else if (width <= 0)
    value = t(`${preview}.${c.longEdgeAsHeight.value ? 'longEdgeDimensions' : 'heightDimensions'}`, { value: height })
  return { active: true, value, source }
}

export function processingSummaries(settings: ResolvedImageProcessingConfig, t: Translate): ProcessingSummary[] {
  const { compress: c, watermark: w, rename, naming } = settings
  const studio = 'pages.imageProcess.studio'
  const rules = Object.keys(c.formatConvertObj.value).length

  const orientation = [
    ...(c.isRotate.value && Number(c.rotateDegree.value)
      ? [t(`${studio}.summary.rotate`, { degree: c.rotateDegree.value })]
      : []),
    ...(c.isFlop.value ? [t(`${studio}.summary.mirror`)] : []),
    ...(c.isFlip.value ? [t(`${studio}.summary.flip`)] : []),
  ]
  const nameSteps = [
    ...(rename.enable.value ? [t(`${studio}.summary.pattern`)] : []),
    ...(naming.autoRename.value ? [t(`${studio}.summary.timestamp`)] : []),
    ...(naming.manualRename.value ? [t(`${studio}.summary.ask`)] : []),
  ]

  return [
    {
      id: 'quality',
      category: 'general',
      label: t(`${studio}.summary.quality`),
      value: `${c.quality.value}%`,
      active: Number(c.quality.value) < 100,
      source: c.quality.source,
    },
    {
      id: 'format',
      category: 'general',
      label: t(`${studio}.summary.format`),
      active: !!c.isConvert.value,
      value: c.isConvert.value
        ? `${String(c.convertFormat.value).toUpperCase()}${rules ? ` · ${t(`${studio}.summary.rules`, rules)}` : ''}`
        : t(`${preview}.originalFormat`),
      source: c.isConvert.value
        ? commonSource(c.isConvert, c.convertFormat, ...(rules ? [c.formatConvertObj] : []))
        : c.isConvert.source,
    },
    {
      id: 'dimensions',
      category: 'transform',
      label: t(`${studio}.summary.dimensions`),
      ...dimensionsSummary(settings, t),
    },
    {
      id: 'orientation',
      category: 'transform',
      label: t(`${studio}.summary.orientation`),
      active: orientation.length > 0,
      value: orientation.join(' · ') || t(`${studio}.summary.unchanged`),
      source: commonSource(c.isRotate, c.isFlip, c.isFlop, ...(c.isRotate.value ? [c.rotateDegree] : [])),
    },
    {
      id: 'watermark',
      category: 'watermark',
      label: t(`${studio}.summary.watermark`),
      active: !!w.isAddWatermark.value,
      value: w.isAddWatermark.value
        ? [
            t(`pages.imageProcess.watermark.${w.watermarkType.value}`),
            w.isFullScreenWatermark.value
              ? t(`${studio}.summary.tiled`)
              : formatWatermarkPosition(w.watermarkPosition.value, t),
          ].join(' · ')
        : t(`${studio}.off`),
      source: w.isAddWatermark.value
        ? commonSource(
            w.isAddWatermark,
            w.watermarkType,
            w.isFullScreenWatermark,
            ...(w.isFullScreenWatermark.value ? [] : [w.watermarkPosition]),
          )
        : w.isAddWatermark.source,
    },
    {
      id: 'naming',
      category: 'rename',
      label: t(`${studio}.summary.naming`),
      active: nameSteps.length > 0,
      value: nameSteps.join(' · ') || t(`${studio}.summary.originalName`),
      source: commonSource(rename.enable, naming.autoRename, naming.manualRename),
    },
  ]
}
