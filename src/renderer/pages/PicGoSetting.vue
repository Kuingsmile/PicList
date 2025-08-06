<template>
  <div>
    <div class="piclist-settings">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <Settings
            :size="24"
            class="header-icon"
          />
          <div>
            <h1>{{ t('pages.settings.title') }}</h1>
            <p>{{ t('pages.settings.description') }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="btn btn-secondary"
            @click="goConfigPage"
          >
            <BookOpen :size="16" />
            {{ t('pages.settings.docs') }}
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeName === tab.id }"
          @click="activeName = tab.id as 'system' | 'sync' | 'upload' | 'advanced' | 'update'"
        >
          <component
            :is="tab.icon"
            :size="18"
          />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- System Settings Tab -->
        <div
          v-if="activeName === 'system'"
          class="tab-content"
        >
          <div class="settings-section">
            <h2>{{ t('pages.settings.system.languageAndAppearance') }}</h2>
            <p>{{ ' ' }}</p>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('pages.settings.system.chooseLanguage') }}</label>
                <select
                  v-model="currentLanguage"
                  class="form-select"
                >
                  <option
                    v-for="item in languageList"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>{{ t('pages.settings.system.startMode') }}</label>
                <select
                  v-model="currentStartMode"
                  class="form-select"
                >
                  <option value="quiet">
                    {{ t('pages.settings.system.quietMode') }}
                  </option>
                  <option
                    v-if="osGlobal !== 'darwin'"
                    value="mini"
                  >
                    {{ t('pages.settings.system.miniMode') }}
                  </option>
                  <option
                    v-if="osGlobal === 'darwin'"
                    value="no-tray"
                  >
                    {{ t('pages.settings.system.noTrayMode') }}
                  </option>
                  <option value="main">
                    {{ t('pages.settings.system.mainMode') }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('pages.settings.system.windowBehavior') }}</h2>
            <p>{{ ' ' }}</p>
            <div
              v-if="osGlobal === 'darwin'"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="formOfSetting.isHideDock"
                  type="checkbox"
                  class="switch-input"
                  @change="handleHideDockChange(formOfSetting.isHideDock)"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.isHideDock') }}</div>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label>{{ t('pages.settings.system.mainWindowSize') }}</label>
              <button
                class="btn btn-secondary"
                @click="mainWindowSizeVisible = true"
              >
                <Monitor :size="16" />
                {{ t('pages.settings.clickToSet') }}
              </button>
            </div>

            <div
              v-if="osGlobal !== 'darwin'"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="formOfSetting.autoCloseMiniWindow"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.autoCloseMiniWindow') }}</div>
                </div>
              </label>
            </div>

            <div
              v-if="osGlobal !== 'darwin'"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="formOfSetting.autoCloseMainWindow"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.autoCloseMainWindow') }}</div>
                </div>
              </label>
            </div>

            <div
              v-if="osGlobal !== 'darwin'"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="formOfSetting.miniWindowOntop"
                  type="checkbox"
                  class="switch-input"
                  @change="handleMiniWindowOntop(formOfSetting.miniWindowOntop)"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.miniWindowOnTop') }}</div>
                </div>
              </label>
            </div>

            <div
              v-if="osGlobal !== 'darwin'"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="formOfSetting.isCustomMiniIcon"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.isCustomMiniIcon') }}</div>
                </div>
              </label>
            </div>

            <div
              v-if="osGlobal !== 'darwin' && formOfSetting.isCustomMiniIcon"
              class="form-group"
            >
              <label>{{ t('pages.settings.system.customMiniIconPath') }}</label>
              <button
                class="btn btn-secondary"
                @click="handleMiniIconPath"
              >
                <ImageIcon :size="16" />
                {{ t('pages.settings.clickToSet') }}
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('pages.settings.system.startupAndShortcuts') }}</h2>
            <p>{{ ' ' }}</p>
            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="formOfSetting.autoStart"
                  type="checkbox"
                  class="switch-input"
                  @change="handleAutoStartChange(formOfSetting.autoStart)"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.system.autoLaunch') }}</div>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label>{{ t('pages.settings.system.setShortCuts') }}</label>
              <button
                class="btn btn-secondary"
                @click="goShortCutPage"
              >
                <Keyboard :size="16" />
                {{ t('pages.settings.clickToSet') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sync & Configure Tab -->
        <div
          v-if="activeName === 'sync'"
          class="tab-content"
        >
          <div class="settings-section">
            <h2>{{ t('pages.settings.sync.syncConfiguration') }}</h2>
            <p>{{ ' ' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('pages.settings.sync.syncEndpointConfig') }}</label>
                <button
                  class="btn btn-primary"
                  @click="syncVisible = true"
                >
                  <RotateCcw :size="16" />
                  {{ t('pages.settings.clickToSet') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('pages.settings.sync.upDownloadSettings') }}</label>
                <button
                  class="btn btn-primary"
                  @click="upDownConfigVisible = true"
                >
                  <Download :size="16" />
                  {{ t('pages.settings.clickToSet') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('pages.settings.sync.migrateFromPicGo') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="handleMigrateFromPicGo"
                >
                  <Import :size="16" />
                  {{ t('pages.settings.clickToSet') }}
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('pages.settings.sync.fileManagement') }}</h2>
            <p>{{ ' ' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('pages.settings.sync.openConfigFile') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="openFile('data.json')"
                >
                  <FileText :size="16" />
                  {{ t('pages.settings.clickToOpen') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('pages.settings.sync.openConfigFileDir') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="openDirectory()"
                >
                  <FolderOpen :size="16" />
                  {{ t('pages.settings.clickToOpen') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Upload Settings Tab -->
        <div
          v-if="activeName === 'upload'"
          class="tab-content"
        >
          <div class="settings-section">
            <h2>{{ t('pages.settings.upload.uploadBehavior') }}</h2>
            <p>{{ ' ' }}</p>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="formOfSetting.autoImport"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.sync.autoImportInManage') }}</div>
                  <div class="switch-description">{{ t('SETTINGS_AUTO_IMPORT_DESC') || 'Automatically import images to selected image beds' }}</div>
                </div>
              </label>
            </div>

            <div
              v-if="formOfSetting.autoImport"
              class="form-group"
            >
              <label>{{ t('SETTINGS_AUTO_IMPORT_SELECT_PICBED') }}</label>
              <div class="checkbox-group">
                <label
                  v-for="item in picBedGlobal"
                  :key="item.type"
                  class="checkbox-option"
                >
                  <input
                    v-model="formOfSetting.autoImportPicBed"
                    type="checkbox"
                    :value="item.type"
                    class="checkbox-input"
                  >
                  <span class="checkbox-indicator" />
                  <span class="checkbox-label">{{ item.name }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="formOfSetting.enableSecondUploader"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('SETTINGS_ENABLE_SECOND_PICBED') }}</div>
                  <div class="switch-description">{{ t('SETTINGS_ENABLE_SECOND_PICBED_DESC') || 'Enable secondary image bed for redundancy' }}</div>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label>{{ t('SETTINGS_SET_SECOND_PICBED') }}</label>
              <button
                class="btn btn-secondary"
                @click="handleChangeSecondPicBed"
              >
                <CloudUpload :size="16" />
                {{ t('SETTINGS_CLICK_TO_SET') }}
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('SETTINGS_UPLOAD_PROCESSING') || 'Upload Processing' }}</h2>
            <p>{{ t('SETTINGS_UPLOAD_PROCESSING_DESC') || 'Configure file processing, naming and format options' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.deleteCloudFile"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_SYNC_DELETE_CLOUD') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_SYNC_DELETE_CLOUD_DESC') || 'Delete cloud file when local file is deleted' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.rename"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_RENAME_BEFORE_UPLOAD') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_RENAME_BEFORE_UPLOAD_DESC') || 'Rename files before uploading' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.autoRename"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_TIMESTAMP_RENAME') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_TIMESTAMP_RENAME_DESC') || 'Add timestamp to file names' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label>{{ t('SETTINGS_ADVANCED_RENAME') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="advancedRenameVisible = true"
                >
                  <Edit :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('SETTINGS_COMPRESS_AND_WATERMARK') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="imageProcessDialogVisible = true"
                >
                  <ImageIcon :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.deleteLocalFile"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_DELETE_LOCAL_FILE_AFTER_UPLOAD') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_DELETE_LOCAL_FILE_DESC') || 'Delete local file after successful upload' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('SETTINGS_NOTIFICATIONS_CLIPBOARD') || 'Notifications & Clipboard' }}</h2>
            <p>{{ t('SETTINGS_NOTIFICATIONS_CLIPBOARD_DESC') || 'Configure notifications and clipboard behavior' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.uploadNotification"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_OPEN_UPLOAD_TIPS') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_UPLOAD_TIPS_DESC') || 'Show notification when uploading starts' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.uploadResultNotification"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_OPEN_UPLOAD_RESULT_TIPS') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_UPLOAD_RESULT_DESC') || 'Show notification when upload completes' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.autoCopy"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_AUTO_COPY_DESC') || 'Automatically copy URL to clipboard after upload' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.useBuiltinClipboard"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD') }}</div>
                    <div class="switch-description">{{ t('BUILTIN_CLIPBOARD_TIPS') || 'Use built-in clipboard monitoring for uploads' }}</div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.isAutoListenClipboard"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_WATCH_CLIPBOARD') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_WATCH_CLIPBOARD_DESC') || 'Monitor clipboard for automatic uploads' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('SETTINGS_URL_FORMAT') || 'URL Format & Links' }}</h2>
            <p>{{ t('SETTINGS_URL_FORMAT_DESC') || 'Configure output URL format and short URL options' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('SETTINGS_CUSTOM_LINK_FORMAT') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="customLinkVisible = true"
                >
                  <Link :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.useShortUrl"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_SHORT_URL') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_SHORT_URL_DESC') || 'Generate short URLs for uploaded images' }}</div>
                  </div>
                </label>
              </div>

              <div
                v-if="formOfSetting.useShortUrl"
                class="form-group"
              >
                <label>{{ t('SETTINGS_SHORT_URL_SERVER') }}</label>
                <select
                  v-model="currentShortUrlServer"
                  class="form-select"
                  @change="handleShortUrlServerChange(currentShortUrlServer.value)"
                >
                  <option
                    v-for="item in shortUrlServerList"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </div>

              <div
                v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'c1n'"
                class="form-group"
              >
                <label>{{ t('SETTINGS_SHORT_URL_C1N_TOKEN') }}</label>
                <input
                  v-model="formOfSetting.c1nToken"
                  type="text"
                  class="form-input"
                  :placeholder="t('SETTINGS_SHORT_URL_C1N_TOKEN')"
                >
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.encodeOutputURL"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_ENCODE_OUTPUT_URL') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_ENCODE_OUTPUT_URL_DESC') || 'URL-encode special characters in output URLs' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('CHOOSE_SHOWED_PICBED') }}</h2>
            <p>{{ t('CHOOSE_SHOWED_PICBED_DESC') || 'Select which image beds to display in the interface' }}</p>

            <div class="checkbox-group">
              <label
                v-for="item in picBedGlobal"
                :key="item.name"
                class="checkbox-option"
              >
                <input
                  v-model="showPicBedList"
                  type="checkbox"
                  :value="item.name"
                  class="checkbox-input"
                  @change="handleShowPicBedListChange(showPicBedList)"
                >
                <span class="checkbox-indicator" />
                <span class="checkbox-label">{{ item.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Advanced Settings Tab -->
        <div
          v-if="activeName === 'advanced'"
          class="tab-content"
        >
          <div class="settings-section">
            <h2>{{ t('SETTINGS_LOGGING') || 'Logging' }}</h2>
            <p>{{ t('SETTINGS_LOGGING_DESC') || 'Configure application logging and debug options' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('SETTINGS_LOG_FILE_PATH') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="openDirectory()"
                >
                  <FolderOpen :size="16" />
                  {{ t('SETTINGS_CLICK_TO_OPEN') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('SETTINGS_SET_LOG_FILE') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="openLogSetting"
                >
                  <FileText :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('SETTINGS_NETWORK_PROXY') || 'Network & Proxy' }}</h2>
            <p>{{ t('SETTINGS_NETWORK_PROXY_DESC') || 'Configure proxy settings and network mirrors' }}</p>

            <div class="form-group">
              <label>{{ t('SETTINGS_SET_PROXY_AND_MIRROR') }}</label>
              <button
                class="btn btn-secondary"
                @click="proxyVisible = true"
              >
                <Globe :size="16" />
                {{ t('SETTINGS_CLICK_TO_SET') }}
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h2>{{ t('SETTINGS_SERVER_CONFIGURATION') || 'Server Configuration' }}</h2>
            <p>{{ t('SETTINGS_SERVER_CONFIGURATION_DESC') || 'Configure web server and API server settings' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('SETTINGS_SET_WEB_SERVER') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="webServerVisible = true"
                >
                  <Server :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('SETTINGS_SET_SERVER') }}</label>
                <button
                  class="btn btn-secondary"
                  @click="serverVisible = true"
                >
                  <Settings :size="16" />
                  {{ t('SETTINGS_CLICK_TO_SET') }}
                </button>
              </div>

              <div class="form-group">
                <label>{{ t('SETTINGS_SET_SERVER_AES_KEY') }}</label>
                <input
                  v-model.trim="formOfSetting.aesPassword"
                  type="text"
                  class="form-input"
                  :placeholder="t('SETTINGS_SET_SERVER_AES_KEY')"
                  @change="handleAesPasswordChange(formOfSetting.aesPassword)"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Update Settings Tab -->
        <div
          v-if="activeName === 'update'"
          class="tab-content"
        >
          <div class="settings-section">
            <h2>{{ t('SETTINGS_APPLICATION_UPDATES') || 'Application Updates' }}</h2>
            <p>{{ t('SETTINGS_APPLICATION_UPDATES_DESC') || 'Check for updates and configure update notifications' }}</p>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ t('SETTINGS_CHECK_UPDATE') }}</label>
                <button
                  class="btn btn-primary"
                  @click="checkUpdate"
                >
                  <RefreshCw :size="16" />
                  {{ t('SETTINGS_CLICK_TO_CHECK') }}
                </button>
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.showUpdateTip"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('SETTINGS_OPEN_UPDATE_HELPER') }}</div>
                    <div class="switch-description">{{ t('SETTINGS_UPDATE_HELPER_DESC') || 'Show notifications when updates are available' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <div
      v-if="customLinkVisible"
      class="dialog-overlay"
      @click="customLinkVisible = false"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_CUSTOM_LINK_FORMAT') }}
          </h3>
          <button
            class="dialog-close"
            @click="customLinkVisible = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="notice-text">
            {{ t('SETTINGS_TIPS_PLACEHOLDER_URL') }}<br>
            {{ t('SETTINGS_TIPS_PLACEHOLDER_FILENAME') }}<br>
            {{ t('SETTINGS_TIPS_PLACEHOLDER_EXTNAME') }}
          </div>
          <div class="form-group">
            <input
              v-model="customLink.value"
              type="text"
              class="form-input"
              :placeholder="'![$fileName]($url)'"
            >
          </div>
          <small>{{ t('SETTINGS_TIPS_SUCH_AS') }}: ![$fileName]($url)</small>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelCustomLink"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmCustomLink"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Proxy Settings Dialog -->
    <div
      v-if="proxyVisible"
      class="dialog-overlay"
      @click="proxyVisible = false"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_NETWORK_PROXY') }}
          </h3>
          <button
            class="dialog-close"
            @click="proxyVisible = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ t('SETTINGS_UPLOAD_PROXY') }}</label>
            <input
              v-model="proxy"
              type="text"
              class="form-input"
              :placeholder="`${t('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
            >
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_PLUGIN_INSTALL_PROXY') }}</label>
            <input
              v-model="formOfSetting.proxy"
              type="text"
              class="form-input"
              :placeholder="`${t('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
            >
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_PLUGIN_INSTALL_MIRROR') }}</label>
            <input
              v-model="formOfSetting.registry"
              type="text"
              class="form-input"
              :placeholder="`${t('SETTINGS_TIPS_SUCH_AS')}：https://registry.npmmirror.com`"
            >
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="proxyVisible = false"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="proxyVisible = false"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Window Size Dialog -->
    <div
      v-if="mainWindowSizeVisible"
      class="dialog-overlay"
      @click="cancelWindowSize"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_MAIN_WINDOW_SIZE') }}
          </h3>
          <button
            class="dialog-close"
            @click="cancelWindowSize"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ t('SETTINGS_MAIN_WINDOW_SIZE_WIDTH') }}</label>
            <input
              v-model="formOfSetting.mainWindowWidth"
              type="number"
              class="form-input"
              :placeholder="t('SETTINGS_MAIN_WINDOW_WIDTH_HINT')"
            >
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_MAIN_WINDOW_SIZE_HEIGHT') }}</label>
            <input
              v-model="formOfSetting.mainWindowHeight"
              type="number"
              class="form-input"
              :placeholder="t('SETTINGS_MAIN_WINDOW_HEIGHT_HINT')"
            >
          </div>
          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="rawPicGoSize"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('SETTINGS_RAW_PICGO_SIZE') }}</div>
                <div class="switch-description">{{ t('SETTINGS_USE_DEFAULT_PICGO_SIZE') || 'Use default PicGo window size' }}</div>
              </div>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelWindowSize"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmWindowSize"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Check Update Dialog -->
    <div
      v-if="checkUpdateVisible"
      class="dialog-overlay"
      @click="cancelCheckVersion"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_CHECK_UPDATE') }}
          </h3>
          <button
            class="dialog-close"
            @click="cancelCheckVersion"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="update-info">
            <div>{{ t('SETTINGS_CURRENT_VERSION') }}: {{ version }}</div>
            <div>
              {{ t('SETTINGS_NEWEST_VERSION') }}:
              {{ latestVersion ? latestVersion : `${t('SETTINGS_GETING')}...` }}
            </div>
            <div
              v-if="needUpdate"
              class="update-notice"
            >
              {{ t('SETTINGS_TIPS_HAS_NEW_VERSION') }}
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelCheckVersion"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmCheckVersion"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Advanced Rename Dialog -->
    <div
      v-if="advancedRenameVisible"
      class="dialog-overlay"
      @click="handleCancelAdvancedRename"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_ADVANCED_RENAME') }}
          </h3>
          <button
            class="dialog-close"
            @click="handleCancelAdvancedRename"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="advancedRename.enable"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('SETTINGS_ADVANCED_RENAME_ENABLE') }}</div>
                <div class="switch-description">{{ t('SETTINGS_ADVANCED_RENAME_ENABLE_DESC') || 'Enable advanced file renaming' }}</div>
              </div>
            </label>
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_ADVANCED_RENAME_FORMAT') }}</label>
            <input
              v-model="advancedRename.format"
              type="text"
              class="form-input"
              placeholder="Ex. {Y}-{m}-{uuid}"
            >
            <small class="form-help">{{ t('SETTINGS_ADVANCED_RENAME_FORMAT_HELP') || 'Use placeholders like {Y}, {m}, {d}, {filename}, {uuid}' }}</small>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="handleCancelAdvancedRename"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="handleSaveAdvancedRename"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Log Settings Dialog -->
    <div
      v-if="logFileVisible"
      class="dialog-overlay"
      @click="cancelLogLevelSetting"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_SET_LOG_FILE') }}
          </h3>
          <button
            class="dialog-close"
            @click="cancelLogLevelSetting"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('SETTINGS_LOG_FILE') }}</label>
              <button
                class="btn btn-secondary"
                @click="openFile('piclist.log')"
              >
                <FileText :size="16" />
                {{ t('SETTINGS_CLICK_TO_OPEN') }}
              </button>
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_GUI_LOG_FILE') }}</label>
              <button
                class="btn btn-secondary"
                @click="openFile('piclist-gui-local.log')"
              >
                <FileText :size="16" />
                {{ t('SETTINGS_CLICK_TO_OPEN') }}
              </button>
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_MANAGE_LOG_FILE') }}</label>
              <button
                class="btn btn-secondary"
                @click="openFile('manage.log')"
              >
                <FileText :size="16" />
                {{ t('SETTINGS_CLICK_TO_OPEN') }}
              </button>
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_LOG_LEVEL') }}</label>
              <select
                v-model="formOfSetting.logLevel"
                multiple
                class="form-select"
              >
                <option
                  v-for="(value, key) of logLevel"
                  :key="key"
                  :value="key"
                  :disabled="handleLevelDisabled(key)"
                >
                  {{ value }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_LOG_FILE_SIZE') }} (MB)</label>
              <input
                v-model="formOfSetting.logFileSizeLimit"
                type="number"
                class="form-input"
                :placeholder="`${t('SETTINGS_TIPS_SUCH_AS')}：10`"
                min="1"
              >
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelLogLevelSetting"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmLogLevelSetting"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Server Settings Dialog -->
    <div
      v-if="serverVisible"
      class="dialog-overlay"
      @click="cancelServerSetting"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_SET_PICGO_SERVER') }}
          </h3>
          <button
            class="dialog-close"
            @click="cancelServerSetting"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="notice-text">
            {{ t('SETTINGS_TIPS_SERVER_NOTICE') }}
          </div>
          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="server.enable"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('SETTINGS_ENABLE_SERVER') }}</div>
                <div class="switch-description">{{ t('SETTINGS_ENABLE_SERVER_DESC') || 'Enable PicGo server for external access' }}</div>
              </div>
            </label>
          </div>
          <template v-if="server.enable">
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_SERVER_HOST') }}</label>
              <input
                v-model="server.host"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_TIP_PLACEHOLDER_HOST')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_SERVER_PORT') }}</label>
              <input
                v-model="server.port"
                type="number"
                class="form-input"
                :placeholder="t('SETTINGS_TIP_PLACEHOLDER_PORT')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_SERVER_KEY') }}</label>
              <input
                v-model="formOfSetting.serverKey"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_TIP_PLACEHOLDER_KEY')"
              >
            </div>
          </template>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelServerSetting"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmServerSetting"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Web Server Settings Dialog -->
    <div
      v-if="webServerVisible"
      class="dialog-overlay"
      @click="confirmWebServerSetting"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_SET_WEB_SERVER') }}
          </h3>
          <button
            class="dialog-close"
            @click="confirmWebServerSetting"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="notice-text">
            {{ t('SETTINGS_TIPS_WEB_SERVER_NOTICE') }}
          </div>
          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="formOfSetting.enableWebServer"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('SETTINGS_SET_ENABLE_WEB_SERVER') }}</div>
                <div class="switch-description">{{ t('SETTINGS_WEB_SERVER_DESC') || 'Enable web interface for remote access' }}</div>
              </div>
            </label>
          </div>
          <template v-if="formOfSetting.enableWebServer">
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_WEB_SERVER_HOST') }}</label>
              <input
                v-model="formOfSetting.webServerHost"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_TIP_PLACEHOLDER_WEB_HOST')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_WEB_SERVER_PORT') }}</label>
              <input
                v-model.number="formOfSetting.webServerPort"
                type="number"
                class="form-input"
                min="1"
                max="65535"
                :placeholder="t('SETTINGS_TIP_PLACEHOLDER_WEB_PORT')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SET_WEB_SERVER_PATH') }}</label>
              <input
                v-model="formOfSetting.webServerPath"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_SET_WEB_SERVER_PATH')"
              >
            </div>
          </template>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="confirmWebServerSetting"
          >
            {{ t('CLOSE') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Configuration Dialog -->
    <div
      v-if="syncVisible"
      class="dialog-overlay"
      @click="cancelSyncSetting"
    >
      <div
        class="dialog large"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_SYNC_CONFIG_TITLE') }}
          </h3>
          <button
            class="dialog-close"
            @click="cancelSyncSetting"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="notice-text">
            {{ t('SETTINGS_SYNC_CONFIG_NOTE') }}
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_SYNC_CONFIG_SELECT_TYPE') }}</label>
            <select
              v-model="sync.type"
              class="form-select"
            >
              <option
                v-for="typeitem of syncType"
                :key="typeitem"
                :value="typeitem"
              >
                {{ typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1) }}
              </option>
            </select>
          </div>
          <div
            v-if="sync.type === 'gitea'"
            class="form-group"
          >
            <label>{{ t('SETTINGS_SYNC_CONFIG_GITEA_HOST') }}</label>
            <input
              v-model.trim="sync.endpoint"
              type="text"
              class="form-input"
              :placeholder="t('SETTINGS_SYNC_CONFIG_GITEA_HOST')"
            >
          </div>
          <div
            v-if="sync.type === 'webdav'"
            class="form-group"
          >
            <label>{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_ENDPOINT') }}</label>
            <input
              v-model.trim="sync.webdavEndpoint"
              type="text"
              class="form-input"
              :placeholder="t('SETTINGS_SYNC_CONFIG_WEBDAV_ENDPOINT_PLACEHOLDER')"
            >
          </div>
          <template v-if="sync.type !== 'webdav'">
            <div
              v-for="inputItem in ['username', 'repo', 'branch', 'token']"
              :key="inputItem"
              class="form-group"
            >
              <label>{{ t(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_${inputItem.toUpperCase()}` as any) }}</label>
              <input
                v-model.trim="sync[inputItem as any]"
                type="text"
                class="form-input"
                :placeholder="t(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_${inputItem.toUpperCase()}_PLACEHOLDER` as any)"
              >
            </div>
          </template>
          <template v-if="sync.type === 'webdav'">
            <div class="form-group">
              <label>{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_USERNAME') }}</label>
              <input
                v-model.trim="sync.webdavUsername"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_SYNC_CONFIG_WEBDAV_USERNAME_PLACEHOLDER')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_PASSWORD') }}</label>
              <input
                v-model.trim="sync.webdavPassword"
                type="password"
                class="form-input"
                :placeholder="t('SETTINGS_SYNC_CONFIG_WEBDAV_PASSWORD_PLACEHOLDER')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_SAVE_PATH') }}</label>
              <input
                v-model.trim="sync.webdavSavePath"
                type="text"
                class="form-input"
                :placeholder="t('SETTINGS_SYNC_CONFIG_WEBDAV_SAVE_PATH_PLACEHOLDER')"
              >
            </div>
            <div class="form-group">
              <label>{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_AUTH_TYPE') }}</label>
              <select
                v-model="sync.webdavAuthType"
                class="form-select"
              >
                <option value="basic">
                  Basic
                </option>
                <option value="digest">
                  Digest
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="sync.webdavSslEnabled"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('SETTINGS_SYNC_CONFIG_WEBDAV_SSL_ENABLED') }}</div>
                  <div class="switch-description">{{ t('SETTINGS_SSL_ENABLED_DESC') || 'Enable SSL/TLS encryption' }}</div>
                </div>
              </label>
            </div>
          </template>
          <div
            v-if="sync.type === 'github'"
            class="form-group"
          >
            <label>{{ t('SETTINGS_SYNC_CONFIG_PROXY') }}</label>
            <input
              v-model.trim="sync.proxy"
              type="text"
              class="form-input"
              :placeholder="t('SETTINGS_SYNC_CONFIG_PROXY_PLACEHOLDER')"
            >
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="cancelSyncSetting"
          >
            {{ t('CANCEL') }}
          </button>
          <button
            class="btn btn-primary"
            @click="confirmSyncSetting"
          >
            {{ t('CONFIRM') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upload/Download Config Dialog -->
    <div
      v-if="upDownConfigVisible"
      class="dialog-overlay"
      @click="upDownConfigVisible = false"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('SETTINGS_UP_DOWN_DESC') }}
          </h3>
          <button
            class="dialog-close"
            @click="upDownConfigVisible = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ t('SETTINGS_SYNC_UPLOAD') }}</label>
            <div class="button-group">
              <button
                v-for="item in syncTaskList.slice(0, 3)"
                :key="item.task"
                class="btn btn-primary"
                @click="syncTaskFn(item.task, item.number)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('SETTINGS_SYNC_DOWNLOAD') }}</label>
            <div class="button-group">
              <button
                v-for="item in syncTaskList.slice(3)"
                :key="item.task"
                class="btn btn-primary"
                @click="syncTaskFn(item.task, item.number)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            @click="upDownConfigVisible = false"
          >
            {{ t('CLOSE') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Process Dialog -->
    <div
      v-if="imageProcessDialogVisible"
      class="dialog-overlay"
      @click="imageProcessDialogVisible = false"
    >
      <div
        class="dialog large"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('pages.imageProcess.title') }}
          </h3>
          <button
            class="dialog-close"
            @click="imageProcessDialogVisible = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-content">
          <ImageProcessSetting v-model="imageProcessDialogVisible" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { compare } from 'compare-versions'
import { ElForm } from 'element-plus'
import {
  BookOpen,
  CloudUpload,
  Download,
  Edit,
  FileText,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Import,
  Keyboard,
  Link,
  Monitor,
  RefreshCw,
  RotateCcw,
  Server,
  Settings
} from 'lucide-vue-next'
import type { IConfig } from 'piclist'
import pkg from 'root/package.json'
import { ISettingForm } from 'root/src/universal/types/view'
import { computed, onBeforeMount, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { setCurrentLanguage } from '@/i18n'
import { SHORTKEY_PAGE } from '@/router/config'
import { enforceNumber } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType, ISartMode } from '@/utils/enum'
import { getLatestVersion } from '@/utils/getLatestVersion'
import { osGlobal, picBedGlobal, updatePicBedGlobal } from '@/utils/global'
import type { ICheckBoxValueType } from '#/types/types'

const { t, locale } = useI18n()
const $router = useRouter()
const { confirm } = useConfirm()
const message = useMessage()
const activeName = ref<'system' | 'sync' | 'upload' | 'advanced' | 'update'>('system')

// Tab configuration
const tabs = computed(() => [
  {
    id: 'system',
    label: t('pages.settings.system.title'),
    icon: Settings
  },
  {
    id: 'sync',
    label: t('pages.settings.sync.title'),
    icon: RotateCcw
  },
  {
    id: 'upload',
    label: t('pages.settings.upload.title'),
    icon: CloudUpload
  },
  {
    id: 'advanced',
    label: t('pages.settings.advanced.title'),
    icon: Server
  },
  {
    id: 'update',
    label: t('pages.settings.update.title'),
    icon: RefreshCw
  }
])

const shortUrlServerList = [
  {
    label: 'c1n',
    value: 'c1n'
  },
  {
    label: 'yourls',
    value: 'yourls'
  },
  {
    label: 'xyTom/Url-Shorten-Worker',
    value: 'cf_worker'
  },
  {
    label: 'ccbikai/Sink',
    value: 'sink'
  }
]

const languageList = [
  {
    label: '简体中文',
    value: 'zh-CN'
  },
  {
    label: '繁體中文',
    value: 'zh-TW'
  },
  {
    label: 'English',
    value: 'en'
  }
]

const showPicBedList = computed(
  () =>
    picBedGlobal.value
      .map(item => {
        if (item.visible) {
          return item.name
        }
        return null
      })
      .filter(item => item) as string[]
)

const $customLink = ref<InstanceType<typeof ElForm> | null>(null)

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
  aesPassword: 'PicList-aesPassword',
  enableWebServer: false,
  webServerHost: '0.0.0.0',
  webServerPort: 37777,
  webServerPath: '',
  registry: '',
  proxy: '',
  mainWindowWidth: 1200,
  mainWindowHeight: 800,
  enableSecondUploader: false
})

