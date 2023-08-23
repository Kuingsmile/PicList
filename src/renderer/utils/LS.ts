class LS {
  get (name: string) {
    const item = localStorage.getItem(name)
    if (item) {
      try {
        return JSON.parse(item)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
      }
    }
    return {}
  }

  set (name: string, value: any): void {
    localStorage.setItem(name, JSON.stringify(value))
  }
}

export default new LS()
