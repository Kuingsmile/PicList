import { shortcutFromKeyboardEvent } from '#/shortcuts'

const keyBinding = (event: KeyboardEvent) => shortcutFromKeyboardEvent(event, window.electron.platform)

export default keyBinding
