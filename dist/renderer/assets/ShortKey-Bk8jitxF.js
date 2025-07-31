import { d as defineComponent, r as ref, o as onBeforeMount, k as getConfig, D as watch, b as onBeforeUnmount, s as sendRPC, j as IRPCActionType, c as createElementBlock, e as openBlock, f as createBaseVNode, q as createVNode, t as toDisplayString, u as unref, T, v as withCtx, y as resolveComponent, p as configPaths, B as createTextVNode, n as normalizeClass, x as withModifiers, m as triggerRPC } from "./index-BqdcQlNn.js";
const isSpecialKey = (key) => {
  const keyArr = ["Shift", "Control", "Alt", "Meta"];
  return keyArr.includes(key);
};
const keyBinding = (event) => {
  const meta = process.platform === "darwin" ? "Cmd" : "Super";
  const specialKey = {
    Ctrl: event.ctrlKey,
    Shift: event.shiftKey,
    Alt: event.altKey,
    [meta]: event.metaKey
  };
  const pressKey = [];
  for (const i in specialKey) {
    if (specialKey[i]) {
      pressKey.push(i);
    }
  }
  if (!isSpecialKey(event.key)) {
    pressKey.push(event.key.toUpperCase());
  }
  return pressKey;
};
const _hoisted_1 = { id: "shortcut-page" };
const _hoisted_2 = { class: "view-title" };
const __default__ = {
  name: "ShortkeyPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const list = ref([]);
    const keyBindingVisible = ref(false);
    const command = ref("");
    const shortKey = ref("");
    const currentIndex = ref(0);
    onBeforeMount(async () => {
      const shortKeyConfig = await getConfig(configPaths.settings.shortKey._path);
      list.value = Object.keys(shortKeyConfig).map((item) => {
        return {
          ...shortKeyConfig[item],
          from: calcOrigin(item)
        };
      });
    });
    watch(keyBindingVisible, (val) => {
      sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, val);
    });
    function calcOrigin(item) {
      const [origin] = item.split(":");
      return origin;
    }
    function calcOriginShowName(item) {
      return item.replace("picgo-plugin-", "");
    }
    function toggleEnable(item) {
      const status = !item.enable;
      item.enable = status;
      sendRPC(IRPCActionType.SHORTKEY_BIND_OR_UNBIND, item, item.from);
    }
    function keyDetect(event) {
      shortKey.value = keyBinding(event).join("+");
    }
    async function openKeyBindingDialog(config, index) {
      command.value = `${config.from}:${config.name}`;
      shortKey.value = await getConfig(`settings.shortKey.${command.value}.key`) || "";
      currentIndex.value = index;
      keyBindingVisible.value = true;
    }
    async function cancelKeyBinding() {
      keyBindingVisible.value = false;
      shortKey.value = await getConfig(`settings.shortKey.${command.value}.key`) || "";
    }
    async function confirmKeyBinding() {
      const oldKey = await getConfig(`settings.shortKey.${command.value}.key`);
      const config = { ...list.value[currentIndex.value] };
      config.key = shortKey.value;
      const result = await triggerRPC(IRPCActionType.SHORTKEY_UPDATE, config, oldKey, config.from);
      if (result) {
        keyBindingVisible.value = false;
        list.value[currentIndex.value].key = shortKey.value;
      }
    }
    onBeforeUnmount(() => {
      sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, false);
    });
    return (_ctx, _cache) => {
      const _component_el_table_column = resolveComponent("el-table-column");
      const _component_el_tag = resolveComponent("el-tag");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_table = resolveComponent("el-table");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_dialog = resolveComponent("el-dialog");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, toDisplayString(unref(T)("SETTINGS_SET_SHORTCUT")), 1),
        createVNode(_component_el_row, null, {
          default: withCtx(() => [
            createVNode(_component_el_col, {
              span: 20,
              offset: 2
            }, {
              default: withCtx(() => [
                createVNode(_component_el_table, {
                  class: "shortcut-page-table-border",
                  data: list.value,
                  size: "small",
                  "header-cell-class-name": "shortcut-page-table-border",
                  "cell-class-name": "shortcut-page-table-border"
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_table_column, {
                      label: unref(T)("SHORTCUT_NAME")
                    }, {
                      default: withCtx((scope) => [
                        createTextVNode(toDisplayString(scope.row.label ? scope.row.label : scope.row.name), 1)
                      ]),
                      _: 1
                    }, 8, ["label"]),
                    createVNode(_component_el_table_column, {
                      width: "160px",
                      label: unref(T)("SHORTCUT_BIND"),
                      prop: "key"
                    }, null, 8, ["label"]),
                    createVNode(_component_el_table_column, {
                      label: unref(T)("SHORTCUT_STATUS")
                    }, {
                      default: withCtx((scope) => [
                        createVNode(_component_el_tag, {
                          size: "small",
                          type: scope.row.enable ? "success" : "danger"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(scope.row.enable ? unref(T)("SHORTCUT_ENABLED") : unref(T)("SHORTCUT_DISABLED")), 1)
                          ]),
                          _: 2
                        }, 1032, ["type"])
                      ]),
                      _: 1
                    }, 8, ["label"]),
                    createVNode(_component_el_table_column, {
                      label: unref(T)("SHORTCUT_SOURCE"),
                      width: "100px"
                    }, {
                      default: withCtx((scope) => [
                        createTextVNode(toDisplayString(calcOriginShowName(scope.row.from)), 1)
                      ]),
                      _: 1
                    }, 8, ["label"]),
                    createVNode(_component_el_table_column, {
                      label: unref(T)("SHORTCUT_HANDLE"),
                      width: "100px"
                    }, {
                      default: withCtx((scope) => [
                        createVNode(_component_el_row, null, {
                          default: withCtx(() => [
                            createVNode(_component_el_button, {
                              size: "small",
                              class: normalizeClass({
                                disabled: scope.row.enable
                              }),
                              type: "info",
                              link: true,
                              onClick: ($event) => toggleEnable(scope.row)
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(scope.row.enable ? unref(T)("SHORTCUT_DISABLE") : unref(T)("SHORTCUT_ENABLE")), 1)
                              ]),
                              _: 2
                            }, 1032, ["class", "onClick"]),
                            createVNode(_component_el_button, {
                              class: "edit",
                              size: "small",
                              type: "info",
                              link: true,
                              onClick: ($event) => openKeyBindingDialog(scope.row, scope.$index)
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(unref(T)("SHORTCUT_EDIT")), 1)
                              ]),
                              _: 2
                            }, 1032, ["onClick"])
                          ]),
                          _: 2
                        }, 1024)
                      ]),
                      _: 1
                    }, 8, ["label"])
                  ]),
                  _: 1
                }, 8, ["data"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        createVNode(_component_el_dialog, {
          modelValue: keyBindingVisible.value,
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => keyBindingVisible.value = $event),
          title: unref(T)("SHORTCUT_CHANGE_UPLOAD"),
          "modal-append-to-body": false,
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              round: "",
              onClick: cancelKeyBinding
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              round: "",
              onClick: confirmKeyBinding
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(_component_el_form, {
              "label-position": "top",
              "label-width": "80px"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, null, {
                  default: withCtx(() => [
                    createVNode(_component_el_input, {
                      modelValue: shortKey.value,
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => shortKey.value = $event),
                      class: "align-center",
                      autofocus: true,
                      onKeydown: _cache[1] || (_cache[1] = withModifiers(($event) => keyDetect($event), ["prevent"]))
                    }, null, 8, ["modelValue"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
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
