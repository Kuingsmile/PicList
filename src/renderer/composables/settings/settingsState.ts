import { ref } from 'vue'

import { usePicBed } from '@/composables/useGlobal'

export function createSettingsState() {
  const { picBedG } = usePicBed()
  const ready = ref(false)
  const showPicBedList = ref<string[]>([])

  const galleryPicBedFilterList = ref<string[]>([])

  const currentTheme = ref('default.css')

  const proxy = ref('')

  const isDisableGPU = ref(false)

  const isPortable = ref(false)

  const currentLanguage = ref()

  const currentSecondMode = ref()

  const currentStartMode = ref()

  const currentShortUrlServer = ref()

  const rawPicGoSize = ref(false)

  const customLink = ref('![$fileName]($url)')

  const server = ref({ port: 36677, host: '0.0.0.0', enable: true })

  const advancedRename = ref({ enable: false, format: '{filename}' })

  const sync = ref<any>({
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    endpoint: '',
    proxy: '',
    interval: 60,
    // WebDAV-specific fields
    password: '',
    authType: 'basic',
    sslEnabled: true,
    webdavSavePath: '',
  })

  const formOfSetting = ref<ISettingForm>({
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
    ready,
    picBedG,
    showPicBedList,
    galleryPicBedFilterList,
    currentTheme,
    proxy,
    isDisableGPU,
    isPortable,
    currentLanguage,
    currentSecondMode,
    currentStartMode,
    currentShortUrlServer,
    rawPicGoSize,
    customLink,
    server,
    advancedRename,
    sync,
    formOfSetting,
  }
}
export type SettingsState = ReturnType<typeof createSettingsState>
