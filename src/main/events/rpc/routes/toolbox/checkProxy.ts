// External dependencies
import fs from 'fs-extra'
import axios, { AxiosRequestConfig } from 'axios'
import tunnel from 'tunnel'

// Electron modules

// Custom utilities and modules
import { dbPathChecker } from '~/main/apis/core/datastore/dbChecker'
import { sendToolboxResWithType } from './utils'

// Custom types/enums
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/universal/types/enum'

// External utility functions

// Custom types/enums
import { IConfig } from 'piclist'
import { T } from '~/main/i18n'

const getProxy = (proxyStr: string): AxiosRequestConfig['proxy'] | false => {
  if (proxyStr) {
    try {
      const proxyOptions = new URL(proxyStr)
      return {
        host: proxyOptions.hostname,
        port: parseInt(proxyOptions.port || '0', 10),
        protocol: proxyOptions.protocol
      }
    } catch (e) {
    }
  }
  return false
}

const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_PROXY)

export const checkProxyMap: IToolboxCheckerMap<
IToolboxItemType.HAS_PROBLEM_WITH_PROXY
> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: async (event) => {
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING
    })
    const configFilePath = dbPathChecker()
    if (fs.existsSync(configFilePath)) {
      let config: IConfig | undefined
      try {
        config = await fs.readJSON(configFilePath) as IConfig
      } catch (e) {
      }
      if (!config) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T('TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS')
        })
      }

      const proxy = config.picBed?.proxy
      if (!proxy) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T('TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS')
        })
      } else {
        const proxyOptions = getProxy(proxy)
        if (!proxyOptions) {
          return sendToolboxRes(event, {
            status: IToolboxItemCheckStatus.ERROR,
            msg: T('TOOLBOX_CHECK_PROXY_PROXY_IS_NOT_CORRECT')
          })
        } else {
          const httpsAgent = tunnel.httpsOverHttp({
            proxy: {
              host: proxyOptions.host,
              port: proxyOptions.port
            }
          })
          try {
            await axios.get('https://www.google.com', {
              httpsAgent
            })
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.SUCCESS,
              msg: T('TOOLBOX_CHECK_PROXY_SUCCESS_TIPS')
            })
          } catch (e) {
            console.log(e)
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.ERROR,
              msg: T('TOOLBOX_CHECK_PROXY_PROXY_IS_NOT_WORKING')
            })
          }
        }
      }
    }

    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.SUCCESS,
      msg: T('TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS')
    })
  }
}
