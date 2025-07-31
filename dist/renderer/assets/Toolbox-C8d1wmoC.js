import { d as defineComponent, c as createElementBlock, e as openBlock, q as createVNode, y as resolveComponent, v as withCtx, B as createTextVNode, t as toDisplayString, am as computed, bp as IToolboxItemCheckStatus, N as createBlock, g as createCommentVNode, u as unref, at as success_filled_default, bq as circle_close_filled_default, ax as loading_default, ae as ElMessageBox, r as ref, a as reactive, T, br as IToolboxItemType, s as sendRPC, j as IRPCActionType, f as createBaseVNode, F as Fragment, h as renderList, m as triggerRPC } from "./index-BqdcQlNn.js";
import { a as useIPC } from "./useIPC-O_oSdR6Q.js";
const _hoisted_1$1 = { class: "toolbox-handler" };
const __default__$2 = {
  name: "ToolboxHandler"
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  ...__default__$2,
  props: {
    status: {},
    value: {},
    handlerText: {},
    handler: { type: Function }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _cache) => {
      const _component_ElButton = resolveComponent("ElButton");
      return openBlock(), createElementBlock("div", _hoisted_1$1, [
        createVNode(_component_ElButton, {
          type: "primary",
          link: true,
          onClick: _cache[0] || (_cache[0] = () => props.handler(_ctx.value))
        }, {
          default: withCtx(() => [
            createTextVNode(toDisplayString(props.handlerText), 1)
          ]),
          _: 1
        })
      ]);
    };
  }
});
const __default__$1 = {
  name: "ToolboxStatusIcon"
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  ...__default__$1,
  props: {
    status: {}
  },
  setup(__props) {
    const props = __props;
    const color = computed(() => {
      switch (props.status) {
        case IToolboxItemCheckStatus.SUCCESS:
          return "#67C23A";
        case IToolboxItemCheckStatus.ERROR:
          return "#F56C6C";
        default:
          return "#909399";
      }
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      return openBlock(), createBlock(_component_el_icon, {
        color: color.value,
        class: "toolbox-status-icon"
      }, {
        default: withCtx(() => [
          props.status === unref(IToolboxItemCheckStatus).SUCCESS ? (openBlock(), createBlock(unref(success_filled_default), { key: 0 })) : createCommentVNode("", true),
          props.status === unref(IToolboxItemCheckStatus).ERROR ? (openBlock(), createBlock(unref(circle_close_filled_default), { key: 1 })) : createCommentVNode("", true),
          props.status === unref(IToolboxItemCheckStatus).LOADING ? (openBlock(), createBlock(unref(loading_default), { key: 2 })) : createCommentVNode("", true)
        ]),
        _: 1
      }, 8, ["color"]);
    };
  }
});
const _hoisted_1 = { class: "toolbox" };
const _hoisted_2 = ["src"];
const _hoisted_3 = {
  key: 1,
  class: "toolbox-tips"
};
const _hoisted_4 = {
  key: 1,
  class: "toolbox-cant-fix toolbox-tips"
};
const _hoisted_5 = { class: "toolbox-item-msg" };
const __default__ = {
  name: "ToolBoxPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const $confirm = ElMessageBox.confirm;
    const defaultLogo = ref("file://roundLogo.png");
    const activeTypes = ref([]);
    const fixList = reactive({
      [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: {
        title: T("TOOLBOX_CHECK_CONFIG_FILE_BROKEN"),
        status: IToolboxItemCheckStatus.INIT,
        handlerText: T("SETTINGS_OPEN_CONFIG_FILE"),
        handler(value) {
          sendRPC(IRPCActionType.OPEN_FILE, value);
        }
      },
      [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: {
        title: T("TOOLBOX_CHECK_GALLERY_FILE_BROKEN"),
        status: IToolboxItemCheckStatus.INIT
      },
      [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: {
        title: T("TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD"),
        // picgo-image-clipboard folder
        status: IToolboxItemCheckStatus.INIT,
        handlerText: T("OPEN_FILE_PATH"),
        handler(value) {
          sendRPC(IRPCActionType.OPEN_FILE, value);
        }
      },
      [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: {
        title: T("TOOLBOX_CHECK_PROBLEM_WITH_PROXY"),
        status: IToolboxItemCheckStatus.INIT,
        hasNoFixMethod: true
      }
    });
    const progress = computed(() => {
      const total = Object.keys(fixList).length;
      const done = Object.keys(fixList).filter((key) => {
        const status = fixList[key].status;
        return status !== IToolboxItemCheckStatus.INIT && status !== IToolboxItemCheckStatus.LOADING;
      }).length;
      return done / total * 100;
    });
    const isAllSuccess = computed(() => {
      return Object.keys(fixList).every((key) => {
        const status = fixList[key].status;
        return status === IToolboxItemCheckStatus.SUCCESS;
      });
    });
    const isLoading = computed(() => {
      return Object.keys(fixList).some((key) => {
        const status = fixList[key].status;
        return status === IToolboxItemCheckStatus.LOADING;
      });
    });
    const canFixLength = computed(() => {
      return Object.keys(fixList).filter((key) => {
        const status = fixList[key].status;
        return status === IToolboxItemCheckStatus.ERROR && !fixList[key].hasNoFixMethod;
      }).length;
    });
    const format = (_percentage) => "";
    const ipc = useIPC();
    ipc.on(IRPCActionType.TOOLBOX_CHECK_RES, (_event, { type, msg = "", status, value = "" }) => {
      fixList[type].status = status;
      fixList[type].msg = msg;
      fixList[type].value = value;
      if (status === IToolboxItemCheckStatus.ERROR) {
        activeTypes.value.push(type);
      }
    });
    const handleCheck = () => {
      activeTypes.value = [];
      Object.keys(fixList).forEach((key) => {
        fixList[key].status = IToolboxItemCheckStatus.LOADING;
        fixList[key].msg = "";
        fixList[key].value = "";
      });
      sendRPC(IRPCActionType.TOOLBOX_CHECK);
    };
    const handleFix = async () => {
      const fixRes = await Promise.all(
        Object.keys(fixList).filter((key) => {
          const status = fixList[key].status;
          return status === IToolboxItemCheckStatus.ERROR && !fixList[key].hasNoFixMethod;
        }).map(async (key) => {
          return triggerRPC(IRPCActionType.TOOLBOX_CHECK_FIX, key);
        })
      );
      fixRes.filter((item) => item !== null).forEach((item) => {
        if (item) {
          fixList[item.type].status = item.status;
          fixList[item.type].msg = item.msg;
          fixList[item.type].value = item.value;
        }
      });
      $confirm(T("TOOLBOX_FIX_DONE_NEED_RELOAD"), T("TIPS_NOTICE"), {
        confirmButtonText: T("CONFIRM"),
        cancelButtonText: T("CANCEL"),
        type: "info"
      }).then(() => {
        sendRPC(IRPCActionType.RELOAD_APP);
      }).catch(() => {
      });
    };
    return (_ctx, _cache) => {
      const _component_el_row = resolveComponent("el-row");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_progress = resolveComponent("el-progress");
      const _component_el_collapse_item = resolveComponent("el-collapse-item");
      const _component_el_collapse = resolveComponent("el-collapse");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_row, null, {
          default: withCtx(() => [
            createVNode(_component_el_row, { class: "toolbox-header" }, {
              default: withCtx(() => [
                createVNode(_component_el_row, null, {
                  default: withCtx(() => [
                    createBaseVNode("img", {
                      class: "toolbox-header__logo",
                      src: defaultLogo.value
                    }, null, 8, _hoisted_2),
                    createVNode(_component_el_row, { class: "toolbox-header__text" }, {
                      default: withCtx(() => [
                        createVNode(_component_el_row, { class: "toolbox-header__title" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("TOOLBOX_TITLE")), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_row, { class: "toolbox-header__sub-title" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("TOOLBOX_SUB_TITLE")), 1)
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                createVNode(_component_el_row, null, {
                  default: withCtx(() => [
                    progress.value !== 100 ? (openBlock(), createBlock(_component_el_button, {
                      key: 0,
                      type: "primary",
                      round: "",
                      disabled: isLoading.value,
                      onClick: handleCheck
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("TOOLBOX_START_SCAN")), 1)
                      ]),
                      _: 1
                    }, 8, ["disabled"])) : isAllSuccess.value ? (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(unref(T)("TOOLBOX_SUCCESS_TIPS")), 1)) : !isAllSuccess.value ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
                      canFixLength.value !== 0 ? (openBlock(), createBlock(_component_el_button, {
                        key: 0,
                        type: "primary",
                        round: "",
                        onClick: handleFix
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(T)("TOOLBOX_START_FIX")), 1)
                        ]),
                        _: 1
                      })) : (openBlock(), createElementBlock("div", _hoisted_4, [
                        createTextVNode(toDisplayString(unref(T)("TOOLBOX_CANT_AUTO_FIX")) + " ", 1),
                        createVNode(_component_el_button, {
                          type: "primary",
                          round: "",
                          class: "toolbox-cant-fix__btn",
                          onClick: handleCheck
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(T)("TOOLBOX_RE_SCAN")), 1)
                          ]),
                          _: 1
                        })
                      ]))
                    ], 64)) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        createVNode(_component_el_row, { class: "progress" }, {
          default: withCtx(() => [
            createVNode(_component_el_progress, {
              percentage: progress.value,
              format
            }, null, 8, ["percentage"])
          ]),
          _: 1
        }),
        createVNode(_component_el_collapse, {
          modelValue: activeTypes.value,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeTypes.value = $event),
          accordion: ""
        }, {
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList(fixList, (item, key) => {
              return openBlock(), createBlock(_component_el_collapse_item, {
                key,
                name: key
              }, {
                title: withCtx(() => [
                  createTextVNode(toDisplayString(item.title) + " ", 1),
                  createVNode(_sfc_main$1, {
                    status: item.status
                  }, null, 8, ["status"])
                ]),
                default: withCtx(() => [
                  createBaseVNode("div", _hoisted_5, [
                    createTextVNode(toDisplayString(item.msg || "") + " ", 1),
                    item.handler && item.handlerText && item.value ? (openBlock(), createBlock(_sfc_main$2, {
                      key: 0,
                      value: item.value,
                      status: item.status,
                      handler: item.handler,
                      "handler-text": item.handlerText
                    }, null, 8, ["value", "status", "handler", "handler-text"])) : createCommentVNode("", true)
                  ])
                ]),
                _: 2
              }, 1032, ["name"]);
            }), 128))
          ]),
          _: 1
        }, 8, ["modelValue"])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
