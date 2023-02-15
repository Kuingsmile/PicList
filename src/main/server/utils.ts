import logger from '@core/picgo/logger'

export const handleResponse = ({
  response,
  statusCode = 200,
  header = {
    'Content-Type': 'application/json',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-origin': '*'
  },
  body = {
    success: false
  }
} : {
  response: IHttpResponse,
  statusCode?: number,
  header?: IObj,
  body?: any
}) => {
  if (body?.success === false) {
    logger.warn('[PicList Server] upload failed, see piclist.log for more detail ↑')
  }
  response.writeHead(statusCode, header)
  response.write(JSON.stringify(body))
  response.end()
}

export const ensureHTTPLink = (url: string): string => {
  return url.startsWith('http')
    ? url
    : `http://${url}`
}
