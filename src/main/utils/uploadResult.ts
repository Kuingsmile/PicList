export const isUploadUrl = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export const getUploadedSourcePath = (
  inputs: readonly string[],
  output: { inputIndex?: unknown; filePath?: unknown; imgUrl?: unknown },
  outputIndex: number,
  outputCount: number,
): string | undefined => {
  if (!isUploadUrl(output.imgUrl)) return undefined

  let source: string | undefined
  if (output.inputIndex !== undefined) {
    const index = output.inputIndex
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= inputs.length) return undefined
    source = inputs[index]
  } else if (typeof output.filePath === 'string' && inputs.includes(output.filePath)) {
    source = output.filePath
  } else if (outputCount === inputs.length) {
    // Legacy plugins may omit source metadata; only complete batches can use position.
    source = inputs[outputIndex]
  }

  return source && !/^[a-z][a-z\d+.-]*:\/\//i.test(source) ? source : undefined
}
