import { d as defineComponent, r as ref, a as reactive, o as onBeforeMount, G as GET_RENAME_FILE_NAME, b as onBeforeUnmount, R as RENAME_FILE_NAME, c as createElementBlock, e as openBlock, q as createVNode, v as withCtx, x as withModifiers, y as resolveComponent, u as unref, T, z as withKeys, A as close_default, f as createBaseVNode, B as createTextVNode, t as toDisplayString, C as sendToMain } from "./index-BqdcQlNn.js";
import { u as useIPCOn } from "./useIPC-O_oSdR6Q.js";
const _hoisted_1 = { id: "rename-page" };
const _hoisted_2 = { class: "pull-right" };
const __default__ = {
  name: "RenamePage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const id = ref(null);
    const formRef = ref();
    const form = reactive({
      fileName: "",
      originName: ""
    });
    const handleFileName = (_, newName, _originName, _id) => {
      form.fileName = newName;
      form.originName = _originName;
      id.value = _id;
    };
    useIPCOn(RENAME_FILE_NAME, handleFileName);
    onBeforeMount(() => {
      window.electron.electronAPI.ipcRenderer.send(GET_RENAME_FILE_NAME);
    });
    function confirmName() {
      formRef.value?.validate((valid) => {
        if (valid) {
          sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName);
        }
      });
    }
    function cancel() {
      sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName);
    }
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeAllListeners(RENAME_FILE_NAME);
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_row = resolveComponent("el-row");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_form, {
          ref_key: "formRef",
          ref: formRef,
          model: form,
          onSubmit: _cache[2] || (_cache[2] = withModifiers(() => {
          }, ["prevent"]))
        }, {
          default: withCtx(() => [
            createVNode(_component_el_form_item, {
              label: unref(T)("FILE_RENAME"),
              prop: "fileName",
              rules: [{ required: true, message: "file name is required", trigger: "blur" }]
            }, {
              default: withCtx(() => [
                createVNode(_component_el_input, {
                  modelValue: form.fileName,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.fileName = $event),
                  size: "small",
                  autofocus: "",
                  onKeyup: withKeys(confirmName, ["enter"])
                }, {
                  suffix: withCtx(() => [
                    createVNode(_component_el_icon, {
                      class: "el-input__icon",
                      style: { "cursor": "pointer" },
                      onClick: _cache[0] || (_cache[0] = ($event) => form.fileName = "")
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(close_default))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["modelValue"])
              ]),
              _: 1
            }, 8, ["label"])
          ]),
          _: 1
        }, 8, ["model"]),
        createVNode(_component_el_row, null, {
          default: withCtx(() => [
            createBaseVNode("div", _hoisted_2, [
              createVNode(_component_el_button, {
                round: "",
                size: "small",
                onClick: cancel
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
                ]),
                _: 1
              }),
              createVNode(_component_el_button, {
                type: "primary",
                round: "",
                size: "small",
                onClick: confirmName
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
                ]),
                _: 1
              })
            ])
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