const proxy = ref('')
const formKeys = Object.keys(formOfSetting.value) as (keyof ISettingForm)[]
const autoWatchKeys = [
  'showUpdateTip',
  'autoImport',
  'autoImportPicBed',
  'useBuiltinClipboard',
  'isAutoListenClipboard',
  'deleteCloudFile',
  'deleteLocalFile',
  'rename',
  'autoRename',
  'enableWebServer',
  'webServerHost',
  'webServerPort',
  'webServerPath',
  'serverKey',
  'uploadNotification',
  'uploadResultNotification',
  'autoCloseMainWindow',
  'autoCloseMiniWindow',
  'isCustomMiniIcon',
  'c1nToken',
  'yourlsDomain',
  'yourlsSignature',
  'cfWorkerHost',
  'sinkDomain',
  'sinkToken',
  'registry',
  'proxy',
  'autoCopy',
  'encodeOutputURL',
  'useShortUrl',
  'enableSecondUploader'
]

const addWatch = () => {
  autoWatchKeys.forEach(key => {
    watch(
      () => formOfSetting.value[key as keyof ISettingForm],
      value => {
        saveConfig({
          [`settings.${key}`]: value
        })
      }
    )
  })

  watch(currentLanguage, (newVal) => {
    console.log('newVal', newVal)
    if (newVal) {
      handleLanguageChange(newVal)
    }
  })

  watch(currentStartMode, (newVal) => {
    if (newVal && newVal.value) {
      handleStartModeChange(newVal.value)
    }
  })

  watch(currentShortUrlServer, (newVal) => {
    if (newVal && newVal.value) {
      handleShortUrlServerChange(newVal.value)
    }
  })
}

