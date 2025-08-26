import { IpcManager } from './ipcManager'

export class MemoryMonitor {
  // eslint-disable-next-line no-undef
  private static interval: NodeJS.Timeout | null = null
  private static previousMemory: NodeJS.MemoryUsage | null = null
  private static memoryHistory: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }> = []
  private static readonly HISTORY_LIMIT = 60 // Keep last 60 measurements for leak detection

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

      // Track memory history for leak detection
      this.memoryHistory.push({ timestamp: Date.now(), memory: memUsage })
      if (this.memoryHistory.length > this.HISTORY_LIMIT) {
        this.memoryHistory.shift()
      }

      // Detect memory leaks
      const leakInfo = this.detectMemoryLeak()
      if (leakInfo.hasLeak) {
        console.warn(`[Memory Leak Detected] ${leakInfo.message}`)
      }

      // Check for IPC listener leaks
      const ipcLeaks = IpcManager.detectPotentialLeaks()
      if (ipcLeaks.length > 0) {
        console.warn(`[IPC Leak Detected] ${ipcLeaks.length} potential IPC listener leaks:`, ipcLeaks)
      }

      console.log(
        `[Memory] RSS: ${mbUsage.rss}MB, Heap: ${mbUsage.heapUsed}/${mbUsage.heapTotal}MB, External: ${mbUsage.external}MB${leakInfo.hasLeak ? ' ⚠️' : ''}${ipcLeaks.length > 0 ? ' 📡' : ''}`
      )

      // Trigger garbage collection if memory usage is high
      if (mbUsage.heapUsed / mbUsage.heapTotal > 0.8 && global.gc) {
        console.log('[Memory] Triggering garbage collection')
        global.gc()
      }

      this.previousMemory = memUsage
    }, intervalMs)
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.previousMemory = null
    this.memoryHistory = []
    
    // Clean up all IPC listeners when stopping monitoring
    IpcManager.cleanupAll()
  }

  private static detectMemoryLeak(): { hasLeak: boolean; message: string } {
    if (this.memoryHistory.length < 10) {
      return { hasLeak: false, message: '' }
    }

    const recent = this.memoryHistory.slice(-10)
    const oldest = this.memoryHistory[0]

    // Check for steady memory growth over time
    const rssGrowth = recent[recent.length - 1].memory.rss - oldest.memory.rss
    const heapGrowth = recent[recent.length - 1].memory.heapUsed - oldest.memory.heapUsed
    const externalGrowth = recent[recent.length - 1].memory.external - oldest.memory.external

    const rssGrowthMB = Math.round(rssGrowth / 1024 / 1024)
    const heapGrowthMB = Math.round(heapGrowth / 1024 / 1024)
    const externalGrowthMB = Math.round(externalGrowth / 1024 / 1024)

    // Thresholds for leak detection
    const LEAK_THRESHOLD_MB = 50 // 50MB growth over monitoring period
    
    if (rssGrowthMB > LEAK_THRESHOLD_MB) {
      return { 
        hasLeak: true, 
        message: `RSS memory grew by ${rssGrowthMB}MB over monitoring period` 
      }
    }
    
    if (heapGrowthMB > LEAK_THRESHOLD_MB) {
      return { 
        hasLeak: true, 
        message: `Heap memory grew by ${heapGrowthMB}MB over monitoring period` 
      }
    }

    if (externalGrowthMB > LEAK_THRESHOLD_MB) {
      return { 
        hasLeak: true, 
        message: `External memory grew by ${externalGrowthMB}MB over monitoring period` 
      }
    }

    return { hasLeak: false, message: '' }
  }

  static getMemoryStats() {
    if (this.memoryHistory.length === 0) return null
    
    const current = this.memoryHistory[this.memoryHistory.length - 1]
    const oldest = this.memoryHistory[0]
    
    return {
      current: current.memory,
      growth: {
        rss: Math.round((current.memory.rss - oldest.memory.rss) / 1024 / 1024),
        heapUsed: Math.round((current.memory.heapUsed - oldest.memory.heapUsed) / 1024 / 1024),
        external: Math.round((current.memory.external - oldest.memory.external) / 1024 / 1024)
      },
      historyLength: this.memoryHistory.length,
      ipcStats: IpcManager.getListenerStats()
    }
  }
}
