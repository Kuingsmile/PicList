export function formatStorageLink(
  format: string | undefined,
  url: string,
  fileName: string,
  filePath: string = fileName,
  encodePath = false,
): string {
  if (!format || !/\$(url|fileName|filePath|dir)\b/.test(format)) return url
  const directory = filePath.slice(0, filePath.lastIndexOf('/') + 1)
  const encode = (value: string) => (encodePath ? value.split('/').map(encodeURIComponent).join('/') : value)
  const values: Record<string, string> = {
    url,
    fileName,
    filePath: encode(filePath),
    dir: encode(directory),
  }
  return format.replace(/\$(url|fileName|filePath|dir)\b/g, (_, key: string) => values[key])
}
