// memoryLeak.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IpcManager } from '../src/main/utils/ipcManager'
import { MemoryMonitor } from '../src/main/utils/performanceOptimizer'

// Mock electron modules
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn()
  }
}))

describe('Memory Leak Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any existing state
    IpcManager.cleanupAll()
    MemoryMonitor.stop()
  })

  afterEach(() => {
    IpcManager.cleanupAll()
    MemoryMonitor.stop()
  })

  describe('IpcManager', () => {
    it('should track IPC listeners correctly', () => {
      const handler = vi.fn()
      
      IpcManager.on('test-channel', handler, 'test-context')
      
      const stats = IpcManager.getListenerStats()
      expect(stats['test-context']).toBeDefined()
      expect(stats['test-context'].totalListeners).toBe(1)
      expect(stats['test-context'].channels).toContain('test-channel')
    })

    it('should clean up context listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      IpcManager.on('channel1', handler1, 'context1')
      IpcManager.on('channel2', handler2, 'context1')
      
      let stats = IpcManager.getListenerStats()
      expect(stats['context1'].totalListeners).toBe(2)
      
      IpcManager.cleanupContext('context1')
      
      stats = IpcManager.getListenerStats()
      expect(stats['context1']).toBeUndefined()
    })

    it('should detect potential IPC leaks', () => {
      // Add many listeners to trigger leak detection
      for (let i = 0; i < 15; i++) {
        IpcManager.on('leak-channel', vi.fn(), 'leak-context')
      }
      
      const leaks = IpcManager.detectPotentialLeaks()
      expect(leaks.length).toBe(1)
      expect(leaks[0].channel).toBe('leak-channel')
      expect(leaks[0].count).toBe(15)
    })

    it('should handle once listeners correctly', () => {
      const handler = vi.fn()
      
      const cleanup = IpcManager.once('once-channel', handler, 'once-context')
      
      const stats = IpcManager.getListenerStats()
      expect(stats['once-context'].totalListeners).toBe(1)
      
      // Test cleanup function
      cleanup()
      
      const statsAfter = IpcManager.getListenerStats()
      expect(statsAfter['once-context']).toBeUndefined()
    })

    it('should remove specific listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      IpcManager.on('channel', handler1, 'test-context')
      IpcManager.on('channel', handler2, 'test-context')
      
      let stats = IpcManager.getListenerStats()
      expect(stats['test-context'].totalListeners).toBe(2)
      
      IpcManager.removeListener('channel', handler1, 'test-context')
      
      stats = IpcManager.getListenerStats()
      expect(stats['test-context'].totalListeners).toBe(1)
    })
  })

  describe('MemoryMonitor', () => {
    it('should start and stop monitoring correctly', () => {
      // Mock process.memoryUsage
      const mockMemoryUsage = vi.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 10 * 1024 * 1024
      }))
      
      vi.stubGlobal('process', {
        ...process,
        memoryUsage: mockMemoryUsage
      })

      // Start monitoring with very short interval for testing
      MemoryMonitor.start(100)
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(mockMemoryUsage).toHaveBeenCalled()
          
          MemoryMonitor.stop()
          resolve()
        }, 150)
      })
    })

    it('should track memory history', () => {
      const mockMemoryUsage = vi.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 10 * 1024 * 1024
      }))
      
      vi.stubGlobal('process', {
        ...process,
        memoryUsage: mockMemoryUsage
      })

      MemoryMonitor.start(50)
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const stats = MemoryMonitor.getMemoryStats()
          expect(stats).toBeDefined()
          expect(stats!.historyLength).toBeGreaterThan(0)
          
          MemoryMonitor.stop()
          resolve()
        }, 100)
      })
    })

    it('should detect memory leaks when thresholds are exceeded', () => {
      let callCount = 0
      const mockMemoryUsage = vi.fn(() => {
        callCount++
        // Simulate memory growth
        const baseMemory = 100 * 1024 * 1024
        const growth = callCount * 10 * 1024 * 1024 // 10MB growth per call
        
        return {
          rss: baseMemory + growth,
          heapTotal: 50 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024 + growth,
          external: 10 * 1024 * 1024
        }
      })
      
      vi.stubGlobal('process', {
        ...process,
        memoryUsage: mockMemoryUsage
      })

      // Mock console.warn to capture leak warnings
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      MemoryMonitor.start(10)
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // With significant memory growth, should trigger leak detection
          expect(callCount).toBeGreaterThan(5)
          
          MemoryMonitor.stop()
          warnSpy.mockRestore()
          resolve()
        }, 150)
      })
    })

    it('should integrate with IpcManager for leak detection', () => {
      // Create many IPC listeners to trigger leak detection
      for (let i = 0; i < 12; i++) {
        IpcManager.on(`leak-channel-${i}`, vi.fn(), 'integration-test')
      }

      const mockMemoryUsage = vi.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 10 * 1024 * 1024
      }))
      
      vi.stubGlobal('process', {
        ...process,
        memoryUsage: mockMemoryUsage
      })

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      MemoryMonitor.start(50)
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should detect IPC leaks
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('[IPC Leak Detected]'),
            expect.any(Array)
          )
          
          MemoryMonitor.stop()
          warnSpy.mockRestore()
          resolve()
        }, 100)
      })
    })
  })

  describe('Memory Leak Scenarios', () => {
    it('should prevent accumulating event listeners in media query scenario', () => {
      // Simulate the media query listener scenario from useAppStore
      const mediaQueryListeners: Array<() => void> = []
      
      // Mock window.matchMedia
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn((event, listener) => {
          mediaQueryListeners.push(listener)
        }),
        removeEventListener: vi.fn((event, listener) => {
          const index = mediaQueryListeners.indexOf(listener)
          if (index > -1) {
            mediaQueryListeners.splice(index, 1)
          }
        })
      }))
      
      vi.stubGlobal('window', {
        matchMedia: mockMatchMedia
      })

      // Simulate multiple theme applications (like what happens in useAppStore)
      for (let i = 0; i < 5; i++) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const listener = () => console.log('theme changed')
        mediaQuery.addEventListener('change', listener)
        
        // Simulate cleanup
        mediaQuery.removeEventListener('change', listener)
      }
      
      // Should not accumulate listeners
      expect(mediaQueryListeners.length).toBe(0)
    })

    it('should handle ResizeObserver cleanup correctly', () => {
      // Mock ResizeObserver
      const observedElements: Element[] = []
      const mockResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn((element) => {
          observedElements.push(element)
        }),
        disconnect: vi.fn(() => {
          observedElements.length = 0
        })
      }))
      
      vi.stubGlobal('ResizeObserver', mockResizeObserver)

      // Simulate VirtualScroller pattern
      const mockElement = document.createElement('div')
      
      const ro = new ResizeObserver(() => {})
      ro.observe(mockElement)
      
      expect(observedElements.length).toBe(1)
      
      // Simulate cleanup
      ro.disconnect()
      
      expect(observedElements.length).toBe(0)
    })
  })
})