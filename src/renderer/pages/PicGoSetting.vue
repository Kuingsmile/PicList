<template>
  <div>
    <div class="piclist-settings">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <Settings :size="24" class="header-icon" />
          <div>
            <h1>{{ t('pages.settings.title') }}</h1>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="goConfigPage">
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
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id as 'system' | 'sync' | 'upload' | 'advanced' | 'update'"
        >
          <component :is="tab.icon" :size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- System Settings Tab -->
        <div v-if="currentTab === 'system'" class="tab-content">
          <!-- Language & Appearance Section -->
          <div class="settings-section system-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper language small-icon">
                <Globe :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.system.languageAndAppearance') }}</h2>
              </div>
            </div>

            <div class="system-option-grid">
              <div class="system-option-card">
                <div class="system-option-header">
                  <Globe :size="18" />
                  <span>{{ t('pages.settings.system.chooseLanguage') }}</span>
                </div>
                <select v-model="currentLanguage" class="form-select">
                  <option v-for="item in languageList" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>

              <div class="system-option-card">
                <div class="system-option-header">
                  <Monitor :size="18" />
                  <span>{{ t('pages.settings.system.startMode') }}</span>
                </div>
                <select v-model="currentStartMode" class="form-select">
                  <option value="quiet">{{ t('pages.settings.system.quietMode') }}</option>
                  <option v-if="osGlobal !== 'darwin'" value="mini">{{ t('pages.settings.system.miniMode') }}</option>
                  <option v-if="osGlobal === 'darwin'" value="no-tray">
                    {{ t('pages.settings.system.noTrayMode') }}
                  </option>
                  <option value="main">{{ t('pages.settings.system.mainMode') }}</option>
                </select>
              </div>
              <!-- Performance & Animation Toggles -->
              <div class="system-toggle-card">
                <label class="switch-label">
                  <input v-model="isDisableGPU" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.isDisableGPU') }}</div>
                    <div class="switch-description">{{ t('pages.settings.system.isDisableGPUDesc') }}</div>
                  </div>
                </label>
              </div>

              <div class="system-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.enableAdvancedAnimation" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.enableAdvancedAnimation') }}</div>
                    <div class="switch-description">{{ t('pages.settings.system.enableAdvancedAnimationDesc') }}</div>
                  </div>
                </label>
              </div>

              <div class="system-option-card">
                <div class="system-option-header">
                  <ImageIcon :size="18" />
                  <span>{{ t('pages.settings.system.chooseTheme') }}</span>
                </div>
                <select v-model="currentTheme" class="form-select">
                  <option v-for="theme in themeList" :key="theme.key" :value="theme.key">
                    {{ theme.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="theme-actions-grid">
              <button
                class="btn btn-secondary theme-action-btn"
                :disabled="downloadingThemes"
                @click="handleDownloadThemes"
              >
                <Download :size="14" />
                <span>{{
                  downloadingThemes
                    ? t('pages.settings.system.downloadingThemes')
                    : t('pages.settings.system.downloadThemes')
                }}</span>
              </button>
              <button class="btn btn-secondary theme-action-btn" @click="handleImportThemes">
                <Import :size="14" />
                <span>{{ t('pages.settings.system.importThemes') }}</span>
              </button>
            </div>
          </div>

          <!-- Window Behavior Section -->
          <div class="settings-section system-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper window small-icon">
                <Monitor :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.system.windowBehavior') }}</h2>
              </div>
            </div>

            <!-- Main Window Size Card -->
            <div class="window-size-card" @click="mainWindowSizeVisible = true">
              <div class="window-size-icon">
                <Monitor :size="15" />
              </div>
              <div class="window-size-info">
                <h4>{{ t('pages.settings.system.mainWindowSize') }}</h4>
              </div>
              <div class="window-size-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>

            <!-- Window Behavior Toggles -->
            <div class="system-toggles-grid">
              <div v-if="osGlobal === 'darwin'" class="system-toggle-card">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.isHideDock"
                    type="checkbox"
                    class="switch-input"
                    @change="handleHideDockChange(formOfSetting.isHideDock)"
                  />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.isHideDock') }}</div>
                  </div>
                </label>
              </div>

              <div v-if="osGlobal !== 'darwin'" class="system-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.autoCloseMiniWindow" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.autoCloseMiniWindow') }}</div>
                  </div>
                </label>
              </div>

              <div v-if="osGlobal !== 'darwin'" class="system-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.autoCloseMainWindow" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.autoCloseMainWindow') }}</div>
                  </div>
                </label>
              </div>

              <div v-if="osGlobal !== 'darwin'" class="system-toggle-card">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.miniWindowOntop"
                    type="checkbox"
                    class="switch-input"
                    @change="handleMiniWindowOntop(formOfSetting.miniWindowOntop)"
                  />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.miniWindowOnTop') }}</div>
                  </div>
                </label>
              </div>

              <div v-if="osGlobal !== 'darwin'" class="system-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.isCustomMiniIcon" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.isCustomMiniIcon') }}</div>
                  </div>
                </label>
              </div>

              <div
                v-if="osGlobal !== 'darwin' && formOfSetting.isCustomMiniIcon"
                class="system-toggle-card with-action"
              >
                <div class="toggle-with-action-content">
                  <ImageIcon :size="18" />
                  <span>{{ t('pages.settings.system.customMiniIconPath') }}</span>
                </div>
                <button class="btn btn-secondary btn-sm" @click="handleMiniIconPath">
                  {{ t('pages.settings.clickToSet') }}
                </button>
              </div>
            </div>
          </div>
          <!-- Startup & Shortcuts Section -->
          <div class="settings-section system-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper startup small-icon">
                <Keyboard :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.system.startupAndShortcuts') }}</h2>
              </div>
            </div>

            <div class="startup-options-grid">
              <!-- Auto Launch Toggle -->
              <div class="startup-toggle-card">
                <label class="switch-label">
                  <input
                    v-model="formOfSetting.autoStart"
                    type="checkbox"
                    class="switch-input"
                    @change="handleAutoStartChange(formOfSetting.autoStart)"
                  />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.system.autoLaunch') }}</div>
                    <div class="switch-description">{{ t('pages.settings.system.autoLaunchDesc') }}</div>
                  </div>
                </label>
              </div>

              <!-- Shortcuts Action Card -->
              <div class="shortcut-action-card" @click="goShortCutPage">
                <div class="shortcut-action-icon">
                  <Keyboard :size="22" />
                </div>
                <div class="shortcut-action-info">
                  <h4>{{ t('pages.settings.system.setShortCuts') }}</h4>
                  <p>{{ t('pages.settings.system.setShortCutsDesc') }}</p>
                </div>
                <div class="shortcut-action-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sync & Configure Tab -->
        <div v-if="currentTab === 'sync'" class="tab-content">
          <!-- Sync Status Overview -->
          <div class="sync-overview-card">
            <div class="sync-overview-header">
              <div class="sync-overview-icon">
                <RotateCcw :size="28" />
              </div>
              <div class="sync-overview-info">
                <h2>{{ t('pages.settings.sync.syncConfiguration') }}</h2>
                <p class="sync-status-text">
                  <span class="sync-type-badge">{{ sync.type?.toUpperCase() || 'N/A' }}</span>
                  <span v-if="sync.type !== 'webdav' && sync.username"
                    >{{ sync.username }}/{{ sync.repo || '...' }}</span
                  >
                  <span v-else-if="sync.type === 'webdav' && sync.webdavEndpoint">{{ sync.webdavEndpoint }}</span>
                  <span v-else class="sync-not-configured">{{ t('pages.settings.sync.notConfigured') }}</span>
                </p>
              </div>
            </div>
            <button class="btn btn-primary sync-config-btn" @click="syncVisible = true">
              <Settings :size="16" />
              {{ t('pages.settings.sync.configureSync') }}
            </button>
          </div>

          <!-- Sync Actions Section -->
          <div class="settings-section sync-actions-section">
            <div class="section-header-with-icon">
              <CloudUpload :size="30" class="section-icon" />
              <div>
                <h2>{{ t('pages.settings.sync.syncActions') }}</h2>
              </div>
            </div>

            <div class="sync-action-cards">
              <div class="sync-action-card" @click="upDownConfigVisible = true">
                <div class="sync-action-icon upload">
                  <CloudUpload :size="24" />
                </div>
                <div class="sync-action-content">
                  <h4>{{ t('pages.settings.sync.upDownloadSettings') }}</h4>
                  <p>{{ t('pages.settings.sync.upDownloadDesc') }}</p>
                </div>
                <div class="sync-action-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              <div class="sync-action-card" @click="handleMigrateFromPicGo">
                <div class="sync-action-icon migrate">
                  <Import :size="24" />
                </div>
                <div class="sync-action-content">
                  <h4>{{ t('pages.settings.sync.migrateFromPicGo') }}</h4>
                  <p>{{ t('pages.settings.sync.migrateDesc') }}</p>
                </div>
                <div class="sync-action-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
              <div v-if="isPortable" class="sync-action-card" @click="handleMigrateFromPicListInstallation">
                <div class="sync-action-icon migrate">
                  <Import :size="24" />
                </div>
                <div class="sync-action-content">
                  <h4>{{ t('pages.settings.sync.migrateFromPicListInstallation') }}</h4>
                  <p>{{ t('pages.settings.sync.migrateDescPicList') }}</p>
                </div>
                <div class="sync-action-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- File Management Section -->
          <div class="settings-section file-management-section">
            <div class="section-header-with-icon">
              <FolderOpen :size="30" class="section-icon" />
              <div>
                <h2>{{ t('pages.settings.sync.fileManagement') }}</h2>
              </div>
            </div>

            <div class="file-action-grid">
              <button class="file-action-btn" @click="openFile('data.json')">
                <FileText :size="20" />
                <span>{{ t('pages.settings.sync.openConfigFile') }}</span>
              </button>

              <button class="file-action-btn" @click="openDirectory()">
                <FolderOpen :size="20" />
                <span>{{ t('pages.settings.sync.openConfigFileDir') }}</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Upload Settings Tab -->
        <div v-if="currentTab === 'upload'" class="tab-content">
          <!-- Upload Behavior Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper upload small-icon">
                <CloudUpload :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.uploadBehavior') }}</h2>
              </div>
            </div>

            <div class="upload-behavior-grid">
              <!-- Auto Import Card -->
              <div class="upload-feature-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.autoImport" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.autoImportInManage') }}</div>
                    <div class="switch-description">{{ t('pages.settings.upload.autoImportInManageHint') }}</div>
                  </div>
                </label>
              </div>

              <!-- Auto Import PicBed Selection -->
              <div v-if="formOfSetting.autoImport" class="upload-feature-card picbed-selection">
                <div class="picbed-selection-header">
                  <span>{{ t('pages.settings.upload.autoImportPicBed') }}</span>
                </div>
                <div class="checkbox-group compact">
                  <label v-for="item in picBedG" :key="item.type" class="checkbox-option">
                    <input
                      v-model="formOfSetting.autoImportPicBed"
                      type="checkbox"
                      :value="item.type"
                      class="checkbox-input"
                    />
                    <span class="checkbox-indicator" />
                    <span class="checkbox-label">{{ item.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Second PicBed Card -->
              <div class="upload-feature-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.enableSecondUploader" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.enableSecondPicBed') }}</div>
                    <div class="switch-description">{{ t('pages.settings.upload.enableSecondPicBedHint') }}</div>
                  </div>
                </label>
              </div>

              <!-- Set Second PicBed Action -->
              <div class="upload-action-card" @click="handleChangeSecondPicBed">
                <div class="upload-action-icon">
                  <CloudUpload :size="20" />
                </div>
                <div class="upload-action-info">
                  <h4>{{ t('pages.settings.upload.setSecondPicBed') }}</h4>
                  <p>{{ t('pages.settings.upload.setSecondPicBedDesc') }}</p>
                </div>
                <div class="upload-action-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>

              <div class="system-option-card">
                <div class="system-option-header">
                  <Settings2Icon :size="18" />
                  <span>{{ t('pages.settings.upload.chooseSecondPicBedMode') }}</span>
                </div>
                <select v-model="currentSecondMode" class="form-select">
                  <option v-for="item in secondModeList" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Upload Processing Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper processing small-icon">
                <ImageIcon :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.uploadProcessing') }}</h2>
              </div>
            </div>

            <!-- Processing Action Cards -->
            <div class="processing-actions-grid">
              <div class="processing-action-card" @click="advancedRenameVisible = true">
                <div class="processing-action-icon">
                  <Edit :size="15" />
                </div>
                <div class="processing-action-info">
                  <h4>{{ t('pages.settings.upload.advancedRname') }}</h4>
                  <p>{{ t('pages.settings.upload.advancedRnameDesc') }}</p>
                </div>
              </div>

              <div class="processing-action-card" @click="imageProcessDialogVisible = true">
                <div class="processing-action-icon">
                  <ImageIcon :size="20" />
                </div>
                <div class="processing-action-info">
                  <h4>{{ t('pages.settings.upload.imageProcessing') }}</h4>
                  <p>{{ t('pages.settings.upload.imageProcessingDesc') }}</p>
                </div>
              </div>
            </div>

            <!-- Processing Toggles -->
            <div class="upload-toggles-grid">
              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.deleteCloudFile" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.deleteCloud') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.rename" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.manualRname') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.autoRename" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.timestampRname') }}</div>
                    <div class="switch-description">YYYYMMDDHHmmssSSS</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.deleteLocalFile" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.deleteLocalFileAfterUpload') }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Clipboard & Notification Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper clipboard small-icon">
                <Edit :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.clipboardAndNotification') }}</h2>
              </div>
            </div>

            <div class="upload-toggles-grid">
              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.uploadNotification" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.enableUploadNotification') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.uploadResultNotification" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.enableUploadResultNotification') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.autoCopy" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.autoCopyUrlAfterUpload') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.useBuiltinClipboard" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.useBuiltInClipboardUpload') }}</div>
                    <div class="switch-description">{{ t('pages.settings.upload.useBuiltInClipboardUploadHint') }}</div>
                  </div>
                </label>
              </div>

              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.isAutoListenClipboard" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.isAutoListenClipboard') }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- URL Format & Link Type Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper link small-icon">
                <Link :size="20" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.urlFormatAndLinkType') }}</h2>
              </div>
            </div>

            <!-- Custom Link Format Action -->
            <div class="url-format-action-card" @click="customLinkVisible = true">
              <div class="url-format-icon">
                <Link :size="15" />
              </div>
              <div class="url-format-info">
                <h4>{{ t('pages.settings.upload.customLinkFormat') }}</h4>
                <p>{{ t('pages.settings.upload.customLinkFormatDesc') }}</p>
              </div>
              <div class="url-format-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>

            <!-- Short URL Toggle -->
            <div class="short-url-section">
              <div class="upload-toggle-card">
                <label class="switch-label">
                  <input v-model="formOfSetting.useShortUrl" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.upload.enableShortUrl') }}</div>
                    <div class="switch-description">{{ t('pages.settings.upload.enableShortUrlDesc') }}</div>
                  </div>
                </label>
              </div>

              <!-- Short URL Configuration -->
              <div v-if="formOfSetting.useShortUrl" class="short-url-config">
                <div class="short-url-field">
                  <label>{{ t('pages.settings.upload.shortUrlServer') }}</label>
                  <select
                    v-model="currentShortUrlServer"
                    class="form-select"
                    @change="handleShortUrlServerChange(currentShortUrlServer)"
                  >
                    <option v-for="item in shortUrlServerList" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'c1n'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.c1nToken') }}</label>
                  <input
                    v-model="formOfSetting.c1nToken"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.c1nToken')"
                  />
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'yourls'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.yourlsDomain') }}</label>
                  <input
                    v-model="formOfSetting.yourlsDomain"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.yourlsDomain')"
                  />
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'yourls'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.yourlsSignature') }}</label>
                  <input
                    v-model="formOfSetting.yourlsSignature"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.yourlsSignature')"
                  />
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'cf_worker'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.cfWorkerHost') }}</label>
                  <input
                    v-model="formOfSetting.cfWorkerHost"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.cfWorkerHost')"
                  />
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'sink'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.sinkDomain') }}</label>
                  <input
                    v-model="formOfSetting.sinkDomain"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.sinkDomain')"
                  />
                </div>

                <div v-if="formOfSetting.shortUrlServer === 'sink'" class="short-url-field">
                  <label>{{ t('pages.settings.upload.sinkToken') }}</label>
                  <input
                    v-model="formOfSetting.sinkToken"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.upload.sinkToken')"
                  />
                </div>
              </div>
            </div>

            <!-- Encode Output URL Toggle -->
            <div class="upload-toggle-card standalone">
              <label class="switch-label">
                <input v-model="formOfSetting.encodeOutputURL" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.upload.encodeOutputUrl') }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- PicBed Display Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper picbed small-icon">
                <Server :size="15" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.chooseShowedPicBed') }}</h2>
              </div>
            </div>

            <div class="picbed-checkbox-grid">
              <label v-for="item in picBedG" :key="item.name" class="picbed-checkbox-card">
                <input v-model="showPicBedList" type="checkbox" :value="item.name" class="checkbox-input" />
                <span class="checkbox-indicator" />
                <span class="checkbox-label">{{ item.name }}</span>
              </label>
            </div>
          </div>

          <!-- Gallery Filter Section -->
          <div class="settings-section upload-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper gallery small-icon">
                <ImageIcon :size="15" />
              </div>
              <div>
                <h2>{{ t('pages.settings.upload.galleryPicBedFilter') }}</h2>
              </div>
            </div>

            <div class="picbed-checkbox-grid">
              <label v-for="item in picBedG" :key="`gallery-${item.name}`" class="picbed-checkbox-card">
                <input v-model="galleryPicBedFilterList" type="checkbox" :value="item.type" class="checkbox-input" />
                <span class="checkbox-indicator" />
                <span class="checkbox-label">{{ item.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Advanced Settings Tab -->
        <div v-if="currentTab === 'advanced'" class="tab-content">
          <!-- Logging Section -->
          <div class="settings-section advanced-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper log small-icon">
                <FileText :size="15" />
              </div>
              <div>
                <h2>{{ t('pages.settings.advanced.logging') }}</h2>
              </div>
            </div>

            <div class="advanced-action-grid">
              <div class="advanced-action-card" @click="openDirectory()">
                <div class="advanced-action-icon">
                  <FolderOpen :size="22" />
                </div>
                <div class="advanced-action-info">
                  <h4>{{ t('pages.settings.advanced.logFilePath') }}</h4>
                  <p>{{ t('pages.settings.advanced.logFilePathDesc') }}</p>
                </div>
              </div>

              <div class="advanced-action-card" @click="openLogSetting">
                <div class="advanced-action-icon">
                  <Settings :size="22" />
                </div>
                <div class="advanced-action-info">
                  <h4>{{ t('pages.settings.advanced.setLog') }}</h4>
                  <p>{{ t('pages.settings.advanced.setLogDesc') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Network & Proxy Section -->
          <div class="settings-section advanced-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper network small-icon">
                <Globe :size="15" />
              </div>
              <div>
                <h2>{{ t('pages.settings.advanced.networkAndProxy') }}</h2>
              </div>
            </div>

            <div class="advanced-action-card standalone" @click="proxyVisible = true">
              <div class="advanced-action-icon">
                <Globe :size="22" />
              </div>
              <div class="advanced-action-info">
                <h4>{{ t('pages.settings.advanced.setProxyAndMirror') }}</h4>
                <p>{{ t('pages.settings.advanced.setProxyAndMirrorDesc') }}</p>
              </div>
              <div class="advanced-action-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Server Settings Section -->
          <div class="settings-section advanced-section">
            <div class="section-header-with-icon">
              <div class="section-icon-wrapper server small-icon">
                <Server :size="15" />
              </div>
              <div>
                <h2>{{ t('pages.settings.advanced.serverSettings') }}</h2>
              </div>
            </div>

            <div class="server-config-grid">
              <div class="server-config-card" @click="webServerVisible = true">
                <div class="server-config-header">
                  <div class="server-config-icon web">
                    <Globe :size="20" />
                  </div>
                  <span class="server-config-badge">Web</span>
                </div>
                <h4>{{ t('pages.settings.advanced.webServerSettings') }}</h4>
                <p>{{ t('pages.settings.advanced.webServerSettingsDesc') }}</p>
              </div>

              <div class="server-config-card" @click="serverVisible = true">
                <div class="server-config-header">
                  <div class="server-config-icon api">
                    <Server :size="20" />
                  </div>
                  <span class="server-config-badge">API</span>
                </div>
                <h4>{{ t('pages.settings.advanced.uploadServer') }}</h4>
                <p>{{ t('pages.settings.advanced.uploadServerDesc') }}</p>
              </div>
            </div>

            <div class="encryption-key-section">
              <div class="encryption-key-header">
                <div class="encryption-key-icon">
                  <Keyboard :size="18" />
                </div>
                <div>
                  <label>{{ t('pages.settings.advanced.serverEncryptionKey') }}</label>
                  <small>{{ t('pages.settings.advanced.serverEncryptionKeyDesc') }}</small>
                </div>
              </div>
              <div class="input-with-icon">
                <input
                  v-model.trim="formOfSetting.aesPassword"
                  type="text"
                  class="form-input"
                  :placeholder="t('pages.settings.advanced.serverEncryptionKey')"
                  @change="handleAesPasswordChange(formOfSetting.aesPassword)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Update Settings Tab -->
        <div v-if="currentTab === 'update'" class="tab-content">
          <!-- Version Status Card -->
          <div class="update-status-card">
            <div class="update-status-icon">
              <RefreshCw :size="16" />
            </div>
            <div class="update-status-info">
              <h2>PicList</h2>
              <div class="version-info">
                <span class="version-badge">v{{ version }}</span>
                <span class="version-label">{{ t('pages.settings.update.currentVersion') }}</span>
              </div>
            </div>
            <button class="btn btn-primary update-check-btn" @click="checkUpdate">
              <RefreshCw :size="16" />
              {{ t('pages.settings.update.clickToCheck') }}
            </button>
          </div>

          <!-- Update Preferences -->
          <div class="settings-section update-preferences-section">
            <div class="update-preference-card">
              <label class="switch-label">
                <input v-model="formOfSetting.showUpdateTip" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <div class="switch-title">{{ t('pages.settings.update.openUpdateHelper') }}</div>
                  <div class="switch-description">
                    {{ t('pages.settings.update.openUpdateHelperDesc') }}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Release Notes Section -->
          <div class="settings-section release-notes-section">
            <div class="release-notes-card enhanced">
              <div class="release-notes-header">
                <div class="release-notes-title">
                  <BookOpen :size="18" />
                  <h3>{{ t('pages.settings.update.latestReleaseNotes') }}</h3>
                </div>
                <div class="release-notes-actions">
                  <button
                    class="btn btn-secondary btn-sm refresh-btn"
                    :disabled="fetchingReleaseNotes"
                    @click="fetchReleaseNotesManually"
                  >
                    <RefreshCw :size="14" :class="{ rotate: fetchingReleaseNotes }" />
                    {{ t('pages.settings.update.refresh') }}
                  </button>
                </div>
              </div>

              <div class="release-notes-content">
                <div v-if="fetchingReleaseNotes" class="release-notes-loading">
                  <div class="loading-spinner">
                    <RefreshCw :size="24" class="rotate" />
                  </div>
                  <span>{{ t('pages.settings.update.loadingReleaseNotes') }}</span>
                </div>
                <div v-else-if="releaseNotes" class="notes-body" v-html="renderedReleaseNotes"></div>
                <div v-else-if="releaseNotesError" class="release-notes-error">
                  <div class="error-icon">⚠️</div>
                  <span>{{ releaseNotesError }}</span>
                  <button class="btn btn-link btn-sm" @click="fetchReleaseNotesManually">
                    {{ t('pages.settings.update.retry') }}
                  </button>
                </div>
                <div v-else class="release-notes-empty">
                  <div class="empty-icon">📋</div>
                  <span>{{ t('pages.settings.update.noReleaseNotes') }}</span>
                </div>
              </div>

              <div v-if="releaseNotesLastFetch" class="release-notes-footer">
                <small>
                  <RefreshCw :size="12" />
                  {{ t('pages.settings.update.lastUpdated') }}: {{ formatLastFetchTime(releaseNotesLastFetch) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <!-- Custom Link Format Dialog -->
    <div v-if="customLinkVisible" class="dialog-overlay" :class="advancedAnimation" @click="customLinkVisible = false">
      <div class="dialog enhanced-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper link">
              <Link :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.upload.customLinkFormat') }}</h3>
            </div>
          </div>
          <button class="dialog-close" @click="customLinkVisible = false">×</button>
        </div>
        <div class="dialog-content">
          <div class="placeholder-info-card">
            <div class="placeholder-info-title">
              <FileText :size="16" />
              <span>{{ t('pages.settings.upload.availablePlaceholdersTitle') }}</span>
            </div>
            <div class="placeholder-info-list">
              <div class="placeholder-info-item">
                <code>$url</code>
                <span>{{ t('pages.settings.upload.urlPlaceholder') }}</span>
              </div>
              <div class="placeholder-info-item">
                <code>$fileName</code>
                <span>{{ t('pages.settings.upload.fileNamePlaceholder') }}</span>
              </div>
              <div class="placeholder-info-item">
                <code>$extName</code>
                <span>{{ t('pages.settings.upload.extNamePlaceholder') }}</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('pages.settings.upload.customLinkFormatInput') }}</label>
            <input v-model="customLink.value" type="text" class="form-input" :placeholder="'![$fileName]($url)'" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelCustomLink">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmCustomLink">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Proxy Settings Dialog -->
    <div v-if="proxyVisible" class="dialog-overlay" :class="advancedAnimation" @click="proxyVisible = false">
      <div class="dialog enhanced-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper network">
              <Globe :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.advanced.setProxyAndMirror') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.advanced.proxyDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="proxyVisible = false">×</button>
        </div>
        <div class="dialog-content">
          <div class="proxy-config-grid">
            <div class="proxy-config-card">
              <div class="proxy-config-icon">
                <CloudUpload :size="18" />
              </div>
              <div class="proxy-config-field">
                <label>{{ t('pages.settings.advanced.uploadProxy') }}</label>
                <input v-model="proxy" type="text" class="form-input" placeholder="http://127.0.0.1:1080" />
              </div>
            </div>
            <div class="proxy-config-card">
              <div class="proxy-config-icon">
                <Settings :size="18" />
              </div>
              <div class="proxy-config-field">
                <label>{{ t('pages.settings.advanced.pluginInstallProxy') }}</label>
                <input
                  v-model="formOfSetting.proxy"
                  type="text"
                  class="form-input"
                  placeholder="http://127.0.0.1:1080"
                />
              </div>
            </div>
            <div class="proxy-config-card full-width">
              <div class="proxy-config-icon">
                <Globe :size="18" />
              </div>
              <div class="proxy-config-field">
                <label>{{ t('pages.settings.advanced.pluginInstallMirror') }}</label>
                <input
                  v-model="formOfSetting.registry"
                  type="text"
                  class="form-input"
                  placeholder="https://registry.npmmirror.com"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="proxyVisible = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="proxyVisible = false">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Window Size Dialog -->
    <div v-if="mainWindowSizeVisible" class="dialog-overlay" :class="advancedAnimation">
      <div class="dialog enhanced-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper window">
              <Monitor :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.system.setMainWindowSize') }}</h3>
            </div>
          </div>
          <button class="dialog-close" @click="cancelWindowSize">X</button>
        </div>
        <div class="dialog-content">
          <div class="window-size-grid">
            <div class="window-size-field">
              <label>
                <Monitor :size="14" />
                {{ t('pages.settings.system.mainWindowWidth') }}
              </label>
              <input v-model="formOfSetting.mainWindowWidth" type="number" class="form-input" placeholder="1200" />
            </div>
            <div class="window-size-field">
              <label>
                <Monitor :size="14" />
                {{ t('pages.settings.system.mainWindowHeight') }}
              </label>
              <input v-model="formOfSetting.mainWindowHeight" type="number" class="form-input" placeholder="800" />
            </div>
          </div>
          <div class="form-group">
            <label class="switch-label">
              <input v-model="rawPicGoSize" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('pages.settings.system.rawPicGoSize') }}</div>
                <div class="switch-description">
                  {{ t('pages.settings.system.rawPicGoSizeHint') }}
                </div>
              </div>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelWindowSize">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmWindowSize">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Check Update Dialog -->
    <div v-if="checkUpdateVisible" class="dialog-overlay" :class="advancedAnimation" @click="cancelCheckVersion">
      <div class="dialog enhanced-dialog update-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper update">
              <RefreshCw :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.update.checkUpdate') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.update.checkUpdateDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="cancelCheckVersion">×</button>
        </div>
        <div class="dialog-content">
          <div class="update-version-comparison">
            <div class="version-card current">
              <div class="version-card-label">{{ t('pages.settings.update.currentVersionLabel') }}</div>
              <div class="version-card-value">v{{ version }}</div>
            </div>
            <div class="version-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div class="version-card latest" :class="{ 'has-update': needUpdate }">
              <div class="version-card-label">{{ t('pages.settings.update.newestVersion') }}</div>
              <div class="version-card-value">
                {{ latestVersion ? `${latestVersion}` : t('pages.settings.update.getting') }}
              </div>
            </div>
          </div>
          <div v-if="needUpdate" class="update-notice-card">
            <RefreshCw :size="18" />
            <span>{{ t('pages.settings.update.hasNewVersion') }}</span>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelCheckVersion">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmCheckVersion">
            {{ needUpdate ? t('pages.settings.update.updateNow') : t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Advanced Rename Dialog -->
    <div
      v-if="advancedRenameVisible"
      class="dialog-overlay"
      :class="advancedAnimation"
      @click="handleCancelAdvancedRename"
    >
      <div class="dialog enhanced-dialog rename-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper rename">
              <Edit :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.upload.advancedRname') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.upload.advancedRnameDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="handleCancelAdvancedRename">×</button>
        </div>
        <div class="dialog-content">
          <div class="rename-toggle-card">
            <label class="switch-label">
              <input v-model="advancedRename.enable" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('pages.settings.upload.enableAdvancedRname') }}</div>
                <div class="switch-description">{{ t('pages.settings.upload.enableAdvancedRnameDesc') }}</div>
              </div>
            </label>
          </div>
          <div class="form-group rename-format-field">
            <label>
              <Edit :size="14" />
              {{ t('pages.settings.upload.advancedRnameFormat') }}
            </label>
            <input v-model="advancedRename.format" type="text" class="form-input" placeholder="Ex. {Y}-{m}-{uuid}" />
            <div class="dialog-footer">
              <button class="btn btn-secondary" @click="handleCancelAdvancedRename">
                {{ t('common.cancel') }}
              </button>
              <button class="btn btn-primary" @click="handleSaveAdvancedRename">
                {{ t('common.confirm') }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
            <div class="placeholder-help">
              <div class="placeholder-category">
                <div class="category-title">
                  {{ t('pages.settings.upload.placeholder.categoryTime') }}
                </div>
                <div class="placeholder-grid">
                  <div
                    v-for="item in advancedRenameList.categoryTime"
                    :key="item.value"
                    class="placeholder-item"
                    @click="copyPlaceholder(item.value)"
                  >
                    <code>{{ item.value }}</code>
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </div>

              <div class="placeholder-category">
                <div class="category-title">
                  {{ t('pages.settings.upload.placeholder.categoryHash') }}
                </div>
                <div class="placeholder-grid">
                  <div
                    v-for="item in advancedRenameList.categoryHash"
                    :key="item.value"
                    class="placeholder-item"
                    @click="copyPlaceholder(item.value)"
                  >
                    <code>{{ item.value }}</code>
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </div>

              <div class="placeholder-category">
                <div class="category-title">
                  {{ t('pages.settings.upload.placeholder.categoryFile') }}
                </div>
                <div class="placeholder-grid">
                  <div
                    v-for="item in advancedRenameList.categoryFile"
                    :key="item.value"
                    class="placeholder-item"
                    @click="copyPlaceholder(item.value)"
                  >
                    <code>{{ item.value }}</code>
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Settings Dialog -->
    <div v-if="logFileVisible" class="dialog-overlay" :class="advancedAnimation" @click="cancelLogLevelSetting">
      <div class="dialog enhanced-dialog log-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper log">
              <FileText :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.advanced.setLog') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.advanced.logDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="cancelLogLevelSetting">×</button>
        </div>
        <div class="dialog-content">
          <div class="log-files-section">
            <div class="log-files-title">
              <FolderOpen :size="16" />
              <span>{{ t('pages.settings.advanced.logFilesTitle') }}</span>
            </div>
            <div class="log-files-grid">
              <div class="log-file-card" @click="openFile('piclist.log')">
                <div class="log-file-icon">
                  <FileText :size="18" />
                </div>
                <div class="log-file-info">
                  <span class="log-file-name">{{ t('pages.settings.advanced.logFile') }}</span>
                  <span class="log-file-hint">piclist.log</span>
                </div>
              </div>
              <div class="log-file-card" @click="openFile('piclist-gui-local.log')">
                <div class="log-file-icon">
                  <FileText :size="18" />
                </div>
                <div class="log-file-info">
                  <span class="log-file-name">{{ t('pages.settings.advanced.guiLogFile') }}</span>
                  <span class="log-file-hint">piclist-gui-local.log</span>
                </div>
              </div>
              <div class="log-file-card" @click="openFile('manage.log')">
                <div class="log-file-icon">
                  <FileText :size="18" />
                </div>
                <div class="log-file-info">
                  <span class="log-file-name">{{ t('pages.settings.advanced.manageLogFile') }}</span>
                  <span class="log-file-hint">manage.log</span>
                </div>
              </div>
            </div>
          </div>
          <div class="log-settings-grid">
            <div class="form-group">
              <label>
                <Settings :size="14" />
                {{ t('pages.settings.advanced.logLevel') }}
              </label>
              <select v-model="formOfSetting.logLevel" multiple class="form-select">
                <option v-for="(value, key) of logLevel" :key="key" :value="key">
                  {{ value }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <FileText :size="14" />
                {{ t('pages.settings.advanced.logFileSize') }} (MB)
              </label>
              <input
                v-model="formOfSetting.logFileSizeLimit"
                type="number"
                class="form-input"
                placeholder="10"
                min="1"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelLogLevelSetting">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmLogLevelSetting">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Server Settings Dialog -->
    <div v-if="serverVisible" class="dialog-overlay" :class="advancedAnimation" @click="cancelServerSetting">
      <div class="dialog enhanced-dialog server-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper server">
              <Server :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.advanced.uploadServer') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.advanced.serverDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="cancelServerSetting">×</button>
        </div>
        <div class="dialog-content">
          <div class="server-notice-card">
            <span>{{ t('pages.settings.advanced.serverSettingsNotice') }}</span>
          </div>
          <div class="server-toggle-card">
            <label class="switch-label">
              <input v-model="server.enable" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('pages.settings.advanced.enableServer') }}</div>
              </div>
            </label>
          </div>
          <div v-if="server.enable" class="server-config-section">
            <div class="server-config-title">
              <Settings :size="16" />
              <span>{{ t('pages.settings.advanced.serverConfig') }}</span>
            </div>
            <div class="server-fields-grid">
              <div class="form-group">
                <label>
                  <Globe :size="14" />
                  {{ t('pages.settings.advanced.serverHost') }}
                </label>
                <input v-model="server.host" type="text" class="form-input" placeholder="127.0.0.1" />
              </div>
              <div class="form-group">
                <label>
                  <Server :size="14" />
                  {{ t('pages.settings.advanced.serverPort') }}
                </label>
                <input v-model="server.port" type="number" class="form-input" placeholder="36677" />
              </div>
            </div>
            <div class="form-group server-key-field">
              <label>
                <Keyboard :size="14" />
                {{ t('pages.settings.advanced.serverKey') }}
              </label>
              <div class="input-with-icon">
                <input
                  v-model="formOfSetting.serverKey"
                  type="text"
                  class="form-input"
                  :placeholder="t('pages.settings.advanced.serverKeyPlaceholder')"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelServerSetting">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmServerSetting">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Web Server Settings Dialog -->
    <div v-if="webServerVisible" class="dialog-overlay" :class="advancedAnimation" @click="confirmWebServerSetting">
      <div class="dialog enhanced-dialog webserver-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="dialog-icon-wrapper webserver">
              <Globe :size="20" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.advanced.webServerSettings') }}</h3>
              <p class="dialog-subtitle">{{ t('pages.settings.advanced.webServerDialogDesc') }}</p>
            </div>
          </div>
          <button class="dialog-close" @click="confirmWebServerSetting">×</button>
        </div>
        <div class="dialog-content">
          <div class="server-notice-card">
            <span>{{ t('pages.settings.advanced.webServerNotice') }}</span>
          </div>
          <div class="server-toggle-card">
            <label class="switch-label">
              <input v-model="formOfSetting.enableWebServer" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <div class="switch-title">{{ t('pages.settings.advanced.enableWebServer') }}</div>
              </div>
            </label>
          </div>
          <div v-if="formOfSetting.enableWebServer" class="server-config-section">
            <div class="server-config-title">
              <Settings :size="16" />
              <span>{{ t('pages.settings.advanced.webServerConfig') }}</span>
            </div>
            <div class="server-fields-grid">
              <div class="form-group">
                <label>
                  <Globe :size="14" />
                  {{ t('pages.settings.advanced.webServerHost') }}
                </label>
                <input
                  v-model="formOfSetting.webServerHost"
                  type="text"
                  class="form-input"
                  :placeholder="t('pages.settings.advanced.webServerPlaceholderHost')"
                />
              </div>
              <div class="form-group">
                <label>
                  <Server :size="14" />
                  {{ t('pages.settings.advanced.webServerPort') }}
                </label>
                <input
                  v-model.number="formOfSetting.webServerPort"
                  type="number"
                  class="form-input"
                  min="1"
                  max="65535"
                  :placeholder="t('pages.settings.advanced.webServerPlaceholderPort')"
                />
              </div>
            </div>
            <div class="form-group server-path-field">
              <label>
                <FolderOpen :size="14" />
                {{ t('pages.settings.advanced.webServerPath') }}
              </label>
              <input
                v-model="formOfSetting.webServerPath"
                type="text"
                class="form-input"
                :placeholder="t('pages.settings.advanced.webServerPathPlaceholder')"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-primary" @click="confirmWebServerSetting">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Configuration Dialog -->
    <div v-if="syncVisible" class="dialog-overlay" :class="advancedAnimation">
      <div class="dialog sync-config-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <div class="sync-dialog-icon">
              <RotateCcw :size="24" />
            </div>
            <div>
              <h3 class="dialog-title">{{ t('pages.settings.sync.syncEndpointConfig') }}</h3>
            </div>
          </div>
          <button class="dialog-close" @click="cancelSyncSetting">×</button>
        </div>
        <div class="dialog-content sync-dialog-content">
          <div class="sync-type-selector">
            <label class="sync-type-label">{{ t('pages.settings.sync.selectType') }}</label>
            <div class="sync-type-grid">
              <button
                v-for="typeitem of syncType"
                :key="typeitem"
                :class="['sync-type-btn', { active: sync.type === typeitem }]"
                @click="sync.type = typeitem"
              >
                <GitBranch v-if="typeitem.includes('git')" :size="20" />
                <Store v-else-if="typeitem === 'webdav'" :size="20" />
                <span>{{ typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1) }}</span>
              </button>
            </div>
          </div>

          <!-- Configuration Fields -->
          <div class="sync-config-fields">
            <div v-if="sync.type === 'gitea'" class="sync-field-group">
              <label>
                <Server :size="16" />
                {{ t('pages.settings.sync.giteaHost') }}
              </label>
              <input
                v-model.trim="sync.endpoint"
                type="text"
                class="form-input"
                :placeholder="t('pages.settings.sync.giteaHost')"
              />
            </div>

            <!-- WebDAV Endpoint -->
            <div v-if="sync.type === 'webdav'" class="sync-field-group">
              <label>
                <Globe :size="16" />
                {{ t('pages.settings.sync.webdavEndpoint') }}
              </label>
              <input
                v-model.trim="sync.webdavEndpoint"
                type="text"
                class="form-input"
                :placeholder="t('pages.settings.sync.webdavEndpoint')"
              />
            </div>

            <!-- Git-based fields -->
            <template v-if="sync.type !== 'webdav'">
              <div class="sync-fields-grid">
                <div
                  v-for="inputItem in ['username', 'repo', 'branch', 'token']"
                  :key="inputItem"
                  class="sync-field-group"
                >
                  <label>
                    {{ t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`) }}
                  </label>
                  <input
                    v-model.trim="sync[inputItem as any]"
                    type="text"
                    class="form-input"
                    :placeholder="t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`)"
                  />
                </div>
              </div>
            </template>

            <!-- WebDAV fields -->
            <template v-if="sync.type === 'webdav'">
              <div class="sync-fields-grid">
                <div class="sync-field-group">
                  <label>{{ t('pages.settings.sync.webdav.username') }}</label>
                  <input
                    v-model.trim="sync.webdavUsername"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.sync.webdav.username')"
                  />
                </div>
                <div class="sync-field-group">
                  <label>{{ t('pages.settings.sync.webdav.password') }}</label>
                  <input
                    v-model.trim="sync.webdavPassword"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.sync.webdav.password')"
                  />
                </div>
                <div class="sync-field-group">
                  <label>{{ t('pages.settings.sync.webdav.savePath') }}</label>
                  <input
                    v-model.trim="sync.webdavSavePath"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.settings.sync.webdav.savePath')"
                  />
                </div>
                <div class="sync-field-group">
                  <label>{{ t('pages.settings.sync.webdav.authType') }}</label>
                  <select v-model="sync.webdavAuthType" class="form-select">
                    <option value="basic">Basic</option>
                    <option value="digest">Digest</option>
                  </select>
                </div>
              </div>
              <div class="sync-ssl-toggle">
                <label class="switch-label">
                  <input v-model="sync.webdavSslEnabled" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <div class="switch-title">{{ t('pages.settings.sync.webdav.enableSSL') }}</div>
                    <div class="switch-description">{{ t('pages.settings.sync.webdav.enableSSLDesc') }}</div>
                  </div>
                </label>
              </div>
            </template>

            <!-- GitHub Proxy -->
            <div v-if="sync.type === 'github'" class="sync-field-group">
              <label>
                <Globe :size="16" />
                {{ t('pages.settings.sync.syncConfigProxy') }}
              </label>
              <input
                v-model.trim="sync.proxy"
                type="text"
                class="form-input"
                :placeholder="t('pages.settings.sync.syncConfigProxy')"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelSyncSetting">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="confirmSyncSetting">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upload/Download Config Dialog -->
    <div
      v-if="upDownConfigVisible"
      class="dialog-overlay"
      :class="advancedAnimation"
      @click="upDownConfigVisible = false"
    >
      <div class="dialog config-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <RotateCcw :size="20" class="dialog-icon" />
            <h3 class="dialog-title">
              {{ t('pages.settings.sync.upDownloadSettings') }}
            </h3>
          </div>
          <button class="dialog-close" @click="upDownConfigVisible = false">×</button>
        </div>
        <div class="dialog-content">
          <!-- Upload Settings Section -->
          <div class="config-section">
            <div class="config-section-header">
              <CloudUpload :size="18" />
              <h4>{{ t('pages.settings.sync.uploadSettings') }}</h4>
            </div>
            <div class="config-button-grid">
              <button
                v-for="item in syncTaskList.slice(0, 3)"
                :key="item.task"
                class="config-button"
                @click="syncTaskFn(item.task, item.number)"
              >
                <CloudUpload :size="16" class="button-icon" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>

          <!-- Download Settings Section -->
          <div class="config-section">
            <div class="config-section-header">
              <Download :size="18" />
              <h4>{{ t('pages.settings.sync.downloadSettings') }}</h4>
            </div>
            <div class="config-button-grid">
              <button
                v-for="item in syncTaskList.slice(3, 6)"
                :key="item.task"
                class="config-button"
                @click="syncTaskFn(item.task, item.number)"
              >
                <Download :size="16" class="button-icon" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>

          <!-- Gallery DB Section -->
          <div class="config-section">
            <div class="config-section-header">
              <ImageIcon :size="18" />
              <h4>{{ t('pages.settings.sync.galleryDB') }}</h4>
            </div>
            <div class="config-button-grid full-width">
              <button
                v-for="item in syncTaskList.slice(6, 7)"
                :key="item.task"
                class="config-button"
                @click="syncTaskFn(item.task, item.number)"
              >
                <RefreshCw :size="16" class="button-icon" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="upDownConfigVisible = false">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Process Dialog -->
    <div
      v-if="imageProcessDialogVisible"
      class="dialog-overlay"
      :class="advancedAnimation"
      @click="imageProcessDialogVisible = false"
    >
      <div class="dialog large" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ t('pages.imageProcess.title') }}
          </h3>
          <span class="dialog-title">
            {{ t('pages.imageProcess.subtitle-Global') }}
          </span>
          <button class="dialog-close" @click="imageProcessDialogVisible = false">X</button>
        </div>
        <div class="dialog-content">
          <ImageProcessSetting :config-id="''" :current-picbed-name="''" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { compare } from 'compare-versions'
