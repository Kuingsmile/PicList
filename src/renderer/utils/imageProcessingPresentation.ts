import type { ProcessingOptionValue } from '@/utils/imageProcessingConfig'

const positions: Record<string, string> = {
  north: 'top',
  northeast: 'topRight',
  east: 'right',
  southeast: 'bottomRight',
  south: 'bottom',
  southwest: 'bottomLeft',
  west: 'left',
  northwest: 'topLeft',
  centre: 'center',
}

export function formatProcessingValue(key: string, value: ProcessingOptionValue, t: (key: string) => string): string {
  const prefix = 'pages.imageProcess.preview'
  if (typeof value === 'boolean') return t(`${prefix}.${value ? 'enabled' : 'disabled'}`)
  if (key === 'watermarkType') return t(`pages.imageProcess.watermark.${value}`)
  if (key === 'watermarkPosition')
    return t(`pages.imageProcess.watermark.positionOptions.${positions[String(value)] || 'bottomRight'}`)
  if (key === 'convertFormat') return String(value).toUpperCase()
  if (key === 'quality' || key === 'reSizePercent') return `${value}%`
  if (key === 'watermarkScaleRatio') return `${Math.round(Number(value) * 100)}%`
  if (key === 'watermarkImageOpacity') return `${value} / 255`
  if (key === 'rotateDegree' || key === 'watermarkDegree') return `${value}°`
  if (key === 'reSizeWidth' || key === 'reSizeHeight') return value === 0 ? t(`${prefix}.automatic`) : `${value} px`
  if (typeof value === 'object')
    return Object.keys(value).length ? JSON.stringify(value, null, 2) : t(`${prefix}.noRules`)
  if (value === '' && (key === 'watermarkFontPath' || key === 'watermarkImagePath')) return t(`${prefix}.defaultAsset`)
  return String(value) || t(`${prefix}.empty`)
}
