import { d as defineComponent, av as mergeModels, aw as useModel, N as createBlock, e as openBlock, y as resolveComponent, v as withCtx, q as createVNode, f as createBaseVNode, c as createElementBlock, g as createCommentVNode, F as Fragment, h as renderList, E as normalizeStyle, t as toDisplayString, u as unref, a8 as info_filled_default, r as ref, D as watch, T, o as onBeforeMount, B as createTextVNode, ap as folder_default, m as triggerRPC, j as IRPCActionType, J as ElMessage } from "./index-BqdcQlNn.js";
import { f as fileCacheDbInstance } from "./bucketFileDb-qvw68roE.js";
import { f as formatFileSize, c as customRenameFormatTable } from "./common-REXFY3_s.js";
import { g as getConfig, s as saveConfig } from "./dataSender-Bg45AIFL.js";
import "./common-DNjr697i.js";
const _hoisted_1$1 = { style: { "position": "absolute", "left": "0" } };
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DynamicSwitch",
  props: /* @__PURE__ */ mergeModels({
    tooltip: {},
    activeText: {},
    inactiveText: {},
    segments: {}
  }, {
    "modelValue": { type: Boolean },
    "modelModifiers": {}
  }),
  emits: ["update:modelValue"],
  setup(__props) {
    const value = useModel(__props, "modelValue");
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_form_item = resolveComponent("el-form-item");
      return openBlock(), createBlock(_component_el_form_item, null, {
        label: withCtx(() => [
          createBaseVNode("span", _hoisted_1$1, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.segments, (segment, index) => {
              return openBlock(), createElementBlock("span", {
                key: index,
                style: normalizeStyle(segment.style)
              }, toDisplayString(segment.text), 5);
            }), 128)),
            _ctx.tooltip ? (openBlock(), createBlock(_component_el_tooltip, {
              key: 0,
              content: _ctx.tooltip,
              effect: "dark",
              placement: "right",
              persistent: false,
              teleported: ""
            }, {
              default: withCtx(() => [
                createVNode(_component_el_icon, null, {
                  default: withCtx(() => [
                    createVNode(unref(info_filled_default))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"])) : createCommentVNode("", true)
          ])
        ]),
        default: withCtx(() => [
          createVNode(_component_el_switch, {
            modelValue: value.value,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => value.value = $event),
            "active-text": _ctx.activeText,
            "inactive-text": _ctx.inactiveText,
            style: { "--el-switch-on-color": "#13ce66", "--el-switch-off-color": "#ff4949", "position": "absolute", "right": "0" }
          }, null, 8, ["modelValue", "active-text", "inactive-text"])
        ]),
        _: 1
      });
    };
  }
});
const _hoisted_1 = { id: "manage-setting" };
const _hoisted_2 = { style: { "position": "absolute", "left": "0" } };
const _hoisted_3 = { style: { "color": "#ff4949" } };
const _hoisted_4 = { style: { "color": "#ff4949" } };
const _hoisted_5 = { key: 3 };
const _hoisted_6 = { style: { "position": "absolute", "left": "0" } };
const _hoisted_7 = { style: { "position": "absolute", "left": "0" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ManageSetting",
  setup(__props) {
    const form = ref({
      timestampRename: false,
      randomStringRename: false,
      customRename: false,
      isAutoRefresh: false,
      isShowThumbnail: false,
      isShowList: false,
      isUsePreSignedUrl: false,
      isIgnoreCase: false,
      isForceCustomUrlHttps: false,
      isEncodeUrl: false,
      isUploadKeepDirStructure: true,
      isDownloadFileKeepDirStructure: false,
      isDownloadFolderKeepDirStructure: true,
      downloadDir: "",
      pasteFormat: "markdown",
      customPasteFormat: "$url",
      PreSignedExpire: 14400,
      // seconds
      maxDownloadFileCount: 5,
      customRenameFormat: "{filename}"
    });
    const settingsKeys = Object.keys(form.value);
    const dbSize = ref(0);
    const dbSizeAvailableRate = ref("0");
    const pasteFormatList = ["markdown", "markdown-with-link", "rawurl", "html", "bbcode", "custom"];
    settingsKeys.forEach((key) => {
      watch(
        () => form.value[key],
        (newValue) => saveConfig({ [`settings.${key}`]: newValue })
      );
    });
    const switchFieldsList = [
      "isAutoRefresh",
      "isShowThumbnail",
      "isShowList",
      "isUsePreSignedUrl",
      "isForceCustomUrlHttps",
      "isEncodeUrl",
      "isUploadKeepDirStructure",
      "isIgnoreCase",
      "timestampRename",
      "randomStringRename",
      "customRename"
    ];
    const switchFieldsNoTipsList = ["isShowThumbnail", "isShowList", "isUsePreSignedUrl"];
    const switchFieldsHasActiveTextList = ["isShowList"];
    const switchFieldsConfigList = switchFieldsList.map((item) => ({
      configName: item,
      segments: [
        {
          text: T(`MANAGE_SETTING_${item.toUpperCase()}_TITLE`),
          style: "color: black;"
        }
      ],
      tooltip: switchFieldsNoTipsList.includes(item) ? void 0 : T(`MANAGE_SETTING_${item.toUpperCase()}_TIPS`),
      activeText: switchFieldsHasActiveTextList.includes(item) ? T(`MANAGE_SETTING_${item.toUpperCase()}_ON`) : void 0,
      inactiveText: switchFieldsHasActiveTextList.includes(item) ? T(`MANAGE_SETTING_${item.toUpperCase()}_OFF`) : void 0
    }));
    const switchFieldsSpecialList = [
      {
        configName: "isDownloadFileKeepDirStructure",
        segments: [
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_A"),
            style: "color: black;"
          },
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_B"),
            style: "color: orange;"
          },
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_C"),
            style: "color: black;"
          }
        ],
        tooltip: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TIPS")
      },
      {
        configName: "isDownloadFolderKeepDirStructure",
        segments: [
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_A"),
            style: "color: black;"
          },
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFOLDERKEEPDIRSTRUCTURE_TITLE_D"),
            style: "color: coral;"
          },
          {
            text: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_C"),
            style: "color: black;"
          }
        ],
        tooltip: T("MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TIPS")
      }
    ];
    async function initData() {
      const config = await getConfig();
      settingsKeys.forEach((key) => {
        form.value[key] = config.settings[key] ?? form.value[key];
      });
    }
    async function handleDownloadDirClick() {
      const result = await triggerRPC(IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER);
      if (result) {
        form.value.downloadDir = result;
      }
    }
    const handleCellClick = (row, column) => {
      navigator.clipboard.writeText(row[column.property]);
      ElMessage.success(`${T("MANAGE_SETTING_COPY_MESSAGE")}${row[column.property]}`);
    };
    function handleClearDb() {
      fileCacheDbInstance.delete().then(() => {
        getIndexDbSize();
        ElMessage.success(T("MANAGE_SETTING_CLEAR_CACHE_SUCCESS"));
      }).catch(() => {
        ElMessage.error(T("MANAGE_SETTING_CLEAR_CACHE_FAILED"));
      });
    }
    async function getIndexDbSize() {
      const size = (await navigator.storage.estimate()).usage ?? 0;
      const quota = (await navigator.storage.estimate()).quota ?? 0;
      dbSize.value = size;
      dbSizeAvailableRate.value = (100 - size / quota * 100).toFixed(2);
    }
    onBeforeMount(() => {
      initData();
      getIndexDbSize();
    });
    return (_ctx, _cache) => {
      const _component_el_row = resolveComponent("el-row");
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_popconfirm = resolveComponent("el-popconfirm");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_link = resolveComponent("el-link");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_table_column = resolveComponent("el-table-column");
      const _component_el_table = resolveComponent("el-table");
      const _component_el_input_number = resolveComponent("el-input-number");
      const _component_el_radio = resolveComponent("el-radio");
      const _component_el_radio_group = resolveComponent("el-radio-group");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_divider = resolveComponent("el-divider");
      const _component_el_col = resolveComponent("el-col");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_row, {
          class: "view-title",
          align: "middle",
          justify: "center",
          style: { "font-size": "20px", "color": "black" }
        }, {
          default: withCtx(() => [
            createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_TITLE")), 1)
          ]),
          _: 1
        }),
        createVNode(_component_el_row, { class: "setting-list" }, {
          default: withCtx(() => [
            createVNode(_component_el_col, {
              span: 20,
              offset: 2
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { style: { "width": "100%" } }, {
                  default: withCtx(() => [
                    createVNode(_component_el_form, {
                      "label-position": "left",
                      "label-width": "50%",
                      size: "default",
                      style: { "position": "relative", "width": "100%" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_form_item, null, {
                          label: withCtx(() => [
                            createBaseVNode("span", _hoisted_2, [
                              createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_SETTING_CLEAR_CACHE_TITLE")), 1),
                              createBaseVNode("span", _hoisted_3, toDisplayString(unref(formatFileSize)(dbSize.value) === "" ? 0 : unref(formatFileSize)(dbSize.value)), 1),
                              createBaseVNode("span", null, "  " + toDisplayString(unref(T)("MANAGE_SETTING_CLEAR_CACHE_FREE_TITLE")), 1),
                              createBaseVNode("span", _hoisted_4, toDisplayString(dbSizeAvailableRate.value) + " %", 1),
                              createVNode(_component_el_tooltip, {
                                effect: "dark",
                                content: unref(T)("MANAGE_SETTING_CLEAR_CACHE_TIPS"),
                                placement: "right",
                                persistent: false,
                                teleported: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_el_icon, null, {
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
                          default: withCtx(() => [
                            createVNode(_component_el_popconfirm, {
                              title: unref(T)("MANAGE_SETTING_CLEAR_CACHE_PROMPT"),
                              "confirm-button-text": unref(T)("CONFIRM"),
                              "cancel-button-text": unref(T)("CANCEL"),
                              "hide-icon": "",
                              persistent: false,
                              teleported: "",
                              onConfirm: handleClearDb
                            }, {
                              reference: withCtx(() => [
                                createVNode(_component_el_button, {
                                  type: "primary",
                                  plain: "",
                                  style: { "position": "absolute", "right": "0" }
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_CLEAR_CACHE_BUTTON")), 1)
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["title", "confirm-button-text", "cancel-button-text"])
                          ]),
                          _: 1
                        }),
                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(switchFieldsConfigList), (item) => {
                          return openBlock(), createBlock(_sfc_main$1, {
                            key: item.configName,
                            modelValue: form.value[item.configName],
                            "onUpdate:modelValue": ($event) => form.value[item.configName] = $event,
                            segments: item.segments,
                            tooltip: item.tooltip,
                            "config-name": item.configName,
                            "active-text": item.activeText,
                            "inactive-text": item.inactiveText
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "segments", "tooltip", "config-name", "active-text", "inactive-text"]);
                        }), 128)),
                        form.value.customRename ? (openBlock(), createBlock(_component_el_link, {
                          key: 0,
                          style: { "margin-top": "10px", "margin-bottom": "10px", "color": "#409eff" },
                          underline: false
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_CUSTOM_PATTERN_TITLE")), 1)
                          ]),
                          _: 1
                        })) : createCommentVNode("", true),
                        form.value.customRename ? (openBlock(), createBlock(_component_el_input, {
                          key: 1,
                          modelValue: form.value.customRenameFormat,
                          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.customRenameFormat = $event),
                          placeholder: unref(T)("MANAGE_SETTING_CUSTOM_PATTERN_TIPS"),
                          style: { "width": "100%" }
                        }, null, 8, ["modelValue", "placeholder"])) : createCommentVNode("", true),
                        form.value.customRename ? (openBlock(), createBlock(_component_el_table, {
                          key: 2,
                          data: unref(customRenameFormatTable),
                          style: { "width": "100%", "margin-top": "10px", "margin-left": "10%" },
                          "header-cell-style": { "text-align": "center" },
                          "cell-style": { "text-align": "center" },
                          onCellClick: handleCellClick
                        }, {
                          default: withCtx(() => [
                            (openBlock(), createElementBlock(Fragment, null, renderList(["placeholder", "description", "placeholderB", "descriptionB"], (prop) => {
                              return createVNode(_component_el_table_column, {
                                key: prop,
                                prop,
                                label: unref(T)("MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TITLE"),
                                width: "150"
                              }, null, 8, ["prop", "label"]);
                            }), 64))
                          ]),
                          _: 1
                        }, 8, ["data"])) : createCommentVNode("", true),
                        form.value.customRename ? (openBlock(), createElementBlock("br", _hoisted_5)) : createCommentVNode("", true),
                        (openBlock(), createElementBlock(Fragment, null, renderList(switchFieldsSpecialList, (item) => {
                          return createVNode(_sfc_main$1, {
                            key: item.configName,
                            modelValue: form.value[item.configName],
                            "onUpdate:modelValue": ($event) => form.value[item.configName] = $event,
                            segments: item.segments,
                            tooltip: item.tooltip,
                            "config-name": item.configName
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "segments", "tooltip", "config-name"]);
                        }), 64)),
                        createVNode(_component_el_form_item, null, {
                          label: withCtx(() => [
                            createBaseVNode("span", _hoisted_6, [
                              createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TITLE")) + " ", 1),
                              createVNode(_component_el_tooltip, {
                                effect: "dark",
                                content: unref(T)("MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TIPS"),
                                placement: "right",
                                persistent: false,
                                teleported: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_el_icon, null, {
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
                          default: withCtx(() => [
                            createVNode(_component_el_input_number, {
                              modelValue: form.value.maxDownloadFileCount,
                              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.maxDownloadFileCount = $event),
                              style: { "position": "absolute", "right": "0" },
                              placeholder: unref(T)("MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_INPUT_TIPS"),
                              min: 1,
                              max: 9999,
                              step: 1
                            }, null, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_form_item, null, {
                          label: withCtx(() => [
                            createBaseVNode("span", _hoisted_7, [
                              createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TITLE")) + " ", 1),
                              createVNode(_component_el_tooltip, {
                                effect: "dark",
                                content: unref(T)("MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TIPS"),
                                placement: "right",
                                persistent: false,
                                teleported: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_el_icon, null, {
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
                          default: withCtx(() => [
                            createVNode(_component_el_input_number, {
                              modelValue: form.value.PreSignedExpire,
                              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.PreSignedExpire = $event),
                              style: { "position": "absolute", "right": "0" },
                              placeholder: unref(T)("MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TIPS"),
                              min: 1,
                              step: 1
                            }, null, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_link, {
                          style: { "margin-top": "10px", "margin-bottom": "10px", "color": "#409eff" },
                          underline: false
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_CHOOSE_COPY_FORMAT_TITLE")), 1)
                          ]),
                          _: 1
                        }),
                        _cache[6] || (_cache[6] = createBaseVNode("br", null, null, -1)),
                        createVNode(_component_el_radio_group, {
                          modelValue: form.value.pasteFormat,
                          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.pasteFormat = $event)
                        }, {
                          default: withCtx(() => [
                            (openBlock(), createElementBlock(Fragment, null, renderList(pasteFormatList, (item) => {
                              return createVNode(_component_el_radio, {
                                key: item,
                                value: item
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(unref(T)(`MANAGE_SETTING_CHOOSE_COPY_FORMAT_${item.toUpperCase().replace(/-/g, "_")}`)), 1)
                                ]),
                                _: 2
                              }, 1032, ["value"]);
                            }), 64))
                          ]),
                          _: 1
                        }, 8, ["modelValue"]),
                        form.value.pasteFormat === "custom" ? (openBlock(), createBlock(_component_el_link, {
                          key: 4,
                          style: { "margin-top": "10px", "margin-bottom": "10px", "color": "#409eff" },
                          underline: false
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_CUSTOM_COPY_FORMAT_TITLE")), 1)
                          ]),
                          _: 1
                        })) : createCommentVNode("", true),
                        form.value.pasteFormat === "custom" ? (openBlock(), createBlock(_component_el_input, {
                          key: 5,
                          modelValue: form.value.customPasteFormat,
                          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.customPasteFormat = $event),
                          placeholder: unref(T)("MANAGE_SETTING_CUSTOM_COPY_FORMAT_TIPS"),
                          style: { "width": "100%" }
                        }, null, 8, ["modelValue", "placeholder"])) : createCommentVNode("", true),
                        createBaseVNode("div", null, [
                          createVNode(_component_el_link, {
                            style: { "margin-top": "10px", "margin-bottom": "10px", "color": "#409eff" },
                            underline: false
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(T)("MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TITLE")), 1)
                            ]),
                            _: 1
                          })
                        ]),
                        createVNode(_component_el_input, {
                          modelValue: form.value.downloadDir,
                          "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.downloadDir = $event),
                          disabled: "",
                          placeholder: unref(T)("MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TIPS"),
                          style: { "width": "100%", "margin-top": "10px" }
                        }, {
                          append: withCtx(() => [
                            createVNode(_component_el_button, {
                              type: "primary",
                              onClick: handleDownloadDirClick
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_icon, null, {
                                  default: withCtx(() => [
                                    createVNode(unref(folder_default))
                                  ]),
                                  _: 1
                                }),
                                createTextVNode(" " + toDisplayString(unref(T)("MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_BUTTON")), 1)
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }, 8, ["modelValue", "placeholder"])
                      ]),
                      _: 1,
                      __: [6]
                    }),
                    createVNode(_component_el_divider, { "border-style": "none" })
                  ]),
                  _: 1
                })
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
