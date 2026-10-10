import { getFileIconPath } from '@/manage/utils/filePresentation'

type GalleryPreviewItem = Pick<ImgInfo, 'extname' | 'fileName' | 'imgUrl'> & {
  galleryPath?: string
}

export const JXL_LOADING_PREVIEW_SRC = './loading.jpg'
export const JXL_ERROR_PREVIEW_SRC = './errorLoading.png'

const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.pjp',
  '.png',
  '.apng',
  '.gif',
  '.webp',
  '.bmp',
  '.ico',
  '.svg',
  '.avif',
  '.jxl',
])

function stripUrlSuffix(value: string): string {
  return value.split(/[?#]/, 1)[0]
}

function getSourceExtension(value?: string): string {
  if (!value) return ''
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname
    } catch {
      // Fall back to the original path for malformed URLs.
    }
  }
  const match = stripUrlSuffix(value).match(/\.([a-z0-9_]+)$/i)
  return match ? `.${match[1].toLowerCase()}` : ''
}

function hasJxlExtension(value?: string): boolean {
  return getSourceExtension(value) === '.jxl'
}

function hasNonJxlExtension(value?: string): boolean {
  const extension = getSourceExtension(value)
  return extension !== '' && extension !== '.jxl'
}

function normalizeExtname(extname?: string): string {
  if (!extname) return ''
  const normalized = extname.toLowerCase()
  return normalized.startsWith('.') ? normalized : `.${normalized}`
}

function isInlineImageSource(value: string): boolean {
  return /^(data:|blob:)/i.test(value)
}

export function getGalleryFileIconSource(item: GalleryPreviewItem): string {
  const metadataExtension = getSourceExtension(item.fileName) || normalizeExtname(item.extname)
  const source = item.galleryPath || item.imgUrl || ''
  if (!metadataExtension && isInlineImageSource(source)) return ''

  const extension = metadataExtension || getSourceExtension(source)
  if (imageExtensions.has(extension) || getJxlPreviewSource(item)) return ''
  // Keep trying extensionless image URLs when no filename identifies the file.
  if (!extension && !item.fileName && source) return ''

  return `./assets/icons/${getFileIconPath(`file${extension}`)}`
}

export function getJxlPreviewSource(item?: GalleryPreviewItem): string {
  const hasJxlMetadata = hasJxlExtension(item?.fileName) || normalizeExtname(item?.extname) === '.jxl'
  const previewSources = [item?.galleryPath, item?.imgUrl].filter(Boolean) as string[]
  const usableSources = previewSources.filter(source => !isInlineImageSource(source))
  const explicitJxlSource = usableSources.find(source => hasJxlExtension(source))

  if (explicitJxlSource) return explicitJxlSource
  if (!hasJxlMetadata) return ''

  return (
    [item?.imgUrl, item?.galleryPath].find(
      source => source && !isInlineImageSource(source) && !hasNonJxlExtension(source),
    ) || ''
  )
}

function getNativeFallbackSource(item: GalleryPreviewItem, jxlPreviewSource: string): string {
  const fallbackSrc = item.galleryPath || item.imgUrl || ''
  if (!fallbackSrc || fallbackSrc === jxlPreviewSource || hasJxlExtension(fallbackSrc)) return ''
  return fallbackSrc
}

export function getGalleryPreviewSource(
  item: GalleryPreviewItem,
  jxlPreviews: Record<string, string>,
  jxlPreviewLoading: Record<string, boolean> = {},
  jxlPreviewErrors: Record<string, boolean> = {},
  preferNativeFallbackOnError = false,
): string {
  const fileIconSource = getGalleryFileIconSource(item)
  if (fileIconSource) return fileIconSource

  const fallbackSrc = item.galleryPath || item.imgUrl || ''
  const jxlPreviewSource = getJxlPreviewSource(item)
  if (!jxlPreviewSource) return fallbackSrc
  const nativeFallbackSrc = getNativeFallbackSource(item, jxlPreviewSource)

  if (jxlPreviews[jxlPreviewSource]) return jxlPreviews[jxlPreviewSource]
  if (jxlPreviewErrors[jxlPreviewSource]) {
    if (preferNativeFallbackOnError) return fallbackSrc
    return nativeFallbackSrc || JXL_ERROR_PREVIEW_SRC
  }
  if (jxlPreviewLoading[jxlPreviewSource]) return nativeFallbackSrc || JXL_LOADING_PREVIEW_SRC

  return fallbackSrc
}
