export class MemoryMonitor {
  // eslint-disable-next-line no-undef
  private static interval: NodeJS.Timeout | null = null

  static start(intervalMs: number = 30000) {
    if (this.interval) return

    this.interval = setInterval(() => {
      const memUsage = process.memoryUsage()
      const mbUsage = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      }
      console.log(
        `[Memory] RSS: ${mbUsage.rss}MB, Heap: ${mbUsage.heapUsed}/${mbUsage.heapTotal}MB, External: ${mbUsage.external}MB`
      )

      if (mbUsage.heapUsed / mbUsage.heapTotal > 0.8 && global.gc) {
        console.log('[Memory] Triggering garbage collection')
        global.gc()
      }
    }, intervalMs)
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
