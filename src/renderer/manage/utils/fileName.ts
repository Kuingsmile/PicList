export function splitFileName(fileName: string): { baseName: string; extension: string } {
  const dotIndex = fileName.lastIndexOf('.')
  // A leading dot belongs to the basename; a later dot starts the extension.
  if (dotIndex <= 0 || fileName === '..') {
    return { baseName: fileName, extension: '' }
  }
  return { baseName: fileName.slice(0, dotIndex), extension: fileName.slice(dotIndex) }
}