import {
  BookOpen,
  CloudUpload,
  Download,
  Edit,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Import,
  Keyboard,
  Link,
  Monitor,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  Settings2Icon,
  Store,
} from 'lucide-vue-next'
import { marked } from 'marked'
import type { IConfig } from 'piclist'
import pkg from 'root/package.json'
import { computed, onBeforeMount, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import useConfirm from '@/hooks/useConfirm'
import { osGlobal, usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { setCurrentLanguage } from '@/i18n'
import { SHORTKEY_PAGE } from '@/router/config'
import { enforceNumber } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType, ISartMode } from '@/utils/enum'
import { getLatestVersion } from '@/utils/getLatestVersion'

const { t, locale } = useI18n()
const $router = useRouter()
const { confirm } = useConfirm()
const message = useMessage()
const { picBedG, updatePicBeds } = usePicBed()

const showPicBedList = ref<string[]>([])
const galleryPicBedFilterList = ref<string[]>([])
const themeList = ref<{ key: string; label: string }[]>([{ key: 'default.css', label: '默认' }])
const currentTheme = ref('default.css')
const downloadingThemes = ref(false)
const isDisableGPU = ref(false)
const isPortable = ref(false)
const currentTab = useStorage<'system' | 'sync' | 'upload' | 'advanced' | 'update'>('settings-current-tab', 'system')

// Tab configuration
const tabs = computed(() => [
  { id: 'system', label: t('pages.settings.system.title'), icon: Settings },
  { id: 'sync', label: t('pages.settings.sync.title'), icon: RotateCcw },
  { id: 'upload', label: t('pages.settings.upload.title'), icon: CloudUpload },
  { id: 'advanced', label: t('pages.settings.advanced.title'), icon: Server },
  { id: 'update', label: t('pages.settings.update.title'), icon: RefreshCw },
])

const shortUrlServerList = [
  { label: 'c1n', value: 'c1n' },
  { label: 'yourls', value: 'yourls' },
  { label: 'xyTom/Url-Shorten-Worker', value: 'cf_worker' },
  { label: 'ccbikai/Sink', value: 'sink' },
]

const languageList = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en' },
]

