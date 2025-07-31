import { d as defineComponent, r as ref, a as reactive, D as watch, c as createElementBlock, e as openBlock, n as normalizeClass, q as createVNode, y as resolveComponent, v as withCtx, b1 as renderSlot, u as unref, T, F as Fragment, h as renderList, N as createBlock, g as createCommentVNode, b2 as cloneDeep, b3 as union, k as getConfig, ae as ElMessageBox, am as computed, o as onBeforeMount, bf as PICGO_HANDLE_PLUGIN_DONE, U as updatePicBedGlobal, bg as PICGO_CONFIG_PLUGIN, bh as PICGO_HANDLE_PLUGIN_ING, bi as PICGO_TOGGLE_PLUGIN, bj as debounce, M as onMounted, s as sendRPC, j as IRPCActionType, af as saveConfig, b as onBeforeUnmount, f as createBaseVNode, w as withDirectives, B as createTextVNode, t as toDisplayString, i as resolveDirective, ac as vShow, p as configPaths, bk as goods_default, aT as refresh_default, aI as download_default, A as close_default, a5 as tools_default, bl as remove_default, H as osGlobal, bd as toRaw } from "./index-BqdcQlNn.js";
import { b as handleStreamlinePluginName } from "./common-DNjr697i.js";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ConfigFormForPlugin",
  props: {
    config: {},
    type: {},
    id: {},
    colorMode: {}
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const $form = ref();
    const configList = ref([]);
    const ruleForm = reactive({});
    watch(
      () => props.config,
      (val) => {
        handleConfigChange(val);
      },
      {
        deep: true,
        immediate: true
      }
    );
    function handleConfigChange(val) {
      handleConfig(val);
    }
    async function validate() {
      return new Promise((resolve) => {
        $form.value?.validate((valid) => {
          if (valid) {
            resolve(ruleForm);
          } else {
            resolve(false);
          }
        });
      });
    }
    function getConfigType() {
      switch (props.type) {
        case "plugin": {
          return props.id;
        }
        case "uploader": {
          return `picBed.${props.id}`;
        }
        case "transformer": {
          return `transformer.${props.id}`;
        }
        default:
          return "unknown";
      }
    }
    async function handleConfig(val) {
      const config = await getCurConfigFormData();
      Object.assign(ruleForm, config);
      if (val.length > 0) {
        configList.value = cloneDeep(val).map((item) => {
          let defaultValue = item.default !== void 0 ? item.default : item.type === "checkbox" ? [] : null;
          if (item.type === "checkbox") {
            const defaults = item.choices?.filter((i) => {
              return i.checked;
            }).map((i) => i.value) || [];
            defaultValue = union(defaultValue, defaults);
          }
          if (config && config[item.name] !== void 0) {
            defaultValue = config[item.name];
          }
          ruleForm[item.name] = defaultValue;
          return item;
        });
      }
    }
    async function getCurConfigFormData() {
      return await getConfig(`${props.id}`) || {};
    }
    function updateRuleForm(key, value) {
      try {
        ruleForm[key] = value;
      } catch (e) {
        console.log(e);
      }
    }
    __expose({
      updateRuleForm,
      validate,
      getConfigType
    });
    return (_ctx, _cache) => {
      const _component_el_input = resolveComponent("el-input");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_form = resolveComponent("el-form");
      return openBlock(), createElementBlock("div", {
        id: "config-form",
        class: normalizeClass(props.colorMode === "white" ? "white" : "")
      }, [
        createVNode(_component_el_form, {
          ref_key: "$form",
          ref: $form,
          "label-position": "left",
          "label-width": "50%",
          model: ruleForm,
          size: "small"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_form_item, {
              label: unref(T)("UPLOADER_CONFIG_NAME"),
              required: "",
              prop: "_configName"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_input, {
                  modelValue: ruleForm._configName,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => ruleForm._configName = $event),
                  type: "input",
                  placeholder: unref(T)("UPLOADER_CONFIG_PLACEHOLDER")
                }, null, 8, ["modelValue", "placeholder"])
              ]),
              _: 1
            }, 8, ["label"]),
            (openBlock(true), createElementBlock(Fragment, null, renderList(configList.value, (item, index) => {
              return openBlock(), createBlock(_component_el_form_item, {
                key: item.name + index,
                label: item.alias || item.name,
                required: item.required,
                prop: item.name
              }, {
                default: withCtx(() => [
                  item.type === "input" || item.type === "password" ? (openBlock(), createBlock(_component_el_input, {
                    key: 0,
                    modelValue: ruleForm[item.name],
                    "onUpdate:modelValue": ($event) => ruleForm[item.name] = $event,
                    type: "input",
                    placeholder: item.message || item.name
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])) : item.type === "list" && item.choices ? (openBlock(), createBlock(_component_el_select, {
                    key: 1,
                    modelValue: ruleForm[item.name],
                    "onUpdate:modelValue": ($event) => ruleForm[item.name] = $event,
                    placeholder: item.message || item.name,
                    persistent: false,
                    teleported: ""
                  }, {
                    default: withCtx(() => [
                      (openBlock(true), createElementBlock(Fragment, null, renderList(item.choices, (choice) => {
                        return openBlock(), createBlock(_component_el_option, {
                          key: choice.name || choice.value || choice,
                          label: choice.name || choice.value || choice,
                          value: choice.value || choice
                        }, null, 8, ["label", "value"]);
                      }), 128))
                    ]),
                    _: 2
                  }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])) : item.type === "checkbox" && item.choices ? (openBlock(), createBlock(_component_el_select, {
                    key: 2,
                    modelValue: ruleForm[item.name],
                    "onUpdate:modelValue": ($event) => ruleForm[item.name] = $event,
                    placeholder: item.message || item.name,
                    multiple: "",
                    "collapse-tags": "",
                    persistent: false,
                    teleported: ""
                  }, {
                    default: withCtx(() => [
                      (openBlock(true), createElementBlock(Fragment, null, renderList(item.choices, (choice) => {
                        return openBlock(), createBlock(_component_el_option, {
                          key: choice.value || choice,
                          label: choice.name || choice.value || choice,
                          value: choice.value || choice
                        }, null, 8, ["label", "value"]);
                      }), 128))
                    ]),
                    _: 2
                  }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])) : item.type === "confirm" ? (openBlock(), createBlock(_component_el_switch, {
                    key: 3,
                    modelValue: ruleForm[item.name],
                    "onUpdate:modelValue": ($event) => ruleForm[item.name] = $event,
                    "active-text": "yes",
                    "inactive-text": "no"
                  }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true)
                ]),
                _: 2
              }, 1032, ["label", "required", "prop"]);
            }), 128)),
            renderSlot(_ctx.$slots, "default")
          ]),
          _: 3
        }, 8, ["model"])
      ], 2);
    };
  }
});
const _hoisted_1 = { id: "plugin-view" };
const _hoisted_2 = { class: "view-title" };
const _hoisted_3 = {
  key: 0,
  class: "cli-only-badge",
  title: "CLI only"
};
const _hoisted_4 = ["src", "onerror"];
const _hoisted_5 = ["onClick"];
const _hoisted_6 = ["title"];
const _hoisted_7 = { class: "plugin-item__info-bar" };
const _hoisted_8 = { class: "plugin-item__author" };
const _hoisted_9 = { class: "plugin-item__config" };
const _hoisted_10 = ["onClick"];
const _hoisted_11 = {
  key: 1,
  class: "config-button ing"
};
const _hoisted_12 = {
  key: 1,
  class: "config-button ing"
};
const _hoisted_13 = {
  key: 0,
  class: "config-button ing"
};
const __default__ = {
  name: "PluginPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const $confirm = ElMessageBox.confirm;
    const searchText = ref("");
    const pluginList = ref([]);
    const config = ref([]);
    const currentType = ref("plugin");
    const configName = ref("");
    const dialogVisible = ref(false);
    const pluginNameList = ref([]);
    const loading = ref(true);
    const needReload = ref(false);
    const latestVersionMap = reactive({});
    const pluginListToolTip = T("PLUGIN_LIST");
    const importLocalPluginToolTip = T("PLUGIN_IMPORT_LOCAL");
    const updateAllToolTip = T("PLUGIN_UPDATE_ALL");
    const defaultLogo = ref('this.src="file://roundLogo.png"');
    const $configForm = ref(null);
    const npmSearchText = computed(() => {
      return searchText.value.match("picgo-plugin-") ? searchText.value : searchText.value !== "" ? `picgo-plugin-${searchText.value}` : searchText.value;
    });
    let getSearchResult;
    watch(npmSearchText, (val) => {
      if (val) {
        loading.value = true;
        pluginList.value = [];
        getSearchResult(val);
      } else {
        getPluginList();
      }
    });
    watch(dialogVisible, (val) => {
      if (val) {
        document.querySelector(".main-content.el-row").style.zIndex = 101;
      } else {
        document.querySelector(".main-content.el-row").style.zIndex = 10;
      }
    });
    async function getLatestVersionOfPlugIn(pluginName) {
      try {
        const res = await window.node.axios.get(`https://registry.npmjs.com/${pluginName}`);
        latestVersionMap[pluginName] = res.data["dist-tags"].latest;
      } catch (err) {
        console.error(err);
      }
    }
    onBeforeMount(async () => {
      window.electron.electronAPI.ipcRenderer.on("hideLoading", () => {
        loading.value = false;
      });
      window.electron.electronAPI.ipcRenderer.on(PICGO_HANDLE_PLUGIN_DONE, (_, fullName) => {
        pluginList.value.forEach((item) => {
          if (item.fullName === fullName || item.name === fullName) {
            item.ing = false;
          }
        });
        loading.value = false;
      });
      window.electron.electronAPI.ipcRenderer.on("pluginList", (_, list) => {
        pluginList.value = list;
        pluginNameList.value = list.map((item) => item.fullName);
        for (const item of pluginList.value) {
          getLatestVersionOfPlugIn(item.fullName);
        }
        loading.value = false;
      });
      window.electron.electronAPI.ipcRenderer.on(
        "installPlugin",
        (_, {
          success,
          body
        }) => {
          loading.value = false;
          pluginList.value.forEach((item) => {
            if (item.fullName === body) {
              item.ing = false;
              item.hasInstall = success;
            }
          });
        }
      );
      window.electron.electronAPI.ipcRenderer.on("updateSuccess", (_, plugin) => {
        loading.value = false;
        pluginList.value.forEach((item) => {
          if (item.fullName === plugin) {
            item.ing = false;
            item.hasInstall = true;
          }
          updatePicBedGlobal();
        });
        handleReload();
        getPluginList();
      });
      window.electron.electronAPI.ipcRenderer.on("uninstallSuccess", (_, plugin) => {
        loading.value = false;
        pluginList.value = pluginList.value.filter((item) => {
          if (item.fullName === plugin) {
            if (item.config.transformer.name) {
              handleRestoreState("transformer", item.config.transformer.name);
            }
            if (item.config.uploader.name) {
              handleRestoreState("uploader", item.config.uploader.name);
            }
            updatePicBedGlobal();
          }
          return item.fullName !== plugin;
        });
        pluginNameList.value = pluginNameList.value.filter((item) => item !== plugin);
      });
      window.electron.electronAPI.ipcRenderer.on(
        PICGO_CONFIG_PLUGIN,
        (_, _currentType, _configName, _config) => {
          currentType.value = _currentType;
          configName.value = _configName;
          config.value = _config;
          dialogVisible.value = true;
        }
      );
      window.electron.electronAPI.ipcRenderer.on(PICGO_HANDLE_PLUGIN_ING, (_, fullName) => {
        pluginList.value.forEach((item) => {
          if (item.fullName === fullName || item.name === fullName) {
            item.ing = true;
          }
        });
        loading.value = true;
      });
      window.electron.electronAPI.ipcRenderer.on(PICGO_TOGGLE_PLUGIN, (_, fullName, enabled) => {
        const plugin = pluginList.value.find((item) => item.fullName === fullName);
        if (plugin) {
          plugin.enabled = enabled;
          updatePicBedGlobal();
          needReload.value = true;
        }
      });
      getPluginList();
      getSearchResult = debounce(_getSearchResult, 50);
      needReload.value = await getConfig(configPaths.needReload) || false;
    });
    async function buildContextMenu(plugin) {
      sendRPC(IRPCActionType.SHOW_PLUGIN_PAGE_MENU, plugin);
    }
    function handleResize() {
      const myDiv = document.getElementById("pluginList");
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight * 0.75;
      myDiv.style.height = newHeight + "px";
    }
    onMounted(() => {
      window.addEventListener("resize", handleResize);
    });
    function getPluginList() {
      sendRPC(IRPCActionType.PLUGIN_GET_LIST);
    }
    function installPlugin(item) {
      if (!item.gui) {
        $confirm(T("TIPS_PLUGIN_NOT_GUI_IMPLEMENT"), T("TIPS_NOTICE"), {
          confirmButtonText: T("CONFIRM"),
          cancelButtonText: T("CANCEL"),
          type: "warning"
        }).then(() => {
          item.ing = true;
          sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName);
        }).catch(() => {
          console.log("Install canceled");
        });
      } else {
        item.ing = true;
        sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName);
      }
    }
    function reloadApp() {
      sendRPC(IRPCActionType.RELOAD_APP);
    }
    async function handleReload() {
      saveConfig({
        needReload: true
      });
      needReload.value = true;
      const successNotification = new Notification(T("PLUGIN_UPDATE_SUCCEED"), {
        body: T("TIPS_NEED_RELOAD")
      });
      successNotification.onclick = () => {
        reloadApp();
      };
    }
    function cleanSearch() {
      searchText.value = "";
    }
    async function handleConfirmConfig() {
      const result = await $configForm.value?.validate() || false;
      if (result !== false) {
        switch (currentType.value) {
          case "plugin":
            saveConfig({
              [`${configName.value}`]: result
            });
            break;
          case "uploader":
            saveConfig({
              [`picBed.${configName.value}`]: result
            });
            break;
          case "transformer":
            saveConfig({
              [`transformer.${configName.value}`]: result
            });
            break;
        }
        const successNotification = new Notification(T("SETTINGS_RESULT"), {
          body: T("TIPS_SET_SUCCEED")
        });
        successNotification.onclick = () => {
          return true;
        };
        dialogVisible.value = false;
        getPluginList();
      }
    }
    function _getSearchResult(val) {
      window.node.axios.get(`https://registry.npmjs.com/-/v1/search?text=${val}`).then((res) => {
        pluginList.value = res.data.objects.filter((item) => {
          return item.package.name.includes("picgo-plugin-");
        }).map((item) => {
          return handleSearchResult(item);
        });
        loading.value = false;
      }).catch((err) => {
        console.log(err);
        loading.value = false;
      });
    }
    function handleSearchResult(item) {
      const pkg = item.package;
      const name = handleStreamlinePluginName(pkg.name);
      let gui = false;
      if (pkg.keywords && pkg.keywords.length > 0) {
        if (pkg.keywords.includes("picgo-gui-plugin")) {
          gui = true;
        }
      }
      return {
        name,
        fullName: pkg.name,
        author: pkg.author?.name || pkg.publisher?.username || "unknown",
        description: pkg.description,
        logo: `https://cdn.jsdelivr.net/npm/${pkg.name}/logo.png`,
        config: {},
        homepage: pkg.links ? pkg.links.homepage : "",
        hasInstall: pluginNameList.value.some((plugin) => plugin === pkg.name),
        version: pkg.version,
        gui,
        ing: false
        // installing or uninstalling
      };
    }
    async function handleRestoreState(item, name) {
      if (item === "uploader") {
        const current = await getConfig(configPaths.picBed.current);
        if (current === name) {
          saveConfig({
            [configPaths.picBed.current]: "smms",
            [configPaths.picBed.uploader]: "smms"
          });
        }
      }
      if (item === "transformer") {
        const current = await getConfig(configPaths.picBed.transformer);
        if (current === name) {
          saveConfig({
            [configPaths.picBed.transformer]: "path"
          });
        }
      }
    }
    function openHomepage(url) {
      if (url) {
        sendRPC(IRPCActionType.OPEN_URL, url);
      }
    }
    function goAwesomeList() {
      sendRPC(IRPCActionType.OPEN_URL, "https://github.com/PicGo/Awesome-PicGo");
    }
    function handleImportLocalPlugin() {
      sendRPC(IRPCActionType.PLUGIN_IMPORT_LOCAL);
      loading.value = true;
    }
    function handleUpdateAllPlugin() {
      sendRPC(IRPCActionType.PLUGIN_UPDATE_ALL, toRaw(pluginNameList.value));
    }
    onBeforeUnmount(() => {
      window.removeEventListener("resize", handleResize);
      window.electron.electronAPI.ipcRenderer.removeAllListeners("pluginList");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("installPlugin");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("uninstallSuccess");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("updateSuccess");
      window.electron.electronAPI.ipcRenderer.removeAllListeners("hideLoading");
      window.electron.electronAPI.ipcRenderer.removeAllListeners(PICGO_HANDLE_PLUGIN_DONE);
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_tag = resolveComponent("el-tag");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_dialog = resolveComponent("el-dialog");
      const _directive_loading = resolveDirective("loading");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createTextVNode(toDisplayString(unref(T)("PLUGIN_SETTINGS")) + " - ", 1),
          createVNode(_component_el_tooltip, {
            content: unref(pluginListToolTip),
            placement: "right",
            persistent: false,
            teleported: ""
          }, {
            default: withCtx(() => [
              createVNode(_component_el_icon, {
                class: "el-icon-goods",
                onClick: goAwesomeList
              }, {
                default: withCtx(() => [
                  createVNode(unref(goods_default))
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["content"]),
          createVNode(_component_el_tooltip, {
            content: unref(updateAllToolTip),
            placement: "left",
            persistent: false,
            teleported: ""
          }, {
            default: withCtx(() => [
              createVNode(_component_el_icon, {
                class: "el-icon-update",
                onClick: handleUpdateAllPlugin
              }, {
                default: withCtx(() => [
                  createVNode(unref(refresh_default))
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["content"]),
          createVNode(_component_el_tooltip, {
            content: unref(importLocalPluginToolTip),
            placement: "left"
          }, {
            default: withCtx(() => [
              createVNode(_component_el_icon, {
                class: "el-icon-download",
                persistent: false,
                teleported: "",
                onClick: handleImportLocalPlugin
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
        createVNode(_component_el_row, {
          class: normalizeClass(["handle-bar", { "cut-width": pluginList.value.length > 6 }])
        }, {
          default: withCtx(() => [
            createVNode(_component_el_input, {
              modelValue: searchText.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchText.value = $event),
              placeholder: unref(T)("PLUGIN_SEARCH_PLACEHOLDER"),
              size: "small"
            }, {
              suffix: withCtx(() => [
                createVNode(_component_el_icon, {
                  class: "el-input__icon",
                  style: { "cursor": "pointer" },
                  onClick: cleanSearch
                }, {
                  default: withCtx(() => [
                    createVNode(unref(close_default))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["modelValue", "placeholder"])
          ]),
          _: 1
        }, 8, ["class"]),
        withDirectives((openBlock(), createBlock(_component_el_row, {
          id: "pluginList",
          gutter: 10,
          class: "plugin-list"
        }, {
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList(pluginList.value, (item) => {
              return openBlock(), createBlock(_component_el_col, {
                key: item.fullName,
                class: "plugin-item__container",
                xs: 24,
                sm: pluginList.value.length === 1 ? 24 : 12,
                md: pluginList.value.length === 1 ? 24 : 12,
                lg: pluginList.value.length === 1 ? 24 : 12,
                xl: pluginList.value.length === 1 ? 24 : 12
              }, {
                default: withCtx(() => [
                  createBaseVNode("div", {
                    class: normalizeClass(["plugin-item", { darwin: unref(osGlobal) === "darwin" }])
                  }, [
                    !item.gui ? (openBlock(), createElementBlock("div", _hoisted_3, " CLI ")) : createCommentVNode("", true),
                    createBaseVNode("img", {
                      class: "plugin-item__logo",
                      src: item.logo,
                      onerror: defaultLogo.value
                    }, null, 8, _hoisted_4),
                    createBaseVNode("div", {
                      class: normalizeClass(["plugin-item__content", { disabled: !item.enabled }])
                    }, [
                      createBaseVNode("div", {
                        class: "plugin-item__name",
                        onClick: ($event) => openHomepage(item.homepage)
                      }, [
                        createTextVNode(toDisplayString(item.name) + " ", 1),
                        createBaseVNode("small", null, toDisplayString(" " + item.version), 1),
                        _cache[4] || (_cache[4] = createTextVNode("   ", -1)),
                        latestVersionMap[item.fullName] && latestVersionMap[item.fullName] !== item.version ? (openBlock(), createBlock(_component_el_tag, {
                          key: 0,
                          type: "success",
                          size: "small",
                          round: "",
                          effect: "plain"
                        }, {
                          default: withCtx(() => _cache[3] || (_cache[3] = [
                            createTextVNode(" new ", -1)
                          ])),
                          _: 1,
                          __: [3]
                        })) : createCommentVNode("", true)
                      ], 8, _hoisted_5),
                      createBaseVNode("div", {
                        class: "plugin-item__desc",
                        title: item.description
                      }, toDisplayString(item.description), 9, _hoisted_6),
                      createBaseVNode("div", _hoisted_7, [
                        createBaseVNode("span", _hoisted_8, toDisplayString(item.author.replace(/<.*>/, "")), 1),
                        createBaseVNode("span", _hoisted_9, [
                          searchText.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                            !item.hasInstall ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                              !item.ing ? (openBlock(), createElementBlock("span", {
                                key: 0,
                                class: "config-button install",
                                onClick: ($event) => installPlugin(item)
                              }, toDisplayString(unref(T)("PLUGIN_INSTALL")), 9, _hoisted_10)) : item.ing ? (openBlock(), createElementBlock("span", _hoisted_11, toDisplayString(unref(T)("PLUGIN_INSTALLING")), 1)) : createCommentVNode("", true)
                            ], 64)) : (openBlock(), createElementBlock("span", _hoisted_12, toDisplayString(unref(T)("PLUGIN_INSTALLED")), 1))
                          ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                            item.ing ? (openBlock(), createElementBlock("span", _hoisted_13, toDisplayString(unref(T)("PLUGIN_DOING_SOMETHING")), 1)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                              item.enabled ? (openBlock(), createBlock(_component_el_icon, {
                                key: 0,
                                class: "el-icon-setting",
                                onClick: ($event) => buildContextMenu(item)
                              }, {
                                default: withCtx(() => [
                                  createVNode(unref(tools_default))
                                ]),
                                _: 2
                              }, 1032, ["onClick"])) : (openBlock(), createBlock(_component_el_icon, {
                                key: 1,
                                class: "el-icon-remove-outline",
                                onClick: ($event) => buildContextMenu(item)
                              }, {
                                default: withCtx(() => [
                                  createVNode(unref(remove_default))
                                ]),
                                _: 2
                              }, 1032, ["onClick"]))
                            ], 64))
                          ], 64))
                        ])
                      ])
                    ], 2)
                  ], 2)
                ]),
                _: 2
              }, 1032, ["sm", "md", "lg", "xl"]);
            }), 128))
          ]),
          _: 1
        })), [
          [_directive_loading, loading.value]
        ]),
        withDirectives(createVNode(_component_el_row, {
          class: normalizeClass(["reload-mask", { "cut-width": pluginList.value.length > 6 }]),
          justify: "center"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_button, {
              type: "primary",
              size: "small",
              round: "",
              onClick: reloadApp
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("TIPS_NEED_RELOAD")), 1)
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["class"]), [
          [vShow, needReload.value]
        ]),
        createVNode(_component_el_dialog, {
          modelValue: dialogVisible.value,
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => dialogVisible.value = $event),
          "modal-append-to-body": false,
          title: unref(T)("CONFIG_THING", {
            c: configName.value
          }),
          width: "70%",
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: _cache[1] || (_cache[1] = ($event) => dialogVisible.value = false)
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: handleConfirmConfig
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(_sfc_main$1, {
              id: configName.value,
              ref_key: "$configForm",
              ref: $configForm,
              config: config.value,
              type: currentType.value,
              "color-mode": "white"
            }, null, 8, ["id", "config", "type"])
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