const addProxyWatch = () => {
  watch(proxy, value => {
    saveConfig({
      'picBed.proxy': value
    })
  })
}

const valueToOptionItem = (value: any, list: { label: string; value: any }[]) => {
  return list.find(item => item.value === value) || list[0]
}

const currentLanguage = ref()
const currentStartMode = ref()
const currentShortUrlServer = ref()

const logFileVisible = ref(false)
const customLinkVisible = ref(false)
const checkUpdateVisible = ref(false)
const serverVisible = ref(false)
const webServerVisible = ref(false)
const syncVisible = ref(false)
const upDownConfigVisible = ref(false)
const proxyVisible = ref(false)
const mainWindowSizeVisible = ref(false)
const advancedRenameVisible = ref(false)
const imageProcessDialogVisible = ref(false)

const rawPicGoSize = ref(false)

const customLink = reactive({
  value: '![$fileName]($url)'
})

const logLevel = {
  all: t('SETTINGS_LOG_LEVEL_ALL'),
  success: t('SETTINGS_LOG_LEVEL_SUCCESS'),
  error: t('SETTINGS_LOG_LEVEL_ERROR'),
  info: t('SETTINGS_LOG_LEVEL_INFO'),
  warn: t('SETTINGS_LOG_LEVEL_WARN'),
  none: t('SETTINGS_LOG_LEVEL_NONE')
}

