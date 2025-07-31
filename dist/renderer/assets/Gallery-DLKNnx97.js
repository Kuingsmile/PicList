import { s as sendRPC, b5 as ILogType, j as IRPCActionType, m as triggerRPC, b6 as getRawData, d as defineComponent, r as ref, a as reactive, ae as ElMessageBox, T, am as computed, W as onBeforeRouteUpdate, o as onBeforeMount, ah as nextTick, $ as $$db, D as watch, b as onBeforeUnmount, b7 as onActivated, c as createElementBlock, e as openBlock, f as createBaseVNode, q as createVNode, B as createTextVNode, t as toDisplayString, u as unref, v as withCtx, y as resolveComponent, a9 as Transition, n as normalizeClass, E as normalizeStyle, af as saveConfig, w as withDirectives, ac as vShow, aj as caret_bottom_default, b8 as caret_top_default, aT as refresh_default, F as Fragment, h as renderList, N as createBlock, a3 as picBedGlobal, aV as sort_default, A as close_default, i as resolveDirective, aE as document_default, aJ as edit_default, a_ as delete_default, a8 as info_filled_default, k as getConfig, p as configPaths, au as ElNotification, J as ElMessage, l as IPasteStyle } from "./index-BqdcQlNn.js";
import { f as formatEndpoint } from "./common-DNjr697i.js";
import { a as customStrMatch, c as customRenameFormatTable, e as customStrReplace } from "./common-REXFY3_s.js";
import { a as picBedsCanbeDeleted } from "./static-DltyNkMh.js";
import "./dataSender-Bg45AIFL.js";
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}
const { toString } = Object.prototype;
const { getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;
const kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
const typeOfTest = (type) => (thing) => typeof thing === type;
const { isArray } = Array;
const isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
const isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
const isString = typeOfTest("string");
const isFunction = typeOfTest("function");
const isNumber = typeOfTest("number");
const isObject = (thing) => thing !== null && typeof thing === "object";
const isBoolean = (thing) => thing === true || thing === false;
const isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag in val) && !(iterator in val);
};
const isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
const isDate = kindOfTest("Date");
const isFile = kindOfTest("File");
const isBlob = kindOfTest("Blob");
const isFileList = kindOfTest("FileList");
const isStream = (val) => isObject(val) && isFunction(val.pipe);
const isFormData = (thing) => {
  let kind;
  return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
  kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]"));
};
const isURLSearchParams = kindOfTest("URLSearchParams");
const [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
const trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
const _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
const isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge() {
  const { caseless } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
const extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, { allOwnKeys });
  return a;
};
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
const inherits = (constructor, superConstructor, props, descriptors2) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
const toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
const isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
const isHTMLForm = kindOfTest("HTMLFormElement");
const toCamelCase = (str) => {
  return str.toLowerCase().replace(
    /[-_\s]([a-z\d])(\w*)/g,
    function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }
  );
};
const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
const isRegExp = kindOfTest("RegExp");
const reduceDescriptors = (obj, reducer) => {
  const descriptors2 = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors2, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
      return false;
    }
    const value = obj[name];
    if (!isFunction(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
const noop = () => {
};
const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
const toJSONObject = (obj) => {
  const stack = new Array(10);
  const visit = (source, i) => {
    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack[i] = void 0;
        return target;
      }
    }
    return source;
  };
  return visit(obj, 0);
};
const isAsyncFn = kindOfTest("AsyncFunction");
const isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener("message", ({ source, data }) => {
      if (source === _global && data === token) {
        callbacks.length && callbacks.shift()();
      }
    }, false);
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(
  typeof setImmediate === "function",
  isFunction(_global.postMessage)
);
const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
const isIterable = (thing) => thing != null && isFunction(thing[iterator]);
const utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};
function AxiosError$1(message, code, config, request, response) {
  Error.call(this);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack;
  }
  this.message = message;
  this.name = "AxiosError";
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  if (response) {
    this.response = response;
    this.status = response.status ? response.status : null;
  }
}
utils$1.inherits(AxiosError$1, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils$1.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const prototype$1 = AxiosError$1.prototype;
const descriptors = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((code) => {
  descriptors[code] = { value: code };
});
Object.defineProperties(AxiosError$1, descriptors);
Object.defineProperty(prototype$1, "isAxiosError", { value: true });
AxiosError$1.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype$1);
  utils$1.toFlatObject(error, axiosError, function filter2(obj) {
    return obj !== Error.prototype;
  }, (prop) => {
    return prop !== "isAxiosError";
  });
  AxiosError$1.call(axiosError, error.message, code, config, request, response);
  axiosError.cause = error;
  axiosError.name = error.name;
  customProps && Object.assign(axiosError, customProps);
  return axiosError;
};
const httpAdapter = null;
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}
function removeBrackets(key) {
  return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}
const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData$1(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new FormData();
  options = utils$1.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    return !utils$1.isUndefined(source[option]);
  });
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
  if (!utils$1.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils$1.isDate(value)) {
      return value.toISOString();
    }
    if (utils$1.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
    }
    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (value && !path && typeof value === "object") {
      if (utils$1.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path) {
    if (utils$1.isUndefined(value)) return;
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils$1.forEach(value, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
        formData,
        el,
        utils$1.isString(key) ? key.trim() : key,
        path,
        exposedHelpers
      );
      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });
    stack.pop();
  }
  if (!utils$1.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
function encode$1(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData$1(params, this, options);
}
const prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
function encode(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode;
  if (utils$1.isFunction(options)) {
    options = {
      serialize: options
    };
  }
  const serializeFn = options && options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};
const URLSearchParams$1 = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams;
const FormData$1 = typeof FormData !== "undefined" ? FormData : null;
const Blob$1 = typeof Blob !== "undefined" ? Blob : null;
const platform$1 = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams$1,
    FormData: FormData$1,
    Blob: Blob$1
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};
const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
const _navigator = typeof navigator === "object" && navigator || void 0;
const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
const hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
const origin = hasBrowserEnv && window.location.href || "http://localhost";
const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv,
  hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv,
  navigator: _navigator,
  origin
}, Symbol.toStringTag, { value: "Module" }));
const platform = {
  ...utils,
  ...platform$1
};
function toURLEncodedForm(data, options) {
  return toFormData$1(data, new platform.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}
function parsePropPath(name) {
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};
    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
const defaults = {
  transitional: transitionalDefaults,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || "";
    const hasJSONContentType = contentType.indexOf("application/json") > -1;
    const isObjectPayload = utils$1.isObject(data);
    if (isObjectPayload && utils$1.isHTMLForm(data)) {
      data = new FormData(data);
    }
    const isFormData2 = utils$1.isFormData(data);
    if (isFormData2) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
    }
    if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
      return data;
    }
    if (utils$1.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils$1.isURLSearchParams(data)) {
      headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
      return data.toString();
    }
    let isFileList2;
    if (isObjectPayload) {
      if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }
      if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
        const _FormData = this.env && this.env.FormData;
        return toFormData$1(
          isFileList2 ? { "files[]": data } : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }
    if (isObjectPayload || hasJSONContentType) {
      headers.setContentType("application/json", false);
      return stringifySafely(data);
    }
    return data;
  }],
  transformResponse: [function transformResponse(data) {
    const transitional2 = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
    const JSONRequested = this.responseType === "json";
    if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
      return data;
    }
    if (data && utils$1.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
      const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === "SyntaxError") {
            throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }
    return data;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils$1.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
  defaults.headers[method] = {};
});
const ignoreDuplicateOf = utils$1.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
const parseHeaders = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};
const $internals = Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils$1.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils$1.isString(value)) return;
  if (utils$1.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils$1.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
let AxiosHeaders$1 = class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils$1.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError("Object iterator must return a key-value pair");
        }
        obj[key = entry[0]] = (dest = obj[key]) ? utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils$1.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed2 = new this(first);
    targets.forEach((target) => computed2.set(target));
    return computed2;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders$1.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils$1.freezeMethods(AxiosHeaders$1);
function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;
  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
