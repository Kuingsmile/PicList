import { d as defineComponent, r as ref, a as reactive, T, o as onBeforeMount, $ as $$db, b as onBeforeUnmount, c as createElementBlock, e as openBlock, f as createBaseVNode, t as toDisplayString, u as unref, g as createCommentVNode, F as Fragment, h as renderList, n as normalizeClass, w as withDirectives, i as resolveDirective, s as sendRPC, I as IWindowList, j as IRPCActionType, k as getConfig, l as IPasteStyle, m as triggerRPC, p as configPaths } from "./index-BqdcQlNn.js";
import { h as handleUrlEncode } from "./common-DNjr697i.js";
const _hoisted_1 = { id: "tray-page" };
const _hoisted_2 = { class: "content" };
const _hoisted_3 = {
  key: 0,
  class: "wait-upload-img"
};
const _hoisted_4 = { class: "list-title" };
const _hoisted_5 = ["src"];
const _hoisted_6 = { class: "uploaded-img" };
const _hoisted_7 = { class: "list-title" };
const _hoisted_8 = ["onClick"];
const _hoisted_9 = { class: "upload-img" };
const _hoisted_10 = ["title"];
const __default__ = {
  name: "TrayPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const files = ref([]);
    const notification = reactive({
      title: T("COPY_LINK_SUCCEED"),
      body: ""
    });
    const clipboardFiles = ref([]);
    const uploadFlag = ref(false);
    function openSettingWindow() {
      sendRPC(IRPCActionType.OPEN_WINDOW, IWindowList.SETTING_WINDOW);
    }
    async function getData() {
      files.value = (await $$db.get({ orderBy: "desc", limit: 5 })).data;
    }
    const formatCustomLink = (customLink, item) => {
      const fileName = item.fileName.replace(new RegExp(`\\${item.extname}$`), "");
      const url = item.url || item.imgUrl;
      const extName = item.extname;
      const formatObj = {
        url,
        fileName,
        extName
      };
      const keys = Object.keys(formatObj);
      keys.forEach((item2) => {
        if (customLink.indexOf(`$${item2}`) !== -1) {
          const reg = new RegExp(`\\$${item2}`, "g");
          customLink = customLink.replace(reg, formatObj[item2]);
        }
      });
      return customLink;
    };
    async function copyTheLink(item) {
      const pasteStyle = await getConfig(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      const customLink = await getConfig(configPaths.settings.customLink);
      const txt = await pasteTemplate(pasteStyle, item, customLink);
      window.electron.clipboard.writeText(txt);
      const myNotification = new Notification(notification.title, notification);
      myNotification.onclick = () => {
        return true;
      };
    }
    async function pasteTemplate(style, item, customLink) {
      let url = item.url || item.imgUrl;
      if (item.type === "aws-s3" || item.type === "aws-s3-plist") {
        url = item.imgUrl || item.url || "";
      }
      if (await getConfig(configPaths.settings.encodeOutputURL) === true) {
        url = handleUrlEncode(url);
      }
      const useShortUrl = await getConfig(configPaths.settings.useShortUrl) || false;
      if (useShortUrl) {
        url = await triggerRPC(IRPCActionType.TRAY_GET_SHORT_URL, url) || url;
      }
      notification.body = url;
      const _customLink = customLink || "![$fileName]($url)";
      const tpl = {
        markdown: `![](${url})`,
        HTML: `<img src="${url}"/>`,
        URL: url,
        UBB: `[IMG]${url}[/IMG]`,
        Custom: formatCustomLink(_customLink, {
          ...item,
          url
        })
      };
      return tpl[style];
    }
    function disableDragFile() {
      window.addEventListener(
        "dragover",
        (e) => {
          e = e || event;
          e.preventDefault();
        },
        false
      );
      window.addEventListener(
        "drop",
        (e) => {
          e = e || event;
          e.preventDefault();
        },
        false
      );
    }
    function uploadClipboardFiles() {
      if (uploadFlag.value) {
        return;
      }
      uploadFlag.value = true;
      sendRPC(IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES);
    }
    onBeforeMount(() => {
      disableDragFile();
      getData();
      window.electron.electronAPI.ipcRenderer.on("dragFiles", async (_, _files) => {
        for (const file of _files) {
          await $$db.insert(file);
        }
        files.value = (await $$db.get({
          orderBy: "desc",
          limit: 5
        })).data;
      });
      window.electron.electronAPI.ipcRenderer.on("clipboardFiles", (_, files2) => {
        clipboardFiles.value = files2;
      });
      window.electron.electronAPI.ipcRenderer.on("uploadFiles", async () => {
        files.value = (await $$db.get({
          orderBy: "desc",
          limit: 5
        })).data;
        uploadFlag.value = false;
      });
      window.electron.electronAPI.ipcRenderer.on("updateFiles", () => {
        getData();
      });
    });
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeAllListeners("dragFiles");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("clipboardFiles");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("uploadFiles");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("updateFiles");
    });
    return (_ctx, _cache) => {
      const _directive_lazy = resolveDirective("lazy");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", {
          class: "open-main-window",
          onClick: openSettingWindow
        }, toDisplayString(unref(T)("OPEN_MAIN_WINDOW")), 1),
        createBaseVNode("div", _hoisted_2, [
          clipboardFiles.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_3, [
            createBaseVNode("div", _hoisted_4, toDisplayString(unref(T)("WAIT_TO_UPLOAD")), 1),
            (openBlock(true), createElementBlock(Fragment, null, renderList(clipboardFiles.value, (item, index) => {
              return openBlock(), createElementBlock("div", {
                key: index,
                class: "img-list"
              }, [
                createBaseVNode("div", {
                  class: normalizeClass(["upload-img__container", { upload: uploadFlag.value }]),
                  onClick: uploadClipboardFiles
                }, [
                  createBaseVNode("img", {
                    src: item.imgUrl,
                    class: "upload-img"
                  }, null, 8, _hoisted_5)
                ], 2)
              ]);
            }), 128))
          ])) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_6, [
            createBaseVNode("div", _hoisted_7, toDisplayString(unref(T)("ALREADY_UPLOAD")), 1),
            (openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (item) => {
              return openBlock(), createElementBlock("div", {
                key: item.imgUrl,
                class: "img-list"
              }, [
                createBaseVNode("div", {
                  class: "upload-img__container",
                  onClick: ($event) => copyTheLink(item)
                }, [
                  withDirectives(createBaseVNode("img", _hoisted_9, null, 512), [
                    [_directive_lazy, item.imgUrl]
                  ]),
                  createBaseVNode("div", {
                    class: "upload-img__title",
                    title: item.fileName
                  }, toDisplayString(item.fileName), 9, _hoisted_10)
                ], 8, _hoisted_8)
              ]);
            }), 128))
          ])
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