const server = ref({
  port: 36677,
  host: '0.0.0.0',
  enable: true
})

const advancedRename = ref({
  enable: false,
  format: '{filename}'
})

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
  webdavSavePath: ''
})

const syncType = ['github', 'gitee', 'gitea', 'webdav']

async function cancelSyncSetting () {
  syncVisible.value = false
  sync.value = (await getConfig(configPaths.settings.sync)) || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    endpoint: '',
    proxy: '',
    interval: 60,
    // WebDAV-specific fields
    webdavEndpoint: '',
    webdavUsername: '',
    webdavPassword: '',
    webdavAuthType: 'basic',
    webdavSslEnabled: true,
    webdavSavePath: ''
  }
}

function confirmSyncSetting () {
  saveConfig({
    [configPaths.settings.sync]: sync.value
  })
  syncVisible.value = false
}

const version = pkg.version
const latestVersion = ref('')

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  }
  return false
})

onBeforeMount(() => {
  initData()
})

async function initData () {
  const config = (await getConfig<IConfig>()) || ({} as IConfig)
  const settings = config.settings || {}
  const picBed = config.picBed
  formKeys.forEach(key => {
    ;(formOfSetting.value as any)[key] = settings[key] ?? formOfSetting.value[key]
  })
  formOfSetting.value.logLevel = initArray(settings.logLevel || [], ['all'])
  formOfSetting.value.autoImportPicBed = initArray(settings.autoImportPicBed || [], [])
  currentLanguage.value = settings.language || 'zh-CN'
  currentStartMode.value = settings.startMode || ISartMode.QUIET
  if (osGlobal.value === 'darwin' && currentStartMode.value === ISartMode.MINI) {
    currentStartMode.value = ISartMode.QUIET
    saveConfig(configPaths.settings.startMode, ISartMode.QUIET)
  }
  currentShortUrlServer.value = valueToOptionItem(settings.shortUrlServer || 'c1n', shortUrlServerList)
  customLink.value = settings.customLink || '![$fileName]($url)'
  proxy.value = picBed.proxy || ''
  server.value = settings.server || {
    port: 36677,
    host: '0.0.0.0',
    enable: true
  }
  advancedRename.value = config.buildIn?.rename || {
    enable: false,
    format: '{filename}'
  }
  if (advancedRename.value.enable) {
    formOfSetting.value.autoRename = false
    saveConfig({
      [configPaths.settings.autoRename]: false
    })
  }
  sync.value = settings.sync || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    endpoint: '',
    proxy: '',
    interval: 60,
    // WebDAV-specific fields
    webdavEndpoint: '',
    webdavUsername: '',
    webdavPassword: '',
    webdavAuthType: 'basic',
    webdavSslEnabled: true,
    webdavSavePath: ''
  }
  formOfSetting.value.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
  addProxyWatch()
  addWatch()
}

