<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <!-- Header -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4">
          <Settings :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.settings.title') }}</h1>
          </div>
        </div>
        <div class="flex gap-3">
          <CustomButton :text="t('pages.settings.docs')" type="secondary" :icon="BookOpen" @click="goConfigPage" />
        </div>
      </div>

      <!-- Tab Navigation -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <CustomButton
          v-for="tab in tabs"
          :key="tab.id"
          :text="tab.label"
          :icon="tab.icon"
          :active="currentTab === tab.id"
          :icon-size="18"
          type="tab"
          @click="tabClick(tab.id)"
        />
      </div>

      <!-- Settings Content -->
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <!-- System Settings Tab -->
        <div
          v-if="currentTab === 'system'"
          class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4"
        >
          <SettingSection :title="t('pages.settings.system.languageAndAppearance')" :icon="Globe">
            <SettingCard>
              <CustomSelect
                v-model="currentLanguage"
                :select-list="languageList"
                :title="t('pages.settings.system.chooseLanguage')"
                :icon="Globe"
              />
            </SettingCard>

            <SettingCard>
              <CustomSelect v-model="currentStartMode" :title="t('pages.settings.system.startMode')" :icon="Monitor">
                <template #extra>
                  <option value="quiet">{{ t('pages.settings.system.quietMode') }}</option>
                  <option v-if="osGlobal !== 'darwin'" value="mini">{{ t('pages.settings.system.miniMode') }}</option>
                  <option v-if="osGlobal === 'darwin'" value="no-tray">
                    {{ t('pages.settings.system.noTrayMode') }}
                  </option>
                  <option value="main">{{ t('pages.settings.system.mainMode') }}</option>
                </template>
              </CustomSelect>
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="isDisableGPU"
                no-border
                small
                :title="t('pages.settings.system.isDisableGPU')"
                :description="t('pages.settings.system.isDisableGPUDesc')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.enableAdvancedAnimation"
                no-border
                small
                :title="t('pages.settings.system.enableAdvancedAnimation')"
                :description="t('pages.settings.system.enableAdvancedAnimationDesc')"
              />
            </SettingCard>

            <SettingCard>
              <CustomSelect
                v-model="currentTheme"
                :select-list="themeList"
                :title="t('pages.settings.system.chooseTheme')"
                :icon="ImageIcon"
              />
            </SettingCard>
            <template #extra>
              <div class="mt-3 flex gap-4">
                <CustomButton
                  :disabled="downloadingThemes"
                  :text="
                    downloadingThemes
                      ? t('pages.settings.system.downloadingThemes')
                      : t('pages.settings.system.downloadThemes')
                  "
                  :icon-size="14"
                  :icon="Download"
                  type="secondary"
                  @click="handleDownloadThemes"
                />
                <CustomButton
                  :icon="Import"
                  :text="t('pages.settings.system.importThemes')"
                  type="secondary"
                  :icon-size="14"
                  @click="handleImportThemes"
                />
              </div>
            </template>
          </SettingSection>

          <!-- Window Behavior Section -->
          <SettingSection :icon="Monitor" :title="t('pages.settings.system.windowBehavior')">
            <!-- Main Window Size Card -->

            <CustomNavCard
              :title="t('pages.settings.system.mainWindowSize')"
              :icon="Monitor"
              @click="mainWindowSizeVisible = true"
            />
            <!-- Window Behavior Toggles -->

            <SettingCard v-if="osGlobal === 'darwin'" p1>
              <CustomSwitch
                v-model="formOfSetting.isHideDock"
                small
                no-border
                :title="t('pages.settings.system.isHideDock')"
                @change="handleHideDockChange(formOfSetting.isHideDock)"
              />
            </SettingCard>

            <SettingCard v-if="osGlobal !== 'darwin'" p1>
              <CustomSwitch
                v-model="formOfSetting.autoCloseMiniWindow"
                small
                no-border
                :title="t('pages.settings.system.autoCloseMiniWindow')"
              />
            </SettingCard>

            <SettingCard v-if="osGlobal !== 'darwin'" p1>
              <CustomSwitch
                v-model="formOfSetting.autoCloseMainWindow"
                small
                no-border
                :title="t('pages.settings.system.autoCloseMainWindow')"
              />
            </SettingCard>

            <SettingCard v-if="osGlobal !== 'darwin'" p1>
              <CustomSwitch
                v-model="formOfSetting.miniWindowOntop"
                small
                no-border
                :title="t('pages.settings.system.miniWindowOnTop')"
                @click="handleMiniWindowOntop(formOfSetting.miniWindowOntop)"
              />
            </SettingCard>

            <SettingCard v-if="osGlobal !== 'darwin'" p1>
              <CustomSwitch
                v-model="formOfSetting.isCustomMiniIcon"
                small
                no-border
                :title="t('pages.settings.system.isCustomMiniIcon')"
              />
            </SettingCard>

            <CustomNavCard
              v-if="osGlobal !== 'darwin' && formOfSetting.isCustomMiniIcon"
              :icon="ImageIcon"
              noarrow
              :title="t('pages.settings.system.customMiniIconPath')"
            >
              <template #extra>
                <button class="btn btn-secondary btn-sm" @click="handleMiniIconPath">
                  {{ t('pages.settings.clickToSet') }}
                </button>
              </template>
            </CustomNavCard>
          </SettingSection>
          <!-- Startup & Shortcuts Section -->
          <SettingSection :icon="Keyboard" :title="t('pages.settings.system.startupAndShortcuts')">
            <!-- Auto Launch Toggle -->
            <CustomSwitch
              v-model="formOfSetting.autoStart"
              small
              :title="t('pages.settings.system.autoLaunch')"
              :description="t('pages.settings.system.autoLaunchDesc')"
              @change="handleAutoStartChange(formOfSetting.autoStart)"
            />
            <CustomNavCard
              :title="t('pages.settings.system.setShortCuts')"
              :description="t('pages.settings.system.setShortCutsDesc')"
              :icon="Keyboard"
              @click="goShortCutPage"
            />
          </SettingSection>
        </div>

        <!-- Sync & Configure Tab -->
        <div
          v-if="currentTab === 'sync'"
          class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4"
        >
          <!-- Sync Status Overview -->
          <CustomNavCard noarrow :icon="RotateCcw" :title="t('pages.settings.sync.syncConfiguration')">
            <template #description>
              <p class="flex items-center gap-2 text-sm text-secondary">
                <span
                  class="inline-flex items-center rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-semibold tracking-wide text-accent"
                  >{{ sync.type?.toUpperCase() || 'N/A' }}</span
                >
                <span v-if="sync.type !== 'webdav' && sync.username" class="m-0 text-sm text-secondary"
                  >{{ sync.username }}/{{ sync.repo || '...' }}</span
                >
                <span v-else-if="sync.type === 'webdav' && sync.webdavEndpoint" class="m-0 text-sm text-secondary">{{
                  sync.webdavEndpoint
                }}</span>
                <span v-else class="text-sm font-semibold text-danger/70 italic">{{
                  t('pages.settings.sync.notConfigured')
                }}</span>
              </p>
            </template>
            <template #extra>
              <CustomButton
                :icon="Settings"
                :text="t('pages.settings.sync.configureSync')"
                type="secondary"
                @click="syncVisible = true"
              />
            </template>
          </CustomNavCard>

          <!-- Sync Actions Section -->
          <SettingSection :icon="CloudUpload" :title="t('pages.settings.sync.syncActions')">
            <CustomNavCard
              :title="t('pages.settings.sync.upDownloadSettings')"
              :icon="CloudUpload"
              :description="t('pages.settings.sync.upDownloadDesc')"
              @click="() => (upDownConfigVisible = true)"
            />
            <CustomNavCard
              :title="t('pages.settings.sync.migrateFromPicGo')"
              :icon="Import"
              :description="t('pages.settings.sync.migrateDesc')"
              @click="handleMigrateFromPicGo"
            />

            <CustomNavCard
              v-if="isPortable"
              :title="t('pages.settings.sync.migrateFromPicListInstallation')"
              :icon="Import"
              :description="t('pages.settings.sync.migrateDescPicList')"
              @click="handleMigrateFromPicListInstallation"
            />
          </SettingSection>

          <!-- File Management Section -->
          <SettingSection :icon="FolderOpen" :title="t('pages.settings.sync.fileManagement')">
            <CustomNavCard
              :title="t('pages.settings.sync.openConfigFile')"
              :icon="FileText"
              @click="openFile('data.json')"
            />
            <CustomNavCard
              :title="t('pages.settings.sync.openConfigFileDir')"
              :icon="FolderOpen"
              @click="openDirectory"
            />
          </SettingSection>
        </div>
        <!-- Upload Settings Tab -->
        <div
          v-if="currentTab === 'upload'"
          class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4"
        >
          <!-- Upload Behavior Section -->
          <SettingSection :icon="Server" :title="t('pages.settings.upload.controlShow')">
            <SettingCard>
              <MultiSelect
                v-model:choosed="showPicBedList"
                :icon="Server"
                :tight="false"
                :title="t('pages.settings.upload.chooseShowedPicBed')"
                :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
                :all-list="picBedG"
              />
            </SettingCard>
            <SettingCard>
              <MultiSelect
                v-model:choosed="galleryPicBedFilterList"
                :icon="ImageIcon"
                :tight="false"
                :title="t('pages.settings.upload.galleryPicBedFilter')"
                :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
                :all-list="picBedG"
              />
            </SettingCard>
          </SettingSection>
          <SettingSection :icon="CloudUpload" :title="t('pages.settings.upload.uploadBehavior')">
            <!-- Auto Import Card -->
            <CustomSwitch
              v-model="formOfSetting.autoImport"
              small
              :title="t('pages.settings.upload.autoImportInManage')"
              :description="t('pages.settings.upload.autoImportInManageHint')"
            />
            <!-- Auto Import PicBed Selection -->
            <SettingCard v-if="formOfSetting.autoImport">
              <MultiSelect
                v-model:choosed="formOfSetting.autoImportPicBed"
                :icon="ImageIcon"
                :tight="false"
                :title="t('pages.settings.upload.autoImportPicBed')"
                :zero-placeholder="t('pages.settings.upload.autoImportPicBed')"
                :all-list="picBedG"
              />
            </SettingCard>
            <!-- Second PicBed Card -->
            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.enableSecondUploader"
                small
                no-border
                :title="t('pages.settings.upload.enableSecondPicBed')"
                :description="t('pages.settings.upload.enableSecondPicBedHint')"
              />
            </SettingCard>

            <CustomNavCard
              :title="t('pages.settings.upload.setSecondPicBed')"
              :icon="CloudUpload"
              :description="t('pages.settings.upload.setSecondPicBedDesc')"
              @click="handleChangeSecondPicBed"
            />

            <SettingCard>
              <CustomSelect
                v-model="currentSecondMode"
                :select-list="secondModeList"
                :title="t('pages.settings.upload.chooseSecondPicBedMode')"
                :icon="Settings2Icon"
              />
            </SettingCard>
          </SettingSection>

          <!-- Upload Processing Section -->
          <SettingSection :icon="ImageIcon" :title="t('pages.settings.upload.uploadProcessing')">
            <CustomNavCard
              :title="t('pages.settings.upload.advancedRname')"
              :icon="Edit"
              :description="t('pages.settings.upload.advancedRnameDesc')"
              @click="advancedRenameVisible = true"
            />
            <CustomNavCard
              :title="t('pages.settings.upload.imageProcessing')"
              :icon="ImageIcon"
              :description="t('pages.settings.upload.imageProcessingDesc')"
              @click="imageProcessDialogVisible = true"
            />
            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.deleteCloudFile"
                small
                no-border
                :title="t('pages.settings.upload.deleteCloud')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.rename"
                small
                no-border
                :title="t('pages.settings.upload.manualRename')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.autoRename"
                small
                no-border
                :title="t('pages.settings.upload.timestampRename')"
                description="YYYYMMDDHHmmssSSS"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.deleteLocalFile"
                small
                no-border
                :title="t('pages.settings.upload.deleteLocalFileAfterUpload')"
              />
            </SettingCard>
          </SettingSection>

          <!-- Clipboard & Notification Section -->
          <SettingSection :icon="Edit" :title="t('pages.settings.upload.clipboardAndNotification')">
            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.uploadNotification"
                small
                no-border
                :title="t('pages.settings.upload.enableUploadNotification')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.uploadResultNotification"
                small
                no-border
                :title="t('pages.settings.upload.enableUploadResultNotification')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.autoCopy"
                small
                no-border
                :title="t('pages.settings.upload.autoCopyUrlAfterUpload')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.useBuiltinClipboard"
                small
                no-border
                :title="t('pages.settings.upload.useBuiltInClipboardUpload')"
                :description="t('pages.settings.upload.useBuiltInClipboardUploadHint')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.isAutoListenClipboard"
                small
                no-border
                :title="t('pages.settings.upload.isAutoListenClipboard')"
              />
            </SettingCard>
          </SettingSection>

          <!-- URL Format & Link Type Section -->
          <SettingSection :icon="Link" :title="t('pages.settings.upload.urlFormatAndLinkType')">
            <!-- Custom Link Format Action -->
            <CustomNavCard
              :title="t('pages.settings.upload.customLinkFormat')"
              :icon="Link"
              :description="t('pages.settings.upload.customLinkFormatDesc')"
              @click="customLinkVisible = true"
            />
            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.useShortUrl"
                small
                no-border
                :title="t('pages.settings.upload.enableShortUrl')"
                :description="t('pages.settings.upload.enableShortUrlDesc')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl">
              <CustomSelect
                v-model="currentShortUrlServer"
                :select-list="shortUrlServerList"
                :title="t('pages.settings.upload.shortUrlServer')"
                :icon="Link"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'c1n'">
              <CustomInput
                v-model="formOfSetting.c1nToken"
                :title="t('pages.settings.upload.c1nToken')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.c1nToken')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'yourls'">
              <CustomInput
                v-model="formOfSetting.yourlsDomain"
                :title="t('pages.settings.upload.yourlsDomain')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.yourlsDomain')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'yourls'">
              <CustomInput
                v-model="formOfSetting.yourlsSignature"
                :title="t('pages.settings.upload.yourlsSignature')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.yourlsSignature')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'cf_worker'">
              <CustomInput
                v-model="formOfSetting.cfWorkerHost"
                :title="t('pages.settings.upload.cfWorkerHost')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.cfWorkerHost')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'sink'">
              <CustomInput
                v-model="formOfSetting.sinkDomain"
                :title="t('pages.settings.upload.sinkDomain')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.sinkDomain')"
              />
            </SettingCard>

            <SettingCard v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'sink'">
              <CustomInput
                v-model="formOfSetting.sinkToken"
                :title="t('pages.settings.upload.sinkToken')"
                :icon="Link"
                :placeholder="t('pages.settings.upload.sinkToken')"
              />
            </SettingCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.encodeOutputURL"
                small
                no-border
                :title="t('pages.settings.upload.encodeOutputUrl')"
              />
            </SettingCard>
          </SettingSection>
        </div>

        <div
          v-if="currentTab === 'advanced'"
          class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4"
        >
          <SettingSection :icon="FileText" :title="t('pages.settings.advanced.logging')">
            <CustomNavCard
              :title="t('pages.settings.advanced.logFilePath')"
              :description="t('pages.settings.advanced.logFilePathDesc')"
              :icon="FolderOpen"
              @click="openDirectory"
            />
            <CustomNavCard
              :title="t('pages.settings.advanced.setLog')"
              :description="t('pages.settings.advanced.setLogDesc')"
              :icon="Settings"
              @click="openLogSetting"
            />
          </SettingSection>

          <SettingSection :icon="Globe" :title="t('pages.settings.advanced.networkAndProxy')">
            <CustomNavCard
              :title="t('pages.settings.advanced.setProxyAndMirror')"
              :description="t('pages.settings.advanced.setProxyAndMirrorDesc')"
              :icon="Globe"
              @click="proxyVisible = true"
            />
          </SettingSection>

          <!-- Server Settings Section -->
          <SettingSection :icon="Server" :title="t('pages.settings.advanced.serverSettings')">
            <CustomNavCard
              :title="t('pages.settings.advanced.webServerSettings')"
              :description="t('pages.settings.advanced.webServerSettingsDesc')"
              :icon="Globe"
              @click="webServerVisible = true"
            />
            <CustomNavCard
              :title="t('pages.settings.advanced.uploadServer')"
              :description="t('pages.settings.advanced.uploadServerDesc')"
              :icon="Globe"
              @click="serverVisible = true"
            />
            <SettingCard>
              <CustomInput
                v-model="formOfSetting.aesPassword"
                :is-password="true"
                :title="t('pages.settings.advanced.serverEncryptionKey')"
                :placeholder="t('pages.settings.advanced.serverEncryptionKey')"
              />
            </SettingCard>
          </SettingSection>
        </div>
        <div
          v-if="currentTab === 'update'"
          class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4"
        >
          <SettingSection :icon="RefreshCw" :title="t('pages.settings.update.applicationUpdates')">
            <CustomNavCard noarrow :icon="RotateCcw" :title="t('pages.settings.update.currentVersion')">
              <template #description>
                <div class="flex items-center gap-2">
                  <span class="rounded-md bg-accent/30 px-2 py-1 text-sm font-semibold text-secondary"
                    >v{{ version }}</span
                  >
                </div>
              </template>
              <template #extra>
                <CustomButton
                  :icon="RefreshCw"
                  :text="t('pages.settings.update.clickToCheck')"
                  type="secondary"
                  @click="checkUpdate"
                />
              </template>
            </CustomNavCard>

            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.showUpdateTip"
                small
                no-border
                :title="t('pages.settings.update.openUpdateHelper')"
                :description="t('pages.settings.update.openUpdateHelperDesc')"
              />
            </SettingCard>
          </SettingSection>

          <!-- Release Notes Section -->
          <SettingSection
            :only-one-row="true"
            :icon="BookOpen"
            :title="t('pages.settings.update.latestReleaseNotes')"
            class="relative"
          >
            <div class="absolute top-4 right-4 flex items-center gap-2">
              <CustomButton
                :icon="RefreshCw"
                :text="t('pages.settings.update.refresh')"
                type="secondary"
                :disabled="fetchingReleaseNotes"
                @click="fetchReleaseNotesManually"
              />
            </div>
            <div class="relative w-full rounded-lg border border-border bg-bg-secondary shadow-sm">
              <div class="max-h-[400px] overflow-y-auto bg-bg-secondary">
                <div
                  v-if="fetchingReleaseNotes"
                  class="flex flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-secondary"
                >
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <RefreshCw :size="24" class="animate-ping" />
                  </div>
                  <span>{{ t('pages.settings.update.loadingReleaseNotes') }}</span>
                </div>
                <div v-else-if="releaseNotes" class="notes-body" v-html="renderedReleaseNotes"></div>
                <div
                  v-else-if="releaseNotesError"
                  class="flex flex-col items-center justify-center gap-6 bg-error/10 p-4 text-sm text-danger"
                >
                  <div class="text-[4rem]">⚠️</div>
                  <span>{{ releaseNotesError }}</span>
                  <CustomButton
                    :icon="RefreshCw"
                    :text="t('pages.settings.update.retry')"
                    type="secondary"
                    @click="fetchReleaseNotesManually"
                  />
                </div>
              </div>

              <div v-if="releaseNotesLastFetch" class="border-t border-border-secondary bg-bg-secondary p-3 text-right">
                <small class="flex flex-row justify-end gap-1 text-xs text-secondary">
                  <RefreshCw :size="12" />
                  <div>
                    {{ t('pages.settings.update.lastUpdated') }}: {{ formatLastFetchTime(releaseNotesLastFetch) }}
                  </div>
                </small>
              </div>
            </div>
          </SettingSection>
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
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/customButton.vue'
import CustomInput from '@/components/common/customInput.vue'
import CustomNavCard from '@/components/common/customNavCard.vue'
import CustomSelect from '@/components/common/customSelect.vue'
import CustomSwitch from '@/components/common/customSwitch.vue'
import MultiSelect from '@/components/common/multiSelect.vue'
import SettingCard from '@/components/common/settingCard.vue'
import SettingSection from '@/components/common/settingSection.vue'
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

