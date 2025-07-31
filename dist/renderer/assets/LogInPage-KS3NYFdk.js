import { d as defineComponent, r as ref, a as reactive, am as computed, M as onMounted, c as createElementBlock, e as openBlock, q as createVNode, v as withCtx, y as resolveComponent, k as getConfig$1, u as unref, T, F as Fragment, h as renderList, N as createBlock, f as createBaseVNode, B as createTextVNode, t as toDisplayString, aZ as pointer_default, a_ as delete_default, g as createCommentVNode, a8 as info_filled_default, aJ as edit_default, J as ElMessage, au as ElNotification, ae as ElMessageBox, Q as useRouter } from "./index-BqdcQlNn.js";
import { u as useManageStore } from "./manageStore-EteLCVxq.js";
import { h as formObjToTableData } from "./common-REXFY3_s.js";
import { s as supportedPicBedList } from "./constants-BZfYqEeL.js";
import { g as getConfig, s as saveConfig, r as removeConfig } from "./dataSender-Bg45AIFL.js";
import { f as formatEndpoint, a as isNeedToShorten, s as safeSliceF } from "./common-DNjr697i.js";
const _hoisted_1 = { class: "layout" };
const _hoisted_2 = ["src"];
const _hoisted_3 = ["onClick"];
const _hoisted_4 = { style: { "margin": "0 auto", "position": "relative", "left": "10%", "right": "50%" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "LogInPage",
  setup(__props) {
    const manageStore = useManageStore();
    const router = useRouter();
    const activeName = ref("login");
    const configResult = reactive({});
    const existingConfiguration = reactive({});
    const dataForTable = reactive([]);
    const allConfigAliasMap = reactive({});
    const currentAliasList = reactive([]);
    const rules = ruleMap(supportedPicBedList);
    const sortedAllConfigAliasMap = computed(() => {
      return Object.values(allConfigAliasMap).sort((a, b) => {
        return a.picBedName.localeCompare(b.picBedName);
      });
    });
    const importedNewConfig = {};
    function ruleMap(options) {
      const rule = {};
      Object.keys(options).forEach((key) => {
        const item = options[key].options;
        item.forEach((option) => {
          const configOptions = options[key].configOptions[option];
          const keyName = `${key}.${option}`;
          if (configOptions.rule) {
            rule[keyName] = configOptions.rule;
          }
          if (configOptions.default) {
            configResult[keyName] = configOptions.default;
          }
        });
      });
      return rule;
    }
    function getDataForTable() {
      for (const key in existingConfiguration) {
        dataForTable.push({ ...existingConfiguration[key] });
      }
    }
    async function getExistingConfig(name) {
      if (name === "login") {
        getAllConfigAliasArray();
        return;
      }
      currentAliasList.length = 0;
      const result = await getConfig("picBed");
      for (const key in existingConfiguration) {
        delete existingConfiguration[key];
      }
      if (!result || typeof result !== "object" || Object.keys(result).length === 0) {
        existingConfiguration[name] = { fail: "暂无配置" };
      } else {
        for (const key in result) {
          if (result[key].picBedName === name) {
            existingConfiguration[key] = result[key];
            currentAliasList.push(key);
          }
        }
      }
      dataForTable.length = 0;
      getDataForTable();
      handleConfigImport(currentAliasList[0]);
    }
    function getAliasList() {
      return Object.values(existingConfiguration).map((item) => item.alias);
    }
    async function handleConfigChange(name) {
      const aliasList = getAliasList();
      const allKeys = Object.keys(supportedPicBedList[name].configOptions);
      const resultMap = {};
      const reg = /^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u;
      for (const key of allKeys) {
        const resultKey = name + "." + key;
        if (supportedPicBedList[name].configOptions[key].required) {
          if (supportedPicBedList[name].configOptions[key].type !== "boolean" && !configResult[resultKey]) {
            ElMessage.error(
              `${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_MESSAGE_A")} ${supportedPicBedList[name].configOptions[key].description}`
            );
            return;
          }
        }
        if (key === "alias" && configResult[resultKey] !== void 0 && !reg.test(configResult[resultKey])) {
          ElMessage.error(T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_ALIAS_MESSAGE"));
          return;
        }
        if (key === "itemsPerPage" && configResult[resultKey] !== void 0 && (configResult[resultKey] < 20 || configResult[resultKey] > 1e3)) {
          ElMessage.error(T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_ITEMS_PER_PAGE_MESSAGE"));
          return;
        }
        if (key === "customUrl" && configResult[resultKey] !== void 0 && configResult[resultKey] !== "") {
          if (name !== "upyun") {
            if (!/^https?:\/\//.test(configResult[resultKey])) {
              ElMessage.error(T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_CUSTOM_URL_MESSAGE"));
              return;
            }
          }
        }
        if (supportedPicBedList[name].configOptions[key].default !== void 0 && configResult[resultKey] === "") {
          resultMap[key] = supportedPicBedList[name].configOptions[key].default;
        } else if (configResult[resultKey] === void 0) {
          if (supportedPicBedList[name].configOptions[key].default !== void 0) {
            resultMap[key] = supportedPicBedList[name].configOptions[key].default;
          } else {
            resultMap[key] = "";
          }
        } else {
          resultMap[key] = configResult[resultKey];
        }
      }
      resultMap.picBedName = name;
      if (resultMap.bucketName !== void 0) {
        resultMap.transformedConfig = {};
        const bucketName = resultMap.bucketName.split(",");
        const baseDir = resultMap.baseDir?.split(",");
        const area = resultMap.area?.split(",");
        const customUrl = resultMap.customUrl?.split(",");
        const operator = resultMap.operator?.split(",");
        const password = resultMap.password?.split(",");
        for (let i = 0; i < bucketName.length; i++) {
          if (bucketName[i]) {
            resultMap.transformedConfig = {
              ...resultMap.transformedConfig,
              [bucketName[i]]: {
                baseDir: baseDir && baseDir[i] ? baseDir[i] : "/",
                area: area && area[i] ? area[i] : "",
                customUrl: customUrl && customUrl[i] ? /^https?:\/\//.test(customUrl[i]) ? customUrl[i] : "http://" + customUrl[i] : "",
                operator: operator && operator[i] ? operator[i] : "",
                password: password && password[i] ? password[i] : ""
              }
            };
          }
        }
      }
      if (resultMap.transformedConfig) {
        resultMap.transformedConfig = JSON.stringify(resultMap.transformedConfig);
      }
      saveConfig(`picBed.${resultMap.alias}`, resultMap);
      await manageStore.refreshConfig();
      await getExistingConfig(activeName.value);
      dataForTable.length = 0;
      getDataForTable();
      if (aliasList.includes(resultMap.alias)) {
        ElNotification({
          title: T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_NAME"),
          message: `${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_MESSAGE")}${resultMap.alias}`,
          type: "warning",
          duration: 500,
          customClass: "notification",
          offset: 100
        });
      } else {
        ElNotification({
          title: T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_NAME"),
          message: `${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_MESSAGE_B")}${resultMap.alias}`,
          type: "success",
          duration: 2e3,
          customClass: "notification",
          offset: 100
        });
      }
    }
    const handleConfigReset = (name) => {
      const keys = Object.keys(configResult).filter((key) => key.startsWith(name));
      keys.forEach((key) => {
        const optionKey = key.split(".")[1];
        const configOption = supportedPicBedList[name]?.configOptions?.[optionKey];
        if (configOption) {
          configResult[key] = configOption.default || "";
        }
      });
    };
    const handleConfigRemove = (name) => {
      ElMessageBox.confirm(
        T("MANAGE_LOGIN_PAGE_PANE_DELETE_CONFIG_TITLE"),
        T("MANAGE_LOGIN_PAGE_PANE_DELETE_CONFIG_TIP"),
        {
          confirmButtonText: T("MANAGE_LOGIN_PAGE_PANE_DELETE_CONFIG_CONFIRM"),
          cancelButtonText: T("MANAGE_LOGIN_PAGE_PANE_DELETE_CONFIG_CANCEL"),
          type: "warning"
        }
      ).then(async () => {
        const commonNoticeConfig = {
          title: T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_NAME"),
          duration: 2e3,
          customClass: "notification",
          offset: 100
        };
        try {
          removeConfig("picBed", name);
          ElNotification({
            ...commonNoticeConfig,
            message: `${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_MESSAGE_C")}${name}`,
            type: "success",
            position: "bottom-right"
          });
          manageStore.refreshConfig();
          getAllConfigAliasArray();
        } catch (error) {
          ElNotification({
            ...commonNoticeConfig,
            message: `${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_MESSAGE_D")}${name}${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_NOTICE_MESSAGE_E")}`,
            type: "error",
            position: "bottom-right"
          });
        }
      });
    };
    const getAllConfigAliasArray = async () => {
      const result = await getConfig("picBed");
      for (const key in allConfigAliasMap) {
        delete allConfigAliasMap[key];
      }
      if (!result) return;
      Object.entries(result).forEach(([, value], index) => {
        allConfigAliasMap[index] = {
          alias: value.alias,
          picBedName: value.picBedName,
          config: value
        };
      });
    };
    const handleCellClick = (row, column) => {
      navigator.clipboard.writeText(row[column.property]);
      ElMessage.success(`${T("MANAGE_LOGIN_PAGE_PANE_CONFIG_CHANGE_COPY_SUCCESS")}${row[column.property]}`);
    };
    const handleReferenceClick = (url) => window.electron.shell.openExternal(url);
    const handleConfigClick = async (item) => {
      const alias = item.alias;
      const config = JSON.stringify(item.config);
      const picBedName = item.picBedName;
      const result = await getConfig("picBed");
      router.push({
        path: "/main-page/manage-main-page",
        query: {
          alias,
          picBedName,
          config,
          allPicBedConfigure: JSON.stringify(result)
        }
      });
    };
    function handleConfigImport(alias) {
      const selectedConfig = existingConfiguration[alias];
      if (!selectedConfig) return;
      supportedPicBedList[selectedConfig.picBedName].options.forEach((option) => {
        if (selectedConfig[option] !== void 0) {
          configResult[selectedConfig.picBedName + "." + option] = selectedConfig[option];
        }
      });
    }
    async function getCurrentConfigList() {
      await manageStore.refreshConfig();
      const configList = await getConfig$1("uploader") ?? {};
      const pbList = [
        "aliyun",
        "aws-s3",
        "aws-s3-plist",
        "github",
        "imgur",
        "local",
        "qiniu",
        "sftpplist",
        "smms",
        "tcyun",
        "upyun",
        "webdavplist"
      ];
      const filteredConfigList = pbList.flatMap((pb) => {
        const config = configList[pb];
        return config?.configList?.length ? config.configList.map((item) => ({ ...item, type: pb })) : [];
      });
      const autoImport = await getConfig$1("settings.autoImport") || false;
      if (autoImport) {
        const autoImportPicBed = initArray(
          await getConfig$1("settings.autoImportPicBed") || "",
          []
        );
        await Promise.all(filteredConfigList.flatMap((config) => transUpToManage(config, config.type, autoImportPicBed)));
        if (Object.keys(importedNewConfig).length > 0) {
          const oldConfig = await getConfig("picBed");
          const newConfig = { ...oldConfig, ...importedNewConfig };
          saveConfig("picBed", newConfig);
          await manageStore.refreshConfig();
        }
      }
      await getAllConfigAliasArray();
    }
    function isImported(alias) {
      return Object.values(allConfigAliasMap).some((item) => item.alias === alias);
    }
    function initArray(arrayT, defaultValue) {
      if (!Array.isArray(arrayT)) {
        arrayT = arrayT ? [arrayT] : defaultValue;
      }
      return arrayT;
    }
    async function transUpToManage(config, picBedName, autoImportPicBed) {
      const alias = `${picBedName === "webdavplist" ? "webdav" : picBedName === "sftpplist" ? "sftp" : picBedName === "aws-s3" || picBedName === "aws-s3-plist" ? "s3plist" : picBedName}-${config._configName ?? "Default"}-imp`;
      if (!autoImportPicBed.includes(picBedName) || isImported(alias)) return;
      const commonConfig = {
        alias,
        picBedName,
        paging: true
      };
      const resultMap = {};
      switch (picBedName) {
        case "smms":
          if (!config.token) return;
          Object.assign(resultMap, {
            ...commonConfig,
            token: config.token
          });
          break;
        case "aliyun":
          if (!config.accessKeyId || !config.accessKeySecret) return;
          Object.assign(resultMap, {
            ...commonConfig,
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucketName: "",
            baseDir: "/",
            itemsPerPage: 50,
            isAutoCustomUrl: !config.customUrl,
            transformedConfig: JSON.stringify(
              config.customUrl ? {
                [config.bucket]: {
                  customUrl: config.customUrl
                }
              } : {}
            )
          });
          break;
        case "qiniu":
          if (!config.accessKey || !config.secretKey) return;
          Object.assign(resultMap, {
            ...commonConfig,
            accessKey: config.accessKey,
            secretKey: config.secretKey,
            bucketName: "",
            baseDir: "/",
            isAutoCustomUrl: false,
            transformedConfig: JSON.stringify({ [config.bucket]: config.url }),
            itemsPerPage: 50
          });
          break;
        case "tcyun":
          if (!config.secretId || !config.secretKey || config.version === "v4") return;
          Object.assign(resultMap, {
            ...commonConfig,
            secretId: config.secretId,
            secretKey: config.secretKey,
            bucketName: "",
            baseDir: "/",
            appId: config.appId,
            isAutoCustomUrl: !config.customUrl,
            transformedConfig: JSON.stringify(
              config.customUrl ? {
                [config.bucket]: {
                  customUrl: config.customUrl
                }
              } : {}
            ),
            itemsPerPage: 50
          });
          break;
        case "github":
          if (!config.token) return;
          Object.assign(resultMap, {
            ...commonConfig,
            token: config.token,
            githubUsername: config.repo.split("/")[0],
            customUrl: "",
            proxy: "",
            itemsPerPage: 50
          });
          break;
        case "upyun":
          if (!config.operator || !config.password) return;
          Object.assign(resultMap, {
            ...commonConfig,
            operator: config.operator,
            password: config.password,
            bucketName: config.bucket,
            antiLeechToken: config.antiLeechToken,
            expireTime: config.expireTime,
            baseDir: "/",
            customUrl: config.url,
            transformedConfig: JSON.stringify({
              [config.bucket]: {
                customUrl: config.url,
                baseDir: "/",
                area: "",
                operator: config.operator,
                password: config.password
              }
            }),
            itemsPerPage: 50
          });
          break;
        case "webdavplist":
          if (!config.host) return;
          Object.assign(resultMap, {
            ...commonConfig,
            endpoint: formatEndpoint(config.host, config.sslEnabled),
            username: config.username,
            password: config.password,
            bucketName: "webdav",
            baseDir: config.path || "/",
            webPath: config.webpath || "",
            customUrl: config.customUrl || "",
            sslEnabled: !!config.sslEnabled,
            authType: config.authType || "basic",
            proxy: "",
            transformedConfig: JSON.stringify({
              webdav: {
                operator: "",
                password: config.password,
                baseDir: config.path || "/",
                customUrl: config.customUrl || "",
                area: ""
              }
            })
          });
          delete resultMap.paging;
          break;
        case "local":
          if (!config.path) return;
          Object.assign(resultMap, {
            ...commonConfig,
            baseDir: config.path,
            webPath: config.webpath || "",
            customUrl: config.customUrl || "",
            transformedConfig: JSON.stringify({
              local: {
                customUrl: config.customUrl || "",
                baseDir: config.path,
                webPath: config.webpath || ""
              }
            })
          });
          delete resultMap.paging;
          break;
        case "sftpplist":
          if (!config.host) return;
          Object.assign(resultMap, {
            ...commonConfig,
            picBedName: "sftp",
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password,
            privateKey: config.privateKey,
            passphrase: config.passphrase,
            baseDir: config.uploadPath || "/",
            webPath: config.webPath || "",
            customUrl: config.customUrl || "",
            fileMode: config.fileMode || "0664",
            dirMode: config.dirMode || "0775",
            transformedConfig: JSON.stringify({
              sftp: {
                host: config.host,
                port: config.port || 22,
                username: config.username,
                password: config.password,
                privateKey: config.privateKey,
                passphrase: config.passphrase,
                baseDir: config.uploadPath || "/",
                webPath: config.webPath || "",
                customUrl: config.customUrl || "",
                fileMode: config.fileMode || "0664",
                dirMode: config.dirMode || "0775"
              }
            })
          });
          delete resultMap.paging;
          break;
        case "aws-s3":
        case "aws-s3-plist":
          if (!config.accessKeyID || !config.secretAccessKey) return;
          Object.assign(resultMap, {
            ...commonConfig,
            picBedName: "s3plist",
            accessKeyId: config.accessKeyID,
            secretAccessKey: config.secretAccessKey,
            endpoint: config.endpoint || "",
            bucketName: "",
            baseDir: "/",
            itemsPerPage: 50,
            proxy: "",
            sslEnabled: config.endpoint ? config.endpoint.startsWith("https") : false,
            aclForUpload: "public-read",
            s3ForcePathStyle: config.pathStyleAccess,
            dogeCloudSupport: false,
            transformedConfig: JSON.stringify(
              config.urlPrefix ? {
                [config.bucketName]: {
                  customUrl: config.urlPrefix
                }
              } : {}
            )
          });
          break;
        case "imgur":
          if (!config.username || !config.accessToken) return;
          Object.assign(resultMap, {
            ...commonConfig,
            username: config.username,
            accessToken: config.accessToken,
            proxy: ""
          });
          delete resultMap.paging;
          break;
        default:
          return;
      }
      importedNewConfig[alias] = resultMap;
    }
    onMounted(() => {
      getCurrentConfigList();
    });
    return (_ctx, _cache) => {
      const _component_el_table_column = resolveComponent("el-table-column");
      const _component_el_table = resolveComponent("el-table");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_popover = resolveComponent("el-popover");
      const _component_el_button_group = resolveComponent("el-button-group");
      const _component_el_card = resolveComponent("el-card");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_tab_pane = resolveComponent("el-tab-pane");
      const _component_el_alert = resolveComponent("el-alert");
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_dropdown_item = resolveComponent("el-dropdown-item");
      const _component_el_dropdown = resolveComponent("el-dropdown");
      const _component_el_tabs = resolveComponent("el-tabs");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_el_tabs, {
          modelValue: activeName.value,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeName.value = $event),
          type: "border-card",
          stretch: "",
          style: { "height": "calc(100vh - 50px)", "width": "100%", "overflow-x": "hidden" },
          "tab-position": "left",
          lazy: "",
          onTabChange: _cache[1] || (_cache[1] = ($event) => getExistingConfig(activeName.value))
        }, {
          default: withCtx(() => [
            createVNode(_component_el_tab_pane, {
              name: "login",
              label: unref(T)("MANAGE_LOGIN_PAGE_PANE_NAME"),
              style: { "width": "100%", "overflow-y": "scroll", "height": "calc(100vh - 50px)" },
              lazy: ""
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, null, {
                  default: withCtx(() => [
                    (openBlock(true), createElementBlock(Fragment, null, renderList(sortedAllConfigAliasMap.value, (item) => {
                      return openBlock(), createBlock(_component_el_col, {
                        key: item,
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 6,
                        xl: 4
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_el_card, {
                            class: "box-card",
                            style: { "margin": "10px 0" },
                            shadow: "hover"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_el_popover, {
                                placement: "top",
                                width: 300,
                                trigger: "click",
                                persistent: false,
                                teleported: ""
                              }, {
                                reference: withCtx(() => [
                                  createVNode(_component_el_button, { style: { "width": "100%", "text-align": "center", "overflow": "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" } }, {
                                    icon: withCtx(() => [
                                      createBaseVNode("img", {
                                        src: require(`./assets/${item.picBedName}.webp`),
                                        style: { "width": "25px", "height": "25px" }
                                      }, null, 8, _hoisted_2)
                                    ]),
                                    default: withCtx(() => [
                                      createVNode(_component_el_tooltip, {
                                        effect: "light",
                                        content: item.alias,
                                        placement: "top",
                                        disabled: !unref(isNeedToShorten)(item.alias),
                                        persistent: false,
                                        teleported: ""
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(unref(isNeedToShorten)(item.alias) ? unref(safeSliceF)(item.alias, 17) + "..." : item.alias), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["content", "disabled"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                default: withCtx(() => [
                                  createVNode(_component_el_table, {
                                    data: unref(formObjToTableData)(item.config),
                                    style: { "width": "100%" },
                                    size: "small",
                                    "header-cell-style": { "text-align": "center" },
                                    "cell-style": { "text-align": "center" }
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_el_table_column, {
                                        prop: "key",
                                        label: unref(T)("MANAGE_LOGIN_PAGE_PANE_KEY_NAME"),
                                        width: "100"
                                      }, null, 8, ["label"]),
                                      createVNode(_component_el_table_column, {
                                        prop: "value",
                                        label: unref(T)("MANAGE_LOGIN_PAGE_PANE_KEY_VALUE")
                                      }, null, 8, ["label"])
                                    ]),
                                    _: 2
                                  }, 1032, ["data"])
                                ]),
                                _: 2
                              }, 1024),
                              _cache[2] || (_cache[2] = createBaseVNode("br", null, null, -1)),
                              _cache[3] || (_cache[3] = createBaseVNode("br", null, null, -1)),
                              createVNode(_component_el_button_group, null, {
                                default: withCtx(() => [
                                  createVNode(_component_el_button, {
                                    type: "primary",
                                    icon: unref(pointer_default),
                                    plain: "",
                                    onClick: ($event) => handleConfigClick(item)
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_ENTER")), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["icon", "onClick"]),
                                  createVNode(_component_el_button, {
                                    type: "warning",
                                    icon: unref(delete_default),
                                    plain: "",
                                    onClick: ($event) => handleConfigRemove(item.alias)
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_DELETE")), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["icon", "onClick"])
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2,
                            __: [2, 3]
                          }, 1024)
                        ]),
                        _: 2
                      }, 1024);
                    }), 128))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["label"]),
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(supportedPicBedList), (item) => {
              return openBlock(), createBlock(_component_el_tab_pane, {
                key: item.name,
                label: item.name,
                name: item.icon,
                class: "tab-pane",
                lazy: "",
                style: { "width": "100%", "overflow-y": "scroll", "height": "calc(100vh - 50px)" }
              }, {
                default: withCtx(() => [
                  createVNode(_component_el_alert, {
                    title: item.explain,
                    type: "info",
                    "show-icon": "",
                    center: "",
                    closable: false
                  }, null, 8, ["title"]),
                  createVNode(_component_el_alert, {
                    center: "",
                    closable: false
                  }, {
                    default: withCtx(() => [
                      createBaseVNode("div", null, [
                        createTextVNode(toDisplayString(item.referenceText) + " ", 1),
                        createBaseVNode("a", {
                          style: { "color": "blue", "cursor": "pointer" },
                          onClick: ($event) => handleReferenceClick(item.refLink)
                        }, toDisplayString(item.refLink), 9, _hoisted_3)
                      ])
                    ]),
                    _: 2
                  }, 1024),
                  createVNode(_component_el_form, {
                    "label-position": "top",
                    "require-asterisk-position": "right",
                    "label-width": "10vw",
                    size: "default",
                    rules: unref(rules),
                    model: configResult
                  }, {
                    default: withCtx(() => [
                      (openBlock(true), createElementBlock(Fragment, null, renderList(unref(supportedPicBedList)[item.icon].options, (option) => {
                        return openBlock(), createBlock(_component_el_form_item, {
                          key: option,
                          prop: item.icon + "." + option
                        }, {
                          label: withCtx(() => [
                            createTextVNode(toDisplayString(unref(supportedPicBedList)[item.icon].configOptions[option].description) + " ", 1),
                            !!unref(supportedPicBedList)[item.icon].configOptions[option].tooltip ? (openBlock(), createBlock(_component_el_tooltip, {
                              key: 0,
                              effect: "dark",
                              content: unref(supportedPicBedList)[item.icon].configOptions[option].tooltip,
                              placement: "right",
                              persistent: false,
                              teleported: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_el_icon, { color: "#409EFF" }, {
                                  default: withCtx(() => [
                                    createVNode(unref(info_filled_default))
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 2
                            }, 1032, ["content"])) : createCommentVNode("", true)
                          ]),
                          default: withCtx(() => [
                            unref(supportedPicBedList)[item.icon].configOptions[option].type === "string" ? (openBlock(), createBlock(_component_el_input, {
                              key: 0,
                              modelValue: configResult[item.icon + "." + option],
                              "onUpdate:modelValue": ($event) => configResult[item.icon + "." + option] = $event,
                              modelModifiers: { trim: true },
                              placeholder: unref(supportedPicBedList)[item.icon].configOptions[option].placeholder,
                              disabled: !!unref(supportedPicBedList)[item.icon].configOptions[option].disabled
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder", "disabled"])) : unref(supportedPicBedList)[item.icon].configOptions[option].type === "boolean" ? (openBlock(), createBlock(_component_el_switch, {
                              key: 1,
                              modelValue: configResult[item.icon + "." + option],
                              "onUpdate:modelValue": ($event) => configResult[item.icon + "." + option] = $event,
                              style: { "--el-switch-on-color": "#13ce66", "--el-switch-off-color": "#ff4949" }
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])) : unref(supportedPicBedList)[item.icon].configOptions[option].type === "number" ? (openBlock(), createBlock(_component_el_input, {
                              key: 2,
                              modelValue: configResult[item.icon + "." + option],
                              "onUpdate:modelValue": ($event) => configResult[item.icon + "." + option] = $event,
                              modelModifiers: { number: true },
                              placeholder: unref(supportedPicBedList)[item.icon].configOptions[option].placeholder
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])) : unref(supportedPicBedList)[item.icon].configOptions[option].type === "select" ? (openBlock(), createBlock(_component_el_select, {
                              key: 3,
                              modelValue: configResult[item.icon + "." + option],
                              "onUpdate:modelValue": ($event) => configResult[item.icon + "." + option] = $event,
                              placeholder: unref(T)("MANAGE_LOGIN_PAGE_PANE_SELECT_PLACEHOLDER"),
                              persistent: false,
                              teleported: ""
                            }, {
                              default: withCtx(() => [
                                (openBlock(true), createElementBlock(Fragment, null, renderList(Object.entries(unref(supportedPicBedList)[item.icon].configOptions[option].selectOptions), (i) => {
                                  return openBlock(), createBlock(_component_el_option, {
                                    key: i[0],
                                    label: i[1],
                                    value: i[0]
                                  }, null, 8, ["label", "value"]);
                                }), 128))
                              ]),
                              _: 2
                            }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])) : createCommentVNode("", true)
                          ]),
                          _: 2
                        }, 1032, ["prop"]);
                      }), 128))
                    ]),
                    _: 2
                  }, 1032, ["rules", "model"]),
                  createBaseVNode("div", _hoisted_4, [
                    createVNode(_component_el_dropdown, {
                      "split-button": "",
                      type: "success",
                      style: { "margin-left": "10vw" },
                      placement: "top",
                      disabled: currentAliasList.length === 0,
                      teleported: ""
                    }, {
                      dropdown: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(currentAliasList, (i) => {
                          return openBlock(), createBlock(_component_el_dropdown_item, {
                            key: i,
                            onClick: ($event) => handleConfigImport(i)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(i), 1)
                            ]),
                            _: 2
                          }, 1032, ["onClick"]);
                        }), 128))
                      ]),
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_IMPORT")) + " ", 1)
                      ]),
                      _: 1
                    }, 8, ["disabled"]),
                    createVNode(_component_el_button, {
                      type: "primary",
                      style: { "margin-left": "10vw" },
                      icon: unref(edit_default),
                      plain: "",
                      onClick: ($event) => handleConfigChange(item.icon)
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_SAVE")), 1)
                      ]),
                      _: 2
                    }, 1032, ["icon", "onClick"]),
                    createVNode(_component_el_button, {
                      type: "danger",
                      style: { "margin-left": "10vw" },
                      icon: unref(delete_default),
                      plain: "",
                      onClick: ($event) => handleConfigReset(item.icon)
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("MANAGE_LOGIN_PAGE_PANE_RESET")), 1)
                      ]),
                      _: 2
                    }, 1032, ["icon", "onClick"])
                  ]),
                  _cache[4] || (_cache[4] = createBaseVNode("br", null, null, -1)),
                  createVNode(_component_el_alert, {
                    title: unref(T)("MANAGE_LOGIN_PAGE_PANE_TABLE_TITLE"),
                    type: "success",
                    center: "",
                    closable: false
                  }, null, 8, ["title"]),
                  createVNode(_component_el_table, {
                    data: dataForTable,
                    style: { "width": "100%", "margin-top": "10px" },
                    "header-cell-style": { "text-align": "center" },
                    "cell-style": { "text-align": "center" },
                    onCellClick: handleCellClick
                  }, {
                    default: withCtx(() => [
                      (openBlock(true), createElementBlock(Fragment, null, renderList(unref(supportedPicBedList)[item.icon].options, (option) => {
                        return openBlock(), createBlock(_component_el_table_column, {
                          key: option,
                          prop: option,
                          label: unref(supportedPicBedList)[item.icon].configOptions[option].description,
                          sortable: "",
                          "show-overflow-tooltip": ""
                        }, null, 8, ["prop", "label"]);
                      }), 128))
                    ]),
                    _: 2
                  }, 1032, ["data"])
                ]),
                _: 2,
                __: [4]
              }, 1032, ["label", "name"]);
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