function initArray (arrayT: string | string[], defaultValue: string[]) {
  if (!Array.isArray(arrayT)) {
    if (arrayT && arrayT.length > 0) {
      arrayT = [arrayT]
    } else {
      arrayT = defaultValue
    }
  }
  return arrayT
}

async function handleChangeSecondPicBed () {
  window.electron.sendRPC(IRPCActionType.SHOW_SECOND_UPLOADER_MENU)
}

function openFile (file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

function openDirectory (directory?: string, inStorePath = true) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath)
}

function openLogSetting () {
  logFileVisible.value = true
}

async function cancelCustomLink () {
  customLinkVisible.value = false
  customLink.value = (await getConfig<string>(configPaths.settings.customLink)) || '![$fileName]($url)'
}

function confirmCustomLink () {
  $customLink.value?.validate((valid: boolean) => {
    if (valid) {
      saveConfig(configPaths.settings.customLink, customLink.value)
      customLinkVisible.value = false
    }
  })
}

async function handleCancelAdvancedRename () {
  advancedRenameVisible.value = false
  advancedRename.value = toRaw(
    (await getConfig<any>(configPaths.buildIn.rename)) || {
      enable: false,
      format: '{filename}'
    }
  )
}

function handleSaveAdvancedRename () {
  saveConfig(configPaths.buildIn.rename, toRaw(advancedRename.value))
  if (advancedRename.value.enable) {
    formOfSetting.value.autoRename = false
    saveConfig(configPaths.settings.autoRename, false)
  }
  advancedRenameVisible.value = false
}

