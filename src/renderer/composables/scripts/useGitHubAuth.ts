import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { IRPCActionType } from '#/constants/rpcActions'

interface IGitHubAuth {
  isAuthenticated: boolean
  username: string | null
}

interface IDeviceFlow {
  userCode: string
  verificationUri: string
  expiresAt: number
}

// Shared by the script page and its marketplace, share and login dialogs.
const githubAuth = ref<IGitHubAuth>({ isAuthenticated: false, username: null })
const deviceFlow = ref<IDeviceFlow | null>(null)
const loginDialogVisible = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let flowVersion = 0
let authVersion = 0
let loggingOut = false
let loginPending = false

function stopDeviceFlowPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

export function useGitHubAuth() {
  const { t } = useI18n()
  const message = useMessage()

  async function checkGitHubAuth() {
    const version = ++authVersion
    try {
      const auth = await window.electron.triggerRPC<IGitHubAuth>(IRPCActionType.SCRIPT_MARKETPLACE_CHECK_GITHUB_AUTH)
      if (auth && version === authVersion && !loggingOut) githubAuth.value = auth
    } catch (error) {
      console.error('Failed to check GitHub auth:', error)
    }
  }

  function finishLogin() {
    flowVersion++
    deviceFlow.value = null
    loginPending = false
    stopDeviceFlowPolling()
    loginDialogVisible.value = false
  }

  function pollDeviceFlow(version: number) {
    const poll = async () => {
      if (version !== flowVersion) return
      if (deviceFlow.value && Date.now() > deviceFlow.value.expiresAt) {
        finishLogin()
        message.error(t('pages.scripts.marketplace.deviceCodeExpired'))
        return
      }
      try {
        const result = await window.electron.triggerRPC<{
          success: boolean
          username?: string
          error?: string
          nextInterval?: number
        }>(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_POLL)
        // Login may have been cancelled while the request was in flight.
        if (version !== flowVersion) return

        if (result?.success) {
          finishLogin()
          authVersion++
          githubAuth.value = { isAuthenticated: true, username: result.username || null }
          message.success(t('pages.scripts.marketplace.loginSuccess'))
        } else if (result?.error === 'authorization_pending' || result?.error === 'slow_down') {
          pollTimer = setTimeout(poll, (result.nextInterval || 5) * 1000)
        } else {
          finishLogin()
          message.error(`${t('pages.scripts.marketplace.loginFailed')}: ${result?.error}`)
        }
      } catch (error) {
        console.error('Failed to poll device flow:', error)
        if (version === flowVersion) pollTimer = setTimeout(poll, 5000)
      }
    }
    void poll()
  }

  async function loginWithGitHub() {
    if (loginPending || loggingOut) return
    const version = ++flowVersion
    loginPending = true
    try {
      const result = await window.electron.triggerRPC<{
        userCode: string
        verificationUri: string
        expiresIn: number
      } | null>(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGIN)
      if (version !== flowVersion) return
      if (!result) {
        finishLogin()
        message.error(t('pages.scripts.marketplace.loginFailed'))
        return
      }
      deviceFlow.value = {
        userCode: result.userCode,
        verificationUri: result.verificationUri,
        expiresAt: Date.now() + result.expiresIn * 1000,
      }
      loginDialogVisible.value = true
      pollDeviceFlow(version)
    } catch (error) {
      if (version !== flowVersion) return
      finishLogin()
      console.error('Failed to initiate GitHub login:', error)
      message.error(t('pages.scripts.marketplace.loginFailed'))
    }
  }

  // Safe to call when no login is in progress, e.g. from the dialog's close handler.
  async function cancelGitHubLogin() {
    if (!loginPending) return
    finishLogin()
    await window.electron.triggerRPC(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_CANCEL)
  }

  async function logoutGitHub() {
    if (loggingOut) return
    loggingOut = true
    finishLogin()
    authVersion++
    try {
      if (!(await window.electron.triggerRPC(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGOUT)))
        throw new Error('Logout failed')
      authVersion++
      githubAuth.value = { isAuthenticated: false, username: null }
      message.success(t('pages.scripts.marketplace.logoutSuccess'))
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      loggingOut = false
    }
  }

  return {
    githubAuth,
    deviceFlow,
    loginDialogVisible,
    checkGitHubAuth,
    loginWithGitHub,
    cancelGitHubLogin,
    logoutGitHub,
  }
}
