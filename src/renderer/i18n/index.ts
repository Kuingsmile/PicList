import { IRPCActionType } from '#/types/enum'

export function setCurrentLanguage (lang: string) {
  window.electron.sendRPC(IRPCActionType.SET_CURRENT_LANGUAGE, lang)
}
