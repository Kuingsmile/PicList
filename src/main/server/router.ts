type HttpMethod = 'GET' | 'POST'

interface Route {
  handler: routeHandler
  urlparams?: URLSearchParams
}

class Router {
  private readonly routesByPath = new Map<string, Map<HttpMethod, Route>>()

  private add(method: HttpMethod, url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    let routesByMethod = this.routesByPath.get(url)
    if (!routesByMethod) {
      routesByMethod = new Map()
      this.routesByPath.set(url, routesByMethod)
    }
    routesByMethod.set(method, { handler: callback, urlparams })
  }

  get(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.add('GET', url, callback, urlparams)
  }

  post(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.add('POST', url, callback, urlparams)
  }

  any(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.add('GET', url, callback, urlparams)
    this.add('POST', url, callback, urlparams)
  }

  getHandler(url: string, method: HttpMethod): Route | null {
    return this.routesByPath.get(url)?.get(method) ?? null
  }
}

export default new Router()
