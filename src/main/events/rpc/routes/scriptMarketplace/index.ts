import path from 'node:path'

import { scriptsDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import { shell } from 'electron'
import fs from 'fs-extra'

import { RPCRouter } from '~/events/rpc/router'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const GITHUB_REPO_OWNER = 'Kuingsmile'
const GITHUB_REPO_NAME = 'piclist-ScriptsHub'
const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_CLIENT_ID = 'Ov23liLELZPZXhQnpadf'

let MEMORY_SCRIPTS_CACHE: IScriptMeta[] | null = null
let LAST_FETCH_TIMESTAMP: number = 0

interface IScriptMeta {
  name: string
  author: string
  description: string
  version: string
  fileName: string
  category: string
  downloadUrl: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

interface IGitHubAuthState {
  accessToken: string | null
  username: string | null
}

interface IDeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface IDeviceFlowState {
  deviceCode: string | null
  userCode: string | null
  verificationUri: string | null
  expiresAt: number | null
  interval: number
  pollingTimer: NodeJS.Timeout | null
}

const authState: IGitHubAuthState = {
  accessToken: null,
  username: null,
}

const deviceFlowState: IDeviceFlowState = {
  deviceCode: null,
  userCode: null,
  verificationUri: null,
  expiresAt: null,
  interval: 5,
  pollingTimer: null,
}

async function loadAuthState() {
  const savedToken = picgo.getConfig<string>('scripts.githubToken')
  const savedUsername = picgo.getConfig<string>('scripts.githubUsername')
  if (savedToken && savedUsername) {
    authState.accessToken = savedToken
    authState.username = savedUsername
  }
}

function saveAuthState() {
  picgo.saveConfig({
    'scripts.githubToken': authState.accessToken,
    'scripts.githubUsername': authState.username,
  })
}

function clearAuthState() {
  authState.accessToken = null
  authState.username = null
  picgo.saveConfig({
    'scripts.githubToken': null,
    'scripts.githubUsername': null,
  })
}

async function fetchScriptsList(): Promise<IScriptMeta[]> {
  const now = Date.now()
  const FIVE_MINUTES = 5 * 60 * 1000

  if (MEMORY_SCRIPTS_CACHE && now - LAST_FETCH_TIMESTAMP < FIVE_MINUTES) {
    return MEMORY_SCRIPTS_CACHE
  }

  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@main/scripts.json`,
    )
    if (!response.ok) throw new Error('Failed to load marketplace index')
    const scripts = (await response.json()) as IScriptMeta[]
    MEMORY_SCRIPTS_CACHE = scripts
    LAST_FETCH_TIMESTAMP = now
    return scripts
  } catch (error) {
    logger.error(`Marketplace error: ${error}`)
    return MEMORY_SCRIPTS_CACHE || []
  }
}

async function downloadScript(scriptMeta: IScriptMeta): Promise<boolean> {
  try {
    const response = await fetch(scriptMeta.downloadUrl)

    if (!response.ok) {
      throw new Error(`Failed to download script: ${response.statusText}`)
    }

    const content = await response.text()

    const categoryParts = scriptMeta.category.split('.')
    const localPath = path.join(scriptsDir(), ...categoryParts, scriptMeta.fileName)

    fs.ensureDirSync(path.dirname(localPath))

    fs.writeFileSync(localPath, content, 'utf-8')

    logger.info(`Downloaded script ${scriptMeta.name} to ${localPath}`)
    return true
  } catch (error) {
    logger.error(`Failed to download script: ${error}`)
    throw error
  }
}

async function initiateGitHubDeviceFlow(): Promise<{
  userCode: string
  verificationUri: string
  expiresIn: number
} | null> {
  try {
    if (deviceFlowState.pollingTimer) {
      clearInterval(deviceFlowState.pollingTimer)
      deviceFlowState.pollingTimer = null
    }

    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        scope: 'public_repo',
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get device code: ${response.statusText}`)
    }

    const data = (await response.json()) as IDeviceCodeResponse

    deviceFlowState.deviceCode = data.device_code
    deviceFlowState.userCode = data.user_code
    deviceFlowState.verificationUri = data.verification_uri
    deviceFlowState.expiresAt = Date.now() + data.expires_in * 1000
    deviceFlowState.interval = data.interval || 5

    shell.openExternal(data.verification_uri)

    logger.info(`GitHub Device Flow initiated. User code: ${data.user_code}`)

    return {
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      expiresIn: data.expires_in,
    }
  } catch (error) {
    logger.error(`Failed to initiate GitHub Device Flow: ${error}`)
    return null
  }
}

