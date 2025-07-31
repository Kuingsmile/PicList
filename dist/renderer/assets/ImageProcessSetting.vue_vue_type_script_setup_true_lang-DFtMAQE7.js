import { d as defineComponent, aw as useModel, T, a as reactive, r as ref, o as onBeforeMount, N as createBlock, e as openBlock, v as withCtx, q as createVNode, w as withDirectives, y as resolveComponent, u as unref, f as createBaseVNode, t as toDisplayString, ac as vShow, B as createTextVNode, c as createElementBlock, F as Fragment, h as renderList, af as saveConfig, bd as toRaw, p as configPaths, k as getConfig } from "./index-BqdcQlNn.js";
const _hoisted_1 = { class: "text-xs text-gray-500" };
const switchStyle = "--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ImageProcessSetting",
  props: {
    "modelValue": { type: Boolean },
    "modelModifiers": {}
  },
  emits: ["update:modelValue"],
  setup(__props) {
    const imageProcessDialogVisible = useModel(__props, "modelValue");
    const waterMarkPositionMap = /* @__PURE__ */ new Map([
      ["north", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP")],
      ["northeast", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_RIGHT")],
      ["southeast", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_RIGHT")],
      ["south", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM")],
      ["southwest", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_LEFT")],
      ["northwest", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_LEFT")],
      ["west", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_LEFT")],
      ["east", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_RIGHT")],
      ["centre", T("UPLOAD_PAGE_IMAGE_PROCESS_POSITION_CENTER")]
    ]);
    const imageExtList = ["jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif", "svg", "ico", "avif", "heif", "heic"];
    const availableFormat = [
      "avif",
      "dz",
      "fits",
      "gif",
      "heif",
      "input",
      "jpeg",
      "jpg",
      "jp2",
      "jxl",
      "magick",
      "openslide",
      "pdf",
      "png",
      "ppm",
      "raw",
      "svg",
      "tiff",
      "tif",
      "v",
      "webp"
    ];
    const waterMarkForm = reactive({
      isAddWatermark: false,
      watermarkType: "text",
      isFullScreenWatermark: false,
      watermarkDegree: 0,
      watermarkText: "",
      watermarkFontPath: "",
      watermarkScaleRatio: 0.15,
      watermarkColor: "#CCCCCC73",
      watermarkImagePath: "",
      watermarkPosition: "southeast"
    });
    const compressForm = reactive({
      quality: 100,
      isConvert: false,
      convertFormat: "jpg",
      isReSize: false,
      reSizeWidth: 500,
      reSizeHeight: 500,
      skipReSizeOfSmallImg: false,
      isReSizeByPercent: false,
      reSizePercent: 50,
      isRotate: false,
      rotateDegree: 0,
      isRemoveExif: false,
      isFlip: false,
      isFlop: false
    });
    const formatConvertObj = ref("{}");
    const skipProcessForm = reactive({
      skipProcessExtList: "zip,rar,7z,tar,gz,tar.gz,tar.bz2,tar.xz"
    });
    const waterMarkFormKeys = Object.keys(waterMarkForm);
    const compressFormKeys = Object.keys(compressForm);
    const skipProcessFormKeys = Object.keys(skipProcessForm);
    function handleSaveConfig() {
      let iformatConvertObj = {};
      try {
        iformatConvertObj = JSON.parse(formatConvertObj.value);
      } catch (error) {
      }
      const formatConvertObjEntries = Object.entries(iformatConvertObj);
      const formatConvertObjEntriesFilter = formatConvertObjEntries.filter((item) => {
        return imageExtList.includes(item[0]) && availableFormat.includes(item[1]);
      });
      const formatConvertObjFilter = Object.fromEntries(formatConvertObjEntriesFilter);
      formatConvertObj.value = JSON.stringify(formatConvertObjFilter);
      compressForm.formatConvertObj = formatConvertObjFilter;
      saveConfig(configPaths.buildIn.compress, toRaw(compressForm));
      saveConfig(configPaths.buildIn.watermark, toRaw(waterMarkForm));
      saveConfig(configPaths.buildIn.skipProcess, toRaw(skipProcessForm));
      closeDialog();
    }
    async function initData() {
      const compress = await getConfig(configPaths.buildIn.compress);
      const watermark = await getConfig(configPaths.buildIn.watermark);
      const skipProcess = await getConfig(configPaths.buildIn.skipProcess);
      if (compress) {
        compressFormKeys.forEach((key) => {
          compressForm[key] = compress[key] ?? compressForm[key];
        });
        try {
          if (typeof compress.formatConvertObj === "object") {
            formatConvertObj.value = JSON.stringify(compress.formatConvertObj);
          } else {
            formatConvertObj.value = compress.formatConvertObj ?? "{}";
          }
        } catch (error) {
          formatConvertObj.value = "{}";
        }
      }
      if (watermark) {
        waterMarkFormKeys.forEach((key) => {
          waterMarkForm[key] = watermark[key] ?? waterMarkForm[key];
        });
        waterMarkForm.watermarkColor = watermark.watermarkColor === "" ? "#CCCCCC73" : watermark.watermarkColor;
      }
      if (skipProcess) {
        skipProcessFormKeys.forEach((key) => {
          skipProcessForm[key] = skipProcess[key] ?? skipProcessForm[key];
        });
      }
    }
    function closeDialog() {
      imageProcessDialogVisible.value = false;
    }
    onBeforeMount(async () => {
      await initData();
    });
    return (_ctx, _cache) => {
      const _component_el_input = resolveComponent("el-input");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_radio = resolveComponent("el-radio");
      const _component_el_radio_group = resolveComponent("el-radio-group");
      const _component_el_input_number = resolveComponent("el-input-number");
      const _component_el_color_picker = resolveComponent("el-color-picker");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_form = resolveComponent("el-form");
      return openBlock(), createBlock(_component_el_form, {
        "label-position": "top",
        "require-asterisk-position": "right",
        "label-width": "10vw",
        size: "default",
        model: waterMarkForm
      }, {
        default: withCtx(() => [
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_SKIP_PROCESS_EXT_LIST")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input, {
                modelValue: skipProcessForm.skipProcessExtList,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => skipProcessForm.skipProcessExtList = $event),
                type: "textarea",
                autosize: { minRows: 2, maxRows: 4 }
              }, null, 8, ["modelValue"]),
              createBaseVNode("div", _hoisted_1, toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_SKIP_PROCESS_EXT_LIST_TIPS")), 1)
            ]),
            _: 1
          }, 8, ["label"]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISADDWM")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: waterMarkForm.isAddWatermark,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => waterMarkForm.isAddWatermark = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_radio_group, {
                modelValue: waterMarkForm.watermarkType,
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => waterMarkForm.watermarkType = $event)
              }, {
                default: withCtx(() => [
                  createVNode(_component_el_radio, { value: "text" }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_TEXT")), 1)
                    ]),
                    _: 1
                  }),
                  createVNode(_component_el_radio, { value: "image" }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_IMAGE")), 1)
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISFULLSCREEN_WM")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: waterMarkForm.isFullScreenWatermark,
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => waterMarkForm.isFullScreenWatermark = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMDEGREE")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: waterMarkForm.watermarkDegree,
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => waterMarkForm.watermarkDegree = $event),
                step: 1
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input, {
                modelValue: waterMarkForm.watermarkText,
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => waterMarkForm.watermarkText = $event)
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === "text"]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT_FONT_PATH")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input, {
                modelValue: waterMarkForm.watermarkFontPath,
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => waterMarkForm.watermarkFontPath = $event)
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === "text"]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMRATIO")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: waterMarkForm.watermarkScaleRatio,
                "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => waterMarkForm.watermarkScaleRatio = $event),
                min: 0,
                max: 1,
                step: 0.01
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMCOLOR")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_color_picker, {
                modelValue: waterMarkForm.watermarkColor,
                "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => waterMarkForm.watermarkColor = $event),
                "show-alpha": ""
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === "text"]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMPATH")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input, {
                modelValue: waterMarkForm.watermarkImagePath,
                "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => waterMarkForm.watermarkImagePath = $event)
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === "image"]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_WMPOSITION")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_radio_group, {
                modelValue: waterMarkForm.watermarkPosition,
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => waterMarkForm.watermarkPosition = $event)
              }, {
                default: withCtx(() => [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(unref(waterMarkPositionMap), (item) => {
                    return openBlock(), createBlock(_component_el_radio, {
                      key: item[0],
                      value: item[0]
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(item[1]), 1)
                      ]),
                      _: 2
                    }, 1032, ["value"]);
                  }), 128))
                ]),
                _: 1
              }, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, waterMarkForm.isAddWatermark]
          ]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISREMOVEEXIF")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isRemoveExif,
                "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => compressForm.isRemoveExif = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_QUALITY")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: compressForm.quality,
                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => compressForm.quality = $event),
                min: 1,
                max: 100,
                step: 1
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISCONVERT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isConvert,
                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => compressForm.isConvert = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_select, {
                modelValue: compressForm.convertFormat,
                "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => compressForm.convertFormat = $event),
                persistent: false,
                teleported: ""
              }, {
                default: withCtx(() => [
                  (openBlock(), createElementBlock(Fragment, null, renderList(availableFormat, (item) => {
                    return createVNode(_component_el_option, {
                      key: item,
                      label: item,
                      value: item
                    }, null, 8, ["label", "value"]);
                  }), 64))
                ]),
                _: 1
              }, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isConvert]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT_SPECIFIC")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input, {
                modelValue: formatConvertObj.value,
                "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => formatConvertObj.value = $event),
                placeholder: '{"jpg": "png", "png": "jpg"}',
                type: "textarea",
                autosize: { minRows: 2, maxRows: 4 }
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isConvert]
          ]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISFLIP")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isFlip,
                "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => compressForm.isFlip = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISFLOP")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isFlop,
                "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => compressForm.isFlop = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZE")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isReSize,
                "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => compressForm.isReSize = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_RESIZEWIDTH")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: compressForm.reSizeWidth,
                "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => compressForm.reSizeWidth = $event),
                min: 0
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isReSize]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_RESIZEHEIGHT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: compressForm.reSizeHeight,
                "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => compressForm.reSizeHeight = $event),
                min: 0
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isReSize]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_HEIGHT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.skipReSizeOfSmallImg,
                "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => compressForm.skipReSizeOfSmallImg = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isReSize && compressForm.reSizeHeight > 0 && compressForm.reSizeWidth === 0]
          ]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_WIDTH")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.skipReSizeOfSmallImg,
                "onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => compressForm.skipReSizeOfSmallImg = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isReSize && compressForm.reSizeWidth > 0 && compressForm.reSizeHeight === 0]
          ]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZEBYPERCENT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isReSizeByPercent,
                "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => compressForm.isReSizeByPercent = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_RESIZEPERCENT")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: compressForm.reSizePercent,
                "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => compressForm.reSizePercent = $event),
                min: 0
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isReSizeByPercent]
          ]),
          createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ISROTATE")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_switch, {
                modelValue: compressForm.isRotate,
                "onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => compressForm.isRotate = $event),
                style: switchStyle
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]),
          withDirectives(createVNode(_component_el_form_item, {
            label: unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_ROTATEDEGREE")
          }, {
            default: withCtx(() => [
              createVNode(_component_el_input_number, {
                modelValue: compressForm.rotateDegree,
                "onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => compressForm.rotateDegree = $event),
                step: 1
              }, null, 8, ["modelValue"])
            ]),
            _: 1
          }, 8, ["label"]), [
            [vShow, compressForm.isRotate]
          ]),
          createVNode(_component_el_form_item, null, {
            default: withCtx(() => [
              createVNode(_component_el_button, {
                type: "primary",
                onClick: handleSaveConfig
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_CONFIRM")), 1)
                ]),
                _: 1
              }),
              createVNode(_component_el_button, { onClick: closeDialog }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("UPLOAD_PAGE_IMAGE_PROCESS_CANCEL")), 1)
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ]),
        _: 1
      }, 8, ["model"]);
    };
  }
});
export {
  _sfc_main as _
};
