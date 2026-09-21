import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { describe, expect, it } from 'vitest'

import { closeServer, listenOnce } from '../src/main/utils/serverLifecycle'

describe('server listening with real TCP sockets', () => {
  it('cleans up occupied-port failures and can reuse the server after the port is released', async () => {
    const owner = createServer()
    const contender = createServer()
    const originalListeners = contender.listeners('listening')
    try {
      await listenOnce(owner, 0, '127.0.0.1')
      const port = (owner.address() as AddressInfo).port
      for (let attempt = 0; attempt < 3; attempt++) {
        await expect(listenOnce(contender, port, '127.0.0.1')).rejects.toMatchObject({ code: 'EADDRINUSE' })
        await closeServer(contender)
        expect(contender.listenerCount('error')).toBe(0)
        expect(contender.listeners('listening')).toEqual(originalListeners)
        expect(contender.listening).toBe(false)
      }
      await closeServer(owner)
      await listenOnce(contender, port, '127.0.0.1')
      expect(contender.listening).toBe(true)
      expect(contender.listenerCount('error')).toBe(0)
      expect(contender.listeners('listening')).toEqual(originalListeners)
    } finally {
      await Promise.all([closeServer(owner), closeServer(contender)])
    }
  })

  it('cleans up listeners after a synchronous listen failure', async () => {
    const server = createServer()
    const originalListeners = server.listeners('listening')
    await expect(listenOnce(server, -1, '127.0.0.1')).rejects.toThrow()
    expect(server.listenerCount('error')).toBe(0)
    expect(server.listeners('listening')).toEqual(originalListeners)
    await closeServer(server)
  })
})
