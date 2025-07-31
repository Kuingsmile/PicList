import { d as defineComponent, r as ref, M as onMounted, N as createBlock, e as openBlock, k as getConfig, ad as II18nLanguage, y as resolveComponent, p as configPaths } from "./index-BqdcQlNn.js";
const __default__ = {
  name: "DocumentPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const srcUrl = ref("https://piclist.cn/app.html");
    const updateUrl = async () => {
      const lang = await getConfig(configPaths.settings.language) || II18nLanguage.ZH_CN;
      srcUrl.value = lang === II18nLanguage.ZH_CN ? "https://piclist.cn/app.html" : "https://piclist.cn/en/app.html";
    };
    onMounted(() => {
      updateUrl();
    });
    return (_ctx, _cache) => {
      const _component_webview = resolveComponent("webview");
      return openBlock(), createBlock(_component_webview, {
        src: srcUrl.value,
        disablewebsecurity: "",
        allowpopups: "",
        autosize: "on",
        scrollbars: "none",
        style: { "width": "100%", "height": "100%" }
      }, null, 8, ["src"]);
    };
  }
});
export {
  _sfc_main as default
};
