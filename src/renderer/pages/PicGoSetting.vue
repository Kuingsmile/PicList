<template>
  <div id="picgo-setting">
    <el-row
      class="view-title"
      align="middle"
      justify="center"
    >
      {{ $T('PICLIST_SETTINGS') }} -
      <el-icon
        class="el-icon-document"
        @click="goConfigPage"
      >
        <Reading />
      </el-icon>
    </el-row>
    <el-tabs
      v-model="activeName"
      stretch
      style="height: calc(100vh - 50px);width: 100%;overflow-x: hidden;top: 50px;position: absolute;"
      tab-position="left"
      lazy
    >
      <el-tab-pane
        name="system"
        :label="$T('SETTINGS_TAB_SYSTEM')"
        style="height: 100%;overflow-y: scroll;height: calc(100vh - 50px);color: #fff;"
      >
        <el-row class="setting-list">
          <el-col
            :span="22"
            :offset="1"
          >
            <el-row style="width: 100%">
              <el-form
                label-position="left"
                label-width="50%"
                size="small"
              >
                <el-form-item
                  :label="$T('SETTINGS_CHOOSE_LANGUAGE')"
                >
                  <el-select
                    v-model="currentLanguage"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_CHOOSE_LANGUAGE')"
                    :persistent="false"
                    teleported
                    @change="handleLanguageChange"
                  >
                    <el-option
                      v-for="item in languageList"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_START_MODE')"
                >
                  <el-select
                    v-model="currentStartMode"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_START_MODE')"
                    :persistent="false"
                    teleported
                    @change="handleStartModeChange"
                  >
                    <el-option
                      key="quiet"
                      :label="$T('SETTINGS_START_MODE_QUIET')"
                      :value="'quiet'"
                    />
                    <el-option
                      v-if="os !== 'darwin'"
                      key="mini"
                      :label="$T('SETTINGS_START_MODE_MINI')"
                      :value="'mini'"
                    />
                    <el-option
                      v-if="os === 'darwin'"
                      key="no-tray"
                      :label="$T('SETTINGS_START_MODE_NO_TRAY')"
                      :value="'no-tray'"
                    />
                    <el-option
                      key="main"
                      :label="$T('SETTINGS_START_MODE_MAIN')"
                      :value="'main'"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  :label="$T('MANUAL_PAGE_OPEN_SETTING_TIP')"
                >
                  <el-select
                    v-model="form.manualPageOpen"
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
                <el-form-item
                  v-if="os === 'darwin'"
                  :label="$T('SETTINGS_ISHIDEDOCK')"
                >
                  <el-switch
                    v-model="form.isHideDock"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleHideDockChange"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_MAIN_WINDOW_SIZE')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="mainWindowSizeVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  v-if="os !== 'darwin'"
                  :label="$T('SETTINGS_CLOSE_MINI_WINDOW_SYNC')"
                >
                  <el-switch
                    v-model="form.autoCloseMiniWindow"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoCloseMiniWindowChange"
                  />
                </el-form-item>
                <el-form-item
                  v-if="os !== 'darwin'"
                  :label="$T('SETTINGS_CLOSE_MAIN_WINDOW_SYNC')"
                >
                  <el-switch
                    v-model="form.autoCloseMainWindow"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoCloseMainWindowChange"
                  />
                </el-form-item>
                <el-form-item
                  v-if="os !== 'darwin'"
                  :label="$T('SETTINGS_MINI_WINDOW_ON_TOP')"
                >
                  <el-switch
                    v-model="form.miniWindowOntop"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleMiniWindowOntop"
                  />
                </el-form-item>
                <el-form-item
                  v-if="os !== 'darwin'"
                  :label="$T('SETTINGS_CUSTOM_MINI_ICON')"
                >
                  <el-switch
                    v-model="form.isCustomMiniIcon"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleIsCustomMiniIcon"
                  />
                </el-form-item>
                <el-form-item
                  v-if="os !== 'darwin' && form.isCustomMiniIcon"
                  :label="$T('SETTINGS_CUSTOM_MINI_ICON_PATH')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="handleMiniIconPath"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_LAUNCH_ON_BOOT')"
                >
                  <el-switch
                    v-model="form.autoStart"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoStartChange"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SET_SHORTCUT')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="goShortCutPage"
                  >
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
        style="height: 100%;overflow-y: scroll;height: calc(100vh - 50px);color: #fff;"
      >
        <el-row class="setting-list">
          <el-col
            :span="22"
            :offset="1"
          >
            <el-row style="width: 100%">
              <el-form
                label-position="left"
                label-width="50%"
                size="small"
              >
                <el-form-item
                  :label="$T('SETTINGS_SYNC_CONFIG')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="syncVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_UP_DOWN_DESC')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click=" upDownConfigVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_MIGRATE_FROM_PICGO')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="handleMigrateFromPicGo"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_OPEN_CONFIG_FILE')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="openFile('data.json')"
                  >
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
        style="height: 100%;overflow-y: scroll;height: calc(100vh - 50px);color: #fff;"
      >
        <el-row class="setting-list">
          <el-col
            :span="22"
            :offset="1"
          >
            <el-row style="width: 100%">
              <el-form
                label-position="left"
                label-width="50%"
                size="small"
              >
                <el-form-item
                  :label="$T('SETTINGS_AUTO_IMPORT')"
                >
                  <el-switch
                    v-model="form.autoImport"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="autoImportChange"
                  />
                </el-form-item>
                <el-form-item
                  v-if="form.autoImport"
                  :label="$T('SETTINGS_AUTO_IMPORT_SELECT_PICBED')"
                >
                  <el-select
                    v-model="form.autoImportPicBed"
                    multiple
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_AUTO_IMPORT_SELECT_PICBED')"
                    :persistent="false"
                    teleported
                    @change="handleAutoImportPicBedChange"
                  >
                    <el-option
                      v-for="item in picBed"
                      :key="item.type"
                      :label="item.name"
                      :value="item.type"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SYNC_DELETE_CLOUD')"
                >
                  <el-switch
                    v-model="form.deleteCloudFile"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleDeleteCloudFile"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_OPEN_UPLOAD_TIPS')"
                >
                  <el-switch
                    v-model="form.uploadNotification"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleUploadNotification"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_OPEN_UPLOAD_RESULT_TIPS')"
                >
                  <el-switch
                    v-model="form.uploadResultNotification"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleUploadResultNotification"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_COMPRESS_AND_WATERMARK')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="imageProcessDialogVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_RENAME_BEFORE_UPLOAD')"
                >
                  <el-switch
                    v-model="form.rename"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleRename"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_TIMESTAMP_RENAME')"
                >
                  <el-switch
                    v-model="form.autoRename"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoRename"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_ADVANCED_RENAME')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="advancedRenameVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_DELETE_LOCAL_FILE_AFTER_UPLOAD')"
                >
                  <el-switch
                    v-model="form.deleteLocalFile"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleDeleteLocalFile"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD')"
                >
                  <el-switch
                    v-model="form.autoCopyUrl"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleAutoCopyUrl"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="customLinkVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SHORT_URL')"
                >
                  <el-switch
                    v-model="form.useShortUrl"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleUseShortUrl"
                  />
                </el-form-item>
                <el-form-item
                  v-if="form.useShortUrl"
                  :label="$T('SETTINGS_SHORT_URL_SERVER')"
                >
                  <el-select
                    v-model="form.shortUrlServer"
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
                  v-if="form.useShortUrl && form.shortUrlServer === 'yourls'"
                  :label="$T('SETTINGS_SHORT_URL_YOURLS_DOMAIN')"
                >
                  <el-input
                    v-model="form.yourlsDomain"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_YOURLS_DOMAIN')"
                    @change="handleYourlsDomainChange"
                  />
                </el-form-item>
                <el-form-item
                  v-if="form.useShortUrl && form.shortUrlServer === 'yourls'"
                  :label="$T('SETTINGS_SHORT_URL_YOURLS_SIGNATURE')"
                >
                  <el-input
                    v-model="form.yourlsSignature"
                    size="small"
                    style="width: 50%"
                    :placeholder="$T('SETTINGS_SHORT_URL_YOURLS_SIGNATURE')"
                    @change="handleYourlsSignatureChange"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_ENCODE_OUTPUT_URL')"
                >
                  <el-switch
                    v-model="form.encodeOutputURL"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleEncodeOutputURL"
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
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                    </el-row>
                  </template>
                  <el-switch
                    v-model="form.useBuiltinClipboard"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="useBuiltinClipboardChange"
                  />
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_WATCH_CLIPBOARD')"
                >
                  <el-switch
                    v-model="form.isAutoListenClipboard"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="handleIsAutoListenClipboard"
                  />
                </el-form-item>
                <el-form-item
                  :style="{ marginRight: '-64px' }"
                  :label="$T('CHOOSE_SHOWED_PICBED')"
                >
                  <el-checkbox-group
                    v-model="form.showPicBedList"
                    @change="handleShowPicBedListChange"
                  >
                    <el-checkbox
                      v-for="item in picBed"
                      :key="item.name"
                      :label="item.name"
                    />
                  </el-checkbox-group>
                </el-form-item>
                <el-divider
                  border-style="none"
                />
                <el-form-item />
              </el-form>
            </el-row>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        name="advanced"
        :label="$T('SETTINGS_TAB_ADVANCED')"
        style="height: 100%;overflow-y: scroll;height: calc(100vh - 50px);color: #fff;"
      >
        <el-row class="setting-list">
          <el-col
            :span="22"
            :offset="1"
          >
            <el-row style="width: 100%">
              <el-form
                label-position="left"
                label-width="50%"
                size="small"
              >
                <el-form-item
                  :label="$T('SETTINGS_SET_LOG_FILE')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="openLogSetting"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="proxyVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SET_SERVER')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="serverVisible = true"
                  >
                    {{ $T('SETTINGS_CLICK_TO_SET') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_SET_SERVER_AES_KEY')"
                >
                  <el-input
                    v-model.trim="form.aesPassword"
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
        style="height: 100%;overflow-y: scroll;height: calc(100vh - 50px);"
      >
        <el-row class="setting-list">
          <el-col
            :span="22"
            :offset="1"
          >
            <el-row style="width: 100%">
              <el-form
                label-position="left"
                label-width="50%"
                size="small"
              >
                <el-form-item
                  :label="$T('SETTINGS_CHECK_UPDATE')"
                >
                  <el-button
                    type="primary"
                    round
                    size="small"
                    @click="checkUpdate"
                  >
                    {{ $T('SETTINGS_CLICK_TO_CHECK') }}
                  </el-button>
                </el-form-item>
                <el-form-item
                  :label="$T('SETTINGS_OPEN_UPDATE_HELPER')"
                >
                  <el-switch
                    v-model="form.updateHelper"
                    :active-text="$T('SETTINGS_OPEN')"
                    :inactive-text="$T('SETTINGS_CLOSE')"
                    @change="updateHelperChange"
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
      append-to-body
    >
      <el-form
        ref="$customLink"
        label-position="top"
        :model="customLink"
        :rules="rules"
        size="small"
      >
        <el-form-item
          prop="value"
        >
          <div class="custom-title">
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_URL') }}
            <br>
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_FILENAME') }}
            <br>
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_EXTNAME') }}
          </div>
          <el-input
            v-model="customLink.value"
            class="align-center"
            :autofocus="true"
          />
        </el-form-item>
      </el-form>
      <div>
        {{ $T('SETTINGS_TIPS_SUCH_AS') }}[$fileName]($url)
      </div>
      <template #footer>
        <el-button
          round
          @click="cancelCustomLink"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmCustomLink"
        >
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
      append-to-body
    >
      <el-form
        label-position="right"
        :model="customLink"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_UPLOAD_PROXY')"
        >
          <el-input
            v-model="proxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_PROXY')"
        >
          <el-input
            v-model="npmProxy"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_PLUGIN_INSTALL_MIRROR')"
        >
          <el-input
            v-model="npmRegistry"
            :autofocus="true"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：https://registry.npmmirror.com`"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelProxy"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmProxy"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="mainWindowSizeVisible"
      :title="$T('SETTINGS_MAIN_WINDOW_SIZE')"
      :modal-append-to-body="false"
      width="70%"
      center
      append-to-body
    >
      <el-form
        label-position="right"
        :model="customLink"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_MAIN_WINDOW_SIZE_WIDTH')"
        >
          <el-input
            v-model="mainWindowWidth"
            :autofocus="true"
            :placeholder="$T('SETTINGS_MAIN_WINDOW_WIDTH_HINT')"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_MAIN_WINDOW_SIZE_HEIGHT')"
        >
          <el-input
            v-model="mainWindowHeight"
            :autofocus="true"
            :placeholder="$T('SETTINGS_MAIN_WINDOW_HEIGHT_HINT')"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_RAW_PICGO_SIZE')"
        >
          <el-switch
            v-model="rawPicGoSize"
            :active-text="$T('SETTINGS_OPEN')"
            :inactive-text="$T('SETTINGS_CLOSE')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelWindowSize"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmWindowSize"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="checkUpdateVisible"
      :title="$T('SETTINGS_CHECK_UPDATE')"
      :modal-append-to-body="false"
      center
      append-to-body
    >
      <div>
        {{ $T('SETTINGS_CURRENT_VERSION') }}: {{ version }}
      </div>
      <div>
        {{ $T('SETTINGS_NEWEST_VERSION') }}: {{ latestVersion ? latestVersion : `${$T('SETTINGS_GETING')}...` }}
      </div>
      <div v-if="needUpdate">
        {{ $T('SETTINGS_TIPS_HAS_NEW_VERSION') }}
      </div>
      <template #footer>
        <el-button
          round
          @click="cancelCheckVersion"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmCheckVersion"
        >
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
      <el-link
        :underline="false"
        style="margin-bottom: 10px;"
      >
        {{ $T('SETTINGS_ADVANCED_RENAME_ENABLE') }}
      </el-link>
      <br>
      <el-switch
        v-model="advancedRename.enable"
        :active-text="$T('SETTINGS_OPEN')"
        :inactive-text="$T('SETTINGS_CLOSE')"
      />
      <br>
      <el-link
        :underline="false"
        style="margin-bottom: 10px;margin-top: 10px;"
      >
        <span>
          {{ $T('SETTINGS_ADVANCED_RENAME_FORMAT') }}
          <el-popover
            effect="light"
            placement="right"
            width="350"
            :persistent="false"
            teleported
          >
            <template #reference>
              <el-icon
                color="#409EFF"
              >
                <InfoFilled />
              </el-icon>
            </template>
            <el-descriptions
              :column="1"
              style="width: 320px;"
              border
            >
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
                v-for="(item, index) in buildInRenameFormatTable.slice(0, buildInRenameFormatTable.length-1)"
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
      <el-input
        v-model="advancedRename.format"
        placeholder="Ex. {Y}-{m}-{uuid}"
        clearable
      />
      <div
        style="margin-top: 10px;align-items: center;display: flex;justify-content: flex-end;"
      >
        <el-button
          type="danger"
          style="margin-right: 30px;"
          plain
          :icon="Close"
          @click="handleCancelAdvancedRename"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          plain
          :icon="Edit"
          @click="handleSaveAdvancedRename"
        >
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
      append-to-body
    >
      <el-form
        label-position="right"
        label-width="150px"
      >
        <el-form-item
          :label="$T('SETTINGS_LOG_FILE')"
        >
          <el-button
            type="primary"
            round
            size="small"
            @click="openFile('piclist.log')"
          >
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_GUI_LOG_FILE')"
        >
          <el-button
            type="primary"
            round
            size="small"
            @click="openFile('piclist-gui-local.log')"
          >
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_MANAGE_LOG_FILE')"
        >
          <el-button
            type="primary"
            round
            size="small"
            @click="openFile('manage.log')"
          >
            {{ $T('SETTINGS_CLICK_TO_OPEN') }}
          </el-button>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_LOG_LEVEL')"
        >
          <el-select
            v-model="form.logLevel"
            multiple
            collapse-tags
            style="width: 100%;"
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
        <el-form-item
          :label="`${$T('SETTINGS_LOG_FILE_SIZE')} (MB)`"
        >
          <el-input-number
            v-model="form.logFileSizeLimit"
            style="width: 100%;"
            :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：10`"
            :controls="false"
            :min="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelLogLevelSetting"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmLogLevelSetting"
        >
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
      append-to-body
    >
      <div class="notice-text">
        {{ $T('SETTINGS_TIPS_SERVER_NOTICE') }}
      </div>
      <el-form
        label-position="right"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_ENABLE_SERVER')"
        >
          <el-switch
            v-model="server.enable"
            :active-text="$T('SETTINGS_OPEN')"
            :inactive-text="$T('SETTINGS_CLOSE')"
          />
        </el-form-item>
        <template v-if="server.enable">
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_HOST')"
          >
            <el-input
              v-model="server.host"
              type="input"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_HOST')"
            />
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_PORT')"
          >
            <el-input
              v-model="server.port"
              type="number"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_PORT')"
            />
          </el-form-item>
          <el-form-item
            :label="$T('SETTINGS_SET_SERVER_KEY')"
          >
            <el-input
              v-model="form.serverKey"
              type="input"
              :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_KEY')"
              @change="handleServerKeyChange"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelServerSetting"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmServerSetting"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="syncVisible"
      class="server-dialog"
      width="60%"
      :title="$T('SETTINGS_SYNC_CONFIG_TITLE')"
      :modal-append-to-body="false"
      center
      append-to-body
    >
      <div class="notice-text">
        {{ $T('SETTINGS_SYNC_CONFIG_NOTE') }}
      </div>
      <el-form
        label-position="right"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_SYNC_CONFIG_SELECT_TYPE')"
        >
          <el-select
            v-model="sync.type"
            style="width: 100%;"
            :persistent="false"
            teleported
          >
            <el-option
              v-for="typeitem of syncType"
              :key="typeitem.value"
              :label="typeitem.label"
              :value="typeitem.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="sync.type === 'gitea'"
          :label="$T('SETTINGS_SYNC_CONFIG_GITEA_HOST')"
        >
          <el-input
            v-model.trim="sync.endpoint"
            type="input"
            :placeholder="$T('SETTINGS_SYNC_CONFIG_GITEA_HOST')"
          />
        </el-form-item>
        <el-form-item
          :label="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_USERNAME` as any)"
        >
          <el-input
            v-model.trim="sync.username"
            type="input"
            :placeholder="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_USERNAME_PLACEHOLDER` as any)"
          />
        </el-form-item>
        <el-form-item
          :label="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_REPO` as any)"
        >
          <el-input
            v-model.trim="sync.repo"
            type="input"
            :placeholder="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_REPO_PLACEHOLDER` as any)"
          />
        </el-form-item>
        <el-form-item
          :label="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_BRANCH` as any)"
        >
          <el-input
            v-model.trim="sync.branch"
            type="input"
            :placeholder="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_BRANCH_PLACEHOLDER` as any)"
          />
        </el-form-item>
        <el-form-item
          :label="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_TOKEN` as any)"
        >
          <el-input
            v-model.trim="sync.token"
            type="input"
            :placeholder="$T(`SETTINGS_SYNC_CONFIG_${sync.type.toUpperCase()}_TOKEN_PLACEHOLDER` as any)"
          />
        </el-form-item>
        <el-form-item
          v-if="sync.type === 'github'"
          :label="$T('SETTINGS_SYNC_CONFIG_PROXY')"
        >
          <el-input
            v-model.trim="sync.proxy"
            type="input"
            :placeholder="$T('SETTINGS_SYNC_CONFIG_PROXY_PLACEHOLDER')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          round
          @click="cancelSyncSetting"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmSyncSetting"
        >
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
      append-to-body
    >
      <el-form
        label-position="right"
        label-width="120px"
      >
        <el-form-item
          :label="$T('SETTINGS_SYNC_UPLOAD')"
        >
          <el-button-group>
            <el-button
              type="primary"
              plain
              size="small"
              @click="uploadCommonConfig"
            >
              {{ $T('SETTINGS_SYNC_COMMON_CONFIG') }}
            </el-button>
            <el-button
              type="primary"
              plain
              size="small"
              @click="uploadManageConfig"
            >
              {{ $T('SETTINGS_SYNC_MANAGE_CONFIG') }}
            </el-button>
            <el-button
              type="warning"
              plain
              size="small"
              @click="uploadAll"
            >
              {{ $T('SETTINGS_SYNC_UPLOAD_ALL') }}
            </el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_SYNC_DOWNLOAD')"
        >
          <el-button-group>
            <el-button
              type="primary"
              size="small"
              plain
              @click="downloadCommonConfig"
            >
              {{ $T('SETTINGS_SYNC_COMMON_CONFIG') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              plain
              @click="downloadManageConfig"
            >
              {{ $T('SETTINGS_SYNC_MANAGE_CONFIG') }}
            </el-button>
            <el-button
              type="warning"
              size="small"
              plain
              @click="downloadAll"
            >
              {{ $T('SETTINGS_SYNC_DOWNLOAD_ALL') }}
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
      <el-form
        label-position="top"
        require-asterisk-position="right"
        label-width="10vw"
        size="default"
        :model="waterMarkForm"
      >
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISADDWM')"
        >
          <el-switch
            v-model="waterMarkForm.isAddWatermark"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE')"
        >
          <el-radio-group v-model="waterMarkForm.watermarkType">
            <el-radio label="text">
              {{ $T('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_TEXT') }}
            </el-radio>
            <el-radio label="image">
              {{ $T('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_IMAGE') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISFULLSCREEN_WM')"
        >
          <el-switch
            v-model="waterMarkForm.isFullScreenWatermark"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMDEGREE')"
        >
          <el-input-number
            v-model="waterMarkForm.watermarkDegree"
            :step="1"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT')"
        >
          <el-input v-model="waterMarkForm.watermarkText" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT_FONT_PATH')"
        >
          <el-input v-model="waterMarkForm.watermarkFontPath" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMRATIO')"
        >
          <el-input-number
            v-model="waterMarkForm.watermarkScaleRatio"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMCOLOR')"
        >
          <el-color-picker
            v-model="waterMarkForm.watermarkColor"
            show-alpha
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'image'"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMPATH')"
        >
          <el-input v-model="waterMarkForm.watermarkImagePath" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_WMPOSITION')"
        >
          <el-radio-group
            v-model="waterMarkForm.watermarkPosition"
          >
            <el-radio
              v-for="item in waterMarkPositionMap"
              :key="item[0]"
              :label="item[0]"
            >
              {{ item[1] }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISREMOVEEXIF')"
        >
          <el-switch
            v-model="compressForm.isRemoveExif"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_QUALITY')"
        >
          <el-input-number
            v-model="compressForm.quality"
            :min="0"
            :max="100"
            :step="1"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISCONVERT')"
        >
          <el-switch
            v-model="compressForm.isConvert"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isConvert"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT')"
        >
          <el-select
            v-model="compressForm.convertFormat"
            :persistent="false"
            teleported
          >
            <el-option
              v-for="item in availableFormat"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-show="compressForm.isConvert"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT_SPECIFIC')"
        >
          <el-input
            v-model="formatConvertObj"
            placeholder="{&quot;jpg&quot;: &quot;png&quot;, &quot;png&quot;: &quot;jpg&quot;}"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4}"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISFLIP')"
        >
          <el-switch
            v-model="compressForm.isFlip"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISFLOP')"
        >
          <el-switch
            v-model="compressForm.isFlop"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZE')"
        >
          <el-switch
            v-model="compressForm.isReSize"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEWIDTH')"
        >
          <el-input-number
            v-model="compressForm.reSizeWidth"
            :min="0"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEHEIGHT')"
        >
          <el-input-number
            v-model="compressForm.reSizeHeight"
            :min="0"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize && compressForm.reSizeHeight > 0 && compressForm.reSizeWidth === 0"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_HEIGHT')"
        >
          <el-switch
            v-model="compressForm.skipReSizeOfSmallImg"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize && compressForm.reSizeWidth > 0 && compressForm.reSizeHeight === 0"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_WIDTH')"
        >
          <el-switch
            v-model="compressForm.skipReSizeOfSmallImg"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZEBYPERCENT')"
        >
          <el-switch
            v-model="compressForm.isReSizeByPercent"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSizeByPercent"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEPERCENT')"
        >
          <el-input-number
            v-model="compressForm.reSizePercent"
            :min="0"
          />
        </el-form-item>
        <el-form-item
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ISROTATE')"
        >
          <el-switch
            v-model="compressForm.isRotate"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isRotate"
          :label="$T('UPLOAD_PAGE_IMAGE_PROCESS_ROTATEDEGREE')"
        >
          <el-input-number
            v-model="compressForm.rotateDegree"
            :step="1"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSaveConfig"
          >
            {{ $T('UPLOAD_PAGE_IMAGE_PROCESS_CONFIRM') }}
          </el-button>
          <el-button @click="closeDialog">
            {{ $T('UPLOAD_PAGE_IMAGE_PROCESS_CANCEL') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
// @ts-ignore
import { ElForm, ElMessage as $message, ElMessage, ElMessageBox, FormRules } from 'element-plus'

// Element Plus 图标
import { Reading, Close, Edit, InfoFilled } from '@element-plus/icons-vue'

// 根目录 package.json
import pkg from 'root/package.json'

// 事件常量
import { PICGO_OPEN_FILE, OPEN_URL, GET_PICBEDS, HIDE_DOCK } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'

// Electron 相关
import {
  ipcRenderer
} from 'electron'

// 国际化管理器
import { i18nManager, T as $T } from '@/i18n/index'

// 工具函数
import { enforceNumber } from '~/universal/utils/common'
import { getLatestVersion } from '#/utils/getLatestVersion'
import { compare } from 'compare-versions'

// Vue 相关
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, toRaw } from 'vue'

// 数据发送工具函数
import { getConfig, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'

// Vue Router 相关
import { useRouter } from 'vue-router'

// 路由配置常量
import { SHORTKEY_PAGE } from '@/router/config'

// Piclist 相关类型声明
import { IConfig, IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'

// 数据发送工具函数
import { invokeToMain } from '@/manage/utils/dataSender'

// 内置重命名格式表
import { buildInRenameFormatTable } from '../manage/utils/common'

const imageProcessDialogVisible = ref(false)
const activeName = ref<'system' | 'syncAndConfigure' | 'upload' | 'advanced' | 'upadte'>('system')

const shortUrlServerList = [{
  label: 'c1n',
  value: 'c1n'
},
{
  label: 'yourls',
  value: 'yourls'
}
]

const manualPageOpenList = [{
  label: $T('MANUAL_PAGE_OPEN_BY_BUILD_IN'),
  value: 'window'
},
{
  label: $T('MANUAL_PAGE_OPEN_BY_BROWSER'),
  value: 'browser'
}
]

const waterMarkPositionMap = new Map([
  ['north', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP')],
  ['northeast', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_RIGHT')],
  ['southeast', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_RIGHT')],
  ['south', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM')],
  ['southwest', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_LEFT')],
  ['northwest', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_LEFT')],
  ['west', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_LEFT')],
  ['east', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_RIGHT')],
  ['centre', $T('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_CENTER')]
])

const imageExtList = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico', 'avif', 'heif', 'heic']

const availableFormat = ['avif', 'dz', 'fits', 'gif', 'heif', 'input', 'jpeg', 'jpg', 'jp2', 'jxl', 'magick', 'openslide', 'pdf', 'png', 'ppm', 'raw', 'svg', 'tiff', 'tif', 'v', 'webp']

const waterMarkForm = reactive<any>({
  isAddWatermark: false,
  watermarkType: 'text',
  isFullScreenWatermark: false,
  watermarkDegree: 0,
  watermarkText: '',
  watermarkFontPath: '',
  watermarkScaleRatio: 0.15,
  watermarkColor: '#CCCCCC73',
  watermarkImagePath: '',
  watermarkPosition: 'southeast'
})

const formatConvertObj = ref('{}')

const compressForm = reactive<any>({
  quality: 100,
  isConvert: false,
  convertFormat: 'jpg',
  isReSize: false,
  reSizeWidth: 500,
  reSizeHeight: 500,
  skipReSizeOfSmallImg: false,
  isReSizeByPercent: false,
  reSizePercent: 50,
  isRotate: false,
  rotateDegree: 0,
  isRemoveExif: false,
  isFlip: false,
  isFlop: false
})

function closeDialog () {
  imageProcessDialogVisible.value = false
}

function handleSaveConfig () {
  let iformatConvertObj = {}
  try {
    iformatConvertObj = JSON.parse(formatConvertObj.value)
  } catch (error) {
  }
  const formatConvertObjEntries = Object.entries(iformatConvertObj)
  const formatConvertObjEntriesFilter = formatConvertObjEntries.filter((item: any) => {
    return imageExtList.includes(item[0]) && availableFormat.includes(item[1])
  })
  const formatConvertObjFilter = Object.fromEntries(formatConvertObjEntriesFilter)
  formatConvertObj.value = JSON.stringify(formatConvertObjFilter)
  compressForm.formatConvertObj = formatConvertObjFilter
  saveConfig('buildIn.compress', toRaw(compressForm))
  saveConfig('buildIn.watermark', toRaw(waterMarkForm))
  closeDialog()
}

async function initForm () {
  const compress = await getConfig<IBuildInCompressOptions>('buildIn.compress')
  const watermark = await getConfig<IBuildInWaterMarkOptions>('buildIn.watermark')
  if (compress) {
    compressForm.quality = compress.quality ?? 100
    compressForm.isConvert = compress.isConvert ?? false
    compressForm.convertFormat = compress.convertFormat ?? 'jpg'
    compressForm.isReSize = compress.isReSize ?? false
    compressForm.reSizeWidth = compress.reSizeWidth ?? 500
    compressForm.reSizeHeight = compress.reSizeHeight ?? 500
    compressForm.isReSizeByPercent = compress.isReSizeByPercent ?? false
    compressForm.skipReSizeOfSmallImg = compress.skipReSizeOfSmallImg ?? false
    compressForm.reSizePercent = compress.reSizePercent ?? 50
    compressForm.isRotate = compress.isRotate ?? false
    compressForm.rotateDegree = compress.rotateDegree ?? 0
    compressForm.isRemoveExif = compress.isRemoveExif ?? false
    compressForm.isFlip = compress.isFlip ?? false
    compressForm.isFlop = compress.isFlop ?? false
    try {
      if (typeof compress.formatConvertObj === 'object') {
        formatConvertObj.value = JSON.stringify(compress.formatConvertObj)
      } else {
        formatConvertObj.value = compress.formatConvertObj ?? '{}'
      }
    } catch (error) {
      formatConvertObj.value = '{}'
    }
  }
  if (watermark) {
    waterMarkForm.isAddWatermark = watermark.isAddWatermark ?? false
    waterMarkForm.watermarkType = watermark.watermarkType ?? 'text'
    waterMarkForm.isFullScreenWatermark = watermark.isFullScreenWatermark ?? false
    waterMarkForm.watermarkDegree = watermark.watermarkDegree ?? 0
    waterMarkForm.watermarkText = watermark.watermarkText ?? ''
    waterMarkForm.watermarkFontPath = watermark.watermarkFontPath ?? ''
    waterMarkForm.watermarkScaleRatio = watermark.watermarkScaleRatio ?? 0.15
    waterMarkForm.watermarkColor = watermark.watermarkColor === undefined || watermark.watermarkColor === '' ? '#CCCCCC73' : watermark.watermarkColor
    waterMarkForm.watermarkImagePath = watermark.watermarkImagePath ?? ''
    waterMarkForm.watermarkPosition = watermark.watermarkPosition ?? 'southeast'
  }
}

const $customLink = ref<InstanceType<typeof ElForm> | null>(null)

const customLinkRule = (rule: any, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value) && !/\$fileName/.test(value) && !/\$extName/.test(value)) {
    return callback(new Error($T('TIPS_MUST_CONTAINS_URL')))
  } else {
    return callback()
  }
}
const $router = useRouter()
const form = reactive<ISettingForm>({
  updateHelper: true,
  showPicBedList: [],
  autoStart: false,
  rename: false,
  autoRename: false,
  uploadNotification: false,
  uploadResultNotification: true,
  miniWindowOntop: false,
  autoCloseMiniWindow: false,
  autoCloseMainWindow: false,
  logLevel: ['all'],
  autoCopyUrl: true,
  checkBetaUpdate: true,
  useBuiltinClipboard: true,
  language: 'zh-CN',
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
  yourlsDomain: '',
  yourlsSignature: '',
  deleteLocalFile: false,
  serverKey: '',
  aesPassword: '',
  manualPageOpen: 'browser'
})

const languageList = i18nManager.languageList.map(item => ({
  label: item.label,
  value: item.value
}))

const currentLanguage = ref('zh-CN')
const currentStartMode = ref('quiet')

const picBed = ref<IPicBedType[]>([])

const logFileVisible = ref(false)
const customLinkVisible = ref(false)
const checkUpdateVisible = ref(false)
const serverVisible = ref(false)
const syncVisible = ref(false)
const upDownConfigVisible = ref(false)
const proxyVisible = ref(false)
const mainWindowSizeVisible = ref(false)
const advancedRenameVisible = ref(false)

const customLink = reactive({
  value: '![$fileName]($url)'
})

const shortKey = reactive<IShortKeyMap>({
  upload: ''
})

const mainWindowWidth = ref(1200)
const mainWindowHeight = ref(800)
const rawPicGoSize = ref(false)

const proxy = ref('')
const npmRegistry = ref('')
const npmProxy = ref('')
const rules = reactive<FormRules>({
  value: [
    { validator: customLinkRule, trigger: 'blur' }
  ]
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

const sync = ref({
  type: 'github',
  username: '',
  repo: '',
  branch: '',
  token: '',
  endpoint: '',
  proxy: '',
  interval: 60
})

const syncType = [
  {
    label: 'GitHub',
    value: 'github'
  },
  {
    label: 'Gitee',
    value: 'gitee'
  },
  {
    label: 'Gitea',
    value: 'gitea'
  }
]

async function cancelSyncSetting () {
  syncVisible.value = false
  sync.value = await getConfig('settings.sync') || {
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

function confirmSyncSetting () {
  saveConfig({
    'settings.sync': sync.value
  })
  syncVisible.value = false
}

const version = pkg.version
const latestVersion = ref('')
const os = ref('')

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  } else {
    return false
  }
})

onBeforeMount(() => {
  os.value = process.platform
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  initData()
  initForm()
})

async function initData () {
  const config = (await getConfig<IConfig>())!
  if (config !== undefined) {
    const settings = config.settings || {}
    const picBed = config.picBed
    form.updateHelper = settings.showUpdateTip === undefined ? true : settings.showUpdateTip
    form.autoStart = settings.autoStart || false
    form.rename = settings.rename || false
    form.autoRename = settings.autoRename || false
    form.uploadNotification = settings.uploadNotification || false
    form.uploadResultNotification = settings.uploadResultNotification === undefined ? true : settings.uploadResultNotification
    form.miniWindowOntop = settings.miniWindowOntop || false
    form.autoCloseMiniWindow = settings.autoCloseMiniWindow || false
    form.autoCloseMainWindow = settings.autoCloseMainWindow || false
    form.logLevel = initArray(settings.logLevel || [], ['all'])
    form.autoCopyUrl = settings.autoCopy === undefined ? true : settings.autoCopy
    form.checkBetaUpdate = settings.checkBetaUpdate === undefined ? true : settings.checkBetaUpdate
    form.useBuiltinClipboard = settings.useBuiltinClipboard === undefined ? true : settings.useBuiltinClipboard
    form.isAutoListenClipboard = settings.isAutoListenClipboard || false
    form.language = settings.language ?? 'zh-CN'
    form.encodeOutputURL = settings.encodeOutputURL === undefined ? false : settings.encodeOutputURL
    form.deleteCloudFile = settings.deleteCloudFile || false
    form.autoImport = settings.autoImport || false
    form.autoImportPicBed = initArray(settings.autoImportPicBed || [], [])
    form.isCustomMiniIcon = settings.isCustomMiniIcon || false
    form.customMiniIcon = settings.customMiniIcon || ''
    form.isHideDock = settings.isHideDock || false
    form.useShortUrl = settings.useShortUrl || false
    form.shortUrlServer = settings.shortUrlServer || 'c1n'
    form.yourlsDomain = settings.yourlsDomain || ''
    form.yourlsSignature = settings.yourlsSignature || ''
    form.deleteLocalFile = settings.deleteLocalFile || false
    form.serverKey = settings.serverKey || ''
    form.aesPassword = settings.aesPassword || 'PicList-aesPassword'
    form.manualPageOpen = settings.manualPageOpen || 'window'
    currentLanguage.value = settings.language ?? 'zh-CN'
    currentStartMode.value = settings.startMode || 'quiet'
    customLink.value = settings.customLink || '![$fileName]($url)'
    shortKey.upload = settings.shortKey.upload
    proxy.value = picBed.proxy || ''
    npmRegistry.value = settings.registry || ''
    npmProxy.value = settings.proxy || ''
    mainWindowWidth.value = settings.mainWindowWidth || 1200
    mainWindowHeight.value = settings.mainWindowHeight || 800
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
      form.autoRename = false
      saveConfig({
        'settings.autoRename': false
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
    form.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
  }
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

function getPicBeds (event: Event, picBeds: IPicBedType[]) {
  picBed.value = picBeds
  form.showPicBedList = picBed.value.map(item => {
    if (item.visible) {
      return item.name
    }
    return null
  }).filter(item => item) as string[]
}

function openFile (file: string) {
  sendToMain(PICGO_OPEN_FILE, file)
}

function openLogSetting () {
  logFileVisible.value = true
}

async function cancelCustomLink () {
  customLinkVisible.value = false
  customLink.value = await getConfig<string>('settings.customLink') || '![$fileName]($url)'
}

function confirmCustomLink () {
  $customLink.value?.validate((valid: boolean) => {
    if (valid) {
      saveConfig('settings.customLink', customLink.value)
      customLinkVisible.value = false
      sendToMain('updateCustomLink')
    } else {
      return false
    }
  })
}

function handleEncodeOutputURL (val: ICheckBoxValueType) {
  saveConfig('settings.encodeOutputURL', val)
  const successNotification = new Notification($T('SETTINGS_ENCODE_OUTPUT_URL'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

async function handleCancelAdvancedRename () {
  advancedRenameVisible.value = false
  advancedRename.value = toRaw((await getConfig<any>('buildIn.rename')) || {
    enable: false,
    format: '{filename}'
  })
}

function handleSaveAdvancedRename () {
  saveConfig('buildIn.rename', toRaw(advancedRename.value))
  if (advancedRename.value.enable) {
    form.autoRename = false
    saveConfig('settings.autoRename', false)
  }
  advancedRenameVisible.value = false
  const successNotification = new Notification($T('SETTINGS_ADVANCED_RENAME'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

async function cancelProxy () {
  proxyVisible.value = false
  proxy.value = await getConfig<string>('picBed.proxy') || ''
}

function confirmProxy () {
  proxyVisible.value = false
  saveConfig({
    'picBed.proxy': proxy.value,
    'settings.proxy': npmProxy.value,
    'settings.registry': npmRegistry.value
  })
  const successNotification = new Notification($T('SETTINGS_SET_PROXY_AND_MIRROR'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function handleMigrateFromPicGo () {
  ElMessageBox.confirm($T('SETTINGS_MIGRATE_FROM_PICGO_CONTENT'), $T('SETTINGS_MIGRATE_FROM_PICGO_TITLE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    type: 'warning',
    center: true
  }).then(() => {
    ipcRenderer.invoke('migrateFromPicGo').then(() => {
      ElMessage.success($T('SETTINGS_MIGRATE_FROM_PICGO_SUCCESS'))
    }).catch(() => {
      ElMessage.error($T('SETTINGS_MIGRATE_FROM_PICGO_FAILED'))
    })
  }).catch(() => {
    return false
  })
}

function updateHelperChange (val: ICheckBoxValueType) {
  saveConfig('settings.showUpdateTip', val)
}

function autoImportChange (val: ICheckBoxValueType) {
  saveConfig('settings.autoImport', val)
}

function handleAutoImportPicBedChange (val: string[]) {
  saveConfig('settings.autoImportPicBed', val)
}

function handleHideDockChange (val: ICheckBoxValueType) {
  if (val && currentStartMode.value === 'no-tray') {
    ElMessage.warning($T('SETTINGS_ISHIDEDOCK_TIPS'))
    form.isHideDock = false
    return
  }
  saveConfig('settings.isHideDock', val)
  sendToMain(HIDE_DOCK, val)
}

function useBuiltinClipboardChange (val: ICheckBoxValueType) {
  saveConfig('settings.useBuiltinClipboard', val)
}

function handleIsAutoListenClipboard (val: ICheckBoxValueType) {
  saveConfig('settings.isAutoListenClipboard', val)
}

function handleShowPicBedListChange (val: ICheckBoxValueType[]) {
  const list = picBed.value.map(item => {
    if (!val.includes(item.name)) {
      item.visible = false
    } else {
      item.visible = true
    }
    return item
  })
  saveConfig({
    'picBed.list': list
  })
  sendToMain(GET_PICBEDS)
}

function handleAutoStartChange (val: ICheckBoxValueType) {
  saveConfig('settings.autoStart', val)
  sendToMain('autoStart', val)
}

function handleDeleteCloudFile (val: ICheckBoxValueType) {
  saveConfig({
    'settings.deleteCloudFile': val
  })
}

function handleDeleteLocalFile (val: ICheckBoxValueType) {
  saveConfig({
    'settings.deleteLocalFile': val
  })
}

function handleRename (val: ICheckBoxValueType) {
  saveConfig({
    'settings.rename': val
  })
}

function handleAutoRename (val: ICheckBoxValueType) {
  saveConfig({
    'settings.autoRename': val
  })
}

function compareVersion2Update (current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

async function checkUpdate () {
  checkUpdateVisible.value = true
  const version = await getLatestVersion()
  if (version) {
    latestVersion.value = version
  } else {
    latestVersion.value = $T('TIPS_NETWORK_ERROR')
  }
}

function confirmCheckVersion () {
  if (needUpdate.value) {
    sendRPC(IRPCActionType.RELOAD_APP)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion () {
  checkUpdateVisible.value = false
}

function handleServerKeyChange (val: string) {
  saveConfig('settings.serverKey', val)
}

function handleUploadNotification (val: ICheckBoxValueType) {
  saveConfig({
    'settings.uploadNotification': val
  })
}

function handleUploadResultNotification (val: ICheckBoxValueType) {
  saveConfig({
    'settings.uploadResultNotification': val
  })
}

async function cancelWindowSize () {
  mainWindowSizeVisible.value = false
  mainWindowWidth.value = await getConfig<number>('settings.mainWindowWidth') || 1200
  mainWindowHeight.value = await getConfig<number>('settings.mainWindowHeight') || 800
}

async function confirmWindowSize () {
  mainWindowSizeVisible.value = false
  const width = enforceNumber(mainWindowWidth.value)
  const height = enforceNumber(mainWindowHeight.value)
  saveConfig({
    'settings.mainWindowWidth': rawPicGoSize.value ? 800 : width < 100 ? 100 : width,
    'settings.mainWindowHeight': rawPicGoSize.value ? 450 : height < 100 ? 100 : height
  })

  const successNotification = new Notification($T('SETTINGS_MAIN_WINDOW_SIZE'), {
    body: $T('TIPS_NEED_RELOAD')
  })
  successNotification.onclick = () => {
    return true
  }
}

function handleAutoCloseMainWindowChange (val: ICheckBoxValueType) {
  saveConfig('settings.autoCloseMainWindow', val)
}

function handleAutoCloseMiniWindowChange (val: ICheckBoxValueType) {
  saveConfig('settings.autoCloseMiniWindow', val)
}

function handleMiniWindowOntop (val: ICheckBoxValueType) {
  saveConfig('settings.miniWindowOntop', val)
  $message.info($T('TIPS_NEED_RELOAD'))
}

async function handleMiniIconPath (evt: Event) {
  const result = await invokeToMain('openFileSelectDialog')
  if (result && result[0]) {
    form.customMiniIcon = result[0]
    saveConfig('settings.customMiniIcon', form.customMiniIcon)
    $message.info($T('TIPS_NEED_RELOAD'))
  }
}

function handleIsCustomMiniIcon (val: ICheckBoxValueType) {
  saveConfig('settings.isCustomMiniIcon', val)
  $message.info($T('TIPS_NEED_RELOAD'))
}

function handleAutoCopyUrl (val: ICheckBoxValueType) {
  saveConfig('settings.autoCopy', val)
  const successNotification = new Notification($T('SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function handleUseShortUrl (val: ICheckBoxValueType) {
  saveConfig('settings.useShortUrl', val)
  const successNotification = new Notification($T('SETTINGS_SHORT_URL'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}

function handleShortUrlServerChange (val: string) {
  saveConfig('settings.shortUrlServer', val)
}

function handleYourlsDomainChange (val: string) {
  saveConfig('settings.yourlsDomain', val)
}

function handleYourlsSignatureChange (val: string) {
  saveConfig('settings.yourlsSignature', val)
}

function handleAesPasswordChange (val: string) {
  saveConfig('settings.aesPassword', val || 'PicList-aesPassword')
}

function confirmLogLevelSetting () {
  if (form.logLevel.length === 0) {
    return $message.error($T('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
  }
  saveConfig({
    'settings.logLevel': form.logLevel,
    'settings.logFileSizeLimit': form.logFileSizeLimit
  })
  const successNotification = new Notification($T('SETTINGS_SET_LOG_FILE'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  logFileVisible.value = false
}

async function cancelLogLevelSetting () {
  logFileVisible.value = false
  let logLevel = await getConfig<string | string[]>('settings.logLevel')
  const logFileSizeLimit = await getConfig<number>('settings.logFileSizeLimit') || 10
  if (!Array.isArray(logLevel)) {
    if (logLevel && logLevel.length > 0) {
      logLevel = [logLevel]
    } else {
      logLevel = ['all']
    }
  }
  form.logLevel = logLevel
  form.logFileSizeLimit = logFileSizeLimit
}

function DownMessage (failed: number) {
  if (failed) {
    $message.error($T('SETTINGS_SYNC_DOWNLOAD_FAILED', { failed }))
  } else {
    $message.success($T('SETTINGS_SYNC_DOWNLOAD_SUCCESS'))
  }
}

function upMessage (failed: number) {
  if (failed) {
    $message.error($T('SETTINGS_SYNC_UPLOAD_FAILED', { failed }))
  } else {
    $message.success($T('SETTINGS_SYNC_UPLOAD_SUCCESS'))
  }
}

async function uploadCommonConfig () {
  const result = await invokeToMain('uploadCommonConfig')
  const failed = 2 - result
  upMessage(failed)
}

async function downloadCommonConfig () {
  const result = await invokeToMain('downloadCommonConfig')
  const failed = 2 - result
  DownMessage(failed)
}

async function uploadManageConfig () {
  const result = await invokeToMain('uploadManageConfig')
  const failed = 2 - result
  upMessage(failed)
}

async function downloadManageConfig () {
  const result = await invokeToMain('downloadManageConfig')
  const failed = 2 - result
  DownMessage(failed)
}

async function uploadAll () {
  const result = await invokeToMain('uploadAllConfig')
  const failed = 4 - result
  if (result === 4) {
    $message.success($T('SETTINGS_SYNC_UPLOAD_SUCCESS'))
  } else {
    $message.error($T('SETTINGS_SYNC_UPLOAD_FAILED') + `(${failed})`)
  }
}

async function downloadAll () {
  const result = await invokeToMain('downloadAllConfig')
  const failed = 4 - result
  if (result === 4) {
    $message.success($T('SETTINGS_SYNC_DOWNLOAD_SUCCESS'))
  } else {
    $message.error($T('SETTINGS_SYNC_DOWNLOAD_FAILED') + `(${failed})`)
  }
}

function confirmServerSetting () {
  server.value.port = parseInt(server.value.port as unknown as string, 10)
  saveConfig({
    'settings.server': server.value
  })
  const successNotification = new Notification($T('SETTINGS_SET_PICGO_SERVER'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  serverVisible.value = false
  sendToMain('updateServer')
}

async function cancelServerSetting () {
  serverVisible.value = false
  server.value = await getConfig('settings.server') || {
    port: 36677,
    host: '0.0.0.0',
    enable: true
  }
}

function handleLevelDisabled (val: string) {
  const currentLevel = val
  let flagLevel
  const result = form.logLevel.some(item => {
    if (item === 'all' || item === 'none') {
      flagLevel = item
    }
    return (item === 'all' || item === 'none')
  })
  if (result) {
    if (currentLevel !== flagLevel) {
      return true
    }
  } else if (form.logLevel.length > 0) {
    if (val === 'all' || val === 'none') {
      return true
    }
  }
  return false
}

function handleLanguageChange (val: string) {
  i18nManager.setCurrentLanguage(val)
  saveConfig({
    'settings.language': val
  })
  sendToMain(GET_PICBEDS)
}

function handleStartModeChange (val: 'quiet' | 'mini' | 'main' | 'no-tray') {
  if (val === 'no-tray') {
    if (form.isHideDock) {
      ElMessage.warning($T('SETTINGS_ISHIDEDOCK_TIPS'))
      currentStartMode.value = 'quiet'
      return
    }
    $message.info($T('TIPS_NEED_RELOAD'))
  }
  saveConfig({
    'settings.startMode': val
  })
}

function handleManualPageOpenChange (val: string) {
  saveConfig({
    'settings.manualPageOpen': val
  })
}

function goConfigPage () {
  sendToMain(OPEN_URL, 'https://piclist.cn/configure.html')
}

function goShortCutPage () {
  $router.push({
    name: SHORTKEY_PAGE
  })
}

onBeforeUnmount(() => {
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
})

</script>
<script lang="ts">
export default {
  name: 'SettingPage'
}
</script>
<style lang='stylus'>
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
#picgo-setting
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
