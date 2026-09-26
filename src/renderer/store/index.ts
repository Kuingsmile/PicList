import { App, InjectionKey, reactive, readonly, UnwrapRef } from 'vue'

import { configPaths } from '@/utils/configPaths'
import { saveConfig } from '@/utils/dataSender'

export interface IState {
  defaultPicBed: string
}

export interface IStore {
  state: UnwrapRef<IState>
  setDefaultPicBed: (type: string) => Promise<void>
}

export const storeKey: InjectionKey<IStore> = Symbol('store')

// state
const state: IState = reactive({
  defaultPicBed: 'smms',
})

// methods
const setDefaultPicBed = async (type: string) => {
  if (
    !(await saveConfig({
      [configPaths.picBed.current]: type,
      [configPaths.picBed.uploader]: type,
    }))
  )
    return
  state.defaultPicBed = type
}

export const store = {
  install(app: App) {
    app.provide(storeKey, {
      state: readonly(state),
      setDefaultPicBed,
    })
  },
}
