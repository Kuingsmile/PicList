import { IRPCActionType } from '#/types/enum'

const isSpecialKey = (key: string) => {
  const keyArr = ['Shift', 'Control', 'Alt', 'Meta']

  return keyArr.includes(key)
}

const keyBinding = (event: KeyboardEvent) => {
  const meta = window.electron.sendRpcSync(IRPCActionType.GET_PLATFORM) === 'darwin' ? 'Cmd' : 'Super'
  const specialKey = {
    Ctrl: event.ctrlKey,
    Shift: event.shiftKey,
    Alt: event.altKey,
    [meta]: event.metaKey
  }

  const pressKey = []

  for (const i in specialKey) {
    if (specialKey[i]) {
      pressKey.push(i)
    }
  }

  if (!isSpecialKey(event.key)) {
    pressKey.push(event.key.toUpperCase())
  }
  return pressKey
}

export default keyBinding
