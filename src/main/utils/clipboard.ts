import picgo from '@core/picgo'
import { clipboard, nativeImage } from 'electron'

import { getClipboardTextFilePath } from '~/utils/clipboardFilePath'
import { configPaths } from '~/utils/configPaths'

export const handleCopyUrl = async (str: string): Promise<void> => {
  if (picgo.getConfig<boolean>(configPaths.settings.autoCopy) !== false) {
    await clipboard.writeText(str)
  }
}

type UploadFormat =
  | 'image/png'
  | 'image/jpeg'
  | 'text/plain'
  | 'text/uri-list'
  | 'electron application/osclipboard;format="public.file-url"'
  | 'electron application/osclipboard;format="FileNameW"'

async function readClipboard<T>(readImage: (blob: Blob) => T | Promise<T | undefined>, verifyFileDrop = false) {
  const items = await clipboard.read()
  const read = (type: UploadFormat) => items.find(item => item.types.includes(type))?.getType(type)
  // Electron exposes native file drops (including Explorer's CF_HDROP) as a URI list.
  // Read it before any bitmap preview so the uploader gets the original file.
  const urls = await read('text/uri-list')
  let filePath = ''
  if (urls) {
    // Let the Windows uploader open slow network shares without timing out during a stat.
    filePath = await getClipboardTextFilePath(await urls.text(), {
      verifyFile: process.platform !== 'win32' || verifyFileDrop,
    })
  }
  if (!filePath && process.platform === 'darwin') {
    const url = await read('electron application/osclipboard;format="public.file-url"')
    if (url) filePath = await getClipboardTextFilePath(await url.text())
  }
  if (!filePath && process.platform === 'win32') {
    const name = await read('electron application/osclipboard;format="FileNameW"')
    if (name) {
      const candidate = Buffer.from(await name.arrayBuffer())
        .toString('utf16le')
        .split('\0', 1)[0]
      filePath = await getClipboardTextFilePath(candidate, { verifyFile: verifyFileDrop })
    }
  }
  if (filePath) return { filePath, image: undefined }

  const blob = (await read('image/png')) ?? (await read('image/jpeg'))
  const image = blob?.size ? await readImage(blob) : undefined
  if (!image) {
    const text = await read('text/plain')
    if (text) filePath = await getClipboardTextFilePath(await text.text())
  }
  return { filePath, image }
}

export const readEncodedClipboard = () => readClipboard(blob => blob)

export async function readUploadClipboard({ verifyFileDrop = false } = {}) {
  const { filePath, image } = await readClipboard(async blob => {
    const decoded = nativeImage.createFromBuffer(Buffer.from(await blob.arrayBuffer()))
    return decoded.isEmpty() ? undefined : decoded
  }, verifyFileDrop)
  return { filePath, image: image ?? nativeImage.createEmpty() }
}
