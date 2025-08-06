import mitt from 'mitt'

import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type IEvent = {
  [SHOW_INPUT_BOX_RESPONSE]: string
  [SHOW_INPUT_BOX]: {
    value: string
    title: string
    placeholder: string
  }
}

const emitter = mitt<IEvent>()

export default emitter
