import { shellPathSync } from 'shell-path'

export default function fixPath () {
  if (process.platform === 'win32') {
    return
  }

  process.env.PATH =
    shellPathSync() || ['./node_modules/.bin', '/.nodebrew/current/bin', '/usr/local/bin', process.env.PATH].join(':')
}
