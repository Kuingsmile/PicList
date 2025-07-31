import { M as onMounted, b as onBeforeUnmount, d as defineComponent, r as ref, l as IPasteStyle, D as watch, o as onBeforeMount, U as updatePicBedGlobal, O as SHOW_INPUT_BOX_RESPONSE, k as getConfig, s as sendRPC, j as IRPCActionType, J as ElMessage, T, a3 as picBedGlobal, c as createElementBlock, e as openBlock, q as createVNode, v as withCtx, y as resolveComponent, u as unref, p as configPaths, f as createBaseVNode, t as toDisplayString, aj as caret_bottom_default, B as createTextVNode, a0 as upload_filled_default, x as withModifiers, n as normalizeClass, F as Fragment, h as renderList, N as createBlock, m as triggerRPC, Q as useRouter, ak as PICBEDS_PAGE, af as saveConfig, S as SHOW_INPUT_BOX } from "./index-BqdcQlNn.js";
import { _ as _sfc_main$1 } from "./ImageProcessSetting.vue_vue_type_script_setup_true_lang-DFtMAQE7.js";
import { e as emitter } from "./bus-BjW7Y6FA.js";
import { i as isUrl } from "./common-DNjr697i.js";
function disableDrag(e) {
  const dropzone = document.getElementById("upload-area");
  if (dropzone === null || !dropzone.contains(e.target)) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }
}
function useDragEventListeners() {
  onMounted(() => {
    window.addEventListener("dragenter", disableDrag, false);
    window.addEventListener("dragover", disableDrag);
    window.addEventListener("drop", disableDrag);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("dragenter", disableDrag, false);
    window.removeEventListener("dragover", disableDrag);
    window.removeEventListener("drop", disableDrag);
  });
}
const _hoisted_1 = { id: "upload-view" };
const _hoisted_2 = { class: "view-title" };
const _hoisted_3 = { class: "upload-dragger__text" };
const _hoisted_4 = { class: "paste-style" };
const _hoisted_5 = { class: "el-col-12" };
const _hoisted_6 = { class: "paste-style__text" };
const _hoisted_7 = { class: "el-col-8" };
const _hoisted_8 = { class: "paste-style__text" };
const __default__ = {
  name: "UploadPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    useDragEventListeners();
    const $router = useRouter();
    const imageProcessDialogVisible = ref(false);
    const useShortUrl = ref(false);
    const dragover = ref(false);
    const progress = ref(0);
    const showProgress = ref(false);
    const showError = ref(false);
    const pasteStyle = ref("");
    const picBedName = ref("");
    const picBedConfigName = ref("");
    const pasteFormatList = ref({
      [IPasteStyle.MARKDOWN]: "![alt](url)",
      [IPasteStyle.HTML]: '<img src="url"/>',
      [IPasteStyle.URL]: "http://test.com/test.png",
      [IPasteStyle.UBB]: "[img]url[/img]",
      [IPasteStyle.CUSTOM]: ""
    });
    watch(picBedGlobal, () => {
      getDefaultPicBed();
    });
    onBeforeMount(() => {
      updatePicBedGlobal();
      window.electron.electronAPI.ipcRenderer.on("uploadProgress", (_event, _progress) => {
        if (_progress !== -1) {
          showProgress.value = true;
          progress.value = _progress;
        } else {
          progress.value = 100;
          showError.value = true;
        }
      });
      getUseShortUrl();
      getPasteStyle();
      getDefaultPicBed();
      window.electron.electronAPI.ipcRenderer.on("syncPicBed", () => {
        getDefaultPicBed();
      });
      emitter.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue);
    });
    const handleImageProcess = () => {
      imageProcessDialogVisible.value = true;
    };
    watch(progress, onProgressChange);
    function onProgressChange(val) {
      if (val === 100) {
        setTimeout(() => {
          showProgress.value = false;
          showError.value = false;
        }, 1e3);
        setTimeout(() => {
          progress.value = 0;
        }, 1200);
      }
    }
    async function handlePicBedNameClick(_picBedName, picBedConfigName2) {
      const formatedpicBedConfigName = picBedConfigName2 || "Default";
      const currentPicBed = await getConfig(configPaths.picBed.current);
      const currentPicBedConfig = await getConfig(`uploader.${currentPicBed}`) || {};
      const configList = await triggerRPC(IRPCActionType.PICBED_GET_CONFIG_LIST, currentPicBed);
      const currentConfigList = configList?.configList ?? [];
      const config = currentConfigList.find((item) => item._configName === formatedpicBedConfigName);
      $router.push({
        name: PICBEDS_PAGE,
        params: {
          type: currentPicBed,
          configId: config?._id || ""
        },
        query: {
          defaultConfigId: currentPicBedConfig.defaultId || ""
        }
      });
    }
    onBeforeUnmount(() => {
      emitter.off(SHOW_INPUT_BOX_RESPONSE);
      window.electron.electronAPI.ipcRenderer.removeAllListeners("uploadProgress");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("syncPicBed");
    });
    function onDrop(e) {
      dragover.value = false;
      if (e.dataTransfer?.files?.length) {
        ipcSendFiles(e.dataTransfer.files);
      } else if (e.dataTransfer?.items) {
        const items = e.dataTransfer.items;
        if (items.length === 2 && items[0].type === "text/uri-list") {
          handleURLDrag(items, e.dataTransfer);
        } else if (items[0].type === "text/plain") {
          const str = e.dataTransfer.getData(items[0].type);
          if (isUrl(str)) {
            sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }]);
          } else {
            ElMessage.error(T("TIPS_DRAG_VALID_PICTURE_OR_URL"));
          }
        }
      }
    }
    function handleURLDrag(items, dataTransfer) {
      const urlString = dataTransfer.getData(items[1].type);
      const urlMatch = urlString.match(/<img.*src="(.*?)"/);
      if (urlMatch) {
        sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
          {
            path: urlMatch[1]
          }
        ]);
      } else {
        ElMessage.error(T("TIPS_DRAG_VALID_PICTURE_OR_URL"));
      }
    }
    function openUplodWindow() {
      document.getElementById("file-uploader").click();
    }
    function onChange(e) {
      ipcSendFiles(e.target.files);
      document.getElementById("file-uploader").value = "";
    }
    function ipcSendFiles(files) {
      const sendFiles = [];
      Array.from(files).forEach((item) => {
        const obj = {
          name: item.name,
          path: item.webkitRelativePath
        };
        sendFiles.push(obj);
      });
      sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles);
    }
    async function getPasteStyle() {
      pasteStyle.value = await getConfig(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      pasteFormatList.value.Custom = await getConfig(configPaths.settings.customLink) || "![$fileName]($url)";
    }
    async function getUseShortUrl() {
      useShortUrl.value = await getConfig(configPaths.settings.useShortUrl) || false;
    }
    async function handleUseShortUrlChange() {
      saveConfig({
        [configPaths.settings.useShortUrl]: useShortUrl.value
      });
    }
    function handlePasteStyleChange(val) {
      saveConfig({
        [configPaths.settings.pasteStyle]: val || IPasteStyle.MARKDOWN
      });
    }
    function uploadClipboardFiles() {
      sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE);
    }
    async function uploadURLFiles() {
      const str = await navigator.clipboard.readText();
      emitter.emit(SHOW_INPUT_BOX, {
        value: isUrl(str) ? str : "",
        title: T("TIPS_INPUT_URL"),
        placeholder: T("TIPS_HTTP_PREFIX")
      });
    }
    function handleInputBoxValue(val) {
      if (val === "") return;
      if (isUrl(val)) {
        sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
          {
            path: val
          }
        ]);
      } else {
        ElMessage.error(T("TIPS_INPUT_VALID_URL"));
      }
    }
    async function getDefaultPicBed() {
      const currentPicBed = await getConfig(configPaths.picBed.current);
      picBedGlobal.value.forEach((item) => {
        if (item.type === currentPicBed) {
          picBedName.value = item.name;
        }
      });
      picBedConfigName.value = await getConfig(`picBed.${currentPicBed}._configName`) || "";
    }
    async function handleChangePicBed() {
      sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU);
    }
    return (_ctx, _cache) => {
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_progress = resolveComponent("el-progress");
      const _component_el_radio_button = resolveComponent("el-radio-button");
      const _component_el_radio_group = resolveComponent("el-radio-group");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_dialog = resolveComponent("el-dialog");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_row, {
          gutter: 16,
          align: "middle"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_col, { span: 24 }, {
              default: withCtx(() => [
                createBaseVNode("div", _hoisted_2, [
                  createVNode(_component_el_tooltip, {
                    placement: "top",
                    effect: "light",
                    content: unref(T)("UPLOAD_VIEW_HINT"),
                    persistent: false,
                    teleported: ""
                  }, {
                    default: withCtx(() => [
                      createBaseVNode("span", {
                        id: "upload-view-title",
                        onClick: _cache[0] || (_cache[0] = ($event) => handlePicBedNameClick(picBedName.value, picBedConfigName.value))
                      }, toDisplayString(picBedName.value) + " - " + toDisplayString(picBedConfigName.value || "Default"), 1)
                    ]),
                    _: 1
                  }, 8, ["content"]),
                  createVNode(_component_el_icon, {
                    style: { "cursor": "pointer", "margin-left": "4px" },
                    onClick: handleChangePicBed
                  }, {
                    default: withCtx(() => [
                      createVNode(unref(caret_bottom_default))
                    ]),
                    _: 1
                  }),
                  createVNode(_component_el_button, {
                    type: "primary",
                    round: "",
                    size: "small",
                    class: "quick-upload",
                    style: { "margin-left": "6px" },
                    onClick: handleImageProcess
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_NAME")), 1)
                    ]),
                    _: 1
                  })
                ]),
                createBaseVNode("div", {
                  id: "upload-area",
                  class: normalizeClass({ "is-dragover": dragover.value }),
                  onDrop: withModifiers(onDrop, ["prevent"]),
                  onDragover: _cache[1] || (_cache[1] = withModifiers(($event) => dragover.value = true, ["prevent"])),
                  onDragleave: _cache[2] || (_cache[2] = withModifiers(($event) => dragover.value = false, ["prevent"]))
                }, [
                  createBaseVNode("div", {
                    id: "upload-dragger",
                    onClick: openUplodWindow
                  }, [
                    createVNode(_component_el_icon, null, {
                      default: withCtx(() => [
                        createVNode(unref(upload_filled_default))
                      ]),
                      _: 1
                    }),
                    createBaseVNode("div", _hoisted_3, [
                      createTextVNode(toDisplayString(unref(T)("DRAG_FILE_TO_HERE")) + " ", 1),
                      createBaseVNode("span", null, toDisplayString(unref(T)("CLICK_TO_UPLOAD")), 1)
                    ]),
                    createBaseVNode("input", {
                      id: "file-uploader",
                      type: "file",
                      multiple: "",
                      onChange
                    }, null, 32)
                  ])
                ], 34),
                createVNode(_component_el_progress, {
                  percentage: progress.value,
                  "show-text": false,
                  class: normalizeClass(["upload-progress", { show: showProgress.value }]),
                  status: showError.value ? "exception" : void 0
                }, null, 8, ["percentage", "class", "status"]),
                createBaseVNode("div", _hoisted_4, [
                  createBaseVNode("div", _hoisted_5, [
                    createBaseVNode("div", _hoisted_6, toDisplayString(unref(T)("LINK_FORMAT")), 1),
                    createVNode(_component_el_radio_group, {
                      modelValue: pasteStyle.value,
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => pasteStyle.value = $event),
                      size: "small",
                      onChange: handlePasteStyleChange
                    }, {
                      default: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(pasteFormatList.value, (item, key) => {
                          return openBlock(), createBlock(_component_el_radio_button, {
                            key,
                            value: key,
                            title: item
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(key), 1)
                            ]),
                            _: 2
                          }, 1032, ["value", "title"]);
                        }), 128))
                      ]),
                      _: 1
                    }, 8, ["modelValue"]),
                    createVNode(_component_el_radio_group, {
                      modelValue: useShortUrl.value,
                      "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => useShortUrl.value = $event),
                      size: "small",
                      onChange: handleUseShortUrlChange
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_radio_button, {
                          value: true,
                          style: { "border-radius": "5px" }
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("UPLOAD_SHORT_URL")), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_radio_button, {
                          value: false,
                          style: { "border-radius": "5px" }
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("UPLOAD_NORMAL_URL")), 1)
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  createBaseVNode("div", _hoisted_7, [
                    createBaseVNode("div", _hoisted_8, toDisplayString(unref(T)("QUICK_UPLOAD")), 1),
                    createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      size: "small",
                      class: "quick-upload",
                      style: { "width": "50%" },
                      onClick: uploadClipboardFiles
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("CLIPBOARD_PICTURE")), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      size: "small",
                      class: "quick-upload",
                      style: { "width": "46%", "margin-left": "6px" },
                      onClick: uploadURLFiles
                    }, {
                      default: withCtx(() => _cache[7] || (_cache[7] = [
                        createTextVNode(" URL ", -1)
                      ])),
                      _: 1,
                      __: [7]
                    })
                  ])
                ])
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        createVNode(_component_el_dialog, {
          modelValue: imageProcessDialogVisible.value,
          "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => imageProcessDialogVisible.value = $event),
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
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => imageProcessDialogVisible.value = $event)
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