async function pollDeviceFlowAuthorization(): Promise<{
  success: boolean
  username?: string
  error?: string
  nextInterval?: number
}> {
  if (!deviceFlowState.deviceCode) {
    return { success: false, error: 'No device code available. Please initiate login first.' }
  }

  if (deviceFlowState.expiresAt && Date.now() > deviceFlowState.expiresAt) {
    return { success: false, error: 'Device code expired. Please try again.' }
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceFlowState.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    console.log('Poll response status:', response.status)

    const data = (await response.json()) as {
      access_token?: string
      error?: string
      error_description?: string
      interval?: number
    }
    console.log('Poll response data:', data)

    if (data.error) {
      if (data.error === 'authorization_pending') {
        return { success: false, error: 'authorization_pending' }
      } else if (data.error === 'slow_down') {
        return { success: false, error: 'slow_down', nextInterval: data.interval || deviceFlowState.interval + 5 }
      } else if (data.error === 'expired_token') {
        return { success: false, error: 'Device code expired. Please try again.' }
      } else if (data.error === 'access_denied') {
        return { success: false, error: 'Authorization denied by user.' }
      } else {
        return { success: false, error: data.error_description || data.error }
      }
    }

    if (data.access_token) {
      authState.accessToken = data.access_token
      const userResponse = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      })

      if (userResponse.ok) {
        const userData = (await userResponse.json()) as { login: string }
        authState.username = userData.login
      }

      saveAuthState()

      deviceFlowState.deviceCode = null
      deviceFlowState.userCode = null
      deviceFlowState.verificationUri = null
      deviceFlowState.expiresAt = null

      logger.info(`GitHub Device Flow completed. User: ${authState.username}`)

      return { success: true, username: authState.username || undefined }
    }

    return { success: false, error: 'Unknown error during authorization' }
  } catch (error) {
    logger.error(`Failed to poll device flow authorization: ${error}`)
    return { success: false, error: String(error) }
  }
}

function cancelDeviceFlow() {
  if (deviceFlowState.pollingTimer) {
    clearInterval(deviceFlowState.pollingTimer)
    deviceFlowState.pollingTimer = null
  }
  deviceFlowState.deviceCode = null
  deviceFlowState.userCode = null
  deviceFlowState.verificationUri = null
  deviceFlowState.expiresAt = null
}

async function shareScript(
  scriptPath: string[],
  metadata: { name: string; author: string; description: string },
): Promise<{ success: boolean; prUrl?: string; error?: string }> {
  if (!authState.accessToken) {
    return { success: false, error: 'Not authenticated with GitHub' }
  }

  try {
    const localPath = path.join(scriptsDir(), ...scriptPath)
    if (!fs.existsSync(localPath)) {
      return { success: false, error: 'Script file not found' }
    }

    let content = fs.readFileSync(localPath, 'utf-8')

    const metaHeader = `/**
 * @name ${metadata.name}
 * @author ${metadata.author}
 * @description ${metadata.description}
 * @version 1.0.0
 */

`

    if (!content.startsWith('/**')) {
      content = metaHeader + content
    }

    const category = scriptPath.length > 1 ? scriptPath.slice(0, -1).join('/') : 'manualTrigger'
    const fileName = `${metadata.author}-${scriptPath[scriptPath.length - 1]}`
    const filePath = `${category}/${fileName}`

    const forkResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!forkResponse.ok && forkResponse.status !== 202) {
      const forkError = await forkResponse.text()
      logger.error(`Fork response: ${forkError}`)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const mainBranchResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${authState.username}/${GITHUB_REPO_NAME}/git/ref/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      },
    )

    let baseSha: string
    if (mainBranchResponse.ok) {
      const mainBranchData = (await mainBranchResponse.json()) as { object: { sha: string } }
      baseSha = mainBranchData.object.sha
    } else {
      const origBranchResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/ref/heads/main`,
        {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        },
      )
      const origBranchData = (await origBranchResponse.json()) as { object: { sha: string } }
      baseSha = origBranchData.object.sha
    }

    const branchName = `add-script-${Date.now()}`
    await fetch(`${GITHUB_API_BASE}/repos/${authState.username}/${GITHUB_REPO_NAME}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    })

    const fileResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${authState.username}/${GITHUB_REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add script: ${metadata.name}`,
          content: Buffer.from(content).toString('base64'),
          branch: branchName,
        }),
      },
    )

    if (!fileResponse.ok) {
      const errorData = await fileResponse.text()
      return { success: false, error: `Failed to create file: ${errorData}` }
    }

    const prResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Add script: ${metadata.name}`,
        body: `## Script Information\n\n- **Name**: ${metadata.name}\n- **Author**: ${metadata.author}\n- **Description**: ${metadata.description}\n\nSubmitted via PicList Script Marketplace`,
        head: `${authState.username}:${branchName}`,
        base: 'main',
      }),
    })

    if (!prResponse.ok) {
      const prError = await prResponse.text()
      return { success: false, error: `Failed to create PR: ${prError}` }
    }

    const prData = (await prResponse.json()) as { html_url: string }
    return { success: true, prUrl: prData.html_url }
  } catch (error) {
    logger.error(`Failed to share script: ${error}`)
    return { success: false, error: String(error) }
  }
}

loadAuthState()

const scriptMarketplaceRouter = new RPCRouter()

const scriptMarketplaceRoutes = [
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_FETCH_LIST,
    handler: async () => {
      return await fetchScriptsList()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_DOWNLOAD,
    handler: async (_: IIPCEvent, args: [IScriptMeta]) => {
      return await downloadScript(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_SHARE,
    handler: async (_: IIPCEvent, args: [string[], { name: string; author: string; description: string }]) => {
      return await shareScript(args[0], args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_CHECK_GITHUB_AUTH,
    handler: async () => {
      await loadAuthState()
      return {
        isAuthenticated: !!authState.accessToken,
        username: authState.username,
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGIN,
    handler: async () => {
      return await initiateGitHubDeviceFlow()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_POLL,
    handler: async () => {
      return await pollDeviceFlowAuthorization()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_CANCEL,
    handler: async () => {
      cancelDeviceFlow()
      return true
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGOUT,
    handler: async () => {
      clearAuthState()
      cancelDeviceFlow()
      return true
    },
    type: IRPCType.INVOKE,
  },
]

scriptMarketplaceRouter.addBatch(scriptMarketplaceRoutes)

export { scriptMarketplaceRouter }
