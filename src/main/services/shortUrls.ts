import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'
import FormData from 'form-data'

import { IShortUrlServer } from '~/constants'
import { configPaths } from '~/utils/configPaths'

const c1nApi = 'https://c1n.cn/link/short'

const createC1NShortUrl = async (url: string) => {
  const c1nToken = picgo.getConfig<string>(configPaths.settings.c1nToken) || ''
  if (!c1nToken) {
    logger.warn('c1n token is not set')
    return url
  }
  try {
    const form = new FormData()
    form.append('url', url)
    const res = await axios.post(c1nApi, form, {
      headers: {
        token: c1nToken,
      },
    })
    if (res.status >= 200 && res.status < 300 && res.data?.code === 0) {
      return res.data.data
    }
  } catch (e: any) {
    logger.error(e)
  }
  return url
}

const createYOURLSShortLink = async (url: string) => {
  let domain = picgo.getConfig<string>(configPaths.settings.yourlsDomain) || ''
  const signature = picgo.getConfig<string>(configPaths.settings.yourlsSignature) || ''

  if (!domain || !signature) {
    logger.warn('Yourls server or signature is not set')
    return url
  }
  if (!/^https?:\/\//.test(domain)) {
    domain = `http://${domain}`
  }
  const params = new URLSearchParams({
    signature,
    action: 'shorturl',
    format: 'json',
    url,
  })
  try {
    const res = await axios.get(`${domain}/yourls-api.php?${params.toString()}`)
    if (res.data?.shorturl) {
      return res.data.shorturl
    }
  } catch (e: any) {
    if (e.response?.data?.message?.includes('already exists in database')) {
      return e.response.data.shorturl
    }
    logger.error(e)
  }

  return url
}

const createShortUrlForCFWorker = async (url: string) => {
  let cfWorkerHost = picgo.getConfig<string>(configPaths.settings.cfWorkerHost) || ''
  cfWorkerHost = cfWorkerHost.replace(/\/$/, '')
  if (!cfWorkerHost) {
    logger.warn('CF Worker host is not set')
    return url
  }

  try {
    const res = await axios.post(cfWorkerHost, { url })
    if (res.data?.status === 200 && res.data?.key?.startsWith('/')) {
      return `${cfWorkerHost}${res.data.key}`
    }
  } catch (e: any) {
    logger.error(e)
  }

  return url
}

const createShortUrlFromSink = async (url: string) => {
  let sinkDomain = picgo.getConfig<string>(configPaths.settings.sinkDomain) || ''
  const sinkToken = picgo.getConfig<string>(configPaths.settings.sinkToken) || ''
  if (!sinkDomain || !sinkToken) {
    logger.warn('Sink domain or token is not set')
    return url
  }
  if (!/^https?:\/\//.test(sinkDomain)) {
    sinkDomain = `http://${sinkDomain}`
  }
  if (sinkDomain.endsWith('/')) {
    sinkDomain = sinkDomain.slice(0, -1)
  }
  try {
    const res = await axios.post(
      `${sinkDomain}/api/link/create`,
      { url },
      { headers: { Authorization: `Bearer ${sinkToken}` } },
    )
    if (res.data?.link?.slug) {
      return `${sinkDomain}/${res.data.link.slug}`
    }
  } catch (e: any) {
    logger.error(e)
  }
  return url
}

export const generateShortUrl = async (url: string) => {
  const server = picgo.getConfig<string>(configPaths.settings.shortUrlServer) || IShortUrlServer.C1N
  switch (server) {
    case IShortUrlServer.C1N:
      return createC1NShortUrl(url)
    case IShortUrlServer.YOURLS:
      return createYOURLSShortLink(url)
    case IShortUrlServer.CFWORKER:
      return createShortUrlForCFWorker(url)
    case IShortUrlServer.SINK:
      return createShortUrlFromSink(url)
    default:
      return url
  }
}