const secondModeList = [
  { label: t('pages.settings.upload.secondPicBedMode.backup'), value: 'backup' },
  { label: t('pages.settings.upload.secondPicBedMode.seperate'), value: 'seperate' },
]

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
  enableSecondUploader: false,
  enableAdvancedAnimation: false,
  theme: 'default.css',
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
  'enableSecondUploader',
  'enableAdvancedAnimation',
]

const advancedAnimation = computed(() => ({
  advancedAnimation: formOfSetting.value.enableAdvancedAnimation,
}))

const addWatch = () => {
  autoWatchKeys.forEach(key => {
    watch(
      () => formOfSetting.value[key as keyof ISettingForm],
      value => {
        saveConfig({ [`settings.${key}`]: value })
      },
    )
  })

  watch(currentSecondMode, newVal => {
    if (newVal) {
      saveConfig({ [configPaths.settings.secondPicBedMode]: newVal })
    }
  })

  watch(currentLanguage, newVal => {
    if (newVal) {
      handleLanguageChange(newVal)
      // Fetch release notes when language changes
      fetchReleaseNotes(true)
    }
  })

  watch(currentStartMode, newVal => {
    if (newVal) {
      handleStartModeChange(newVal)
    }
  })

  watch(currentShortUrlServer, newVal => {
    if (newVal) {
      handleShortUrlServerChange(newVal)
    }
  })

  watch(currentTheme, newVal => {
    if (newVal) {
      handleThemeChange(newVal)
    }
  })

  watch(isDisableGPU, newVal => {
    message.info(t('pages.settings.system.needRestart'))
    saveConfig({ [configPaths.settings.isDisableGPU]: newVal })
  })
}

