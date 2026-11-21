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

export async function readUploadClipboard() {
  const items = await clipboard.read()
  const read = (type: UploadFormat) => items.find(item => item.types.includes(type))?.getType(type)
  const blob = (await read('image/png')) ?? (await read('image/jpeg'))
  const image = blob ? nativeImage.createFromBuffer(Buffer.from(await blob.arrayBuffer())) : nativeImage.createEmpty()

  let filePath = ''
  if (process.platform === 'darwin') {
    const url =
      (await read('electron application/osclipboard;format="public.file-url"')) ?? (await read('text/uri-list'))
    if (url) filePath = getClipboardTextFilePath(await url.text())
  }
  if (image.isEmpty() && process.platform === 'win32') {
    const name = await read('electron application/osclipboard;format="FileNameW"')
    if (name)
      filePath = Buffer.from(await name.arrayBuffer())
        .toString('utf16le')
        .split('\0', 1)[0]
  }
  if (!filePath && image.isEmpty()) {
    const text = await read('text/plain')
    if (text) filePath = getClipboardTextFilePath(await text.text())
  }
  return { filePath, image }
}
