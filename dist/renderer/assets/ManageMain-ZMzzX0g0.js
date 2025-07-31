import { T, d as defineComponent, r as ref, al as useRoute, a as reactive, D as watch, am as computed, o as onBeforeMount, c as createElementBlock, e as openBlock, f as createBaseVNode, q as createVNode, w as withDirectives, B as createTextVNode, u as unref, t as toDisplayString, v as withCtx, y as resolveComponent, i as resolveDirective, N as createBlock, m as triggerRPC, j as IRPCActionType, g as createCommentVNode, an as circle_plus_default, F as Fragment, h as renderList, E as normalizeStyle, ao as folder_opened_default, ap as folder_default, aq as home_filled_default, ar as switch_default, a5 as tools_default, as as chrome_filled_default, at as success_filled_default, au as ElNotification, Q as useRouter } from "./index-BqdcQlNn.js";
import { u as useManageStore } from "./manageStore-EteLCVxq.js";
import { s as supportedPicBedList } from "./constants-BZfYqEeL.js";
import "./dataSender-Bg45AIFL.js";
const AliyunAreaCodeName = {
  "oss-cn-hangzhou": "华东1(杭州)",
  "oss-cn-shanghai": "华东2(上海)",
  "oss-cn-nanjing": "华东5(南京)",
  "oss-cn-fuzhou": "华东6(福州)",
  "oss-cn-wuhan": "华中1(武汉)",
  "oss-cn-qingdao": "华北1(青岛)",
  "oss-cn-beijing": "华北2(北京)",
  "oss-cn-zhangjiakou": "华北3(张家口)",
  "oss-cn-huhehaote": "华北5(呼和浩特)",
  "oss-cn-wulanchabu": "华北6(乌兰察布)",
  "oss-cn-shenzhen": "华南1(深圳)",
  "oss-cn-heyuan": "华南2(河源)",
  "oss-cn-guangzhou": "华南3(广州)",
  "oss-cn-chengdu": "西南1(成都)",
  "oss-cn-hongkong": "中国香港",
  "oss-us-west-1": "美国(硅谷)",
  "oss-us-east-1": "美国(弗吉尼亚)",
  "oss-ap-northeast-1": "日本(东京)",
  "oss-ap-northeast-2": "韩国(首尔)",
  "oss-ap-southeast-1": "新加坡",
  "oss-ap-southeast-2": "澳大利亚(悉尼)",
  "oss-ap-southeast-3": "马来西亚(吉隆坡)",
  "oss-ap-southeast-5": "印度尼西亚(雅加达)",
  "oss-ap-southeast-6": "菲律宾(马尼拉)",
  "oss-ap-southeast-7": "泰国(曼谷)",
  "oss-ap-south-1": "印度(孟买)",
  "oss-eu-central-1": "德国(法兰克福)",
  "oss-eu-west-1": "英国(伦敦)",
  "oss-me-east-1": "阿联酋(迪拜)",
  "oss-rg-china-mainland": "无地域属性"
};
const QiniuAreaCodeName = {
  z0: "华东-浙江",
  "cn-east-2": "华东 浙江2",
  z1: "华北-河北",
  z2: "华南-广东",
  na0: "北美-洛杉矶",
  as0: "亚太-新加坡",
  "ap-northeast-1": "亚太-首尔",
  "ap-southeast-2": "亚太-河内"
};
const TencentAreaCodeName = {
  "ap-beijing-1": "北京一区",
  "ap-beijing": "北京",
  "ap-nanjing": "南京",
  "ap-shanghai": "上海",
  "ap-guangzhou": "广州",
  "ap-chengdu": "成都",
  "ap-chongqing": "重庆",
  "ap-shenzhen-fsi": "深圳金融",
  "ap-shagnhai-fsi": "上海金融",
  "ap-beijing-fsi": "北京金融",
  "ap-hongkong": "香港",
  "ap-singapore": "新加坡",
  "ap-mumbai": "孟买",
  "ap-jakarta": "雅加达",
  "ap-seoul": "首尔",
  "ap-bangkok": "曼谷",
  "ap-tokyo": "东京",
  "na-siliconvalley": "硅谷(美西)",
  "na-ashburn": "弗吉尼亚(美东)",
  "na-toronto": "多伦多",
  "sa-saopaulo": "圣保罗",
  "eu-frankfurt": "法兰克福"
};
const newBucketConfig = {
  tcyun: {
    name: T("MANAGE_NEW_BUCKET_TCYUN_NAME"),
    icon: "tcyun",
    configOptions: {
      BucketName: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_DESC"),
        placeholder: T("MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_PLACEHOLDER"),
        paraType: "string",
        component: "input",
        default: "piclist",
        rule: [
          {
            required: true,
            message: T("MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_A"),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,21}[a-z0-9]$/;
              if (value.length > 23) {
                callback(new Error(T("MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_B")));
              } else if (!reg.test(value)) {
                callback(new Error(T("MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_C")));
              } else {
                callback();
              }
            },
            trigger: "change"
          }
        ]
      },
      region: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_TCYUN_REGION"),
        paraType: "string",
        component: "select",
        default: "ap-nanjing",
        options: TencentAreaCodeName
      },
      acl: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_TCYUN_ACL_DESC"),
        paraType: "string",
        component: "select",
        default: "private",
        options: {
          private: T("MANAGE_NEW_BUCKET_TCYUN_ACL_PRIVATE"),
          "public-read": T("MANAGE_NEW_BUCKET_TCYUN_ACL_PUBLIC_R"),
          "public-read-write": T("MANAGE_NEW_BUCKET_TCYUN_ACL_PUBLIC_RW")
        }
      }
    },
    options: ["BucketName", "region", "acl"]
  },
  aliyun: {
    name: T("MANAGE_NEW_BUCKET_ALIYUN_NAME"),
    icon: "aliyun",
    configOptions: {
      BucketName: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_DESC"),
        placeholder: T("MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_PLACEHOLDER"),
        paraType: "string",
        component: "input",
        default: "piclist",
        rule: [
          {
            required: true,
            message: T("MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_A"),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              const reg = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
              if (value.length > 63) {
                callback(new Error(T("MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_B")));
              } else if (!reg.test(value)) {
                callback(new Error(T("MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_C")));
              } else {
                callback();
              }
            },
            trigger: "change"
          }
        ]
      },
      region: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_ALIYUN_REGION"),
        paraType: "string",
        component: "select",
        default: "oss-cn-hangzhou",
        options: AliyunAreaCodeName
      },
      acl: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_ALIYUN_ACL_DESC"),
        paraType: "string",
        component: "select",
        default: "private",
        options: {
          private: T("MANAGE_NEW_BUCKET_ALIYUN_ACL_PRIVATE"),
          publicRead: T("MANAGE_NEW_BUCKET_ALIYUN_ACL_PUBLIC_R"),
          publicReadWrite: T("MANAGE_NEW_BUCKET_ALIYUN_ACL_PUBLIC_RW")
        }
      }
    },
    options: ["BucketName", "region", "acl"]
  },
  qiniu: {
    name: T("MANAGE_NEW_BUCKET_QINIU_NAME"),
    icon: "qiniu",
    configOptions: {
      BucketName: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_DESC"),
        placeholder: T("MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_PLACEHOLDER"),
        paraType: "string",
        component: "input",
        default: "piclist",
        rule: [
          {
            required: true,
            message: T("MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_A"),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
              if (value.length > 63) {
                callback(new Error(T("MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_B")));
              } else if (!reg.test(value)) {
                callback(new Error(T("MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_C")));
              } else {
                callback();
              }
            },
            trigger: "change"
          }
        ]
      },
      region: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_QINIU_REGION"),
        paraType: "string",
        component: "select",
        default: "z0",
        options: QiniuAreaCodeName
      },
      acl: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_QINIU_ACL_DESC"),
        paraType: "boolean",
        component: "switch",
        default: false
      }
    },
    options: ["BucketName", "region", "acl"]
  },
  s3plist: {
    name: T("MANAGE_NEW_BUCKET_S3PLIST_NAME"),
    icon: "s3plist",
    configOptions: {
      BucketName: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_S3PLIST_BUCKETNAME_DESC"),
        placeholder: T("MANAGE_NEW_BUCKET_S3PLIST_BUCKETNAME_PLACEHOLDER"),
        paraType: "string",
        component: "input",
        default: "piclist",
        rule: [
          {
            required: true,
            message: T("MANAGE_NEW_BUCKET_S3PLIST_BUCKETNAME_RULE_MSG_A"),
            trigger: "blur"
          }
        ]
      },
      region: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_S3PLIST_REGION"),
        paraType: "string",
        component: "input",
        default: "us-east-1"
      },
      acl: {
        required: true,
        description: T("MANAGE_NEW_BUCKET_S3PLIST_ACL_DESC"),
        paraType: "string",
        component: "select",
        default: "private",
        options: {
          private: T("MANAGE_NEW_BUCKET_S3PLIST_ACL_PRIVATE"),
          "public-read": T("MANAGE_NEW_BUCKET_S3PLIST_ACL_PUBLIC_R"),
          "public-read-write": T("MANAGE_NEW_BUCKET_S3PLIST_ACL_PUBLIC_RW"),
          "authenticated-read": T("MANAGE_NEW_BUCKET_S3PLIST_ACL_AUTHENTICATED_READ")
        }
      }
    },
    options: ["BucketName", "region", "acl"]
  }
};
const _hoisted_1 = { class: "layout" };
const _hoisted_2 = { class: "layout__menu" };
const _hoisted_3 = { class: "layout__menu__button" };
const _hoisted_4 = ["src"];
const _hoisted_5 = { style: { "font-size": "14px", "color": "#909399" } };
const _hoisted_6 = { class: "layout__menu__setting__item" };
const _hoisted_7 = { class: "layout__menu__setting__item" };
const _hoisted_8 = { class: "layout__menu__setting__item" };
const _hoisted_9 = {
  class: "layout__content",
  style: { "height": "100%", "background-color": "transparent", "flex": "1", "width": "0" }
};
const _hoisted_10 = {
  class: "choice-cos",
  style: { "display": "flex", "flex-direction": "row", "flex-wrap": "wrap", "justify-content": "space-around" }
};
const _hoisted_11 = { style: { "font-size": "13px", "margin-top": "5px", "color": "red" } };
const _hoisted_12 = ["onClick"];
const _hoisted_13 = { style: { "font-size": "13px", "margin-top": "5px", "color": "cornflowerblue" } };
const _hoisted_14 = { style: { "position": "relative", "height": "10vh", "width": "100%" } };
const _hoisted_15 = { style: { "position": "relative", "height": "10vh", "width": "100%", "z-index": "1" } };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ManageMain",
  setup(__props) {
    const manageStore = useManageStore();
    const route = useRoute();
    const router = useRouter();
    const currentAlias = ref(route.query.alias);
    const currentPicBedName = ref(route.query.picBedName);
    let allPicBedConfigure = JSON.parse(route.query.allPicBedConfigure);
    let currentPagePicBedConfig = reactive(JSON.parse(route.query.config));
    const newBucketConfigResult = reactive({});
    const bucketList = ref({});
    const currentSelectedBucket = ref("");
    const bucketNameList = ref([]);
    const isLoadingBucketList = ref(false);
    const nweBucketDrawerVisible = ref(false);
    const picBedSwitchDialogVisible = ref(false);
    watch(route, async (newRoute) => {
      if (newRoute.fullPath.split("?")[0] === "/main-page/manage-main-page") {
        currentAlias.value = newRoute.query.alias;
        currentPicBedName.value = newRoute.query.picBedName;
        allPicBedConfigure = JSON.parse(newRoute.query.allPicBedConfigure);
        currentPagePicBedConfig = reactive(JSON.parse(newRoute.query.config));
        await getBucketList();
      }
    });
    const getCurrentActiveBucket = computed(() => bucketNameList.value.length === 0 ? "" : bucketNameList.value[0]);
    const urlMap = {
      aliyun: "https://oss.console.aliyun.com",
      github: "https://github.com",
      imgur: "https://imgur.com",
      local: "https://piclist.cn",
      qiniu: "https://portal.qiniu.com",
      s3plist: "https://aws.amazon.com/cn/s3/",
      sftp: "https://github.com/imba97/picgo-plugin-sftp-uploader",
      smms: "https://smms.app",
      tcyun: "https://console.cloud.tencent.com/cos",
      upyun: "https://console.upyun.com",
      webdavplist: "https://baike.baidu.com/item/WebDAV/4610909"
    };
    const showNewIconList = ["aliyun", "qiniu", "tcyun", "s3plist"];
    const bucketT = T("MANAGE_MAIN_PAGE_BUCKET");
    const galleryT = T("MANAGE_MAIN_PAGE_GALLERY");
    const repositoryT = T("MANAGE_MAIN_PAGE_REPOSITORY");
    const menuTitleMap = {
      aliyun: bucketT,
      qiniu: bucketT,
      tcyun: bucketT,
      upyun: bucketT,
      s3plist: bucketT,
      sftp: "",
      smms: galleryT,
      imgur: galleryT,
      github: repositoryT,
      webdavplist: "",
      local: ""
    };
    const rules = ruleMap(newBucketConfig);
    const openPicBedUrl = () => window.electron.shell.openExternal(urlMap[currentPagePicBedConfig.picBedName]);
    function ruleMap(options) {
      return Object.keys(options).reduce((result, key) => {
        options[key].options.forEach((option) => {
          const keyName = `${key}.${option}`;
          const configOption = options[key].configOptions[option];
          if (configOption.rule) {
            result[keyName] = configOption.rule;
          }
          if (configOption.default) {
            newBucketConfigResult[keyName] = configOption.default;
          }
        });
        return result;
      }, {});
    }
    function openNewBucketDrawer() {
      nweBucketDrawerVisible.value = true;
    }
    function createNewBucket(picBedName) {
      const configOptions = newBucketConfig[picBedName].configOptions;
      const resultMap = Object.keys(configOptions).reduce((result, key) => {
        const resultKey = `${picBedName}.${key}`;
        const defaultValue = configOptions[key].default;
        const resultValue = newBucketConfigResult[resultKey];
        result[key] = resultValue === "" && defaultValue !== void 0 ? defaultValue : resultValue === void 0 ? defaultValue ?? "" : resultValue;
        return result;
      }, {});
      if (currentPicBedName.value === "tcyun") {
        resultMap.BucketName = `${resultMap.BucketName}-${currentPagePicBedConfig.appId}`;
      }
      resultMap.endpoint = currentPagePicBedConfig.endpoint;
      triggerRPC(IRPCActionType.MANAGE_CREATE_BUCKET, currentAlias, resultMap).then((result) => {
        if (result) {
          ElNotification({
            title: T("MANAGE_MAIN_PAGE_TIPS"),
            message: T("MANAGE_MAIN_PAGE_TIPS_SUCCESS"),
            type: "success"
          });
          nweBucketDrawerVisible.value = false;
          setTimeout(() => {
            getBucketList();
          }, 2e3);
        } else {
          ElNotification({
            title: T("MANAGE_MAIN_PAGE_TIPS"),
            message: T("MANAGE_MAIN_PAGE_TIPS_FAILED"),
            type: "error"
          });
        }
      });
    }
    async function getBucketList() {
      bucketList.value = {};
      bucketNameList.value = [];
      isLoadingBucketList.value = true;
      const result = await triggerRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST, currentAlias.value);
      isLoadingBucketList.value = false;
      if (result.length > 0) {
        result.forEach((item) => {
          bucketList.value[item.Name] = item;
          bucketNameList.value.push(item.Name);
        });
      }
    }
    function transPathToUnix(filePath) {
      if (!filePath) return "";
      return process.platform === "win32" ? filePath.split(window.node.path.sep).join(window.node.path.posix.sep).replace(/^\/+|\/+$/g, "") : filePath.replace(/^\/+|\/+$/g, "");
    }
    function handleSelectMenu(bucketName) {
      const currentPicBedConfig = manageStore.config.picBed[currentAlias.value];
      const transformedConfig = JSON.parse(currentPicBedConfig.transformedConfig ?? "{}");
      let prefix = transformedConfig[bucketName]?.baseDir || "/";
      const cpicBedName = currentPicBedConfig.picBedName ?? currentPicBedName.value;
      if (cpicBedName === "local") {
        prefix = `/${transPathToUnix(prefix)}/`;
      } else {
        prefix = prefix.startsWith("/") ? prefix : `/${prefix}`;
        prefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
      }
      const configMap = {
        prefix,
        bucketName,
        customUrl: transformedConfig[bucketName]?.customUrl ?? "",
        picBedName: cpicBedName,
        alias: currentAlias.value,
        bucketConfig: bucketList.value[bucketName],
        cdnUrl: currentPicBedConfig.customUrl,
        baseDir: prefix,
        webPath: currentPicBedConfig.webPath || ""
      };
      currentSelectedBucket.value = bucketName;
      router.push({
        path: "/main-page/manage-main-page/manage-bucket-page",
        query: {
          configMap: JSON.stringify(configMap)
        }
      });
    }
    function switchPicBed(picBedAlias) {
      if (picBedAlias === "main") {
        router.push({
          path: "/main-page/manage-login-page"
        });
        return;
      }
      if (route.fullPath.startsWith("/main-page/manage-main-page/manage-bucket-page") || route.fullPath.startsWith("/main-page/manage-main-page/manage-setting-page")) {
        picBedSwitchDialogVisible.value = false;
        router.push({
          path: "/main-page/manage-main-page",
          query: {
            alias: picBedAlias,
            picBedName: allPicBedConfigure[picBedAlias].picBedName,
            config: JSON.stringify(allPicBedConfigure[picBedAlias]),
            allPicBedConfigure: JSON.stringify(allPicBedConfigure)
          }
        });
      } else {
        currentAlias.value = picBedAlias;
        currentPicBedName.value = allPicBedConfigure[picBedAlias].picBedName;
        currentPagePicBedConfig = allPicBedConfigure[picBedAlias];
        picBedSwitchDialogVisible.value = false;
        currentSelectedBucket.value = "";
        getBucketList();
      }
    }
    function changePicBed() {
      picBedSwitchDialogVisible.value = true;
    }
    function openBucketPageSetting() {
      router.push({
        path: "/main-page/manage-main-page/manage-setting-page"
      });
    }
    onBeforeMount(() => {
      getBucketList();
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_divider = resolveComponent("el-divider");
      const _component_el_menu_item = resolveComponent("el-menu-item");
      const _component_el_menu = resolveComponent("el-menu");
      const _component_router_view = resolveComponent("router-view");
      const _component_el_card = resolveComponent("el-card");
      const _component_el_image = resolveComponent("el-image");
      const _component_el_dialog = resolveComponent("el-dialog");
      const _component_el_input = resolveComponent("el-input");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_drawer = resolveComponent("el-drawer");
      const _directive_loading = resolveDirective("loading");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, [
            createBaseVNode("span", {
              class: "layout__menu__button__item",
              onClick: openPicBedUrl
            }, [
              createBaseVNode("img", {
                src: require(`./assets/${unref(currentPagePicBedConfig).picBedName}.webp`),
                class: "layout__menu__button__item__icon"
              }, null, 8, _hoisted_4),
              createTextVNode(" " + toDisplayString(unref(supportedPicBedList)[unref(currentPagePicBedConfig).picBedName].name), 1)
            ])
          ]),
          createVNode(_component_el_divider, {
            "content-position": "left",
            class: "layout__menu__button__divider",
            "border-style": "none"
          }, {
            default: withCtx(() => [
              createBaseVNode("span", _hoisted_5, [
                createTextVNode(toDisplayString(menuTitleMap[currentPicBedName.value]) + " ", 1),
                showNewIconList.includes(currentPicBedName.value) ? (openBlock(), createBlock(_component_el_tooltip, {
                  key: 0,
                  effect: "dark",
                  content: unref(T)("MANAGE_MAIN_PAGE_NEW_BUCKET"),
                  placement: "right",
                  persistent: false,
                  teleported: "",
                  "popper-class": "layout__menu__button__divider__tooltip"
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_icon, {
                      class: "layout__menu__button__divider__icon",
                      color: "red",
                      style: { "top": "2px" },
                      onClick: _cache[0] || (_cache[0] = ($event) => openNewBucketDrawer())
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(circle_plus_default))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["content"])) : createCommentVNode("", true)
              ])
            ]),
            _: 1
          }),
          _cache[6] || (_cache[6] = createBaseVNode("div", null, null, -1)),
          withDirectives((openBlock(), createBlock(_component_el_menu, {
            class: "layout__menu__list",
            "default-active": getCurrentActiveBucket.value,
            style: { "width": "120px" },
            "active-text-color": "#409EFF",
            onSelect: handleSelectMenu
          }, {
            default: withCtx(() => [
              (openBlock(true), createElementBlock(Fragment, null, renderList(bucketNameList.value, (item) => {
                return openBlock(), createBlock(_component_el_menu_item, {
                  key: item,
                  index: item
                }, {
                  default: withCtx(() => [
                    createBaseVNode("span", {
                      class: "layout__menu__list__item",
                      style: normalizeStyle({
                        color: item === currentSelectedBucket.value ? "#409EFF" : "#606266"
                      })
                    }, [
                      currentSelectedBucket.value === item && currentPicBedName.value !== "github" ? (openBlock(), createBlock(_component_el_icon, {
                        key: 0,
                        class: "layout__menu__list__item__icon",
                        color: "#409EFF",
                        style: { "top": "2px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(unref(folder_opened_default))
                        ]),
                        _: 1
                      })) : currentPicBedName.value !== "github" ? (openBlock(), createBlock(_component_el_icon, {
                        key: 1,
                        class: "layout__menu__list__item__icon",
                        color: "#606266",
                        style: { "top": "2px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(unref(folder_default))
                        ]),
                        _: 1
                      })) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(currentPicBedName.value === "tcyun" ? item.slice(0, item.length - 11) : currentPicBedName.value === "github" ? item.length > 10 ? `${item.slice(0, 5)}..${item.slice(-5)}` : item : item), 1)
                    ], 4)
                  ]),
                  _: 2
                }, 1032, ["index"]);
              }), 128))
            ]),
            _: 1
          }, 8, ["default-active"])), [
            [_directive_loading, isLoadingBucketList.value]
          ]),
          createVNode(_component_el_menu, {
            class: "layout__menu__setting",
            style: { "width": "120px" }
          }, {
            default: withCtx(() => [
              createVNode(_component_el_menu_item, {
                index: "changePicBed",
                style: { "height": "40px" },
                onClick: _cache[1] || (_cache[1] = ($event) => switchPicBed("main"))
              }, {
                default: withCtx(() => [
                  createBaseVNode("span", _hoisted_6, [
                    createVNode(_component_el_icon, { class: "layout__menu__setting__item__icon" }, {
                      default: withCtx(() => [
                        createVNode(unref(home_filled_default))
                      ]),
                      _: 1
                    }),
                    createTextVNode(" " + toDisplayString(unref(T)("MANAGE_MAIN_PAGE_BACK_TO_HOME")), 1)
                  ])
                ]),
                _: 1
              }),
              createVNode(_component_el_menu_item, {
                index: "changePicBed",
                style: { "height": "40px" },
                onClick: changePicBed
              }, {
                default: withCtx(() => [
                  createBaseVNode("span", _hoisted_7, [
                    createVNode(_component_el_icon, { class: "layout__menu__setting__item__icon" }, {
                      default: withCtx(() => [
                        createVNode(unref(switch_default))
                      ]),
                      _: 1
                    }),
                    createTextVNode(" " + toDisplayString(unref(T)("MANAGE_MAIN_PAGE_SWITCH_PICBED")), 1)
                  ])
                ]),
                _: 1
              }),
              createVNode(_component_el_menu_item, {
                index: "bucketPageSetting",
                style: { "height": "40px" },
                onClick: openBucketPageSetting
              }, {
                default: withCtx(() => [
                  createBaseVNode("span", _hoisted_8, [
                    createVNode(_component_el_icon, { class: "layout__menu__setting__item__icon" }, {
                      default: withCtx(() => [
                        createVNode(unref(tools_default))
                      ]),
                      _: 1
                    }),
                    createTextVNode(" " + toDisplayString(unref(T)("MANAGE_MAIN_PAGE_SETTING")), 1)
                  ])
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ]),
        createBaseVNode("div", _hoisted_9, [
          createVNode(_component_router_view)
        ]),
        createVNode(_component_el_dialog, {
          modelValue: picBedSwitchDialogVisible.value,
          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => picBedSwitchDialogVisible.value = $event),
          top: "30vh",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createBaseVNode("div", _hoisted_10, [
              createVNode(_component_el_card, { shadow: "hover" }, {
                default: withCtx(() => [
                  createBaseVNode("div", {
                    style: { "text-align": "center", "display": "flex", "flex-direction": "column" },
                    onClick: _cache[2] || (_cache[2] = ($event) => switchPicBed("main"))
                  }, [
                    createVNode(_component_el_icon, {
                      color: "red",
                      size: "25px",
                      style: { "margin": "0 auto" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(chrome_filled_default))
                      ]),
                      _: 1
                    }),
                    createBaseVNode("span", _hoisted_11, toDisplayString(unref(T)("MANAGE_MAIN_PAGE_BACK_TO_HOME")), 1)
                  ])
                ]),
                _: 1
              }),
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(allPicBedConfigure), (item) => {
                return openBlock(), createBlock(_component_el_card, {
                  key: item,
                  shadow: "hover"
                }, {
                  default: withCtx(() => [
                    createBaseVNode("div", {
                      style: { "text-align": "center", "display": "flex", "flex-direction": "column" },
                      onClick: ($event) => switchPicBed(item.alias)
                    }, [
                      createVNode(_component_el_image, {
                        src: require(`./assets/${item.picBedName}.webp`),
                        class: "layout__addNewBucket__icon",
                        style: { "width": "25px", "height": "25px", "margin": "0 auto" }
                      }, null, 8, ["src"]),
                      createBaseVNode("span", _hoisted_13, toDisplayString(item.alias), 1)
                    ], 8, _hoisted_12)
                  ]),
                  _: 2
                }, 1024);
              }), 128))
            ])
          ]),
          _: 1
        }, 8, ["modelValue"]),
        createVNode(_component_el_drawer, {
          modelValue: nweBucketDrawerVisible.value,
          "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => nweBucketDrawerVisible.value = $event),
          class: "layout__addNewBucket",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_el_form, {
              "label-position": "top",
              "require-asterisk-position": "right",
              "label-width": "10vw",
              size: "default",
              model: newBucketConfigResult,
              rules: unref(rules)
            }, {
              default: withCtx(() => [
                createBaseVNode("div", _hoisted_14, [
                  createVNode(_component_el_image, {
                    src: require(`./assets/${currentPicBedName.value}.webp`),
                    class: "layout__addNewBucket__icon",
                    style: { "position": "absolute", "top": "50%", "left": "50%", "transform": "translate(-50%, -50%)" }
                  }, null, 8, ["src"])
                ]),
                createVNode(_component_el_divider, { "border-style": "none" }),
                (openBlock(true), createElementBlock(Fragment, null, renderList(unref(newBucketConfig)[currentPicBedName.value].options, (option) => {
                  return openBlock(), createBlock(_component_el_form_item, {
                    key: option,
                    prop: currentPicBedName.value + "." + option,
                    label: unref(newBucketConfig)[currentPicBedName.value].configOptions[option].description
                  }, {
                    default: withCtx(() => [
                      unref(newBucketConfig)[currentPicBedName.value].configOptions[option].component === "input" && currentPicBedName.value !== "tcyun" ? (openBlock(), createBlock(_component_el_input, {
                        key: 0,
                        modelValue: newBucketConfigResult[currentPicBedName.value + "." + option],
                        "onUpdate:modelValue": ($event) => newBucketConfigResult[currentPicBedName.value + "." + option] = $event,
                        modelModifiers: { trim: true },
                        placeholder: unref(newBucketConfig)[currentPicBedName.value].configOptions[option].placeholder
                      }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])) : createCommentVNode("", true),
                      currentPicBedName.value === "tcyun" && unref(newBucketConfig)[currentPicBedName.value].configOptions[option].component === "input" ? (openBlock(), createBlock(_component_el_input, {
                        key: 1,
                        modelValue: newBucketConfigResult[currentPicBedName.value + "." + option],
                        "onUpdate:modelValue": ($event) => newBucketConfigResult[currentPicBedName.value + "." + option] = $event,
                        modelModifiers: { trim: true },
                        placeholder: unref(newBucketConfig)[currentPicBedName.value].configOptions[option].placeholder
                      }, {
                        append: withCtx(() => [
                          createTextVNode(toDisplayString("-" + unref(currentPagePicBedConfig).appId), 1)
                        ]),
                        _: 2
                      }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])) : createCommentVNode("", true),
                      unref(newBucketConfig)[currentPicBedName.value].configOptions[option].component === "select" ? (openBlock(), createBlock(_component_el_select, {
                        key: 2,
                        modelValue: newBucketConfigResult[currentPicBedName.value + "." + option],
                        "onUpdate:modelValue": ($event) => newBucketConfigResult[currentPicBedName.value + "." + option] = $event,
                        size: "large",
                        persistent: false,
                        teleported: ""
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createElementBlock(Fragment, null, renderList(Object.keys(unref(newBucketConfig)[currentPicBedName.value].configOptions[option].options), (item) => {
                            return openBlock(), createBlock(_component_el_option, {
                              key: item,
                              label: unref(newBucketConfig)[currentPicBedName.value].configOptions[option].options[item],
                              value: item
                            }, null, 8, ["label", "value"]);
                          }), 128))
                        ]),
                        _: 2
                      }, 1032, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true),
                      unref(newBucketConfig)[currentPicBedName.value].configOptions[option].component === "switch" ? (openBlock(), createBlock(_component_el_switch, {
                        key: 3,
                        modelValue: newBucketConfigResult[currentPicBedName.value + "." + option],
                        "onUpdate:modelValue": ($event) => newBucketConfigResult[currentPicBedName.value + "." + option] = $event,
                        "active-value": true,
                        "inactive-value": false
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true)
                    ]),
                    _: 2
                  }, 1032, ["prop", "label"]);
                }), 128)),
                createBaseVNode("div", _hoisted_15, [
                  createVNode(_component_el_button, {
                    icon: unref(success_filled_default),
                    type: "primary",
                    style: { "position": "absolute", "top": "50%", "left": "50%", "transform": "translate(-50%, -50%)" },
                    onClick: _cache[4] || (_cache[4] = ($event) => createNewBucket(currentPicBedName.value))
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("MANAGE_MAIN_PAGE_SUBMIT")), 1)
                    ]),
                    _: 1
                  }, 8, ["icon"])
                ])
              ]),
              _: 1
            }, 8, ["model", "rules"])
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