const addProxyWatch = () => {
  watch(proxy, value => {
    saveConfig({ 'picBed.proxy': value })
  })
}

const advancedRenameList = {
  categoryTime: [
    { label: t('pages.settings.upload.placeholder.year4'), value: '{Y}' },
    { label: t('pages.settings.upload.placeholder.year2'), value: '{y}' },
    { label: t('pages.settings.upload.placeholder.month'), value: '{m}' },
    { label: t('pages.settings.upload.placeholder.date'), value: '{d}' },
    { label: t('pages.settings.upload.placeholder.hour'), value: '{h}' },
    { label: t('pages.settings.upload.placeholder.minute'), value: '{i}' },
    { label: t('pages.settings.upload.placeholder.second'), value: '{s}' },
    { label: t('pages.settings.upload.placeholder.millisecond'), value: '{ms}' },
    { label: t('pages.settings.upload.placeholder.timestamp'), value: '{timestamp}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.sha256'), value: '{sha256}' },
    { label: t('pages.settings.upload.placeholder.sha256-n'), value: '{sha256-n}' },
  ],
  categoryFile: [
    { label: t('pages.settings.upload.placeholder.filename'), value: '{filename}' },
    { label: t('pages.settings.upload.placeholder.localFolder'), value: '{localFolder:n}' },
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-n}' },
  ],
}

