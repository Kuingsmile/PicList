export function hasUploaderConfigNameConflict(configList: IUploaderConfigListItem[], name: string, editingId?: string) {
  if (typeof name !== 'string') return false
  const trimmedName = name.trim()
  return configList.some(
    item => item._id !== editingId && typeof item._configName === 'string' && item._configName.trim() === trimmedName,
  )
}
