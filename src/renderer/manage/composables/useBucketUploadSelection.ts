import { reactive, ref } from 'vue'

import { IRPCActionType } from '#/constants/rpcActions'
export function useBucketUploadSelection() {
  const isDragover = ref(false)

  const tableData = reactive([] as any[])

  const uploadPanelFilesList = ref([] as any[])

  const isLoadingUploadPanelFiles = ref(false)

  function openFileSelectDialog() {
    window.electron.triggerRPC(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG).then((res: any) => {
      if (res) {
        res.forEach((item: any) => {
          tableData.push({
            fileSize: window.node.fs.statSync(item).size,
            isFolder: false,
            name: window.node.path.basename(item),
            filesList: [],
            fullPath: item,
          })
          const index = uploadPanelFilesList.value.findIndex((file: any) => file.path === item)
          if (index === -1) {
            uploadPanelFilesList.value.push({
              name: window.node.path.basename(item),
              path: item,
              size: window.node.fs.statSync(item).size,
            })
          }
        })
      }
    })
  }

  function onDrop(e: DragEvent) {
    isDragover.value = false
    const items = e.dataTransfer?.items
    if (items) {
      webkitReadDataTransfer(e.dataTransfer as DataTransfer)
    }
  }

  function webkitReadDataTransfer(dataTransfer: DataTransfer) {
    isLoadingUploadPanelFiles.value = true
    let fileNum = dataTransfer.items.length
    const decrement = () => {
      fileNum--
      if (fileNum === 0) {
        files.forEach((item: any) => {
          const index = uploadPanelFilesList.value.findIndex((file: any) => file.path === item.path)
          if (index === -1) {
            uploadPanelFilesList.value.push({
              name: item.name,
              path: window.electron.showFilePath(item),
              size: item.size,
              relativePath: item.relativePath,
            })
          }
        })
        handleUploadFiles(files)
        isLoadingUploadPanelFiles.value = false
      }
    }
    const files = [] as any[]
    const items = dataTransfer.items
    for (const item of items) {
      const entry = item.webkitGetAsEntry() as any
      if (!entry) {
        decrement()
        continue
      }
      if (entry.isFile) {
        readFiles(item.getAsFile(), entry.fullPath)
      } else if (entry.isDirectory) {
        readDirectory(entry.createReader())
      }
    }

    function readDirectory(reader: any) {
      reader.readEntries(
        (entries: any) => {
          if (entries.length) {
            fileNum += entries.length
            entries.forEach((entry: any) => {
              if (entry.isFile) {
                entry.file(
                  (file: any) => {
                    readFiles(file, entry.fullPath)
                  },
                  (err: any) => {
                    console.error(err)
                    decrement()
                  },
                )
              } else if (entry.isDirectory) {
                readDirectory(entry.createReader())
              }
            })
            readDirectory(reader)
          } else {
            decrement()
          }
        },
        (err: any) => {
          console.error(err)
          decrement()
        },
      )
    }

    function readFiles(file: any, fullPath: string) {
      file.relativePath = fullPath.substring(1)
      files.push(file)
      decrement()
    }
  }

  function handleUploadFiles(files: any[]) {
    const dirObj = {} as any
    files.forEach(item => {
      if (item.relativePath === item.name) {
        const index = tableData.findIndex((file: any) => file.fullPath === item.path)
        if (index === -1) {
          tableData.push({
            name: item.name,
            filesList: [item.file],
            isFolder: false,
            fileSize: item.size,
            fullPath: window.electron.showFilePath(item),
          })
        }
      } else {
        const folderName = item.relativePath.split('/')[0]
        if (dirObj[folderName]) {
          const dirList = dirObj[folderName].filesList || []
          dirList.push(item)
          dirObj[folderName].filesList = dirList
          const dirSize = dirObj[folderName].fileSize
          dirObj[folderName].fileSize = dirSize ? dirSize + item.size : item.size
        } else {
          dirObj[folderName] = {
            filesList: [item],
            fileSize: item.size,
            path: window.electron.showFilePath(item),
          }
        }
      }
    })
    Object.keys(dirObj).forEach(key => {
      const index = tableData.findIndex((item: any) => item.fullPath === dirObj[key].path)
      if (index === -1) {
        tableData.push({
          name: key,
          filesList: dirObj[key].filesList,
          isFolder: true,
          fileSize: dirObj[key].fileSize,
          fullPath: dirObj[key].path,
        })
      }
    })
  }

  function clearTableData() {
    tableData.length = 0
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
