export const deleteLog = (fileName?: string, type?: string, isSuccess = true, msg?: string) => {
  console.log(`Delete ${fileName} on ${type} ${isSuccess ? 'success' : 'failed'}, message: ${msg || ''}`)
}

export const deleteFailedLog = (fileName: string, type: string, error: any) => {
  deleteLog(fileName, type, false)
  console.error(error)
}
