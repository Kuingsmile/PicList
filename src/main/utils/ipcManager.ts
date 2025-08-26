import { ipcMain, IpcMainEvent } from 'electron'

/**
 * IPC Manager utility to prevent memory leaks from accumulating IPC listeners
 */
export class IpcManager {
  private static listeners = new Map<string, Set<{ event: string; handler: Function }>>()

  /**
   * Register an IPC listener with automatic cleanup tracking
   */
  static on(channel: string, handler: (event: IpcMainEvent, ...args: any[]) => void, context?: string): () => void {
    const contextKey = context || 'global'
    
    if (!this.listeners.has(contextKey)) {
      this.listeners.set(contextKey, new Set())
    }
    
    const listenerEntry = { event: channel, handler }
    this.listeners.get(contextKey)!.add(listenerEntry)
    
    ipcMain.on(channel, handler)
    
    // Return cleanup function
    return () => {
      ipcMain.removeListener(channel, handler)
      this.listeners.get(contextKey)?.delete(listenerEntry)
    }
  }

  /**
   * Register a one-time IPC listener with automatic cleanup tracking
   */
  static once(channel: string, handler: (event: IpcMainEvent, ...args: any[]) => void, context?: string): () => void {
    const contextKey = context || 'global'
    
    if (!this.listeners.has(contextKey)) {
      this.listeners.set(contextKey, new Set())
    }
    
    const wrappedHandler = (...args: Parameters<typeof handler>) => {
      const listenerEntry = { event: channel, handler: wrappedHandler }
      this.listeners.get(contextKey)?.delete(listenerEntry)
      handler(...args)
    }
    
    const listenerEntry = { event: channel, handler: wrappedHandler }
    this.listeners.get(contextKey)!.add(listenerEntry)
    
    ipcMain.once(channel, wrappedHandler)
    
    // Return cleanup function
    return () => {
      ipcMain.removeListener(channel, wrappedHandler)
      this.listeners.get(contextKey)?.delete(listenerEntry)
    }
  }

  /**
   * Remove specific listener
   */
  static removeListener(channel: string, handler: Function, context?: string) {
    const contextKey = context || 'global'
    ipcMain.removeListener(channel, handler as any)
    
    const contextListeners = this.listeners.get(contextKey)
    if (contextListeners) {
      for (const listener of contextListeners) {
        if (listener.event === channel && listener.handler === handler) {
          contextListeners.delete(listener)
          break
        }
      }
    }
  }

  /**
   * Clean up all listeners for a specific context
   */
  static cleanupContext(context: string) {
    const contextListeners = this.listeners.get(context)
    if (!contextListeners) return

    for (const listener of contextListeners) {
      ipcMain.removeListener(listener.event, listener.handler as any)
    }
    
    this.listeners.delete(context)
  }

  /**
   * Remove all listeners for a specific channel
   */
  static removeAllListeners(channel: string) {
    ipcMain.removeAllListeners(channel)
    
    // Clean up from tracking
    for (const [context, listeners] of this.listeners.entries()) {
      const toRemove = Array.from(listeners).filter(l => l.event === channel)
      toRemove.forEach(l => listeners.delete(l))
    }
  }

  /**
   * Get current listener statistics for debugging
   */
  static getListenerStats() {
    const stats: Record<string, { contexts: number; totalListeners: number; channels: string[] }> = {}
    
    for (const [context, listeners] of this.listeners.entries()) {
      const channels = Array.from(new Set(Array.from(listeners).map(l => l.event)))
      
      if (!stats.global) stats.global = { contexts: 0, totalListeners: 0, channels: [] }
      
      stats[context] = {
        contexts: 1,
        totalListeners: listeners.size,
        channels
      }
    }
    
    return stats
  }

  /**
   * Clean up all tracked listeners (should be called on app quit)
   */
  static cleanupAll() {
    for (const context of this.listeners.keys()) {
      this.cleanupContext(context)
    }
  }

  /**
   * Get potentially leaked listeners (ones that have been around too long)
   */
  static detectPotentialLeaks(): { context: string; channel: string; count: number }[] {
    const channelCounts = new Map<string, Map<string, number>>()
    
    for (const [context, listeners] of this.listeners.entries()) {
      if (!channelCounts.has(context)) {
        channelCounts.set(context, new Map())
      }
      
      const contextChannels = channelCounts.get(context)!
      
      for (const listener of listeners) {
        const count = contextChannels.get(listener.event) || 0
        contextChannels.set(listener.event, count + 1)
      }
    }
    
    const potentialLeaks: { context: string; channel: string; count: number }[] = []
    
    for (const [context, channels] of channelCounts.entries()) {
      for (const [channel, count] of channels.entries()) {
        // Flag channels with more than 10 listeners as potential leaks
        if (count > 10) {
          potentialLeaks.push({ context, channel, count })
        }
      }
    }
    
    return potentialLeaks
  }
}