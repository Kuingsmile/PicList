import type { Server } from 'node:http'

export function listenOnce(server: Server, port: number, host?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError)
      server.off('listening', onListening)
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const onListening = () => {
      cleanup()
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    try {
      server.listen(port, host)
    } catch (error) {
      onError(error as Error)
    }
  })
}

export function closeServer(server: Server): Promise<void> {
  return new Promise(resolve => {
    server.close(() => resolve())
  })
}