function copyPlaceholder(placeholder: string) {
  window.electron.clipboard.writeText(placeholder)
  message.success(t('pages.settings.upload.copySuccess', { content: placeholder }))
}

const currentLanguage = ref()
const currentSecondMode = ref()
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

const customLink = reactive({ value: '![$fileName]($url)' })

const logLevel = {
  all: t('pages.settings.advanced.logLevelList.all'),
  success: t('pages.settings.advanced.logLevelList.success'),
  error: t('pages.settings.advanced.logLevelList.error'),
  info: t('pages.settings.advanced.logLevelList.info'),
  warn: t('pages.settings.advanced.logLevelList.warn'),
  none: t('pages.settings.advanced.logLevelList.none'),
}

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

const syncType = ['github', 'gitee', 'gitea', 'webdav']

async function cancelSyncSetting() {
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
    webdavSavePath: '',
  }
}

function confirmSyncSetting() {
  saveConfig({ [configPaths.settings.sync]: sync.value })
  syncVisible.value = false
}

const version = pkg.version
const latestVersion = ref('')
const releaseNotes = ref('')
const releaseNotesError = ref('')
const releaseNotesLastFetch = ref<Date | null>(null)
const fetchingReleaseNotes = ref(false)

const RELEASE_NOTES_CACHE_DURATION = 30 * 60 * 1000

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  }
  return false
})

