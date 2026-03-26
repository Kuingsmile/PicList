import { appConfigPath } from '@core/datastore/dirs'
import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs-extra'
import { IConfig } from 'piclist'
import tunnel from 'tunnel'

import { sendToolboxResWithType } from '~/events/rpc/routes/toolbox/utils'
import { t } from '~/i18n'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/utils/enum'

function getProxy(proxyStr: string): AxiosRequestConfig['proxy'] | null {
  if (proxyStr) {
    try {
      const proxyOptions = new URL(proxyStr)
      return {
        host: proxyOptions.hostname,
        port: parseInt(proxyOptions.port || '0', 10),
        protocol: proxyOptions.protocol,
      }
    } catch (_e) {}
  }
  return null
}

const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_PROXY)

export const checkProxyMap: IToolboxCheckerMap<string> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: async event => {
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING,
    })
    const configFilePath = appConfigPath()
    if (fs.existsSync(configFilePath)) {
      let config: IConfig | undefined
      try {
        config = (await fs.readJSON(configFilePath)) as IConfig
      } catch (_e) {}
      if (!config) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: t('main.toolbox.noProxy'),
        })
      }

      const proxy = config.picBed?.proxy
      if (!proxy) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: t('main.toolbox.noProxy'),
        })
      } else {
        const proxyOptions = getProxy(proxy)
        if (!proxyOptions) {
          return sendToolboxRes(event, {
            status: IToolboxItemCheckStatus.ERROR,
            msg: t('main.toolbox.incorrectProxyTips'),
          })
        } else {
          const httpsAgent = tunnel.httpsOverHttp({
            proxy: {
              host: proxyOptions.host,
              port: proxyOptions.port,
            },
          })
          try {
            await axios.get('https://www.google.com', {
              httpsAgent,
            })
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.SUCCESS,
              msg: t('main.toolbox.checkProxySuccessTips'),
            })
          } catch (_e) {
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.ERROR,
              msg: t('main.toolbox.checkProxyFailedTips'),
            })
          }
        }
      }
    }

    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.SUCCESS,
      msg: t('main.toolbox.noProxy'),
    })
  },
}
