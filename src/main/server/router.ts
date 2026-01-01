type HttpMethod = 'GET' | 'POST'

class Router {
  #router = new Map<string, Map<HttpMethod, { handler: routeHandler; urlparams?: URLSearchParams }>>()

  #addRoute(method: HttpMethod, url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    if (!this.#router.has(url)) {
      this.#router.set(url, new Map())
    }
    this.#router.get(url)!.set(method, { handler: callback, urlparams })
  }

  get(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.#addRoute('GET', url, callback, urlparams)
  }

  post(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.#addRoute('POST', url, callback, urlparams)
  }

  any(url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.#addRoute('GET', url, callback, urlparams)
    this.#addRoute('POST', url, callback, urlparams)
  }

  getHandler(url: string, method: HttpMethod) {
    if (this.#router.has(url)) {
      const methods = this.#router.get(url)!
      if (methods.has(method)) {
        return methods.get(method)
      }
    }
    return null
  }
}

export default new Router()
