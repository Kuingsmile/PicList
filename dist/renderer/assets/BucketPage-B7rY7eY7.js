import { d as defineComponent, r as ref, o as onBeforeMount, N as createBlock, e as openBlock, y as resolveComponent, u as unref, v as withCtx, q as createVNode, ax as loading_default, am as computed, D as watch, M as onMounted, m as triggerRPC, j as IRPCActionType, ay as ElImage, az as ElIcon, a as reactive, al as useRoute, T, s as sendRPC, aA as ElTooltip, aB as ElLink, aC as ElTag, aD as ElProgress, ao as folder_opened_default, aE as document_default, aF as ElCheckbox, aG as ElPopover, aH as circle_close_default, aI as download_default, aJ as edit_default, aK as ElDropdown, aL as ElDropdownMenu, aM as ElDropdownItem, aN as copy_document_default, aO as delete_filled_default, b as onBeforeUnmount, w as withDirectives, i as resolveDirective, c as createElementBlock, f as createBaseVNode, g as createCommentVNode, aP as ElButton, aQ as arrow_right_default, t as toDisplayString, J as ElMessage, au as ElNotification, ae as ElMessageBox, F as Fragment, h as renderList, B as createTextVNode, aR as upload_default, a0 as upload_filled_default, aS as folder_add_default, a7 as link_default, aT as refresh_default, aq as home_filled_default, aU as coin_default, aV as sort_default, aW as grid_default, aX as fold_default, aY as ElCard, x as withModifiers, n as normalizeClass, ap as folder_default, A as close_default, a8 as info_filled_default } from "./index-BqdcQlNn.js";
import { d } from "./marked.esm-D58Rgktj.js";
import { g as getFileIconPath, f as formatFileSize, a as customStrMatch, b as formatFileName, d as formatLink, s as svg, v as v4, c as customRenameFormatTable, i as isValidUrl, e as customStrReplace, r as renameFile } from "./common-REXFY3_s.js";
import { f as formatEndpoint, t as trimPath } from "./common-DNjr697i.js";
import { f as fileCacheDbInstance } from "./bucketFileDb-qvw68roE.js";
import { u as useManageStore, a as useDownloadFileTransferStore, b as useFileTransferStore } from "./manageStore-EteLCVxq.js";
import { g as getConfig, s as saveConfig } from "./dataSender-Bg45AIFL.js";
import { c as cancelDownloadLoadingFileList, r as refreshDownloadFileTransferList } from "./static-DltyNkMh.js";
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "ImageLocal",
  props: {
    isShowThumbnail: { type: Boolean },
    item: {},
    localPath: {}
  },
  setup(__props) {
    const base64Image = ref("");
    const props = __props;
    const createBase64Image = async () => {
      const filePath = window.node.path.normalize(props.localPath);
      const base64 = await window.node.fs.readFile(filePath, "base64");
      base64Image.value = `data:${window.node.mime.lookup(filePath) || "image/png"};base64,${base64}`;
    };
    onBeforeMount(async () => {
      try {
        await createBase64Image();
      } catch (e) {
        console.log(e);
      }
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_image = resolveComponent("el-image");
      return openBlock(), createBlock(_component_el_image, {
        src: _ctx.isShowThumbnail && _ctx.item.isImage ? base64Image.value : require(`../manage/pages/assets/icons/${unref(getFileIconPath)(_ctx.item.fileName ?? "")}`),
        fit: "contain",
        style: { "height": "100px", "width": "100%", "margin": "0 auto" }
      }, {
        placeholder: withCtx(() => [
          createVNode(_component_el_icon, null, {
            default: withCtx(() => [
              createVNode(unref(loading_default))
            ]),
            _: 1
          })
        ]),
        error: withCtx(() => [
          createVNode(_component_el_image, {
            src: require(`../manage/pages/assets/icons/${unref(getFileIconPath)(_ctx.item.fileName ?? "")}`),
            fit: "contain",
            style: { "height": "100px", "width": "100%", "margin": "0 auto" }
          }, null, 8, ["src"])
        ]),
        _: 1
      }, 8, ["src"]);
    };
  }
});
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ImagePreSign",
  props: {
    item: {},
    alias: {},
    url: {},
    config: {},
    isShowThumbnail: { type: Boolean }
  },
  setup(__props) {
    const preSignedUrl = ref("");
    const props = __props;
    const imageSource = computed(() => {
      return props.isShowThumbnail && props.item.isImage ? preSignedUrl.value : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`);
    });
    const iconPath = computed(() => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`));
    async function getUrl() {
      preSignedUrl.value = await triggerRPC(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, props.alias, props.config);
    }
    watch(() => [props.url, props.item], getUrl, { deep: true });
    onMounted(getUrl);
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_image = resolveComponent("el-image");
      return openBlock(), createBlock(_component_el_image, {
        src: imageSource.value,
        fit: "contain",
        style: { "height": "100px", "width": "100%", "margin": "0 auto" }
      }, {
        placeholder: withCtx(() => [
          createVNode(_component_el_icon, null, {
            default: withCtx(() => [
              createVNode(unref(loading_default))
            ]),
            _: 1
          })
        ]),
        error: withCtx(() => [
          createVNode(_component_el_image, {
            src: iconPath.value,
            fit: "contain",
            style: { "height": "100px", "width": "100%", "margin": "0 auto" }
          }, null, 8, ["src"])
        ]),
        _: 1
      }, 8, ["src"]);
    };
  }
});
const ImagePreSignTsx = defineComponent({
  props: {
    isShowThumbnail: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: true
    },
    alias: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const preSignedUrl = ref("");
    const imageSource = computed(() => {
      return props.isShowThumbnail && props.item.isImage ? preSignedUrl.value : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`);
    });
    const iconPath = computed(
      () => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`)
    );
    async function getUrl() {
      preSignedUrl.value = await triggerRPC(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, props.alias, props.config);
    }
    watch(() => [props.url, props.item], getUrl, { deep: true });
    onMounted(getUrl);
    return () => /* @__PURE__ */ React.createElement(ElImage, { src: imageSource.value, fit: "contain", style: "height: 100px;width: 100%;margin: 0 auto;" }, {
      placeholder: () => /* @__PURE__ */ React.createElement(ElIcon, null, /* @__PURE__ */ React.createElement(loading_default, null)),
      error: () => /* @__PURE__ */ React.createElement(ElImage, { src: iconPath.value, fit: "contain", style: "height: 100px;width: 100%;margin: 0 auto;" })
    });
  }
});
const AUTH_KEY_VALUE_RE = /(\w+)=["']?([^'"]{1,10000})["']?/;
let NC = 0;
const NC_PAD = "00000000";
function md5(text) {
  return window.node.crypto.createHash("md5").update(text).digest("hex");
}
function digestAuthHeader(method, uri, wwwAuthenticate, username, password) {
  const parts = wwwAuthenticate.split(",");
  const opts = {};
  for (const i of parts) {
    const m = AUTH_KEY_VALUE_RE.exec(i);
    if (m) {
      opts[m[1]] = m[2].replace(/["']/g, "");
    }
  }
  if (!opts.realm || !opts.nonce) {
    return "";
  }
  let qop = opts.qop || "";
  const userpassArray = [username, password];
  let nc = String(++NC);
  nc = NC_PAD.substring(nc.length) + nc;
  const cnonce = window.node.crypto.randomBytes(8).toString("hex");
  const ha1 = md5(userpassArray[0] + ":" + opts.realm + ":" + userpassArray[1]);
  const ha2 = md5(method.toUpperCase() + ":" + uri);
  let s = ha1 + ":" + opts.nonce;
  if (qop) {
    qop = qop.split(",")[0];
    s += ":" + nc + ":" + cnonce + ":" + qop;
  }
  s += ":" + ha2;
  const response = md5(s);
  let authstring = 'Digest username="' + userpassArray[0] + '", realm="' + opts.realm + '", nonce="' + opts.nonce + '", uri="' + uri + '", response="' + response + '"';
  if (opts.opaque) {
    authstring += ', opaque="' + opts.opaque + '"';
  }
  if (qop) {
    authstring += ", qop=" + qop + ", nc=" + nc + ', cnonce="' + cnonce + '"';
  }
  return authstring;
}
async function getAuthHeader(method, host, uri, username, password) {
  try {
    await window.node.axios.get(`${host}${uri}`);
  } catch (error) {
    if (error.response.status === 401 && error.response.headers["www-authenticate"]) {
      return digestAuthHeader(method, uri, error.response.headers["www-authenticate"], username, password);
    }
  }
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ImageWebdav",
  props: {
    item: {},
    url: {},
    config: {},
    isShowThumbnail: { type: Boolean }
  },
  setup(__props) {
    const base64Url = ref("");
    const success = ref(false);
    const props = __props;
    const imageSource = computed(() => {
      return props.isShowThumbnail && props.item.isImage && success.value ? base64Url.value : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`);
    });
    const iconPath = computed(() => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`));
    async function getWebdavHeader(key) {
      let headers = {};
      if (props.config.authType === "digest") {
        const authHeader = await getAuthHeader(
          "GET",
          formatEndpoint(props.config.endpoint, props.config.sslEnabled || false),
          `/${key.replace(/^\//, "")}`,
          props.config.username,
          props.config.password
        );
        headers = {
          Authorization: authHeader
        };
      } else {
        headers = {
          Authorization: "Basic " + Buffer.from(`${props.config.username}:${props.config.password}`).toString("base64")
        };
      }
      return headers;
    }
    const fetchImage = async () => {
      try {
        const headers = await getWebdavHeader(props.item.key);
        const res = await fetch(props.url, { method: "GET", headers });
        if (res.status >= 200 && res.status < 300) {
          const blob = await res.blob();
          success.value = true;
          base64Url.value = URL.createObjectURL(blob);
        } else {
          throw new Error("Network response was not ok.");
        }
      } catch (err) {
        success.value = false;
        console.log(err);
      }
    };
    watch(() => [props.url, props.item], fetchImage, { deep: true });
    onMounted(fetchImage);
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_image = resolveComponent("el-image");
      return openBlock(), createBlock(_component_el_image, {
        src: imageSource.value,
        fit: "contain",
        style: { "height": "100px", "width": "100%", "margin": "0 auto" }
      }, {
        placeholder: withCtx(() => [
          createVNode(_component_el_icon, null, {
            default: withCtx(() => [
              createVNode(unref(loading_default))
            ]),
            _: 1
          })
        ]),
        error: withCtx(() => [
          createVNode(_component_el_image, {
            src: iconPath.value,
            fit: "contain",
            style: { "height": "100px", "width": "100%", "margin": "0 auto" }
          }, null, 8, ["src"])
        ]),
        _: 1
      }, 8, ["src"]);
    };
  }
});
const ImageWebdavTsx = defineComponent({
  props: {
    isShowThumbnail: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const base64Url = ref("");
    const success = ref(false);
    const imageSource = computed(() => {
      return props.isShowThumbnail && props.item.isImage && success.value ? base64Url.value : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`);
    });
    const iconPath = computed(
      () => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? "")}`)
    );
    async function getWebdavHeader(key) {
      let headers = {};
      if (props.config.authType === "digest") {
        const authHeader = await getAuthHeader(
          "GET",
          formatEndpoint(props.config.endpoint, props.config.sslEnabled || false),
          `/${key.replace(/^\//, "")}`,
          props.config.username,
          props.config.password
        );
        headers = {
          Authorization: authHeader
        };
      } else {
        headers = {
          Authorization: "Basic " + Buffer.from(`${props.config.username}:${props.config.password}`).toString("base64")
        };
      }
      return headers;
    }
    const fetchImage = async () => {
      try {
        const headers = await getWebdavHeader(props.item.key);
        const res = await fetch(props.url, { method: "GET", headers });
        if (res.status >= 200 && res.status < 300) {
          const blob = await res.blob();
          success.value = true;
          base64Url.value = URL.createObjectURL(blob);
        } else {
          throw new Error("Network response was not ok.");
        }
      } catch (err) {
        success.value = false;
        console.log(err);
      }
    };
    watch(() => [props.url, props.item], fetchImage, { deep: true });
    onMounted(fetchImage);
    return () => /* @__PURE__ */ React.createElement(ElImage, { src: imageSource.value, fit: "contain", style: "height: 100px;width: 100%;margin: 0 auto;" }, {
      placeholder: () => /* @__PURE__ */ React.createElement(ElIcon, null, /* @__PURE__ */ React.createElement(loading_default, null)),
      error: () => /* @__PURE__ */ React.createElement(ElImage, { src: iconPath.value, fit: "contain", style: "height: 100px;width: 100%;margin: 0 auto;" })
    });
  }
});
const textFileExt = [
  ".applescript",
  ".bat",
  ".c",
  ".cmd",
  ".condarc",
  ".conf",
  ".config",
  ".cpp",
  ".css",
  ".csv",
  ".dart",
  ".eslintignore",
  ".gitattributes",
  ".gitconfig",
  ".gitignore",
  ".gitkeep",
  ".gitmodules",
  ".go",
  ".h",
  ".hpp",
  ".htm",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".lock",
  ".log",
  ".php",
  ".prop",
  ".properties",
  ".ps1",
  ".py",
  ".rc",
  ".sh",
  ".ts",
  ".tsv",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
  ".yarnrc",
  "license"
];
const videoExt = [
  ".aac",
  ".amv",
  ".avi",
  ".flac",
  ".flv",
  ".m2ts",
  ".m4a",
  ".m4v",
  ".mp3",
  ".mpeg",
  ".mpg",
  ".mts",
  ".ogg",
  ".ogv",
  ".vob",
  ".wav",
  ".webm",
  ".mp4",
  ".3g2",
  ".3gp",
  ".asf",
  ".mov",
  ".mxf",
  ".rm",
  ".rmvb",
  ".wmv",
  ".mkv"
];
const _hoisted_1 = ["element-loading-text", "element-loading-spinner"];
const _hoisted_2 = { class: "layout-header" };
const _hoisted_3 = { style: { "flex-grow": "1", "margin-left": "16px" } };
const _hoisted_4 = { key: 0 };
const _hoisted_5 = { class: "header-dir-view" };
const _hoisted_6 = { class: "dir-layout" };
const _hoisted_7 = { style: { "flex-grow": "1", "flex-shrink": "1", "overflow-x": "auto", "margin-right": "10px" } };
const _hoisted_8 = { class: "header-info-view" };
const _hoisted_9 = { style: { "margin-right": "5px", "padding-left": "5px" } };
const _hoisted_10 = { style: { "padding-left": "5px" } };
const _hoisted_11 = {
  key: 0,
  class: "header-buttom-view"
};
const _hoisted_12 = {
  key: 1,
  class: "header-buttom-view"
};
const _hoisted_13 = {
  key: 0,
  class: "layout-table",
  style: { "margin": "0 15px 15px 15px", "overflow-y": "auto", "overflow-x": "hidden", "height": "80vh" }
};
const _hoisted_14 = {
  key: 1,
  class: "layout-grid",
  style: { "margin": "0 15px 15px 15px", "overflow-y": "auto", "overflow-x": "hidden", "height": "80vh" }
};
const _hoisted_15 = ["onClick"];
const _hoisted_16 = { style: { "font-weight": "500" } };
const _hoisted_17 = { style: { "font-weight": "500", "word-break": "break-all" } };
const _hoisted_18 = {
  key: 0,
  id: "upload-dragger",
  style: { "position": "relative", "top": "0", "right": "0", "height": "100%", "width": "100%", "display": "flex", "justify-content": "center", "align-items": "center" }
};
const _hoisted_19 = {
  class: "upload-dragger__text",
  style: { "color": "orange", "font-size": "2.5vh", "font-family": "Arial, Helvetica, sans-serif", "align-items": "center", "display": "flex", "justify-content": "center", "flex-direction": "column" }
};
const _hoisted_20 = { style: { "color": "#409eff", "font-size": "2.5vh", "font-family": "Arial, Helvetica, sans-serif", "align-items": "center", "display": "flex", "justify-content": "center", "flex-direction": "column" } };
const _hoisted_21 = { style: { "display": "flex", "justify-content": "center", "align-items": "center" } };
const _hoisted_22 = { style: { "height": "500px" } };
const _hoisted_23 = { style: { "height": "500px" } };
const _hoisted_24 = { style: { "height": "500px" } };
const _hoisted_25 = { style: { "height": "600px" } };
const _hoisted_26 = { style: { "height": "600px" } };
const _hoisted_27 = { style: { "height": "600px" } };
const _hoisted_28 = ["innerHTML"];
const _hoisted_29 = { style: { "margin-top": "10px", "align-items": "center", "display": "flex", "justify-content": "flex-end" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BucketPage",
  setup(__props) {
    const getExtension = (fileName) => window.node.path.extname(fileName).slice(1);
    const linkFormatArray = [
      { key: "Url", value: "url" },
      { key: "Markdown", value: "markdown" },
      { key: "Markdown-link", value: "markdown-with-link" },
      { key: "Html", value: "html" },
      { key: "BBCode", value: "bbcode" },
      { key: "Custom", value: "custom" }
    ];
    const linkFormatList = ["url", "markdown", "markdown-with-link", "html", "bbcode", "custom"];
    const sortTypeList = ["name", "size", "time", "ext", "check", "init"];
    const route = useRoute();
    const manageStore = useManageStore();
    const configMap = reactive(JSON.parse(route.query.configMap));
    const isLoadingData = ref(false);
    const isShowLoadingPage = ref(false);
    const isShowImagePreview = ref(false);
    const layoutStyle = ref("grid");
    const fileTable = ref(null);
    const isShowFileInfo = ref(false);
    const currentShowedFileInfo = ref({});
    const currentPageNumber = ref(1);
    const pagingMarker = ref("");
    const pagingMarkerStack = reactive([]);
    const currentPageFilesInfo = reactive([]);
    const currentPrefix = ref("/");
    const fileSortExtReverse = ref(false);
    const fileSortNameReverse = ref(false);
    const fileSortSizeReverse = ref(false);
    const fileSortTimeReverse = ref(false);
    const searchText = ref("");
    const isDragover = ref(false);
    const tableData = reactive([]);
    const isShowUploadPanel = ref(false);
    const activeUpLoadTab = ref("uploading");
    const uploadTaskList = ref([]);
    const refreshUploadTaskId = ref(void 0);
    const uploadPanelFilesList = ref([]);
    const cancelToken = ref("");
    const isLoadingUploadPanelFiles = ref(false);
    const isUploadKeepDirStructure = computed(() => manageStore.config.settings.isUploadKeepDirStructure ?? true);
    const uploadingTaskList = computed(
      () => uploadTaskList.value.filter((item) => ["uploading", "queuing", "paused"].includes(item.status))
    );
    const uploadedTaskList = computed(
      () => uploadTaskList.value.filter((item) => ["uploaded", "failed", "canceled"].includes(item.status))
    );
    const isShowDownloadPanel = ref(false);
    const isLoadingDownloadData = ref(false);
    const activeDownLoadTab = ref("downloading");
    const currentDownloadFileList = reactive([]);
    const downloadTaskList = ref([]);
    const refreshDownloadTaskId = ref(void 0);
    const downloadCancelToken = ref("");
    const downloadingTaskList = computed(
      () => downloadTaskList.value.filter((item) => ["downloading", "queuing", "paused"].includes(item.status))
    );
    const downloadedTaskList = computed(
      () => downloadTaskList.value.filter((item) => ["downloaded", "failed", "canceled"].includes(item.status))
    );
    const dialogVisible = ref(false);
    const urlToUpload = ref("");
    const previewedImage = ref("");
    const filterList = computed(() => {
      return getList();
    });
    const selectedItems = computed(() => filterList.value.filter((item) => item.checked));
    const ImagePreviewList = computed(() => filterList.value.filter((item) => item.isImage).map((item) => item.url));
    const getCurrentPreviewIndex = computed(() => ImagePreviewList.value.indexOf(previewedImage.value));
    const isShiftKeyPress = ref(false);
    const lastChoosed = ref(-1);
    const customDomainList = ref([]);
    const currentCustomDomain = ref("");
    const isShowCustomDomainSelectList = computed(
      () => ["tcyun", "aliyun", "qiniu", "github"].includes(currentPicBedName.value)
    );
    const isShowCustomDomainInput = computed(
      () => ["aliyun", "qiniu", "tcyun", "s3plist", "webdavplist", "local", "sftp"].includes(currentPicBedName.value)
    );
    const isAutoCustomDomain = computed(
      () => manageStore.config.picBed[configMap.alias].isAutoCustomUrl === void 0 ? true : manageStore.config.picBed[configMap.alias].isAutoCustomUrl
    );
    const isShowMarkDownDialog = ref(false);
    const markDownContent = ref("");
    const isShowTextFileDialog = ref(false);
    const textfileContent = ref("");
    const isShowVideoFileDialog = ref(false);
    const videoFileUrl = ref("");
    const videoPlayerHeaders = ref({});
    const isShowRenameFileIcon = computed(
      () => ["tcyun", "aliyun", "qiniu", "upyun", "s3plist", "webdavplist", "local", "sftp"].includes(currentPicBedName.value)
    );
    const isShowBatchRenameDialog = ref(false);
    const batchRenameMatch = ref("");
    const batchRenameReplace = ref("");
    const isRenameIncludeExt = ref(false);
    const isSingleRename = ref(false);
    const itemToBeRenamed = ref({});
    let fileTransferInterval;
    let downloadInterval;
    const currentPicBedName = computed(() => manageStore.config.picBed[configMap.alias].picBedName);
    const paging = computed(() => manageStore.config.picBed[configMap.alias].paging);
    const itemsPerPage = computed(() => manageStore.config.picBed[configMap.alias].itemsPerPage);
    const calculateAllFileSize = computed(
      () => formatFileSize(currentPageFilesInfo.reduce((total, item) => total + item.fileSize, 0)) || "0"
    );
    const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false);
    const isUsePreSignedUrl = computed(() => manageStore.config.settings.isUsePreSignedUrl ?? false);
    const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false);
    const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false);
    const isShowCreateNewFolder = computed(
      () => ["aliyun", "github", "local", "qiniu", "tcyun", "s3plist", "upyun", "webdavplist", "sftp"].includes(
        currentPicBedName.value
      )
    );
    const isShowPresignedUrl = computed(
      () => ["aliyun", "github", "qiniu", "s3plist", "tcyun", "webdavplist"].includes(currentPicBedName.value)
    );
    function getList() {
      if (!searchText.value) {
        return currentPageFilesInfo;
      }
      return currentPageFilesInfo.filter((item) => {
        if (isIgnoreCase.value) {
          return item.fileName.toLowerCase().includes(searchText.value.toLowerCase());
        } else {
          return item.fileName.includes(searchText.value);
        }
      });
    }
    function handleUploadKeepDirChange(val) {
      saveConfig("settings.isUploadKeepDirStructure", !!val);
      manageStore.refreshConfig();
    }
    function showUploadDialog() {
      isShowUploadPanel.value = true;
    }
    function startRefreshUploadTask() {
      refreshUploadTaskId.value = setInterval(() => {
        triggerRPC(IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST).then((res) => {
          uploadTaskList.value = res;
        });
      }, 300);
    }
    function stopRefreshUploadTask() {
      refreshUploadTaskId.value && clearInterval(refreshUploadTaskId.value);
    }
    function handleGetWebdavConfig() {
      return manageStore.config.picBed[configMap.alias];
    }
    function showDownloadDialog() {
      isShowDownloadPanel.value = true;
    }
    function startRefreshDownloadTask() {
      refreshDownloadTaskId.value = setInterval(() => {
        triggerRPC(IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST).then((res) => {
          downloadTaskList.value = res;
        });
      }, 300);
    }
    function stopRefreshDownloadTask() {
      refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value);
    }
    function handleViewChange(val) {
      saveConfig("settings.isShowList", val === "list");
      layoutStyle.value = val;
    }
    function openFileSelectDialog() {
      triggerRPC(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG).then((res) => {
        if (res) {
          res.forEach((item) => {
            tableData.push({
              fileSize: window.node.fs.statSync(item).size,
              isFolder: false,
              name: window.node.path.basename(item),
              filesList: []
            });
            const index = uploadPanelFilesList.value.findIndex((file) => file.path === item);
            if (index === -1) {
              uploadPanelFilesList.value.push({
                name: window.node.path.basename(item),
                path: item,
                size: window.node.fs.statSync(item).size
              });
            }
          });
        }
      });
    }
    function onDrop(e) {
      isDragover.value = false;
      const items = e.dataTransfer?.items;
      if (items) {
        webkitReadDataTransfer(e.dataTransfer);
      }
    }
    function webkitReadDataTransfer(dataTransfer) {
      isLoadingUploadPanelFiles.value = true;
      let fileNum = dataTransfer.items.length;
      const decrement = () => {
        fileNum--;
        if (fileNum === 0) {
          files.forEach((item) => {
            const index = uploadPanelFilesList.value.findIndex((file) => file.path === item.path);
            if (index === -1) {
              uploadPanelFilesList.value.push({
                name: item.name,
                path: item.path,
                size: item.size,
                relativePath: item.relativePath
              });
            }
          });
          handleUploadFiles(files);
          isLoadingUploadPanelFiles.value = false;
        }
      };
      const files = [];
      const items = dataTransfer.items;
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (!entry) {
          decrement();
          continue;
        }
        if (entry.isFile) {
          readFiles(item.getAsFile(), entry.fullPath);
        } else if (entry.isDirectory) {
          readDirectory(entry.createReader());
        }
      }
      function readDirectory(reader) {
        reader.readEntries(
          (entries) => {
            if (entries.length) {
              fileNum += entries.length;
              entries.forEach((entry) => {
                if (entry.isFile) {
                  entry.file(
                    (file) => {
                      readFiles(file, entry.fullPath);
                    },
                    (err) => {
                      console.error(err);
                    }
                  );
                } else if (entry.isDirectory) {
                  readDirectory(entry.createReader());
                }
              });
              readDirectory(reader);
            } else {
              decrement();
            }
          },
          (err) => {
            console.error(err);
          }
        );
      }
      function readFiles(file, fullPath) {
        file.relativePath = fullPath.substring(1);
        files.push(file);
        decrement();
      }
    }
    function handleUploadFiles(files) {
      const dirObj = {};
      files.forEach((item) => {
        if (item.relativePath === item.name) {
          const index = tableData.findIndex((file) => file.fullPath === item.path);
          if (index === -1) {
            tableData.push({
              name: item.name,
              filesList: [item.file],
              isFolder: false,
              fileSize: item.size,
              fullPath: item.path
            });
          }
        }
        if (item.relativePath !== item.name) {
          const folderName = item.relativePath.split("/")[0];
          if (dirObj[folderName]) {
            const dirList = dirObj[folderName].filesList || [];
            dirList.push(item);
            dirObj[folderName].filesList = dirList;
            const dirSize = dirObj[folderName].fileSize;
            dirObj[folderName].fileSize = dirSize ? dirSize + item.size : item.size;
          } else {
            dirObj[folderName] = {
              filesList: [item],
              fileSize: item.size,
              path: item.path
            };
          }
        }
      });
      Object.keys(dirObj).forEach((key) => {
        const index = tableData.findIndex((item) => item.fullPath === dirObj[key].path);
        if (index === -1) {
          tableData.push({
            name: key,
            filesList: dirObj[key].filesList,
            isFolder: true,
            fileSize: dirObj[key].fileSize,
            fullPath: dirObj[key].path
          });
        }
      });
    }
    function clearTableData() {
      tableData.length = 0;
      uploadPanelFilesList.value = [];
    }
    function renameFileBeforeUpload(filePath) {
      const fileName = window.node.path.basename(filePath);
      const typeMap = {
        timestampRename: manageStore.config.settings.timestampRename,
        randomStringRename: manageStore.config.settings.randomStringRename,
        customRenameFormat: manageStore.config.settings.customRenameFormat,
        customRename: manageStore.config.settings.customRename
      };
      return renameFile(typeMap, fileName);
    }
    function uploadFiles() {
      const formateduploadPanelFilesList = [];
      uploadPanelFilesList.value.forEach((item) => {
        formateduploadPanelFilesList.push({
          rawName: item.name,
          path: item.path.replace(/\\/g, "/"),
          size: item.size,
          renamedFileName: renameFileBeforeUpload(item.name),
          relativePath: item.relativePath ?? ""
        });
      });
      if (isUploadKeepDirStructure.value) {
        formateduploadPanelFilesList.forEach((item) => {
          item.key = `${currentPrefix.value}${item.relativePath.substring(0, item.relativePath.lastIndexOf("/"))}/${item.renamedFileName}`;
        });
      } else {
        formateduploadPanelFilesList.forEach((item) => {
          item.key = currentPrefix.value + item.renamedFileName;
        });
      }
      clearTableData();
      const param = {
        // tcyun
        fileArray: []
      };
      formateduploadPanelFilesList.forEach((item) => {
        param.fileArray.push({
          alias: configMap.alias,
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: item.key,
          filePath: item.path,
          fileSize: item.size,
          fileName: item.rawName,
          githubBranch: currentCustomDomain.value,
          aclForUpload: manageStore.config.picBed[configMap.alias].aclForUpload
        });
      });
      sendRPC(IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE, configMap.alias, param);
    }
    function handleCopyUploadingTaskInfo() {
      window.electron.clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2));
      ElMessage.success(T("MANAGE_BUCKET_COPY_SUCCESS"));
    }
    function handleDeleteUploadedTask() {
      sendRPC(IRPCActionType.MANAGE_DELETE_UPLOADED_TASK);
      ElMessage.success(T("MANAGE_BUCKET_DELETE_SUCCESS"));
    }
    function handleDeleteAllUploadedTask() {
      sendRPC(IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK);
      ElMessage.success(T("MANAGE_BUCKET_DELETE_SUCCESS"));
    }
    function handleCopyDownloadingTaskInfo() {
      window.electron.clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2));
      ElMessage.success(T("MANAGE_BUCKET_COPY_SUCCESS"));
    }
    function handleDeleteDownloadedTask() {
      sendRPC(IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK);
      ElMessage.success(T("MANAGE_BUCKET_DELETE_SUCCESS"));
    }
    function handleDeleteAllDownloadedTask() {
      sendRPC(IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK);
      ElMessage.success(T("MANAGE_BUCKET_DELETE_SUCCESS"));
    }
    function handleOpenDownloadedFolder() {
      sendRPC(IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER, manageStore.config.settings.downloadDir);
    }
    function handleShowFileInfo(item) {
      isShowFileInfo.value = true;
      currentShowedFileInfo.value = item;
    }
    async function handleBreadcrumbClick(index) {
      const targetPrefix = currentPrefix.value.split("/").slice(0, index + 1).join("/") + "/";
      if (isLoadingData.value) {
        isLoadingData.value = false;
        window.electron.electronAPI.ipcRenderer.send("cancelLoadingFileList", cancelToken.value);
      }
      configMap.prefix = targetPrefix;
      isShowLoadingPage.value = true;
      resetParam(false);
      isShowLoadingPage.value = false;
    }
    async function handleClickFile(item) {
      const options = {};
      if (currentPicBedName.value === "webdavplist") {
        options.headers = {
          Authorization: `Basic ${Buffer.from(`${manageStore.config.picBed[configMap.alias].username}:${manageStore.config.picBed[configMap.alias].password}`).toString("base64")}`
        };
      }
      if (item.isImage) {
        previewedImage.value = item.url;
        isShowImagePreview.value = true;
      } else if (item.isDir) {
        if (isLoadingData.value) {
          isLoadingData.value = false;
          window.electron.electronAPI.ipcRenderer.send("cancelLoadingFileList", cancelToken.value);
        }
        configMap.prefix = `/${item.key}`;
        isShowLoadingPage.value = true;
        await resetParam(false);
        isShowLoadingPage.value = false;
      } else if (item.fileName.endsWith(".md")) {
        try {
          ElMessage({
            message: T("MANAGE_BUCKET_START_LOADING_MESSAGE"),
            duration: 300,
            type: "success"
          });
          const fileUrl = item.url;
          const res = await window.node.axios.get(fileUrl, options);
          const content = res.data;
          markDownContent.value = await d.parse(content);
          isShowMarkDownDialog.value = true;
        } catch (error) {
          ElMessage.error(T("MANAGE_BUCKET_END_LOADING_MESSAGE_FAIL"));
        }
      } else if (textFileExt.includes(window.node.path.extname(item.fileName).toLowerCase()) || textFileExt.includes(item.fileName.toLowerCase())) {
        try {
          ElMessage({
            message: T("MANAGE_BUCKET_START_LOADING_MESSAGE"),
            duration: 300,
            type: "success"
          });
          const fileUrl = item.url;
          const res = await window.node.axios.get(fileUrl, options);
          textfileContent.value = res.data;
          isShowTextFileDialog.value = true;
        } catch (error) {
          ElMessage.error(T("MANAGE_BUCKET_END_LOADING_MESSAGE_FAIL"));
        }
      } else if (videoExt.includes(window.node.path.extname(item.fileName).toLowerCase())) {
        videoFileUrl.value = item.url;
        isShowVideoFileDialog.value = true;
        videoPlayerHeaders.value = options.headers;
      }
    }
    async function handleChangeCustomUrlInput() {
      await handleChangeCustomUrl();
      await forceRefreshFileList();
    }
    async function handleChangeCustomUrl() {
      if (["aliyun", "tcyun", "qiniu", "s3plist", "webdavplist", "local", "sftp"].includes(currentPicBedName.value)) {
        const currentConfigs = await getConfig("picBed");
        const currentConfig = currentConfigs[configMap.alias];
        const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? "{}");
        if (currentTransformedConfig[configMap.bucketName]) {
          currentTransformedConfig[configMap.bucketName].customUrl = currentCustomDomain.value;
        } else {
          currentTransformedConfig[configMap.bucketName] = {
            customUrl: currentCustomDomain.value
          };
        }
        currentConfig.transformedConfig = JSON.stringify(currentTransformedConfig);
        saveConfig(`picBed.${configMap.alias}`, currentConfig);
        await manageStore.refreshConfig();
      }
    }
    async function initCustomDomainList() {
      if (["aliyun", "tcyun", "qiniu"].includes(currentPicBedName.value) && (manageStore.config.picBed[configMap.alias].isAutoCustomUrl === void 0 || manageStore.config.picBed[configMap.alias].isAutoCustomUrl === true) || ["github", "smms", "upyun", "imgur"].includes(currentPicBedName.value)) {
        const param = {
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location
        };
        let defaultUrl = "";
        if (currentPicBedName.value === "tcyun") {
          defaultUrl = `https://${configMap.bucketName}.cos.${configMap.bucketConfig.Location}.myqcloud.com`;
        } else if (currentPicBedName.value === "aliyun") {
          defaultUrl = `https://${configMap.bucketName}.${configMap.bucketConfig.Location}.aliyuncs.com`;
        } else if (currentPicBedName.value === "github") {
          defaultUrl = "main";
        }
        const res = await triggerRPC(IRPCActionType.MANAGE_GET_BUCKET_DOMAIN, configMap.alias, param);
        if (res.length > 0) {
          customDomainList.value.length = 0;
          res.forEach((item) => {
            if (!/^https?:\/\//.test(item) && currentPicBedName.value !== "github") {
              item = manageStore.config.settings.isForceCustomUrlHttps ? `https://${item}` : `http://${item}`;
            }
            customDomainList.value.push({
              label: item,
              value: item
            });
          });
          defaultUrl !== "" && currentPicBedName.value !== "github" && customDomainList.value.push({
            label: defaultUrl,
            value: defaultUrl
          });
          currentCustomDomain.value = customDomainList.value[0].value;
        } else {
          customDomainList.value.length = 0;
          customDomainList.value = [
            {
              label: defaultUrl,
              value: defaultUrl
            }
          ];
          currentCustomDomain.value = defaultUrl;
        }
      } else if (["aliyun", "tcyun", "qiniu"].includes(currentPicBedName.value)) {
        const currentConfigs = await getConfig("picBed");
        const currentConfig = currentConfigs[configMap.alias];
        const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? "{}");
        if (currentTransformedConfig[configMap.bucketName]) {
          currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? "";
        } else {
          currentCustomDomain.value = "";
        }
      } else if (currentPicBedName.value === "s3plist") {
        const currentConfigs = await getConfig("picBed");
        const currentConfig = currentConfigs[configMap.alias];
        const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? "{}");
        if (currentTransformedConfig[configMap.bucketName]) {
          currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? "";
        } else {
          if (manageStore.config.picBed[configMap.alias].endpoint) {
            const endpoint = manageStore.config.picBed[configMap.alias].endpoint;
            const s3ForcePathStyle = manageStore.config.picBed[configMap.alias].s3ForcePathStyle;
            let url;
            if (/^https?:\/\//.test(endpoint)) {
              url = new URL(endpoint);
            } else {
              url = new URL(
                manageStore.config.picBed[configMap.alias].sslEnabled ? `https://${endpoint}` : `http://${endpoint}`
              );
            }
            if (s3ForcePathStyle) {
              currentCustomDomain.value = `${url.protocol}//${url.hostname}${url.port ? ":" + url.port : ""}/${configMap.bucketName}`;
            } else {
              currentCustomDomain.value = `${url.protocol}//${configMap.bucketName}.${url.hostname}${url.port ? ":" + url.port : ""}`;
            }
          } else {
            currentCustomDomain.value = `https://${configMap.bucketName}.s3.amazonaws.com`;
          }
        }
        await handleChangeCustomUrl();
      } else if (currentPicBedName.value === "webdavplist") {
        const currentConfigs = await getConfig("picBed");
        const currentConfig = currentConfigs[configMap.alias];
        const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? "{}");
        if (currentTransformedConfig[configMap.bucketName] && currentTransformedConfig[configMap.bucketName]?.customUrl) {
          currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl;
        } else {
          let endpoint = manageStore.config.picBed[configMap.alias].endpoint;
          if (!/^https?:\/\//.test(endpoint)) {
            endpoint = "http://" + endpoint;
          }
          currentCustomDomain.value = endpoint;
        }
        await handleChangeCustomUrl();
      } else if (currentPicBedName.value === "local" || currentPicBedName.value === "sftp") {
        const currentConfigs = await getConfig("picBed");
        const currentConfig = currentConfigs[configMap.alias];
        const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? "{}");
        if (currentTransformedConfig[configMap.bucketName] && currentTransformedConfig[configMap.bucketName]?.customUrl) {
          currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? "";
          if (manageStore.config.settings.isForceCustomUrlHttps && currentCustomDomain.value.startsWith("http://")) {
            currentCustomDomain.value = currentCustomDomain.value.replace("http://", "https://");
          }
        } else {
          currentCustomDomain.value = "";
        }
        await handleChangeCustomUrl();
      }
    }
    async function resetParam(force = false) {
      if (isLoadingData.value) {
        isLoadingData.value = false;
        window.electron.electronAPI.ipcRenderer.send("cancelLoadingFileList", cancelToken.value);
      }
      if (isLoadingDownloadData.value) {
        isLoadingDownloadData.value = false;
        window.electron.electronAPI.ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value);
      }
      cancelToken.value = "";
      pagingMarker.value = "";
      currentPrefix.value = configMap.prefix;
      currentPageNumber.value = 1;
      currentPageFilesInfo.length = 0;
      currentDownloadFileList.length = 0;
      searchText.value = "";
      urlToUpload.value = "";
      dialogVisible.value = false;
      isShowImagePreview.value = false;
      previewedImage.value = "";
      isShowFileInfo.value = false;
      lastChoosed.value = -1;
      layoutStyle.value = await getConfig("settings.isShowList") ? "list" : "grid";
      fileSortExtReverse.value = false;
      fileSortNameReverse.value = false;
      fileSortSizeReverse.value = false;
      fileSortTimeReverse.value = false;
      if (!isAutoRefresh.value && !force && !paging.value) {
        console.log("use cache");
        const cachedData = await searchExistFileList();
        if (cachedData.length > 0) {
          currentPageFilesInfo.push(...cachedData[0].value.fullList);
          const sortType = localStorage.getItem("sortType") || "init";
          sortFile(sortType);
          isShowLoadingPage.value = false;
          return;
        }
      }
      if (paging.value) {
        const res = await getBucketFileList();
        if (res.success) {
          currentPageFilesInfo.push(...res.fullList);
          const sortType = localStorage.getItem("sortType") || "init";
          sortFile(sortType);
          if (res.isTruncated && paging.value) {
            pagingMarkerStack.push(pagingMarker.value);
            pagingMarker.value = res.nextMarker;
          } else if (paging.value && currentPageNumber.value > 1) {
            ElNotification({
              title: T("MANAGE_BUCKET_LAST_PAGE_TITLE"),
              message: T("MANAGE_BUCKET_LAST_PAGE_MSG"),
              type: "success",
              duration: 500
            });
          }
        } else {
          ElNotification({
            title: T("MANAGE_BUCKET_GET_LIST_FAIL_TITLE"),
            message: T("MANAGE_BUCKET_GET_LIST_FAIL_MSG"),
            type: "error",
            duration: 2e3
          });
        }
      } else {
        getBucketFileListBackStage();
        ElNotification.info({
          title: T("MANAGE_BUCKET_GET_LIST_FAIL_TITLE"),
          message: T("MANAGE_BUCKET_GET_LIST_FAIL_MSG2"),
          duration: 1e3
        });
      }
    }
    watch(route, async (newRoute) => {
      const queryConfigMap = newRoute.query.configMap;
      if (queryConfigMap) {
        isShowLoadingPage.value = true;
        const parsedConfigMap = JSON.parse(queryConfigMap);
        Object.assign(configMap, parsedConfigMap);
        await initCustomDomainList();
        await resetParam(true);
        isShowLoadingPage.value = false;
      }
    });
    async function forceRefreshFileList() {
      if (isLoadingData.value) {
        ElNotification({
          title: T("MANAGE_BUCKET_GET_LIST_FAIL_TITLE"),
          message: T("MANAGE_BUCKET_GET_LIST_FAIL_MSG3"),
          type: "error",
          duration: 1e3
        });
        return;
      }
      isShowLoadingPage.value = true;
      await resetParam(true);
      isShowLoadingPage.value = false;
    }
    watch(currentPageNumber, () => {
      if (typeof currentPageNumber.value !== "number") {
        currentPageNumber.value = 1;
      }
    });
    const changePage = async (cur, prev) => {
      if (!cur || !prev) {
        currentPageNumber.value = 1;
        return;
      }
      const isForwardNavigation = cur > prev;
      const newPageNumber = isForwardNavigation ? prev + 1 : prev - 1;
      const sortType = localStorage.getItem("sortType") || "init";
      isShowLoadingPage.value = true;
      currentPageNumber.value = newPageNumber;
      currentPageFilesInfo.length = 0;
      searchText.value = "";
      urlToUpload.value = "";
      dialogVisible.value = false;
      if (!isForwardNavigation) {
        pagingMarker.value = pagingMarkerStack[pagingMarkerStack.length - 2];
        pagingMarkerStack.pop();
        pagingMarkerStack.pop();
      }
      const res = await getBucketFileList();
      isShowLoadingPage.value = false;
      if (!res.success) {
        ElNotification({
          title: T("MANAGE_BUCKET_GET_LIST_FAIL_TITLE"),
          message: T("MANAGE_BUCKET_GET_LIST_FAIL_MSG"),
          type: "error",
          duration: 1e3
        });
        return;
      }
      currentPageFilesInfo.push(...res.fullList);
      sortFile(sortType);
      if (!(cur < prev && !paging.value)) {
        if (res.isTruncated) {
          pagingMarkerStack.push(pagingMarker.value);
          pagingMarker.value = res.nextMarker;
        } else {
          ElNotification({
            title: T("MANAGE_BUCKET_GET_LIST_FAIL_TITLE"),
            message: T("MANAGE_BUCKET_LAST_PAGE_MSG"),
            type: "success",
            duration: 1e3
          });
        }
      }
    };
    function sortFile(type) {
      switch (type) {
        case "name":
          localStorage.setItem("sortType", "name");
          fileSortNameReverse.value = !fileSortNameReverse.value;
          currentPageFilesInfo.sort((a, b) => {
            if (fileSortNameReverse.value) {
              return a.fileName.localeCompare(b.fileName);
            }
            return b.fileName.localeCompare(a.fileName);
          });
          break;
        case "size":
          localStorage.setItem("sortType", "size");
          fileSortSizeReverse.value = !fileSortSizeReverse.value;
          currentPageFilesInfo.sort((a, b) => {
            if (fileSortSizeReverse.value) {
              return a.fileSize - b.fileSize;
            }
            return b.fileSize - a.fileSize;
          });
          break;
        case "time":
          localStorage.setItem("sortType", "time");
          fileSortTimeReverse.value = !fileSortTimeReverse.value;
          currentPageFilesInfo.sort((a, b) => {
            if (fileSortTimeReverse.value) {
              return new Date(a.formatedTime).getTime() - new Date(b.formatedTime).getTime();
            }
            return new Date(b.formatedTime).getTime() - new Date(a.formatedTime).getTime();
          });
          break;
        case "ext":
          localStorage.setItem("sortType", "ext");
          fileSortExtReverse.value = !fileSortExtReverse.value;
          currentPageFilesInfo.sort((a, b) => {
            if (fileSortExtReverse.value) {
              return getExtension(a.fileName).localeCompare(getExtension(b.fileName));
            }
            return getExtension(b.fileName).localeCompare(getExtension(a.fileName));
          });
          break;
        case "check":
          localStorage.setItem("sortType", "check");
          currentPageFilesInfo.sort((a, b) => {
            return b.checked - a.checked;
          });
          break;
        case "init":
          localStorage.setItem("sortType", "init");
          currentPageFilesInfo.sort((a, b) => {
            return b.isDir - a.isDir || a.fileName.localeCompare(b.fileName);
          });
      }
    }
    function handleCancelCheck() {
      currentPageFilesInfo.forEach((item) => {
        item.checked = false;
      });
    }
    function handleReverseCheck() {
      currentPageFilesInfo.forEach((item) => {
        item.checked = !item.checked;
      });
    }
    function handleCheckChangeOther(item) {
      item.checked = !item.checked;
    }
    async function handleFolderBatchDownload(item) {
      ElMessageBox.confirm(T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TITLE"), T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP"), {
        confirmButtonText: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CONFIRM"),
        cancelButtonText: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CANCEL"),
        type: "warning"
      }).then(async () => {
        const defaultDownloadPath = await triggerRPC(IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER);
        const param = {
          downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
          maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount ? manageStore.config.settings.maxDownloadFileCount : 5,
          fileArray: []
        };
        cancelToken.value = v4();
        const paramGet = {
          // tcyun
          bucketName: configMap.bucketName,
          bucketConfig: {
            Location: configMap.bucketConfig.Location
          },
          paging: paging.value,
          prefix: `/${item.key.replace(/^\/+|\/+$/, "")}/`,
          marker: pagingMarker.value,
          itemsPerPage: itemsPerPage.value,
          customUrl: currentCustomDomain.value,
          currentPage: currentPageNumber.value,
          cancelToken: cancelToken.value,
          cdnUrl: configMap.cdnUrl
        };
        isLoadingDownloadData.value = true;
        const downloadFileTransferStore = useDownloadFileTransferStore();
        downloadFileTransferStore.resetDownloadFileTransferList();
        sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY, configMap.alias, paramGet);
        window.electron.electronAPI.ipcRenderer.on(refreshDownloadFileTransferList, (_, data) => {
          downloadFileTransferStore.refreshDownloadFileTransferList(data);
        });
        downloadInterval = setInterval(() => {
          const currentFileList = downloadFileTransferStore.getDownloadFileTransferList();
          currentDownloadFileList.length = 0;
          currentDownloadFileList.push(...currentFileList);
          if (downloadFileTransferStore.isFinished() && downloadInterval) {
            isLoadingDownloadData.value = false;
            clearInterval(downloadInterval);
            if (downloadFileTransferStore.isSuccess()) {
              ElNotification.success({
                title: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP"),
                message: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_SUCCESS"),
                duration: 500
              });
              if (currentDownloadFileList.length) {
                currentDownloadFileList.forEach((item2) => {
                  param.fileArray.push({
                    alias: configMap.alias,
                    bucketName: configMap.bucketName,
                    region: configMap.bucketConfig.Location,
                    key: item2.key,
                    fileName: [void 0, true].includes(manageStore.config.settings.isDownloadFolderKeepDirStructure) ? `/${item2.key.replace(/^\/+|\/+$/, "")}` : item2.fileName,
                    customUrl: currentCustomDomain.value,
                    downloadUrl: item2.downloadUrl,
                    githubUrl: item2.url,
                    githubPrivate: configMap.bucketConfig.private
                  });
                });
              }
              sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param);
              isShowDownloadPanel.value = true;
            } else {
              ElNotification.error({
                title: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP"),
                message: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_FAIL"),
                duration: 500
              });
            }
            downloadFileTransferStore.resetDownloadFileTransferList();
          }
        }, 500);
      }).catch(() => {
        ElNotification.info({
          title: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP"),
          message: T("MANAGE_BUCKET_DOWNLOAD_FOLDER_CANCEL"),
          duration: 500
        });
      });
    }
    async function handleBatchDownload() {
      const defaultDownloadPath = await triggerRPC(IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER);
      const param = {
        downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
        maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount ? manageStore.config.settings.maxDownloadFileCount : 5,
        fileArray: []
      };
      selectedItems.value.forEach((item) => {
        if (!item.isDir) {
          param.fileArray.push({
            alias: configMap.alias,
            bucketName: configMap.bucketName,
            region: configMap.bucketConfig.Location,
            key: item.key,
            fileName: manageStore.config.settings.isDownloadFileKeepDirStructure ? `/${item.key.replace(/^\/+|\/+$/, "")}` : item.fileName,
            customUrl: currentCustomDomain.value,
            downloadUrl: item.downloadUrl,
            githubUrl: item.url,
            githubPrivate: configMap.bucketConfig.private
          });
        }
      });
      sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param);
      handleCancelCheck();
      isShowDownloadPanel.value = true;
    }
    function handleCheckAllChange() {
      const allSelected = selectedItems.value.length === filterList.value.length;
      filterList.value.forEach((item) => {
        item.checked = !allSelected;
      });
    }
    function handleCreateFolder() {
      ElMessageBox.prompt(T("MANAGE_BUCKET_CREATE_FOLDER_BOX_TITLE"), T("MANAGE_BUCKET_CREATE_FOLDER_BOX_TIP"), {
        confirmButtonText: T("MANAGE_BUCKET_CREATE_FOLDER_BOX_CONFIRM"),
        cancelButtonText: T("MANAGE_BUCKET_CREATE_FOLDER_BOX_CANCEL"),
        inputPattern: /^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u,
        inputErrorMessage: T("MANAGE_BUCKET_CREATE_FOLDER_ERROR_MSG")
      }).then(async ({ value }) => {
        let formatedPath = value;
        formatedPath = trimPath(formatedPath);
        const param = {
          // tcyun
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: currentPrefix.value.slice(1) + formatedPath + "/",
          githubBranch: currentCustomDomain.value
        };
        const res = await triggerRPC(IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER, configMap.alias, param);
        if (res) {
          ElMessage.success(T("MANAGE_BUCKET_CREATE_FOLDER_SUCCESS"));
        } else {
          ElMessage.error(T("MANAGE_BUCKET_CREATE_FOLDER_FAIL"));
        }
      }).catch(() => {
      });
    }
    function showUrlDialog() {
      dialogVisible.value = true;
    }
    async function handleUploadFromUrl() {
      dialogVisible.value = false;
      const urlList = [];
      urlToUpload.value.split("\n").forEach((item) => {
        if (item.trim() !== "" && isValidUrl(item.trim())) {
          urlList.push(item.trim());
        }
      });
      if (urlList.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_UPLOAD_URL_ERROR_MSQ"));
        return;
      }
      ElNotification({
        title: T("MANAGE_BUCKET_UPLOAD_URL_NOT_TITLE"),
        message: T("MANAGE_BUCKET_UPLOAD_URL_NOT_MSG"),
        type: "success",
        duration: 1e3
      });
      const res = await triggerRPC(IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL, urlList);
      for (const item of res) {
        const fPath = item.replace(/\\/g, "/");
        uploadPanelFilesList.value.push({
          name: window.node.path.basename(fPath),
          path: fPath,
          size: window.node.fs.statSync(fPath).size
        });
      }
      uploadFiles();
      isShowUploadPanel.value = true;
    }
    function handleBatchRenameFile() {
      batchRenameMatch.value = "";
      isSingleRename.value = false;
      isShowBatchRenameDialog.value = true;
    }
    const matchedFilesNumber = computed(() => {
      if (!batchRenameMatch.value) {
        return 0;
      }
      const matchedFiles = [];
      currentPageFilesInfo.forEach((item) => {
        if (isRenameIncludeExt.value) {
          if (customStrMatch(item.fileName, batchRenameMatch.value) && !item.isDir) {
            matchedFiles.push(item);
          }
        } else {
          if (customStrMatch(item.fileName.split(".")[0], batchRenameMatch.value) && !item.isDir) {
            matchedFiles.push(item);
          }
        }
      });
      return matchedFiles.length;
    });
    async function BatchRename() {
      isShowBatchRenameDialog.value = false;
      if (batchRenameMatch.value === "") {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG"));
        return;
      }
      let matchedFiles = [];
      currentPageFilesInfo.forEach((item) => {
        if (isRenameIncludeExt.value) {
          if (customStrMatch(item.fileName, batchRenameMatch.value) && !item.isDir) {
            matchedFiles.push(item);
          }
        } else {
          if (customStrMatch(item.fileName.split(".")[0], batchRenameMatch.value) && !item.isDir) {
            matchedFiles.push(item);
          }
        }
      });
      if (matchedFiles.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG2"));
        return;
      }
      for (const item of matchedFiles) {
        if (isRenameIncludeExt.value) {
          item.newName = customStrReplace(
            item.fileName,
            batchRenameMatch.value,
            batchRenameReplace.value
          );
        } else {
          item.newName = customStrReplace(item.fileName.split(".")[0], batchRenameMatch.value, batchRenameReplace.value) + "." + item.fileName.split(".")[1];
        }
      }
      matchedFiles = matchedFiles.filter((item) => item.fileName !== item.newName);
      if (matchedFiles.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG3"));
        return;
      }
      for (let i = 0; i < matchedFiles.length; i++) {
        matchedFiles[i].newName = matchedFiles[i].newName.replaceAll("{auto}", (i + 1).toString());
      }
      const duplicateFilesNum = matchedFiles.filter(
        (item) => matchedFiles.filter((item2) => item2.newName === item.newName).length > 1
      ).length;
      let successCount = 0;
      let failCount = 0;
      const error = new Error("error");
      const renamefunc = (item) => {
        return new Promise((resolve, reject) => {
          const param = {
            // tcyun
            bucketName: configMap.bucketName,
            region: configMap.bucketConfig.Location,
            oldKey: item.key,
            newKey: (item.key.slice(0, item.key.lastIndexOf("/") + 1) + item.newName).replaceAll("//", "/"),
            customUrl: currentCustomDomain.value
          };
          triggerRPC(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param).then((res) => {
            if (res) {
              successCount++;
              resolve(true);
              const oldKey = currentPrefix.value + item.fileName;
              if (pagingMarker.value === oldKey.slice(1)) {
                pagingMarker.value = currentPrefix.value.slice(1) + item.newName;
              }
              const oldName = item.fileName;
              if (item.newName.includes("/")) {
                item.fileName = item.newName.slice(0, item.newName.indexOf("/"));
                item.isDir = true;
                item.fileSize = 0;
                item.formatedTime = "";
              } else {
                item.fileName = item.newName;
              }
              item.key = (item.key.slice(0, item.key.lastIndexOf("/") + 1) + item.newName).replaceAll("//", "/");
              item.url = `${currentCustomDomain.value}${currentPrefix.value}${item.newName}`;
              item.formatedTime = (/* @__PURE__ */ new Date()).toLocaleString();
              if (!paging.value) {
                const table = fileCacheDbInstance.table(currentPicBedName.value);
                table.where("key").equals(getTableKeyOfDb()).modify((l) => {
                  l.value.fullList.forEach((i) => {
                    if (i.fileName === oldName) {
                      if (item.newName.includes("/")) {
                        i.fileName = item.newName.slice(0, item.newName.indexOf("/"));
                        i.isDir = true;
                        i.fileSize = 0;
                        i.formatedTime = "";
                      } else {
                        i.fileName = item.newName;
                      }
                      i.key = (i.key.slice(0, i.key.lastIndexOf("/") + 1) + item.newName).replaceAll("//", "/");
                      i.url = `${currentCustomDomain.value}${currentPrefix.value}${item.newName}`;
                      i.formatedTime = (/* @__PURE__ */ new Date()).toLocaleString();
                    }
                  });
                });
              }
            } else {
              failCount++;
              reject(error);
            }
          });
        });
      };
      if (duplicateFilesNum > 0) {
        ElMessageBox.confirm(
          `${T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_A")} ${duplicateFilesNum} ${T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_B")}`,
          T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_C"),
          {
            confirmButtonText: T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_CONFIRM"),
            cancelButtonText: T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_CANCEL"),
            type: "warning"
          }
        ).then(() => {
          const promiseList = [];
          for (const item of matchedFiles) {
            promiseList.push(renamefunc(item));
          }
          Promise.allSettled(promiseList).then(() => {
            ElMessage.success(
              `${T("MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A")} ${successCount},${T("MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B")} ${failCount}`
            );
          });
        }).catch(() => {
          ElMessage.info(T("MANAGE_BUCKET_BATCH_RENAME_CANCEL"));
        });
      } else {
        const promiseList = [];
        for (const item of matchedFiles) {
          promiseList.push(renamefunc(item));
        }
        Promise.allSettled(promiseList).then(() => {
          ElMessage.success(
            `${T("MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A")} ${successCount},${T("MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B")} ${failCount}`
          );
        });
      }
    }
    function handleBatchCopyInfo() {
      if (selectedItems.value.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_COPY_INFO_ERROR_MSG"));
        return;
      }
      const result = {};
      selectedItems.value.forEach((item) => {
        result[item.fileName] = item;
      });
      window.electron.clipboard.writeText(JSON.stringify(result, null, 2));
      ElMessage.success(
        `${T("MANAGE_BUCKET_BATCH_COPY_INFO_MSG_A")} ${selectedItems.value.length} ${T("MANAGE_BUCKET_BATCH_COPY_INFO_MSG_B")}`
      );
    }
    async function copyLink(item, type) {
      copyToClipboard(await formatLink(item.url, item.fileName, type, manageStore.config.settings.customPasteFormat));
    }
    async function handleBatchCopyLink(type) {
      if (!selectedItems.value.length) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_COPY_URL_ERROR_MSG"));
        return;
      }
      const result = [];
      for (const item of selectedItems.value) {
        if (!item.isDir) {
          const preSignedUrl = type === "preSignedUrl" ? await getPreSignedUrl(item) : null;
          const url = await formatLink(
            preSignedUrl || item.url,
            item.fileName,
            type,
            manageStore.config.settings.customPasteFormat
          );
          result.push(url);
        }
      }
      window.electron.clipboard.writeText(result.join("\n"));
      ElMessage.success(
        `${T("MANAGE_BUCKET_BATCH_COPY_URL_MSG_A")} ${result.length} ${T("MANAGE_BUCKET_BATCH_COPY_URL_MSG_B")}`
      );
    }
    function cancelLoading() {
      ElMessageBox.confirm(T("MANAGE_BUCKET_CANCEL_LOADING_TITLE"), T("MANAGE_BUCKET_CANCEL_LOADING_MSG"), {
        confirmButtonText: T("MANAGE_BUCKET_CANCEL_LOADING_CONFIRM"),
        cancelButtonText: T("MANAGE_BUCKET_CANCEL_LOADING_CANCEL"),
        type: "warning"
      }).then(() => {
        isLoadingData.value = false;
        window.electron.electronAPI.ipcRenderer.send("cancelLoadingFileList", cancelToken.value);
        ElMessage.success(T("MANAGE_BUCKET_CANCEL_LOADING_SUCCESS"));
      }).catch(() => {
      });
    }
    function cancelDownloadLoading() {
      ElMessageBox.confirm(
        T("MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_TITLE"),
        T("MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_MSG"),
        {
          confirmButtonText: T("MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CONFIRM"),
          cancelButtonText: T("MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CANCEL"),
          type: "warning"
        }
      ).then(() => {
        isLoadingData.value = false;
        window.electron.electronAPI.ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value);
        ElMessage.success(T("MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_SUCCESS"));
      }).catch(() => {
      });
    }
    async function getBucketFileListBackStage() {
      cancelToken.value = v4();
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        bucketConfig: {
          Location: configMap.bucketConfig.Location
        },
        paging: paging.value,
        prefix: currentPrefix.value,
        marker: pagingMarker.value,
        itemsPerPage: itemsPerPage.value,
        customUrl: currentCustomDomain.value,
        currentPage: currentPageNumber.value,
        cancelToken: cancelToken.value,
        cdnUrl: configMap.cdnUrl
      };
      isLoadingData.value = true;
      const fileTransferStore = useFileTransferStore();
      fileTransferStore.resetFileTransferList();
      const picBedNamesArr = ["webdavplist", "local", "sftp"];
      if (picBedNamesArr.includes(currentPicBedName.value)) {
        param.baseDir = configMap.baseDir;
        param.webPath = configMap.webPath;
      }
      sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, configMap.alias, param);
      window.electron.electronAPI.ipcRenderer.on("refreshFileTransferList", (_, data) => {
        fileTransferStore.refreshFileTransferList(data);
      });
      fileTransferInterval = setInterval(() => {
        const currentFileList = fileTransferStore.getFileTransferList();
        currentPageFilesInfo.splice(0, currentPageFilesInfo.length, ...currentFileList);
        const sortType = localStorage.getItem("sortType") || "init";
        sortFile(sortType);
        const table = fileCacheDbInstance.table(currentPicBedName.value);
        table.put({
          key: getTableKeyOfDb(),
          value: JSON.parse(
            JSON.stringify({
              fullList: currentPageFilesInfo
            })
          )
        });
        if (fileTransferStore.isFinished() && fileTransferInterval) {
          isLoadingData.value = false;
          clearInterval(fileTransferInterval);
          if (fileTransferStore.isSuccess()) {
            ElNotification.success({
              title: T("MANAGE_BUCKET_GET_FILE_BS_NOT_TITLE"),
              message: T("MANAGE_BUCKET_GET_FILE_BS_NOT_MSG"),
              duration: 500
            });
          } else {
            ElNotification.error({
              title: T("MANAGE_BUCKET_GET_FILE_BS_NOT_TITLE"),
              message: T("MANAGE_BUCKET_GET_FILE_BS_NOT_MSG2"),
              duration: 500
            });
          }
          fileTransferStore.resetFileTransferList();
        }
      }, 1e3);
    }
    async function getBucketFileList() {
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        bucketConfig: {
          Location: configMap.bucketConfig.Location
        },
        paging: paging.value,
        prefix: currentPrefix.value,
        marker: pagingMarker.value,
        itemsPerPage: itemsPerPage.value,
        customUrl: currentCustomDomain.value,
        currentPage: currentPageNumber.value
      };
      return await triggerRPC(IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST, configMap.alias, param);
    }
    function handleBatchDeleteInfo() {
      const confirmTitle = `${T("MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_A")} ${selectedItems.value.length} ${T("MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_B")}`;
      ElMessageBox.confirm(confirmTitle, T("MANAGE_BUCKET_BATCH_DELETE_CONFIRM_MSG"), {
        confirmButtonText: T("MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CONFIRM"),
        cancelButtonText: T("MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CANCEL"),
        type: "warning",
        center: true,
        draggable: true
      }).then(async () => {
        const copiedSelectedItems = JSON.parse(JSON.stringify(selectedItems.value));
        let successCount = 0;
        let failCount = 0;
        for (const item of copiedSelectedItems) {
          const param = {
            bucketName: configMap.bucketName,
            region: configMap.bucketConfig.Location,
            key: item.key,
            DeleteHash: item.sha,
            githubBranch: currentCustomDomain.value
          };
          const result = item.isDir ? await triggerRPC(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param) : await triggerRPC(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param);
          if (result) {
            successCount++;
            currentPageFilesInfo.splice(
              currentPageFilesInfo.findIndex((j) => j.key === item.key),
              1
            );
            if (!paging.value) {
              const table = fileCacheDbInstance.table(currentPicBedName.value);
              table.where("key").equals(getTableKeyOfDb()).modify((l) => {
                l.value.fullList.splice(
                  l.value.fullList.findIndex((j) => j.key === item.key),
                  1
                );
              });
            }
          } else {
            failCount++;
          }
        }
        if (successCount === 0) {
          ElNotification.error({
            title: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE"),
            message: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG"),
            duration: 1e3
          });
        } else if (failCount === 0) {
          ElNotification.success({
            title: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE"),
            message: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2"),
            duration: 1e3
          });
        } else {
          ElNotification.warning({
            title: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE"),
            message: `${T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2")} ${successCount}, ${T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG3")} ${failCount}`,
            duration: 1e3
          });
        }
      }).catch(() => {
        ElMessage.info(T("MANAGE_BUCKET_BATCH_DELETE_CANCEL"));
      });
    }
    function handleDeleteFile(item) {
      ElMessageBox.confirm(
        `${T("MANAGE_BUCKET_DELETE_CONFIRM_TITLE")} ${item.isDir ? T("MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER") : T("MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FILE")} ${item.fileName} ${item.isDir ? T("MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER_A") : ""}, ${T("MANAGE_BUCKET_DELETE_CONFIRM_TITLE_C")}`,
        T("MANAGE_BUCKET_DELETE_CONFIRM_MSG"),
        {
          confirmButtonText: T("MANAGE_BUCKET_DELETE_CONFIRM_CONFIRM"),
          cancelButtonText: T("MANAGE_BUCKET_DELETE_CONFIRM_CANCEL"),
          type: "warning",
          center: true,
          draggable: true
        }
      ).then(async () => {
        let res = false;
        const param = {
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: item.key,
          DeleteHash: item.sha,
          githubBranch: currentCustomDomain.value
        };
        if (item.isDir) {
          ElNotification.info({
            title: T("MANAGE_BUCKET_DELETE_ERROR_MSG_TITLE"),
            message: T("MANAGE_BUCKET_DELETE_ERROR_MSG_MSG"),
            duration: 1e3
          });
          res = await triggerRPC(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param);
        } else {
          res = await triggerRPC(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param);
        }
        if (res) {
          ElMessage.success(T("MANAGE_BUCKET_DELETE_SUCCESS"));
          currentPageFilesInfo.splice(
            currentPageFilesInfo.findIndex((i) => i.key === item.key),
            1
          );
          if (!paging.value) {
            const table = fileCacheDbInstance.table(currentPicBedName.value);
            table.where("key").equals(getTableKeyOfDb()).modify((l) => {
              l.value.fullList.splice(
                l.value.fullList.findIndex((i) => i.key === item.key),
                1
              );
            });
          }
        } else {
          ElMessage.error(T("MANAGE_BUCKET_DELETE_FAIL"));
        }
      }).catch(() => {
        ElMessage.info(T("MANAGE_BUCKET_DELETE_CANCEL"));
      });
    }
    function handleRenameFile(item) {
      batchRenameMatch.value = window.node.path.basename(item.fileName, window.node.path.extname(item.fileName));
      isSingleRename.value = true;
      isShowBatchRenameDialog.value = true;
      itemToBeRenamed.value = item;
    }
    function singleRename() {
      const index = filterList.value.findIndex((i) => i === itemToBeRenamed.value);
      isShowBatchRenameDialog.value = false;
      if (batchRenameMatch.value === "") {
        batchRenameMatch.value = ".+";
      }
      if (isRenameIncludeExt.value) {
        itemToBeRenamed.value.newName = customStrReplace(
          itemToBeRenamed.value.fileName,
          batchRenameMatch.value,
          batchRenameReplace.value
        );
      } else {
        itemToBeRenamed.value.newName = customStrReplace(itemToBeRenamed.value.fileName.split(".")[0], batchRenameMatch.value, batchRenameReplace.value) + "." + itemToBeRenamed.value.fileName.split(".")[1];
      }
      if (itemToBeRenamed.value.newName === itemToBeRenamed.value.fileName) {
        ElMessage.info(T("MANAGE_BUCKET_RENAME_INFO_MSG"));
        return;
      }
      itemToBeRenamed.value.newName = itemToBeRenamed.value.newName.replaceAll("{auto}", "1");
      const item = currentPageFilesInfo[index];
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        oldKey: item.key,
        newKey: (item.key.slice(0, item.key.lastIndexOf("/") + 1) + itemToBeRenamed.value.newName).replaceAll("//", "/"),
        customUrl: currentCustomDomain.value
      };
      triggerRPC(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param).then((res) => {
        if (res) {
          const oldKey = currentPrefix.value + item.fileName;
          if (pagingMarker.value === oldKey.slice(1)) {
            pagingMarker.value = currentPrefix.value.slice(1) + itemToBeRenamed.value.newName;
          }
          const oldName = item.fileName;
          if (itemToBeRenamed.value.newName.includes("/")) {
            item.fileName = itemToBeRenamed.value.newName.slice(0, itemToBeRenamed.value.newName.indexOf("/"));
            item.isDir = true;
            item.fileSize = 0;
            item.formatedTime = "";
          } else {
            item.fileName = itemToBeRenamed.value.newName;
          }
          item.key = (item.key.slice(0, item.key.lastIndexOf("/") + 1) + itemToBeRenamed.value.newName).replaceAll(
            "//",
            "/"
          );
          item.url = `${currentCustomDomain.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`;
          item.formatedTime = (/* @__PURE__ */ new Date()).toLocaleString();
          if (!paging.value) {
            const table = fileCacheDbInstance.table(currentPicBedName.value);
            table.where("key").equals(getTableKeyOfDb()).modify((l) => {
              l.value.fullList.forEach((i) => {
                if (i.fileName === oldName) {
                  if (itemToBeRenamed.value.newName.includes("/")) {
                    i.fileName = itemToBeRenamed.value.newName.slice(0, itemToBeRenamed.value.newName.indexOf("/"));
                    i.isDir = true;
                    i.fileSize = 0;
                    i.formatedTime = "";
                  } else {
                    i.fileName = itemToBeRenamed.value.newName;
                  }
                  i.key = (i.key.slice(0, i.key.lastIndexOf("/") + 1) + itemToBeRenamed.value.newName).replaceAll(
                    "//",
                    "/"
                  );
                  i.url = `${currentCustomDomain.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`;
                  i.formatedTime = (/* @__PURE__ */ new Date()).toLocaleString();
                }
              });
            });
          }
          ElMessage.success(T("MANAGE_BUCKET_RENAME_SUCCESS"));
        } else {
          ElMessage.error(T("MANAGE_BUCKET_RENAME_ERROR_MSG"));
        }
      });
    }
    function handleGetS3Config(item) {
      return {
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        customUrl: currentCustomDomain.value,
        expires: manageStore.config.settings.PreSignedExpire,
        githubPrivate: configMap.bucketConfig.private,
        rawUrl: item.url
      };
    }
    async function getPreSignedUrl(item) {
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        customUrl: currentCustomDomain.value,
        expires: manageStore.config.settings.PreSignedExpire,
        githubPrivate: configMap.bucketConfig.private,
        rawUrl: item.url
      };
      return await triggerRPC(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, configMap.alias, param);
    }
    function copyToClipboard(text) {
      window.electron.clipboard.writeText(text);
      ElMessage.success(T("MANAGE_BUCKET_COPY_SUCCESS"));
    }
    function getTableKeyOfDb() {
      let tableKey;
      if (currentPicBedName.value === "github") {
        tableKey = `${configMap.alias}@${configMap.bucketConfig.githubUsername}@${configMap.bucketName}@${currentCustomDomain.value}@${currentPrefix.value}`;
      } else {
        tableKey = `${configMap.alias}@${configMap.bucketName}@${currentPrefix.value}`;
      }
      return tableKey;
    }
    async function searchExistFileList() {
      const table = fileCacheDbInstance.table(currentPicBedName.value);
      return await table.where("key").equals(getTableKeyOfDb()).toArray();
    }
    function handleDetectShiftKey(event) {
      if (event.key === "Shift") {
        if (event.type === "keydown") {
          isShiftKeyPress.value = true;
        } else if (event.type === "keyup") {
          isShiftKeyPress.value = false;
        }
      }
    }
    const downloadedTaskColumns = [
      {
        key: "name",
        title: T("MANAGE_BUCKET_DOWNLOAD_COLUMN_FILENAME"),
        dataKey: "sourceFileName",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(
          "div",
          {
            onClick: () => {
              sendRPC(IRPCActionType.MANAGE_OPEN_LOCAL_FILE, item.targetFilePath);
            }
          },
          /* @__PURE__ */ React.createElement(ElTooltip, { effect: "dark", content: item.sourceFileName, placement: "top" }, /* @__PURE__ */ React.createElement(ElLink, { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.sourceFileName)))
        )
      },
      {
        key: "finishTime",
        title: T("MANAGE_BUCKET_DOWNLOAD_COLUMN_FINISHTIME"),
        dataKey: "finishTime",
        width: 200,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, item.finishTime)
      },
      {
        key: "status",
        title: T("MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS"),
        width: 100,
        cellRenderer: ({ rowData: item }) => item.status === "downloaded" ? /* @__PURE__ */ React.createElement(ElTag, { type: "success", style: "font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, T("MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_SUCCESS")) : /* @__PURE__ */ React.createElement(ElTag, { type: "danger", style: "font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, T("MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_FAIL"))
      }
    ];
    const uploadedTaskColumns = [
      {
        key: "name",
        title: T("MANAGE_BUCKET_UPLOAD_COLUMN_FILENAME"),
        dataKey: "sourceFileName",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElTooltip, { effect: "dark", content: item.sourceFileName, placement: "top" }, /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.sourceFileName)))
      },
      {
        key: "targetFilePath",
        title: T("MANAGE_BUCKET_UPLOAD_COLUMN_TARGETFILEPATH"),
        dataKey: "targetFilePath",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElTooltip, { effect: "dark", content: item.targetFilePath, placement: "top" }, /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.targetFilePath)))
      },
      {
        key: "finishTime",
        title: T("MANAGE_BUCKET_UPLOAD_COLUMN_FINISHTIME"),
        dataKey: "finishTime",
        width: 200,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, item.finishTime)
      },
      {
        key: "status",
        title: T("MANAGE_BUCKET_UPLOAD_COLUMN_STATUS"),
        width: 100,
        cellRenderer: ({ rowData: item }) => item.status === "uploaded" ? /* @__PURE__ */ React.createElement(ElTag, { type: "success", style: "font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, T("MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_SUCCESS")) : /* @__PURE__ */ React.createElement(ElTag, { type: "danger", style: "font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, T("MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_FAIL"))
      }
    ];
    const downloadingTaskColumns = [
      {
        key: "name",
        title: T("MANAGE_BUCKET_DOWNLOADING_COLUMN_FILENAME"),
        dataKey: "sourceFileName",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.sourceFileName))
      },
      {
        key: "progress",
        title: T("MANAGE_BUCKET_DOWNLOADING_COLUMN_PROGRESS"),
        dataKey: "progress",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElProgress, { percentage: item.progress, status: "success", strokeWidth: 20, textInside: true, style: "width: 100%;" })
      }
    ];
    const uploadingTaskColumns = [
      {
        key: "name",
        title: T("MANAGE_BUCKET_UPLOADING_COLUMN_FILENAME"),
        dataKey: "sourceFileName",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.sourceFileName))
      },
      {
        key: "progress",
        title: T("MANAGE_BUCKET_UPLOADING_COLUMN_PROGRESS"),
        dataKey: "progress",
        width: 300,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(
          ElProgress,
          {
            percentage: item.progress ? item.progress : 50,
            status: "success",
            strokeWidth: 20,
            textInside: true,
            style: "width: 100%;",
            indeterminate: !!item.noProgress
          }
        )
      }
    ];
    const upLoadTaskColumns = [
      {
        key: "name",
        title: T("MANAGE_BUCKET_UPLOADED_COLUMN_FILENAME"),
        dataKey: "name",
        width: 300,
        cellRenderer: ({ rowData: item }) => item.isFolder ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(ElIcon, { color: "#409EFF", style: "position: relative;left: -5px;" }, /* @__PURE__ */ React.createElement(folder_opened_default, null)), /* @__PURE__ */ React.createElement("span", { style: "font-weight: bold;color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.name))) : /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(ElIcon, { color: "#409EFF" }, /* @__PURE__ */ React.createElement(document_default, null)), /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.name)))
      },
      {
        key: "fileSize",
        title: T("MANAGE_BUCKET_UPLOADED_COLUMN_FILESIZE"),
        dataKey: "fileSize",
        width: 100,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, formatFileSize(item.fileSize))
      },
      {
        key: "fileNumber",
        title: T("MANAGE_BUCKET_UPLOADED_COLUMN_FILENUM"),
        width: 100,
        cellRenderer: ({ rowData: item }) => !item.isFolder ? /* @__PURE__ */ React.createElement("template", null) : /* @__PURE__ */ React.createElement("span", { style: "color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;" }, item.filesList.length)
      }
    ];
    function rowClass({ rowData }) {
      return rowData.checked ? "file-list-row-checked" : "";
    }
    const columns = [
      {
        key: "checked",
        title: "",
        dataKey: "checked",
        width: 30,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElCheckbox, { "v-model": item.checked })
      },
      {
        key: "icon",
        title: "",
        width: 30,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(
          ElPopover,
          {
            trigger: "hover",
            width: "200",
            disabled: !item.isImage,
            placement: "right",
            persistent: false,
            teleported: true
          },
          {
            reference: () => !item.isDir ? currentPicBedName.value !== "webdavplist" ? currentPicBedName.value === "s3plist" && item.isImage && isUsePreSignedUrl.value ? /* @__PURE__ */ React.createElement(
              ImagePreSignTsx,
              {
                isShowThumbnail: isShowThumbnail.value,
                item,
                config: handleGetS3Config(item),
                url: item.url,
                alias: configMap.alias
              }
            ) : /* @__PURE__ */ React.createElement(
              ElImage,
              {
                src: isShowThumbnail.value ? item.isImage ? item.url : require(`./assets/icons/${getFileIconPath(item.fileName ?? "")}`) : require(`./assets/icons/${getFileIconPath(item.fileName ?? "")}`),
                fit: "contain",
                style: { width: "20px", height: "20px" }
              },
              {
                placeholder: () => /* @__PURE__ */ React.createElement(ElIcon, null, /* @__PURE__ */ React.createElement(loading_default, null)),
                error: () => /* @__PURE__ */ React.createElement(
                  ElImage,
                  {
                    src: require(`./assets/icons/${getFileIconPath(item.fileName ?? "")}`),
                    fit: "contain",
                    style: { width: "20px", height: "20px" }
                  }
                )
              }
            ) : item.isImage ? /* @__PURE__ */ React.createElement(
              ImageWebdavTsx,
              {
                isShowThumbnail: isShowThumbnail.value,
                item,
                config: handleGetWebdavConfig(),
                url: item.url
              }
            ) : /* @__PURE__ */ React.createElement(
              ElImage,
              {
                src: require(`./assets/icons/${getFileIconPath(item.fileName ?? "")}`),
                fit: "contain",
                style: { width: "20px", height: "20px" }
              }
            ) : /* @__PURE__ */ React.createElement(
              ElImage,
              {
                src: require("./assets/icons/folder.webp"),
                fit: "contain",
                style: { width: "20px", height: "20px" }
              }
            ),
            default: () => currentPicBedName.value === "webdavplist" && item.isImage ? /* @__PURE__ */ React.createElement(
              ImageWebdavTsx,
              {
                isShowThumbnail: isShowThumbnail.value,
                item,
                config: handleGetWebdavConfig(),
                url: item.url
              }
            ) : currentPicBedName.value === "s3plist" && item.isImage && isUsePreSignedUrl.value ? /* @__PURE__ */ React.createElement(
              ImagePreSignTsx,
              {
                isShowThumbnail: isShowThumbnail.value,
                item,
                config: handleGetS3Config(item),
                url: item.url,
                alias: configMap.alias
              }
            ) : /* @__PURE__ */ React.createElement(
              ElImage,
              {
                src: item.isImage ? item.url : require(`./assets/icons/${getFileIconPath(item.fileName ?? "")}`),
                fit: "contain"
              },
              {
                placeholder: () => /* @__PURE__ */ React.createElement(ElIcon, null, /* @__PURE__ */ React.createElement(loading_default, null)),
                error: () => /* @__PURE__ */ React.createElement(ElIcon, null, /* @__PURE__ */ React.createElement(circle_close_default, null))
              }
            )
          }
        )
      },
      {
        key: "fileName",
        title: T("MANAGE_BUCKET_FILE_COLUMN_FILENAME"),
        dataKey: "fileName",
        width: 300,
        cellRenderer: ({ cellData: fileName, rowData: item }) => /* @__PURE__ */ React.createElement("div", { onClick: () => handleClickFile(item) }, /* @__PURE__ */ React.createElement(ElTooltip, { placement: "top", content: fileName }, /* @__PURE__ */ React.createElement("div", { style: "font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;" }, formatFileName(item.fileName ?? "", 40))))
      },
      {
        key: "rename",
        title: "",
        width: 30,
        cellRenderer: ({ rowData: item }) => item.isDir || !isShowRenameFileIcon.value ? item.isDir ? /* @__PURE__ */ React.createElement(ElIcon, { size: "15", style: "cursor: pointer;", color: "#409EFF", onClick: () => handleFolderBatchDownload(item) }, /* @__PURE__ */ React.createElement(download_default, null)) : /* @__PURE__ */ React.createElement("template", null) : /* @__PURE__ */ React.createElement(ElIcon, { size: "15", style: "cursor: pointer;", color: "#409EFF", onClick: () => handleRenameFile(item) }, /* @__PURE__ */ React.createElement(edit_default, null))
      },
      {
        key: "copy",
        title: "",
        width: 30,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElTooltip, { placement: "top", content: T("MANAGE_BUCKET_FILE_COLUMN_COPY_URL"), effect: "light", "hide-after": 150 }, /* @__PURE__ */ React.createElement(ElDropdown, { teleported: true }, {
          default: () => /* @__PURE__ */ React.createElement(
            ElIcon,
            {
              size: "15",
              style: "cursor: pointer;",
              color: "#409EFF",
              onClick: async () => copyToClipboard(
                await formatLink(
                  item.url,
                  item.fileName,
                  manageStore.config.settings.pasteFormat ?? "$markdown",
                  manageStore.config.settings.customPasteFormat ?? "$url"
                )
              )
            },
            /* @__PURE__ */ React.createElement(copy_document_default, null)
          ),
          dropdown: () => /* @__PURE__ */ React.createElement(ElDropdownMenu, null, /* @__PURE__ */ React.createElement(ElDropdownItem, { onClick: async () => copyToClipboard(await formatLink(item.url, item.fileName, "url")) }, "Url"), /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => copyToClipboard(await formatLink(item.url, item.fileName, "markdown"))
            },
            "Markdown"
          ), /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => copyToClipboard(await formatLink(item.url, item.fileName, "markdown-with-link"))
            },
            "Markdown-link"
          ), /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => copyToClipboard(await formatLink(item.url, item.fileName, "html"))
            },
            "Html"
          ), /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => copyToClipboard(await formatLink(item.url, item.fileName, "bbcode"))
            },
            "BBCode"
          ), /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => copyToClipboard(
                await formatLink(item.url, item.fileName, "custom", manageStore.config.settings.customPasteFormat)
              )
            },
            "Custom"
          ), isShowPresignedUrl.value ? /* @__PURE__ */ React.createElement(
            ElDropdownItem,
            {
              onClick: async () => {
                const res = await getPreSignedUrl(item);
                copyToClipboard(res);
              }
            },
            "preSignURL"
          ) : /* @__PURE__ */ React.createElement("template", null))
        }))
      },
      {
        key: "info",
        title: "",
        width: 30,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElTooltip, { placement: "top", content: T("MANAGE_BUCKET_FILE_COLUMN_INFO"), effect: "light", "hide-after": 150 }, /* @__PURE__ */ React.createElement(ElIcon, { size: "15", style: "cursor: pointer;", color: "#409EFF", onClick: () => handleShowFileInfo(item) }, /* @__PURE__ */ React.createElement(document_default, null)))
      },
      {
        key: "placeholder",
        title: "",
        width: 30,
        cellRenderer: () => /* @__PURE__ */ React.createElement("span", null)
      },
      {
        key: "fileSize",
        title: T("MANAGE_BUCKET_FILE_COLUMN_FILESIZE"),
        width: 100,
        dataKey: "fileSize",
        cellRenderer: ({ cellData: fileSize, rowData: item }) => /* @__PURE__ */ React.createElement(
          "div",
          {
            style: "font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;",
            onClick: () => handleCheckChangeOther(item)
          },
          formatFileSize(fileSize)
        )
      },
      {
        key: "formatedTime",
        title: T("MANAGE_BUCKET_FILE_COLUMN_TIME"),
        width: 200,
        dataKey: "formatedTime",
        cellRenderer: ({ cellData: formatedTime, rowData: item }) => /* @__PURE__ */ React.createElement(
          "div",
          {
            style: "font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;",
            onClick: () => handleCheckChangeOther(item)
          },
          formatedTime
        )
      },
      {
        key: "delete",
        title: "",
        width: 30,
        cellRenderer: ({ rowData: item }) => /* @__PURE__ */ React.createElement(ElIcon, { style: "cursor: pointer;", color: "red", onClick: () => handleDeleteFile(item) }, /* @__PURE__ */ React.createElement(delete_filled_default, null))
      }
    ];
    onBeforeMount(async () => {
      await manageStore.refreshConfig();
      isShowLoadingPage.value = true;
      await initCustomDomainList();
      await resetParam(true);
      isShowLoadingPage.value = false;
      document.addEventListener("keydown", handleDetectShiftKey);
      document.addEventListener("keyup", handleDetectShiftKey);
    });
    onBeforeUnmount(() => {
      document.removeEventListener("keydown", handleDetectShiftKey);
      document.removeEventListener("keyup", handleDetectShiftKey);
      fileTransferInterval && clearInterval(fileTransferInterval);
      downloadInterval && clearInterval(downloadInterval);
      refreshUploadTaskId.value && clearInterval(refreshUploadTaskId.value);
      refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value);
      if (isLoadingData.value) {
        window.electron.electronAPI.ipcRenderer.send("cancelLoadingFileList", cancelToken.value);
      }
      if (isLoadingDownloadData.value) {
        window.electron.electronAPI.ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value);
      }
      window.electron.electronAPI.ipcRenderer.removeAllListeners("refreshFileTransferList");
      window.electron.electronAPI.ipcRenderer.removeAllListeners(refreshDownloadFileTransferList);
    });
    return (_ctx, _cache) => {
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_breadcrumb_item = resolveComponent("el-breadcrumb-item");
      const _component_el_breadcrumb = resolveComponent("el-breadcrumb");
      const _component_el_button_group = resolveComponent("el-button-group");
      const _component_el_input_number = resolveComponent("el-input-number");
      const _component_el_dialog = resolveComponent("el-dialog");
      const _component_el_table_v2 = resolveComponent("el-table-v2");
      const _component_el_auto_resizer = resolveComponent("el-auto-resizer");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_image_viewer = resolveComponent("el-image-viewer");
      const _component_el_affix = resolveComponent("el-affix");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_badge = resolveComponent("el-badge");
      const _component_el_tab_pane = resolveComponent("el-tab-pane");
      const _component_el_tabs = resolveComponent("el-tabs");
      const _component_el_drawer = resolveComponent("el-drawer");
      const _component_highlightjs = resolveComponent("highlightjs");
      const _component_video_player = resolveComponent("video-player");
      const _component_el_descriptions_item = resolveComponent("el-descriptions-item");
      const _component_el_descriptions = resolveComponent("el-descriptions");
      const _directive_loading = resolveDirective("loading");
      return withDirectives((openBlock(), createElementBlock("div", {
        "element-loading-text": unref(T)("MANAGE_BUCKET_PAGE_LOADING_TEXT"),
        "element-loading-spinner": unref(svg),
        "element-loading-svg-view-box": "0, 0, 50, 50",
        "element-loading-background": "rgba(122, 122, 122, 0.5)"
      }, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, [
            isShowCustomDomainSelectList.value && customDomainList.value.length > 1 && isAutoCustomDomain.value ? (openBlock(), createBlock(_component_el_select, {
              key: 0,
              modelValue: currentCustomDomain.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => currentCustomDomain.value = $event),
              placeholder: unref(T)("MANAGE_BUCKET_PAGE_CUSTOM_URL_SELECT_PLACEHOLDER"),
              style: { "width": "200px" },
              persistent: false,
              teleported: "",
              onChange: handleChangeCustomUrlInput
            }, {
              default: withCtx(() => [
                (openBlock(true), createElementBlock(Fragment, null, renderList(customDomainList.value, (item) => {
                  return openBlock(), createBlock(_component_el_option, {
                    key: item,
                    label: item.label,
                    value: item.value
                  }, null, 8, ["label", "value"]);
                }), 128))
              ]),
              _: 1
            }, 8, ["modelValue", "placeholder"])) : isShowCustomDomainInput.value ? (openBlock(), createBlock(_component_el_input, {
              key: 1,
              modelValue: currentCustomDomain.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => currentCustomDomain.value = $event),
              placeholder: unref(T)("MANAGE_BUCKET_PAGE_CUSTOM_URL_INPUT_PLACEHOLDER"),
              style: { "width": "200px" },
              onBlur: handleChangeCustomUrlInput
            }, null, 8, ["modelValue", "placeholder"])) : (openBlock(), createBlock(unref(ElLink), {
              key: 2,
              underline: false,
              type: "primary",
              onClick: _cache[2] || (_cache[2] = ($event) => copyToClipboard(currentCustomDomain.value))
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(currentCustomDomain.value), 1)
              ]),
              _: 1
            }))
          ]),
          createBaseVNode("div", {
            style: { "display": "flex" },
            onClick: showUploadDialog
          }, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_UPLOAD_FILES_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px"
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(upload_default))
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
          createBaseVNode("div", null, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true,
              onClick: showUrlDialog
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_UPLOAD_FROM_URL_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px",
                      style: { "margin-left": "5px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(upload_filled_default))
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
          isShowCreateNewFolder.value ? (openBlock(), createElementBlock("div", _hoisted_4, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true,
              onClick: handleCreateFolder
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_CREATE_FOLDER_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px",
                      style: { "margin-left": "5px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(folder_add_default))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["content"])
              ]),
              _: 1
            })
          ])) : createCommentVNode("", true),
          createBaseVNode("div", { onClick: showDownloadDialog }, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_DOWNLOAD_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px",
                      style: { "margin-left": "5px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(download_default))
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
          isShowRenameFileIcon.value ? (openBlock(), createElementBlock("div", {
            key: 1,
            onClick: handleBatchRenameFile
          }, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_BATCH_RENAME_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px",
                      style: { "margin-left": "5px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(edit_default))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["content"])
              ]),
              _: 1
            })
          ])) : createCommentVNode("", true),
          createBaseVNode("div", null, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_BATCH_COPY_URL_TOOLTIP"),
                  placement: "right",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElDropdown), { teleported: "" }, {
                      dropdown: withCtx(() => [
                        isShowPresignedUrl.value ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList([...linkFormatArray, { key: "preSignURL", value: "preSignedUrl" }], (i) => {
                          return openBlock(), createBlock(unref(ElDropdownItem), {
                            key: i.key,
                            onClick: ($event) => handleBatchCopyLink(i.value)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(i.key), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]);
                        }), 128)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, renderList(linkFormatArray, (i) => {
                          return createVNode(unref(ElDropdownItem), {
                            key: i.value + i.key,
                            onClick: ($event) => handleBatchCopyLink(i.value)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(i.key), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]);
                        }), 64))
                      ]),
                      default: withCtx(() => [
                        createVNode(unref(ElIcon), {
                          class: "icon",
                          size: "25px",
                          color: selectedItems.value.length > 0 ? "#409EFF" : "gray",
                          style: { "margin-left": "10px" },
                          onClick: _cache[3] || (_cache[3] = ($event) => handleBatchCopyLink(unref(manageStore).config.settings.pasteFormat))
                        }, {
                          default: withCtx(() => [
                            createVNode(unref(link_default))
                          ]),
                          _: 1
                        }, 8, ["color"])
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
          createBaseVNode("div", null, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_COPY_FILE_INFO_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      class: "icon",
                      size: "25px",
                      color: selectedItems.value.length > 0 ? "#409EFF" : "gray",
                      style: { "margin-left": "10px" },
                      onClick: handleBatchCopyInfo
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(document_default))
                      ]),
                      _: 1
                    }, 8, ["color"])
                  ]),
                  _: 1
                }, 8, ["content"])
              ]),
              _: 1
            })
          ]),
          createBaseVNode("div", null, [
            createVNode(unref(ElButton), {
              type: "primary",
              link: true,
              onClick: forceRefreshFileList
            }, {
              default: withCtx(() => [
                createVNode(unref(ElTooltip), {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("MANAGE_BUCKET_PAGE_FORCE_REFRESH_TOOLTIP"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElIcon), {
                      id: "refresh",
                      class: "icon",
                      size: "25px",
                      style: { "margin-left": "10px", "color": "red" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(refresh_default))
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
          createVNode(_component_el_input, {
            modelValue: searchText.value,
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => searchText.value = $event),
            placeholder: unref(T)("MANAGE_BUCKET_PAGE_SEARCH_PLACEHOLDER"),
            style: { "margin-left": "10px", "width": "200px" },
            clearable: "",
            size: "small"
          }, null, 8, ["modelValue", "placeholder"])
        ]),
        createBaseVNode("div", _hoisted_5, [
          createVNode(_component_el_breadcrumb, {
            "separator-icon": unref(arrow_right_default),
            style: { "margin-top": "2px" }
          }, {
            default: withCtx(() => [
              createVNode(_component_el_breadcrumb_item, { style: { "flex-shrink": "0" } }, {
                default: withCtx(() => [
                  createVNode(unref(ElIcon), {
                    size: 16,
                    style: { "margin-right": "5px" }
                  }, {
                    default: withCtx(() => [
                      createVNode(unref(home_filled_default))
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }),
              configMap.prefix !== "/" ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(configMap.prefix.replace(/\/$/g, "").split("/"), (item, index) => {
                return openBlock(), createBlock(_component_el_breadcrumb_item, {
                  key: index,
                  style: { "flex-shrink": "0", "font-size": "12px", "color": "#606266", "font-family": "Arial, Helvetica, sans-serif", "cursor": "pointer" },
                  onClick: ($event) => handleBreadcrumbClick(index)
                }, {
                  default: withCtx(() => [
                    createVNode(unref(ElLink), null, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(item === "" ? unref(T)("MANAGE_BUCKET_PAGE_ROOT_FOLDER") : item), 1)
                      ]),
                      _: 2
                    }, 1024)
                  ]),
                  _: 2
                }, 1032, ["onClick"]);
              }), 128)) : (openBlock(), createBlock(_component_el_breadcrumb_item, {
                key: 1,
                style: { "flex-shrink": "0", "font-size": "12px", "color": "#606266", "font-family": "Arial, Helvetica, sans-serif", "cursor": "pointer" }
              }, {
                default: withCtx(() => [
                  createVNode(unref(ElLink), null, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_PAGE_ROOT_FOLDER")), 1)
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }))
            ]),
            _: 1
          }, 8, ["separator-icon"])
        ]),
        createBaseVNode("div", _hoisted_6, [
          createBaseVNode("div", _hoisted_7, [
            createBaseVNode("div", _hoisted_8, [
              createBaseVNode("span", null, [
                createVNode(unref(ElIcon), {
                  size: 14,
                  style: { "margin-right": "5px" }
                }, {
                  default: withCtx(() => [
                    createVNode(unref(document_default))
                  ]),
                  _: 1
                }),
                createBaseVNode("span", _hoisted_9, toDisplayString(`${unref(T)("MANAGE_BUCKET_PAGE_FILE_NUMBER")}${currentPageFilesInfo.length}`), 1)
              ]),
              createBaseVNode("span", null, [
                createVNode(unref(ElIcon), {
                  size: 14,
                  style: { "margin-right": "5px" }
                }, {
                  default: withCtx(() => [
                    createVNode(unref(coin_default))
                  ]),
                  _: 1
                }),
                createBaseVNode("span", _hoisted_10, toDisplayString(`${unref(T)("MANAGE_BUCKET_PAGE_FILE_SIZE")}${calculateAllFileSize.value}`), 1)
              ])
            ])
          ]),
          selectedItems.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_11, [
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "primary",
              plain: "",
              style: { "margin-right": "2px" },
              onClick: handleCheckAllChange
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_PAGE_SELECT_ALL")), 1)
              ]),
              _: 1
            })
          ])) : createCommentVNode("", true),
          selectedItems.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_12, [
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "warning",
              plain: "",
              style: { "margin-right": "2px" },
              onClick: handleCancelCheck
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_PAGE_SELECT_NONE")), 1)
              ]),
              _: 1
            }),
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "primary",
              plain: "",
              style: { "margin-right": "2px" },
              onClick: handleReverseCheck
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_PAGE_SELECT_INVERT")), 1)
              ]),
              _: 1
            }),
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "primary",
              plain: "",
              style: { "margin-right": "2px" },
              onClick: handleCheckAllChange
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_PAGE_SELECT_ALL")), 1)
              ]),
              _: 1
            }),
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "success",
              plain: "",
              icon: unref(download_default),
              style: { "margin-right": "2px" },
              onClick: handleBatchDownload
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(`${unref(T)("MANAGE_BUCKET_DOWNLOAD_BTN")}(${selectedItems.value.filter((item) => item.isDir === false).length})`), 1)
              ]),
              _: 1
            }, 8, ["icon"]),
            createVNode(unref(ElButton), {
              class: "btn",
              size: "small",
              type: "danger",
              icon: unref(delete_filled_default),
              onClick: handleBatchDeleteInfo
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(`${unref(T)("MANAGE_BUCKET_DELETE_BTN")}${selectedItems.value.length}`), 1)
              ]),
              _: 1
            }, 8, ["icon"])
          ])) : createCommentVNode("", true),
          createVNode(unref(ElDropdown), { teleported: "" }, {
            dropdown: withCtx(() => [
              (openBlock(), createElementBlock(Fragment, null, renderList(sortTypeList, (item) => {
                return createVNode(unref(ElDropdownItem), {
                  key: item,
                  onClick: ($event) => sortFile(item)
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(unref(T)(`MANAGE_BUCKET_SORT_${item.toUpperCase()}`)), 1)
                  ]),
                  _: 2
                }, 1032, ["onClick"]);
              }), 64))
            ]),
            default: withCtx(() => [
              createVNode(unref(ElButton), {
                size: "small",
                type: "primary",
                plain: "",
                icon: unref(sort_default)
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_TITLE")), 1)
                ]),
                _: 1
              }, 8, ["icon"])
            ]),
            _: 1
          }),
          createVNode(_component_el_button_group, {
            size: "small",
            style: { "margin-left": "10px", "width": "80px", "flex-shrink": "0" },
            type: "primary"
          }, {
            default: withCtx(() => [
              createVNode(unref(ElButton), {
                icon: unref(grid_default),
                type: layoutStyle.value === "grid" ? "primary" : "info",
                onClick: _cache[5] || (_cache[5] = ($event) => handleViewChange("grid"))
              }, null, 8, ["icon", "type"]),
              createVNode(unref(ElButton), {
                icon: unref(fold_default),
                type: layoutStyle.value === "list" ? "primary" : "info",
                onClick: _cache[6] || (_cache[6] = ($event) => handleViewChange("list"))
              }, null, 8, ["icon", "type"])
            ]),
            _: 1
          }),
          paging.value ? (openBlock(), createBlock(_component_el_input_number, {
            key: 2,
            modelValue: currentPageNumber.value,
            "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => currentPageNumber.value = $event),
            min: 1,
            size: "small",
            disabled: !paging.value,
            style: { "margin-left": "10px", "flex-shrink": "0" },
            onChange: changePage
          }, null, 8, ["modelValue", "disabled"])) : createCommentVNode("", true)
        ]),
        createVNode(_component_el_dialog, {
          modelValue: dialogVisible.value,
          "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => dialogVisible.value = $event),
          title: unref(T)("MANAGE_BUCKET_URL_UPLOAD_DIALOG_TITLE"),
          width: "50%",
          draggable: "",
          center: "",
          "align-center": "",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(unref(ElButton), {
              onClick: _cache[9] || (_cache[9] = ($event) => dialogVisible.value = false)
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_URL_UPLOAD_DIALOG_CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(unref(ElButton), {
              type: "primary",
              style: { "font-size": "12px", "font-weight": "500" },
              onClick: handleUploadFromUrl
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_URL_UPLOAD_DIALOG_CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(_component_el_input, {
              modelValue: urlToUpload.value,
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => urlToUpload.value = $event),
              placeholder: "https://www.baidu.com/img/bd_logo1.png\nhttps://www.baidu.com/img/bd_logo1.png",
              style: { "margin-bottom": "10px" },
              type: "textarea",
              autosize: { minRows: 3, maxRows: 5 }
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        layoutStyle.value === "list" ? (openBlock(), createElementBlock("div", _hoisted_13, [
          createVNode(_component_el_auto_resizer, null, {
            default: withCtx(({ height, width }) => [
              createVNode(_component_el_table_v2, {
                ref_key: "fileTable",
                ref: fileTable,
                columns,
                data: filterList.value,
                "row-class": rowClass,
                width,
                height
              }, null, 8, ["data", "width", "height"])
            ]),
            _: 1
          })
        ])) : createCommentVNode("", true),
        layoutStyle.value === "grid" ? (openBlock(), createElementBlock("div", _hoisted_14, [
          createVNode(_component_el_col, { span: 24 }, {
            default: withCtx(() => [
              createVNode(_component_el_row, { gutter: 16 }, {
                default: withCtx(() => [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(filterList.value, (item, index) => {
                    return openBlock(), createBlock(_component_el_col, {
                      key: index,
                      xs: 24,
                      sm: 12,
                      md: 8,
                      lg: 3,
                      xl: 2
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(ElCard), {
                          "body-style": {
                            padding: "0px",
                            height: "150px",
                            width: "100%",
                            background: item.checked ? "#f2f2f2" : "#fff"
                          },
                          style: { "margin-bottom": "10px" },
                          shadow: "hover"
                        }, {
                          default: withCtx(() => [
                            !item.isDir && !["webdavplist", "sftp", "local", "s3plist"].includes(currentPicBedName.value) ? (openBlock(), createBlock(unref(ElImage), {
                              key: 0,
                              src: isShowThumbnail.value && item.isImage ? item.url : require(`./assets/icons/${unref(getFileIconPath)(item.fileName ?? "")}`),
                              fit: "contain",
                              style: { "height": "100px", "width": "100%", "margin": "0 auto" },
                              onClick: ($event) => handleClickFile(item)
                            }, {
                              placeholder: withCtx(() => [
                                createVNode(unref(ElIcon), null, {
                                  default: withCtx(() => [
                                    createVNode(unref(loading_default))
                                  ]),
                                  _: 1
                                })
                              ]),
                              error: withCtx(() => [
                                createVNode(unref(ElImage), {
                                  src: require(`./assets/icons/${unref(getFileIconPath)(item.fileName ?? "")}`),
                                  fit: "contain",
                                  style: { "height": "100px", "width": "100%", "margin": "0 auto" }
                                }, null, 8, ["src"])
                              ]),
                              _: 2
                            }, 1032, ["src", "onClick"])) : !item.isDir && currentPicBedName.value === "s3plist" && !isUsePreSignedUrl.value ? (openBlock(), createBlock(unref(ElImage), {
                              key: 1,
                              src: isShowThumbnail.value && item.isImage ? item.url : require(`./assets/icons/${unref(getFileIconPath)(item.fileName ?? "")}`),
                              fit: "contain",
                              style: { "height": "100px", "width": "100%", "margin": "0 auto" },
                              onClick: ($event) => handleClickFile(item)
                            }, {
                              placeholder: withCtx(() => [
                                createVNode(unref(ElIcon), null, {
                                  default: withCtx(() => [
                                    createVNode(unref(loading_default))
                                  ]),
                                  _: 1
                                })
                              ]),
                              error: withCtx(() => [
                                createVNode(unref(ElImage), {
                                  src: require(`./assets/icons/${unref(getFileIconPath)(item.fileName ?? "")}`),
                                  fit: "contain",
                                  style: { "height": "100px", "width": "100%", "margin": "0 auto" }
                                }, null, 8, ["src"])
                              ]),
                              _: 2
                            }, 1032, ["src", "onClick"])) : !item.isDir && currentPicBedName.value === "s3plist" && isUsePreSignedUrl.value ? (openBlock(), createBlock(_sfc_main$2, {
                              key: 2,
                              "is-show-thumbnail": isShowThumbnail.value,
                              item,
                              alias: configMap.alias,
                              url: item.url,
                              config: handleGetS3Config(item),
                              onClick: ($event) => handleClickFile(item)
                            }, null, 8, ["is-show-thumbnail", "item", "alias", "url", "config", "onClick"])) : !item.isDir && currentPicBedName.value === "webdavplist" && item.isImage ? (openBlock(), createBlock(_sfc_main$1, {
                              key: 3,
                              "is-show-thumbnail": isShowThumbnail.value,
                              item,
                              config: handleGetWebdavConfig(),
                              url: item.url,
                              onClick: ($event) => handleClickFile(item)
                            }, null, 8, ["is-show-thumbnail", "item", "config", "url", "onClick"])) : !item.isDir && currentPicBedName.value === "local" && item.isImage ? (openBlock(), createBlock(_sfc_main$3, {
                              key: 4,
                              "is-show-thumbnail": isShowThumbnail.value,
                              item,
                              "local-path": item.key,
                              onClick: ($event) => handleClickFile(item)
                            }, null, 8, ["is-show-thumbnail", "item", "local-path", "onClick"])) : !item.isDir ? (openBlock(), createBlock(unref(ElImage), {
                              key: 5,
                              src: require(`./assets/icons/${unref(getFileIconPath)(item.fileName ?? "")}`),
                              fit: "contain",
                              style: { "height": "100px", "width": "100%", "margin": "0 auto" },
                              onClick: ($event) => handleClickFile(item)
                            }, null, 8, ["src", "onClick"])) : (openBlock(), createBlock(unref(ElImage), {
                              key: 6,
                              src: require("./assets/icons/folder.webp"),
                              fit: "contain",
                              style: { "height": "100px", "width": "100%", "margin": "0 auto" },
                              onClick: ($event) => handleClickFile(item)
                            }, null, 8, ["src", "onClick"])),
                            createBaseVNode("div", {
                              style: { "align-items": "center", "display": "flex", "justify-content": "center" },
                              onClick: ($event) => copyToClipboard(item.fileName ?? "")
                            }, [
                              createVNode(unref(ElTooltip), {
                                placement: "top",
                                effect: "light",
                                content: item.fileName,
                                persistent: false,
                                teleported: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(unref(ElLink), {
                                    style: { "font-size": "12px", "font-family": "Arial, Helvetica, sans-serif" },
                                    underline: false,
                                    type: item.checked ? "primary" : "info"
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(unref(formatFileName)(item.fileName ?? "", 15)), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["type"])
                                ]),
                                _: 2
                              }, 1032, ["content"])
                            ], 8, _hoisted_15),
                            createVNode(_component_el_row, {
                              style: { "display": "flex" },
                              justify: "space-between",
                              align: "middle"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_row, null, {
                                  default: withCtx(() => [
                                    !item.isDir && isShowRenameFileIcon.value ? (openBlock(), createBlock(unref(ElIcon), {
                                      key: 0,
                                      size: "15",
                                      style: { "cursor": "pointer" },
                                      color: "#409EFF",
                                      onClick: ($event) => handleRenameFile(item)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(unref(edit_default))
                                      ]),
                                      _: 2
                                    }, 1032, ["onClick"])) : createCommentVNode("", true),
                                    item.isDir ? (openBlock(), createBlock(unref(ElIcon), {
                                      key: 1,
                                      size: "15",
                                      style: { "cursor": "pointer" },
                                      color: "crimson",
                                      onClick: ($event) => handleFolderBatchDownload(item)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(unref(download_default))
                                      ]),
                                      _: 2
                                    }, 1032, ["onClick"])) : createCommentVNode("", true),
                                    createVNode(unref(ElDropdown), { teleported: "" }, {
                                      default: withCtx(() => [
                                        createVNode(unref(ElIcon), {
                                          size: "15",
                                          style: { "cursor": "pointer" },
                                          color: "#409EFF",
                                          onClick: async () => {
                                            copyToClipboard(
                                              await unref(formatLink)(
                                                item.url,
                                                item.fileName,
                                                unref(manageStore).config.settings.pasteFormat ?? "$markdown",
                                                unref(manageStore).config.settings.customPasteFormat ?? "$url"
                                              )
                                            );
                                          }
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(unref(copy_document_default))
                                          ]),
                                          _: 2
                                        }, 1032, ["onClick"])
                                      ]),
                                      dropdown: withCtx(() => [
                                        createVNode(unref(ElDropdownMenu), null, {
                                          default: withCtx(() => [
                                            (openBlock(), createElementBlock(Fragment, null, renderList(linkFormatList, (format) => {
                                              return createVNode(unref(ElDropdownItem), {
                                                key: format,
                                                onClick: ($event) => copyLink(item, format)
                                              }, {
                                                default: withCtx(() => [
                                                  createTextVNode(toDisplayString(unref(T)(`MANAGE_BUCKET_URL_FORMAT_${format.toUpperCase().replace(/-/g, "_")}`)), 1)
                                                ]),
                                                _: 2
                                              }, 1032, ["onClick"]);
                                            }), 64)),
                                            isShowPresignedUrl.value ? (openBlock(), createBlock(unref(ElDropdownItem), {
                                              key: 0,
                                              onClick: async () => {
                                                copyToClipboard(await getPreSignedUrl(item));
                                              }
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_URL_FORMAT_PRESIGN")), 1)
                                              ]),
                                              _: 2
                                            }, 1032, ["onClick"])) : createCommentVNode("", true)
                                          ]),
                                          _: 2
                                        }, 1024)
                                      ]),
                                      _: 2
                                    }, 1024),
                                    createVNode(unref(ElIcon), {
                                      size: "15",
                                      style: { "cursor": "pointer" },
                                      color: "#409EFF",
                                      onClick: ($event) => handleShowFileInfo(item)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(unref(document_default))
                                      ]),
                                      _: 2
                                    }, 1032, ["onClick"]),
                                    createVNode(unref(ElIcon), {
                                      size: "15",
                                      style: { "cursor": "pointer" },
                                      color: "#FFB6C1",
                                      onClick: ($event) => handleDeleteFile(item)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(unref(delete_filled_default))
                                      ]),
                                      _: 2
                                    }, 1032, ["onClick"])
                                  ]),
                                  _: 2
                                }, 1024),
                                createVNode(unref(ElCheckbox), {
                                  modelValue: item.checked,
                                  "onUpdate:modelValue": ($event) => item.checked = $event,
                                  size: "large"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              _: 2
                            }, 1024)
                          ]),
                          _: 2
                        }, 1032, ["body-style"])
                      ]),
                      _: 2
                    }, 1024);
                  }), 128))
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ])) : createCommentVNode("", true),
        isShowImagePreview.value ? (openBlock(), createBlock(_component_el_image_viewer, {
          key: 2,
          "url-list": ImagePreviewList.value,
          "initial-index": getCurrentPreviewIndex.value,
          infinite: "",
          "hide-on-click-modal": "",
          teleported: "",
          onClose: _cache[11] || (_cache[11] = ($event) => isShowImagePreview.value = false)
        }, null, 8, ["url-list", "initial-index"])) : createCommentVNode("", true),
        createVNode(_component_el_dialog, {
          modelValue: isShowFileInfo.value,
          "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => isShowFileInfo.value = $event),
          title: unref(T)("MANAGE_BUCKET_FILE_INFO_TITLE"),
          center: "",
          "align-center": "",
          draggable: "",
          "append-to-body": ""
        }, {
          header: withCtx(() => [
            createVNode(unref(ElButton), {
              type: "primary",
              plain: "",
              onClick: _cache[12] || (_cache[12] = ($event) => copyToClipboard(JSON.stringify(currentShowedFileInfo.value, null, 2)))
            }, {
              icon: withCtx(() => [
                createVNode(unref(ElIcon), null, {
                  default: withCtx(() => [
                    createVNode(unref(document_default))
                  ]),
                  _: 1
                })
              ]),
              default: withCtx(() => [
                createTextVNode(" " + toDisplayString(unref(T)("MANAGE_BUCKET_FILE_INFO_COPY_TIPS")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList(currentShowedFileInfo.value, (value, key) => {
              return openBlock(), createBlock(_component_el_row, {
                key,
                gutter: 20,
                style: {
                  margin: "10px 0",
                  textAlign: "center",
                  fontFamily: "Arial, Helvetica, sans-serif"
                }
              }, {
                default: withCtx(() => [
                  createVNode(_component_el_col, {
                    span: 6,
                    onClick: ($event) => copyToClipboard(JSON.stringify({ [key]: value }))
                  }, {
                    default: withCtx(() => [
                      createBaseVNode("span", _hoisted_16, toDisplayString(key) + ":", 1)
                    ]),
                    _: 2
                  }, 1032, ["onClick"]),
                  createVNode(_component_el_col, {
                    span: 18,
                    onClick: ($event) => copyToClipboard(value)
                  }, {
                    default: withCtx(() => [
                      createBaseVNode("span", _hoisted_17, toDisplayString(value), 1)
                    ]),
                    _: 2
                  }, 1032, ["onClick"])
                ]),
                _: 2
              }, 1024);
            }), 128))
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        isLoadingData.value ? (openBlock(), createBlock(_component_el_affix, {
          key: 3,
          style: { "position": "fixed", "bottom": "25px", "right": "0" },
          onClick: cancelLoading
        }, {
          default: withCtx(() => [
            createVNode(unref(ElButton), {
              type: "warning",
              icon: "el-icon-loading",
              style: { "font-size": "12px", "font-weight": "500" },
              loading: isLoadingData.value
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_FILE_LIST_LOADING")), 1)
              ]),
              _: 1
            }, 8, ["loading"])
          ]),
          _: 1
        })) : createCommentVNode("", true),
        isLoadingDownloadData.value ? (openBlock(), createBlock(_component_el_affix, {
          key: 4,
          style: { "position": "fixed", "top": "50px", "right": "0px" },
          onClick: cancelDownloadLoading
        }, {
          default: withCtx(() => [
            createVNode(unref(ElButton), {
              type: "warning",
              icon: "el-icon-loading",
              style: { "font-size": "12px", "font-weight": "500" },
              loading: isLoadingDownloadData.value
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_FILE_LIST_DOWNLOAD_PRE")), 1)
              ]),
              _: 1
            }, 8, ["loading"])
          ]),
          _: 1
        })) : createCommentVNode("", true),
        createVNode(_component_el_drawer, {
          modelValue: isShowUploadPanel.value,
          "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => isShowUploadPanel.value = $event),
          size: "60%",
          "append-to-body": "",
          onOpen: startRefreshUploadTask,
          onClose: stopRefreshUploadTask
        }, {
          header: withCtx(() => [
            createVNode(_component_el_switch, {
              modelValue: isUploadKeepDirStructure.value,
              "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => isUploadKeepDirStructure.value = $event),
              "active-text": unref(T)("MANAGE_BUCKET_KEEP_FOLDER_STRUCTURE"),
              "inactive-text": unref(T)("MANAGE_BUCKET_NOT_KEEP_FOLDER_STRUCTURE"),
              onChange: handleUploadKeepDirChange
            }, null, 8, ["modelValue", "active-text", "inactive-text"])
          ]),
          default: withCtx(() => [
            createBaseVNode("div", {
              id: "upload-area",
              class: normalizeClass({ "is-dragover": isDragover.value }),
              styel: "position: fixed;bottom: 0;right: 0;heigth: 100%;width: 100%;",
              onDrop: withModifiers(onDrop, ["prevent"]),
              onDragover: _cache[15] || (_cache[15] = withModifiers(($event) => isDragover.value = true, ["prevent"])),
              onDragleave: _cache[16] || (_cache[16] = withModifiers(($event) => isDragover.value = false, ["prevent"])),
              onClick: openFileSelectDialog
            }, [
              !tableData.length ? (openBlock(), createElementBlock("div", _hoisted_18, [
                createBaseVNode("div", _hoisted_19, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_TITLE")) + " ", 1),
                  createBaseVNode("span", _hoisted_20, toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_TEXT")), 1)
                ])
              ])) : createCommentVNode("", true),
              tableData.length ? (openBlock(), createBlock(_component_el_auto_resizer, { key: 1 }, {
                default: withCtx(({ height, width }) => [
                  createVNode(_component_el_table_v2, {
                    columns: upLoadTaskColumns,
                    data: tableData.sort(
                      (a, b) => b.isFolder - a.isFolder === 0 ? b.filesList.length - a.filesList.length : b.isFolder - a.isFolder
                    ),
                    width,
                    height
                  }, null, 8, ["data", "width", "height"])
                ]),
                _: 1
              })) : createCommentVNode("", true)
            ], 34),
            createBaseVNode("div", _hoisted_21, [
              createVNode(_component_el_button_group, null, {
                default: withCtx(() => [
                  createVNode(unref(ElButton), {
                    type: "success",
                    plain: "",
                    loading: isLoadingUploadPanelFiles.value,
                    disabled: isLoadingUploadPanelFiles.value || !tableData.length,
                    onClick: uploadFiles
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(isLoadingUploadPanelFiles.value ? unref(T)("MANAGE_BUCKET_UPLOAD_AREA_BTN_LOADING") : unref(T)("MANAGE_BUCKET_UPLOAD_AREA_BTN")), 1)
                    ]),
                    _: 1
                  }, 8, ["loading", "disabled"]),
                  createBaseVNode("span", null, [
                    createVNode(unref(ElButton), {
                      type: "warning",
                      plain: "",
                      disabled: isLoadingUploadPanelFiles.value,
                      onClick: clearTableData
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR")), 1)
                      ]),
                      _: 1
                    }, 8, ["disabled"])
                  ])
                ]),
                _: 1
              })
            ]),
            createVNode(_component_el_tabs, {
              modelValue: activeUpLoadTab.value,
              "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => activeUpLoadTab.value = $event),
              stretch: "",
              lazy: ""
            }, {
              default: withCtx(() => [
                createVNode(_component_el_tab_pane, { name: "uploading" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_STATUS_UPLOADING")), 1),
                    uploadingTaskList.value.length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: uploadingTaskList.value.length,
                      max: 9999,
                      type: "primary"
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyUploadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_22, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: uploadingTaskColumns,
                            data: uploadingTaskList.value,
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                }),
                createVNode(_component_el_tab_pane, { name: "finished" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_SUCCESS")), 1),
                    uploadedTaskList.value.filter((item) => item.status === "uploaded").length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: uploadedTaskList.value.filter((item) => item.status === "uploaded").length,
                      max: 9999,
                      type: "success"
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyUploadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_23, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: uploadedTaskColumns,
                            data: uploadedTaskList.value.filter((item) => item.status === "uploaded"),
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                }),
                createVNode(_component_el_tab_pane, { name: "failed" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_FAILED")), 1),
                    uploadedTaskList.value.filter((item) => item.status !== "uploaded").length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: uploadedTaskList.value.filter((item) => item.status !== "uploaded").length,
                      max: 9999,
                      type: "danger"
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyUploadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllUploadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_24, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: uploadedTaskColumns,
                            data: uploadedTaskList.value.filter((item) => item.status !== "uploaded"),
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["modelValue"])
          ]),
          _: 1
        }, 8, ["modelValue"]),
        createVNode(_component_el_drawer, {
          modelValue: isShowDownloadPanel.value,
          "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => isShowDownloadPanel.value = $event),
          title: unref(T)("MANAGE_BUCKET_DOWNLOAD_PAGE_TITLE"),
          size: "60%",
          "append-to-body": "",
          onOpen: startRefreshDownloadTask,
          onClose: stopRefreshDownloadTask
        }, {
          default: withCtx(() => [
            createVNode(_component_el_tabs, {
              modelValue: activeDownLoadTab.value,
              "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => activeDownLoadTab.value = $event),
              stretch: "",
              lazy: ""
            }, {
              default: withCtx(() => [
                createVNode(_component_el_tab_pane, { name: "downloading" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOADING")), 1),
                    downloadingTaskList.value.length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: downloadingTaskList.value.length,
                      type: "primary",
                      max: 9999
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyDownloadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(folder_default),
                          onClick: handleOpenDownloadedFolder
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_25, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: downloadingTaskColumns,
                            data: downloadingTaskList.value,
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                }),
                createVNode(_component_el_tab_pane, { name: "finished" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_SUCCESS")), 1),
                    downloadedTaskList.value.filter((item) => item.status === "downloaded").length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: downloadedTaskList.value.filter((item) => item.status === "downloaded").length,
                      max: 9999,
                      type: "success"
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyDownloadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(folder_default),
                          onClick: handleOpenDownloadedFolder
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_26, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: downloadedTaskColumns,
                            data: downloadedTaskList.value.filter((item) => item.status === "downloaded"),
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                }),
                createVNode(_component_el_tab_pane, { name: "failed" }, {
                  label: withCtx(() => [
                    createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_FAILED")), 1),
                    downloadedTaskList.value.filter((item) => item.status !== "downloaded").length ? (openBlock(), createBlock(_component_el_badge, {
                      key: 0,
                      value: downloadedTaskList.value.filter((item) => item.status !== "downloaded").length,
                      max: 9999,
                      type: "warning"
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ]),
                  default: withCtx(() => [
                    createVNode(_component_el_button_group, { size: "small" }, {
                      default: withCtx(() => [
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(document_default),
                          onClick: handleCopyDownloadingTaskInfo
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_COPY_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(delete_filled_default),
                          onClick: handleDeleteAllDownloadedTask
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"]),
                        createVNode(unref(ElButton), {
                          type: "primary",
                          plain: "",
                          icon: unref(folder_default),
                          onClick: handleOpenDownloadedFolder
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER")), 1)
                          ]),
                          _: 1
                        }, 8, ["icon"])
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_27, [
                      createVNode(_component_el_auto_resizer, null, {
                        default: withCtx(({ height, width }) => [
                          createVNode(_component_el_table_v2, {
                            columns: downloadedTaskColumns,
                            data: downloadedTaskList.value.filter((item) => item.status !== "downloaded"),
                            width,
                            height
                          }, null, 8, ["data", "width", "height"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["modelValue"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: isShowMarkDownDialog.value,
          "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => isShowMarkDownDialog.value = $event),
          title: unref(T)("MANAGE_BUCKET_MARKDOWN_PREVIEW"),
          center: "",
          "align-center": "",
          draggable: "",
          fullscreen: "",
          "close-on-press-escape": "",
          "show-close": "",
          "destroy-on-close": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createBaseVNode("div", {
              style: { "-webkit-user-select": "text", "user-select": "text" },
              innerHTML: markDownContent.value
            }, null, 8, _hoisted_28),
            createVNode(unref(ElButton), {
              type: "danger",
              icon: unref(close_default),
              size: "large",
              style: { "position": "fixed", "bottom": "10px", "right": "15px" },
              circle: "",
              onClick: _cache[21] || (_cache[21] = () => {
                isShowMarkDownDialog.value = false;
              })
            }, null, 8, ["icon"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: isShowTextFileDialog.value,
          "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => isShowTextFileDialog.value = $event),
          title: unref(T)("MANAGE_BUCKET_MARKDOWN_PREVIEW"),
          center: "",
          "align-center": "",
          draggable: "",
          fullscreen: "",
          "close-on-press-escape": "",
          "show-close": "",
          "destroy-on-close": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_highlightjs, {
              style: { "-webkit-user-select": "text", "user-select": "text" },
              language: "js",
              code: textfileContent.value
            }, null, 8, ["code"]),
            createVNode(unref(ElButton), {
              type: "danger",
              icon: unref(close_default),
              size: "large",
              style: { "position": "fixed", "bottom": "10px", "right": "15px" },
              circle: "",
              onClick: _cache[23] || (_cache[23] = () => {
                isShowTextFileDialog.value = false;
              })
            }, null, 8, ["icon"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: isShowVideoFileDialog.value,
          "onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => isShowVideoFileDialog.value = $event),
          title: unref(T)("MANAGE_BUCKET_PLAY"),
          center: "",
          "align-center": "",
          draggable: "",
          fullscreen: "",
          "close-on-press-escape": "",
          "show-close": "",
          "destroy-on-close": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_video_player, {
              src: videoFileUrl.value,
              headers: videoPlayerHeaders.value,
              controls: "",
              loop: true,
              volume: 0.6,
              autoplay: true,
              width: 1100,
              height: 700
            }, null, 8, ["src", "headers"]),
            createVNode(unref(ElButton), {
              type: "danger",
              icon: unref(close_default),
              size: "large",
              style: { "position": "fixed", "bottom": "10px", "right": "15px" },
              circle: "",
              onClick: _cache[25] || (_cache[25] = () => {
                isShowVideoFileDialog.value = false;
              })
            }, null, 8, ["icon"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: isShowBatchRenameDialog.value,
          "onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => isShowBatchRenameDialog.value = $event),
          title: unref(T)("MANAGE_BUCKET_RENAME_FILE"),
          center: "",
          "align-center": "",
          draggable: "",
          "destroy-on-close": "",
          "append-to-body": "",
          onClose: _cache[33] || (_cache[33] = () => {
            isSingleRename.value = false;
            isRenameIncludeExt.value = false;
          })
        }, {
          default: withCtx(() => [
            createVNode(unref(ElLink), {
              underline: false,
              style: { "margin-bottom": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A")) + " - Matched: " + toDisplayString(matchedFilesNumber.value) + " ", 1),
                  createVNode(unref(ElTooltip), {
                    effect: "dark",
                    content: unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A_TIPS"),
                    placement: "right",
                    persistent: false,
                    teleported: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(unref(ElIcon), { color: "#409EFF" }, {
                        default: withCtx(() => [
                          createVNode(unref(info_filled_default))
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["content"])
                ])
              ]),
              _: 1
            }),
            createVNode(_component_el_input, {
              modelValue: batchRenameMatch.value,
              "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => batchRenameMatch.value = $event),
              placeholder: unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A_PLACEHOLDER"),
              clearable: ""
            }, null, 8, ["modelValue", "placeholder"]),
            createVNode(unref(ElLink), {
              underline: false,
              style: { "margin-bottom": "10px", "margin-top": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_B")) + " ", 1),
                  createVNode(unref(ElPopover), {
                    effect: "light",
                    placement: "right",
                    width: "280",
                    persistent: false,
                    teleported: ""
                  }, {
                    reference: withCtx(() => [
                      createVNode(unref(ElIcon), { color: "#409EFF" }, {
                        default: withCtx(() => [
                          createVNode(unref(info_filled_default))
                        ]),
                        _: 1
                      })
                    ]),
                    default: withCtx(() => [
                      createVNode(_component_el_descriptions, {
                        column: 1,
                        style: { "width": "250px" },
                        border: ""
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(customRenameFormatTable), (item, index) => {
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
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(customRenameFormatTable).slice(0, unref(customRenameFormatTable).length - 1), (item, index) => {
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
                          }), 128)),
                          createVNode(_component_el_descriptions_item, {
                            label: "{auto}",
                            align: "center",
                            "label-style": "width: 100px;"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_TABLE_IID")), 1)
                            ]),
                            _: 1
                          })
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
              modelValue: batchRenameReplace.value,
              "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => batchRenameReplace.value = $event),
              placeholder: "Ex. {Y}-{m}-{uuid}",
              clearable: ""
            }, null, 8, ["modelValue"]),
            createVNode(unref(ElLink), {
              underline: false,
              style: { "margin-bottom": "10px", "margin-top": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_EXT")) + " ", 1),
                  createVNode(unref(ElTooltip), {
                    effect: "dark",
                    content: unref(T)("MANAGE_BUCKET_RENAME_FILE_EXT_TIPS"),
                    placement: "right",
                    persistent: false,
                    teleported: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(unref(ElIcon), { color: "#409EFF" }, {
                        default: withCtx(() => [
                          createVNode(unref(info_filled_default))
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["content"])
                ])
              ]),
              _: 1
            }),
            _cache[34] || (_cache[34] = createBaseVNode("br", null, null, -1)),
            createVNode(_component_el_switch, {
              modelValue: isRenameIncludeExt.value,
              "onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => isRenameIncludeExt.value = $event),
              "active-text": unref(T)("MANAGE_BUCKET_RENAME_FILE_EXT_YES"),
              "inactive-text": unref(T)("MANAGE_BUCKET_RENAME_FILE_EXT_NO")
            }, null, 8, ["modelValue", "active-text", "inactive-text"]),
            createBaseVNode("div", _hoisted_29, [
              createVNode(unref(ElButton), {
                type: "danger",
                style: { "margin-right": "30px" },
                plain: "",
                icon: unref(close_default),
                onClick: _cache[30] || (_cache[30] = () => {
                  isShowBatchRenameDialog.value = false;
                })
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_CANCEL")), 1)
                ]),
                _: 1
              }, 8, ["icon"]),
              createVNode(unref(ElButton), {
                type: "primary",
                plain: "",
                icon: unref(edit_default),
                onClick: _cache[31] || (_cache[31] = ($event) => isSingleRename.value ? singleRename() : BatchRename())
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_CONFIRM")), 1)
                ]),
                _: 1
              }, 8, ["icon"])
            ])
          ]),
          _: 1,
          __: [34]
        }, 8, ["modelValue", "title"])
      ], 8, _hoisted_1)), [
        [_directive_loading, isShowLoadingPage.value]
      ]);
    };
  }
});
export {
  _sfc_main as default
};
