import crypto from "node:crypto";
import https from "node:https";
import path from "node:path";
import { ObjectAdapter, I18n } from "@piclist/i18n";
import OSS from "ali-oss";
import COS from "cos-nodejs-sdk-v5";
import { contextBridge, ipcRenderer, clipboard, webFrame } from "electron";
import fs from "fs-extra";
import yaml from "js-yaml";
import mime from "mime-types";
import qiniu from "qiniu";
import Upyun from "upyun";
import { isRef, unref, isReactive, toRaw } from "vue";
const RPC_ACTIONS = "RPC_ACTIONS";
const RPC_ACTIONS_INVOKE = "RPC_ACTIONS_INVOKE";
let i18nObj = null;
const getRawData = (args) => {
  if (isRef(args)) return unref(args);
  if (isReactive(args)) return toRaw(args);
  if (Array.isArray(args)) return args.map(getRawData);
  if (typeof args === "object" && args !== null) {
    const data = {};
    for (const key in args) {
      data[key] = getRawData(args[key]);
    }
    return data;
  }
  return args;
};
function sendToMain(channel, ...args) {
  ipcRenderer.send(channel, ...getRawData(args));
}
function sendRPC(action, ...args) {
  ipcRenderer.send(RPC_ACTIONS, action, getRawData(args));
}
async function triggerRPC(action, ...args) {
  return await ipcRenderer.invoke(RPC_ACTIONS_INVOKE, action, getRawData(args));
}
function sendRpcSync(action, ...args) {
  return ipcRenderer.sendSync(RPC_ACTIONS, action, getRawData(args));
}
try {
  contextBridge.exposeInMainWorld("electron", {
    setVisualZoomLevelLimits: (min, max) => {
      webFrame.setVisualZoomLevelLimits(min, max);
    },
    clipboard: {
      writeText: clipboard.writeText
    },
    sendRpcSync,
    triggerRPC,
    sendToMain,
    sendRPC,
    ipcRendererOn: (channel, listener) => {
      ipcRenderer.on(channel, listener);
    },
    ipcRendererRemoveListener: (channel, listener) => {
      ipcRenderer.removeListener(channel, listener);
    }
  });
  contextBridge.exposeInMainWorld("node", {
    path: {
      join: path.join,
      dirname: path.dirname,
      basename: path.basename,
      normalize: path.normalize,
      extname: path.extname,
      sep: path.sep,
      posix: {
        sep: path.posix.sep
      }
    },
    fs: {
      remove: fs.remove,
      readFile: fs.readFile,
      statSync: fs.statSync
    },
    crypto: {
      randomBytes: crypto.randomBytes,
      createHash: crypto.createHash
    },
    https: {
      Agent: https.Agent
    },
    qiniu: {
      auth: qiniu.auth,
      rs: qiniu.rs,
      conf: qiniu.conf
    },
    COS,
    OSS,
    Upyun: {
      Service: Upyun.Service,
      Client: Upyun.Client
    },
    yaml: {
      load: yaml.load
    },
    mime: {
      lookup: mime.lookup
    }
  });
  contextBridge.exposeInMainWorld("i18n", {
    setLocales: (lang, locales) => {
      const objectAdapter = new ObjectAdapter({
        [lang]: locales
      });
      i18nObj = new I18n({
        adapter: objectAdapter,
        defaultLanguage: lang
      });
    },
    translate: (key, args = {}) => {
      return i18nObj?.translate(key, args) || key;
    }
  });
} catch (error) {
  console.error(error);
}
export {
  getRawData
};
