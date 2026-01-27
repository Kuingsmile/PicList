<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <!-- Header -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-2">
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
                @update:model-value="handleIsDisableGPUChange"
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
              <SingleSelect
                v-model="currentTheme"
                :title="t('pages.settings.system.chooseTheme')"
                :fronticon="false"
                :key-list="themeList.map(item => item.value)"
                :placeholder="themeList.find(theme => theme.value === currentTheme)?.label || ''"
              >
                <template #item="{ item }">
                  {{ themeList.find(theme => theme.value === item)?.label || item }}
                </template>
              </SingleSelect>
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
                  <CustomButton
                    :icon="Edit2"
                    :text="t('pages.settings.system.editTheme')"
                    type="primary"
                    :icon-size="14"
                    @click="handleEditTheme"
                  />
                </div>
              </template>
            </SettingCard>
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
                @change="handleHideDockChange"
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
                @change="handleMiniWindowOntop"
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
                <CustomButton type="secondary" :text="t('pages.settings.clickToSet')" @click="handleMiniIconPath" />
              </template>
            </CustomNavCard>
          </SettingSection>
          <!-- Startup & Shortcuts Section -->
          <SettingSection :icon="Keyboard" :title="t('pages.settings.system.startupAndShortcuts')">
            <!-- Auto Launch Toggle -->
            <SettingCard p1>
              <CustomSwitch
                v-model="formOfSetting.autoStart"
                small
                no-border
                :title="t('pages.settings.system.autoLaunch')"
                :description="t('pages.settings.system.autoLaunchDesc')"
                @change="handleAutoStartChange"
              />
            </SettingCard>
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
              :title="t('pages.settings.sync.editConfigFile')"
              :icon="Edit"
              @click="editFile('data.json')"
            />
            <CustomNavCard
              :title="t('pages.settings.sync.editCloudConfigFile')"
              :icon="Edit"
              @click="editFile('manage.json')"
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
              no-border
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

            <SettingCard p1 class="flex flex-col justify-center">
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

            <SettingCard p1 class="flex flex-col justify-center">
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
              :title="t('pages.settings.advanced.logFile')"
              description="piclist.log"
              :icon="FileText"
              @click="openFile('piclist.log')"
            />
            <CustomNavCard
              :title="t('pages.settings.advanced.guiLogFile')"
              description="piclist-gui-local.log"
              :icon="FileText"
              @click="openFile('piclist-gui-local.log')"
            />
            <CustomNavCard
              :title="t('pages.settings.advanced.manageLogFile')"
              description="manage.log"
              :icon="FileText"
              @click="openFile('manage.log')"
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
    <CustomModal
      v-if="customLinkVisible"
      v-model:visible="customLinkVisible"
      height="auto"
      width="auto"
      :title="t('pages.settings.upload.customLinkFormat')"
    >
      <div class="flex flex-col gap-4 p-4">
        <div class="rounded-lg border border-border p-4">
          <div class="mb-2 flex items-center gap-2 p-1">
            <FileText :size="16" class="text-accent" />
            <span class="text-sm font-semibold text-main">{{
              t('pages.settings.upload.availablePlaceholdersTitle')
            }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <template v-for="item in placeholderList" :key="item.code">
              <div class="flex items-center gap-3">
                <code
                  class="min-w-[80px] rounded-sm border border-border bg-bg-secondary px-2 py-1 text-center font-['SF_Mono,Monaco,Menlo,monospace'] text-sm font-semibold text-main"
                  >{{ item.code }}</code
                >
                <span class="text-sm font-semibold text-secondary">{{
                  t(`pages.settings.upload.${item.description}`)
                }}</span>
              </div>
            </template>
          </div>
        </div>
        <div>
          <SettingCard>
            <CustomInput
              v-model="customLink"
              :title="t('pages.settings.upload.customLinkFormatInput')"
              :placeholder="'![$fileName]($url)'"
            />
          </SettingCard>
        </div>
      </div>
    </CustomModal>

    <!-- Proxy Settings Dialog -->
    <CustomModal
      v-if="proxyVisible"
      v-model:visible="proxyVisible"
      height="auto"
      width="600px"
      :title="t('pages.settings.advanced.setProxyAndMirror')"
    >
      <SettingSection>
        <SettingCard>
          <CustomInput
            v-model="proxy"
            :title="t('pages.settings.advanced.uploadProxy')"
            placeholder="http://127.0.0.1:1080"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="formOfSetting.proxy"
            :title="t('pages.settings.advanced.pluginInstallProxy')"
            placeholder="http://127.0.0.1:1080"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="formOfSetting.registry"
            :title="t('pages.settings.advanced.pluginInstallMirror')"
            placeholder="https://registry.npmmirror.com"
          />
        </SettingCard>
      </SettingSection>
    </CustomModal>

    <!-- Main Window Size Dialog -->
    <CustomModal
      v-if="mainWindowSizeVisible"
      v-model:visible="mainWindowSizeVisible"
      height="auto"
      width="600px"
      :title="t('pages.settings.system.setMainWindowSize')"
    >
      <SettingSection>
        <SettingCard>
          <CustomInput
            v-model="formOfSetting.mainWindowWidth"
            type="number"
            min="1"
            max="10000"
            :title="t('pages.settings.system.mainWindowWidth')"
            placeholder="1200"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="formOfSetting.mainWindowHeight"
            type="number"
            min="1"
            max="10000"
            :title="t('pages.settings.system.mainWindowHeight')"
            placeholder="800"
          />
        </SettingCard>
        <CustomSwitch
          v-model="rawPicGoSize"
          small
          :title="t('pages.settings.system.rawPicGoSize')"
          :description="t('pages.settings.system.rawPicGoSizeHint')"
        />
      </SettingSection>
    </CustomModal>

    <!-- Check Update Dialog -->
    <CustomModal
      v-if="checkUpdateVisible"
      v-model:visible="checkUpdateVisible"
      height="auto"
      width="500px"
      :title="t('pages.settings.update.checkUpdate')"
    >
      <div class="mb-4 no-scrollbar overflow-y-auto p-1">
        <div class="mt-5 flex items-center justify-center gap-4">
          <div class="min-w-[120px] flex-1 rounded-lg border border-border bg-bg-tertiary px-5 py-4 text-center">
            <div class="mb-1.5 text-sm font-semibold text-secondary">
              {{ t('pages.settings.update.currentVersionLabel') }}
            </div>
            <div class="text-lg font-bold text-main">v{{ version }}</div>
          </div>
          <div class="shrink-0 text-tertiary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div
            class="group latest min-w-[120px] flex-1 rounded-lg border border-border bg-bg-tertiary px-5 py-4 text-center"
            :class="{ 'has-update': needUpdate }"
          >
            <div class="mb-1.5 text-sm font-semibold text-secondary group-[.has-update]:text-success">
              {{ t('pages.settings.update.newestVersion') }}
            </div>
            <div class="text-lg font-bold text-main group-[.has-update]:text-success">
              {{ latestVersion ? `${latestVersion}` : t('pages.settings.update.getting') }}
            </div>
          </div>
        </div>
        <div
          v-if="!needUpdate"
          class="flex items-center justify-center gap-2 rounded-lg p-4 text-sm font-semibold text-success"
        >
          <RefreshCw :size="18" />
          <span>{{ t('pages.settings.update.hasNewVersion') }}</span>
        </div>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelCheckVersion" />
        <CustomButton
          type="primary"
          :text="needUpdate ? t('pages.settings.update.updateNow') : t('common.confirm')"
          @click="confirmCheckVersion"
        />
      </template>
    </CustomModal>

    <!-- Advanced Rename Dialog -->
    <CustomModal
      v-if="advancedRenameVisible"
      v-model:visible="advancedRenameVisible"
      height="85vh"
      width="65vw"
      :title="t('pages.settings.upload.advancedRname')"
    >
      <div class="flex h-full w-full flex-col p-2">
        <SettingSection>
          <CustomSwitch
            v-model="advancedRename.enable"
            :title="t('pages.settings.upload.enableAdvancedRname')"
            :description="t('pages.settings.upload.enableAdvancedRnameDesc')"
          />
          <CustomInput
            v-model="advancedRename.format"
            :title="t('pages.settings.upload.advancedRnameFormat')"
            placeholder="Ex. {Y}-{m}-{uuid}"
          />
        </SettingSection>
        <div class="flex w-full flex-1 flex-col overflow-hidden p-2">
          <label class="text-xl font-bold text-secondary">{{ t('pages.settings.upload.availablePlaceholders') }}</label>
          <placeholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
        </div>
      </div>
    </CustomModal>

    <!-- Log Settings Dialog -->
    <CustomModal
      v-if="logFileVisible"
      v-model:visible="logFileVisible"
      height="auto"
      width="800px"
      :title="t('pages.settings.advanced.setLog')"
    >
      <div class="flex h-full w-full flex-col p-4">
        <SettingSection>
          <CustomInput
            v-model="formOfSetting.logFileSizeLimit"
            :title="t('pages.settings.advanced.logFileSize')"
            placeholder="10"
            type="number"
            min="1"
            max="1024"
            step="1"
          />
          <SettingCard>
            <MultiSelect
              v-model:choosed="formOfSetting.logLevel"
              :icon="FileText"
              :tight="false"
              :title="t('pages.settings.advanced.logLevel')"
              :zero-placeholder="t('pages.settings.advanced.logLevel')"
              :all-list="logLevel"
          /></SettingCard>
        </SettingSection>
      </div>
    </CustomModal>

    <!-- Server Settings Dialog -->
    <CustomModal
      v-if="serverVisible"
      v-model:visible="serverVisible"
      height="auto"
      width="600px"
      :title="t('pages.settings.advanced.uploadServer')"
    >
      <div class="flex w-full flex-col gap-4 p-4">
        <div
          class="mb-4 flex items-start gap-3 rounded-lg border border-border bg-success/10 px-4 py-3 text-sm leading-1.5 font-semibold text-secondary"
        >
          <span>{{ t('pages.settings.advanced.serverSettingsNotice') }}</span>
        </div>
        <SettingCard p1>
          <CustomSwitch v-model="server.enable" :title="t('pages.settings.advanced.enableServer')" no-border small />
        </SettingCard>
        <SettingSection v-if="server.enable">
          <SettingCard>
            <CustomInput
              v-model="server.host"
              type="text"
              :title="t('pages.settings.advanced.serverHost')"
              placeholder="127.0.0.1"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model="server.port"
              type="number"
              :min="1"
              :max="65535"
              :step="1"
              :title="t('pages.settings.advanced.serverPort')"
              placeholder="36677"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model="formOfSetting.serverKey"
              :is-password="true"
              :title="t('pages.settings.advanced.serverKey')"
              :placeholder="t('pages.settings.advanced.serverKeyPlaceholder')"
            />
          </SettingCard>
        </SettingSection>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelServerSetting" />
        <CustomButton type="primary" :text="t('common.confirm')" @click="confirmServerSetting" />
      </template>
    </CustomModal>

    <!-- Web Server Settings Dialog -->
    <CustomModal
      v-if="webServerVisible"
      v-model:visible="webServerVisible"
      height="auto"
      width="600px"
      :title="t('pages.settings.advanced.webServerSettings')"
    >
      <div class="flex w-full flex-col gap-4 p-4">
        <div
          class="mb-4 flex items-start gap-3 rounded-lg border border-border bg-success/10 px-4 py-3 text-sm leading-1.5 font-semibold text-secondary"
        >
          <span>{{ t('pages.settings.advanced.webServerNotice') }}</span>
        </div>
        <SettingCard p1>
          <CustomSwitch
            v-model="formOfSetting.enableWebServer"
            :title="t('pages.settings.advanced.enableWebServer')"
            no-border
            small
          />
        </SettingCard>
        <SettingSection
          v-if="formOfSetting.enableWebServer"
          :icon="Settings"
          :title="t('pages.settings.advanced.webServerConfig')"
        >
          <SettingCard>
            <CustomInput
              v-model="formOfSetting.webServerHost"
              type="text"
              :title="t('pages.settings.advanced.webServerHost')"
              placeholder="127.0.0.1"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model="formOfSetting.webServerPort"
              type="number"
              :min="1"
              :max="65535"
              :step="1"
              :title="t('pages.settings.advanced.webServerPort')"
              placeholder="37777"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model="formOfSetting.webServerPath"
              :title="t('pages.settings.advanced.webServerPath')"
              :placeholder="t('pages.settings.advanced.webServerPathPlaceholder')"
            />
          </SettingCard>
        </SettingSection>
      </div>
      <template #footer>
        <CustomButton type="primary" :text="t('common.confirm')" @click="confirmWebServerSetting" />
      </template>
    </CustomModal>

    <!-- Sync Configuration Dialog -->
    <CustomModal
      v-if="syncVisible"
      v-model:visible="syncVisible"
      height="auto"
      width="700px"
      :title="t('pages.settings.sync.syncEndpointConfig')"
    >
      <div class="flex w-full flex-col gap-4 p-4">
        <div class="p-2">
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="typeitem of syncType"
              :key="typeitem"
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-bg-tertiary px-2 py-4 hover:border-accent/50 hover:bg-accent/10 [.active]:border-accent [.active]:bg-accent/10 [.active]:text-accent [.active]:shadow-md"
              :class="{ active: sync.type === typeitem }"
              @click="sync.type = typeitem"
            >
              <GitBranch v-if="typeitem.includes('git')" class="text-secondary" :size="20" />
              <Store v-else-if="typeitem === 'webdav'" class="text-secondary" :size="20" />
              <span class="text-sm font-semibold text-secondary">{{
                typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1)
              }}</span>
            </button>
          </div>
        </div>

        <!-- Configuration Fields -->
        <div class="flex w-full flex-col gap-4">
          <SettingSection :icon="Settings" :title="sync.type">
            <SettingCard v-if="sync.type === 'gitea'">
              <CustomInput
                v-model.trim="sync.endpoint"
                :title="t('pages.settings.sync.giteaHost')"
                :placeholder="t('pages.settings.sync.giteaHost')"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomInput
                v-model.trim="sync.webdavEndpoint"
                :title="t('pages.settings.sync.webdavEndpoint')"
                :placeholder="t('pages.settings.sync.webdavEndpoint')"
              />
            </SettingCard>
            <template v-if="sync.type !== 'webdav'">
              <SettingCard v-for="inputItem in ['username', 'repo', 'branch', 'token']" :key="inputItem">
                <CustomInput
                  v-model.trim="sync[inputItem as any]"
                  :is-password="inputItem === 'token'"
                  :title="t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`)"
                  :placeholder="t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`)"
                />
              </SettingCard>
            </template>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomInput
                v-model.trim="sync.webdavUsername"
                :title="t('pages.settings.sync.webdav.username')"
                :placeholder="t('pages.settings.sync.webdav.username')"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomInput
                v-model.trim="sync.webdavPassword"
                :is-password="true"
                :title="t('pages.settings.sync.webdav.password')"
                :placeholder="t('pages.settings.sync.webdav.password')"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomInput
                v-model.trim="sync.webdavSavePath"
                :title="t('pages.settings.sync.webdav.savePath')"
                :placeholder="t('pages.settings.sync.webdav.savePath')"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomSelect
                v-model="sync.webdavAuthType"
                :select-list="[
                  { label: 'Basic', value: 'basic' },
                  { label: 'Digest', value: 'digest' },
                ]"
                :title="t('pages.settings.sync.webdav.authType')"
                :icon="Settings"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'webdav'">
              <CustomSwitch
                v-model="sync.webdavSslEnabled"
                small
                no-border
                :title="t('pages.settings.sync.webdav.enableSSL')"
                :description="t('pages.settings.sync.webdav.enableSSLDesc')"
              />
            </SettingCard>
            <SettingCard v-if="sync.type === 'github'">
              <CustomInput
                v-model.trim="sync.proxy"
                :title="t('pages.settings.sync.syncConfigProxy')"
                :placeholder="t('pages.settings.sync.syncConfigProxy')"
              />
            </SettingCard>
          </SettingSection>
        </div>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelSyncSetting" />
        <CustomButton type="primary" :text="t('common.confirm')" @click="confirmSyncSetting" />
      </template>
    </CustomModal>

    <!-- Upload/Download Config Dialog -->
    <CustomModal
      v-if="upDownConfigVisible"
      v-model:visible="upDownConfigVisible"
      height="auto"
      width="700px"
      :title="t('pages.settings.sync.upDownloadSettings')"
    >
      <div class="flex flex-col gap-6 p-4">
        <SettingSection :icon="CloudUpload" :title="t('pages.settings.sync.uploadSettings')">
          <CustomButton
            v-for="item in syncTaskList.slice(0, 3)"
            :key="item.task"
            type="secondary"
            :icon="CloudUpload"
            :text="item.label"
            @click="syncTaskFn(item.task, item.number)"
          />
        </SettingSection>
        <SettingSection :icon="Download" :title="t('pages.settings.sync.downloadSettings')">
          <CustomButton
            v-for="item in syncTaskList.slice(3, 6)"
            :key="item.task"
            type="secondary"
            :icon="Download"
            :text="item.label"
            @click="syncTaskFn(item.task, item.number)"
          />
        </SettingSection>
        <SettingSection :icon="ImageIcon" :title="t('pages.settings.sync.galleryDB')">
          <CustomButton
            v-for="item in syncTaskList.slice(6, 7)"
            :key="item.task"
            type="secondary"
            :icon="ImageIcon"
            :text="item.label"
            @click="syncTaskFn(item.task, item.number)"
          />
        </SettingSection>
      </div>
    </CustomModal>

    <!-- Image Process Dialog -->
    <CustomModal
      v-if="imageProcessDialogVisible"
      v-model:visible="imageProcessDialogVisible"
      :title="t('pages.imageProcess.title')"
      :description="t('pages.imageProcess.subtitle-Global')"
    >
      <ImageProcessSetting :config-id="''" :current-picbed-name="''" />
    </CustomModal>

    <CustomModal v-if="editorVisible" v-model:visible="editorVisible" :title="t('common.edit')">
      <Editor v-model="editorContent" :language="editorLanguage" />
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="editorVisible = false" />
        <CustomButton type="primary" :text="t('common.save')" @click="saveEditorContent" />
      </template>
    </CustomModal>
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
  Edit2,
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
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import placeholderTable from '@/components/common/PlaceholderTable.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import Editor from '@/components/Editor.vue'
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
const editorVisible = ref(false)
const editorContent = ref('// 在这里开始编写代码...\nfunction hello() {\n  console.log("Hello Electron!");\n}')
const editorLanguage = ref('json')
const currentEditFile = ref('')

