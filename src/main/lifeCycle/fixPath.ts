import { shellPath } from 'shell-path'

export default async function fixPath(): Promise<void> {
  if (process.platform === 'win32') return

  let loginShellPath: string | undefined
  try {
    loginShellPath = await shellPath()
  } catch {
    // Keep startup working when the user's login shell is unavailable.
  }
  process.env.PATH =
    loginShellPath ||
    ['./node_modules/.bin', '/.nodebrew/current/bin', '/usr/local/bin', process.env.PATH].filter(Boolean).join(':')
}