/* reactive data and refs */
const { t, locale } = useI18n()
const $router = useRouter()
const { confirm } = useConfirm()
const message = useMessage()
const { picBedG, updatePicBeds } = usePicBed()
const showPicBedList = ref<string[]>([])
const galleryPicBedFilterList = ref<string[]>([])
const themeList = ref<{ value: string; label: string }[]>([{ value: 'default.css', label: '默认' }])
const currentTheme = ref('default.css')
const proxy = ref('')
const downloadingThemes = ref(false)
const isDisableGPU = ref(false)
const isPortable = ref(false)
const currentLanguage = ref()
const currentSecondMode = ref()
const currentStartMode = ref()
const currentShortUrlServer = ref()
/* dialog visibility refs */
const logFileVisible = ref(false)
const customLinkVisible = ref(false)
const checkUpdateVisible = ref(false)
const serverVisible = ref(false)
const webServerVisible = ref(false)
const syncVisible = ref(false)
const upDownConfigVisible = ref(false)
const proxyVisible = ref(false)

const latestVersion = ref('')
const releaseNotes = ref('')
const releaseNotesError = ref('')
const releaseNotesLastFetch = ref<Date | null>(null)
const fetchingReleaseNotes = ref(false)
const mainWindowSizeVisible = ref(false)
const advancedRenameVisible = ref(false)
const imageProcessDialogVisible = ref(false)
const rawPicGoSize = ref(false)
const customLink = reactive({ value: '![$fileName]($url)' })
const currentTab = useStorage<'system' | 'sync' | 'upload' | 'advanced' | 'update'>('settings-current-tab', 'system')
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

