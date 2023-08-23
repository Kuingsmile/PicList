// External dependencies
import { app, clipboard, shell } from 'electron'

// Electron modules

// Custom utilities and modules
import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'

const systemRouter = new RPCRouter()

systemRouter
  .add(IRPCActionType.RELOAD_APP, async () => {
    app.relaunch()
    app.exit(0)
  })
  .add(IRPCActionType.OPEN_FILE, async (args) => {
    const [filePath] = args as IOpenFileArgs
    shell.openPath(filePath)
  })
  .add(IRPCActionType.COPY_TEXT, async (args) => {
    const [text] = args as ICopyTextArgs
    return clipboard.writeText(text)
  })

export {
  systemRouter
}
