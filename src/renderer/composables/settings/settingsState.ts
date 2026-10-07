import { ref } from 'vue'

import { usePicBed } from '@/composables/useGlobal'
import { enforceBoolean } from '#/utils/values'

export function createServerDraft(config?: IServerConfig): IServerConfig {
  const draft = config ? { ...config } : { port: 36677, host: '0.0.0.0', enable: true }
  draft.enable = enforceBoolean(draft.enable)
  return draft
}

export function createSyncDraft(config?: ISyncConfig): ISyncConfig {
  const draft = config
    ? { ...config }
    : {
        type: 'github',
        username: '',
        repo: '',
        branch: '',
        token: '',
        endpoint: '',
        proxy: '',
        interval: 60,
        webdavEndpoint: '',
        webdavUsername: '',
        webdavPassword: '',
        webdavAuthType: 'basic' as const,
        webdavSslEnabled: true,
        webdavSavePath: '',
      }
  draft.webdavSslEnabled = enforceBoolean(draft.webdavSslEnabled)
  return draft
}

export function createSettingsState() {
  const { picBedG } = usePicBed()

  // These fields map directly to settings.* in the persisted configuration.
  const settings = ref<ISettingForm>({
    language: '',
    startMode: '',
    isDisableGPU: false,
    secondPicBedMode: 'backup',
    galleryPicBedFilter: [],
    customLink: '![$fileName]($url)',
    showUpdateTip: true,
    autoStart: false,
    rename: false,
    autoRename: false,
    uploadNotification: false,
    uploadResultNotification: true,
    miniWindowOntop: false,
    autoCloseMiniWindow: false,
    autoCloseMainWindow: false,
    logLevel: ['all'],
    autoCopy: true,
    useBuiltinClipboard: true,
    logFileSizeLimit: 10,
    deleteCloudFile: false,
    isCustomMiniIcon: false,
    customMiniIcon: '',
    isHideDock: false,
    autoImport: false,
    autoImportPicBed: [],
    encodeOutputURL: false,
    isAutoListenClipboard: false,
    useShortUrl: false,
    shortUrlServer: 'c1n',
    c1nToken: '',
    yourlsDomain: '',
    yourlsSignature: '',
    cfWorkerHost: '',
    sinkDomain: '',
    sinkToken: '',
    deleteLocalFile: false,
    serverKey: '',
    serverMaxConcurrency: 0,
    serverUploadInterval: 0,
    aesPassword: 'PicList-aesPassword',
    registry: '',
    proxy: '',
    mainWindowWidth: 1200,
    mainWindowHeight: 800,
    enableSecondUploader: false,
    enableAdvancedAnimation: false,
    theme: 'default.css',
    enableCustomBgImg: false,
    customBgImgPath: '',
    customBgImgOpacity: 0.7,
    customBgImgBlur: 5,
  })

  return {
    settings,
    picBedG,
    // These values live outside settings.* and have their own persistence rules.
    visiblePicBeds: ref<string[]>([]),
    uploadProxy: ref(''),
    advancedRename: ref({ enable: false, format: '{filename}' }),
    // Dialog drafts are saved only on confirmation, never by autosave.
    serverDraft: ref<IServerConfig>(createServerDraft()),
    syncDraft: ref<ISyncConfig>(createSyncDraft()),
    // UI and runtime state is not persisted as settings.
    ready: ref(false),
    isPortable: ref(false),
    rawPicGoSize: ref(false),
  }
}

export type SettingsState = ReturnType<typeof createSettingsState>
