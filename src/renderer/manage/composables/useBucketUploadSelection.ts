import { computed, ref } from 'vue'

import { IRPCActionType } from '#/constants/rpcActions'

interface SelectedFile {
  path: string
  name: string
  size: number
  relativePath?: string
}

interface SelectionRow {
  fullPath: string
  name: string
  isFolder: boolean
  fileSize: number
  filesList: SelectedFile[]
}

export function useBucketUploadSelection() {
  const isDragover = ref(false)
  const uploadPanelFilesList = ref<SelectedFile[]>([])
  const pendingDrops = ref(0)
  const isLoadingUploadPanelFiles = computed(() => pendingDrops.value > 0)
  let generation = 0

  const tableData = computed(() => {
    const rows = new Map<string, SelectionRow>()
    for (const file of uploadPanelFilesList.value) {
      const parts = (file.relativePath || file.name).split('/')
      let fullPath = file.path
      for (let i = 1; i < parts.length; i++) fullPath = window.node.path.dirname(fullPath)
      const row: SelectionRow = rows.get(fullPath) ?? {
        fullPath,
        name: parts[0],
        isFolder: parts.length > 1,
        fileSize: 0,
        filesList: [],
      }
      row.filesList.push(file)
      row.fileSize += file.size
      rows.set(fullPath, row)
    }
    return [...rows.values()]
  })

  function addFiles(files: SelectedFile[]) {
    const seen = new Set(uploadPanelFilesList.value.map(file => file.path))
    for (const file of files) {
      if (!file.path || seen.has(file.path)) continue
      seen.add(file.path)
      uploadPanelFilesList.value.push(file)
    }
  }

  async function openFileSelectDialog() {
    const current = generation
    const paths = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
    if (!paths || current !== generation) return
    addFiles(
      paths.map(path => ({
        path,
        name: window.node.path.basename(path),
        size: window.node.fs.statSync(path).size,
      })),
    )
  }

  async function readEntry(entry: FileSystemEntry, droppedFile?: File | null): Promise<SelectedFile[]> {
    try {
      if (entry.isFile) {
        const file =
          droppedFile ??
          (await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject)))
        return [
          {
            path: window.electron.showFilePath(file),
            name: file.name,
            size: file.size,
            relativePath: entry.fullPath.slice(1),
          },
        ]
      }
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      const files: SelectedFile[] = []
      while (true) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
        if (!batch.length) return files
        for (const children of await Promise.all(batch.map(child => readEntry(child)))) {
          for (const file of children) files.push(file)
        }
      }
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async function onDrop(event: DragEvent) {
    isDragover.value = false
    if (!event.dataTransfer) return
    const current = generation
    pendingDrops.value++
    try {
      const groups = await Promise.all(
        Array.from(event.dataTransfer.items, item => {
          const entry = item.webkitGetAsEntry()
          return entry ? readEntry(entry, item.getAsFile()) : []
        }),
      )
      if (current === generation) addFiles(groups.flat())
    } finally {
      if (current === generation) pendingDrops.value--
    }
  }

  function clearTableData() {
    generation++
    pendingDrops.value = 0
    uploadPanelFilesList.value = []
  }

  return {
    isDragover,
    tableData,
    uploadPanelFilesList,
    isLoadingUploadPanelFiles,
    openFileSelectDialog,
    onDrop,
    clearTableData,
  }
}
