import { App, InjectionKey, reactive, readonly, UnwrapRef } from 'vue'

import { saveConfig } from '@/utils/dataSender'
import { configPaths } from '#/utils/configPaths'

export interface IState {
  defaultPicBed: string
}

export interface IStore {
  state: UnwrapRef<IState>
  setDefaultPicBed: (type: string) => void
}

export const storeKey: InjectionKey<IStore> = Symbol('store')

// state
const state: IState = reactive({
  defaultPicBed: 'smms'
})

// methods
const setDefaultPicBed = (type: string) => {
  saveConfig({
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type
  })
  state.defaultPicBed = type
}

export const store = {
  install (app: App) {
    app.provide(storeKey, {
      state: readonly(state),
      setDefaultPicBed
    })
  }
}
