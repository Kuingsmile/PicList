export function getUploadFiles(files: FileList): IFileWithPath[] {
  return Array.from(files, file => ({
    name: file.name,
    path: window.electron.showFilePath(file),
  }))
}
