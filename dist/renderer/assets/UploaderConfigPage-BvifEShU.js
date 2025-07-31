import { d as defineComponent, r as ref, W as onBeforeRouteUpdate, o as onBeforeMount, al as useRoute, m as triggerRPC, j as IRPCActionType, c as createElementBlock, e as openBlock, f as createBaseVNode, q as createVNode, t as toDisplayString, u as unref, T, v as withCtx, y as resolveComponent, F as Fragment, h as renderList, N as createBlock, g as createCommentVNode, aJ as edit_default, x as withModifiers, n as normalizeClass, a_ as delete_default, bm as plus_default, bn as useStore, B as createTextVNode, s as sendRPC, Q as useRouter, ak as PICBEDS_PAGE, b4 as dayjs, af as saveConfig, p as configPaths, bo as UPLOADER_CONFIG_PAGE } from "./index-BqdcQlNn.js";
const _hoisted_1 = { id: "config-list-view" };
const _hoisted_2 = { class: "view-title" };
const _hoisted_3 = ["onClick"];
const _hoisted_4 = { class: "config-name" };
const _hoisted_5 = { class: "config-update-time" };
const _hoisted_6 = {
  key: 0,
  class: "default-text"
};
const _hoisted_7 = { class: "operation-container" };
const __default__ = {
  name: "UploaderConfigPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const router = useRouter();
    const route = useRoute();
    const type = ref("");
    const curConfigList = ref([]);
    const defaultConfigId = ref("");
    const store = useStore();
    async function selectItem(id) {
      await triggerRPC(IRPCActionType.UPLOADER_SELECT, type.value, id);
      if (store?.state.defaultPicBed === type.value) {
        sendRPC(
          IRPCActionType.TRAY_SET_TOOL_TIP,
          `${type.value} ${curConfigList.value.find((item) => item._id === id)?._configName || ""}`
        );
      }
      defaultConfigId.value = id;
    }
    onBeforeRouteUpdate((to, _, next) => {
      if (to.params.type && to.name === UPLOADER_CONFIG_PAGE) {
        type.value = to.params.type;
        getCurrentConfigList();
      }
      next();
    });
    onBeforeMount(() => {
      type.value = route.params.type;
      getCurrentConfigList();
    });
    async function getCurrentConfigList() {
      const configList = await triggerRPC(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value);
      curConfigList.value = configList?.configList ?? [];
      defaultConfigId.value = configList?.defaultId ?? "";
    }
    function openEditPage(configId) {
      router.push({
        name: PICBEDS_PAGE,
        params: {
          type: type.value,
          configId
        },
        query: {
          defaultConfigId: defaultConfigId.value
        }
      });
    }
    function formatTime(time) {
      return dayjs(time).format("YY-MM-DD HH:mm");
    }
    async function deleteConfig(id) {
      const res = await triggerRPC(IRPCActionType.PICBED_DELETE_CONFIG, type.value, id);
      if (!res) return;
      curConfigList.value = res.configList;
      defaultConfigId.value = res.defaultId;
    }
    function addNewConfig() {
      router.push({
        name: PICBEDS_PAGE,
        params: {
          type: type.value,
          configId: ""
        }
      });
    }
    function setDefaultPicBed(type2) {
      saveConfig({
        [configPaths.picBed.current]: type2,
        [configPaths.picBed.uploader]: type2
      });
      store?.setDefaultPicBed(type2);
      const currentConfigName = curConfigList.value.find((item) => item._id === defaultConfigId.value)?._configName;
      sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${type2} ${currentConfigName || ""}`);
      const successNotification = new Notification(T("SETTINGS_DEFAULT_PICBED"), {
        body: T("TIPS_SET_SUCCEED")
      });
      successNotification.onclick = () => {
        return true;
      };
    }
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_button = resolveComponent("el-button");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, toDisplayString(unref(T)("SETTINGS")), 1),
        createVNode(_component_el_row, {
          gutter: 15,
          justify: "space-between",
          align: "middle",
          type: "flex",
          class: "config-list"
        }, {
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList(curConfigList.value, (item) => {
              return openBlock(), createBlock(_component_el_col, {
                key: item._id,
                class: "config-item-col",
                xs: 24,
                sm: curConfigList.value.length === 1 ? 24 : 12,
                md: curConfigList.value.length === 1 ? 24 : 12,
                lg: curConfigList.value.length === 1 ? 12 : 6,
                xl: curConfigList.value.length === 1 ? 12 : 3
              }, {
                default: withCtx(() => [
                  createBaseVNode("div", {
                    class: normalizeClass(`config-item ${defaultConfigId.value === item._id ? "selected" : ""}`),
                    onClick: () => selectItem(item._id)
                  }, [
                    createBaseVNode("div", _hoisted_4, toDisplayString(item._configName), 1),
                    createBaseVNode("div", _hoisted_5, toDisplayString(formatTime(item._updatedAt)), 1),
                    defaultConfigId.value === item._id ? (openBlock(), createElementBlock("div", _hoisted_6, toDisplayString(unref(T)("SELECTED_SETTING_HINT")), 1)) : createCommentVNode("", true),
                    createBaseVNode("div", _hoisted_7, [
                      createVNode(_component_el_icon, {
                        class: "el-icon-edit",
                        onClick: ($event) => openEditPage(item._id)
                      }, {
                        default: withCtx(() => [
                          createVNode(unref(edit_default))
                        ]),
                        _: 2
                      }, 1032, ["onClick"]),
                      createVNode(_component_el_icon, {
                        class: normalizeClass(["el-icon-delete", curConfigList.value.length <= 1 ? "disabled" : ""]),
                        onClick: withModifiers(() => deleteConfig(item._id), ["stop"])
                      }, {
                        default: withCtx(() => [
                          createVNode(unref(delete_default))
                        ]),
                        _: 2
                      }, 1032, ["class", "onClick"])
                    ])
                  ], 10, _hoisted_3)
                ]),
                _: 2
              }, 1032, ["sm", "md", "lg", "xl"]);
            }), 128)),
            createVNode(_component_el_col, {
              class: "config-item-col",
              xs: 24,
              sm: curConfigList.value.length === 1 ? 24 : 12,
              md: curConfigList.value.length === 1 ? 24 : 12,
              lg: curConfigList.value.length === 1 ? 12 : 6,
              xl: curConfigList.value.length === 1 ? 12 : 3
            }, {
              default: withCtx(() => [
                createBaseVNode("div", {
                  class: "config-item config-item-add",
                  onClick: addNewConfig
                }, [
                  createVNode(_component_el_icon, { class: "el-icon-plus" }, {
                    default: withCtx(() => [
                      createVNode(unref(plus_default))
                    ]),
                    _: 1
                  })
                ])
              ]),
              _: 1
            }, 8, ["sm", "md", "lg", "xl"])
          ]),
          _: 1
        }),
        createVNode(_component_el_row, {
          type: "flex",
          justify: "center",
          span: 24,
          class: "set-default-container"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_button, {
              class: "set-default-btn",
              type: "success",
              round: "",
              disabled: unref(store)?.state.defaultPicBed === type.value,
              onClick: _cache[0] || (_cache[0] = ($event) => setDefaultPicBed(type.value))
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("SETTINGS_SET_DEFAULT_PICBED")), 1)
              ]),
              _: 1
            }, 8, ["disabled"])
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
