import { d as defineComponent, r as ref, a as reactive, D as watch, b0 as toRefs, c as createElementBlock, e as openBlock, n as normalizeClass, q as createVNode, y as resolveComponent, v as withCtx, b1 as renderSlot, u as unref, T, F as Fragment, h as renderList, N as createBlock, g as createCommentVNode, B as createTextVNode, t as toDisplayString, a8 as info_filled_default, f as createBaseVNode, al as useRoute, b2 as cloneDeep, b3 as union, k as getConfig, o as onBeforeMount, m as triggerRPC, j as IRPCActionType, a7 as link_default, aK as ElDropdown, Q as useRouter, b4 as dayjs, p as configPaths, ad as II18nLanguage, s as sendRPC, J as ElMessage } from "./index-BqdcQlNn.js";
import { d } from "./marked.esm-D58Rgktj.js";
import { p as picBedManualUrlList } from "./static-DltyNkMh.js";
const _hoisted_1$1 = ["innerHTML"];
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ConfigForm",
  props: {
    config: {},
    type: {},
    id: {},
    colorMode: {}
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const $route = useRoute();
    const $form = ref();
    const configList = ref([]);
    const ruleForm = reactive({});
    watch(
      toRefs(props.config),
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
    function transformMarkdownToHTML(markdown) {
      try {
        return d.parse(markdown);
      } catch (e) {
        return markdown;
      }
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
      const configId = $route.params.configId;
      Object.assign(ruleForm, config);
      if (val.length > 0) {
        configList.value = cloneDeep(val).map((item) => {
          if (!configId) return item;
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
      const configId = $route.params.configId;
      const curTypeConfigList = await getConfig(`uploader.${props.id}.configList`) || [];
      return curTypeConfigList.find((i) => i._id === configId) || {};
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
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_row = resolveComponent("el-row");
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
                required: item.required,
                prop: item.name
              }, {
                label: withCtx(() => [
                  createVNode(_component_el_row, { align: "middle" }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(item.alias || item.name) + " ", 1),
                      item.tips ? (openBlock(), createBlock(_component_el_tooltip, {
                        key: 0,
                        class: "item",
                        effect: "dark",
                        placement: "right",
                        persistent: false,
                        teleported: ""
                      }, {
                        content: withCtx(() => [
                          createBaseVNode("span", {
                            class: "config-form-common-tips",
                            innerHTML: transformMarkdownToHTML(item.tips)
                          }, null, 8, _hoisted_1$1)
                        ]),
                        default: withCtx(() => [
                          createVNode(_component_el_icon, { class: "ml-[4px] cursor-pointer hover:text-blue" }, {
                            default: withCtx(() => [
                              createVNode(unref(info_filled_default))
                            ]),
                            _: 1
                          })
                        ]),
                        _: 2
                      }, 1024)) : createCommentVNode("", true)
                    ]),
                    _: 2
                  }, 1024)
                ]),
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
                    "active-text": item.confirmText || "yes",
                    "inactive-text": item.cancelText || "no"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "active-text", "inactive-text"])) : createCommentVNode("", true)
                ]),
                _: 2
              }, 1032, ["required", "prop"]);
            }), 128)),
            renderSlot(_ctx.$slots, "default")
          ]),
          _: 3
        }, 8, ["model"])
      ], 2);
    };
  }
});
const _hoisted_1 = { id: "picbeds-page" };
const _hoisted_2 = { class: "view-title" };
const _hoisted_3 = {
  key: 1,
  class: "single"
};
const _hoisted_4 = { class: "notice" };
const __default__ = {
  name: "PicbedsPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const type = ref("");
    const config = ref([]);
    const picBedConfigList = ref([]);
    const picBedName = ref("");
    const $route = useRoute();
    const $router = useRouter();
    const $configForm = ref(null);
    const $dropdown = ref(null);
    type.value = $route.params.type;
    onBeforeMount(async () => {
      await getPicBeds();
      await getPicBedConfigList();
    });
    const handleConfirm = async () => {
      const result = await $configForm.value?.validate() || false;
      if (result !== false) {
        await triggerRPC(IRPCActionType.UPLOADER_UPDATE_CONFIG, type.value, result?._id, result);
        const successNotification = new Notification(T("SETTINGS_RESULT"), {
          body: T("TIPS_SET_SUCCEED")
        });
        successNotification.onclick = () => {
          return true;
        };
        $router.back();
      }
    };
    function handleMouseEnter() {
      $dropdown.value?.handleOpen();
    }
    function handleMouseLeave() {
      $dropdown.value?.handleClose();
    }
    async function getPicBeds() {
      const result = await triggerRPC(IRPCActionType.PICBED_GET_PICBED_CONFIG, $route.params.type);
      config.value = result.config;
      picBedName.value = result.name;
    }
    async function getPicBedConfigList() {
      const res = await triggerRPC(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value) || void 0;
      const configList = res?.configList || [];
      picBedConfigList.value = configList.filter((item) => item._id !== $route.params.configId);
    }
    async function handleConfigImport(configItem) {
      const { _id, _configName, _updatedAt, _createdAt, ...rest } = configItem;
      for (const key in rest) {
        if (Object.prototype.hasOwnProperty.call(rest, key)) {
          const value = rest[key];
          $configForm.value?.updateRuleForm(key, value);
        }
      }
      $configForm.value?.updateRuleForm("_configName", dayjs().format("YYYYMMDDHHmmss"));
    }
    const handleReset = async () => {
      await triggerRPC(IRPCActionType.UPLOADER_RESET_CONFIG, type.value, $route.params.configId);
      const successNotification = new Notification(T("SETTINGS_RESULT"), {
        body: T("TIPS_RESET_SUCCEED")
      });
      successNotification.onclick = () => {
        return true;
      };
      $router.back();
    };
    async function handleNameClick() {
      const lang = await getConfig(configPaths.settings.language) || II18nLanguage.ZH_CN;
      const url = picBedManualUrlList[lang === II18nLanguage.EN ? "en" : "zh_cn"][$route.params.type];
      if (url) {
        sendRPC(IRPCActionType.OPEN_URL, url);
      }
    }
    async function handleCopyApi() {
      try {
        const { port = 36677, host = "127.0.0.1" } = await getConfig(configPaths.settings.server) || {};
        const serverKey = await getConfig(configPaths.settings.serverKey) || "";
        const uploader = await getConfig(configPaths.uploader) || {};
        const picBedConfigList2 = uploader[$route.params.type].configList || [];
        const picBedConfig = picBedConfigList2.find((item) => item._id === $route.params.configId);
        if (!picBedConfig) {
          ElMessage.error("No config found");
          return;
        }
        const apiUrl = `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}/upload?picbed=${$route.params.type}&configName=${picBedConfig._configName}${serverKey ? `&key=${serverKey}` : ""}`;
        window.electron.clipboard.writeText(apiUrl);
        ElMessage.success(`${T("MANAGE_BUCKET_COPY_SUCCESS")} ${apiUrl}`);
      } catch (error) {
        console.log(error);
        ElMessage.error("Copy failed");
      }
    }
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_dropdown_item = resolveComponent("el-dropdown-item");
      const _component_el_button_group = resolveComponent("el-button-group");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_row = resolveComponent("el-row");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_row, {
          gutter: 20,
          class: "setting-list"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_col, {
              span: 22,
              offset: 1
            }, {
              default: withCtx(() => [
                createBaseVNode("div", _hoisted_2, [
                  createBaseVNode("span", {
                    class: "view-title-text",
                    onClick: handleNameClick
                  }, toDisplayString(picBedName.value) + " " + toDisplayString(unref(T)("SETTINGS")), 1),
                  createVNode(_component_el_icon, null, {
                    default: withCtx(() => [
                      createVNode(unref(link_default))
                    ]),
                    _: 1
                  }),
                  createVNode(_component_el_button, {
                    type: "primary",
                    round: "",
                    size: "small",
                    style: { "margin-left": "6px" },
                    onClick: handleCopyApi
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_COPY_UPLOAD_API")), 1)
                    ]),
                    _: 1
                  })
                ]),
                config.value.length > 0 ? (openBlock(), createBlock(_sfc_main$1, {
                  key: 0,
                  id: type.value,
                  ref_key: "$configForm",
                  ref: $configForm,
                  config: config.value,
                  type: "uploader"
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_form_item, null, {
                      default: withCtx(() => [
                        createVNode(_component_el_button_group, null, {
                          default: withCtx(() => [
                            createVNode(_component_el_button, {
                              type: "info",
                              round: "",
                              onClick: handleReset
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(unref(T)("RESET_PICBED_CONFIG")), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_el_button, {
                              type: "success",
                              round: "",
                              onClick: handleConfirm
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_el_button, {
                              round: "",
                              type: "warning",
                              onMouseenter: handleMouseEnter,
                              onMouseleave: handleMouseLeave
                            }, {
                              default: withCtx(() => [
                                createVNode(unref(ElDropdown), {
                                  ref_key: "$dropdown",
                                  ref: $dropdown,
                                  placement: "top",
                                  style: { "color": "#fff", "font-size": "12px", "width": "100%" },
                                  disabled: picBedConfigList.value.length === 0,
                                  teleported: ""
                                }, {
                                  dropdown: withCtx(() => [
                                    (openBlock(true), createElementBlock(Fragment, null, renderList(picBedConfigList.value, (i) => {
                                      return openBlock(), createBlock(_component_el_dropdown_item, {
                                        key: i._id,
                                        onClick: ($event) => handleConfigImport(i)
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(i._configName), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["onClick"]);
                                    }), 128))
                                  ]),
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_IMPORT")) + " ", 1)
                                  ]),
                                  _: 1
                                }, 8, ["disabled"])
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
                }, 8, ["id", "config"])) : (openBlock(), createElementBlock("div", _hoisted_3, [
                  createBaseVNode("div", _hoisted_4, toDisplayString(unref(T)("SETTINGS_NOT_CONFIG_OPTIONS")), 1)
                ]))
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]);
    };
  }
});
export {
  _sfc_main as default
};