/* computed properties */
const tabs = computed(() => [
  { id: 'system', label: t('pages.settings.system.title'), icon: Settings },
  { id: 'sync', label: t('pages.settings.sync.title'), icon: RotateCcw },
  { id: 'upload', label: t('pages.settings.upload.title'), icon: CloudUpload },
  { id: 'advanced', label: t('pages.settings.advanced.title'), icon: Server },
  { id: 'update', label: t('pages.settings.update.title'), icon: RefreshCw },
])

const advancedAnimation = computed(() => ({
  advancedAnimation: formOfSetting.value.enableAdvancedAnimation,
}))

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  }
  return false
})

const renderedReleaseNotes = computed(() => {
  return marked(releaseNotes.value, { breaks: true, gfm: true })
})

/* constants and enums */
const syncTaskList = [
  { task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 4 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 4 },
  { task: IRPCActionType.CONFIGURE_SYNC_GALLERY_DB, label: t('pages.settings.sync.galleryDB'), number: 2 },
]

const logLevel = {
  all: t('pages.settings.advanced.logLevelList.all'),
  success: t('pages.settings.advanced.logLevelList.success'),
  error: t('pages.settings.advanced.logLevelList.error'),
  info: t('pages.settings.advanced.logLevelList.info'),
  warn: t('pages.settings.advanced.logLevelList.warn'),
  none: t('pages.settings.advanced.logLevelList.none'),
}

