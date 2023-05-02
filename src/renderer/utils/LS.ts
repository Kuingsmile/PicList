class LS {
  get (name: string) {
    const item = localStorage.getItem(name) as string
    return item ? JSON.parse(item) : {}
  }

  set (name: string, value: any) {
    return localStorage.setItem(name, JSON.stringify(value))
  }
}

export default new LS()
