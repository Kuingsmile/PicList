import { ILocales, ILocalesKey } from 'root/src/universal/types/i18n'

import { updatePageReloadCount } from '@/utils/global'
import { SET_CURRENT_LANGUAGE } from '#/events/constants'
import { builtinI18nList } from '#/i18n'
import { IRPCActionType } from '#/types/enum'
import { II18nItem, IStringKeyMap } from '#/types/types'

export class I18nManager {
  #i18nFileList: II18nItem[] = builtinI18nList

  constructor () {
    this.#getCurrentLanguage()
    this.#getLanguageList()
    window.electron.ipcRendererOn(SET_CURRENT_LANGUAGE, (_, lang: string, locales: ILocales) => {
      this.#setLocales(lang, locales)
      updatePageReloadCount()
    })
  }

  #getLanguageList () {
    this.#i18nFileList = window.electron.sendRpcSync(IRPCActionType.GET_LANGUAGE_LIST)
  }

  #getCurrentLanguage () {
    const [lang, locales] = window.electron.sendRpcSync(IRPCActionType.GET_CURRENT_LANGUAGE)
    this.#setLocales(lang, locales)
  }

  #setLocales (lang: string, locales: ILocales) {
    window.i18n.setLocales(lang, locales)
  }

  T (key: ILocalesKey, args: IStringKeyMap = {}): string {
    return window.i18n?.translate(key, args) || key
  }

  setCurrentLanguage (lang: string) {
    window.electron.sendRPC(IRPCActionType.SET_CURRENT_LANGUAGE, lang)
  }

  get languageList () {
    return this.#i18nFileList
  }
}

const i18nManager = new I18nManager()

const T = (key: ILocalesKey, args: IStringKeyMap = {}): string => {
  return i18nManager.T(key, args)
}

export { i18nManager, T }