onBeforeMount(() => {
  initData()
})

async function loadThemes() {
  try {
    const themes = await window.electron.triggerRPC<{ key: string; label: string }[]>(
      IRPCActionType.THEME_RESOLVE_THEMES,
    )
    if (themes && themes.length > 0) {
      themeList.value = themes.sort((a, b) => {
        if (a.key === 'default.css') return -1
        if (b.key === 'default.css') return 1
        return a.label.localeCompare(b.label)
      })
    }
  } catch (error) {
    console.error('Failed to load themes:', error)
  }
}

async function handleDownloadThemes() {
  try {
    downloadingThemes.value = true
    const result = await window.electron.triggerRPC(IRPCActionType.THEME_FETCH_THEMES)
    if (!result) {
      throw new Error('No themes were downloaded.')
    }
    message.success(t('pages.settings.system.downloadThemesSuccess'))
    await loadThemes()
  } catch (error) {
    console.error('Failed to download themes:', error)
    message.error(t('pages.settings.system.downloadThemesFailed'))
  } finally {
    downloadingThemes.value = false
  }
}

async function handleImportThemes() {
  try {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG, {
      title: t('pages.settings.system.importThemes'),
      filters: [{ name: 'CSS Files', extensions: ['css'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (result && result.length > 0) {
      await window.electron.triggerRPC(IRPCActionType.THEME_IMPORT_THEMES, result)
      message.success(t('pages.settings.system.importThemesSuccess'))
      await loadThemes()
    }
  } catch (error) {
    console.error('Failed to import themes:', error)
    message.error(t('pages.settings.system.importThemesFailed'))
  }
}

async function handleThemeChange(theme: string) {
  try {
    await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, theme)
    saveConfig({ [configPaths.settings.theme]: theme })
  } catch (error) {
    console.error('Failed to apply theme:', error)
    message.error(t('pages.settings.system.applyThemeFailed'))
  }
}

async function initData() {
  const config = (await getConfig<IConfig>()) || ({} as IConfig)
  const settings = config.settings || {}
  const picBed = config.picBed
  isDisableGPU.value = settings.isDisableGPU || false
  isPortable.value = (await window.electron.triggerRPC<boolean>(IRPCActionType.GET_IS_PORTABLE)) || false
  showPicBedList.value = picBedG.value.filter(item => item.visible).map(item => item.name)
  galleryPicBedFilterList.value = settings.galleryPicBedFilter || []
  currentTheme.value = settings.theme || 'default.css'
  loadThemes()
  formKeys.forEach(key => {
    ;(formOfSetting.value as any)[key] = settings[key] ?? formOfSetting.value[key]
  })
  try {
    const actualAutoStartStatus = await window.electron.triggerRPC<boolean>(IRPCActionType.PICLIST_AUTO_START_STATUS)
    if (typeof actualAutoStartStatus === 'boolean') {
      formOfSetting.value.autoStart = actualAutoStartStatus
      if (actualAutoStartStatus !== settings.autoStart) {
        saveConfig({ [configPaths.settings.autoStart]: actualAutoStartStatus })
      }
    }
  } catch (error) {
    formOfSetting.value.autoStart = settings.autoStart ?? false
  }
  formOfSetting.value.logLevel = initArray(settings.logLevel || [], ['all'])
  formOfSetting.value.autoImportPicBed = initArray(settings.autoImportPicBed || [], [])
  currentLanguage.value = settings.language || 'zh-CN'
  currentStartMode.value = settings.startMode || ISartMode.QUIET
  currentSecondMode.value = settings.secondPicBedMode || 'backup'
  if (osGlobal.value === 'darwin' && currentStartMode.value === ISartMode.MINI) {
    currentStartMode.value = ISartMode.QUIET
    saveConfig(configPaths.settings.startMode, ISartMode.QUIET)
  }
  currentShortUrlServer.value = settings.shortUrlServer || 'c1n'
  customLink.value = settings.customLink || '![$fileName]($url)'
  proxy.value = picBed.proxy || ''
  server.value = settings.server || { port: 36677, host: '0.0.0.0', enable: true }
  advancedRename.value = config.buildIn?.rename || { enable: false, format: '{filename}' }
  if (advancedRename.value.enable) {
    formOfSetting.value.autoRename = false
    saveConfig({ [configPaths.settings.autoRename]: false })
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
    webdavSavePath: '',
  }
  formOfSetting.value.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
  addProxyWatch()
  addWatch()

  // Fetch release notes on initialization
  fetchReleaseNotes()
}

function initArray(arrayT: string | string[], defaultValue: string[]) {
  if (!Array.isArray(arrayT)) {
    if (arrayT && arrayT.length > 0) {
      arrayT = [arrayT]
    } else {
      arrayT = defaultValue
    }
  }
  return arrayT
}

async function handleChangeSecondPicBed() {
  window.electron.sendRPC(IRPCActionType.SHOW_SECOND_UPLOADER_MENU)
}

function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

function openDirectory(directory?: string, inStorePath = true) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath)
}

function openLogSetting() {
  logFileVisible.value = true
}

async function cancelCustomLink() {
  customLinkVisible.value = false
  customLink.value = (await getConfig<string>(configPaths.settings.customLink)) || '![$fileName]($url)'
}

function confirmCustomLink() {
  saveConfig(configPaths.settings.customLink, customLink.value)
  customLinkVisible.value = false
}

async function handleCancelAdvancedRename() {
  advancedRenameVisible.value = false
  advancedRename.value = toRaw(
    (await getConfig<any>(configPaths.buildIn.rename)) || { enable: false, format: '{filename}' },
  )
}

function handleSaveAdvancedRename() {
  saveConfig(configPaths.buildIn.rename, toRaw(advancedRename.value))
  if (advancedRename.value.enable) {
    formOfSetting.value.autoRename = false
    saveConfig(configPaths.settings.autoRename, false)
  }
  advancedRenameVisible.value = false
}

function handleMigrateFromPicGo() {
  confirm({
    title: t('pages.settings.sync.mirgrateTitle'),
    message: t('pages.settings.sync.mirgrateContent'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (result) {
      window.electron
        .triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO)
        .then(() => {
          message.success(t('pages.settings.sync.mirgrateSuccess'))
        })
        .catch(() => {
          message.error(t('pages.settings.sync.mirgrateFailed'))
        })
    }
  })
}

function handleMigrateFromPicListInstallation() {
  confirm({
    title: t('pages.settings.sync.mirgrateTitle'),
    message: t('pages.settings.sync.migrateFromPicListInstallationContent'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (result) {
      window.electron
        .triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICLIST_INSTALLATION)
        .then(() => {
          message.success(t('pages.settings.sync.mirgrateSuccess'))
        })
        .catch(() => {
          message.error(t('pages.settings.sync.mirgrateFailed'))
        })
    }
  })
}

function handleHideDockChange(val: ICheckBoxValueType) {
  if (val && currentStartMode.value === ISartMode.NO_TRAY) {
    message.warning(t('pages.settings.system.hideDockHint'))
    formOfSetting.value.isHideDock = false
    return
  }
  saveConfig(configPaths.settings.isHideDock, val)
  window.electron.sendRPC(IRPCActionType.HIDE_DOCK, val)
}

watch(showPicBedList, val => {
  handleShowPicBedListChange(val)
})

watch(galleryPicBedFilterList, val => {
  handleGalleryPicBedFilterChange(val)
})

function handleShowPicBedListChange(val: ICheckBoxValueType[]) {
  const list = picBedG.value.map(item => ({ ...item, visible: val.includes(item.name) }))
  saveConfig({ [configPaths.picBed.list]: list })
  updatePicBeds()
}

function handleGalleryPicBedFilterChange(val: ICheckBoxValueType[]) {
  saveConfig({ [configPaths.settings.galleryPicBedFilter]: val })
}

function handleAutoStartChange(val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.autoStart, val)
  window.electron.sendRPC(IRPCActionType.PICLIST_AUTO_START, val)
}