function handleMigrateFromPicGo () {
  confirm({
    title: t('SETTINGS_MIGRATE_FROM_PICGO_TITLE'),
    message: t('SETTINGS_MIGRATE_FROM_PICGO_CONTENT'),
    type: 'warning',
    confirmButtonText: t('CONFIRM'),
    cancelButtonText: t('CANCEL'),
    center: true
  })
    .then((result) => {
      if (result) {
        window.electron.triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO)
          .then(() => {
            message.success(t('SETTINGS_MIGRATE_FROM_PICGO_SUCCESS'))
          })
          .catch(() => {
            message.error(t('SETTINGS_MIGRATE_FROM_PICGO_FAILED'))
          })
      }
    })
}

function handleHideDockChange (val: ICheckBoxValueType) {
  if (val && currentStartMode.value === ISartMode.NO_TRAY) {
    message.warning(t('SETTINGS_ISHIDEDOCK_TIPS'))
    formOfSetting.value.isHideDock = false
    return
  }
  saveConfig(configPaths.settings.isHideDock, val)
  window.electron.sendRPC(IRPCActionType.HIDE_DOCK, val)
}

function handleShowPicBedListChange (val: ICheckBoxValueType[]) {
  const list = picBedGlobal.value.map(item => {
    if (!val.includes(item.name)) {
      item.visible = false
    } else {
      item.visible = true
    }
    return item
  })
  saveConfig({
    [configPaths.picBed.list]: list
  })
  updatePicBedGlobal()
}

