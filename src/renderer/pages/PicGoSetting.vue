<template>
  <div id="piclist-setting">
    <el-row class="view-title" align="middle" justify="center">
      {{ $T('PICLIST_SETTINGS') }} -
      <el-icon class="el-icon-document" @click="goConfigPage">
        <Reading />
      </el-icon>
    </el-row>
    <el-tabs
      v-model="activeName"
      stretch
      style="height: calc(100vh - 50px); width: 100%; overflow-x: hidden; top: 50px; position: absolute"
      tab-position="left"
      lazy
    >
      <el-tab-pane
        name="system"
        :label="$T('SETTINGS_TAB_SYSTEM')"
        style="height: 100%; overflow-y: scroll; height: calc(100vh - 50px); color: #fff"
      >
        <el-row class="setting-list">
          <el-col :span="22" :offset="1">
            <el-row style="width: 100%">
              <el-form label-position="left" label-width="50%" size="small">
                <el-form-item :label="$T('SETTINGS_CHOOSE_LANGUAGE')">
                  <el-select
                    v-model="currentLanguage"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')"
                    :persistent="false"
                    teleported
                    @change="handleLanguageChange"
                  >
                    <el-option v-for="item in languageList" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_START_MODE')">
                  <el-select
                    v-model="currentStartMode"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_START_MODE')"
                    :persistent="false"
                    teleported
                    @change="handleStartModeChange"
                  >
                    <el-option key="quiet" :label="$T('SETTINGS_START_MODE_QUIET')" :value="'quiet'" />
                    <el-option
                      v-if="osGlobal !== 'darwin'"
                      key="mini"
                      :label="$T('SETTINGS_START_MODE_MINI')"
                      :value="'mini'"
                    />
                    <el-option
                      v-if="osGlobal === 'darwin'"
                      key="no-tray"
                      :label="$T('SETTINGS_START_MODE_NO_TRAY')"
                      :value="'no-tray'"
                    />
                    <el-option key="main" :label="$T('SETTINGS_START_MODE_MAIN')" :value="'main'" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="$T('MANUAL_PAGE_OPEN_SETTING_TIP')">
                  <el-select
                    v-model="currentManualPageOpen"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('MANUAL_PAGE_OPEN_SETTING_TIP')"
                    :persistent="false"
                    teleported
                    @change="handleManualPageOpenChange"
                  >
                    <el-option
                      v-for="item in manualPageOpenList"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="osGlobal === 'darwin'" :label="$T('SETTINGS_ISHIDEDOCK')">
                  <el-switch
                    v-model="formOfSetting.isHideDock"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleHideDockChange"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_MAIN_WINDOW_SIZE')">
                  <el-button type="primary" round size="small" @click="mainWindowSizeVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item v-if="osGlobal !== 'darwin'" :label="$T('SETTINGS_CLOSE_MINI_WINDOW_SYNC')">
                  <el-switch
                    v-model="formOfSetting.autoCloseMiniWindow"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item v-if="osGlobal !== 'darwin'" :label="$T('SETTINGS_CLOSE_MAIN_WINDOW_SYNC')">
                  <el-switch
                    v-model="formOfSetting.autoCloseMainWindow"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item v-if="osGlobal !== 'darwin'" :label="$T('SETTINGS_MINI_WINDOW_ON_TOP')">
                  <el-switch
                    v-model="formOfSetting.miniWindowOntop"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleMiniWindowOntop"
                  />
                </el-form-item>
                <el-form-item v-if="osGlobal !== 'darwin'" :label="$T('SETTINGS_CUSTOM_MINI_ICON')">
                  <el-switch
                    v-model="formOfSetting.isCustomMiniIcon"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="osGlobal !== 'darwin' && formOfSetting.isCustomMiniIcon"
                  :label="$T('SETTINGS_CUSTOM_MINI_ICON_PATH')"
                >
                  <el-button type="primary" round size="small" @click="handleMiniIconPath">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_LAUNCH_ON_BOOT')">
                  <el-switch
                    v-model="formOfSetting.autoStart"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoStartChange"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_SHORTCUT')">
                  <el-button type="primary" round size="small" @click="goShortCutPage">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        name="syncAndConfigure"
        :label="$T('SETTINGS_TAB_SYNC_CONFIG')"
        style="height: 100%; overflow-y: scroll; height: calc(100vh - 50px); color: #fff"
      >
        <el-row class="setting-list">
          <el-col :span="22" :offset="1">
            <el-row style="width: 100%">
              <el-form label-position="left" label-width="50%" size="small">
                <el-form-item :label="$T('SETTINGS_SYNC_CONFIG')">
                  <el-button type="primary" round size="small" @click="syncVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_UP_DOWN_DESC')">
                  <el-button type="primary" round size="small" @click="upDownConfigVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_MIGRATE_FROM_PICGO')">
                  <el-button type="primary" round size="small" @click="handleMigrateFromPicGo">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_OPEN_CONFIG_FILE')">
                  <el-button type="primary" round size="small" @click="openFile('data.json')">
                    {{ $T('SETTINGS_CLICK_TO_OPEN') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_CONFIG_FILE_PATH')">
                  <el-button type="primary" round size="small" @click="openDirectory()">
                    {{ $T('SETTINGS_CLICK_TO_OPEN') }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        name="upload"
        :label="$T('SETTINGS_TAB_UPLOAD')"
        style="height: 100%; overflow-y: scroll; height: calc(100vh - 50px); color: #fff"
      >
        <el-row class="setting-list">
          <el-col :span="22" :offset="1">
            <el-row style="width: 100%">
              <el-form label-position="left" label-width="50%" size="small">
                <el-form-item :label="$T('SETTINGS_AUTO_IMPORT')">
                  <el-switch
                    v-model="formOfSetting.autoImport"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item v-if="formOfSetting.autoImport" :label="$T('SETTINGS_AUTO_IMPORT_SELECT_PICBED')">
                  <el-select
                    v-model="formOfSetting.autoImportPicBed"
                    multiple
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_AUTO_IMPORT_SELECT_PICBED')"
                    :persistent="false"
                    teleported
                  >
                    <el-option v-for="item in picBedGlobal" :key="item.type" :label="item.name" :value="item.type" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_ENABLE_SECOND_PICBED')">
                  <el-switch
                    v-model="formOfSetting.enableSecondUploader"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_SECOND_PICBED')">
                  <el-button type="primary" round size="small" @click="handleChangeSecondPicBed">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SYNC_DELETE_CLOUD')">
                  <el-switch
                    v-model="formOfSetting.deleteCloudFile"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_OPEN_UPLOAD_TIPS')">
                  <el-switch
                    v-model="formOfSetting.uploadNotification"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_OPEN_UPLOAD_RESULT_TIPS')">
                  <el-switch
                    v-model="formOfSetting.uploadResultNotification"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_COMPRESS_AND_WATERMARK')">
                  <el-button type="primary" round size="small" @click="imageProcessDialogVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_RENAME_BEFORE_UPLOAD')">
                  <el-switch
                    v-model="formOfSetting.rename"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_TIMESTAMP_RENAME')">
                  <el-switch
                    v-model="formOfSetting.autoRename"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_ADVANCED_RENAME')">
                  <el-button type="primary" round size="small" @click="advancedRenameVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_DELETE_LOCAL_FILE_AFTER_UPLOAD')">
                  <el-switch
                    v-model="formOfSetting.deleteLocalFile"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD')">
                  <el-switch
                    v-model="formOfSetting.autoCopy"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_CUSTOM_LINK_FORMAT')">
                  <el-button type="primary" round size="small" @click="customLinkVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SHORT_URL')">
                  <el-switch
                    v-model="formOfSetting.useShortUrl"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item v-if="formOfSetting.useShortUrl" :label="$T('SETTINGS_SHORT_URL_SERVER')">
                  <el-select
                    v-model="currentShortUrlServer"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_SERVER')"
                    :persistent="false"
                    teleported
                    @change="handleShortUrlServerChange"
                  >
                    <el-option
                      v-for="item in shortUrlServerList"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'c1n'"
                  :label="$T('SETTINGS_SHORT_URL_C1N_TOKEN')"
                >
                  <el-input
                    v-model="formOfSetting.c1nToken"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_C1N_TOKEN')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'yourls'"
                  :label="$T('SETTINGS_SHORT_URL_YOURLS_DOMAIN')"
                >
                  <el-input
                    v-model="formOfSetting.yourlsDomain"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_YOURLS_DOMAIN')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'yourls'"
                  :label="$T('SETTINGS_SHORT_URL_YOURLS_SIGNATURE')"
                >
                  <el-input
                    v-model="formOfSetting.yourlsSignature"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_YOURLS_SIGNATURE')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'cf_worker'"
                  :label="$T('SETTINGS_SHORT_URL_CF_WORKER_HOST')"
                >
                  <el-input
                    v-model="formOfSetting.cfWorkerHost"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_CF_WORKER_HOST')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'sink'"
                  :label="$T('SETTINGS_SHORT_SINK_DOMAIN')"
                >
                  <el-input
                    v-model="formOfSetting.sinkDomain"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_SINK_DOMAIN')"
                  />
                </el-form-item>
                <el-form-item
                  v-if="formOfSetting.useShortUrl && formOfSetting.shortUrlServer === 'sink'"
                  :label="$T('SETTINGS_SHORT_SINK_TOKEN')"
                >
                  <el-input
                    v-model="formOfSetting.sinkToken"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_SINK_TOKEN')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_ENCODE_OUTPUT_URL')">
                  <el-switch
                    v-model="formOfSetting.encodeOutputURL"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item>
                  <template #label>
                    <el-row align="middle">
                      {{ $T('SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD') }}
                      <el-tooltip
                        class="item"
                        effect="dark"
                        :content="$T('BUILTIN_CLIPBOARD_TIPS')"
                        placement="right"
                        :persistent="false"
                        teleported
                      >
                        <el-icon style="margin-left: 4px">
                          <InfoFilled />
                        </el-icon>
                      </el-tooltip>
                    </el-row>
                  </template>
                  <el-switch
                    v-model="formOfSetting.useBuiltinClipboard"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_WATCH_CLIPBOARD')">
                  <el-switch
                    v-model="formOfSetting.isAutoListenClipboard"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
                <el-form-item :style="{ marginRight: '-64px' }" :label="$T('CHOOSE_SHOWED_PICBED')">
                  <el-checkbox-group v-model="showPicBedList" @change="handleShowPicBedListChange">
                    <el-checkbox v-for="item in picBedGlobal" :key="item.name" :label="item.name" :value="item.name" />
                  </el-checkbox-group>
                </el-form-item>
                <el-divider border-style="none" />
                <el-form-item />
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        name="advanced"
        :label="$T('SETTINGS_TAB_ADVANCED')"
        style="height: 100%; overflow-y: scroll; height: calc(100vh - 50px); color: #fff"
      >
        <el-row class="setting-list">
          <el-col :span="22" :offset="1">
            <el-row style="width: 100%">
              <el-form label-position="left" label-width="50%" size="small">
                <el-form-item :label="$T('SETTINGS_LOG_FILE_PATH')">
                  <el-button type="primary" round size="small" @click="openDirectory()">
                    {{ $T('SETTINGS_CLICK_TO_OPEN') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_LOG_FILE')">
                  <el-button type="primary" round size="small" @click="openLogSetting">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_PROXY_AND_MIRROR')">
                  <el-button type="primary" round size="small" @click="proxyVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_WEB_SERVER')">
                  <el-button type="primary" round size="small" @click="webServerVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_SERVER')">
                  <el-button type="primary" round size="small" @click="serverVisible = true">
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_SET_SERVER_AES_KEY')">
                  <el-input
                    v-model.trim="formOfSetting.aesPassword"
                    type="input"
                    :placeholder="$T('SETTINGS_SET_SERVER_AES_KEY')"
                    size="small"
                    style="width: 50%"
                    @change="handleAesPasswordChange"
                  />
                </el-form-item>
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        name="upadte"
        :label="$T('SETTINGS_TAB_UPDATE')"
        style="height: 100%; overflow-y: scroll; height: calc(100vh - 50px)"
      >
        <el-row class="setting-list">
          <el-col :span="22" :offset="1">
            <el-row style="width: 100%">
              <el-form label-position="left" label-width="50%" size="small">
                <el-form-item :label="$T('SETTINGS_CHECK_UPDATE')">
                  <el-button type="primary" round size="small" @click="checkUpdate">
                    {{ $T('SETTINGS_CLICK_TO_CHECK') }}
                  </el-button>
                </el-form-item>
                <el-form-item :label="$T('SETTINGS_OPEN_UPDATE_HELPER')">
                  <el-switch
                    v-model="formOfSetting.showUpdateTip"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                  />
                </el-form-item>
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
    <el-dialog
      v-model="customLinkVisible"
      :title="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
      :modal-append-to-body="false"
      center
      draggable
      append-to-body
    >
      <el-form ref="$customLink" label-position="top" :model="customLink" :rules="rules" size="small">
        <el-form-item prop="value">
          <div class="custom-title">
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_URL') }}
            <br />
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_FILENAME') }}
            <br />
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_EXTNAME') }}
          </div>
          <el-input v-model="customLink.value" class="align-center" :autofocus="true" />
        </el-form-item>
      </el-form>
      <div>{{ $T('SETTINGS_TIPS_SUCH_AS') }}[$fileName]($url)</div>
      <template #footer>
        <el-button round @click="cancelCustomLink">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmCustomLink">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="proxyVisible"
      :title="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
      :modal-append-to-body="false"
      width="70%"
      center
      draggable
      append-to-body
    >
      <el-form label-position="right" label-width="120px">
        <el-form-item :label="$T('SETTINGS_UPLOAD_PROXY')">
          <el-input
            v-model="proxy"
            clearable
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_PLUGIN_INSTALL_PROXY')">
          <el-input
            v-model="formOfSetting.proxy"
            clearable
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_PLUGIN_INSTALL_MIRROR')">
          <el-input
            v-model="formOfSetting.registry"
            clearable
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：https://registry.npmmirror.com`"
          />
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog
      v-model="mainWindowSizeVisible"
      :title="$T('SETTINGS_MAIN_WINDOW_SIZE')"
      :modal-append-to-body="false"
      width="70%"
      center
      draggable
      append-to-body
    >
      <el-form label-position="right" label-width="120px">
        <el-form-item :label="$T('SETTINGS_MAIN_WINDOW_SIZE_WIDTH')">
          <el-input
            v-model="formOfSetting.mainWindowWidth"
            :autofocus="true"
            :placeholder="$T('SETTINGS_MAIN_WINDOW_WIDTH_HINT')"
          />
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_MAIN_WINDOW_SIZE_HEIGHT')">
          <el-input
            v-model="formOfSetting.mainWindowHeight"
            :autofocus="true"
            :placeholder="$T('SETTINGS_MAIN_WINDOW_HEIGHT_HINT')"
          />
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_RAW_PICGO_SIZE')">
          <el-switch v-model="rawPicGoSize" :active-text="$T('SETTINGS_OPEN')" :inactive-text="$T('SETTINGS_CLOSE')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="cancelWindowSize">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmWindowSize">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="checkUpdateVisible"
      :title="$T('SETTINGS_CHECK_UPDATE')"
      :modal-append-to-body="false"
      center
      draggable
      append-to-body
    >
      <div>{{ $T('SETTINGS_CURRENT_VERSION') }}: {{ version }}</div>
      <div>
        {{ $T('SETTINGS_NEWEST_VERSION') }}:
        {{ latestVersion ? latestVersion : `${$T('SETTINGS_GETING')}...` }}
      </div>
      <div v-if="needUpdate">
        {{ $T('SETTINGS_TIPS_HAS_NEW_VERSION') }}
      </div>
      <template #footer>
        <el-button round @click="cancelCheckVersion">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmCheckVersion">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="advancedRenameVisible"
      :title="$T('SETTINGS_ADVANCED_RENAME')"
      center
      align-center
      draggable
      destroy-on-close
      append-to-body
    >
      <el-link :underline="false" style="margin-bottom: 10px">
        {{ $T('SETTINGS_ADVANCED_RENAME_ENABLE') }}
      </el-link>
      <br />
      <el-switch
        v-model="advancedRename.enable"
        :active-text="$T('SETTINGS_OPEN')"
        :inactive-text="$T('SETTINGS_CLOSE')"
      />
      <br />
      <el-link :underline="false" style="margin-bottom: 10px; margin-top: 10px">
        <span>
          {{ $T('SETTINGS_ADVANCED_RENAME_FORMAT') }}
          <el-popover effect="light" placement="right" width="350" :persistent="false" teleported>
            <template #reference>
              <el-icon color="#409EFF">
                <InfoFilled />
              </el-icon>
            </template>
            <el-descriptions :column="1" style="width: 320px" border>
              <el-descriptions-item
                v-for="(item, index) in buildInRenameFormatTable"
                :key="index"
                :label="item.placeholder"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.description }}
              </el-descriptions-item>
              <el-descriptions-item
                v-for="(item, index) in buildInRenameFormatTable.slice(0, buildInRenameFormatTable.length - 1)"
                :key="index"
                :label="item.placeholderB"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.descriptionB }}
              </el-descriptions-item>
            </el-descriptions>
          </el-popover>
        </span>
      </el-link>
      <el-input v-model="advancedRename.format" placeholder="Ex. {Y}-{m}-{uuid}" clearable />
      <div style="margin-top: 10px; align-items: center; display: flex; justify-content: flex-end">
        <el-button type="danger" style="margin-right: 30px" plain :icon="Close" @click="handleCancelAdvancedRename">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" plain :icon="Edit" @click="handleSaveAdvancedRename">
          {{ $T('CONFIRM') }}
        </el-button>
      </div>
    </el-dialog>
    <el-dialog
      v-model="logFileVisible"
      :title="$T('SETTINGS_SET_LOG_FILE')"
      :modal-append-to-body="false"
      width="500px"
      center
      draggable
      append-to-body
    >
      <el-form label-position="right" label-width="150px">
        <el-form-item :label="$T('SETTINGS_LOG_FILE')">
          <el-button type="primary" round size="small" @click="openFile('piclist.log')">
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_GUI_LOG_FILE')">
          <el-button type="primary" round size="small" @click="openFile('piclist-gui-local.log')">
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_MANAGE_LOG_FILE')">
          <el-button type="primary" round size="small" @click="openFile('manage.log')">
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_LOG_LEVEL')">
          <el-select
            v-model="formOfSetting.logLevel"
            multiple
            collapse-tags
            style="width: 100%"
            :persistent="false"
            teleported
          >
            <el-option
              v-for="(value, key) of logLevel"
              :key="key"
              :label="value"
              :value="key"
              :disabled="handleLevelDisabled(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="`${$T('SETTINGS_LOG_FILE_SIZE')} (MB)`">
          <el-input-number
            v-model="formOfSetting.logFileSizeLimit"
            style="width: 100%"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：10`"
            :controls="false"
            :min="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="cancelLogLevelSetting">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmLogLevelSetting">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="serverVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SET_PICGO_SERVER')"
      :modal-append-to-body="false"
      center
      draggable
      append-to-body
    >
      <div class="notice-text">
        {{ $T('SETTINGS_TIPS_SERVER_NOTICE') }}
      </div>
      <el-form label-position="right" label-width="120px">
        <el-form-item :label="$T('SETTINGS_ENABLE_SERVER')">
          <el-switch v-model="server.enable" :active-text="$T('SETTINGS_OPEN')" :inactive-text="$T('SETTINGS_CLOSE')" />
        </el-form-item>
        <template v-if="server.enable">
          <el-form-item :label="$T('SETTINGS_SET_SERVER_HOST')">
            <el-input v-model="server.host" type="input" :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_HOST')" />
          </el-form-item>
          <el-form-item :label="$T('SETTINGS_SET_SERVER_PORT')">
            <el-input v-model="server.port" type="number" :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_PORT')" />
          </el-form-item>
          <el-form-item :label="$T('SETTINGS_SET_SERVER_KEY')">
            <el-input
              v-model="formOfSetting.serverKey"
              type="input"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_KEY')"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button round @click="cancelServerSetting">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmServerSetting">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="webServerVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SET_WEB_SERVER')"
      :modal-append-to-body="false"
      align-center
      draggable
      append-to-body
      @close="confirmWebServerSetting"
    >
      <div class="notice-text">
        {{ $T('SETTINGS_TIPS_WEB_SERVER_NOTICE') }}
      </div>
      <el-form label-position="right" label-width="180px">
        <el-form-item :label="$T('SETTINGS_SET_ENABLE_WEB_SERVER')">
          <el-switch
            v-model="formOfSetting.enableWebServer"
            :active-text="$T('SETTINGS_OPEN')"
            :inactive-text="$T('SETTINGS_CLOSE')"
          />
        </el-form-item>
        <template v-if="formOfSetting.enableWebServer">
          <el-form-item :label="$T('SETTINGS_SET_WEB_SERVER_HOST')">
            <el-input
              v-model="formOfSetting.webServerHost"
              type="input"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_WEB_HOST')"
            />
          </el-form-item>
          <el-form-item :label="$T('SETTINGS_SET_WEB_SERVER_PORT')">
            <el-input-number
              v-model="formOfSetting.webServerPort"
              :min="1"
              :max="65535"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_WEB_PORT')"
              @change="handleWebServerPortChange"
            />
          </el-form-item>
          <el-form-item :label="$T('SETTINGS_SET_WEB_SERVER_PATH')">
            <el-input
              v-model="formOfSetting.webServerPath"
              type="input"
              :placeholder="$T('SETTINGS_SET_WEB_SERVER_PATH')"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-dialog>
    <el-dialog
      v-model="syncVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SYNC_CONFIG_TITLE')"
      :modal-append-to-body="false"
      center
      draggable
      append-to-body
    >
      <div class="notice-text">
        {{ $T('SETTINGS_SYNC_CONFIG_NOTE') }}
      </div>
      <el-form label-position="right" label-width="120px">
        <el-form-item :label="$T('SETTINGS_SYNC_CONFIG_SELECT_TYPE')">
          <el-select v-model="sync.type" style="width: 100%" :persistent="false" teleported>
            <el-option
              v-for="typeitem of syncType"
              :key="typeitem"
              :label="typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1)"
              :value="typeitem"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="sync.type === 'gitea'" :label="$T('SETTINGS_SYNC_CONFIG_GITEA_HOST')">
          <el-input v-model.trim="sync.endpoint" type="input" :placeholder="$T('SETTINGS_SYNC_CONFIG_GITEA_HOST')" />
        </el-form-item>
        <el-form-item
          v-for="inputItem in ['username', 'repo', 'branch', 'token']"
          :key="inputItem"
          :label="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_${inputItem.toUpperCase()}` as any)"
        >
          <el-input
            v-model.trim="sync[inputItem as any]"
            type="input"
            :placeholder="
              $T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_${inputItem.toUpperCase()}_PLACEHOLDER` as any)
            "
          />
        </el-form-item>
        <el-form-item v-if="sync.type === 'github'" :label="$T('SETTINGS_SYNC_CONFIG_PROXY')">
          <el-input
            v-model.trim="sync.proxy"
            type="input"
            :placeholder="$T('SETTINGS_SYNC_CONFIG_PROXY_PLACEHOLDER')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="cancelSyncSetting">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="confirmSyncSetting">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="upDownConfigVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_UP_DOWN_DESC')"
      :modal-append-to-body="false"
      center
      draggable
      append-to-body
    >
      <el-form label-position="right" label-width="120px">
        <el-form-item :label="$T('SETTINGS_SYNC_UPLOAD')">
          <el-button-group>
            <el-button
              v-for="item in syncTaskList.slice(0, 3)"
              :key="item.task"
              type="primary"
              plain
              size="small"
              @click="syncTaskFn(item.task, item.number)"
            >
              {{ item.label }}
            </el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item :label="$T('SETTINGS_SYNC_DOWNLOAD')">
          <el-button-group>
            <el-button
              v-for="item in syncTaskList.slice(3)"
              :key="item.task"
              type="primary"
              plain
              size="small"
              @click="syncTaskFn(item.task, item.number)"
            >
              {{ item.label }}
            </el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog
      v-model="imageProcessDialogVisible"
      :title="$T('UPLOAD_PAGE_IMAGE_PROCESS_DIALOG_TITLE')"
      width="50%"
      draggable
      center
      align-center
      append-to-body
    >
      <ImageProcessSetting v-model="imageProcessDialogVisible" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { compare } from 'compare-versions'
import { ElForm, ElMessage as $message, ElMessage, ElMessageBox, FormRules } from 'element-plus'
import { Reading, Close, Edit, InfoFilled } from '@element-plus/icons-vue'
import { IConfig } from 'piclist'
import { computed, onBeforeMount, reactive, ref, toRaw, watch } from 'vue'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import { i18nManager, T as $T } from '@/i18n/index'
import { buildInRenameFormatTable } from '@/manage/utils/common'
import { SHORTKEY_PAGE } from '@/router/config'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { osGlobal, picBedGlobal, updatePicBedGlobal } from '@/utils/global'

import { II18nLanguage, IRPCActionType, ISartMode } from '#/types/enum'
import { enforceNumber } from '#/utils/common'
import { configPaths, ISartModeValues } from '#/utils/configPaths'
import { getLatestVersion } from '#/utils/getLatestVersion'

import pkg from 'root/package.json'
import { sendRPC, triggerRPC } from '@/utils/common'

const $router = useRouter()
const activeName = ref<'system' | 'syncAndConfigure' | 'upload' | 'advanced' | 'upadte'>('system')

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

const languageList = i18nManager.languageList.map(item => ({
  label: item.label,
  value: item.value
}))

const startModeList = Object.values(ISartMode).map(item => ({
  label: $T(`SETTINGS_START_MODE_${item.toUpperCase().replace(/-/g, '_')}` as any),
  value: item
}))

const manualPageOpenList = [
  {
    label: $T('MANUAL_PAGE_OPEN_BY_BUILD_IN'),
    value: 'window'
  },
  {
    label: $T('MANUAL_PAGE_OPEN_BY_BROWSER'),
    value: 'browser'
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

const customLinkRule = (_: any, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value) && !/\$fileName/.test(value) && !/\$extName/.test(value)) {
    return callback(new Error($T('TIPS_MUST_CONTAINS_URL')))
  } else {
    return callback()
  }
}

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
const currentManualPageOpen = ref()
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

const rules = reactive<FormRules>({
  value: [{ validator: customLinkRule, trigger: 'blur' }]
})

const logLevel = {
  all: $T('SETTINGS_LOG_LEVEL_ALL'),
  success: $T('SETTINGS_LOG_LEVEL_SUCCESS'),
  error: $T('SETTINGS_LOG_LEVEL_ERROR'),
  info: $T('SETTINGS_LOG_LEVEL_INFO'),
  warn: $T('SETTINGS_LOG_LEVEL_WARN'),
  none: $T('SETTINGS_LOG_LEVEL_NONE')
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
  interval: 60
})

const syncType = ['github', 'gitee', 'gitea']

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
    interval: 60
  }
}

function confirmSyncSetting() {
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

async function initData() {
  const config = (await getConfig<IConfig>()) || ({} as IConfig)
  const settings = config.settings || {}
  const picBed = config.picBed
  formKeys.forEach(key => {
    ;(formOfSetting.value as any)[key] = settings[key] ?? formOfSetting.value[key]
  })
  formOfSetting.value.logLevel = initArray(settings.logLevel || [], ['all'])
  formOfSetting.value.autoImportPicBed = initArray(settings.autoImportPicBed || [], [])
  currentLanguage.value = valueToOptionItem(settings.language || 'zh-CN', languageList)
  currentStartMode.value = valueToOptionItem(settings.startMode || ISartMode.QUIET, startModeList)
  if (osGlobal.value === 'darwin' && currentStartMode.value.value === ISartMode.MINI) {
    currentStartMode.value = valueToOptionItem(ISartMode.QUIET, startModeList)
    saveConfig(configPaths.settings.startMode, ISartMode.QUIET)
  }
  currentManualPageOpen.value = valueToOptionItem(settings.manualPageOpen || 'window', manualPageOpenList)
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
    interval: 60
  }
  formOfSetting.value.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
  addProxyWatch()
  addWatch()
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
  sendRPC(IRPCActionType.SHOW_SECOND_UPLOADER_MENU)
}

function openFile(file: string) {
  sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

function handleManualPageOpenChange(val: string) {
  saveConfig({
    [configPaths.settings.manualPageOpen]: val
  })
}

function openDirectory(directory?: string, inStorePath = true) {
  sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath)
}

function openLogSetting() {
  logFileVisible.value = true
}

async function cancelCustomLink() {
  customLinkVisible.value = false
  customLink.value = (await getConfig<string>(configPaths.settings.customLink)) || '![$fileName]($url)'
}

function confirmCustomLink() {
  $customLink.value?.validate((valid: boolean) => {
    if (valid) {
      saveConfig(configPaths.settings.customLink, customLink.value)
      customLinkVisible.value = false
    }
  })
}

async function handleCancelAdvancedRename() {
  advancedRenameVisible.value = false
  advancedRename.value = toRaw(
    (await getConfig<any>(configPaths.buildIn.rename)) || {
      enable: false,
      format: '{filename}'
    }
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
  ElMessageBox.confirm($T('SETTINGS_MIGRATE_FROM_PICGO_CONTENT'), $T('SETTINGS_MIGRATE_FROM_PICGO_TITLE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    type: 'warning',
    center: true
  })
    .then(() => {
      triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO)
        .then(() => {
          ElMessage.success($T('SETTINGS_MIGRATE_FROM_PICGO_SUCCESS'))
        })
        .catch(() => {
          ElMessage.error($T('SETTINGS_MIGRATE_FROM_PICGO_FAILED'))
        })
    })
    .catch(() => {
      return false
    })
}

function handleHideDockChange(val: ICheckBoxValueType) {
  if (val && currentStartMode.value.value === ISartMode.NO_TRAY) {
    ElMessage.warning($T('SETTINGS_ISHIDEDOCK_TIPS'))
    formOfSetting.value.isHideDock = false
    return
  }
  saveConfig(configPaths.settings.isHideDock, val)
  sendRPC(IRPCActionType.HIDE_DOCK, val)
}

function handleShowPicBedListChange(val: ICheckBoxValueType[]) {
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

function handleAutoStartChange(val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.autoStart, val)
  sendRPC(IRPCActionType.PICLIST_AUTO_START, val)
}

function compareVersion2Update(current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

async function checkUpdate() {
  checkUpdateVisible.value = true
  latestVersion.value = (await getLatestVersion()) || $T('TIPS_NETWORK_ERROR')
}

function confirmCheckVersion() {
  if (needUpdate.value) {
    sendRPC(IRPCActionType.RELOAD_APP)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion() {
  checkUpdateVisible.value = false
}

function handleWebServerPortChange(val?: number, _?: number) {
  saveConfig(configPaths.settings.webServerPort, Number(val) || 37777)
}

function confirmWebServerSetting() {
  if (formOfSetting.value.enableWebServer) {
    sendRPC(IRPCActionType.ADVANCED_RESTART_WEB_SERVER)
  } else {
    sendRPC(IRPCActionType.ADVANCED_STOP_WEB_SERVER)
  }
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
    [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : height < 100 ? 100 : height
  })
  await getMainWindowSize()
}

function handleMiniWindowOntop(val: ICheckBoxValueType) {
  saveConfig(configPaths.settings.miniWindowOntop, val)
  sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val)
}

async function handleMiniIconPath(_: Event) {
  const result = await triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
  if (result && result[0]) {
    formOfSetting.value.customMiniIcon = result[0]
    saveConfig(configPaths.settings.customMiniIcon, formOfSetting.value.customMiniIcon)
    sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON, formOfSetting.value.customMiniIcon)
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
    return $message.error($T('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
  }
  saveConfig({
    [configPaths.settings.logLevel]: formOfSetting.value.logLevel,
    [configPaths.settings.logFileSizeLimit]: formOfSetting.value.logFileSizeLimit
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

function syncMessage(failed: number, taskType: 'UPLOAD' | 'DOWNLOAD') {
  if (failed) {
    $message.error($T(`SETTINGS_SYNC_${taskType}_FAILED`, { failed }))
  } else {
    $message.success($T(`SETTINGS_SYNC_${taskType}_SUCCESS`))
  }
}

const syncTaskList = [
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
    label: $T('SETTINGS_SYNC_COMMON_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
    label: $T('SETTINGS_SYNC_MANAGE_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
    label: $T('SETTINGS_SYNC_UPLOAD_ALL'),
    number: 4
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
    label: $T('SETTINGS_SYNC_COMMON_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
    label: $T('SETTINGS_SYNC_MANAGE_CONFIG'),
    number: 2
  },
  {
    task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
    label: $T('SETTINGS_SYNC_DOWNLOAD_ALL'),
    number: 4
  }
]

async function syncTaskFn(task: IRPCActionType, number: number) {
  const failed = number - ((await triggerRPC<number>(task)) || 0)
  syncMessage(failed, task.includes('UPLOAD') ? 'UPLOAD' : 'DOWNLOAD')
}

function confirmServerSetting() {
  server.value.port = parseInt(server.value.port as unknown as string, 10)
  saveConfig({
    [configPaths.settings.server]: server.value
  })
  serverVisible.value = false
  sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER)
}

async function cancelServerSetting() {
  serverVisible.value = false
  server.value = (await getConfig(configPaths.settings.server)) || {
    port: 36677,
    host: '0.0.0.0',
    enable: true
  }
}

function handleLevelDisabled(val: string) {
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

function handleLanguageChange(val: string) {
  i18nManager.setCurrentLanguage(val)
  saveConfig({
    [configPaths.settings.language]: val
  })
  updatePicBedGlobal()
}

function handleStartModeChange(val: ISartModeValues) {
  if (val === ISartMode.NO_TRAY) {
    if (formOfSetting.value.isHideDock) {
      ElMessage.warning($T('SETTINGS_ISHIDEDOCK_TIPS'))
      currentStartMode.value = valueToOptionItem(ISartMode.QUIET, startModeList)
      return
    }
    $message.info($T('TIPS_NEED_RELOAD'))
  }
  saveConfig({
    [configPaths.settings.startMode]: val
  })
}

async function goConfigPage() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  const url =
    lang === II18nLanguage.ZH_CN ? 'https://piclist.cn/configure.html' : 'https://piclist.cn/en/configure.html'
  sendRPC(IRPCActionType.OPEN_URL, url)
}

function goShortCutPage() {
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
<style lang="stylus">
.el-message
  left 60%
.view-title
  .el-icon-document
    margin-left 8px
    cursor pointer
    transition color .2s ease-in-out
    &:hover
      color #49B1F5
.el-tabs__item
  color:white
#piclist-setting
  height 100%
  position absolute
  left 142px
  right 0
  .sub-title
    font-size 14px
  .setting-list
    height 100%
    box-sizing border-box
    overflow-y auto
    overflow-x hidden
    width 100%
  .setting-list
    .el-form
      width: 100%
      &-item
        display: flex
        justify-content space-between
        padding-top 8px
        padding-bottom 8px
        border-bottom 1px solid darken(#eee, 50%)
        margin-bottom 0
        &:last-child
          border-bottom none
        &::after
          display none
        &::before
          display none
        &__content
          display flex
          justify-content flex-end
          flex-basis: 50%
      .el-form-item__label
        line-height 32px
        padding-bottom 0
        color #eee
        flex-basis: 50%
        flex-shrink: 0
      .el-form-item__custom-label
        display flex
        align-items center
      .el-button-group
        width 100%
        .el-button
          width 50%
      .el-radio-group
        margin-left 25px
      .el-switch__label
        color #eee
        &.is-active
          color #409EFF
      .el-icon-question
        margin-left 4px
        color #eee
        cursor pointer
        transition .2s color ease-in-out
        &:hover
          color #409EFF
      .el-checkbox-group
        label
          margin-right 30px
          width 100px
      .el-checkbox+.el-checkbox
        margin-right 30px
        margin-left 0
      .confirm-button
        width 100%
  .server-dialog
    .notice-text
      text-align center
      color: #49B1F5
    .el-dialog__body
      padding-top: 0
    .el-form-item
      margin-bottom: 10px
</style>
