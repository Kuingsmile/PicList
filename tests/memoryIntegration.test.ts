// memoryIntegration.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock electron to avoid issues in test environment
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn()
  }
}))

describe('Memory Monitoring Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should simulate real-world memory usage patterns', async () => {
    // Import after mocking
    const { MemoryMonitor } = await import('../src/main/utils/performanceOptimizer')
    
    let memoryGrowth = 0
    const mockMemoryUsage = vi.fn(() => {
      memoryGrowth += 1024 * 1024 // 1MB growth per call
      return {
        rss: 100 * 1024 * 1024 + memoryGrowth,
        heapTotal: 80 * 1024 * 1024,
        heapUsed: 50 * 1024 * 1024 + (memoryGrowth / 2),
        external: 20 * 1024 * 1024
      }
    })
    
    // Mock process.memoryUsage
    vi.stubGlobal('process', {
      ...process,
      memoryUsage: mockMemoryUsage
    })

    // Mock console methods to capture output
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Start monitoring with short interval for testing
    MemoryMonitor.start(50)

    // Wait for several monitoring cycles
    await new Promise(resolve => setTimeout(resolve, 250))

    // Verify monitoring occurred
    expect(mockMemoryUsage).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Memory] RSS:')
    )

    // Clean up
    MemoryMonitor.stop()
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('should handle memory statistics correctly', async () => {
    const { MemoryMonitor } = await import('../src/main/utils/performanceOptimizer')
    
    const mockMemoryUsage = vi.fn(() => ({
      rss: 100 * 1024 * 1024,
      heapTotal: 80 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 20 * 1024 * 1024
    }))
    
    vi.stubGlobal('process', {
      ...process,
      memoryUsage: mockMemoryUsage
    })

    MemoryMonitor.start(20)
    
    // Wait for some data collection
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const stats = MemoryMonitor.getMemoryStats()
    expect(stats).toBeDefined()
    expect(stats!.current).toBeDefined()
    expect(stats!.historyLength).toBeGreaterThan(0)
    expect(stats!.ipcStats).toBeDefined()

    MemoryMonitor.stop()
  })
})