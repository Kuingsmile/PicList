class Router {
  private router = new Map<string, {handler: routeHandler, urlparams?: URLSearchParams}>()

  get (url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.router.set(url, { handler: callback, urlparams })
  }

  post (url: string, callback: routeHandler, urlparams?: URLSearchParams): void {
    this.router.set(url, { handler: callback, urlparams })
  }

  getHandler (url: string) {
    if (this.router.has(url)) {
      return this.router.get(url)
    } else {
      return null
    }
  }
}

export default new Router()
