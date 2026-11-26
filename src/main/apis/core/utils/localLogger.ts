import util from 'node:util'

import dayjs from 'dayjs'
import fs from 'fs-extra'

const LOG_SIZE_LIMIT = 10 * 1024 * 1024

interface LogBuffer {
  lines: string[]
  timer?: NodeJS.Timeout
  writing?: Promise<void>
}

const buffers = new Map<string, LogBuffer>()

async function flush(file: string, buffer: LogBuffer): Promise<void> {
  clearTimeout(buffer.timer)
  buffer.timer = undefined
  if (!buffer.writing && buffer.lines.length) {
    buffer.writing = (async () => {
      while (buffer.lines.length) {
        const lines = buffer.lines
        buffer.lines = []
        try {
          let size = await fs.stat(file).then(
            info => info.size,
            (error: NodeJS.ErrnoException) => {
              if (error.code === 'ENOENT') return 0
              throw error
            },
          )
          // A burst can cross the rotation limit multiple times before the disk catches up.
          let start = 0
          let flag = 'a'
          for (const [i, line] of lines.entries()) {
            if (size > LOG_SIZE_LIMIT) {
              flag = 'w'
              start = i
              size = 0
            }
            size += Buffer.byteLength(line)
          }
          await fs.outputFile(file, lines.slice(start).join(''), { flag })
        } catch (error) {
          console.log(error)
        }
      }
    })().finally(() => {
      buffer.writing = undefined
    })
  }
  await buffer.writing
  if (buffer.lines.length) await flush(file, buffer)
}

export async function flushLocalLogs(): Promise<void> {
  await Promise.all([...buffers].map(([file, buffer]) => flush(file, buffer)))
}

/** Local logging is available before the core logger starts. Writers share ordering per file. */
export const getLogger = (logPath: string, logType: string) => {
  const output: LogBuffer = buffers.get(logPath) ?? { lines: [] }
  buffers.set(logPath, output)
  return (type: string, ...msg: any[]) => {
    try {
      let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [${logType} ${type.toUpperCase()}] `
      msg.forEach((item: ILogArgvTypeWithError) => {
        if (item && typeof item === 'object' && type === 'error') {
          log += `\n------Error Stack Begin------\n${util.format(item.stack)}\n-------Error Stack End------- `
        } else {
          log += `${typeof item === 'object' ? JSON.stringify(item) : item} `
        }
      })
      log += '\n'
      console.log(log)
      output.lines.push(log)
      if (!output.timer && !output.writing) {
        output.timer = setTimeout(() => void flush(logPath, output), 100)
      }
    } catch (error) {
      console.log(error)
    }
  }
}