function isCancel$1(value) {
  return !!(value && value.__CANCEL__);
}
function CanceledError$1(message, config, request) {
  AxiosError$1.call(this, message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
  this.name = "CanceledError";
}
utils$1.inherits(CanceledError$1, AxiosError$1, {
  __CANCEL__: true
});
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError$1(
      "Request failed with status code " + response.status,
      [AxiosError$1.ERR_BAD_REQUEST, AxiosError$1.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}
function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || "";
}
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);
  return throttle((e) => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;
    bytesNotified = loaded;
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [(loaded) => throttled[0]({
    lengthComputable,
    total,
    loaded
  }), throttled[1]];
};
const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
const isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url) => {
  url = new URL(url, platform.origin);
  return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;
const cookies = platform.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure) {
      const cookie = [name + "=" + encodeURIComponent(value)];
      utils$1.isNumber(expires) && cookie.push("expires=" + new Date(expires).toGMTString());
      utils$1.isString(path) && cookie.push("path=" + path);
      utils$1.isString(domain) && cookie.push("domain=" + domain);
      secure === true && cookie.push("secure");
      document.cookie = cookie.join("; ");
    },
    read(name) {
      const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function isAbsoluteURL(url) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
function mergeConfig$1(config1, config2) {
  config2 = config2 || {};
  const config = {};
  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({ caseless }, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils$1.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    const merge2 = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge2(config1[prop], config2[prop], prop);
    utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}
const resolveConfig = (config) => {
  const newConfig = mergeConfig$1({}, config);
  let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
  newConfig.headers = headers = AxiosHeaders$1.from(headers);
  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
    );
  }
  let contentType;
  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if ((contentType = headers.getContentType()) !== false) {
      const [type, ...tokens] = contentType ? contentType.split(";").map((token) => token.trim()).filter(Boolean) : [];
      headers.setContentType([type || "multipart/form-data", ...tokens].join("; "));
    }
  }
  if (platform.hasStandardBrowserEnv) {
    withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
    if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin(newConfig.url)) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
};
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
const xhrAdapter = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders$1.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
      request = null;
    };
    request.onerror = function handleError() {
      reject(new AxiosError$1("Network Error", AxiosError$1.ERR_NETWORK, config, request));
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(new AxiosError$1(
        timeoutErrorMessage,
        transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
        config,
        request
      ));
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
        request.abort();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError$1("Unsupported protocol " + protocol + ":", AxiosError$1.ERR_BAD_REQUEST, config));
      return;
    }
    request.send(requestData || null);
  });
};
const composeSignals = (signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err));
      }
    };
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError$1(`timeout ${timeout} of ms exceeded`, AxiosError$1.ETIMEDOUT));
    }, timeout);
    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    };
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils$1.asap(unsubscribe);
    return signal;
  }
};
const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done: done2, value } = await iterator2.next();
        if (done2) {
          _onFinish();
          controller.close();
          return;
        }
        let len = value.byteLength;
        if (onProgress) {
          let loadedBytes = bytes += len;
          onProgress(loadedBytes);
        }
        controller.enqueue(new Uint8Array(value));
      } catch (err) {
        _onFinish(err);
        throw err;
      }
    },
    cancel(reason) {
      _onFinish(reason);
      return iterator2.return();
    }
  }, {
    highWaterMark: 2
  });
};
const isFetchSupported = typeof fetch === "function" && typeof Request === "function" && typeof Response === "function";
const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === "function";
const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Response(str).arrayBuffer()));
const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
const supportsRequestStream = isReadableStreamSupported && test(() => {
  let duplexAccessed = false;
  const hasContentType = new Request(platform.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      duplexAccessed = true;
      return "half";
    }
  }).headers.has("Content-Type");
  return duplexAccessed && !hasContentType;
});
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const supportsResponseStream = isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
const resolvers = {
  stream: supportsResponseStream && ((res) => res.body)
};
isFetchSupported && ((res) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
    !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res2) => res2[type]() : (_, config) => {
      throw new AxiosError$1(`Response type '${type}' is not supported`, AxiosError$1.ERR_NOT_SUPPORT, config);
    });
  });
})(new Response());
const getBodyLength = async (body) => {
  if (body == null) {
    return 0;
  }
  if (utils$1.isBlob(body)) {
    return body.size;
  }
  if (utils$1.isSpecCompliantForm(body)) {
    const _request = new Request(platform.origin, {
      method: "POST",
      body
    });
    return (await _request.arrayBuffer()).byteLength;
  }
  if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
    return body.byteLength;
  }
  if (utils$1.isURLSearchParams(body)) {
    body = body + "";
  }
  if (utils$1.isString(body)) {
    return (await encodeText(body)).byteLength;
  }
};
const resolveBodyLength = async (headers, body) => {
  const length = utils$1.toFiniteNumber(headers.getContentLength());
  return length == null ? getBodyLength(body) : length;
};
const fetchAdapter = isFetchSupported && (async (config) => {
  let {
    url,
    method,
    data,
    signal,
    cancelToken,
    timeout,
    onDownloadProgress,
    onUploadProgress,
    responseType,
    headers,
    withCredentials = "same-origin",
    fetchOptions
  } = resolveConfig(config);
  responseType = responseType ? (responseType + "").toLowerCase() : "text";
  let composedSignal = composeSignals([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
  let request;
  const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
    composedSignal.unsubscribe();
  });
  let requestContentLength;
  try {
    if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
      let _request = new Request(url, {
        method: "POST",
        body: data,
        duplex: "half"
      });
      let contentTypeHeader;
      if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
        headers.setContentType(contentTypeHeader);
      }
      if (_request.body) {
        const [onProgress, flush] = progressEventDecorator(
          requestContentLength,
          progressEventReducer(asyncDecorator(onUploadProgress))
        );
        data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
      }
    }
    if (!utils$1.isString(withCredentials)) {
      withCredentials = withCredentials ? "include" : "omit";
    }
    const isCredentialsSupported = "credentials" in Request.prototype;
    request = new Request(url, {
      ...fetchOptions,
      signal: composedSignal,
      method: method.toUpperCase(),
      headers: headers.normalize().toJSON(),
      body: data,
      duplex: "half",
      credentials: isCredentialsSupported ? withCredentials : void 0
    });
    let response = await fetch(request, fetchOptions);
    const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
    if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
      const options = {};
      ["status", "statusText", "headers"].forEach((prop) => {
        options[prop] = response[prop];
      });
      const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
      const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
        responseContentLength,
        progressEventReducer(asyncDecorator(onDownloadProgress), true)
      ) || [];
      response = new Response(
        trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
          flush && flush();
          unsubscribe && unsubscribe();
        }),
        options
      );
    }
    responseType = responseType || "text";
    let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](response, config);
    !isStreamResponse && unsubscribe && unsubscribe();
    return await new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data: responseData,
        headers: AxiosHeaders$1.from(response.headers),
        status: response.status,
        statusText: response.statusText,
        config,
        request
      });
    });
  } catch (err) {
    unsubscribe && unsubscribe();
    if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
      throw Object.assign(
        new AxiosError$1("Network Error", AxiosError$1.ERR_NETWORK, config, request),
        {
          cause: err.cause || err
        }
      );
    }
    throw AxiosError$1.from(err, err && err.code, config, request);
  }
});
const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: fetchAdapter
};
utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { value });
  }
});
const renderReason = (reason) => `- ${reason}`;
const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
const adapters = {
  getAdapter: (adapters2) => {
    adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
    const { length } = adapters2;
    let nameOrAdapter;
    let adapter;
    const rejectedReasons = {};
    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters2[i];
      let id;
      adapter = nameOrAdapter;
      if (!isResolvedHandle(nameOrAdapter)) {
        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
        if (adapter === void 0) {
          throw new AxiosError$1(`Unknown adapter '${id}'`);
        }
      }
      if (adapter) {
        break;
      }
      rejectedReasons[id || "#" + i] = adapter;
    }
    if (!adapter) {
      const reasons = Object.entries(rejectedReasons).map(
        ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
      );
      let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
      throw new AxiosError$1(
        `There is no suitable adapter to dispatch the request ` + s,
        "ERR_NOT_SUPPORT"
      );
    }
    return adapter;
  },
  adapters: knownAdapters
};
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError$1(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders$1.from(config.headers);
  config.data = transformData.call(
    config,
    config.transformRequest
  );
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter);
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );
    response.headers = AxiosHeaders$1.from(response.headers);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel$1(reason)) {
      throwIfCancellationRequested(config);
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
      }
    }
    return Promise.reject(reason);
  });
}
const VERSION$1 = "1.11.0";
const validators$1 = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators$1[type] = function validator2(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
const deprecatedWarnings = {};
validators$1.transitional = function transitional(validator2, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator2 === false) {
      throw new AxiosError$1(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError$1.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator2 ? validator2(value, opt, opts) : true;
  };
};
validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator2 = schema[opt];
    if (validator2) {
      const value = options[opt];
      const result = value === void 0 || validator2(value, opt, options);
      if (result !== true) {
        throw new AxiosError$1("option " + opt + " must be " + result, AxiosError$1.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
    }
  }
}
const validator = {
  assertOptions,
  validators: validators$1
};
const validators = validator.validators;
let Axios$1 = class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
            err.stack += "\n" + stack;
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig$1(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator.assertOptions(transitional2, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }
    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: validators.function,
          serialize: validators.function
        }, true);
      }
    }
    if (config.allowAbsoluteUrls !== void 0) ;
    else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator.assertOptions(config, {
      baseUrl: validators.spelling("baseURL"),
      withXsrfToken: validators.spelling("withXSRFToken")
    }, true);
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils$1.merge(
      headers.common,
      headers[config.method]
    );
    headers && utils$1.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (method) => {
        delete headers[method];
      }
    );
    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    i = 0;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig$1(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios$1.prototype[method] = function(url, config) {
    return this.request(mergeConfig$1(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});
utils$1.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig$1(config || {}, {
        method,
        headers: isForm ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url,
        data
      }));
    };
  }
  Axios$1.prototype[method] = generateHTTPMethod();
  Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
});
let CancelToken$1 = class CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError$1(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
function spread$1(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}
function isAxiosError$1(payload) {
  return utils$1.isObject(payload) && payload.isAxiosError === true;
}
const HttpStatusCode$1 = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
  HttpStatusCode$1[value] = key;
});
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind(Axios$1.prototype.request, context);
  utils$1.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
  utils$1.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
  };
  return instance;
}
const axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
const {
  Axios: Axios2,
  AxiosError,
  CanceledError,
  isCancel,
  CancelToken: CancelToken2,
  VERSION,
  all: all2,
  Cancel,
  isAxiosError,
  spread,
  toFormData,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode,
  formToJSON,
  getAdapter,
  mergeConfig
} = axios;
const deleteLog$1 = (fileName, type, isSuccess = true, msg) => {
  window?.electron?.electronAPI.ipcRenderer ? sendRPC(
    IRPCActionType.GALLERY_LOG_DELETE_MSG,
    msg || `Delete ${fileName} on ${type} success`,
    isSuccess ? ILogType.success : ILogType.error
  ) : console.log(`Delete ${fileName} on ${type} success`);
};
const deleteFailedLog$1 = (fileName, type, error) => {
  deleteLog$1(fileName, type, false);
  window?.electron?.electronAPI.ipcRenderer ? sendRPC(IRPCActionType.GALLERY_LOG_DELETE_MSG, error, ILogType.error) : console.error(error);
};
class AlistApi {
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      const { version, url, uploadPath, token } = config;
      if (String(version) === "2") {
        deleteLog$1(fileName, "Alist", false, "Alist version 2 is not supported, deletion is skipped");
        return true;
      }
      const result = await axios.request({
        method: "post",
        url: `${url}/api/fs/remove`,
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        data: {
          dir: window.node.path.join("/", uploadPath, window.node.path.dirname(fileName)),
          names: [window.node.path.basename(fileName)]
        }
      });
      if (result.data.code === 200) {
        deleteLog$1(fileName, "Alist");
        return true;
      }
      deleteLog$1(fileName, "Alist", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "Alist", error);
      return false;
    }
  }
}
const getAListToken = async (url, username, password) => {
  const res = await axios.post(`${url}/api/auth/login`, {
    username,
    password
  });
  if (res.data.code === 200 && res.data.message === "success") {
    return res.data.data.token;
  }
};
class AListplistApi {
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      const { url, username, password, uploadPath } = config;
      let token = config.token;
      if (!token) {
        token = await getAListToken(url, username, password);
      }
      if (!url || !(token || username && password)) {
        deleteFailedLog$1(fileName, "Alist", "No valid token or username/password provided");
        return false;
      }
      const result = await axios.request({
        method: "post",
        url: `${url}/api/fs/remove`,
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        data: {
          dir: window.node.path.join("/", uploadPath, window.node.path.dirname(fileName)),
          names: [window.node.path.basename(fileName)]
        }
      });
      if (result.data.code === 200) {
        deleteLog$1(fileName, "Alist");
        return true;
      }
      deleteLog$1(fileName, "Alist", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "Alist", error);
      return false;
    }
  }
}
class AliyunApi {
  static #getKey(fileName, path) {
    return path && path !== "/" ? `${path.replace(/^\/+|\/+$/, "")}/${fileName}` : fileName;
  }
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      const client = new window.node.OSS({ ...config, region: config.area });
      const key = AliyunApi.#getKey(fileName, config.path);
      const result = await client.delete(key);
      if (result.res.status === 204) {
        deleteLog$1(fileName, "Aliyun");
        return true;
      }
      deleteLog$1(fileName, "Aliyun", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "Aliyun", error);
      return false;
    }
  }
}
let AwsS3Api$1 = class AwsS3Api {
  static async delete(configMap) {
    try {
      return await triggerRPC(IRPCActionType.GALLERY_DELETE_AWS_S3_FILE, getRawData(configMap)) || false;
    } catch (error) {
      deleteFailedLog$1(configMap.fileName, "AWS S3", error);
      return false;
    }
  }
};
class AwsS3Api2 {
  static async delete(configMap) {
    try {
      return await triggerRPC(IRPCActionType.GALLERY_DELETE_DOGE_FILE, getRawData(configMap)) || false;
    } catch (error) {
      deleteFailedLog$1(configMap.fileName, "DogeCloud", error);
      return false;
    }
  }
}
class GithubApi {
  static #createOctokit(token) {
    return new window.node.Octokit({
      auth: token
    });
  }
  static #createKey(path, fileName) {
    const formatedFileName = fileName.replace(/%2F/g, "/");
    return path && path !== "/" ? `${path.replace(/^\/+|\/+$/, "")}/${formatedFileName}` : formatedFileName;
  }
  static async delete(configMap) {
    const {
      fileName,
      hash,
      config: { repo, token, branch, path }
    } = configMap;
    const [owner, repoName] = repo.split("/");
    const octokit = GithubApi.#createOctokit(token);
    const key = GithubApi.#createKey(path, fileName);
    try {
      const { status } = await octokit.rest.repos.deleteFile({
        owner,
        repo: repoName,
        path: key,
        message: `delete ${fileName} by PicList`,
        sha: hash,
        branch
      });
      if (status === 200) {
        deleteLog$1(fileName, "GitHub");
        return true;
      }
      deleteLog$1(fileName, "GitHub", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "GitHub", error);
      return false;
    }
  }
}
class HuaweicloudApi {
  static async delete(configMap) {
    try {
      return await triggerRPC(IRPCActionType.GALLERY_DELETE_HUAWEI_OSS_FILE, getRawData(configMap)) || false;
    } catch (error) {
      deleteFailedLog$1(configMap.fileName, "HuaweiCloud", error);
      return false;
    }
  }
}
class ImgurApi {
  static #baseUrl = "https://api.imgur.com/3";
  static async delete(configMap) {
    const { config: { clientId = "", username = "", accessToken = "" } = {}, hash = "" } = configMap;
    let Authorization, apiUrl;
    if (username && accessToken) {
      Authorization = `Bearer ${accessToken}`;
      apiUrl = `${ImgurApi.#baseUrl}/account/${username}/image/${hash}`;
    } else if (clientId) {
      Authorization = `Client-ID ${clientId}`;
      apiUrl = `${ImgurApi.#baseUrl}/image/${hash}`;
    } else {
      deleteLog$1(hash, "Imgur", false, "No credentials found");
      return false;
    }
    try {
      const response = await axios.delete(apiUrl, {
        headers: { Authorization },
        timeout: 3e4
      });
      if (response.status === 200) {
        deleteLog$1(hash, "Imgur");
        return true;
      }
      deleteLog$1(hash, "Imgur", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(hash, "Imgur", error);
      return false;
    }
  }
}
class LocalApi {
  static async delete(configMap) {
    const { hash } = configMap;
    if (!hash) {
      deleteLog$1(hash, "Local", false, "Local.delete: invalid params");
      return false;
    }
    try {
      await window.node.fs.remove(hash);
      deleteLog$1(hash, "Local");
      return true;
    } catch (error) {
      deleteFailedLog$1(hash, "Local", error);
      return false;
    }
  }
}
class LskyplistApi {
  static async delete(configMap) {
    const { hash, config } = configMap;
    if (!hash || !config || !config.token) {
      deleteLog$1(hash, "Lskyplist", false, "LskyplistApi.delete: invalid params");
      return false;
    }
    const { host, token, version } = config;
    if (version !== "V2") {
      deleteLog$1(hash, "Lskyplist", false, "LskyplistApi.delete: invalid version");
      return false;
    }
    const v2Headers = {
      Accept: "application/json",
      Authorization: token || void 0
    };
    const requestAgent = new window.node.https.Agent({
      rejectUnauthorized: false
    });
    try {
      const response = await window.node.axios.delete(`${host}/api/v1/images/${hash}`, {
        headers: v2Headers,
        timeout: 3e4,
        httpsAgent: requestAgent
      });
      if (response.status === 200 && response.data.status === true) {
        deleteLog$1(hash, "Lskyplist");
        return true;
      }
      deleteLog$1(hash, "Lskyplist", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(hash, "Lskyplist", error);
      return false;
    }
  }
}
const deleteLog = (fileName, type, isSuccess = true, msg) => {
  console.log(`Delete ${fileName} on ${type} ${isSuccess ? "success" : "failed"}, message: ${msg || ""}`);
};
const deleteFailedLog = (fileName, type, error) => {
  deleteLog(fileName, type, false);
  console.error(error);
};
class PiclistApi {
  static async delete(configMap) {
    const { config, fullResult } = configMap;
    const { host, port } = config;
    if (!fullResult) return true;
    if (!host) {
      deleteLog(fullResult, "Piclist", false, "PiclistApi.delete: invalid params");
      return false;
    }
    const url = `http://${host || "127.0.0.1"}:${port || 36677}/delete`;
    try {
      const response = await window.node.axios.post(url, {
        list: [fullResult]
      });
      if (response.status === 200 && response.data?.success) {
        deleteLog(fullResult, "Piclist");
        return true;
      }
      deleteLog(fullResult, "Piclist", false);
      return false;
    } catch (error) {
      deleteFailedLog(fullResult, "Piclist", error);
      return false;
    }
  }
}
class QiniuApi {
  static async delete(configMap) {
    const {
      fileName,
      config: { accessKey, secretKey, bucket, path }
    } = configMap;
    const mac = new window.node.qiniu.auth.digest.Mac(accessKey, secretKey);
    const qiniuConfig = new window.node.qiniu.conf.Config();
    try {
      const bucketManager = new window.node.qiniu.rs.BucketManager(mac, qiniuConfig);
      const formattedPath = path?.replace(/^\/+|\/+$/, "") || "";
      const key = path === "/" || !path ? fileName : `${formattedPath}/${fileName}`;
      const res = await new Promise((resolve, reject) => {
        bucketManager.delete(bucket, key, (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              respBody,
              respInfo
            });
          }
        });
      });
      if (res?.respInfo?.statusCode === 200) {
        deleteLog(fileName, "Qiniu");
        return true;
      }
      deleteLog(fileName, "Qiniu", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Qiniu", error);
      return false;
    }
  }
}
class SftpPlistApi {
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      return await triggerRPC(IRPCActionType.GALLERY_DELETE_SFTP_FILE, getRawData(config), fileName) || false;
    } catch (error) {
      deleteFailedLog$1(fileName, "SFTP", error);
      return false;
    }
  }
}
class SmmsApi {
  static #baseUrl = "https://smms.app/api/v2";
  static async delete(configMap) {
    const { hash, config } = configMap;
    if (!hash || !config || !config.token) {
      deleteLog$1(hash, "Smms", false, "SmmsApi.delete: invalid params");
      return false;
    }
    const { token } = config;
    try {
      const response = await window.node.axios.get(`${SmmsApi.#baseUrl}/delete/${hash}`, {
        headers: {
          Authorization: token
        },
        params: {
          hash,
          format: "json"
        },
        timeout: 3e4
      });
      if (response.status === 200) {
        deleteLog$1(hash, "Smms");
        return true;
      }
      deleteLog$1(hash, "Smms", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(hash, "Smms", error);
      return false;
    }
  }
}
class TcyunApi {
  static #createCOS(SecretId, SecretKey) {
    return new window.node.COS({
      SecretId,
      SecretKey
    });
  }
  static async delete(configMap) {
    const {
      fileName,
      config: { secretId, secretKey, bucket, area, path }
    } = configMap;
    try {
      const cos = TcyunApi.#createCOS(secretId, secretKey);
      let key;
      if (path === "/" || !path) {
        key = `/${fileName}`;
      } else {
        key = `/${path.replace(/^\/+|\/+$/, "")}/${fileName}`;
      }
      const result = await cos.deleteObject({
        Bucket: bucket,
        Region: area,
        Key: key
      });
      if (result.statusCode === 204) {
        deleteLog$1(fileName, "Tcyun");
        return true;
      }
      deleteLog$1(fileName, "Tcyun", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "Tcyun", error);
      return false;
    }
  }
}
class UpyunApi {
  static async delete(configMap) {
    const {
      fileName,
      config: { bucket, operator, password, path }
    } = configMap;
    try {
      const service = new window.node.Upyun.Service(bucket, operator, password);
      const client = new window.node.Upyun.Client(service);
      let key;
      if (path === "/" || !path) {
        key = fileName;
      } else {
        key = `${path.replace(/^\/+|\/+$/, "")}/${fileName}`;
      }
      const result = await client.deleteFile(key);
      if (result) {
        deleteLog$1(fileName, "Upyun");
        return true;
      }
      deleteLog$1(fileName, "Upyun", false);
      return false;
    } catch (error) {
      deleteFailedLog$1(fileName, "Upyun", error);
      return false;
    }
  }
}
class WebdavApi {
  static async delete(configMap) {
    const {
      fileName,
      config: { host, username, password, path, sslEnabled, authType }
    } = configMap;
    const endpoint = formatEndpoint(host, sslEnabled);
    const options = {
      username,
      password
    };
    if (authType === "digest") {
      options.authType = window.node.webdav.AuthType.Digest;
    }
    const ctx = window.node.webdav.createClient(endpoint, options);
    let key;
    if (path === "/" || !path) {
      key = fileName;
    } else {
      key = `${path.replace(/^\/+|\/+$/, "")}/${fileName}`;
    }
    try {
      await ctx.deleteFile(key);
      deleteLog$1(fileName, "WebDAV");
      return true;
    } catch (error) {
      deleteFailedLog$1(fileName, "WebDAV", error);
      return false;
    }
  }
}
const apiMap = {
  alist: AlistApi,
  alistplist: AListplistApi,
  aliyun: AliyunApi,
  "aws-s3": AwsS3Api$1,
  "aws-s3-plist": AwsS3Api$1,
  dogecloud: AwsS3Api2,
  github: GithubApi,
  "huaweicloud-uploader": HuaweicloudApi,
  imgur: ImgurApi,
  local: LocalApi,
  lskyplist: LskyplistApi,
  piclist: PiclistApi,
  qiniu: QiniuApi,
  sftpplist: SftpPlistApi,
  smms: SmmsApi,
  tcyun: TcyunApi,
  upyun: UpyunApi,
  webdavplist: WebdavApi
};
class ALLApi {
  static async delete(configMap) {
    const api = apiMap[configMap.type];
    return api ? await api.delete(configMap) : false;
  }
}
const _hoisted_1 = { class: "view-title" };
const _hoisted_2 = { style: { "position": "absolute", "right": "0", "top": "0", "margin-right": "20px", "font-size": "0.8em", "color": "#fff" } };
const _hoisted_3 = ["onClick"];
const _hoisted_4 = { class: "gallery-list__item-img" };
const _hoisted_5 = ["title"];
const _hoisted_6 = { style: { "margin-top": "10px", "align-items": "center", "display": "flex", "justify-content": "flex-end" } };
const __default__ = {
  name: "GalleryPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const images = ref([]);
    const dialogVisible = ref(false);
    const imgInfo = reactive({
      id: "",
      imgUrl: ""
    });
    const $confirm = ElMessageBox.confirm;
    const choosedList = reactive({});
    const gallerySliderControl = reactive({
      visible: false,
      index: 0
    });
    const deleteCloud = ref(false);
    const choosedPicBed = ref([]);
    const lastChoosed = ref(-1);
    const isShiftKeyPress = ref(false);
    const searchText = ref("");
    const searchTextURL = ref("");
    const handleBarActive = ref(true);
    const pasteStyle = ref("");
    const pasteStyleMap = {
      Markdown: "markdown",
      HTML: "HTML",
      URL: "URL",
      UBB: "UBB",
      Custom: "Custom"
    };
    const useShortUrl = ref("");
    const shortURLMap = {
      [T("UPLOAD_SHORT_URL")]: T("UPLOAD_SHORT_URL"),
      [T("UPLOAD_NORMAL_URL")]: T("UPLOAD_NORMAL_URL")
    };
    const fileSortNameReverse = ref(false);
    const fileSortTimeReverse = ref(false);
    const fileSortExtReverse = ref(false);
    const isShowBatchRenameDialog = ref(false);
    const batchRenameMatch = ref("");
    const batchRenameReplace = ref("");
    const dateRange = ref("");
    const mathcedCount = computed(() => {
      return filterList.value.filter((item) => {
        return customStrMatch(item.imgUrl, batchRenameMatch.value);
      }).length;
    });
    onBeforeRouteUpdate((to, from) => {
      if (from.name === "gallery") {
        clearChoosedList();
      }
      if (to.name === "gallery") {
        updateGallery();
      }
    });
    async function initDeleteCloud() {
      deleteCloud.value = await getConfig(configPaths.settings.deleteCloudFile) || false;
    }
    onBeforeMount(async () => {
      window.electron.electronAPI.ipcRenderer.on("updateGallery", () => {
        nextTick(async () => {
          updateGallery();
        });
      });
      updateGallery();
      document.addEventListener("keydown", handleDetectShiftKey);
      document.addEventListener("keyup", handleDetectShiftKey);
    });
    function handleDetectShiftKey(event) {
      if (event.key === "Shift") {
        isShiftKeyPress.value = event.type === "keydown";
      }
    }
    const filterList = computed(() => {
      const res = getGallery();
      return res;
    });
    const addCacheBustParam = (url) => {
      if (!url) {
        return "";
      }
      if (!(url.startsWith("http://") || url.startsWith("https://"))) {
        return url;
      }
      try {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}cbplist=${(/* @__PURE__ */ new Date()).getTime()}`;
      } catch (e) {
        return url;
      }
    };
    const filterListWithCacheBust = computed(() => {
      const newList = filterList.value.map((item) => {
        const newItem = { ...item };
        if (newItem.imgUrl) {
          newItem.imgUrl = addCacheBustParam(newItem.imgUrl);
        }
        if (newItem.galleryPath) {
          newItem.galleryPath = addCacheBustParam(newItem.galleryPath);
        }
        newItem.src = addCacheBustParam(newItem.src || newItem.galleryPath || newItem.imgUrl || "");
        return newItem;
      });
      return newList;
    });
    const isAllSelected = computed(() => {
      return Object.values(choosedList).length > 0 && filterList.value.every((item) => choosedList[item.id]);
    });
    function formatFileName(name) {
      return window.node.path.basename(name);
    }
    function getGallery() {
      if (searchText.value || choosedPicBed.value.length > 0 || searchTextURL.value || dateRange.value) {
        return images.value.filter((item) => {
          let isInChoosedPicBed = true;
          let isIncludesSearchText = true;
          let isIncludesSearchTextURL = true;
          let isIncludesDateRange = true;
          if (choosedPicBed.value.length > 0) {
            isInChoosedPicBed = choosedPicBed.value.some((type) => type === item.type);
          }
          if (searchText.value) {
            isIncludesSearchText = customStrMatch(item.fileName || "", searchText.value);
          }
          if (searchTextURL.value) {
            isIncludesSearchTextURL = customStrMatch(item.imgUrl || "", searchTextURL.value);
          }
          if (dateRange.value) {
            const [start, end] = dateRange.value;
            const date = new Date(item.updatedAt).getTime();
            isIncludesDateRange = date >= new Date(start).getTime() && date <= new Date(end).getTime() + 864e5;
          }
          return isIncludesSearchText && isInChoosedPicBed && isIncludesSearchTextURL && isIncludesDateRange;
        }).map((item) => {
          return {
            ...item,
            src: item.galleryPath || item.imgUrl || "",
            key: item.id || `${Date.now()}`,
            intro: item.fileName || ""
          };
        });
      } else {
        return images.value.map((item) => {
          return {
            ...item,
            src: item.galleryPath || item.imgUrl || "",
            key: item.id || `${Date.now()}`,
            intro: item.fileName || ""
          };
        });
      }
    }
    async function updateGallery() {
      images.value = (await $$db.get({ orderBy: "desc" })).data;
    }
    watch(
      () => filterList,
      () => {
        clearChoosedList();
      }
    );
    function handleChooseImage(val, index) {
      if (val === true) {
        handleBarActive.value = true;
        if (lastChoosed.value !== -1 && isShiftKeyPress.value) {
          const min = Math.min(lastChoosed.value, index);
          const max = Math.max(lastChoosed.value, index);
          for (let i = min + 1; i < max; i++) {
            const id = filterList.value[i].id;
            choosedList[id] = true;
          }
        }
        lastChoosed.value = index;
      }
    }
    function refreshPage() {
      sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW);
    }
    function clearChoosedList() {
      isShiftKeyPress.value = false;
      Object.keys(choosedList).forEach((key) => {
        choosedList[key] = false;
      });
      lastChoosed.value = -1;
    }
    function zoomImage(index) {
      gallerySliderControl.index = index;
      gallerySliderControl.visible = true;
      changeZIndexForGallery(true);
    }
    function changeZIndexForGallery(isOpen) {
      if (isOpen) {
        document.querySelector(".main-content.el-row").style.zIndex = 101;
      } else {
        document.querySelector(".main-content.el-row").style.zIndex = 10;
      }
    }
    function handleClose() {
      gallerySliderControl.index = 0;
      gallerySliderControl.visible = false;
      changeZIndexForGallery(false);
    }
    async function copy(item) {
      item.config = JSON.parse(JSON.stringify(item.config) || "{}");
      const result = await triggerRPC(IRPCActionType.GALLERY_PASTE_TEXT, item);
      if (result && result[1] && item.id) {
        await $$db.updateById(item.id, {
          shortUrl: result[1]
        });
      }
      const obj = {
        title: T("COPY_LINK_SUCCEED"),
        body: result ? result[0] : ""
      };
      const myNotification = new Notification(obj.title, obj);
      myNotification.onclick = () => {
        return true;
      };
      updateGallery();
    }
    function remove(item) {
      if (!item.id) return;
      $confirm(T("TIPS_REMOVE_LINK"), T("TIPS_NOTICE"), {
        confirmButtonText: T("CONFIRM"),
        cancelButtonText: T("CANCEL"),
        type: "warning"
      }).then(async () => {
        const file = await $$db.getById(item.id);
        if (await getConfig(configPaths.settings.deleteCloudFile) && picBedsCanbeDeleted.includes(item?.type || "placeholder")) {
          const result = await ALLApi.delete(item);
          if (result) {
            ElNotification({
              title: T("GALLERY_SYNC_DELETE_NOTICE_TITLE"),
              message: `${item.fileName} ${T("GALLERY_SYNC_DELETE_NOTICE_SUCCEED")}`,
              type: "success"
            });
          } else {
            ElNotification({
              title: T("GALLERY_SYNC_DELETE_NOTICE_TITLE"),
              message: `${item.fileName} ${T("GALLERY_SYNC_DELETE_NOTICE_FAILED")}`,
              type: "error"
            });
            return true;
          }
        }
        await $$db.removeById(item.id);
        sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, [file]);
        const obj = {
          title: T("OPERATION_SUCCEED"),
          body: ""
        };
        const myNotification = new Notification(obj.title, obj);
        myNotification.onclick = () => {
          return true;
        };
        updateGallery();
      }).catch((e) => {
        console.log(e);
        return true;
      });
    }
    function handleDeleteCloudFile(val) {
      saveConfig({
        [configPaths.settings.deleteCloudFile]: val
      });
    }
    function openDialog(item) {
      imgInfo.id = item.id;
      imgInfo.imgUrl = item.imgUrl;
      dialogVisible.value = true;
    }
    async function confirmModify() {
      await $$db.updateById(imgInfo.id, {
        imgUrl: imgInfo.imgUrl
      });
      const obj = {
        title: T("CHANGE_IMAGE_URL_SUCCEED"),
        body: imgInfo.imgUrl
      };
      const myNotification = new Notification(obj.title, obj);
      myNotification.onclick = () => {
        return true;
      };
      dialogVisible.value = false;
      updateGallery();
    }
    function cleanSearch() {
      searchText.value = "";
    }
    function cleanSearchUrl() {
      searchTextURL.value = "";
    }
    function isMultiple(obj) {
      return Object.values(obj).some((item) => item);
    }
    function toggleSelectAll() {
      const result = !isAllSelected.value;
      filterList.value.forEach((item) => {
        choosedList[item.id] = result;
      });
    }
    function multiRemove() {
      const multiRemoveNumber = Object.values(choosedList).filter((item) => item).length;
      if (multiRemoveNumber) {
        $confirm(
          T("TIPS_WILL_REMOVE_CHOOSED_IMAGES", {
            m: multiRemoveNumber
          }),
          T("TIPS_NOTICE"),
          {
            confirmButtonText: T("CONFIRM"),
            cancelButtonText: T("CANCEL"),
            type: "warning"
          }
        ).then(async () => {
          const files = [];
          const imageIDList = Object.keys(choosedList);
          const isDeleteCloudFile = await getConfig(configPaths.settings.deleteCloudFile);
          if (isDeleteCloudFile) {
            for (const imageIDListItem of imageIDList) {
              const key = imageIDListItem;
              if (choosedList[key]) {
                const file = await $$db.getById(key);
                if (file) {
                  if (file.type !== void 0 && picBedsCanbeDeleted.includes(file.type)) {
                    const result = await ALLApi.delete(file);
                    if (result) {
                      ElNotification({
                        title: T("GALLERY_SYNC_DELETE"),
                        message: `${file.fileName} ${T("GALLERY_SYNC_DELETE_NOTICE_SUCCEED")}`,
                        type: "success",
                        duration: multiRemoveNumber > 5 ? 1e3 : 2e3
                      });
                      files.push(file);
                      await $$db.removeById(key);
                    } else {
                      ElNotification({
                        title: T("GALLERY_SYNC_DELETE"),
                        message: `${file.fileName} ${T("GALLERY_SYNC_DELETE_NOTICE_FAILED")}`,
                        type: "error",
                        duration: multiRemoveNumber > 5 ? 1e3 : 2e3
                      });
                    }
                  } else {
                    files.push(file);
                    await $$db.removeById(key);
                  }
                }
              }
            }
          } else {
            for (const imageIDListItem of imageIDList) {
              const key = imageIDListItem;
              if (choosedList[key]) {
                const file = await $$db.getById(key);
                if (file) {
                  files.push(file);
                  await $$db.removeById(key);
                }
              }
            }
          }
          clearChoosedList();
          const obj = {
            title: T("OPERATION_SUCCEED"),
            body: ""
          };
          sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, files);
          const myNotification = new Notification(obj.title, obj);
          myNotification.onclick = () => {
            return true;
          };
          updateGallery();
        }).catch(() => {
          return true;
        });
      }
    }
    async function multiCopy() {
      if (Object.values(choosedList).some((item) => item)) {
        const copyString = [];
        const imageIDList = Object.keys(choosedList);
        for (const imageIDListItem of imageIDList) {
          const key = imageIDListItem;
          if (choosedList[key]) {
            const item = await $$db.getById(key);
            if (item) {
              const result = await triggerRPC(IRPCActionType.GALLERY_PASTE_TEXT, item);
              copyString.push(result ? result[0] : "");
              if (result && result[1] && item.id) {
                await $$db.updateById(item.id, {
                  shortUrl: result[1]
                });
              }
              choosedList[key] = false;
            }
          }
        }
        const obj = {
          title: T("BATCH_COPY_LINK_SUCCEED"),
          body: copyString.join("\n")
        };
        const myNotification = new Notification(obj.title, obj);
        window.electron.clipboard.writeText(copyString.join("\n"));
        myNotification.onclick = () => {
          return true;
        };
        updateGallery();
      }
    }
    function toggleHandleBar() {
      handleBarActive.value = !handleBarActive.value;
    }
    async function handlePasteStyleChange(val) {
      saveConfig(configPaths.settings.pasteStyle, val);
      pasteStyle.value = val;
    }
    function handleUseShortUrlChange(value) {
      saveConfig(configPaths.settings.useShortUrl, value === T("UPLOAD_SHORT_URL"));
      useShortUrl.value = value;
    }
    function sortFile(type) {
      switch (type) {
        case "name":
          fileSortNameReverse.value = !fileSortNameReverse.value;
          images.value.sort((a, b) => {
            if (fileSortNameReverse.value) {
              return a.fileName.localeCompare(b.fileName);
            } else {
              return b.fileName.localeCompare(a.fileName);
            }
          });
          break;
        case "time":
          fileSortTimeReverse.value = !fileSortTimeReverse.value;
          images.value.sort((a, b) => {
            if (fileSortTimeReverse.value) {
              return a.updatedAt - b.updatedAt;
            } else {
              return b.updatedAt - a.updatedAt;
            }
          });
          break;
        case "ext":
          fileSortExtReverse.value = !fileSortExtReverse.value;
          images.value.sort((a, b) => {
            if (fileSortExtReverse.value) {
              return a.extname.localeCompare(b.extname);
            } else {
              return b.extname.localeCompare(a.extname);
            }
          });
          break;
        case "check":
          images.value.sort((a, b) => {
            if (choosedList[a.id] && !choosedList[b.id]) {
              return -1;
            } else if (!choosedList[a.id] && choosedList[b.id]) {
              return 1;
            } else {
              return 0;
            }
          });
          break;
      }
    }
    function handleBatchRename() {
      isShowBatchRenameDialog.value = false;
      if (batchRenameMatch.value === "") {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG"));
        return;
      }
      let matchedFiles = [];
      filterList.value.forEach((item) => {
        if (customStrMatch(item.imgUrl, batchRenameMatch.value)) {
          matchedFiles.push(item);
        }
      });
      if (matchedFiles.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG2"));
        return;
      }
      for (const matchedFile of matchedFiles) {
        matchedFile.newUrl = customStrReplace(matchedFile.imgUrl, batchRenameMatch.value, batchRenameReplace.value);
      }
      matchedFiles = matchedFiles.filter((item) => item.imgUrl !== item.newUrl);
      if (matchedFiles.length === 0) {
        ElMessage.warning(T("MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG3"));
      }
      for (let i = 0; i < matchedFiles.length; i++) {
        matchedFiles[i].newUrl = matchedFiles[i].newUrl.replaceAll("{auto}", (i + 1).toString());
      }
      const duplicateFilesNum = matchedFiles.filter(
        (item) => matchedFiles.filter((item2) => item2.newUrl === item.newUrl).length > 1
      ).length;
      const renamefunc = async (item) => {
        await $$db.updateById(item.id, {
          imgUrl: item.newUrl
        });
      };
      const rename = () => {
        const promiseList = [];
        for (const matchedFile of matchedFiles) {
          promiseList.push(renamefunc(matchedFile));
        }
        Promise.all(promiseList).then(() => {
          const obj = {
            title: T("OPERATION_SUCCEED"),
            body: ""
          };
          const myNotification = new Notification(obj.title, obj);
          myNotification.onclick = () => {
            return true;
          };
          updateGallery();
        }).catch(() => {
          return true;
        });
      };
      if (duplicateFilesNum > 0) {
        ElMessageBox.confirm(
          `${T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_A")} ${duplicateFilesNum} ${T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_B")}`,
          T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_C"),
          {
            confirmButtonText: T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_CONFIRM"),
            cancelButtonText: T("MANAGE_BUCKET_BATCH_RENAME_REPEATED_CANCEL"),
            type: "warning"
          }
        ).then(() => {
          rename();
        }).catch(() => {
          ElMessage.info(T("MANAGE_BUCKET_BATCH_RENAME_CANCEL"));
        });
      } else {
        rename();
      }
    }
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeAllListeners("updateGallery");
    });
    onActivated(async () => {
      pasteStyle.value = await getConfig(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      useShortUrl.value = await getConfig(configPaths.settings.useShortUrl) ? T("UPLOAD_SHORT_URL") : T("UPLOAD_NORMAL_URL");
      initDeleteCloud();
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_switch = resolveComponent("el-switch");
      const _component_el_tooltip = resolveComponent("el-tooltip");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_col = resolveComponent("el-col");
      const _component_el_date_picker = resolveComponent("el-date-picker");
      const _component_el_divider = resolveComponent("el-divider");
      const _component_el_dropdown_item = resolveComponent("el-dropdown-item");
      const _component_el_dropdown = resolveComponent("el-dropdown");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_input = resolveComponent("el-input");
      const _component_photo_slider = resolveComponent("photo-slider");
      const _component_el_checkbox = resolveComponent("el-checkbox");
      const _component_el_dialog = resolveComponent("el-dialog");
      const _component_el_link = resolveComponent("el-link");
      const _component_el_descriptions_item = resolveComponent("el-descriptions-item");
      const _component_el_descriptions = resolveComponent("el-descriptions");
      const _component_el_popover = resolveComponent("el-popover");
      const _directive_lazy = resolveDirective("lazy");
      return openBlock(), createElementBlock("div", {
        id: "gallery-view",
        style: normalizeStyle(handleBarActive.value ? "height: 85%;" : "height: 95%;")
      }, [
        createBaseVNode("div", _hoisted_1, [
          createTextVNode(toDisplayString(unref(T)("GALLERY")) + " - " + toDisplayString(filterList.value.length) + " ", 1),
          createVNode(_component_el_icon, {
            style: { "margin-left": "4px" },
            class: "cursor-pointer",
            onClick: toggleHandleBar
          }, {
            default: withCtx(() => [
              withDirectives(createVNode(unref(caret_bottom_default), null, null, 512), [
                [vShow, !handleBarActive.value]
              ]),
              withDirectives(createVNode(unref(caret_top_default), null, null, 512), [
                [vShow, handleBarActive.value]
              ])
            ]),
            _: 1
          }),
          createBaseVNode("span", _hoisted_2, [
            createTextVNode(toDisplayString(unref(T)("GALLERY_SYNC_DELETE")) + " ", 1),
            createVNode(_component_el_switch, {
              modelValue: deleteCloud.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => deleteCloud.value = $event),
              "active-text": unref(T)("SETTINGS_OPEN"),
              "inactive-text": unref(T)("SETTINGS_CLOSE"),
              onChange: handleDeleteCloudFile
            }, null, 8, ["modelValue", "active-text", "inactive-text"]),
            createVNode(_component_el_button, {
              type: "primary",
              link: true,
              onClick: refreshPage
            }, {
              default: withCtx(() => [
                createVNode(_component_el_tooltip, {
                  class: "item",
                  effect: "dark",
                  content: unref(T)("REFRESH"),
                  placement: "bottom",
                  persistent: false,
                  teleported: ""
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_icon, {
                      size: "25",
                      style: { "cursor": "pointer", "margin-left": "10px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(unref(refresh_default))
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }, 8, ["content"])
              ]),
              _: 1
            })
          ])
        ]),
        createVNode(Transition, { name: "el-zoom-in-top" }, {
          default: withCtx(() => [
            withDirectives(createVNode(_component_el_row, null, {
              default: withCtx(() => [
                createVNode(_component_el_col, {
                  span: 22,
                  offset: 1
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_row, {
                      class: "handle-bar",
                      gutter: 16
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_col, { span: 5 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_select, {
                              modelValue: choosedPicBed.value,
                              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => choosedPicBed.value = $event),
                              multiple: "",
                              "collapse-tags": "",
                              size: "small",
                              style: { "width": "100%" },
                              placeholder: unref(T)("CHOOSE_SHOWED_PICBED"),
                              persistent: false,
                              teleported: ""
                            }, {
                              default: withCtx(() => [
                                (openBlock(true), createElementBlock(Fragment, null, renderList(unref(picBedGlobal), (item) => {
                                  return openBlock(), createBlock(_component_el_option, {
                                    key: item.type,
                                    label: item.name,
                                    value: item.type
                                  }, null, 8, ["label", "value"]);
                                }), 128))
                              ]),
                              _: 1
                            }, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 10 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_date_picker, {
                              modelValue: dateRange.value,
                              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => dateRange.value = $event),
                              type: "daterange",
                              "unlink-panels": "",
                              "range-separator": "To",
                              "start-placeholder": "Start date",
                              "end-placeholder": "End date",
                              size: "small",
                              teleported: ""
                            }, null, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 1 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_divider, {
                              direction: "vertical",
                              style: { "height": "100%" },
                              "border-style": "hidden"
                            })
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_select, {
                              modelValue: pasteStyle.value,
                              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => pasteStyle.value = $event),
                              size: "small",
                              style: { "width": "100%" },
                              placeholder: unref(T)("CHOOSE_PASTE_FORMAT"),
                              persistent: false,
                              teleported: "",
                              onChange: handlePasteStyleChange
                            }, {
                              default: withCtx(() => [
                                (openBlock(), createElementBlock(Fragment, null, renderList(pasteStyleMap, (value, key) => {
                                  return createVNode(_component_el_option, {
                                    key,
                                    label: key,
                                    value
                                  }, null, 8, ["label", "value"]);
                                }), 64))
                              ]),
                              _: 1
                            }, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_select, {
                              modelValue: useShortUrl.value,
                              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => useShortUrl.value = $event),
                              size: "small",
                              style: { "width": "100%" },
                              placeholder: "Choose",
                              persistent: false,
                              teleported: "",
                              onChange: handleUseShortUrlChange
                            }, {
                              default: withCtx(() => [
                                (openBlock(), createElementBlock(Fragment, null, renderList(shortURLMap, (value, key) => {
                                  return createVNode(_component_el_option, {
                                    key,
                                    label: key,
                                    value
                                  }, null, 8, ["label", "value"]);
                                }), 64))
                              ]),
                              _: 1
                            }, 8, ["modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 2 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_dropdown, { teleported: "" }, {
                              dropdown: withCtx(() => [
                                createVNode(_component_el_dropdown_item, {
                                  onClick: _cache[5] || (_cache[5] = ($event) => sortFile("name"))
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_NAME")), 1)
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_el_dropdown_item, {
                                  onClick: _cache[6] || (_cache[6] = ($event) => sortFile("ext"))
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_EXT")), 1)
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_el_dropdown_item, {
                                  onClick: _cache[7] || (_cache[7] = ($event) => sortFile("time"))
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_TIME")), 1)
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_el_dropdown_item, {
                                  onClick: _cache[8] || (_cache[8] = ($event) => sortFile("check"))
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_CHECK")), 1)
                                  ]),
                                  _: 1
                                })
                              ]),
                              default: withCtx(() => [
                                createVNode(_component_el_button, {
                                  size: "small",
                                  type: "primary",
                                  icon: unref(sort_default)
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_SORT_TITLE")), 1)
                                  ]),
                                  _: 1
                                }, 8, ["icon"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    createVNode(_component_el_row, {
                      class: "handle-bar",
                      gutter: 16
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_col, { span: 5 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_input, {
                              modelValue: searchText.value,
                              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => searchText.value = $event),
                              placeholder: unref(T)("GALLERY_SEARCH_FILENAME"),
                              size: "small"
                            }, {
                              suffix: withCtx(() => [
                                createVNode(_component_el_icon, {
                                  class: "el-input__icon",
                                  style: { "cursor": "pointer" },
                                  onClick: cleanSearch
                                }, {
                                  default: withCtx(() => [
                                    createVNode(unref(close_default))
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 6 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_input, {
                              modelValue: searchTextURL.value,
                              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => searchTextURL.value = $event),
                              placeholder: unref(T)("GALLERY_SEARCH_URL"),
                              size: "small"
                            }, {
                              suffix: withCtx(() => [
                                createVNode(_component_el_icon, {
                                  class: "el-input__icon",
                                  style: { "cursor": "pointer" },
                                  onClick: cleanSearchUrl
                                }, {
                                  default: withCtx(() => [
                                    createVNode(unref(close_default))
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["modelValue", "placeholder"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 1 }, {
                          default: withCtx(() => [
                            createVNode(_component_el_divider, {
                              direction: "vertical",
                              style: { "height": "100%" },
                              "border-style": "hidden"
                            })
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createBaseVNode("div", {
                              class: normalizeClass(["item-base copy round", { active: isMultiple(choosedList) }]),
                              onClick: multiCopy
                            }, toDisplayString(unref(T)("COPY")), 3)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createBaseVNode("div", {
                              class: normalizeClass(["item-base all-pick round", { active: filterList.value.length > 0 }]),
                              onClick: _cache[11] || (_cache[11] = () => isShowBatchRenameDialog.value = true)
                            }, toDisplayString(unref(T)("GALLERY_CHANGE_URL")), 3)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createBaseVNode("div", {
                              class: normalizeClass(["item-base delete round", { active: isMultiple(choosedList) }]),
                              onClick: multiRemove
                            }, toDisplayString(unref(T)("DELETE")), 3)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_el_col, { span: 3 }, {
                          default: withCtx(() => [
                            createBaseVNode("div", {
                              class: normalizeClass(["item-base all-pick round", { active: filterList.value.length > 0 }]),
                              onClick: toggleSelectAll
                            }, toDisplayString(isAllSelected.value ? unref(T)("CANCEL") : unref(T)("SELECT_ALL")), 3)
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
            }, 512), [
              [vShow, handleBarActive.value]
            ])
          ]),
          _: 1
        }),
        createVNode(_component_el_row, {
          class: normalizeClass(["gallery-list", { small: handleBarActive.value }])
        }, {
          default: withCtx(() => [
            createVNode(_component_el_col, {
              span: 22,
              offset: 1
            }, {
              default: withCtx(() => [
                createVNode(_component_el_row, { gutter: 16 }, {
                  default: withCtx(() => [
                    createVNode(_component_photo_slider, {
                      items: filterListWithCacheBust.value,
                      visible: gallerySliderControl.visible,
                      index: gallerySliderControl.index,
                      "should-transition": true,
                      onChangeIndex: zoomImage,
                      onClickMask: handleClose,
                      onCloseModal: handleClose
                    }, null, 8, ["items", "visible", "index"]),
                    (openBlock(true), createElementBlock(Fragment, null, renderList(filterList.value, (item, index) => {
                      return openBlock(), createBlock(_component_el_col, {
                        key: item.id,
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 4,
                        xl: 2,
                        class: "gallery-list__img"
                      }, {
                        default: withCtx(() => [
                          createBaseVNode("div", {
                            class: "gallery-list__item",
                            onClick: ($event) => zoomImage(index)
                          }, [
                            withDirectives(createBaseVNode("img", _hoisted_4, null, 512), [
                              [_directive_lazy, {
                                src: addCacheBustParam(item.galleryPath) || addCacheBustParam(item.imgUrl)
                              }]
                            ])
                          ], 8, _hoisted_3),
                          createBaseVNode("div", {
                            class: "gallery-list__file-name",
                            title: item.fileName
                          }, toDisplayString(formatFileName(item.fileName || "")), 9, _hoisted_5),
                          createVNode(_component_el_row, {
                            class: "gallery-list__tool-panel",
                            justify: "space-between",
                            align: "middle"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_el_row, null, {
                                default: withCtx(() => [
                                  createVNode(_component_el_icon, {
                                    class: "cursor-pointer document",
                                    onClick: ($event) => copy(item)
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(unref(document_default))
                                    ]),
                                    _: 2
                                  }, 1032, ["onClick"]),
                                  createVNode(_component_el_icon, {
                                    class: "cursor-pointer edit",
                                    onClick: ($event) => openDialog(item)
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(unref(edit_default))
                                    ]),
                                    _: 2
                                  }, 1032, ["onClick"]),
                                  createVNode(_component_el_icon, {
                                    class: "cursor-pointer delete",
                                    onClick: ($event) => remove(item)
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(unref(delete_default))
                                    ]),
                                    _: 2
                                  }, 1032, ["onClick"])
                                ]),
                                _: 2
                              }, 1024),
                              createVNode(_component_el_checkbox, {
                                modelValue: choosedList[item.id ? item.id : ""],
                                "onUpdate:modelValue": ($event) => choosedList[item.id ? item.id : ""] = $event,
                                onChange: (val) => handleChooseImage(val, index)
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "onChange"])
                            ]),
                            _: 2
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
            })
          ]),
          _: 1
        }, 8, ["class"]),
        createVNode(_component_el_dialog, {
          modelValue: dialogVisible.value,
          "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => dialogVisible.value = $event),
          title: unref(T)("CHANGE_IMAGE_URL"),
          width: "500px",
          "modal-append-to-body": false,
          "append-to-body": ""
        }, {
          footer: withCtx(() => [
            createVNode(_component_el_button, {
              onClick: _cache[13] || (_cache[13] = ($event) => dialogVisible.value = false)
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
              ]),
              _: 1
            }),
            createVNode(_component_el_button, {
              type: "primary",
              onClick: confirmModify
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
              ]),
              _: 1
            })
          ]),
          default: withCtx(() => [
            createVNode(_component_el_input, {
              modelValue: imgInfo.imgUrl,
              "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => imgInfo.imgUrl = $event)
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_component_el_dialog, {
          modelValue: isShowBatchRenameDialog.value,
          "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => isShowBatchRenameDialog.value = $event),
          title: unref(T)("CHANGE_IMAGE_URL"),
          center: "",
          "align-center": "",
          draggable: "",
          "destroy-on-close": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_el_link, {
              underline: false,
              style: { "margin-bottom": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A") + unref(T)("GALLERY_MATCHED") + mathcedCount.value + " ") + " ", 1),
                  createVNode(_component_el_tooltip, {
                    effect: "dark",
                    content: unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A_TIPS"),
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
                    _: 1
                  }, 8, ["content"])
                ])
              ]),
              _: 1
            }),
            createVNode(_component_el_input, {
              modelValue: batchRenameMatch.value,
              "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => batchRenameMatch.value = $event),
              placeholder: unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_A_PLACEHOLDER"),
              clearable: ""
            }, null, 8, ["modelValue", "placeholder"]),
            createVNode(_component_el_link, {
              underline: false,
              style: { "margin-bottom": "10px", "margin-top": "10px" }
            }, {
              default: withCtx(() => [
                createBaseVNode("span", null, [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_INPUT_B")) + " ", 1),
                  createVNode(_component_el_popover, {
                    effect: "light",
                    placement: "right",
                    width: "280",
                    persistent: false,
                    teleported: ""
                  }, {
                    reference: withCtx(() => [
                      createVNode(_component_el_icon, { color: "#409EFF" }, {
                        default: withCtx(() => [
                          createVNode(unref(info_filled_default))
                        ]),
                        _: 1
                      })
                    ]),
                    default: withCtx(() => [
                      createVNode(_component_el_descriptions, {
                        column: 1,
                        style: { "width": "250px" },
                        border: ""
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(customRenameFormatTable), (item, index) => {
                            return openBlock(), createBlock(_component_el_descriptions_item, {
                              key: index,
                              label: item.placeholder,
                              align: "center",
                              "label-style": "width: 100px;"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(item.description), 1)
                              ]),
                              _: 2
                            }, 1032, ["label"]);
                          }), 128)),
                          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(customRenameFormatTable).slice(0, unref(customRenameFormatTable).length - 1), (item, index) => {
                            return openBlock(), createBlock(_component_el_descriptions_item, {
                              key: index,
                              label: item.placeholderB,
                              align: "center",
                              "label-style": "width: 100px;"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(item.descriptionB), 1)
                              ]),
                              _: 2
                            }, 1032, ["label"]);
                          }), 128)),
                          createVNode(_component_el_descriptions_item, {
                            label: "{auto}",
                            align: "center",
                            "label-style": "width: 100px;"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_TABLE_IID")), 1)
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ])
              ]),
              _: 1
            }),
            createVNode(_component_el_input, {
              modelValue: batchRenameReplace.value,
              "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => batchRenameReplace.value = $event),
              placeholder: "Ex. {Y}-{m}-{uuid}",
              clearable: ""
            }, null, 8, ["modelValue"]),
            createBaseVNode("div", _hoisted_6, [
              createVNode(_component_el_button, {
                type: "danger",
                style: { "margin-right": "30px" },
                plain: "",
                icon: unref(close_default),
                onClick: _cache[17] || (_cache[17] = () => {
                  isShowBatchRenameDialog.value = false;
                })
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_CANCEL")), 1)
                ]),
                _: 1
              }, 8, ["icon"]),
              createVNode(_component_el_button, {
                type: "primary",
                plain: "",
                icon: unref(edit_default),
                onClick: _cache[18] || (_cache[18] = ($event) => handleBatchRename())
              }, {
                default: withCtx(() => [
                  createTextVNode(toDisplayString(unref(T)("MANAGE_BUCKET_RENAME_FILE_CONFIRM")), 1)
                ]),
                _: 1
              }, 8, ["icon"])
            ])
          ]),
          _: 1
        }, 8, ["modelValue", "title"])
      ], 4);
    };
  }
});
export {
  _sfc_main as default
};
