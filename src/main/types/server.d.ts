// Server
type IHttpResponse = import('node:http').ServerResponse

interface IServerCTX {
  response: IHttpResponse
  [propName: string]: any
}

type routeHandler = (ctx: IServerCTX) => Promise<void>