function compareVersion2Update(current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

function formatLastFetchTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return t('pages.settings.update.justNow')
  } else if (diffInMinutes < 60) {
    return t('pages.settings.update.minutesAgo', { minutes: diffInMinutes })
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) {
      return t('pages.settings.update.hoursAgo', { hours })
    } else {
      const days = Math.floor(hours / 24)
      return t('pages.settings.update.daysAgo', { days })
    }
  }
}

const renderedReleaseNotes = computed(() => {
  return marked(releaseNotes.value, { breaks: true, gfm: true })
})

async function fetchReleaseNotes(forceRefresh = false): Promise<void> {
  if (!forceRefresh && releaseNotesLastFetch.value) {
    const timeSinceLastFetch = Date.now() - releaseNotesLastFetch.value.getTime()
    if (timeSinceLastFetch < RELEASE_NOTES_CACHE_DURATION) {
      return
    }
  }

  try {
    fetchingReleaseNotes.value = true
    releaseNotesError.value = ''

    const isEnglish = currentLanguage.value === 'en'
    const fileName = isEnglish ? 'currentVersion_en.md' : 'currentVersion.md'
    const url = `https://raw.githubusercontent.com/Kuingsmile/piclist/dev/${fileName}`

    const response = await fetch(url)
    if (response.ok) {
      const content = await response.text()
      releaseNotes.value = content
      releaseNotesLastFetch.value = new Date()
      releaseNotesError.value = ''
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to fetch release notes:', error)
    releaseNotesError.value = t('pages.settings.update.releaseNotesError')
  } finally {
    fetchingReleaseNotes.value = false
  }
}

async function fetchReleaseNotesManually(): Promise<void> {
  await fetchReleaseNotes(true)
}

async function checkUpdate() {
  checkUpdateVisible.value = true
  latestVersion.value = (await getLatestVersion()) || t('pages.settings.update.networkError')
}

function confirmCheckVersion() {
  if (needUpdate.value) {
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion() {
  checkUpdateVisible.value = false
}

function confirmWebServerSetting() {
  if (formOfSetting.value.enableWebServer) {
    window.electron.sendRPC(IRPCActionType.ADVANCED_RESTART_WEB_SERVER)
  } else {
    window.electron.sendRPC(IRPCActionType.ADVANCED_STOP_WEB_SERVER)
  }
  webServerVisible.value = false
}

async function getMainWindowSize() {
  formOfSetting.value.mainWindowWidth = (await getConfig<number>(configPaths.settings.mainWindowWidth)) || 1200
  formOfSetting.value.mainWindowHeight = (await getConfig<number>(configPaths.settings.mainWindowHeight)) || 800
}

async function cancelWindowSize() {
  mainWindowSizeVisible.value = false
  await getMainWindowSize()
}

async function confirmWindowSize() {
  mainWindowSizeVisible.value = false
  const width = enforceNumber(formOfSetting.value.mainWindowWidth)
  const height = enforceNumber(formOfSetting.value.mainWindowHeight)
  saveConfig({
    [configPaths.settings.mainWindowWidth]: rawPicGoSize.value ? 800 : width < 100 ? 100 : width,
    [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : height < 100 ? 100 : height,
  })
  await getMainWindowSize()
}

function handleMiniWindowOntop(val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.miniWindowOntop, val)
  window.electron.sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val)
}

async function handleMiniIconPath(_: Event) {
  const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
  if (result && result[0]) {
    formOfSetting.value.customMiniIcon = result[0]
    saveConfig(configPaths.settings.customMiniIcon, formOfSetting.value.customMiniIcon)
    window.electron.sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON, formOfSetting.value.customMiniIcon)
  }
}

function handleShortUrlServerChange(val: string) {
  formOfSetting.value.shortUrlServer = val
  saveConfig(configPaths.settings.shortUrlServer, val)
}

function handleAesPasswordChange(val: string) {
  saveConfig(configPaths.settings.aesPassword, val || 'PicList-aesPassword')
}

function confirmLogLevelSetting() {
  if (formOfSetting.value.logLevel.length === 0) {
    message.error(t('pages.settings.advanced.chooseLogLevel'))
    return
  }
  saveConfig({
    [configPaths.settings.logLevel]: formOfSetting.value.logLevel,
    [configPaths.settings.logFileSizeLimit]: formOfSetting.value.logFileSizeLimit,
  })
  logFileVisible.value = false
}

async function cancelLogLevelSetting() {
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

function syncMessage(failed: number) {
  if (failed) {
    message.error(t('pages.settings.sync.syncResult.failed'))
  } else {
    message.success(t('pages.settings.sync.syncResult.success'))
  }
}

const syncTaskList = [
  { task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 4 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 4 },
  { task: IRPCActionType.CONFIGURE_SYNC_GALLERY_DB, label: t('pages.settings.sync.galleryDB'), number: 2 },
]

async function syncTaskFn(task: string, number: number) {
  const failed = number - ((await window.electron.triggerRPC<number>(task)) || 0)
  syncMessage(failed)
}

function confirmServerSetting() {
  server.value.port = parseInt(server.value.port as unknown as string, 10)
  saveConfig({ [configPaths.settings.server]: server.value })
  serverVisible.value = false
  window.electron.sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER)
}

async function cancelServerSetting() {
  serverVisible.value = false
  server.value = (await getConfig(configPaths.settings.server)) || { port: 36677, host: '0.0.0.0', enable: true }
}

function handleLanguageChange(val: string) {
  locale.value = val
  setCurrentLanguage(val)
  saveConfig({ [configPaths.settings.language]: val })
  localStorage.setItem('currentLanguage', val)
  updatePicBeds()
}

function handleStartModeChange(val: string) {
  if (val === ISartMode.NO_TRAY) {
    if (formOfSetting.value.isHideDock) {
      message.warning(t('pages.settings.system.hideDockHint'))
      currentStartMode.value = ISartMode.QUIET
      return
    }
    message.info(t('pages.settings.system.needRestart'))
  }
  saveConfig({ [configPaths.settings.startMode]: val })
}

async function goConfigPage() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  const url = `https://piclist.cn/${lang === II18nLanguage.EN ? 'en/' : ''}configure.html`
  window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
}

function goShortCutPage() {
  $router.push({ name: SHORTKEY_PAGE })
}
</script>
<script lang="ts">
export default { name: 'SettingPage' }
</script>

<style scoped src="./css/PicgoSetting.css"></style>