const latestVersion = ref('')
const releaseNotes = ref('')
const releaseNotesError = ref('')
const releaseNotesLastFetch = ref<Date | null>(null)
const fetchingReleaseNotes = ref(false)
const mainWindowSizeVisible = ref(false)
const advancedRenameVisible = ref(false)
const imageProcessDialogVisible = ref(false)
const rawPicGoSize = ref(false)
const customLink = ref('![$fileName]($url)')
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

const logLevel = [
  { type: 'all', name: t('pages.settings.advanced.logLevelList.all') },
  { type: 'success', name: t('pages.settings.advanced.logLevelList.success') },
  { type: 'error', name: t('pages.settings.advanced.logLevelList.error') },
  { type: 'info', name: t('pages.settings.advanced.logLevelList.info') },
  { type: 'warn', name: t('pages.settings.advanced.logLevelList.warn') },
  { type: 'none', name: t('pages.settings.advanced.logLevelList.none') },
]

const syncType = ['github', 'gitee', 'gitea', 'webdav']
const version = pkg.version

const buildInThemesList = [
  'adwaita.css',
  'anime.css',
  'bilibili.css',
  'Catppucin.css',
  'CoolApk.css',
  'Cupertino.css',
  'default.css',
  'goldensand.css',
  'Huorong.css',
  'purple.css',
  'wechat.css',
  'win11.css',
]

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

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

