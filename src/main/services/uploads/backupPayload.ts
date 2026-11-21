// picgo-plugin-autobackup keeps these on the live output until its backup finishes.
export const hasBackupPayload = (value: object) =>
  Object.hasOwn(value, 'bufferCopy') || Object.hasOwn(value, 'base64ImageCopy')

export function withoutBackupPayload<T extends Record<string, any>>(value: T): T {
  if (!hasBackupPayload(value)) return value
  const metadata = { ...value }
  delete metadata.bufferCopy
  delete metadata.base64ImageCopy
  return metadata
}
