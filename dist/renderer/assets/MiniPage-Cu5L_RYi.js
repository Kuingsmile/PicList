import { d as defineComponent, r as ref, o as onBeforeMount, D as watch, s as sendRPC, j as IRPCActionType, b as onBeforeUnmount, c as createElementBlock, e as openBlock, f as createBaseVNode, g as createCommentVNode, x as withModifiers, E as normalizeStyle, n as normalizeClass, u as unref, H as osGlobal, k as getConfig, m as triggerRPC, J as ElMessage, T } from "./index-BqdcQlNn.js";
import { i as isUrl } from "./common-DNjr697i.js";
const _hoisted_1 = { id: "mini-page" };
const _hoisted_2 = ["src"];
const __default__ = {
  name: "MiniPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const logoPath = ref("");
    const dragover = ref(false);
    const progress = ref(0);
    const isShowingProgress = ref(false);
    const draggingState = ref(false);
    const wX = ref(-1);
    const wY = ref(-1);
    const screenX = ref(-1);
    const screenY = ref(-1);
    async function initLogoPath() {
      const config = await getConfig();
      if (config) {
        if (config.settings?.isCustomMiniIcon && config.settings?.customMiniIcon) {
          logoPath.value = "data:image/jpg;base64," + await triggerRPC(IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64, config.settings.customMiniIcon);
        }
      }
    }
    onBeforeMount(async () => {
      await initLogoPath();
      window.electron.electronAPI.ipcRenderer.on("uploadProgress", (_, _progress) => {
        if (_progress !== -1) {
          isShowingProgress.value = true;
          progress.value = _progress;
        } else {
          progress.value = 100;
        }
      });
      window.electron.electronAPI.ipcRenderer.on("updateMiniIcon", async () => {
        await initLogoPath();
      });
      window.addEventListener("mousedown", handleMouseDown, false);
      window.addEventListener("mousemove", handleMouseMove, false);
      window.addEventListener("mouseup", handleMouseUp, false);
    });
    watch(progress, (val) => {
      if (val === 100) {
        setTimeout(() => {
          isShowingProgress.value = false;
        }, 1e3);
        setTimeout(() => {
          progress.value = 0;
        }, 1200);
      }
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
    function openUploadWindow() {
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
    function handleMouseDown(e) {
      draggingState.value = true;
      wX.value = e.pageX;
      wY.value = e.pageY;
      screenX.value = e.screenX;
      screenY.value = e.screenY;
    }
    function handleMouseMove(e) {
      e.preventDefault();
      e.stopPropagation();
      if (draggingState.value) {
        const xLoc = e.screenX - wX.value;
        const yLoc = e.screenY - wY.value;
        sendRPC(IRPCActionType.SET_MINI_WINDOW_POS, {
          x: xLoc,
          y: yLoc,
          width: 64,
          height: 64
        });
      }
    }
    function handleMouseUp(e) {
      draggingState.value = false;
      if (screenX.value === e.screenX && screenY.value === e.screenY) {
        if (e.button === 0) {
          openUploadWindow();
        } else {
          openContextMenu();
        }
      }
    }
    function openContextMenu() {
      sendRPC(IRPCActionType.SHOW_MINI_PAGE_MENU);
    }
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeAllListeners("uploadProgress");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("updateMiniIcon");
      window.removeEventListener("mousedown", handleMouseDown, false);
      window.removeEventListener("mousemove", handleMouseMove, false);
      window.removeEventListener("mouseup", handleMouseUp, false);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", {
          id: "upload-area",
          class: normalizeClass({
            "is-dragover": dragover.value,
            uploading: isShowingProgress.value,
            linux: unref(osGlobal) === "linux"
          }),
          style: normalizeStyle({ backgroundPosition: "0 " + progress.value + "%" }),
          onDrop: withModifiers(onDrop, ["prevent"]),
          onDragover: _cache[0] || (_cache[0] = withModifiers(($event) => dragover.value = true, ["prevent"])),
          onDragleave: _cache[1] || (_cache[1] = withModifiers(($event) => dragover.value = false, ["prevent"]))
        }, [
          !dragover.value && !isShowingProgress.value ? (openBlock(), createElementBlock("img", {
            key: 0,
            src: logoPath.value ? logoPath.value : require("../assets/squareLogo.png"),
            style: { "width": "100%", "height": "100%", "border-radius": "50%" }
          }, null, 8, _hoisted_2)) : createCommentVNode("", true),
          createBaseVNode("div", {
            id: "upload-dragger",
            onDblclick: openUploadWindow
          }, [
            createBaseVNode("input", {
              id: "file-uploader",
              type: "file",
              multiple: "",
              onChange
            }, null, 32)
          ], 32)
        ], 38)
      ]);
    };
  }
});
export {
  _sfc_main as default
};
