import { d as defineComponent, r as ref, b9 as i18nManager, ba as ISartMode, T, am as computed, a3 as picBedGlobal, a as reactive, o as onBeforeMount, k as getConfig, H as osGlobal, af as saveConfig, p as configPaths, j as IRPCActionType, c as createElementBlock, e as openBlock, q as createVNode, v as withCtx, y as resolveComponent, u as unref, D as watch, ag as pkg, s as sendRPC, B as createTextVNode, t as toDisplayString, bb as reading_default, bc as ElForm, N as createBlock, g as createCommentVNode, F as Fragment, h as renderList, a8 as info_filled_default, f as createBaseVNode, A as close_default, aJ as edit_default, bd as toRaw, ae as ElMessageBox, m as triggerRPC, J as ElMessage, U as updatePicBedGlobal, ad as II18nLanguage, Q as useRouter, be as SHORTKEY_PAGE } from "./index-BqdcQlNn.js";
import { _ as _sfc_main$1 } from "./ImageProcessSetting.vue_vue_type_script_setup_true_lang-DFtMAQE7.js";
import { j as buildInRenameFormatTable } from "./common-REXFY3_s.js";
import { R as RELEASE_URL, b as RELEASE_URL_BACKUP } from "./static-DltyNkMh.js";
import { e as enforceNumber } from "./common-DNjr697i.js";
import "./dataSender-Bg45AIFL.js";
const semver = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
const validateAndParse = (version) => {
  if (typeof version !== "string") {
    throw new TypeError("Invalid argument expected string");
  }
  const match = version.match(semver);
  if (!match) {
    throw new Error(`Invalid argument not valid semver ('${version}' received)`);
  }
  match.shift();
  return match;
};
const isWildcard = (s) => s === "*" || s === "x" || s === "X";
const tryParse = (v) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? v : n;
};
const forceType = (a, b) => typeof a !== typeof b ? [String(a), String(b)] : [a, b];
const compareStrings = (a, b) => {
  if (isWildcard(a) || isWildcard(b))
    return 0;
  const [ap, bp] = forceType(tryParse(a), tryParse(b));
  if (ap > bp)
    return 1;
  if (ap < bp)
    return -1;
  return 0;
};
const compareSegments = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const r = compareStrings(a[i] || "0", b[i] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
};
const compareVersions = (v1, v2) => {
  const n1 = validateAndParse(v1);
  const n2 = validateAndParse(v2);
  const p1 = n1.pop();
  const p2 = n2.pop();
  const r = compareSegments(n1, n2);
  if (r !== 0)
    return r;
  if (p1 && p2) {
    return compareSegments(p1.split("."), p2.split("."));
  } else if (p1 || p2) {
    return p1 ? -1 : 1;
  }
  return 0;
};
const compare = (v1, v2, operator) => {
  assertValidOperator(operator);
  const res = compareVersions(v1, v2);
  return operatorResMap[operator].includes(res);
};
const operatorResMap = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
};
const allowedOperators = Object.keys(operatorResMap);
const assertValidOperator = (op) => {
  if (allowedOperators.indexOf(op) === -1) {
    throw new Error(`Invalid operator, expected one of ${allowedOperators.join("|")}`);
  }
};
const getLatestVersion = async () => {
  try {
    const { data: normalList } = await window.node.axios.get(RELEASE_URL);
    return normalList[0].name;
  } catch (err) {
    console.error("Error fetching latest version: ", err);
    try {
      const { data } = await window.node.axios.get(`${RELEASE_URL_BACKUP}/latest.yml`);
      const r = window.node.yaml.load(data);
      return r.version;
    } catch (err2) {
      console.error("Error fetching backup latest version: ", err2);
      return "";
    }
  }
};
const _hoisted_1 = { id: "piclist-setting" };
const _hoisted_2 = { class: "custom-title" };
const _hoisted_3 = { key: 0 };
const _hoisted_4 = { style: { "margin-top": "10px", "align-items": "center", "display": "flex", "justify-content": "flex-end" } };
const _hoisted_5 = { class: "notice-text" };
const _hoisted_6 = { class: "notice-text" };
const _hoisted_7 = {
  class: "notice-text",
  style: { "align-items": "center", "display": "flex", "justify-content": "center" }
};
const __default__ = {
  name: "SettingPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const $router = useRouter();
    const activeName = ref("system");
    const shortUrlServerList = [
      {
        label: "c1n",
        value: "c1n"
      },
      {
        label: "yourls",
        value: "yourls"
      },
      {
        label: "xyTom/Url-Shorten-Worker",
        value: "cf_worker"
      },
      {
        label: "ccbikai/Sink",
        value: "sink"
      }
    ];
    const languageList = i18nManager.languageList.map((item) => ({
      label: item.label,
      value: item.value
    }));
    const startModeList = Object.values(ISartMode).map((item) => ({
      label: T(`SETTINGS_START_MODE_${item.toUpperCase().replace(/-/g, "_")}`),
      value: item
    }));
    const manualPageOpenList = [
      {
        label: T("MANUAL_PAGE_OPEN_BY_BUILD_IN"),
        value: "window"
      },
      {
        label: T("MANUAL_PAGE_OPEN_BY_BROWSER"),
        value: "browser"
      }
    ];
    const showPicBedList = computed(
      () => picBedGlobal.value.map((item) => {
        if (item.visible) {
          return item.name;
        }
        return null;
      }).filter((item) => item)
    );
    const $customLink = ref(null);
    const customLinkRule = (_, value, callback) => {
      if (!/\$url/.test(value) && !/\$fileName/.test(value) && !/\$extName/.test(value)) {
        return callback(new Error(T("TIPS_MUST_CONTAINS_URL")));
      } else {
        return callback();
      }
    };
    const formOfSetting = ref({
      showUpdateTip: true,
      autoStart: false,
      rename: false,
      autoRename: false,
      uploadNotification: false,
      uploadResultNotification: true,
      miniWindowOntop: false,
      autoCloseMiniWindow: false,
      autoCloseMainWindow: false,
      logLevel: ["all"],
      autoCopy: true,
      useBuiltinClipboard: true,
      logFileSizeLimit: 10,
      deleteCloudFile: false,
      isCustomMiniIcon: false,
      customMiniIcon: "",
      isHideDock: false,
      autoImport: false,
      autoImportPicBed: [],
      encodeOutputURL: false,
      isAutoListenClipboard: false,
      useShortUrl: false,
      shortUrlServer: "c1n",
      c1nToken: "",
      yourlsDomain: "",
      yourlsSignature: "",
      cfWorkerHost: "",
      sinkDomain: "",
      sinkToken: "",
      deleteLocalFile: false,
      serverKey: "",
      aesPassword: "PicList-aesPassword",
      enableWebServer: false,
      webServerHost: "0.0.0.0",
      webServerPort: 37777,
      webServerPath: "",
      registry: "",
      proxy: "",
      mainWindowWidth: 1200,
      mainWindowHeight: 800,
      enableSecondUploader: false
    });
    const proxy = ref("");
    const formKeys = Object.keys(formOfSetting.value);
    const autoWatchKeys = [
      "showUpdateTip",
      "autoImport",
      "autoImportPicBed",
      "useBuiltinClipboard",
      "isAutoListenClipboard",
      "deleteCloudFile",
      "deleteLocalFile",
      "rename",
      "autoRename",
      "enableWebServer",
      "webServerHost",
      "webServerPath",
      "serverKey",
      "uploadNotification",
      "uploadResultNotification",
      "autoCloseMainWindow",
      "autoCloseMiniWindow",
      "isCustomMiniIcon",
      "c1nToken",
      "yourlsDomain",
      "yourlsSignature",
      "cfWorkerHost",
      "sinkDomain",
      "sinkToken",
      "registry",
      "proxy",
      "autoCopy",
      "encodeOutputURL",
      "useShortUrl",
      "enableSecondUploader"
    ];
    const addWatch = () => {
      autoWatchKeys.forEach((key) => {
        watch(
          () => formOfSetting.value[key],
          (value) => {
            saveConfig({
              [`settings.${key}`]: value
            });
          }
        );
      });
    };
    const addProxyWatch = () => {
      watch(proxy, (value) => {
        saveConfig({
          "picBed.proxy": value
        });
      });
    };
    const valueToOptionItem = (value, list) => {
      return list.find((item) => item.value === value) || list[0];
    };
    const currentLanguage = ref();
    const currentStartMode = ref();
    const currentManualPageOpen = ref();
    const currentShortUrlServer = ref();
    const logFileVisible = ref(false);
    const customLinkVisible = ref(false);
    const checkUpdateVisible = ref(false);
    const serverVisible = ref(false);
    const webServerVisible = ref(false);
    const syncVisible = ref(false);
    const upDownConfigVisible = ref(false);
    const proxyVisible = ref(false);
    const mainWindowSizeVisible = ref(false);
    const advancedRenameVisible = ref(false);
    const imageProcessDialogVisible = ref(false);
    const rawPicGoSize = ref(false);
    const customLink = reactive({
      value: "![$fileName]($url)"
    });
    const rules = reactive({
      value: [{ validator: customLinkRule, trigger: "blur" }]
    });
    const logLevel = {
      all: T("SETTINGS_LOG_LEVEL_ALL"),
      success: T("SETTINGS_LOG_LEVEL_SUCCESS"),
      error: T("SETTINGS_LOG_LEVEL_ERROR"),
      info: T("SETTINGS_LOG_LEVEL_INFO"),
      warn: T("SETTINGS_LOG_LEVEL_WARN"),
      none: T("SETTINGS_LOG_LEVEL_NONE")
    };
    const server = ref({
      port: 36677,
      host: "0.0.0.0",
      enable: true
    });
    const advancedRename = ref({
      enable: false,
      format: "{filename}"
    });
    const sync = ref({
      type: "github",
      username: "",
      repo: "",
      branch: "",
      token: "",
      endpoint: "",
      proxy: "",
      interval: 60,
      // WebDAV-specific fields
      password: "",
      authType: "basic",
      sslEnabled: true,
      webdavSavePath: ""
    });
    const syncType = ["github", "gitee", "gitea", "webdav"];
    async function cancelSyncSetting() {
      syncVisible.value = false;
      sync.value = await getConfig(configPaths.settings.sync) || {
        type: "github",
        username: "",
        repo: "",
        branch: "",
        token: "",
        endpoint: "",
        proxy: "",
        interval: 60,
        // WebDAV-specific fields
        webdavEndpoint: "",
        webdavUsername: "",
        webdavPassword: "",
        webdavAuthType: "basic",
        webdavSslEnabled: true,
        webdavSavePath: ""
      };
    }
    function confirmSyncSetting() {
      saveConfig({
        [configPaths.settings.sync]: sync.value
      });
      syncVisible.value = false;
    }
    const version = pkg.version;
    const latestVersion = ref("");
    const needUpdate = computed(() => {
      if (latestVersion.value) {
        return compareVersion2Update(version, latestVersion.value);
      }
      return false;
    });
    onBeforeMount(() => {
      initData();
    });
    async function initData() {
      const config = await getConfig() || {};
      const settings = config.settings || {};
      const picBed = config.picBed;
      formKeys.forEach((key) => {
        formOfSetting.value[key] = settings[key] ?? formOfSetting.value[key];
      });
      formOfSetting.value.logLevel = initArray(settings.logLevel || [], ["all"]);
      formOfSetting.value.autoImportPicBed = initArray(settings.autoImportPicBed || [], []);
      currentLanguage.value = valueToOptionItem(settings.language || "zh-CN", languageList);
      currentStartMode.value = valueToOptionItem(settings.startMode || ISartMode.QUIET, startModeList);
      if (osGlobal.value === "darwin" && currentStartMode.value.value === ISartMode.MINI) {
        currentStartMode.value = valueToOptionItem(ISartMode.QUIET, startModeList);
        saveConfig(configPaths.settings.startMode, ISartMode.QUIET);
      }
      currentManualPageOpen.value = valueToOptionItem(settings.manualPageOpen || "window", manualPageOpenList);
      currentShortUrlServer.value = valueToOptionItem(settings.shortUrlServer || "c1n", shortUrlServerList);
      customLink.value = settings.customLink || "![$fileName]($url)";
      proxy.value = picBed.proxy || "";
      server.value = settings.server || {
        port: 36677,
        host: "0.0.0.0",
        enable: true
      };
      advancedRename.value = config.buildIn?.rename || {
        enable: false,
        format: "{filename}"
      };
      if (advancedRename.value.enable) {
        formOfSetting.value.autoRename = false;
        saveConfig({
          [configPaths.settings.autoRename]: false
        });
      }
      sync.value = settings.sync || {
        type: "github",
        username: "",
        repo: "",
        branch: "",
        token: "",
        endpoint: "",
        proxy: "",
        interval: 60,
        // WebDAV-specific fields
        webdavEndpoint: "",
        webdavUsername: "",
        webdavPassword: "",
        webdavAuthType: "basic",
        webdavSslEnabled: true,
        webdavSavePath: ""
      };
      formOfSetting.value.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10;
      addProxyWatch();
      addWatch();
    }
    function initArray(arrayT, defaultValue) {
      if (!Array.isArray(arrayT)) {
        if (arrayT && arrayT.length > 0) {
          arrayT = [arrayT];
        } else {
          arrayT = defaultValue;
        }
      }
      return arrayT;
    }
    async function handleChangeSecondPicBed() {
      sendRPC(IRPCActionType.SHOW_SECOND_UPLOADER_MENU);
    }
    function openFile(file) {
      sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file);
    }
    function handleManualPageOpenChange(val) {
      saveConfig({
        [configPaths.settings.manualPageOpen]: val
      });
    }
    function openDirectory(directory, inStorePath = true) {
      sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath);
    }
    function openLogSetting() {
      logFileVisible.value = true;
    }
    async function cancelCustomLink() {
      customLinkVisible.value = false;
      customLink.value = await getConfig(configPaths.settings.customLink) || "![$fileName]($url)";
    }
    function confirmCustomLink() {
      $customLink.value?.validate((valid) => {
        if (valid) {
          saveConfig(configPaths.settings.customLink, customLink.value);
          customLinkVisible.value = false;
        }
      });
    }
    async function handleCancelAdvancedRename() {
      advancedRenameVisible.value = false;
      advancedRename.value = toRaw(
        await getConfig(configPaths.buildIn.rename) || {
          enable: false,
          format: "{filename}"
        }
      );
    }
    function handleSaveAdvancedRename() {
      saveConfig(configPaths.buildIn.rename, toRaw(advancedRename.value));
      if (advancedRename.value.enable) {
        formOfSetting.value.autoRename = false;
        saveConfig(configPaths.settings.autoRename, false);
      }
      advancedRenameVisible.value = false;
    }
    function handleMigrateFromPicGo() {
      ElMessageBox.confirm(T("SETTINGS_MIGRATE_FROM_PICGO_CONTENT"), T("SETTINGS_MIGRATE_FROM_PICGO_TITLE"), {
        confirmButtonText: T("CONFIRM"),
        cancelButtonText: T("CANCEL"),
        type: "warning",
        center: true
      }).then(() => {
        triggerRPC(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO).then(() => {
          ElMessage.success(T("SETTINGS_MIGRATE_FROM_PICGO_SUCCESS"));
        }).catch(() => {
          ElMessage.error(T("SETTINGS_MIGRATE_FROM_PICGO_FAILED"));
        });
      }).catch(() => {
        return false;
      });
    }
    function handleHideDockChange(val) {
      if (val && currentStartMode.value.value === ISartMode.NO_TRAY) {
        ElMessage.warning(T("SETTINGS_ISHIDEDOCK_TIPS"));
        formOfSetting.value.isHideDock = false;
        return;
      }
      saveConfig(configPaths.settings.isHideDock, val);
      sendRPC(IRPCActionType.HIDE_DOCK, val);
    }
    function handleShowPicBedListChange(val) {
      const list = picBedGlobal.value.map((item) => {
        if (!val.includes(item.name)) {
          item.visible = false;
        } else {
          item.visible = true;
        }
        return item;
      });
      saveConfig({
        [configPaths.picBed.list]: list
      });
      updatePicBedGlobal();
    }
    function handleAutoStartChange(val) {
      saveConfig(configPaths.settings.autoStart, val);
      sendRPC(IRPCActionType.PICLIST_AUTO_START, val);
    }
    function compareVersion2Update(current, latest) {
      return compare(current, latest, "<");
    }
    async function checkUpdate() {
      checkUpdateVisible.value = true;
      latestVersion.value = await getLatestVersion() || T("TIPS_NETWORK_ERROR");
    }
    function confirmCheckVersion() {
      if (needUpdate.value) {
        sendRPC(IRPCActionType.RELOAD_APP);
      }
      checkUpdateVisible.value = false;
    }
    function cancelCheckVersion() {
      checkUpdateVisible.value = false;
    }
    function handleWebServerPortChange(val, _) {
      saveConfig(configPaths.settings.webServerPort, Number(val) || 37777);
    }
    function confirmWebServerSetting() {
      if (formOfSetting.value.enableWebServer) {
        sendRPC(IRPCActionType.ADVANCED_RESTART_WEB_SERVER);
      } else {
        sendRPC(IRPCActionType.ADVANCED_STOP_WEB_SERVER);
      }
    }
    async function getMainWindowSize() {
      formOfSetting.value.mainWindowWidth = await getConfig(configPaths.settings.mainWindowWidth) || 1200;
      formOfSetting.value.mainWindowHeight = await getConfig(configPaths.settings.mainWindowHeight) || 800;
    }
    async function cancelWindowSize() {
      mainWindowSizeVisible.value = false;
      await getMainWindowSize();
    }
    async function confirmWindowSize() {
      mainWindowSizeVisible.value = false;
      const width = enforceNumber(formOfSetting.value.mainWindowWidth);
      const height = enforceNumber(formOfSetting.value.mainWindowHeight);
      saveConfig({
        [configPaths.settings.mainWindowWidth]: rawPicGoSize.value ? 800 : width < 100 ? 100 : width,
        [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : height < 100 ? 100 : height
      });
      await getMainWindowSize();
    }
    function handleMiniWindowOntop(val) {
      saveConfig(configPaths.settings.miniWindowOntop, val);
      sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val);
    }
    async function handleMiniIconPath(_) {
      const result = await triggerRPC(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG);
      if (result && result[0]) {
        formOfSetting.value.customMiniIcon = result[0];
        saveConfig(configPaths.settings.customMiniIcon, formOfSetting.value.customMiniIcon);
        sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON, formOfSetting.value.customMiniIcon);
      }
    }
    function handleShortUrlServerChange(val) {
      formOfSetting.value.shortUrlServer = val;
      saveConfig(configPaths.settings.shortUrlServer, val);
    }
    function handleAesPasswordChange(val) {
      saveConfig(configPaths.settings.aesPassword, val || "PicList-aesPassword");
    }
    function confirmLogLevelSetting() {
      if (formOfSetting.value.logLevel.length === 0) {
        return ElMessage.error(T("TIPS_PLEASE_CHOOSE_LOG_LEVEL"));
      }
      saveConfig({
        [configPaths.settings.logLevel]: formOfSetting.value.logLevel,
        [configPaths.settings.logFileSizeLimit]: formOfSetting.value.logFileSizeLimit
      });
      logFileVisible.value = false;
    }
    async function cancelLogLevelSetting() {
      logFileVisible.value = false;
      let logLevel2 = await getConfig(configPaths.settings.logLevel);
      const logFileSizeLimit = await getConfig(configPaths.settings.logFileSizeLimit) || 10;
      if (!Array.isArray(logLevel2)) {
        if (logLevel2 && logLevel2.length > 0) {
          logLevel2 = [logLevel2];
        } else {
          logLevel2 = ["all"];
        }
      }
      formOfSetting.value.logLevel = logLevel2;
      formOfSetting.value.logFileSizeLimit = logFileSizeLimit;
    }
    function syncMessage(failed, taskType) {
      if (failed) {
        ElMessage.error(T(`SETTINGS_SYNC_${taskType}_FAILED`, { failed }));
      } else {
        ElMessage.success(T(`SETTINGS_SYNC_${taskType}_SUCCESS`));
      }
    }
    const syncTaskList = [
      {
        task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
        label: T("SETTINGS_SYNC_COMMON_CONFIG"),
        number: 2
      },
      {
        task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
        label: T("SETTINGS_SYNC_MANAGE_CONFIG"),
        number: 2
      },
      {
        task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
        label: T("SETTINGS_SYNC_UPLOAD_ALL"),
        number: 4
      },
      {
        task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
        label: T("SETTINGS_SYNC_COMMON_CONFIG"),
        number: 2
      },
      {
        task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
        label: T("SETTINGS_SYNC_MANAGE_CONFIG"),
        number: 2
      },
      {
        task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
        label: T("SETTINGS_SYNC_DOWNLOAD_ALL"),
        number: 4
      }
    ];
    async function syncTaskFn(task, number) {
      const failed = number - (await triggerRPC(task) || 0);
      syncMessage(failed, task.includes("UPLOAD") ? "UPLOAD" : "DOWNLOAD");
    }
    function confirmServerSetting() {
      server.value.port = parseInt(server.value.port, 10);
      saveConfig({
        [configPaths.settings.server]: server.value
      });
      serverVisible.value = false;
      sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER);
    }
    async function cancelServerSetting() {
      serverVisible.value = false;
      server.value = await getConfig(configPaths.settings.server) || {
        port: 36677,
        host: "0.0.0.0",
        enable: true
      };
    }
    function handleLevelDisabled(val) {
      const currentLevel = val;
      let flagLevel;
      const result = formOfSetting.value.logLevel.some((item) => {
        if (item === "all" || item === "none") {
          flagLevel = item;
        }
        return item === "all" || item === "none";
      });
      if (result) {
        if (currentLevel !== flagLevel) {
          return true;
        }
      } else if (formOfSetting.value.logLevel.length > 0) {
        if (val === "all" || val === "none") {
          return true;
        }
      }
      return false;
    }
    function handleLanguageChange(val) {
      i18nManager.setCurrentLanguage(val);
      saveConfig({
        [configPaths.settings.language]: val
      });
      updatePicBedGlobal();
    }
    function handleStartModeChange(val) {
      if (val === ISartMode.NO_TRAY) {
        if (formOfSetting.value.isHideDock) {
          ElMessage.warning(T("SETTINGS_ISHIDEDOCK_TIPS"));
          currentStartMode.value = valueToOptionItem(ISartMode.QUIET, startModeList);
          return;
        }
        ElMessage.info(T("TIPS_NEED_RELOAD"));
      }
      saveConfig({
        [configPaths.settings.startMode]: val
      });
    }
    async function goConfigPage() {
      const lang = await getConfig(configPaths.settings.language) || II18nLanguage.ZH_CN;
      const url = lang === II18nLanguage.ZH_CN ? "https://piclist.cn/configure.html" : "https://piclist.cn/en/configure.html";
      sendRPC(IRPCActionType.OPEN_URL, url);
    }
    function goShortCutPage() {
      $router.push({
        name: SHORTKEY_PAGE
      });
    }
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_tab_pane = resolveComponent("el-tab-pane");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_checkbox = resolveComponent("el-checkbox");
      const _component_el_checkbox_group = resolveComponent("el-checkbox-group");
      const _component_el_divider = resolveComponent("el-divider");
      const _component_el_tabs = resolveComponent("el-tabs");
      const _component_el_dialog = resolveComponent("el-dialog");
      const _component_el_link = resolveComponent("el-link");
      const _component_el_descriptions_item = resolveComponent("el-descriptions-item");
      const _component_el_descriptions = resolveComponent("el-descriptions");
      const _component_el_popover = resolveComponent("el-popover");
      const _component_el_input_number = resolveComponent("el-input-number");
      const _component_el_button_group = resolveComponent("el-button-group");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_row, {
          class: "view-title",
          align: "middle",
          justify: "center"
        }, {
          default: withCtx(() => [
            createTextVNode(toDisplayString(unref(T)("PICLIST_SETTINGS")) + " - ", 1),
            createVNode(_component_el_icon, {
              class: "el-icon-document",
              onClick: goConfigPage
            }, {
              default: withCtx(() => [
                createVNode(unref(reading_default))
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        createVNode(_component_el_tabs, {
          modelValue: activeName.value,
          "onUpdate:modelValue": _cache[45] || (_cache[45] = ($event) => activeName.value = $event),
          stretch: "",
          style: { "height": "calc(100vh - 50px)", "width": "100%", "overflow-x": "hidden", "top": "50px", "position": "absolute" },
          "tab-position": "left",
          lazy: ""
        }, {
          default: withCtx(() => [
            createVNode(_component_el_tab_pane, {
              name: "system",
              label: unref(T)("SETTINGS_TAB_SYSTEM"),
              style: { "height": "calc(100vh - 50px)", "overflow-y": "scroll", "color": "#fff" }
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { class: "setting-list" }, {
                  default: withCtx(() => [
                    createVNode(_component_el_col, {
                      span: 22,
                      offset: 1
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { style: { "width": "100%" } }, {
                          default: withCtx(() => [
                            createVNode(unref(ElForm), {
                              "label-position": "left",
                              "label-width": "50%",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_CHOOSE_LANGUAGE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_select, {
                                      modelValue: currentLanguage.value,
                                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => currentLanguage.value = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_CHOOSE_LANGUAGE"),
                                      persistent: false,
                                      teleported: "",
                                      onChange: handleLanguageChange
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(languageList), (item) => {
                                          return openBlock(), createBlock(_component_el_option, {
                                            key: item.value,
                                            label: item.label,
                                            value: item.value
                                          }, null, 8, ["label", "value"]);
                                        }), 128))
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_START_MODE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_select, {
                                      modelValue: currentStartMode.value,
                                      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => currentStartMode.value = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_START_MODE"),
                                      persistent: false,
                                      teleported: "",
                                      onChange: handleStartModeChange
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_el_option, {
                                          key: "quiet",
                                          label: unref(T)("SETTINGS_START_MODE_QUIET"),
                                          value: "quiet"
                                        }, null, 8, ["label"]),
                                        unref(osGlobal) !== "darwin" ? (openBlock(), createBlock(_component_el_option, {
                                          key: "mini",
                                          label: unref(T)("SETTINGS_START_MODE_MINI"),
                                          value: "mini"
                                        }, null, 8, ["label"])) : createCommentVNode("", true),
                                        unref(osGlobal) === "darwin" ? (openBlock(), createBlock(_component_el_option, {
                                          key: "no-tray",
                                          label: unref(T)("SETTINGS_START_MODE_NO_TRAY"),
                                          value: "no-tray"
                                        }, null, 8, ["label"])) : createCommentVNode("", true),
                                        createVNode(_component_el_option, {
                                          key: "main",
                                          label: unref(T)("SETTINGS_START_MODE_MAIN"),
                                          value: "main"
                                        }, null, 8, ["label"])
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("MANUAL_PAGE_OPEN_SETTING_TIP")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_select, {
                                      modelValue: currentManualPageOpen.value,
                                      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => currentManualPageOpen.value = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("MANUAL_PAGE_OPEN_SETTING_TIP"),
                                      persistent: false,
                                      teleported: "",
                                      onChange: handleManualPageOpenChange
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(), createElementBlock(Fragment, null, renderList(manualPageOpenList, (item) => {
                                          return createVNode(_component_el_option, {
                                            key: item.value,
                                            label: item.label,
                                            value: item.value
                                          }, null, 8, ["label", "value"]);
                                        }), 64))
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                unref(osGlobal) === "darwin" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 0,
                                  label: unref(T)("SETTINGS_ISHIDEDOCK")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.isHideDock,
                                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => formOfSetting.value.isHideDock = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE"),
                                      onChange: handleHideDockChange
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_MAIN_WINDOW_SIZE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[4] || (_cache[4] = ($event) => mainWindowSizeVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                unref(osGlobal) !== "darwin" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 1,
                                  label: unref(T)("SETTINGS_CLOSE_MINI_WINDOW_SYNC")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoCloseMiniWindow,
                                      "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => formOfSetting.value.autoCloseMiniWindow = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                unref(osGlobal) !== "darwin" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 2,
                                  label: unref(T)("SETTINGS_CLOSE_MAIN_WINDOW_SYNC")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoCloseMainWindow,
                                      "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => formOfSetting.value.autoCloseMainWindow = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                unref(osGlobal) !== "darwin" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 3,
                                  label: unref(T)("SETTINGS_MINI_WINDOW_ON_TOP")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.miniWindowOntop,
                                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => formOfSetting.value.miniWindowOntop = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE"),
                                      onChange: handleMiniWindowOntop
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                unref(osGlobal) !== "darwin" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 4,
                                  label: unref(T)("SETTINGS_CUSTOM_MINI_ICON")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.isCustomMiniIcon,
                                      "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => formOfSetting.value.isCustomMiniIcon = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                unref(osGlobal) !== "darwin" && formOfSetting.value.isCustomMiniIcon ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 5,
                                  label: unref(T)("SETTINGS_CUSTOM_MINI_ICON_PATH")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: handleMiniIconPath
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_LAUNCH_ON_BOOT")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoStart,
                                      "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => formOfSetting.value.autoStart = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE"),
                                      onChange: handleAutoStartChange
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_SHORTCUT")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: goShortCutPage
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"]),
            createVNode(_component_el_tab_pane, {
              name: "syncAndConfigure",
              label: unref(T)("SETTINGS_TAB_SYNC_CONFIG"),
              style: { "height": "calc(100vh - 50px)", "overflow-y": "scroll", "color": "#fff" }
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { class: "setting-list" }, {
                  default: withCtx(() => [
                    createVNode(_component_el_col, {
                      span: 22,
                      offset: 1
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { style: { "width": "100%" } }, {
                          default: withCtx(() => [
                            createVNode(unref(ElForm), {
                              "label-position": "left",
                              "label-width": "50%",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SYNC_CONFIG")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[10] || (_cache[10] = ($event) => syncVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_UP_DOWN_DESC")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[11] || (_cache[11] = ($event) => upDownConfigVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_MIGRATE_FROM_PICGO")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: handleMigrateFromPicGo
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_OPEN_CONFIG_FILE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[12] || (_cache[12] = ($event) => openFile("data.json"))
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_CONFIG_FILE_PATH")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[13] || (_cache[13] = ($event) => openDirectory())
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"]),
            createVNode(_component_el_tab_pane, {
              name: "upload",
              label: unref(T)("SETTINGS_TAB_UPLOAD"),
              style: { "height": "calc(100vh - 50px)", "overflow-y": "scroll", "color": "#fff" }
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { class: "setting-list" }, {
                  default: withCtx(() => [
                    createVNode(_component_el_col, {
                      span: 22,
                      offset: 1
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { style: { "width": "100%" } }, {
                          default: withCtx(() => [
                            createVNode(unref(ElForm), {
                              "label-position": "left",
                              "label-width": "50%",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_AUTO_IMPORT")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoImport,
                                      "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => formOfSetting.value.autoImport = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                formOfSetting.value.autoImport ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 0,
                                  label: unref(T)("SETTINGS_AUTO_IMPORT_SELECT_PICBED")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_select, {
                                      modelValue: formOfSetting.value.autoImportPicBed,
                                      "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => formOfSetting.value.autoImportPicBed = $event),
                                      multiple: "",
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_AUTO_IMPORT_SELECT_PICBED"),
                                      persistent: false,
                                      teleported: ""
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(picBedGlobal), (item) => {
                                          return openBlock(), createBlock(_component_el_option, {
                                            key: item.type,
                                            label: item.name,
                                            value: item.type
                                          }, null, 8, ["label", "value"]);
                                        }), 128))
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_ENABLE_SECOND_PICBED")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.enableSecondUploader,
                                      "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => formOfSetting.value.enableSecondUploader = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_SECOND_PICBED")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: handleChangeSecondPicBed
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SYNC_DELETE_CLOUD")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.deleteCloudFile,
                                      "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => formOfSetting.value.deleteCloudFile = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_OPEN_UPLOAD_TIPS")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.uploadNotification,
                                      "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => formOfSetting.value.uploadNotification = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_OPEN_UPLOAD_RESULT_TIPS")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.uploadResultNotification,
                                      "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => formOfSetting.value.uploadResultNotification = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_COMPRESS_AND_WATERMARK")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[20] || (_cache[20] = ($event) => imageProcessDialogVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_RENAME_BEFORE_UPLOAD")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.rename,
                                      "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => formOfSetting.value.rename = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_TIMESTAMP_RENAME")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoRename,
                                      "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => formOfSetting.value.autoRename = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_ADVANCED_RENAME")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[23] || (_cache[23] = ($event) => advancedRenameVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_DELETE_LOCAL_FILE_AFTER_UPLOAD")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.deleteLocalFile,
                                      "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => formOfSetting.value.deleteLocalFile = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_AUTO_COPY_URL_AFTER_UPLOAD")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.autoCopy,
                                      "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => formOfSetting.value.autoCopy = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_CUSTOM_LINK_FORMAT")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[26] || (_cache[26] = ($event) => customLinkVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SHORT_URL")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.useShortUrl,
                                      "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => formOfSetting.value.useShortUrl = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                formOfSetting.value.useShortUrl ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 1,
                                  label: unref(T)("SETTINGS_SHORT_URL_SERVER")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_select, {
                                      modelValue: currentShortUrlServer.value,
                                      "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => currentShortUrlServer.value = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_URL_SERVER"),
                                      persistent: false,
                                      teleported: "",
                                      onChange: handleShortUrlServerChange
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(), createElementBlock(Fragment, null, renderList(shortUrlServerList, (item) => {
                                          return createVNode(_component_el_option, {
                                            key: item.value,
                                            label: item.label,
                                            value: item.value
                                          }, null, 8, ["label", "value"]);
                                        }), 64))
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "c1n" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 2,
                                  label: unref(T)("SETTINGS_SHORT_URL_C1N_TOKEN")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.c1nToken,
                                      "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => formOfSetting.value.c1nToken = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_URL_C1N_TOKEN")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "yourls" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 3,
                                  label: unref(T)("SETTINGS_SHORT_URL_YOURLS_DOMAIN")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.yourlsDomain,
                                      "onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => formOfSetting.value.yourlsDomain = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_URL_YOURLS_DOMAIN")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "yourls" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 4,
                                  label: unref(T)("SETTINGS_SHORT_URL_YOURLS_SIGNATURE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.yourlsSignature,
                                      "onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => formOfSetting.value.yourlsSignature = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_URL_YOURLS_SIGNATURE")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "cf_worker" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 5,
                                  label: unref(T)("SETTINGS_SHORT_URL_CF_WORKER_HOST")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.cfWorkerHost,
                                      "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => formOfSetting.value.cfWorkerHost = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_URL_CF_WORKER_HOST")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "sink" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 6,
                                  label: unref(T)("SETTINGS_SHORT_SINK_DOMAIN")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.sinkDomain,
                                      "onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => formOfSetting.value.sinkDomain = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_SINK_DOMAIN")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                formOfSetting.value.useShortUrl && formOfSetting.value.shortUrlServer === "sink" ? (openBlock(), createBlock(_component_el_form_item, {
                                  key: 7,
                                  label: unref(T)("SETTINGS_SHORT_SINK_TOKEN")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.sinkToken,
                                      "onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => formOfSetting.value.sinkToken = $event),
                                      size: "small",
                                      style: { "width": "50%" },
                                      placeholder: unref(T)("SETTINGS_SHORT_SINK_TOKEN")
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])) : createCommentVNode("", true),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_ENCODE_OUTPUT_URL")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.encodeOutputURL,
                                      "onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => formOfSetting.value.encodeOutputURL = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, null, {
                                  label: withCtx(() => [
                                    createVNode(_component_el_row, { align: "middle" }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_USE_BUILTIN_CLIPBOARD_UPLOAD")) + " ", 1),
                                        createVNode(_component_el_tooltip, {
                                          class: "item",
                                          effect: "dark",
                                          content: unref(T)("BUILTIN_CLIPBOARD_TIPS"),
                                          placement: "right",
                                          persistent: false,
                                          teleported: ""
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(_component_el_icon, { style: { "margin-left": "4px" } }, {
                                              default: withCtx(() => [
                                                createVNode(unref(info_filled_default))
                                              ]),
                                              _: 1
                                            })
                                          ]),
                                          _: 1
                                        }, 8, ["content"])
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.useBuiltinClipboard,
                                      "onUpdate:modelValue": _cache[36] || (_cache[36] = ($event) => formOfSetting.value.useBuiltinClipboard = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_WATCH_CLIPBOARD")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.isAutoListenClipboard,
                                      "onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => formOfSetting.value.isAutoListenClipboard = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  style: { marginRight: "-64px" },
                                  label: unref(T)("CHOOSE_SHOWED_PICBED")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_checkbox_group, {
                                      modelValue: showPicBedList.value,
                                      "onUpdate:modelValue": _cache[38] || (_cache[38] = ($event) => showPicBedList.value = $event),
                                      onChange: handleShowPicBedListChange
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(picBedGlobal), (item) => {
                                          return openBlock(), createBlock(_component_el_checkbox, {
                                            key: item.name,
                                            label: item.name,
                                            value: item.name
                                          }, null, 8, ["label", "value"]);
                                        }), 128))
                                      ]),
                                      _: 1
                                    }, 8, ["modelValue"])
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_divider, { "border-style": "none" }),
                                createVNode(_component_el_form_item)
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"]),
            createVNode(_component_el_tab_pane, {
              name: "advanced",
              label: unref(T)("SETTINGS_TAB_ADVANCED"),
              style: { "height": "calc(100vh - 50px)", "overflow-y": "scroll", "color": "#fff" }
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { class: "setting-list" }, {
                  default: withCtx(() => [
                    createVNode(_component_el_col, {
                      span: 22,
                      offset: 1
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { style: { "width": "100%" } }, {
                          default: withCtx(() => [
                            createVNode(unref(ElForm), {
                              "label-position": "left",
                              "label-width": "50%",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_LOG_FILE_PATH")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[39] || (_cache[39] = ($event) => openDirectory())
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_LOG_FILE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: openLogSetting
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_PROXY_AND_MIRROR")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[40] || (_cache[40] = ($event) => proxyVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_WEB_SERVER")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[41] || (_cache[41] = ($event) => webServerVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_SERVER")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: _cache[42] || (_cache[42] = ($event) => serverVisible.value = true)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_SET")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_SET_SERVER_AES_KEY")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_input, {
                                      modelValue: formOfSetting.value.aesPassword,
                                      "onUpdate:modelValue": _cache[43] || (_cache[43] = ($event) => formOfSetting.value.aesPassword = $event),
                                      modelModifiers: { trim: true },
                                      type: "input",
                                      placeholder: unref(T)("SETTINGS_SET_SERVER_AES_KEY"),
                                      size: "small",
                                      style: { "width": "50%" },
                                      onChange: handleAesPasswordChange
                                    }, null, 8, ["modelValue", "placeholder"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"]),
            createVNode(_component_el_tab_pane, {
              name: "upadte",
              label: unref(T)("SETTINGS_TAB_UPDATE"),
              style: { "height": "calc(100vh - 50px)", "overflow-y": "scroll" }
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { class: "setting-list" }, {
                  default: withCtx(() => [
                    createVNode(_component_el_col, {
                      span: 22,
                      offset: 1
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { style: { "width": "100%" } }, {
                          default: withCtx(() => [
                            createVNode(unref(ElForm), {
                              "label-position": "left",
                              "label-width": "50%",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_CHECK_UPDATE")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_button, {
                                      type: "primary",
                                      round: "",
                                      size: "small",
                                      onClick: checkUpdate
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_CHECK")), 1)
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["label"]),
                                createVNode(_component_el_form_item, {
                                  label: unref(T)("SETTINGS_OPEN_UPDATE_HELPER")
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_el_switch, {
                                      modelValue: formOfSetting.value.showUpdateTip,
                                      "onUpdate:modelValue": _cache[44] || (_cache[44] = ($event) => formOfSetting.value.showUpdateTip = $event),
                                      "active-text": unref(T)("SETTINGS_OPEN"),
                                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                                  ]),
                                  _: 1
                                }, 8, ["label"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"])
          ]),
          _: 1
        }, 8, ["modelValue"]),
        createVNode(_component_el_dialog, {
          modelValue: customLinkVisible.value,
          "onUpdate:modelValue": _cache[47] || (_cache[47] = ($event) => customLinkVisible.value = $event),
          title: unref(T)("SETTINGS_CUSTOM_LINK_FORMAT"),
          "modal-append-to-body": false,
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelCustomLink
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmCustomLink
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(unref(ElForm), {
              ref_key: "$customLink",
              ref: $customLink,
              "label-position": "top",
              model: customLink,
              rules,
              size: "small"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, { prop: "value" }, {
                  default: withCtx(() => [
                    createBaseVNode("div", _hoisted_2, [
                      createTextVNode(toDisplayString(unref(T)("SETTINGS_TIPS_PLACEHOLDER_URL")) + " ", 1),
                      _cache[89] || (_cache[89] = createBaseVNode("br", null, null, -1)),
                      createTextVNode(" " + toDisplayString(unref(T)("SETTINGS_TIPS_PLACEHOLDER_FILENAME")) + " ", 1),
                      _cache[90] || (_cache[90] = createBaseVNode("br", null, null, -1)),
                      createTextVNode(" " + toDisplayString(unref(T)("SETTINGS_TIPS_PLACEHOLDER_EXTNAME")), 1)
                    ]),
                    createVNode(_component_el_input, {
                      modelValue: customLink.value,
                      "onUpdate:modelValue": _cache[46] || (_cache[46] = ($event) => customLink.value = $event),
                      class: "align-center",
                      autofocus: true
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["model", "rules"]),
            createBaseVNode("div", null, toDisplayString(unref(T)("SETTINGS_TIPS_SUCH_AS")) + "[$fileName]($url)", 1)
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: proxyVisible.value,
          "onUpdate:modelValue": _cache[51] || (_cache[51] = ($event) => proxyVisible.value = $event),
          title: unref(T)("SETTINGS_SET_PROXY_AND_MIRROR"),
          "modal-append-to-body": false,
          width: "70%",
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "120px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_UPLOAD_PROXY")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: proxy.value,
                      "onUpdate:modelValue": _cache[48] || (_cache[48] = ($event) => proxy.value = $event),
                      clearable: "",
                      autofocus: true,
                      placeholder: `${unref(T)("SETTINGS_TIPS_SUCH_AS")}：http://127.0.0.1:1080`
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_PLUGIN_INSTALL_PROXY")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: formOfSetting.value.proxy,
                      "onUpdate:modelValue": _cache[49] || (_cache[49] = ($event) => formOfSetting.value.proxy = $event),
                      clearable: "",
                      placeholder: `${unref(T)("SETTINGS_TIPS_SUCH_AS")}：http://127.0.0.1:1080`
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_PLUGIN_INSTALL_MIRROR")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: formOfSetting.value.registry,
                      "onUpdate:modelValue": _cache[50] || (_cache[50] = ($event) => formOfSetting.value.registry = $event),
                      clearable: "",
                      placeholder: `${unref(T)("SETTINGS_TIPS_SUCH_AS")}：https://registry.npmmirror.com`
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: mainWindowSizeVisible.value,
          "onUpdate:modelValue": _cache[55] || (_cache[55] = ($event) => mainWindowSizeVisible.value = $event),
          title: unref(T)("SETTINGS_MAIN_WINDOW_SIZE"),
          "modal-append-to-body": false,
          width: "70%",
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelWindowSize
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmWindowSize
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "120px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_MAIN_WINDOW_SIZE_WIDTH")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: formOfSetting.value.mainWindowWidth,
                      "onUpdate:modelValue": _cache[52] || (_cache[52] = ($event) => formOfSetting.value.mainWindowWidth = $event),
                      autofocus: true,
                      placeholder: unref(T)("SETTINGS_MAIN_WINDOW_WIDTH_HINT")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_MAIN_WINDOW_SIZE_HEIGHT")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: formOfSetting.value.mainWindowHeight,
                      "onUpdate:modelValue": _cache[53] || (_cache[53] = ($event) => formOfSetting.value.mainWindowHeight = $event),
                      autofocus: true,
                      placeholder: unref(T)("SETTINGS_MAIN_WINDOW_HEIGHT_HINT")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_RAW_PICGO_SIZE")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_switch, {
                      modelValue: rawPicGoSize.value,
                      "onUpdate:modelValue": _cache[54] || (_cache[54] = ($event) => rawPicGoSize.value = $event),
                      "active-text": unref(T)("SETTINGS_OPEN"),
                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: checkUpdateVisible.value,
          "onUpdate:modelValue": _cache[56] || (_cache[56] = ($event) => checkUpdateVisible.value = $event),
          title: unref(T)("SETTINGS_CHECK_UPDATE"),
          "modal-append-to-body": false,
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelCheckVersion
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmCheckVersion
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createBaseVNode("div", null, toDisplayString(unref(T)("SETTINGS_CURRENT_VERSION")) + ": " + toDisplayString(unref(version)), 1),
            createBaseVNode("div", null, toDisplayString(unref(T)("SETTINGS_NEWEST_VERSION")) + ": " + toDisplayString(latestVersion.value ? latestVersion.value : `${unref(T)("SETTINGS_GETING")}...`), 1),
            needUpdate.value ? (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(unref(T)("SETTINGS_TIPS_HAS_NEW_VERSION")), 1)) : createCommentVNode("", true)
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: advancedRenameVisible.value,
          "onUpdate:modelValue": _cache[59] || (_cache[59] = ($event) => advancedRenameVisible.value = $event),
          title: unref(T)("SETTINGS_ADVANCED_RENAME"),
          center: "",
          "align-center": "",
          draggable: "",
          "destroy-on-close": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_el_link, {
              underline: false,
              style: { "margin-bottom": "10px" }
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("SETTINGS_ADVANCED_RENAME_ENABLE")), 1)
              ]),
              _: 1
            }),
            _cache[91] || (_cache[91] = createBaseVNode("br", null, null, -1)),
            createVNode(_component_el_switch, {
              modelValue: advancedRename.value.enable,
              "onUpdate:modelValue": _cache[57] || (_cache[57] = ($event) => advancedRename.value.enable = $event),
              "active-text": unref(T)("SETTINGS_OPEN"),
              "inactive-text": unref(T)("SETTINGS_CLOSE")
            }, null, 8, ["modelValue", "active-text", "inactive-text"]),
            _cache[92] || (_cache[92] = createBaseVNode("br", null, null, -1)),
            createVNode(_component_el_link, {
              underline: false,
              style: { "margin-bottom": "10px", "margin-top": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("SETTINGS_ADVANCED_RENAME_FORMAT")) + " ", 1),
                  createVNode(_component_el_popover, {
                    effect: "light",
                    placement: "right",
                    width: "350",
                    persistent: false,
                    teleported: ""
                  }, {
                    reference: withCtx(() => [
                      createVNode(_component_el_icon, { color: "#409EFF" }, {
                        default: withCtx(() => [
                          createVNode(unref(info_filled_default))
                        ]),
                        _: 1
                      })
                    ]),
                    default: withCtx(() => [
                      createVNode(_component_el_descriptions, {
                        column: 1,
                        style: { "width": "320px" },
                        border: ""
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(buildInRenameFormatTable), (item, index) => {
                            return openBlock(), createBlock(_component_el_descriptions_item, {
                              key: index,
                              label: item.placeholder,
                              align: "center",
                              "label-style": "width: 100px;"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(item.description), 1)
                              ]),
                              _: 2
                            }, 1032, ["label"]);
                          }), 128)),
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(buildInRenameFormatTable).slice(0, unref(buildInRenameFormatTable).length - 1), (item, index) => {
                            return openBlock(), createBlock(_component_el_descriptions_item, {
                              key: index,
                              label: item.placeholderB,
                              align: "center",
                              "label-style": "width: 100px;"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(item.descriptionB), 1)
                              ]),
                              _: 2
                            }, 1032, ["label"]);
                          }), 128))
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ])
              ]),
              _: 1
            }),
            createVNode(_component_el_input, {
              modelValue: advancedRename.value.format,
              "onUpdate:modelValue": _cache[58] || (_cache[58] = ($event) => advancedRename.value.format = $event),
              placeholder: "Ex. {Y}-{m}-{uuid}",
              clearable: ""
            }, null, 8, ["modelValue"]),
            createBaseVNode("div", _hoisted_4, [
              createVNode(_component_el_button, {
                type: "danger",
                style: { "margin-right": "30px" },
                plain: "",
                icon: unref(close_default),
                onClick: handleCancelAdvancedRename
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
                ]),
                _: 1
              }, 8, ["icon"]),
              createVNode(_component_el_button, {
                type: "primary",
                plain: "",
                icon: unref(edit_default),
                onClick: handleSaveAdvancedRename
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
                ]),
                _: 1
              }, 8, ["icon"])
            ])
          ]),
          _: 1,
          __: [91, 92]
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: logFileVisible.value,
          "onUpdate:modelValue": _cache[65] || (_cache[65] = ($event) => logFileVisible.value = $event),
          title: unref(T)("SETTINGS_SET_LOG_FILE"),
          "modal-append-to-body": false,
          width: "500px",
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelLogLevelSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmLogLevelSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "150px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_LOG_FILE")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      size: "small",
                      onClick: _cache[60] || (_cache[60] = ($event) => openFile("piclist.log"))
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_GUI_LOG_FILE")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      size: "small",
                      onClick: _cache[61] || (_cache[61] = ($event) => openFile("piclist-gui-local.log"))
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_MANAGE_LOG_FILE")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      size: "small",
                      onClick: _cache[62] || (_cache[62] = ($event) => openFile("manage.log"))
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("SETTINGS_CLICK_TO_OPEN")), 1)
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_LOG_LEVEL")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_select, {
                      modelValue: formOfSetting.value.logLevel,
                      "onUpdate:modelValue": _cache[63] || (_cache[63] = ($event) => formOfSetting.value.logLevel = $event),
                      multiple: "",
                      "collapse-tags": "",
                      style: { "width": "100%" },
                      persistent: false,
                      teleported: ""
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createElementBlock(Fragment, null, renderList(logLevel, (value, key) => {
                          return createVNode(_component_el_option, {
                            key,
                            label: value,
                            value: key,
                            disabled: handleLevelDisabled(key)
                          }, null, 8, ["label", "value", "disabled"]);
                        }), 64))
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: `${unref(T)("SETTINGS_LOG_FILE_SIZE")} (MB)`
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input_number, {
                      modelValue: formOfSetting.value.logFileSizeLimit,
                      "onUpdate:modelValue": _cache[64] || (_cache[64] = ($event) => formOfSetting.value.logFileSizeLimit = $event),
                      style: { "width": "100%" },
                      placeholder: `${unref(T)("SETTINGS_TIPS_SUCH_AS")}：10`,
                      controls: false,
                      min: 1
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: serverVisible.value,
          "onUpdate:modelValue": _cache[70] || (_cache[70] = ($event) => serverVisible.value = $event),
          class: "server-dialog",
          width: "60%",
          title: unref(T)("SETTINGS_SET_PICGO_SERVER"),
          "modal-append-to-body": false,
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelServerSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmServerSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createBaseVNode("div", _hoisted_5, toDisplayString(unref(T)("SETTINGS_TIPS_SERVER_NOTICE")), 1),
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "120px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_ENABLE_SERVER")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_switch, {
                      modelValue: server.value.enable,
                      "onUpdate:modelValue": _cache[66] || (_cache[66] = ($event) => server.value.enable = $event),
                      "active-text": unref(T)("SETTINGS_OPEN"),
                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                server.value.enable ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_SERVER_HOST")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: server.value.host,
                        "onUpdate:modelValue": _cache[67] || (_cache[67] = ($event) => server.value.host = $event),
                        type: "input",
                        placeholder: unref(T)("SETTINGS_TIP_PLACEHOLDER_HOST")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_SERVER_PORT")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: server.value.port,
                        "onUpdate:modelValue": _cache[68] || (_cache[68] = ($event) => server.value.port = $event),
                        type: "number",
                        placeholder: unref(T)("SETTINGS_TIP_PLACEHOLDER_PORT")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_SERVER_KEY")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: formOfSetting.value.serverKey,
                        "onUpdate:modelValue": _cache[69] || (_cache[69] = ($event) => formOfSetting.value.serverKey = $event),
                        type: "input",
                        placeholder: unref(T)("SETTINGS_TIP_PLACEHOLDER_KEY")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"])
                ], 64)) : createCommentVNode("", true)
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: webServerVisible.value,
          "onUpdate:modelValue": _cache[75] || (_cache[75] = ($event) => webServerVisible.value = $event),
          class: "server-dialog",
          width: "60%",
          title: unref(T)("SETTINGS_SET_WEB_SERVER"),
          "modal-append-to-body": false,
          "align-center": "",
          draggable: "",
          "append-to-body": "",
          onClose: confirmWebServerSetting
        }, {
          default: withCtx(() => [
            createBaseVNode("div", _hoisted_6, toDisplayString(unref(T)("SETTINGS_TIPS_WEB_SERVER_NOTICE")), 1),
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "180px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_SET_ENABLE_WEB_SERVER")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_switch, {
                      modelValue: formOfSetting.value.enableWebServer,
                      "onUpdate:modelValue": _cache[71] || (_cache[71] = ($event) => formOfSetting.value.enableWebServer = $event),
                      "active-text": unref(T)("SETTINGS_OPEN"),
                      "inactive-text": unref(T)("SETTINGS_CLOSE")
                    }, null, 8, ["modelValue", "active-text", "inactive-text"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                formOfSetting.value.enableWebServer ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_WEB_SERVER_HOST")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: formOfSetting.value.webServerHost,
                        "onUpdate:modelValue": _cache[72] || (_cache[72] = ($event) => formOfSetting.value.webServerHost = $event),
                        type: "input",
                        placeholder: unref(T)("SETTINGS_TIP_PLACEHOLDER_WEB_HOST")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_WEB_SERVER_PORT")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input_number, {
                        modelValue: formOfSetting.value.webServerPort,
                        "onUpdate:modelValue": _cache[73] || (_cache[73] = ($event) => formOfSetting.value.webServerPort = $event),
                        min: 1,
                        max: 65535,
                        placeholder: unref(T)("SETTINGS_TIP_PLACEHOLDER_WEB_PORT"),
                        onChange: handleWebServerPortChange
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SET_WEB_SERVER_PATH")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: formOfSetting.value.webServerPath,
                        "onUpdate:modelValue": _cache[74] || (_cache[74] = ($event) => formOfSetting.value.webServerPath = $event),
                        type: "input",
                        placeholder: unref(T)("SETTINGS_SET_WEB_SERVER_PATH")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"])
                ], 64)) : createCommentVNode("", true)
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: syncVisible.value,
          "onUpdate:modelValue": _cache[85] || (_cache[85] = ($event) => syncVisible.value = $event),
          class: "server-dialog",
          width: "60%",
          title: unref(T)("SETTINGS_SYNC_CONFIG_TITLE"),
          "modal-append-to-body": false,
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelSyncSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmSyncSetting
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createBaseVNode("div", _hoisted_7, toDisplayString(unref(T)("SETTINGS_SYNC_CONFIG_NOTE")), 1),
            createVNode(_component_el_divider),
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "120px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_SYNC_CONFIG_SELECT_TYPE")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_select, {
                      modelValue: sync.value.type,
                      "onUpdate:modelValue": _cache[76] || (_cache[76] = ($event) => sync.value.type = $event),
                      style: { "width": "100%" },
                      persistent: false,
                      teleported: ""
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createElementBlock(Fragment, null, renderList(syncType, (typeitem) => {
                          return createVNode(_component_el_option, {
                            key: typeitem,
                            label: typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1),
                            value: typeitem
                          }, null, 8, ["label", "value"]);
                        }), 64))
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                sync.value.type === "gitea" ? (openBlock(), createBlock(_component_el_form_item, {
                  key: 0,
                  label: unref(T)("SETTINGS_SYNC_CONFIG_GITEA_HOST")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: sync.value.endpoint,
                      "onUpdate:modelValue": _cache[77] || (_cache[77] = ($event) => sync.value.endpoint = $event),
                      modelModifiers: { trim: true },
                      type: "input",
                      placeholder: unref(T)("SETTINGS_SYNC_CONFIG_GITEA_HOST")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])) : createCommentVNode("", true),
                sync.value.type === "webdav" ? (openBlock(), createBlock(_component_el_form_item, {
                  key: 1,
                  label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_ENDPOINT")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: sync.value.webdavEndpoint,
                      "onUpdate:modelValue": _cache[78] || (_cache[78] = ($event) => sync.value.webdavEndpoint = $event),
                      modelModifiers: { trim: true },
                      type: "input",
                      placeholder: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_ENDPOINT_PLACEHOLDER")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])) : createCommentVNode("", true),
                sync.value.type !== "webdav" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, renderList(["username", "repo", "branch", "token"], (inputItem) => {
                  return createVNode(_component_el_form_item, {
                    key: inputItem,
                    label: unref(T)(`SETTINGS_SYNC_CONFIG_${sync.value.type.toUpperCase()}_${inputItem.toUpperCase()}`)
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: sync.value[inputItem],
                        "onUpdate:modelValue": ($event) => sync.value[inputItem] = $event,
                        modelModifiers: { trim: true },
                        type: "input",
                        placeholder: unref(T)(`SETTINGS_SYNC_CONFIG_${sync.value.type.toUpperCase()}_${inputItem.toUpperCase()}_PLACEHOLDER`)
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])
                    ]),
                    _: 2
                  }, 1032, ["label"]);
                }), 64)) : createCommentVNode("", true),
                sync.value.type === "webdav" ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_USERNAME")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: sync.value.webdavUsername,
                        "onUpdate:modelValue": _cache[79] || (_cache[79] = ($event) => sync.value.webdavUsername = $event),
                        modelModifiers: { trim: true },
                        type: "input",
                        placeholder: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_USERNAME_PLACEHOLDER")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_PASSWORD")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: sync.value.webdavPassword,
                        "onUpdate:modelValue": _cache[80] || (_cache[80] = ($event) => sync.value.webdavPassword = $event),
                        modelModifiers: { trim: true },
                        type: "password",
                        "show-password": "",
                        placeholder: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_PASSWORD_PLACEHOLDER")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_SAVE_PATH")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_input, {
                        modelValue: sync.value.webdavSavePath,
                        "onUpdate:modelValue": _cache[81] || (_cache[81] = ($event) => sync.value.webdavSavePath = $event),
                        modelModifiers: { trim: true },
                        type: "input",
                        placeholder: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_SAVE_PATH_PLACEHOLDER")
                      }, null, 8, ["modelValue", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_AUTH_TYPE")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_select, {
                        modelValue: sync.value.webdavAuthType,
                        "onUpdate:modelValue": _cache[82] || (_cache[82] = ($event) => sync.value.webdavAuthType = $event),
                        style: { "width": "100%" },
                        persistent: false,
                        teleported: ""
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_el_option, {
                            label: "Basic",
                            value: "basic"
                          }),
                          createVNode(_component_el_option, {
                            label: "Digest",
                            value: "digest"
                          })
                        ]),
                        _: 1
                      }, 8, ["modelValue"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  createVNode(_component_el_form_item, {
                    label: unref(T)("SETTINGS_SYNC_CONFIG_WEBDAV_SSL_ENABLED")
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_el_switch, {
                        modelValue: sync.value.webdavSslEnabled,
                        "onUpdate:modelValue": _cache[83] || (_cache[83] = ($event) => sync.value.webdavSslEnabled = $event),
                        "active-text": unref(T)("SETTINGS_OPEN"),
                        "inactive-text": unref(T)("SETTINGS_CLOSE")
                      }, null, 8, ["modelValue", "active-text", "inactive-text"])
                    ]),
                    _: 1
                  }, 8, ["label"])
                ], 64)) : createCommentVNode("", true),
                sync.value.type === "github" ? (openBlock(), createBlock(_component_el_form_item, {
                  key: 4,
                  label: unref(T)("SETTINGS_SYNC_CONFIG_PROXY")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: sync.value.proxy,
                      "onUpdate:modelValue": _cache[84] || (_cache[84] = ($event) => sync.value.proxy = $event),
                      modelModifiers: { trim: true },
                      type: "input",
                      placeholder: unref(T)("SETTINGS_SYNC_CONFIG_PROXY_PLACEHOLDER")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])) : createCommentVNode("", true)
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: upDownConfigVisible.value,
          "onUpdate:modelValue": _cache[86] || (_cache[86] = ($event) => upDownConfigVisible.value = $event),
          class: "server-dialog",
          width: "60%",
          title: unref(T)("SETTINGS_UP_DOWN_DESC"),
          "modal-append-to-body": false,
          center: "",
          draggable: "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(unref(ElForm), {
              "label-position": "right",
              "label-width": "120px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_SYNC_UPLOAD")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, null, {
                      default: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(syncTaskList.slice(0, 3), (item) => {
                          return openBlock(), createBlock(_component_el_button, {
                            key: item.task,
                            type: "primary",
                            plain: "",
                            size: "small",
                            onClick: ($event) => syncTaskFn(item.task, item.number)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(item.label), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]);
                        }), 128))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_el_form_item, {
                  label: unref(T)("SETTINGS_SYNC_DOWNLOAD")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, null, {
                      default: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(syncTaskList.slice(3), (item) => {
                          return openBlock(), createBlock(_component_el_button, {
                            key: item.task,
                            type: "primary",
                            plain: "",
                            size: "small",
                            onClick: ($event) => syncTaskFn(item.task, item.number)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(item.label), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]);
                        }), 128))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: imageProcessDialogVisible.value,
          "onUpdate:modelValue": _cache[88] || (_cache[88] = ($event) => imageProcessDialogVisible.value = $event),
          title: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_DIALOG_TITLE"),
          width: "50%",
          draggable: "",
          center: "",
          "align-center": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_sfc_main$1, {
              modelValue: imageProcessDialogVisible.value,
              "onUpdate:modelValue": _cache[87] || (_cache[87] = ($event) => imageProcessDialogVisible.value = $event)
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