const placeholderList = [
  {
    code: '$url',
    description: 'urlPlaceholder',
  },
  {
    code: '$fileName',
    description: 'fileNamePlaceholder',
  },
  {
    code: '$extName',
    description: 'extNamePlaceholder',
  },
]

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

  watch(
    advancedRename,
    newVal => {
      saveConfig(configPaths.buildIn.rename, toRaw(newVal))
      if (newVal.enable) {
        formOfSetting.value.autoRename = false
        saveConfig(configPaths.settings.autoRename, false)
      }
    },
    { deep: true },
  )

  watch(
    () => formOfSetting.value.mainWindowWidth,
    newVal => {
      const width = enforceNumber(newVal)
      saveConfig({ [configPaths.settings.mainWindowWidth]: rawPicGoSize.value ? 800 : Math.max(width, 100) })
    },
  )

  watch(
    () => formOfSetting.value.mainWindowHeight,
    newVal => {
      const height = enforceNumber(newVal)
      saveConfig({ [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : Math.max(height, 100) })
    },
  )

  watch(rawPicGoSize, newVal => {
    if (newVal) {
      formOfSetting.value.mainWindowWidth = 800
      formOfSetting.value.mainWindowHeight = 450
    }
  })

  watch(customLink, newVal => {
    saveConfig(configPaths.settings.customLink, newVal)
  })

  watch(proxy, value => {
    saveConfig({ 'picBed.proxy': value })
  })

  watch(
    () => formOfSetting.value.logFileSizeLimit,
    newVal => {
      const size = enforceNumber(newVal)
      if (size < 1) {
        formOfSetting.value.logFileSizeLimit = 1
        saveConfig({ [configPaths.settings.logFileSizeLimit]: 1 })
      } else {
        saveConfig({ [configPaths.settings.logFileSizeLimit]: size })
      }
    },
  )

  watch(
    () => formOfSetting.value.logLevel,
    newVal => {
      if (newVal.length === 0) {
        message.error(t('pages.settings.advanced.chooseLogLevel'))
        return
      }
      saveConfig({
        [configPaths.settings.logLevel]: newVal,
      })
    },
  )
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

async function handleEditTheme() {
  try {
    const themeContent = await window.electron.triggerRPC<string>(IRPCActionType.THEME_READ_THEME, currentTheme.value)
    editorContent.value = themeContent || ''
    currentEditFile.value = currentTheme.value
    editorLanguage.value = 'css'
    editorVisible.value = true
  } catch (error) {
    console.error('Failed to open theme folder:', error)
    message.error(t('pages.settings.system.getThemeContentFailed'))
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

function handleIsDisableGPUChange(value: boolean | undefined) {
  if (value === undefined) return
  message.info(t('pages.settings.system.needRestart'))
  saveConfig({ [configPaths.settings.isDisableGPU]: value })
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
  currentStartMode.value =
    settings.startMode !== undefined
      ? settings.startMode
      : osGlobal.value === 'win32'
        ? ISartMode.MAIN
        : ISartMode.QUIET
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

async function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

async function editFile(file: string) {
  const content = (await window.electron.triggerRPC<string>(IRPCActionType.READ_FILE_CONTENT, file)) || ''
  try {
    editorContent.value = JSON.stringify(JSON.parse(content), null, 2)
  } catch (error) {
    editorContent.value = content
  }
  currentEditFile.value = file
  editorLanguage.value = 'json'
  editorVisible.value = true
}

async function saveEditorContent() {
  if (currentEditFile.value === 'data.json' || currentEditFile.value === 'manage.json') {
    const content = editorContent.value.trim()
    await saveFile(currentEditFile.value, content)
  } else if (currentEditFile.value.endsWith('.css')) {
    try {
      let themeFileName
      if (buildInThemesList.includes(currentTheme.value)) {
        themeFileName = `custom-${currentTheme.value}`
      } else {
        themeFileName = currentTheme.value
      }
      window.electron.sendRPC(IRPCActionType.THEME_WRITE_THEME, themeFileName, editorContent.value)
      message.success(t('pages.settings.advanced.saveFileSuccess'))
      setTimeout(async () => {
        await loadThemes()
        await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, themeFileName)
      }, 1000)
    } catch (error) {
      console.error('Failed to save theme:', error)
      message.error(t('pages.settings.advanced.saveFileFailed'))
    }
  }

  editorVisible.value = false
}

async function saveFile(file: string, content: string) {
  let dataToSave = content
  try {
    dataToSave = JSON.stringify(JSON.parse(content), null, 2)
  } catch (error) {
    console.error('Invalid JSON content:', error)
    message.error(t('pages.settings.advanced.invalidJson'))
    return
  }
  try {
    window.electron.sendRPC(IRPCActionType.WRITE_FILE_CONTENT, file, dataToSave)
    message.success(t('pages.settings.advanced.saveFileSuccess'))
    setTimeout(() => {
      window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
    }, 1000)
  } catch (error) {
    console.error('Failed to save file:', error)
    message.error(t('pages.settings.advanced.saveFileFailed'))
  }
}

function openDirectory(directory?: string, inStorePath = true) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath)
}

function openLogSetting() {
  logFileVisible.value = true
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

function handleMiniWindowOntop(val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.miniWindowOntop, val)
  window.electron.sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val)
}

async function handleMiniIconPath() {
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