const syncType = ['github', 'gitee', 'gitea', 'webdav']
const version = pkg.version

const RELEASE_NOTES_CACHE_DURATION = 30 * 60 * 1000

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

/* watchers and effects */
const addWatch = () => {
  autoWatchKeys.forEach(key => {
    watch(
      () => formOfSetting.value[key as keyof ISettingForm],
      value => {
        saveConfig({ [`settings.${key}`]: value })
      },
    )
  })

  watch(showPicBedList, val => {
    handleShowPicBedListChange(val)
  })

  watch(galleryPicBedFilterList, val => {
    handleGalleryPicBedFilterChange(val)
  })

  watch(
    () => formOfSetting.value.aesPassword,
    val => {
      handleAesPasswordChange(val)
    },
  )

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

/* methods */
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

function tabClick(tabId: string) {
  currentTab.value = tabId as 'system' | 'sync' | 'upload' | 'advanced' | 'update'
}

async function loadThemes() {
  try {
    const themes = await window.electron.triggerRPC<{ key: string; label: string }[]>(
      IRPCActionType.THEME_RESOLVE_THEMES,
    )
    if (themes && themes.length > 0) {
      const sortedThemes = themes.sort((a, b) => {
        if (a.key === 'default.css') return -1
        if (b.key === 'default.css') return 1
        return a.label.localeCompare(b.label)
      })
      themeList.value = sortedThemes.map(theme => ({
        value: theme.key,
        label: theme.label,
      }))
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
  showPicBedList.value = picBedG.value.filter(item => item.visible).map(item => item.type)
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

function handleShowPicBedListChange(val: ICheckBoxValueType[]) {
  try {
    const list = picBedG.value.map(item => ({ ...item, visible: val.includes(item.type) }))
    saveConfig({ [configPaths.picBed.list]: list })
    nextTick(() => {
      updatePicBeds()
    })
  } catch (error) {
    console.error('Error updating PicBed visibility:', error)
  }
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

function copyPlaceholder(placeholder: string) {
  window.electron.clipboard.writeText(placeholder)
  message.success(t('pages.settings.upload.copySuccess', { content: placeholder }))
}

/* lifecycle hooks */
onBeforeMount(() => {
  initData()
})

let unbindTheme: () => void
onMounted(() => {
  unbindTheme = window.electron.onThemeUpdate((_: string) => {
    console.log('Applying theme CSS update:')
  })
})

onBeforeUnmount(() => {
  if (unbindTheme) {
    unbindTheme()
  }
})
</script>
<script lang="ts">
export default { name: 'SettingPage' }
</script>

<style scoped src="./css/PicgoSetting.css"></style>