function handleAutoStartChange (val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.autoStart, val)
  window.electron.sendRPC(IRPCActionType.PICLIST_AUTO_START, val)
}

function compareVersion2Update (current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

async function checkUpdate () {
  checkUpdateVisible.value = true
  latestVersion.value = (await getLatestVersion()) || t('TIPS_NETWORK_ERROR')
}

function confirmCheckVersion () {
  if (needUpdate.value) {
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion () {
  checkUpdateVisible.value = false
}

function confirmWebServerSetting () {
  if (formOfSetting.value.enableWebServer) {
    window.electron.sendRPC(IRPCActionType.ADVANCED_RESTART_WEB_SERVER)
  } else {
    window.electron.sendRPC(IRPCActionType.ADVANCED_STOP_WEB_SERVER)
  }
}

async function getMainWindowSize () {
  formOfSetting.value.mainWindowWidth = (await getConfig<number>(configPaths.settings.mainWindowWidth)) || 1200
  formOfSetting.value.mainWindowHeight = (await getConfig<number>(configPaths.settings.mainWindowHeight)) || 800
}

async function cancelWindowSize () {
  mainWindowSizeVisible.value = false
  await getMainWindowSize()
}

async function confirmWindowSize () {
  mainWindowSizeVisible.value = false
  const width = enforceNumber(formOfSetting.value.mainWindowWidth)
  const height = enforceNumber(formOfSetting.value.mainWindowHeight)
  saveConfig({
    [configPaths.settings.mainWindowWidth]: rawPicGoSize.value ? 800 : width < 100 ? 100 : width,
    [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : height < 100 ? 100 : height
  })
  await getMainWindowSize()
}

function handleMiniWindowOntop (val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.miniWindowOntop, val)
  window.electron.sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val)
}

async function handleMiniIconPath (_: Event) {
  const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
  if (result && result[0]) {
    formOfSetting.value.customMiniIcon = result[0]
    saveConfig(configPaths.settings.customMiniIcon, formOfSetting.value.customMiniIcon)
    window.electron.sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON, formOfSetting.value.customMiniIcon)
  }
}

function handleShortUrlServerChange (val: string) {
  formOfSetting.value.shortUrlServer = val
  saveConfig(configPaths.settings.shortUrlServer, val)
}

function handleAesPasswordChange (val: string) {
  saveConfig(configPaths.settings.aesPassword, val || 'PicList-aesPassword')
}

function confirmLogLevelSetting () {
  if (formOfSetting.value.logLevel.length === 0) {
    message.error(t('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
    return
  }
  saveConfig({
    [configPaths.settings.logLevel]: formOfSetting.value.logLevel,
    [configPaths.settings.logFileSizeLimit]: formOfSetting.value.logFileSizeLimit
  })
  logFileVisible.value = false
}

async function cancelLogLevelSetting () {
  logFileVisible.value = false
  let logLevel = await getConfig<string | string[]>(configPaths.settings.logLevel)
  const logFileSizeLimit = (await getConfig<number>(configPaths.settings.logFileSizeLimit)) || 10
  if (!Array.isArray(logLevel)) {
    if (logLevel && logLevel.length > 0) {
      logLevel = [logLevel]
    } else {
      logLevel = ['all']
    }
  }
  formOfSetting.value.logLevel = logLevel
  formOfSetting.value.logFileSizeLimit = logFileSizeLimit
}

function syncMessage (failed: number, taskType: 'UPLOAD' | 'DOWNLOAD') {
  if (failed) {
    message.error(t(`SETTINGS_SYNC_${taskType}_FAILED`, { failed }))
  } else {
    message.success(t(`SETTINGS_SYNC_${taskType}_SUCCESS`))
  }
}

const syncTaskList = [
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
    label: t('SETTINGS_SYNC_COMMON_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
    label: t('SETTINGS_SYNC_MANAGE_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
    label: t('SETTINGS_SYNC_UPLOAD_ALL'),
    number: 4
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
    label: t('SETTINGS_SYNC_COMMON_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
    label: t('SETTINGS_SYNC_MANAGE_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
    label: t('SETTINGS_SYNC_DOWNLOAD_ALL'),
    number: 4
  }
]

async function syncTaskFn (task: string, number: number) {
  const failed = number - ((await window.electron.triggerRPC<number>(task)) || 0)
  syncMessage(failed, task.includes('UPLOAD') ? 'UPLOAD' : 'DOWNLOAD')
}

function confirmServerSetting () {
  server.value.port = parseInt(server.value.port as unknown as string, 10)
  saveConfig({
    [configPaths.settings.server]: server.value
  })
  serverVisible.value = false
  window.electron.sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER)
}

async function cancelServerSetting () {
  serverVisible.value = false
  server.value = (await getConfig(configPaths.settings.server)) || {
    port: 36677,
    host: '0.0.0.0',
    enable: true
  }
}

function handleLevelDisabled (val: string) {
  const currentLevel = val
  let flagLevel
  const result = formOfSetting.value.logLevel.some((item: string) => {
    if (item === 'all' || item === 'none') {
      flagLevel = item
    }
    return item === 'all' || item === 'none'
  })
  if (result) {
    if (currentLevel !== flagLevel) {
      return true
    }
  } else if (formOfSetting.value.logLevel.length > 0) {
    if (val === 'all' || val === 'none') {
      return true
    }
  }
  return false
}

function handleLanguageChange (val: string) {
  locale.value = val
  setCurrentLanguage(val)
  saveConfig({
    [configPaths.settings.language]: val
  })
  localStorage.setItem('currentLanguage', val)
  // updatePicBedGlobal()
}

function handleStartModeChange (val: string) {
  if (val === ISartMode.NO_TRAY) {
    if (formOfSetting.value.isHideDock) {
      message.warning(t('SETTINGS_ISHIDEDOCK_TIPS'))
      currentStartMode.value = ISartMode.QUIET
      return
    }
    message.info(t('TIPS_NEED_RELOAD'))
  }
  saveConfig({
    [configPaths.settings.startMode]: val
  })
}

async function goConfigPage () {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  const url =
    lang === II18nLanguage.ZH_CN ? 'https://piclist.cn/configure.html' : 'https://piclist.cn/en/configure.html'
  window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
}

function goShortCutPage () {
  $router.push({
    name: SHORTKEY_PAGE
  })
}
</script>
<script lang="ts">
export default {
  name: 'SettingPage'
}
</script>

<style scoped src="./css/PicgoSetting.css"></style>
