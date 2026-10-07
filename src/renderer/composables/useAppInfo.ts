import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { GITHUB_URL } from '@/utils/static'
import { IRPCActionType } from '#/constants/rpcActions'

const platformNames: Record<string, string> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
}

// Option labels of the "System Information" dropdown in .github/ISSUE_TEMPLATE/bug_report.yml
const issuePlatforms: Record<string, [x64: string, arm64: string]> = {
  win32: ['Windows', 'Win(arm64)'],
  darwin: ['Mac', 'Mac(arm64)'],
  linux: ['Linux', 'Linux(arm64)'],
}

export function formatOperatingSystem(info: IAppInfo) {
  const name = info.osName || platformNames[info.platform] || info.platform
  return `${name} ${info.osRelease} (${info.arch})`
}

export function formatDiagnostics(info: IAppInfo) {
  return [
    `PicList: v${info.version} (${info.isPortable ? 'portable' : 'installer'})`,
    `Electron: ${info.electron}`,
    `Chromium: ${info.chrome}`,
    `Node.js: ${info.node}`,
    `OS: ${formatOperatingSystem(info)}`,
    `Language: ${info.language}`,
  ].join('\n')
}

export function issueUrl(info: IAppInfo | undefined, template: 'bug_report.yml' | 'feature_request.yml') {
  const url = new URL(`${GITHUB_URL}/issues/new`)
  url.searchParams.set('template', template)
  if (info && template === 'bug_report.yml') {
    url.searchParams.set('version', `v${info.version}`)
    const platform = issuePlatforms[info.platform]
    if (platform) url.searchParams.set('platform', platform[info.arch === 'arm64' ? 1 : 0])
  }
  return url.toString()
}

/** Clipboard write with a short-lived "copied" state for button feedback. */
export function useCopyState() {
  const copyState = shallowRef<'idle' | 'copied' | 'error'>('idle')
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  function copy(text: string) {
    clearTimeout(resetTimer)
    try {
      window.electron.clipboard.writeText(text)
      copyState.value = 'copied'
    } catch {
      copyState.value = 'error'
    }
    resetTimer = setTimeout(() => {
      copyState.value = 'idle'
    }, 2500)
  }

  onBeforeUnmount(() => clearTimeout(resetTimer))

  return { copyState, copy }
}

export function useAppInfo() {
  const appInfo = shallowRef<IAppInfo>()

  onMounted(async () => {
    try {
      appInfo.value = await window.electron.triggerRPC<IAppInfo>(IRPCActionType.GET_APP_INFO)
    } catch {
      appInfo.value = undefined
    }
  })

  return { appInfo }
}
