import path from "node:path";
import util$1, { promisify } from "node:util";
import fs from "fs-extra";
import { app, BrowserWindow, clipboard, Notification, dialog, shell, ipcMain, globalShortcut, screen, Menu, Tray, nativeTheme, protocol } from "electron";
import { EventEmitter } from "node:events";
import writeFile from "write-file-atomic";
import { ObjectAdapter, I18n } from "@piclist/i18n";
import yaml from "js-yaml";
import { JSONStore, DBStore } from "@piclist/store";
import { debounce, cloneDeep, get, set, unset } from "lodash-es";
import { PicGo } from "piclist";
import { fileURLToPath } from "node:url";
import axios from "axios";
import FormData from "form-data";
import { v4 } from "uuid";
import crypto from "node:crypto";
import fs$1 from "node:fs";
import process$1 from "node:process";
import updater from "electron-updater";
import http from "node:http";
import https, { Agent } from "node:https";
import querystring from "node:querystring";
import { S3Client, DeleteObjectCommand, PutPublicAccessBlockCommand, ListBucketsCommand, CreateBucketCommand, PutBucketAclCommand, GetBucketLocationCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Stream } from "node:stream";
import got, { RequestError } from "got";
import { HttpsProxyAgent, HttpProxyAgent } from "hpagent";
import mime from "mime-types";
import Downloader from "nodejs-file-downloader";
import { NodeSSH } from "node-ssh-no-cpu-features";
import { Client } from "ssh2-no-cpu-features";
import os, { homedir } from "node:os";
import OSS from "ali-oss";
import * as fastxml from "fast-xml-parser";
import * as fsWalk from "@nodelib/fs.walk";
import qiniu from "qiniu";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import COS from "cos-nodejs-sdk-v5";
import Upyun from "upyun";
import { AuthType, createClient } from "webdav";
import require$$0 from "os";
import require$$1 from "tty";
import multer from "multer";
import { marked } from "marked";
import { isRef, unref, isReactive, toRaw } from "vue";
import { Octokit } from "@octokit/rest";
import "net";
import require$$1$1 from "tls";
import require$$2 from "http";
import require$$3 from "https";
import require$$4 from "events";
import "assert";
import require$$6 from "util";
import { shellPath } from "shell-path";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dayjs_min$1 = { exports: {} };
var dayjs_min = dayjs_min$1.exports;
var hasRequiredDayjs_min;
function requireDayjs_min() {
  if (hasRequiredDayjs_min) return dayjs_min$1.exports;
  hasRequiredDayjs_min = 1;
  (function(module, exports) {
    !function(t, e) {
      module.exports = e();
    }(dayjs_min, function() {
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          }(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t2), l2 = function(t3, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, function(t3, r3) {
            return r3 || function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            }(t3) || i2.replace(":", "");
          });
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      }(), k = _.prototype;
      return O.prototype = k, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach(function(t2) {
        k[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      }), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    });
  })(dayjs_min$1);
  return dayjs_min$1.exports;
}
var dayjs_minExports = requireDayjs_min();
const dayjs = /* @__PURE__ */ getDefaultExportFromCjs(dayjs_minExports);
const MB = 1024 * 1024;
const DEFAULT_LOG_FILE_SIZE_LIMIT = 10 * MB;
const checkLogFileIsLarge = (logPath) => {
  try {
    if (fs.existsSync(logPath)) {
      const logFileSize = fs.statSync(logPath).size;
      return {
        isLarge: logFileSize > DEFAULT_LOG_FILE_SIZE_LIMIT,
        logFileSize,
        logFileSizeLimit: DEFAULT_LOG_FILE_SIZE_LIMIT
      };
    }
    return { isLarge: false };
  } catch (e) {
    console.log(e);
    return { isLarge: true };
  }
};
const recreateLogFile = (logPath) => {
  try {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
      fs.createFileSync(logPath);
    }
  } catch (e) {
    console.log(e);
  }
};
const getLogger = (logPath, logType) => {
  let hasUncathcedError = false;
  try {
    fs.ensureFileSync(logPath);
    if (checkLogFileIsLarge(logPath).isLarge) {
      recreateLogFile(logPath);
    }
  } catch (e) {
    console.log(e);
    hasUncathcedError = true;
  }
  return (type, ...msg) => {
    if (hasUncathcedError) {
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath);
      }
      return;
    }
    try {
      let log = `${dayjs().format("YYYY-MM-DD HH:mm:ss")} [${logType} ${type.toUpperCase()}] `;
      msg.forEach((item) => {
        if (typeof item === "object" && type === "error") {
          log += `
------Error Stack Begin------
${util$1.format(item.stack)}
-------Error Stack End------- `;
        } else {
          if (typeof item === "object") {
            item = JSON.stringify(item);
          }
          log += `${item} `;
        }
      });
      log += "\n";
      console.log(log);
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath);
      }
      if (!hasUncathcedError) {
        fs.appendFileSync(logPath, log);
      }
    } catch (e) {
      console.log(e);
      hasUncathcedError = true;
    }
  };
};
const STORE_PATH$9 = app.getPath("userData");
const LOG_PATH$1 = path.join(STORE_PATH$9, "piclist-gui-local.log");
const logger$1 = getLogger(LOG_PATH$1, "PicList");
const handleProcessError = (error) => {
  logger$1("error", error);
};
process.on("uncaughtException", (error) => {
  handleProcessError(error);
});
process.on("unhandledRejection", (error) => {
  handleProcessError(error);
});
function bootstrapEPIPESuppression() {
  let suppressing = false;
  function logEPIPEErrorOnce() {
    if (suppressing) {
      return;
    }
    suppressing = true;
    handleProcessError("Detected EPIPE error; suppressing further EPIPE errors");
  }
  epipeBomb(process.stdout, logEPIPEErrorOnce);
  epipeBomb(process.stderr, logEPIPEErrorOnce);
}
bootstrapEPIPESuppression();
function epipeBomb(stream, callback) {
  if (stream == null) stream = process.stdout;
  if (callback == null) callback = process.exit;
  function epipeFilter(err) {
    if (err.code === "EPIPE") return callback();
    if (stream.listeners("error").length <= 1) {
      stream.removeAllListeners();
      stream.emit("error", err);
      stream.on("error", epipeFilter);
    }
  }
  stream.on("error", epipeFilter);
}
const bus = new EventEmitter();
const notificationList = [];
const builtinI18nList = [
  {
    label: "简体中文",
    value: "zh-CN"
  },
  {
    label: "繁體中文",
    value: "zh-TW"
  },
  {
    label: "English",
    value: "en"
  }
];
class I18nManager {
  i18n = null;
  builtinI18nFolder = path.join("./resources", "i18n");
  outterI18nFolder = "";
  localesMap = /* @__PURE__ */ new Map();
  currentLanguage = "zh-CN";
  defaultLanguage = "zh-CN";
  i18nFileList = builtinI18nList;
  setOutterI18nFolder(folder) {
    this.outterI18nFolder = folder;
  }
  addI18nFile(file, label) {
    this.i18nFileList.push({
      label,
      value: file
    });
  }
  getLocales(lang) {
    if (this.localesMap.has(lang)) {
      return this.localesMap.get(lang);
    }
    let localesPath = path.join(this.builtinI18nFolder, `${lang}.yml`);
    if (!fs.existsSync(localesPath)) {
      localesPath = path.join(this.outterI18nFolder, `${lang}.yml`);
      if (!fs.existsSync(localesPath)) {
        localesPath = path.join(this.builtinI18nFolder, `${this.defaultLanguage}.yml`);
      }
    }
    try {
      const localesString = fs.readFileSync(localesPath, "utf8");
      const locales = yaml.load(localesString);
      this.localesMap.set(lang, locales);
      return locales;
    } catch (e) {
      console.error(e);
      localesPath = path.join(this.builtinI18nFolder, `${this.defaultLanguage}.yml`);
      const localesString = fs.readFileSync(localesPath, "utf8");
      const locales = yaml.load(localesString);
      this.localesMap.set(lang, locales);
      return locales;
    }
  }
  setCurrentLanguage(lang) {
    const locales = this.getLocales(lang);
    this.currentLanguage = lang;
    this.initI18n(lang, locales);
  }
  initI18n(lang = this.defaultLanguage, locales) {
    const objectAdapter = new ObjectAdapter({
      [lang]: locales
    });
    this.i18n = new I18n({
      adapter: objectAdapter,
      defaultLanguage: lang
    });
  }
  T(key, args = {}) {
    return this.i18n?.translate(key, args) || key;
  }
  get languageList() {
    return this.i18nFileList;
  }
  getCurrentLocales() {
    return {
      lang: this.currentLanguage,
      locales: this.getLocales(this.currentLanguage)
    };
  }
}
const T = (key, args = {}) => {
  return i18nManager.T(key, args);
};
const i18nManager = new I18nManager();
const STORE_PATH$8 = app.getPath("userData");
const configFilePath = path.join(STORE_PATH$8, "data.json");
const configFileBackupPath = path.join(STORE_PATH$8, "data.bak.json");
const defaultConfigPath = configFilePath;
let _configFilePath$1 = "";
let hasCheckPath$1 = false;
const errorMsg$1 = {
  broken: T("TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_DEFAULT"),
  brokenButBackup: T("TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_BACKUP")
};
function dbChecker() {
  if (process.type !== "renderer") {
    try {
      const { dbPath, dbBackupPath } = getGalleryDBPath();
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbBackupPath);
      }
    } catch (e) {
      console.error(e);
    }
    const configFilePath2 = dbPathChecker();
    if (!fs.existsSync(configFilePath2)) {
      return;
    }
    let configFile = "{}";
    const optionsTpl = {
      title: T("TIPS_NOTICE"),
      body: ""
    };
    try {
      configFile = fs.readFileSync(configFilePath2, { encoding: "utf-8" });
      JSON.parse(configFile);
    } catch (e) {
      fs.unlinkSync(configFilePath2);
      if (fs.existsSync(configFileBackupPath)) {
        try {
          configFile = fs.readFileSync(configFileBackupPath, {
            encoding: "utf-8"
          });
          JSON.parse(configFile);
          writeFile.sync(configFilePath2, configFile, { encoding: "utf-8" });
          const stats = fs.statSync(configFileBackupPath);
          optionsTpl.body = `${errorMsg$1.brokenButBackup}
${T("TIPS_PICGO_BACKUP_FILE_VERSION", {
            v: dayjs(stats.mtime).format("YYYY-MM-DD HH:mm:ss")
          })}`;
          notificationList.push(optionsTpl);
          return;
        } catch (e2) {
          optionsTpl.body = errorMsg$1.broken;
          notificationList.push(optionsTpl);
          return;
        }
      }
      optionsTpl.body = errorMsg$1.broken;
      notificationList.push(optionsTpl);
      return;
    }
    writeFile.sync(configFileBackupPath, configFile, { encoding: "utf-8" });
  }
}
function dbPathChecker() {
  if (_configFilePath$1) {
    return _configFilePath$1;
  }
  _configFilePath$1 = defaultConfigPath;
  if (!fs.existsSync(defaultConfigPath)) {
    return _configFilePath$1;
  }
  try {
    const configString = fs.readFileSync(defaultConfigPath, {
      encoding: "utf-8"
    });
    const config = JSON.parse(configString);
    const userConfigPath = config.configPath || "";
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith(".json")) {
        _configFilePath$1 = userConfigPath;
        return _configFilePath$1;
      }
    }
    return _configFilePath$1;
  } catch (e) {
    const piclistLogPath = path.join(STORE_PATH$8, "piclist-gui-local.log");
    const logger2 = getLogger(piclistLogPath, "PicList");
    if (!hasCheckPath$1) {
      const optionsTpl = {
        title: T("TIPS_NOTICE"),
        body: T("TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR")
      };
      notificationList.push(optionsTpl);
      hasCheckPath$1 = true;
    }
    logger2("error", e);
    _configFilePath$1 = defaultConfigPath;
    return _configFilePath$1;
  }
}
function dbPathDir() {
  return path.dirname(dbPathChecker());
}
function getGalleryDBPath() {
  const configPath2 = dbPathChecker();
  const dbPath = path.join(path.dirname(configPath2), "piclist.db");
  const dbBackupPath = path.join(path.dirname(dbPath), "piclist.bak.db");
  return {
    dbPath,
    dbBackupPath
  };
}
const configPaths = {
  picBed: {
    current: "picBed.current",
    uploader: "picBed.uploader",
    secondUploader: "picBed.secondUploader",
    secondUploaderId: "picBed.secondUploaderId",
    secondUploaderConfig: "picBed.secondUploaderConfig",
    proxy: "picBed.proxy",
    transformer: "picBed.transformer",
    list: "picBed.list"
  },
  settings: {
    shortKey: {
      _path: "settings.shortKey",
      "picgo:upload": "settings.shortKey[picgo:upload]"
    },
    logLevel: "settings.logLevel",
    logPath: "settings.logPath",
    logFileSizeLimit: "settings.logFileSizeLimit",
    isAutoListenClipboard: "settings.isAutoListenClipboard",
    isListeningClipboard: "settings.isListeningClipboard",
    showUpdateTip: "settings.showUpdateTip",
    miniWindowPosition: "settings.miniWindowPosition",
    miniWindowOntop: "settings.miniWindowOntop",
    isHideDock: "settings.isHideDock",
    mainWindowWidth: "settings.mainWindowWidth",
    mainWindowHeight: "settings.mainWindowHeight",
    autoCloseMiniWindow: "settings.autoCloseMiniWindow",
    autoCloseMainWindow: "settings.autoCloseMainWindow",
    isCustomMiniIcon: "settings.isCustomMiniIcon",
    customMiniIcon: "settings.customMiniIcon",
    startMode: "settings.startMode",
    autoRename: "settings.autoRename",
    deleteCloudFile: "settings.deleteCloudFile",
    server: "settings.server",
    serverKey: "settings.serverKey",
    pasteStyle: "settings.pasteStyle",
    aesPassword: "settings.aesPassword",
    rename: "settings.rename",
    sync: "settings.sync",
    tempDirPath: "settings.tempDirPath",
    language: "settings.language",
    customLink: "settings.customLink",
    manualPageOpen: "settings.manualPageOpen",
    encodeOutputURL: "settings.encodeOutputURL",
    useShortUrl: "settings.useShortUrl",
    shortUrlServer: "settings.shortUrlServer",
    c1nToken: "settings.c1nToken",
    cfWorkerHost: "settings.cfWorkerHost",
    yourlsDomain: "settings.yourlsDomain",
    yourlsSignature: "settings.yourlsSignature",
    sinkDomain: "settings.sinkDomain",
    sinkToken: "settings.sinkToken",
    isSilentNotice: "settings.isSilentNotice",
    proxy: "settings.proxy",
    registry: "settings.registry",
    autoCopy: "settings.autoCopy",
    enableWebServer: "settings.enableWebServer",
    webServerHost: "settings.webServerHost",
    webServerPort: "settings.webServerPort",
    webServerPath: "settings.webServerPath",
    deleteLocalFile: "settings.deleteLocalFile",
    uploadResultNotification: "settings.uploadResultNotification",
    uploadNotification: "settings.uploadNotification",
    useBuiltinClipboard: "settings.useBuiltinClipboard",
    autoStart: "settings.autoStart",
    autoImport: "settings.autoImport",
    autoImportPicBed: "settings.autoImportPicBed",
    enableSecondUploader: "settings.enableSecondUploader"
  },
  needReload: "needReload",
  picgoPlugins: "picgoPlugins",
  uploader: "uploader",
  buildIn: {
    compress: "buildIn.compress",
    watermark: "buildIn.watermark",
    rename: "buildIn.rename",
    skipProcess: "buildIn.skipProcess"
  },
  debug: "debug",
  PICGO_ENV: "PICGO_ENV"
};
const STORE_PATH$7 = dbPathDir();
if (!fs.pathExistsSync(STORE_PATH$7)) {
  fs.mkdirpSync(STORE_PATH$7);
}
const CONFIG_PATH$1 = dbPathChecker();
const DB_PATH = getGalleryDBPath().dbPath;
class ConfigStore {
  #db;
  constructor() {
    this.#db = new JSONStore(CONFIG_PATH$1);
    if (!this.#db.has("picBed")) {
      this.#db.set("picBed", {
        current: "smms",
        // deprecated
        uploader: "smms",
        smms: {
          token: ""
        }
      });
    }
    if (!this.#db.has(configPaths.settings.shortKey._path)) {
      this.#db.set(configPaths.settings.shortKey["picgo:upload"], {
        enable: true,
        key: "CommandOrControl+Alt+P",
        name: "upload",
        label: T("QUICK_UPLOAD")
      });
    }
    this.read();
  }
  read(flush) {
    return this.#db.read(flush);
  }
  getSingle(key = "") {
    if (key === "") {
      return this.#db.read(true);
    }
    this.read(true);
    return this.#db.get(key);
  }
  get(key = "") {
    if (Array.isArray(key)) {
      return key.map((k) => this.getSingle(k));
    }
    return this.getSingle(key);
  }
  set(key, value) {
    this.read(true);
    return this.#db.set(key, value);
  }
  has(key) {
    this.read(true);
    return this.#db.has(key);
  }
  unset(key, value) {
    this.read(true);
    return this.#db.unset(key, value);
  }
  saveConfig(config) {
    Object.keys(config).forEach((name) => {
      this.set(name, config[name]);
    });
  }
  removeConfig(config) {
    Object.keys(config).forEach((name) => {
      this.unset(name, config[name]);
    });
  }
  getConfigPath() {
    return CONFIG_PATH$1;
  }
}
const db = new ConfigStore();
class GalleryDB {
  static #instance;
  constructor() {
    console.log("init gallery db");
  }
  static getInstance() {
    if (!GalleryDB.#instance) {
      GalleryDB.#instance = new DBStore(DB_PATH, "gallery");
    }
    return GalleryDB.#instance;
  }
}
const version$1 = "2.9.9";
const pkg = {
  version: version$1
};
const CONFIG_PATH = dbPathChecker();
dbChecker();
const picgo = await PicGo.create(CONFIG_PATH);
picgo.saveConfig({
  debug: true,
  PICGO_ENV: "GUI"
});
picgo.GUI_VERSION = pkg.version;
const originPicGoSaveConfig = picgo.saveConfig.bind(picgo);
function flushDB() {
  db.read(true);
}
const debounced = debounce(flushDB, 1e3);
picgo.saveConfig = (config) => {
  originPicGoSaveConfig(config);
  debounced();
};
const logger = picgo.log;
const CREATE_APP_MENU = "CREATE_APP_MENU";
const GET_WINDOW_ID = "GET_WINDOW_ID";
const GET_WINDOW_ID_REPONSE = "GET_WINDOW_ID_REPONSE";
const GET_SETTING_WINDOW_ID = "GET_SETTING_WINDOW_ID";
const GET_SETTING_WINDOW_ID_RESPONSE = "GET_SETTING_WINDOW_ID_RESPONSE";
const UPLOAD_WITH_FILES = "UPLOAD_WITH_FILES";
const UPLOAD_WITH_FILES_RESPONSE = "UPLOAD_WITH_FILES_RESPONSE";
const UPLOAD_WITH_CLIPBOARD_FILES = "UPLOAD_WITH_CLIPBOARD_FILES";
const UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE = "UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE";
const SHOW_INPUT_BOX = "SHOW_INPUT_BOX";
const TOGGLE_SHORTKEY_MODIFIED_MODE = "TOGGLE_SHORTKEY_MODIFIED_MODE";
const TALKING_DATA_EVENT = "TALKING_DATA_EVENT";
const PICGO_CONFIG_PLUGIN = "PICGO_CONFIG_PLUGIN";
const PICGO_HANDLE_PLUGIN_ING = "PICGO_HANDLE_PLUGIN_ING";
const PICGO_HANDLE_PLUGIN_DONE = "PICGO_HANDLE_PLUGIN_DONE";
const PICGO_TOGGLE_PLUGIN = "PICGO_TOGGLE_PLUGIN";
const RENAME_FILE_NAME = "RENAME_FILE_NAME";
const GET_RENAME_FILE_NAME = "GET_RENAME_FILE_NAME";
const SHOW_MAIN_PAGE_QRCODE = "SHOW_MAIN_PAGE_QRCODE";
const RPC_ACTIONS = "RPC_ACTIONS";
const RPC_ACTIONS_INVOKE = "RPC_ACTIONS_INVOKE";
const SET_CURRENT_LANGUAGE = "SET_CURRENT_LANGUAGE";
var ILogType = /* @__PURE__ */ ((ILogType2) => {
  ILogType2["success"] = "success";
  ILogType2["info"] = "info";
  ILogType2["warn"] = "warn";
  ILogType2["error"] = "error";
  return ILogType2;
})(ILogType || {});
var ICOREBuildInEvent = /* @__PURE__ */ ((ICOREBuildInEvent2) => {
  ICOREBuildInEvent2["UPLOAD_PROGRESS"] = "uploadProgress";
  ICOREBuildInEvent2["FAILED"] = "failed";
  ICOREBuildInEvent2["BEFORE_TRANSFORM"] = "beforeTransform";
  ICOREBuildInEvent2["BEFORE_UPLOAD"] = "beforeUpload";
  ICOREBuildInEvent2["AFTER_UPLOAD"] = "afterUpload";
  ICOREBuildInEvent2["FINISHED"] = "finished";
  ICOREBuildInEvent2["INSTALL"] = "install";
  ICOREBuildInEvent2["UNINSTALL"] = "uninstall";
  ICOREBuildInEvent2["UPDATE"] = "update";
  ICOREBuildInEvent2["NOTIFICATION"] = "notification";
  ICOREBuildInEvent2["REMOVE"] = "remove";
  return ICOREBuildInEvent2;
})(ICOREBuildInEvent || {});
var IPicGoHelperType = /* @__PURE__ */ ((IPicGoHelperType2) => {
  IPicGoHelperType2["afterUploadPlugins"] = "afterUploadPlugins";
  IPicGoHelperType2["beforeTransformPlugins"] = "beforeTransformPlugins";
  IPicGoHelperType2["beforeUploadPlugins"] = "beforeUploadPlugins";
  IPicGoHelperType2["uploader"] = "uploader";
  IPicGoHelperType2["transformer"] = "transformer";
  return IPicGoHelperType2;
})(IPicGoHelperType || {});
var IPasteStyle = /* @__PURE__ */ ((IPasteStyle2) => {
  IPasteStyle2["MARKDOWN"] = "markdown";
  IPasteStyle2["HTML"] = "HTML";
  IPasteStyle2["URL"] = "URL";
  IPasteStyle2["UBB"] = "UBB";
  IPasteStyle2["CUSTOM"] = "Custom";
  return IPasteStyle2;
})(IPasteStyle || {});
var IWindowList = /* @__PURE__ */ ((IWindowList2) => {
  IWindowList2["SETTING_WINDOW"] = "SETTING_WINDOW";
  IWindowList2["TRAY_WINDOW"] = "TRAY_WINDOW";
  IWindowList2["MINI_WINDOW"] = "MINI_WINDOW";
  IWindowList2["RENAME_WINDOW"] = "RENAME_WINDOW";
  IWindowList2["TOOLBOX_WINDOW"] = "TOOLBOX_WINDOW";
  IWindowList2["MANUAL_WINDOW"] = "MANUAL_WINDOW";
  return IWindowList2;
})(IWindowList || {});
var IRemoteNoticeActionType = /* @__PURE__ */ ((IRemoteNoticeActionType2) => {
  IRemoteNoticeActionType2["OPEN_URL"] = "OPEN_URL";
  IRemoteNoticeActionType2["SHOW_NOTICE"] = "SHOW_NOTICE";
  IRemoteNoticeActionType2["SHOW_DIALOG"] = "SHOW_DIALOG";
  IRemoteNoticeActionType2["COMMON"] = "COMMON";
  IRemoteNoticeActionType2["VOID"] = "VOID";
  IRemoteNoticeActionType2["SHOW_MESSAGE_BOX"] = "SHOW_MESSAGE_BOX";
  return IRemoteNoticeActionType2;
})(IRemoteNoticeActionType || {});
var IRemoteNoticeTriggerHook = /* @__PURE__ */ ((IRemoteNoticeTriggerHook2) => {
  IRemoteNoticeTriggerHook2["APP_START"] = "APP_START";
  IRemoteNoticeTriggerHook2["SETTING_WINDOW_OPEN"] = "SETTING_WINDOW_OPEN";
  return IRemoteNoticeTriggerHook2;
})(IRemoteNoticeTriggerHook || {});
var IRemoteNoticeTriggerCount = /* @__PURE__ */ ((IRemoteNoticeTriggerCount2) => {
  IRemoteNoticeTriggerCount2["ONCE"] = "ONCE";
  IRemoteNoticeTriggerCount2["ALWAYS"] = "ALWAYS";
  return IRemoteNoticeTriggerCount2;
})(IRemoteNoticeTriggerCount || {});
var IRPCType = /* @__PURE__ */ ((IRPCType2) => {
  IRPCType2["INVOKE"] = "INVOKE";
  IRPCType2["SEND"] = "SEND";
  return IRPCType2;
})(IRPCType || {});
var IRPCActionType = /* @__PURE__ */ ((IRPCActionType2) => {
  IRPCActionType2["RELOAD_APP"] = "RELOAD_APP";
  IRPCActionType2["OPEN_URL"] = "OPEN_URL";
  IRPCActionType2["OPEN_FILE"] = "OPEN_FILE";
  IRPCActionType2["HIDE_DOCK"] = "HIDE_DOCK";
  IRPCActionType2["GET_LANGUAGE_LIST"] = "GET_LANGUAGE_LIST";
  IRPCActionType2["GET_CURRENT_LANGUAGE"] = "GET_CURRENT_LANGUAGE";
  IRPCActionType2["SET_CURRENT_LANGUAGE"] = "SET_CURRENT_LANGUAGE";
  IRPCActionType2["OPEN_WINDOW"] = "OPEN_WINDOW";
  IRPCActionType2["OPEN_MINI_WINDOW"] = "OPEN_MINI_WINDOW";
  IRPCActionType2["OPEN_MANUAL_WINDOW"] = "OPEN_MANUAL_WINDOW";
  IRPCActionType2["CLOSE_WINDOW"] = "CLOSE_WINDOW";
  IRPCActionType2["MINIMIZE_WINDOW"] = "MINIMIZE_WINDOW";
  IRPCActionType2["SHOW_MINI_PAGE_MENU"] = "SHOW_MINI_PAGE_MENU";
  IRPCActionType2["SHOW_MAIN_PAGE_MENU"] = "SHOW_MAIN_PAGE_MENU";
  IRPCActionType2["SHOW_UPLOAD_PAGE_MENU"] = "SHOW_UPLOAD_PAGE_MENU";
  IRPCActionType2["SHOW_SECOND_UPLOADER_MENU"] = "SHOW_SECOND_UPLOADER_MENU";
  IRPCActionType2["SHOW_PLUGIN_PAGE_MENU"] = "SHOW_PLUGIN_PAGE_MENU";
  IRPCActionType2["SET_MINI_WINDOW_POS"] = "SET_MINI_WINDOW_POS";
  IRPCActionType2["MINI_WINDOW_ON_TOP"] = "MINI_WINDOW_ON_TOP";
  IRPCActionType2["MAIN_WINDOW_ON_TOP"] = "MAIN_WINDOW_ON_TOP";
  IRPCActionType2["UPDATE_MINI_WINDOW_ICON"] = "UPDATE_MINI_WINDOW_ICON";
  IRPCActionType2["REFRESH_SETTING_WINDOW"] = "REFRESH_SETTING_WINDOW";
  IRPCActionType2["GET_PLATFORM"] = "GET_PLATFORM";
  IRPCActionType2["PICBED_GET_PICBED_CONFIG"] = "PICBED_GET_PICBED_CONFIG";
  IRPCActionType2["PICBED_GET_CONFIG_LIST"] = "PICBED_GET_CONFIG_LIST";
  IRPCActionType2["PICBED_DELETE_CONFIG"] = "PICBED_DELETE_CONFIG";
  IRPCActionType2["UPLOADER_CHANGE_CURRENT"] = "UPLOADER_CHANGE_CURRENT";
  IRPCActionType2["UPLOADER_SELECT"] = "UPLOADER_SELECT";
  IRPCActionType2["UPLOADER_UPDATE_CONFIG"] = "UPLOADER_UPDATE_CONFIG";
  IRPCActionType2["UPLOADER_RESET_CONFIG"] = "UPLOADER_RESET_CONFIG";
  IRPCActionType2["TOOLBOX_CHECK"] = "TOOLBOX_CHECK";
  IRPCActionType2["TOOLBOX_CHECK_RES"] = "TOOLBOX_CHECK_RES";
  IRPCActionType2["TOOLBOX_CHECK_FIX"] = "TOOLBOX_CHECK_FIX";
  IRPCActionType2["PICLIST_GET_CONFIG"] = "PICLIST_GET_CONFIG";
  IRPCActionType2["PICLIST_GET_CONFIG_SYNC"] = "PICLIST_GET_CONFIG_SYNC";
  IRPCActionType2["PICLIST_SAVE_CONFIG"] = "PICLIST_SAVE_CONFIG";
  IRPCActionType2["PICLIST_OPEN_FILE"] = "PICLIST_OPEN_FILE";
  IRPCActionType2["PICLIST_OPEN_DIRECTORY"] = "PICLIST_OPEN_DIRECTORY";
  IRPCActionType2["PICLIST_AUTO_START"] = "PICLIST_AUTO_START";
  IRPCActionType2["SHORTKEY_UPDATE"] = "SHORTKEY_UPDATE";
  IRPCActionType2["SHORTKEY_BIND_OR_UNBIND"] = "SHORTKEY_BIND_OR_UNBIND";
  IRPCActionType2["SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE"] = "SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE";
  IRPCActionType2["CONFIGURE_MIGRATE_FROM_PICGO"] = "CONFIGURE_MIGRATE_FROM_PICGO";
  IRPCActionType2["CONFIGURE_UPLOAD_COMMON_CONFIG"] = "CONFIGURE_UPLOAD_COMMON_CONFIG";
  IRPCActionType2["CONFIGURE_UPLOAD_MANAGE_CONFIG"] = "CONFIGURE_UPLOAD_MANAGE_CONFIG";
  IRPCActionType2["CONFIGURE_UPLOAD_ALL_CONFIG"] = "CONFIGURE_UPLOAD_ALL_CONFIG";
  IRPCActionType2["CONFIGURE_DOWNLOAD_COMMON_CONFIG"] = "CONFIGURE_DOWNLOAD_COMMON_CONFIG";
  IRPCActionType2["CONFIGURE_DOWNLOAD_MANAGE_CONFIG"] = "CONFIGURE_DOWNLOAD_MANAGE_CONFIG";
  IRPCActionType2["CONFIGURE_DOWNLOAD_ALL_CONFIG"] = "CONFIGURE_DOWNLOAD_ALL_CONFIG";
  IRPCActionType2["ADVANCED_UPDATE_SERVER"] = "ADVANCED_UPDATE_SERVER";
  IRPCActionType2["ADVANCED_STOP_WEB_SERVER"] = "ADVANCED_STOP_WEB_SERVER";
  IRPCActionType2["ADVANCED_RESTART_WEB_SERVER"] = "ADVANCED_RESTART_WEB_SERVER";
  IRPCActionType2["MAIN_GET_PICBED"] = "MAIN_GET_PICBED";
  IRPCActionType2["UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE"] = "UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE";
  IRPCActionType2["UPLOAD_CHOOSED_FILES"] = "UPLOAD_CHOOSED_FILES";
  IRPCActionType2["GALLERY_PASTE_TEXT"] = "GALLERY_PASTE_TEXT";
  IRPCActionType2["GALLERY_REMOVE_FILES"] = "GALLERY_REMOVE_FILES";
  IRPCActionType2["GALLERY_GET_DB"] = "GALLERY_GET_DB";
  IRPCActionType2["GALLERY_GET_BY_ID_DB"] = "GALLERY_GET_BY_ID_DB";
  IRPCActionType2["GALLERY_UPDATE_BY_ID_DB"] = "GALLERY_UPDATE_BY_ID_DB";
  IRPCActionType2["GALLERY_REMOVE_BY_ID_DB"] = "GALLERY_REMOVE_BY_ID_DB";
  IRPCActionType2["GALLERY_INSERT_DB"] = "GALLERY_INSERT_DB";
  IRPCActionType2["GALLERY_INSERT_DB_BATCH"] = "GALLERY_INSERT_DB_BATCH";
  IRPCActionType2["GALLERY_LOG_DELETE_MSG"] = "GALLERY_LOG_DELETE_MSG";
  IRPCActionType2["GALLERY_DELETE_SFTP_FILE"] = "GALLERY_DELETE_SFTP_FILE";
  IRPCActionType2["GALLERY_DELETE_AWS_S3_FILE"] = "GALLERY_DELETE_AWS_S3_FILE";
  IRPCActionType2["GALLERY_DELETE_DOGE_FILE"] = "GALLERY_DELETE_DOGE_FILE";
  IRPCActionType2["GALLERY_DELETE_HUAWEI_OSS_FILE"] = "GALLERY_DELETE_HUAWEI_OSS_FILE";
  IRPCActionType2["PLUGIN_GET_LIST"] = "PLUGIN_GET_LIST";
  IRPCActionType2["PLUGIN_INSTALL"] = "PLUGIN_INSTALL";
  IRPCActionType2["PLUGIN_IMPORT_LOCAL"] = "PLUGIN_IMPORT_LOCAL";
  IRPCActionType2["PLUGIN_UPDATE_ALL"] = "PLUGIN_UPDATE_ALL";
  IRPCActionType2["TRAY_SET_TOOL_TIP"] = "TRAY_SET_TOOL_TIP";
  IRPCActionType2["TRAY_GET_SHORT_URL"] = "TRAY_GET_SHORT_URL";
  IRPCActionType2["TRAY_UPLOAD_CLIPBOARD_FILES"] = "TRAY_UPLOAD_CLIPBOARD_FILES";
  IRPCActionType2["MANAGE_GET_CONFIG"] = "MANAGE_GET_CONFIG";
  IRPCActionType2["MANAGE_SAVE_CONFIG"] = "MANAGE_SAVE_CONFIG";
  IRPCActionType2["MANAGE_REMOVE_CONFIG"] = "MANAGE_REMOVE_CONFIG";
  IRPCActionType2["MANAGE_GET_BUCKET_LIST"] = "MANAGE_GET_BUCKET_LIST";
  IRPCActionType2["MANAGE_GET_BUCKET_LIST_BACKSTAGE"] = "MANAGE_GET_BUCKET_LIST_BACKSTAGE";
  IRPCActionType2["MANAGE_GET_BUCKET_LIST_RECURSIVELY"] = "MANAGE_GET_BUCKET_LIST_RECURSIVELY";
  IRPCActionType2["MANAGE_CREATE_BUCKET"] = "MANAGE_CREATE_BUCKET";
  IRPCActionType2["MANAGE_GET_BUCKET_FILE_LIST"] = "MANAGE_GET_BUCKET_FILE_LIST";
  IRPCActionType2["MANAGE_GET_BUCKET_DOMAIN"] = "MANAGE_GET_BUCKET_DOMAIN";
  IRPCActionType2["MANAGE_SET_BUCKET_ACL_POLICY"] = "MANAGE_SET_BUCKET_ACL_POLICY";
  IRPCActionType2["MANAGE_RENAME_BUCKET_FILE"] = "MANAGE_RENAME_BUCKET_FILE";
  IRPCActionType2["MANAGE_DELETE_BUCKET_FILE"] = "MANAGE_DELETE_BUCKET_FILE";
  IRPCActionType2["MANAGE_DELETE_BUCKET_FOLDER"] = "MANAGE_DELETE_BUCKET_FOLDER";
  IRPCActionType2["MANAGE_GET_PRE_SIGNED_URL"] = "MANAGE_GET_PRE_SIGNED_URL";
  IRPCActionType2["MANAGE_UPLOAD_BUCKET_FILE"] = "MANAGE_UPLOAD_BUCKET_FILE";
  IRPCActionType2["MANAGE_DOWNLOAD_BUCKET_FILE"] = "MANAGE_DOWNLOAD_BUCKET_FILE";
  IRPCActionType2["MANAGE_CREATE_BUCKET_FOLDER"] = "MANAGE_CREATE_BUCKET_FOLDER";
  IRPCActionType2["MANAGE_OPEN_FILE_SELECT_DIALOG"] = "MANAGE_OPEN_FILE_SELECT_DIALOG";
  IRPCActionType2["MANAGE_GET_UPLOAD_TASK_LIST"] = "MANAGE_GET_UPLOAD_TASK_LIST";
  IRPCActionType2["MANAGE_GET_DOWNLOAD_TASK_LIST"] = "MANAGE_GET_DOWNLOAD_TASK_LIST";
  IRPCActionType2["MANAGE_DELETE_UPLOADED_TASK"] = "MANAGE_DELETE_UPLOADED_TASK";
  IRPCActionType2["MANAGE_DELETE_ALL_UPLOADED_TASK"] = "MANAGE_DELETE_ALL_UPLOADED_TASK";
  IRPCActionType2["MANAGE_DELETE_DOWNLOADED_TASK"] = "MANAGE_DELETE_DOWNLOADED_TASK";
  IRPCActionType2["MANAGE_DELETE_ALL_DOWNLOADED_TASK"] = "MANAGE_DELETE_ALL_DOWNLOADED_TASK";
  IRPCActionType2["MANAGE_SELECT_DOWNLOAD_FOLDER"] = "MANAGE_SELECT_DOWNLOAD_FOLDER";
  IRPCActionType2["MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER"] = "MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER";
  IRPCActionType2["MANAGE_OPEN_DOWNLOADED_FOLDER"] = "MANAGE_OPEN_DOWNLOADED_FOLDER";
  IRPCActionType2["MANAGE_OPEN_LOCAL_FILE"] = "MANAGE_OPEN_LOCAL_FILE";
  IRPCActionType2["MANAGE_DOWNLOAD_FILE_FROM_URL"] = "MANAGE_DOWNLOAD_FILE_FROM_URL";
  IRPCActionType2["MANAGE_CONVERT_PATH_TO_BASE64"] = "MANAGE_CONVERT_PATH_TO_BASE64";
  return IRPCActionType2;
})(IRPCActionType || {});
var IToolboxItemType = /* @__PURE__ */ ((IToolboxItemType2) => {
  IToolboxItemType2["IS_CONFIG_FILE_BROKEN"] = "IS_CONFIG_FILE_BROKEN";
  IToolboxItemType2["IS_GALLERY_FILE_BROKEN"] = "IS_GALLERY_FILE_BROKEN";
  IToolboxItemType2["HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD"] = "HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD";
  IToolboxItemType2["HAS_PROBLEM_WITH_PROXY"] = "HAS_PROBLEM_WITH_PROXY";
  return IToolboxItemType2;
})(IToolboxItemType || {});
var IToolboxItemCheckStatus = /* @__PURE__ */ ((IToolboxItemCheckStatus2) => {
  IToolboxItemCheckStatus2["INIT"] = "init";
  IToolboxItemCheckStatus2["LOADING"] = "loading";
  IToolboxItemCheckStatus2["SUCCESS"] = "success";
  IToolboxItemCheckStatus2["ERROR"] = "error";
  return IToolboxItemCheckStatus2;
})(IToolboxItemCheckStatus || {});
var ISartMode = /* @__PURE__ */ ((ISartMode2) => {
  ISartMode2["QUIET"] = "quiet";
  ISartMode2["MINI"] = "mini";
  ISartMode2["MAIN"] = "main";
  ISartMode2["NO_TRAY"] = "no-tray";
  return ISartMode2;
})(ISartMode || {});
var II18nLanguage = /* @__PURE__ */ ((II18nLanguage2) => {
  II18nLanguage2["ZH_CN"] = "zh-CN";
  II18nLanguage2["ZH_TW"] = "zh-TW";
  II18nLanguage2["EN"] = "en";
  return II18nLanguage2;
})(II18nLanguage || {});
var IShortUrlServer = /* @__PURE__ */ ((IShortUrlServer2) => {
  IShortUrlServer2["C1N"] = "c1n";
  IShortUrlServer2["YOURLS"] = "yourls";
  IShortUrlServer2["CFWORKER"] = "cf_worker";
  IShortUrlServer2["SINK"] = "sink";
  return IShortUrlServer2;
})(IShortUrlServer || {});
var commonTaskStatus = /* @__PURE__ */ ((commonTaskStatus2) => {
  commonTaskStatus2["queuing"] = "queuing";
  commonTaskStatus2["failed"] = "failed";
  commonTaskStatus2["canceled"] = "canceled";
  commonTaskStatus2["paused"] = "paused";
  return commonTaskStatus2;
})(commonTaskStatus || {});
var uploadTaskSpecialStatus = /* @__PURE__ */ ((uploadTaskSpecialStatus2) => {
  uploadTaskSpecialStatus2["uploading"] = "uploading";
  uploadTaskSpecialStatus2["uploaded"] = "uploaded";
  return uploadTaskSpecialStatus2;
})(uploadTaskSpecialStatus || {});
var downloadTaskSpecialStatus = /* @__PURE__ */ ((downloadTaskSpecialStatus2) => {
  downloadTaskSpecialStatus2["downloading"] = "downloading";
  downloadTaskSpecialStatus2["downloaded"] = "downloaded";
  return downloadTaskSpecialStatus2;
})(downloadTaskSpecialStatus || {});
const isDevelopment$1 = process.env.NODE_ENV !== "production";
const MANUAL_WINDOW_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000#documents" : "index.html#documents";
const MINI_WINDOW_URL = isDevelopment$1 ? "http://localhost:3000#mini-page" : "index.html#mini-page";
const RENAME_WINDOW_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000#rename-page" : "index.html#rename-page";
const SETTING_WINDOW_URL = isDevelopment$1 ? "http://localhost:3000#main-page/upload" : "index.html#main-page/upload";
const TRAY_WINDOW_URL = isDevelopment$1 ? "http://localhost:3000" : "index.html";
console.log(TRAY_WINDOW_URL);
const TOOLBOX_WINDOW_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000#toolbox-page" : "index.html#toolbox-page";
const windowList = /* @__PURE__ */ new Map();
const handleWindowParams = (windowURL) => windowURL;
const getDefaultWindowSizes = () => {
  const [mainWindowWidth, mainWindowHeight] = db.get([
    configPaths.settings.mainWindowWidth,
    configPaths.settings.mainWindowHeight
  ]);
  return {
    width: mainWindowWidth || 1200,
    height: mainWindowHeight || 800
  };
};
const preloadPath = fileURLToPath(new URL("../preload/index.mjs", import.meta.url));
const { width: defaultWindowWidth, height: defaultWindowHeight } = getDefaultWindowSizes();
const trayWindowOptions = {
  height: 350,
  width: 196,
  show: false,
  frame: false,
  fullscreenable: false,
  resizable: false,
  transparent: true,
  vibrancy: "ultra-dark",
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    backgroundThrottling: false,
    webSecurity: false
  }
};
const manualWindowOptions = {
  height: 800,
  width: 1200,
  show: false,
  frame: true,
  center: true,
  fullscreenable: true,
  resizable: true,
  title: "Manual",
  vibrancy: "ultra-dark",
  transparent: false,
  webPreferences: {
    sandbox: false,
    webviewTag: true,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
};
const settingWindowOptions = {
  height: defaultWindowHeight,
  width: defaultWindowWidth,
  show: false,
  frame: true,
  center: true,
  fullscreenable: true,
  resizable: true,
  title: "PicList",
  vibrancy: "ultra-dark",
  transparent: true,
  titleBarStyle: "hidden",
  webPreferences: {
    sandbox: false,
    webviewTag: true,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
};
if (process.platform !== "darwin") {
  settingWindowOptions.show = false;
  settingWindowOptions.frame = false;
  settingWindowOptions.backgroundColor = "#3f3c37";
  settingWindowOptions.transparent = false;
  settingWindowOptions.icon = ".resources/logo.png";
}
const miniWindowOptions = {
  height: 64,
  width: 64,
  show: process.platform === "linux",
  frame: false,
  fullscreenable: false,
  skipTaskbar: true,
  resizable: false,
  transparent: process.platform !== "linux",
  icon: "./resources/logo.png",
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    backgroundThrottling: false,
    nodeIntegrationInWorker: true
  }
};
if (db.get(configPaths.settings.miniWindowOntop)) {
  miniWindowOptions.alwaysOnTop = true;
}
const renameWindowOptions = {
  height: 175,
  width: 300,
  show: true,
  fullscreenable: false,
  resizable: false,
  vibrancy: "ultra-dark",
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    backgroundThrottling: false
  }
};
if (process.platform !== "darwin") {
  renameWindowOptions.show = true;
  renameWindowOptions.backgroundColor = "#3f3c37";
  renameWindowOptions.autoHideMenuBar = true;
  renameWindowOptions.transparent = false;
}
const toolboxWindowOptions = {
  height: 450,
  width: 800,
  show: false,
  frame: true,
  center: true,
  fullscreenable: false,
  resizable: false,
  title: `PicList ${T("TOOLBOX")}`,
  vibrancy: "ultra-dark",
  icon: "./resources/logo.png",
  webPreferences: {
    sandbox: false,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
};
if (process.platform !== "darwin") {
  toolboxWindowOptions.backgroundColor = "#3f3c37";
  toolboxWindowOptions.autoHideMenuBar = true;
  toolboxWindowOptions.transparent = false;
}
windowList.set(IWindowList.TRAY_WINDOW, {
  isValid: process.platform !== "linux",
  multiple: false,
  options: () => trayWindowOptions,
  callback(window2) {
    window2.loadURL(handleWindowParams(TRAY_WINDOW_URL));
    window2.on("blur", () => {
      window2.hide();
    });
  }
});
windowList.set(IWindowList.MANUAL_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => manualWindowOptions,
  callback(window2) {
    window2.loadURL(handleWindowParams(MANUAL_WINDOW_URL));
    window2.focus();
  }
});
windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => settingWindowOptions,
  callback(window2, windowManager2) {
    window2.loadURL(handleWindowParams(SETTING_WINDOW_URL));
    window2.webContents.openDevTools({ mode: "detach" });
    window2.on("closed", () => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false);
      if (process.platform === "linux") {
        process.nextTick(() => {
          app.quit();
        });
      }
    });
    bus.emit(CREATE_APP_MENU);
    windowManager2.create(IWindowList.MINI_WINDOW);
  }
});
windowList.set(IWindowList.MINI_WINDOW, {
  isValid: process.platform !== "darwin",
  multiple: false,
  options: () => miniWindowOptions,
  callback(window2) {
    window2.loadURL(handleWindowParams(MINI_WINDOW_URL));
  }
});
windowList.set(IWindowList.RENAME_WINDOW, {
  isValid: true,
  multiple: true,
  options: () => renameWindowOptions,
  async callback(window2, windowManager2) {
    window2.loadURL(handleWindowParams(RENAME_WINDOW_URL));
    const currentWindow = windowManager2.getAvailableWindow(true);
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds();
      const positionX = Math.floor(x + width / 2 - 150);
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 88 : 0));
      window2.setPosition(positionX, positionY, false);
    }
  }
});
windowList.set(IWindowList.TOOLBOX_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => toolboxWindowOptions,
  async callback(window2, windowManager2) {
    window2.loadURL(TOOLBOX_WINDOW_URL);
    const currentWindow = windowManager2.getAvailableWindow(true);
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds();
      const positionX = Math.floor(x + width / 2 - 400);
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 225 : 0));
      window2.setPosition(positionX, positionY, false);
    }
  }
});
class WindowManager {
  #windowMap = /* @__PURE__ */ new Map();
  #windowIdMap = /* @__PURE__ */ new Map();
  create(name) {
    const windowConfig = windowList.get(name);
    if (!windowConfig.isValid) return null;
    if (!windowConfig.multiple) {
      if (this.has(name)) return this.#windowMap.get(name);
    }
    const window2 = new BrowserWindow(windowConfig.options());
    const id = window2.id;
    const windowName = windowConfig.multiple ? `${name}_${id}` : name;
    this.#windowMap.set(windowName, window2);
    this.#windowIdMap.set(id, windowName);
    windowConfig.callback(window2, this);
    window2.on("close", () => {
      this.deleteById(id);
    });
    return window2;
  }
  get(name) {
    if (this.has(name)) {
      return this.#windowMap.get(name);
    }
    return this.create(name);
  }
  has(name) {
    return this.#windowMap.has(name);
  }
  deleteById = (id) => {
    const name = this.#windowIdMap.get(id);
    if (name) {
      this.#windowMap.delete(name);
      this.#windowIdMap.delete(id);
    }
  };
  getAvailableWindow(isSkipMiniWindow = false) {
    const miniWindow = this.#windowMap.get(IWindowList.MINI_WINDOW);
    if (miniWindow && miniWindow.isVisible() && !isSkipMiniWindow) {
      return miniWindow;
    }
    const settingWindow = this.#windowMap.get(IWindowList.SETTING_WINDOW);
    if (settingWindow) return settingWindow;
    const trayWindow = this.#windowMap.get(IWindowList.TRAY_WINDOW);
    if (trayWindow) return trayWindow;
    return this.create(IWindowList.SETTING_WINDOW);
  }
}
const windowManager = new WindowManager();
var re = { exports: {} };
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  const SEMVER_SPEC_VERSION = "2.0.0";
  const MAX_LENGTH = 256;
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991;
  const MAX_SAFE_COMPONENT_LENGTH = 16;
  constants = {
    SEMVER_SPEC_VERSION,
    MAX_LENGTH,
    MAX_SAFE_INTEGER,
    MAX_SAFE_COMPONENT_LENGTH
  };
  return constants;
}
var debug_1;
var hasRequiredDebug;
function requireDebug() {
  if (hasRequiredDebug) return debug_1;
  hasRequiredDebug = 1;
  const debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
  };
  debug_1 = debug;
  return debug_1;
}
var hasRequiredRe;
function requireRe() {
  if (hasRequiredRe) return re.exports;
  hasRequiredRe = 1;
  (function(module, exports) {
    const { MAX_SAFE_COMPONENT_LENGTH } = requireConstants();
    const debug = requireDebug();
    exports = module.exports = {};
    const re2 = exports.re = [];
    const src = exports.src = [];
    const t = exports.t = {};
    let R = 0;
    const createToken = (name, value, isGlobal) => {
      const index = R++;
      debug(index, value);
      t[name] = index;
      src[index] = value;
      re2[index] = new RegExp(value, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "[0-9]+");
    createToken("NONNUMERICIDENTIFIER", "\\d*[a-zA-Z-][a-zA-Z0-9-]*");
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", "[0-9A-Za-z-]+");
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCE", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0.0.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0.0.0-0\\s*$");
  })(re, re.exports);
  return re.exports;
}
var parseOptions_1;
var hasRequiredParseOptions;
function requireParseOptions() {
  if (hasRequiredParseOptions) return parseOptions_1;
  hasRequiredParseOptions = 1;
  const opts = ["includePrerelease", "loose", "rtl"];
  const parseOptions = (options) => !options ? {} : typeof options !== "object" ? { loose: true } : opts.filter((k) => options[k]).reduce((options2, k) => {
    options2[k] = true;
    return options2;
  }, {});
  parseOptions_1 = parseOptions;
  return parseOptions_1;
}
var identifiers;
var hasRequiredIdentifiers;
function requireIdentifiers() {
  if (hasRequiredIdentifiers) return identifiers;
  hasRequiredIdentifiers = 1;
  const numeric = /^[0-9]+$/;
  const compareIdentifiers = (a, b) => {
    const anum = numeric.test(a);
    const bnum = numeric.test(b);
    if (anum && bnum) {
      a = +a;
      b = +b;
    }
    return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
  };
  const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
  identifiers = {
    compareIdentifiers,
    rcompareIdentifiers
  };
  return identifiers;
}
var semver$2;
var hasRequiredSemver$1;
function requireSemver$1() {
  if (hasRequiredSemver$1) return semver$2;
  hasRequiredSemver$1 = 1;
  const debug = requireDebug();
  const { MAX_LENGTH, MAX_SAFE_INTEGER } = requireConstants();
  const { re: re2, t } = requireRe();
  const parseOptions = requireParseOptions();
  const { compareIdentifiers } = requireIdentifiers();
  class SemVer {
    constructor(version2, options) {
      options = parseOptions(options);
      if (version2 instanceof SemVer) {
        if (version2.loose === !!options.loose && version2.includePrerelease === !!options.includePrerelease) {
          return version2;
        } else {
          version2 = version2.version;
        }
      } else if (typeof version2 !== "string") {
        throw new TypeError(`Invalid Version: ${version2}`);
      }
      if (version2.length > MAX_LENGTH) {
        throw new TypeError(
          `version is longer than ${MAX_LENGTH} characters`
        );
      }
      debug("SemVer", version2, options);
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      const m = version2.trim().match(options.loose ? re2[t.LOOSE] : re2[t.FULL]);
      if (!m) {
        throw new TypeError(`Invalid Version: ${version2}`);
      }
      this.raw = version2;
      this.major = +m[1];
      this.minor = +m[2];
      this.patch = +m[3];
      if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
        throw new TypeError("Invalid major version");
      }
      if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
        throw new TypeError("Invalid minor version");
      }
      if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
        throw new TypeError("Invalid patch version");
      }
      if (!m[4]) {
        this.prerelease = [];
      } else {
        this.prerelease = m[4].split(".").map((id) => {
          if (/^[0-9]+$/.test(id)) {
            const num = +id;
            if (num >= 0 && num < MAX_SAFE_INTEGER) {
              return num;
            }
          }
          return id;
        });
      }
      this.build = m[5] ? m[5].split(".") : [];
      this.format();
    }
    format() {
      this.version = `${this.major}.${this.minor}.${this.patch}`;
      if (this.prerelease.length) {
        this.version += `-${this.prerelease.join(".")}`;
      }
      return this.version;
    }
    toString() {
      return this.version;
    }
    compare(other) {
      debug("SemVer.compare", this.version, this.options, other);
      if (!(other instanceof SemVer)) {
        if (typeof other === "string" && other === this.version) {
          return 0;
        }
        other = new SemVer(other, this.options);
      }
      if (other.version === this.version) {
        return 0;
      }
      return this.compareMain(other) || this.comparePre(other);
    }
    compareMain(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
    }
    comparePre(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      if (this.prerelease.length && !other.prerelease.length) {
        return -1;
      } else if (!this.prerelease.length && other.prerelease.length) {
        return 1;
      } else if (!this.prerelease.length && !other.prerelease.length) {
        return 0;
      }
      let i = 0;
      do {
        const a = this.prerelease[i];
        const b = other.prerelease[i];
        debug("prerelease compare", i, a, b);
        if (a === void 0 && b === void 0) {
          return 0;
        } else if (b === void 0) {
          return 1;
        } else if (a === void 0) {
          return -1;
        } else if (a === b) {
          continue;
        } else {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    compareBuild(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      let i = 0;
      do {
        const a = this.build[i];
        const b = other.build[i];
        debug("prerelease compare", i, a, b);
        if (a === void 0 && b === void 0) {
          return 0;
        } else if (b === void 0) {
          return 1;
        } else if (a === void 0) {
          return -1;
        } else if (a === b) {
          continue;
        } else {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(release, identifier) {
      switch (release) {
        case "premajor":
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor = 0;
          this.major++;
          this.inc("pre", identifier);
          break;
        case "preminor":
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor++;
          this.inc("pre", identifier);
          break;
        case "prepatch":
          this.prerelease.length = 0;
          this.inc("patch", identifier);
          this.inc("pre", identifier);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          if (this.prerelease.length === 0) {
            this.inc("patch", identifier);
          }
          this.inc("pre", identifier);
          break;
        case "major":
          if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
            this.major++;
          }
          this.minor = 0;
          this.patch = 0;
          this.prerelease = [];
          break;
        case "minor":
          if (this.patch !== 0 || this.prerelease.length === 0) {
            this.minor++;
          }
          this.patch = 0;
          this.prerelease = [];
          break;
        case "patch":
          if (this.prerelease.length === 0) {
            this.patch++;
          }
          this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre":
          if (this.prerelease.length === 0) {
            this.prerelease = [0];
          } else {
            let i = this.prerelease.length;
            while (--i >= 0) {
              if (typeof this.prerelease[i] === "number") {
                this.prerelease[i]++;
                i = -2;
              }
            }
            if (i === -1) {
              this.prerelease.push(0);
            }
          }
          if (identifier) {
            if (this.prerelease[0] === identifier) {
              if (isNaN(this.prerelease[1])) {
                this.prerelease = [identifier, 0];
              }
            } else {
              this.prerelease = [identifier, 0];
            }
          }
          break;
        default:
          throw new Error(`invalid increment argument: ${release}`);
      }
      this.format();
      this.raw = this.version;
      return this;
    }
  }
  semver$2 = SemVer;
  return semver$2;
}
var parse_1;
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse_1;
  hasRequiredParse = 1;
  const { MAX_LENGTH } = requireConstants();
  const { re: re2, t } = requireRe();
  const SemVer = requireSemver$1();
  const parseOptions = requireParseOptions();
  const parse = (version2, options) => {
    options = parseOptions(options);
    if (version2 instanceof SemVer) {
      return version2;
    }
    if (typeof version2 !== "string") {
      return null;
    }
    if (version2.length > MAX_LENGTH) {
      return null;
    }
    const r = options.loose ? re2[t.LOOSE] : re2[t.FULL];
    if (!r.test(version2)) {
      return null;
    }
    try {
      return new SemVer(version2, options);
    } catch (er) {
      return null;
    }
  };
  parse_1 = parse;
  return parse_1;
}
var valid_1;
var hasRequiredValid$1;
function requireValid$1() {
  if (hasRequiredValid$1) return valid_1;
  hasRequiredValid$1 = 1;
  const parse = requireParse();
  const valid2 = (version2, options) => {
    const v = parse(version2, options);
    return v ? v.version : null;
  };
  valid_1 = valid2;
  return valid_1;
}
var clean_1;
var hasRequiredClean;
function requireClean() {
  if (hasRequiredClean) return clean_1;
  hasRequiredClean = 1;
  const parse = requireParse();
  const clean2 = (version2, options) => {
    const s = parse(version2.trim().replace(/^[=v]+/, ""), options);
    return s ? s.version : null;
  };
  clean_1 = clean2;
  return clean_1;
}
var inc_1;
var hasRequiredInc;
function requireInc() {
  if (hasRequiredInc) return inc_1;
  hasRequiredInc = 1;
  const SemVer = requireSemver$1();
  const inc = (version2, release, options, identifier) => {
    if (typeof options === "string") {
      identifier = options;
      options = void 0;
    }
    try {
      return new SemVer(version2, options).inc(release, identifier).version;
    } catch (er) {
      return null;
    }
  };
  inc_1 = inc;
  return inc_1;
}
var compare_1;
var hasRequiredCompare;
function requireCompare() {
  if (hasRequiredCompare) return compare_1;
  hasRequiredCompare = 1;
  const SemVer = requireSemver$1();
  const compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
  compare_1 = compare;
  return compare_1;
}
var eq_1;
var hasRequiredEq;
function requireEq() {
  if (hasRequiredEq) return eq_1;
  hasRequiredEq = 1;
  const compare = requireCompare();
  const eq = (a, b, loose) => compare(a, b, loose) === 0;
  eq_1 = eq;
  return eq_1;
}
var diff_1;
var hasRequiredDiff;
function requireDiff() {
  if (hasRequiredDiff) return diff_1;
  hasRequiredDiff = 1;
  const parse = requireParse();
  const eq = requireEq();
  const diff = (version1, version2) => {
    if (eq(version1, version2)) {
      return null;
    } else {
      const v1 = parse(version1);
      const v2 = parse(version2);
      const hasPre = v1.prerelease.length || v2.prerelease.length;
      const prefix = hasPre ? "pre" : "";
      const defaultResult = hasPre ? "prerelease" : "";
      for (const key in v1) {
        if (key === "major" || key === "minor" || key === "patch") {
          if (v1[key] !== v2[key]) {
            return prefix + key;
          }
        }
      }
      return defaultResult;
    }
  };
  diff_1 = diff;
  return diff_1;
}
var major_1;
var hasRequiredMajor;
function requireMajor() {
  if (hasRequiredMajor) return major_1;
  hasRequiredMajor = 1;
  const SemVer = requireSemver$1();
  const major = (a, loose) => new SemVer(a, loose).major;
  major_1 = major;
  return major_1;
}
var minor_1;
var hasRequiredMinor;
function requireMinor() {
  if (hasRequiredMinor) return minor_1;
  hasRequiredMinor = 1;
  const SemVer = requireSemver$1();
  const minor = (a, loose) => new SemVer(a, loose).minor;
  minor_1 = minor;
  return minor_1;
}
var patch_1;
var hasRequiredPatch;
function requirePatch() {
  if (hasRequiredPatch) return patch_1;
  hasRequiredPatch = 1;
  const SemVer = requireSemver$1();
  const patch = (a, loose) => new SemVer(a, loose).patch;
  patch_1 = patch;
  return patch_1;
}
var prerelease_1;
var hasRequiredPrerelease;
function requirePrerelease() {
  if (hasRequiredPrerelease) return prerelease_1;
  hasRequiredPrerelease = 1;
  const parse = requireParse();
  const prerelease = (version2, options) => {
    const parsed = parse(version2, options);
    return parsed && parsed.prerelease.length ? parsed.prerelease : null;
  };
  prerelease_1 = prerelease;
  return prerelease_1;
}
var rcompare_1;
var hasRequiredRcompare;
function requireRcompare() {
  if (hasRequiredRcompare) return rcompare_1;
  hasRequiredRcompare = 1;
  const compare = requireCompare();
  const rcompare = (a, b, loose) => compare(b, a, loose);
  rcompare_1 = rcompare;
  return rcompare_1;
}
var compareLoose_1;
var hasRequiredCompareLoose;
function requireCompareLoose() {
  if (hasRequiredCompareLoose) return compareLoose_1;
  hasRequiredCompareLoose = 1;
  const compare = requireCompare();
  const compareLoose = (a, b) => compare(a, b, true);
  compareLoose_1 = compareLoose;
  return compareLoose_1;
}
var compareBuild_1;
var hasRequiredCompareBuild;
function requireCompareBuild() {
  if (hasRequiredCompareBuild) return compareBuild_1;
  hasRequiredCompareBuild = 1;
  const SemVer = requireSemver$1();
  const compareBuild = (a, b, loose) => {
    const versionA = new SemVer(a, loose);
    const versionB = new SemVer(b, loose);
    return versionA.compare(versionB) || versionA.compareBuild(versionB);
  };
  compareBuild_1 = compareBuild;
  return compareBuild_1;
}
var sort_1;
var hasRequiredSort;
function requireSort() {
  if (hasRequiredSort) return sort_1;
  hasRequiredSort = 1;
  const compareBuild = requireCompareBuild();
  const sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
  sort_1 = sort;
  return sort_1;
}
var rsort_1;
var hasRequiredRsort;
function requireRsort() {
  if (hasRequiredRsort) return rsort_1;
  hasRequiredRsort = 1;
  const compareBuild = requireCompareBuild();
  const rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
  rsort_1 = rsort;
  return rsort_1;
}
var gt_1;
var hasRequiredGt;
function requireGt() {
  if (hasRequiredGt) return gt_1;
  hasRequiredGt = 1;
  const compare = requireCompare();
  const gt = (a, b, loose) => compare(a, b, loose) > 0;
  gt_1 = gt;
  return gt_1;
}
var lt_1;
var hasRequiredLt;
function requireLt() {
  if (hasRequiredLt) return lt_1;
  hasRequiredLt = 1;
  const compare = requireCompare();
  const lt = (a, b, loose) => compare(a, b, loose) < 0;
  lt_1 = lt;
  return lt_1;
}
var neq_1;
var hasRequiredNeq;
function requireNeq() {
  if (hasRequiredNeq) return neq_1;
  hasRequiredNeq = 1;
  const compare = requireCompare();
  const neq = (a, b, loose) => compare(a, b, loose) !== 0;
  neq_1 = neq;
  return neq_1;
}
var gte_1;
var hasRequiredGte;
function requireGte() {
  if (hasRequiredGte) return gte_1;
  hasRequiredGte = 1;
  const compare = requireCompare();
  const gte = (a, b, loose) => compare(a, b, loose) >= 0;
  gte_1 = gte;
  return gte_1;
}
var lte_1;
var hasRequiredLte;
function requireLte() {
  if (hasRequiredLte) return lte_1;
  hasRequiredLte = 1;
  const compare = requireCompare();
  const lte = (a, b, loose) => compare(a, b, loose) <= 0;
  lte_1 = lte;
  return lte_1;
}
var cmp_1;
var hasRequiredCmp;
function requireCmp() {
  if (hasRequiredCmp) return cmp_1;
  hasRequiredCmp = 1;
  const eq = requireEq();
  const neq = requireNeq();
  const gt = requireGt();
  const gte = requireGte();
  const lt = requireLt();
  const lte = requireLte();
  const cmp = (a, op, b, loose) => {
    switch (op) {
      case "===":
        if (typeof a === "object")
          a = a.version;
        if (typeof b === "object")
          b = b.version;
        return a === b;
      case "!==":
        if (typeof a === "object")
          a = a.version;
        if (typeof b === "object")
          b = b.version;
        return a !== b;
      case "":
      case "=":
      case "==":
        return eq(a, b, loose);
      case "!=":
        return neq(a, b, loose);
      case ">":
        return gt(a, b, loose);
      case ">=":
        return gte(a, b, loose);
      case "<":
        return lt(a, b, loose);
      case "<=":
        return lte(a, b, loose);
      default:
        throw new TypeError(`Invalid operator: ${op}`);
    }
  };
  cmp_1 = cmp;
  return cmp_1;
}
var coerce_1;
var hasRequiredCoerce;
function requireCoerce() {
  if (hasRequiredCoerce) return coerce_1;
  hasRequiredCoerce = 1;
  const SemVer = requireSemver$1();
  const parse = requireParse();
  const { re: re2, t } = requireRe();
  const coerce = (version2, options) => {
    if (version2 instanceof SemVer) {
      return version2;
    }
    if (typeof version2 === "number") {
      version2 = String(version2);
    }
    if (typeof version2 !== "string") {
      return null;
    }
    options = options || {};
    let match = null;
    if (!options.rtl) {
      match = version2.match(re2[t.COERCE]);
    } else {
      let next;
      while ((next = re2[t.COERCERTL].exec(version2)) && (!match || match.index + match[0].length !== version2.length)) {
        if (!match || next.index + next[0].length !== match.index + match[0].length) {
          match = next;
        }
        re2[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
      }
      re2[t.COERCERTL].lastIndex = -1;
    }
    if (match === null)
      return null;
    return parse(`${match[2]}.${match[3] || "0"}.${match[4] || "0"}`, options);
  };
  coerce_1 = coerce;
  return coerce_1;
}
var iterator;
var hasRequiredIterator;
function requireIterator() {
  if (hasRequiredIterator) return iterator;
  hasRequiredIterator = 1;
  iterator = function(Yallist) {
    Yallist.prototype[Symbol.iterator] = function* () {
      for (let walker = this.head; walker; walker = walker.next) {
        yield walker.value;
      }
    };
  };
  return iterator;
}
var yallist;
var hasRequiredYallist;
function requireYallist() {
  if (hasRequiredYallist) return yallist;
  hasRequiredYallist = 1;
  yallist = Yallist;
  Yallist.Node = Node;
  Yallist.create = Yallist;
  function Yallist(list) {
    var self = this;
    if (!(self instanceof Yallist)) {
      self = new Yallist();
    }
    self.tail = null;
    self.head = null;
    self.length = 0;
    if (list && typeof list.forEach === "function") {
      list.forEach(function(item) {
        self.push(item);
      });
    } else if (arguments.length > 0) {
      for (var i = 0, l = arguments.length; i < l; i++) {
        self.push(arguments[i]);
      }
    }
    return self;
  }
  Yallist.prototype.removeNode = function(node) {
    if (node.list !== this) {
      throw new Error("removing node which does not belong to this list");
    }
    var next = node.next;
    var prev = node.prev;
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    if (node === this.head) {
      this.head = next;
    }
    if (node === this.tail) {
      this.tail = prev;
    }
    node.list.length--;
    node.next = null;
    node.prev = null;
    node.list = null;
    return next;
  };
  Yallist.prototype.unshiftNode = function(node) {
    if (node === this.head) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    var head = this.head;
    node.list = this;
    node.next = head;
    if (head) {
      head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  };
  Yallist.prototype.pushNode = function(node) {
    if (node === this.tail) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    var tail = this.tail;
    node.list = this;
    node.prev = tail;
    if (tail) {
      tail.next = node;
    }
    this.tail = node;
    if (!this.head) {
      this.head = node;
    }
    this.length++;
  };
  Yallist.prototype.push = function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      push(this, arguments[i]);
    }
    return this.length;
  };
  Yallist.prototype.unshift = function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      unshift(this, arguments[i]);
    }
    return this.length;
  };
  Yallist.prototype.pop = function() {
    if (!this.tail) {
      return void 0;
    }
    var res = this.tail.value;
    this.tail = this.tail.prev;
    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }
    this.length--;
    return res;
  };
  Yallist.prototype.shift = function() {
    if (!this.head) {
      return void 0;
    }
    var res = this.head.value;
    this.head = this.head.next;
    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }
    this.length--;
    return res;
  };
  Yallist.prototype.forEach = function(fn, thisp) {
    thisp = thisp || this;
    for (var walker = this.head, i = 0; walker !== null; i++) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.next;
    }
  };
  Yallist.prototype.forEachReverse = function(fn, thisp) {
    thisp = thisp || this;
    for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.prev;
    }
  };
  Yallist.prototype.get = function(n) {
    for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
      walker = walker.next;
    }
    if (i === n && walker !== null) {
      return walker.value;
    }
  };
  Yallist.prototype.getReverse = function(n) {
    for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
      walker = walker.prev;
    }
    if (i === n && walker !== null) {
      return walker.value;
    }
  };
  Yallist.prototype.map = function(fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
    for (var walker = this.head; walker !== null; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.next;
    }
    return res;
  };
  Yallist.prototype.mapReverse = function(fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
    for (var walker = this.tail; walker !== null; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.prev;
    }
    return res;
  };
  Yallist.prototype.reduce = function(fn, initial) {
    var acc;
    var walker = this.head;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.head) {
      walker = this.head.next;
      acc = this.head.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (var i = 0; walker !== null; i++) {
      acc = fn(acc, walker.value, i);
      walker = walker.next;
    }
    return acc;
  };
  Yallist.prototype.reduceReverse = function(fn, initial) {
    var acc;
    var walker = this.tail;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.tail) {
      walker = this.tail.prev;
      acc = this.tail.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (var i = this.length - 1; walker !== null; i--) {
      acc = fn(acc, walker.value, i);
      walker = walker.prev;
    }
    return acc;
  };
  Yallist.prototype.toArray = function() {
    var arr = new Array(this.length);
    for (var i = 0, walker = this.head; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.next;
    }
    return arr;
  };
  Yallist.prototype.toArrayReverse = function() {
    var arr = new Array(this.length);
    for (var i = 0, walker = this.tail; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.prev;
    }
    return arr;
  };
  Yallist.prototype.slice = function(from, to) {
    to = to || this.length;
    if (to < 0) {
      to += this.length;
    }
    from = from || 0;
    if (from < 0) {
      from += this.length;
    }
    var ret = new Yallist();
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
      walker = walker.next;
    }
    for (; walker !== null && i < to; i++, walker = walker.next) {
      ret.push(walker.value);
    }
    return ret;
  };
  Yallist.prototype.sliceReverse = function(from, to) {
    to = to || this.length;
    if (to < 0) {
      to += this.length;
    }
    from = from || 0;
    if (from < 0) {
      from += this.length;
    }
    var ret = new Yallist();
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
      walker = walker.prev;
    }
    for (; walker !== null && i > from; i--, walker = walker.prev) {
      ret.push(walker.value);
    }
    return ret;
  };
  Yallist.prototype.splice = function(start, deleteCount, ...nodes) {
    if (start > this.length) {
      start = this.length - 1;
    }
    if (start < 0) {
      start = this.length + start;
    }
    for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
      walker = walker.next;
    }
    var ret = [];
    for (var i = 0; walker && i < deleteCount; i++) {
      ret.push(walker.value);
      walker = this.removeNode(walker);
    }
    if (walker === null) {
      walker = this.tail;
    }
    if (walker !== this.head && walker !== this.tail) {
      walker = walker.prev;
    }
    for (var i = 0; i < nodes.length; i++) {
      walker = insert(this, walker, nodes[i]);
    }
    return ret;
  };
  Yallist.prototype.reverse = function() {
    var head = this.head;
    var tail = this.tail;
    for (var walker = head; walker !== null; walker = walker.prev) {
      var p = walker.prev;
      walker.prev = walker.next;
      walker.next = p;
    }
    this.head = tail;
    this.tail = head;
    return this;
  };
  function insert(self, node, value) {
    var inserted = node === self.head ? new Node(value, null, node, self) : new Node(value, node, node.next, self);
    if (inserted.next === null) {
      self.tail = inserted;
    }
    if (inserted.prev === null) {
      self.head = inserted;
    }
    self.length++;
    return inserted;
  }
  function push(self, item) {
    self.tail = new Node(item, self.tail, null, self);
    if (!self.head) {
      self.head = self.tail;
    }
    self.length++;
  }
  function unshift(self, item) {
    self.head = new Node(item, null, self.head, self);
    if (!self.tail) {
      self.tail = self.head;
    }
    self.length++;
  }
  function Node(value, prev, next, list) {
    if (!(this instanceof Node)) {
      return new Node(value, prev, next, list);
    }
    this.list = list;
    this.value = value;
    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = null;
    }
    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = null;
    }
  }
  try {
    requireIterator()(Yallist);
  } catch (er) {
  }
  return yallist;
}
var lruCache;
var hasRequiredLruCache;
function requireLruCache() {
  if (hasRequiredLruCache) return lruCache;
  hasRequiredLruCache = 1;
  const Yallist = requireYallist();
  const MAX = Symbol("max");
  const LENGTH = Symbol("length");
  const LENGTH_CALCULATOR = Symbol("lengthCalculator");
  const ALLOW_STALE = Symbol("allowStale");
  const MAX_AGE = Symbol("maxAge");
  const DISPOSE = Symbol("dispose");
  const NO_DISPOSE_ON_SET = Symbol("noDisposeOnSet");
  const LRU_LIST = Symbol("lruList");
  const CACHE = Symbol("cache");
  const UPDATE_AGE_ON_GET = Symbol("updateAgeOnGet");
  const naiveLength = () => 1;
  class LRUCache {
    constructor(options) {
      if (typeof options === "number")
        options = { max: options };
      if (!options)
        options = {};
      if (options.max && (typeof options.max !== "number" || options.max < 0))
        throw new TypeError("max must be a non-negative number");
      this[MAX] = options.max || Infinity;
      const lc = options.length || naiveLength;
      this[LENGTH_CALCULATOR] = typeof lc !== "function" ? naiveLength : lc;
      this[ALLOW_STALE] = options.stale || false;
      if (options.maxAge && typeof options.maxAge !== "number")
        throw new TypeError("maxAge must be a number");
      this[MAX_AGE] = options.maxAge || 0;
      this[DISPOSE] = options.dispose;
      this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
      this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
      this.reset();
    }
    // resize the cache when the max changes.
    set max(mL) {
      if (typeof mL !== "number" || mL < 0)
        throw new TypeError("max must be a non-negative number");
      this[MAX] = mL || Infinity;
      trim(this);
    }
    get max() {
      return this[MAX];
    }
    set allowStale(allowStale) {
      this[ALLOW_STALE] = !!allowStale;
    }
    get allowStale() {
      return this[ALLOW_STALE];
    }
    set maxAge(mA) {
      if (typeof mA !== "number")
        throw new TypeError("maxAge must be a non-negative number");
      this[MAX_AGE] = mA;
      trim(this);
    }
    get maxAge() {
      return this[MAX_AGE];
    }
    // resize the cache when the lengthCalculator changes.
    set lengthCalculator(lC) {
      if (typeof lC !== "function")
        lC = naiveLength;
      if (lC !== this[LENGTH_CALCULATOR]) {
        this[LENGTH_CALCULATOR] = lC;
        this[LENGTH] = 0;
        this[LRU_LIST].forEach((hit) => {
          hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
          this[LENGTH] += hit.length;
        });
      }
      trim(this);
    }
    get lengthCalculator() {
      return this[LENGTH_CALCULATOR];
    }
    get length() {
      return this[LENGTH];
    }
    get itemCount() {
      return this[LRU_LIST].length;
    }
    rforEach(fn, thisp) {
      thisp = thisp || this;
      for (let walker = this[LRU_LIST].tail; walker !== null; ) {
        const prev = walker.prev;
        forEachStep(this, fn, walker, thisp);
        walker = prev;
      }
    }
    forEach(fn, thisp) {
      thisp = thisp || this;
      for (let walker = this[LRU_LIST].head; walker !== null; ) {
        const next = walker.next;
        forEachStep(this, fn, walker, thisp);
        walker = next;
      }
    }
    keys() {
      return this[LRU_LIST].toArray().map((k) => k.key);
    }
    values() {
      return this[LRU_LIST].toArray().map((k) => k.value);
    }
    reset() {
      if (this[DISPOSE] && this[LRU_LIST] && this[LRU_LIST].length) {
        this[LRU_LIST].forEach((hit) => this[DISPOSE](hit.key, hit.value));
      }
      this[CACHE] = /* @__PURE__ */ new Map();
      this[LRU_LIST] = new Yallist();
      this[LENGTH] = 0;
    }
    dump() {
      return this[LRU_LIST].map((hit) => isStale(this, hit) ? false : {
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      }).toArray().filter((h) => h);
    }
    dumpLru() {
      return this[LRU_LIST];
    }
    set(key, value, maxAge) {
      maxAge = maxAge || this[MAX_AGE];
      if (maxAge && typeof maxAge !== "number")
        throw new TypeError("maxAge must be a number");
      const now = maxAge ? Date.now() : 0;
      const len = this[LENGTH_CALCULATOR](value, key);
      if (this[CACHE].has(key)) {
        if (len > this[MAX]) {
          del(this, this[CACHE].get(key));
          return false;
        }
        const node = this[CACHE].get(key);
        const item = node.value;
        if (this[DISPOSE]) {
          if (!this[NO_DISPOSE_ON_SET])
            this[DISPOSE](key, item.value);
        }
        item.now = now;
        item.maxAge = maxAge;
        item.value = value;
        this[LENGTH] += len - item.length;
        item.length = len;
        this.get(key);
        trim(this);
        return true;
      }
      const hit = new Entry(key, value, len, now, maxAge);
      if (hit.length > this[MAX]) {
        if (this[DISPOSE])
          this[DISPOSE](key, value);
        return false;
      }
      this[LENGTH] += hit.length;
      this[LRU_LIST].unshift(hit);
      this[CACHE].set(key, this[LRU_LIST].head);
      trim(this);
      return true;
    }
    has(key) {
      if (!this[CACHE].has(key)) return false;
      const hit = this[CACHE].get(key).value;
      return !isStale(this, hit);
    }
    get(key) {
      return get2(this, key, true);
    }
    peek(key) {
      return get2(this, key, false);
    }
    pop() {
      const node = this[LRU_LIST].tail;
      if (!node)
        return null;
      del(this, node);
      return node.value;
    }
    del(key) {
      del(this, this[CACHE].get(key));
    }
    load(arr) {
      this.reset();
      const now = Date.now();
      for (let l = arr.length - 1; l >= 0; l--) {
        const hit = arr[l];
        const expiresAt = hit.e || 0;
        if (expiresAt === 0)
          this.set(hit.k, hit.v);
        else {
          const maxAge = expiresAt - now;
          if (maxAge > 0) {
            this.set(hit.k, hit.v, maxAge);
          }
        }
      }
    }
    prune() {
      this[CACHE].forEach((value, key) => get2(this, key, false));
    }
  }
  const get2 = (self, key, doUse) => {
    const node = self[CACHE].get(key);
    if (node) {
      const hit = node.value;
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE])
          return void 0;
      } else {
        if (doUse) {
          if (self[UPDATE_AGE_ON_GET])
            node.value.now = Date.now();
          self[LRU_LIST].unshiftNode(node);
        }
      }
      return hit.value;
    }
  };
  const isStale = (self, hit) => {
    if (!hit || !hit.maxAge && !self[MAX_AGE])
      return false;
    const diff = Date.now() - hit.now;
    return hit.maxAge ? diff > hit.maxAge : self[MAX_AGE] && diff > self[MAX_AGE];
  };
  const trim = (self) => {
    if (self[LENGTH] > self[MAX]) {
      for (let walker = self[LRU_LIST].tail; self[LENGTH] > self[MAX] && walker !== null; ) {
        const prev = walker.prev;
        del(self, walker);
        walker = prev;
      }
    }
  };
  const del = (self, node) => {
    if (node) {
      const hit = node.value;
      if (self[DISPOSE])
        self[DISPOSE](hit.key, hit.value);
      self[LENGTH] -= hit.length;
      self[CACHE].delete(hit.key);
      self[LRU_LIST].removeNode(node);
    }
  };
  class Entry {
    constructor(key, value, length, now, maxAge) {
      this.key = key;
      this.value = value;
      this.length = length;
      this.now = now;
      this.maxAge = maxAge || 0;
    }
  }
  const forEachStep = (self, fn, node, thisp) => {
    let hit = node.value;
    if (isStale(self, hit)) {
      del(self, node);
      if (!self[ALLOW_STALE])
        hit = void 0;
    }
    if (hit)
      fn.call(thisp, hit.value, hit.key, self);
  };
  lruCache = LRUCache;
  return lruCache;
}
var range;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range;
  hasRequiredRange = 1;
  class Range {
    constructor(range2, options) {
      options = parseOptions(options);
      if (range2 instanceof Range) {
        if (range2.loose === !!options.loose && range2.includePrerelease === !!options.includePrerelease) {
          return range2;
        } else {
          return new Range(range2.raw, options);
        }
      }
      if (range2 instanceof Comparator) {
        this.raw = range2.value;
        this.set = [[range2]];
        this.format();
        return this;
      }
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      this.raw = range2;
      this.set = range2.split(/\s*\|\|\s*/).map((range3) => this.parseRange(range3.trim())).filter((c) => c.length);
      if (!this.set.length) {
        throw new TypeError(`Invalid SemVer Range: ${range2}`);
      }
      if (this.set.length > 1) {
        const first = this.set[0];
        this.set = this.set.filter((c) => !isNullSet(c[0]));
        if (this.set.length === 0)
          this.set = [first];
        else if (this.set.length > 1) {
          for (const c of this.set) {
            if (c.length === 1 && isAny(c[0])) {
              this.set = [c];
              break;
            }
          }
        }
      }
      this.format();
    }
    format() {
      this.range = this.set.map((comps) => {
        return comps.join(" ").trim();
      }).join("||").trim();
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range2) {
      range2 = range2.trim();
      const memoOpts = Object.keys(this.options).join(",");
      const memoKey = `parseRange:${memoOpts}:${range2}`;
      const cached = cache.get(memoKey);
      if (cached)
        return cached;
      const loose = this.options.loose;
      const hr = loose ? re2[t.HYPHENRANGELOOSE] : re2[t.HYPHENRANGE];
      range2 = range2.replace(hr, hyphenReplace(this.options.includePrerelease));
      debug("hyphen replace", range2);
      range2 = range2.replace(re2[t.COMPARATORTRIM], comparatorTrimReplace);
      debug("comparator trim", range2, re2[t.COMPARATORTRIM]);
      range2 = range2.replace(re2[t.TILDETRIM], tildeTrimReplace);
      range2 = range2.replace(re2[t.CARETTRIM], caretTrimReplace);
      range2 = range2.split(/\s+/).join(" ");
      const compRe = loose ? re2[t.COMPARATORLOOSE] : re2[t.COMPARATOR];
      const rangeList = range2.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options)).filter(this.options.loose ? (comp) => !!comp.match(compRe) : () => true).map((comp) => new Comparator(comp, this.options));
      rangeList.length;
      const rangeMap = /* @__PURE__ */ new Map();
      for (const comp of rangeList) {
        if (isNullSet(comp))
          return [comp];
        rangeMap.set(comp.value, comp);
      }
      if (rangeMap.size > 1 && rangeMap.has(""))
        rangeMap.delete("");
      const result = [...rangeMap.values()];
      cache.set(memoKey, result);
      return result;
    }
    intersects(range2, options) {
      if (!(range2 instanceof Range)) {
        throw new TypeError("a Range is required");
      }
      return this.set.some((thisComparators) => {
        return isSatisfiable(thisComparators, options) && range2.set.some((rangeComparators) => {
          return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
            return rangeComparators.every((rangeComparator) => {
              return thisComparator.intersects(rangeComparator, options);
            });
          });
        });
      });
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(version2) {
      if (!version2) {
        return false;
      }
      if (typeof version2 === "string") {
        try {
          version2 = new SemVer(version2, this.options);
        } catch (er) {
          return false;
        }
      }
      for (let i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version2, this.options)) {
          return true;
        }
      }
      return false;
    }
  }
  range = Range;
  const LRU = requireLruCache();
  const cache = new LRU({ max: 1e3 });
  const parseOptions = requireParseOptions();
  const Comparator = requireComparator();
  const debug = requireDebug();
  const SemVer = requireSemver$1();
  const {
    re: re2,
    t,
    comparatorTrimReplace,
    tildeTrimReplace,
    caretTrimReplace
  } = requireRe();
  const isNullSet = (c) => c.value === "<0.0.0-0";
  const isAny = (c) => c.value === "";
  const isSatisfiable = (comparators, options) => {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
      result = remainingComparators.every((otherComparator) => {
        return testComparator.intersects(otherComparator, options);
      });
      testComparator = remainingComparators.pop();
    }
    return result;
  };
  const parseComparator = (comp, options) => {
    debug("comp", comp, options);
    comp = replaceCarets(comp, options);
    debug("caret", comp);
    comp = replaceTildes(comp, options);
    debug("tildes", comp);
    comp = replaceXRanges(comp, options);
    debug("xrange", comp);
    comp = replaceStars(comp, options);
    debug("stars", comp);
    return comp;
  };
  const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
  const replaceTildes = (comp, options) => comp.trim().split(/\s+/).map((comp2) => {
    return replaceTilde(comp2, options);
  }).join(" ");
  const replaceTilde = (comp, options) => {
    const r = options.loose ? re2[t.TILDELOOSE] : re2[t.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      debug("tilde", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
      } else if (pr) {
        debug("replaceTilde pr", pr);
        ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
      }
      debug("tilde return", ret);
      return ret;
    });
  };
  const replaceCarets = (comp, options) => comp.trim().split(/\s+/).map((comp2) => {
    return replaceCaret(comp2, options);
  }).join(" ");
  const replaceCaret = (comp, options) => {
    debug("caret", comp, options);
    const r = options.loose ? re2[t.CARETLOOSE] : re2[t.CARET];
    const z = options.includePrerelease ? "-0" : "";
    return comp.replace(r, (_, M, m, p, pr) => {
      debug("caret", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        if (M === "0") {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
        }
      } else if (pr) {
        debug("replaceCaret pr", pr);
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
        }
      } else {
        debug("no pr");
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
        }
      }
      debug("caret return", ret);
      return ret;
    });
  };
  const replaceXRanges = (comp, options) => {
    debug("replaceXRanges", comp, options);
    return comp.split(/\s+/).map((comp2) => {
      return replaceXRange(comp2, options);
    }).join(" ");
  };
  const replaceXRange = (comp, options) => {
    comp = comp.trim();
    const r = options.loose ? re2[t.XRANGELOOSE] : re2[t.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug("xRange", comp, ret, gtlt, M, m, p, pr);
      const xM = isX(M);
      const xm = xM || isX(m);
      const xp = xm || isX(p);
      const anyX = xp;
      if (gtlt === "=" && anyX) {
        gtlt = "";
      }
      pr = options.includePrerelease ? "-0" : "";
      if (xM) {
        if (gtlt === ">" || gtlt === "<") {
          ret = "<0.0.0-0";
        } else {
          ret = "*";
        }
      } else if (gtlt && anyX) {
        if (xm) {
          m = 0;
        }
        p = 0;
        if (gtlt === ">") {
          gtlt = ">=";
          if (xm) {
            M = +M + 1;
            m = 0;
            p = 0;
          } else {
            m = +m + 1;
            p = 0;
          }
        } else if (gtlt === "<=") {
          gtlt = "<";
          if (xm) {
            M = +M + 1;
          } else {
            m = +m + 1;
          }
        }
        if (gtlt === "<")
          pr = "-0";
        ret = `${gtlt + M}.${m}.${p}${pr}`;
      } else if (xm) {
        ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
      } else if (xp) {
        ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
      }
      debug("xRange return", ret);
      return ret;
    });
  };
  const replaceStars = (comp, options) => {
    debug("replaceStars", comp, options);
    return comp.trim().replace(re2[t.STAR], "");
  };
  const replaceGTE0 = (comp, options) => {
    debug("replaceGTE0", comp, options);
    return comp.trim().replace(re2[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
  };
  const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) => {
    if (isX(fM)) {
      from = "";
    } else if (isX(fm)) {
      from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
    } else if (isX(fp)) {
      from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
    } else if (fpr) {
      from = `>=${from}`;
    } else {
      from = `>=${from}${incPr ? "-0" : ""}`;
    }
    if (isX(tM)) {
      to = "";
    } else if (isX(tm)) {
      to = `<${+tM + 1}.0.0-0`;
    } else if (isX(tp)) {
      to = `<${tM}.${+tm + 1}.0-0`;
    } else if (tpr) {
      to = `<=${tM}.${tm}.${tp}-${tpr}`;
    } else if (incPr) {
      to = `<${tM}.${tm}.${+tp + 1}-0`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  };
  const testSet = (set2, version2, options) => {
    for (let i = 0; i < set2.length; i++) {
      if (!set2[i].test(version2)) {
        return false;
      }
    }
    if (version2.prerelease.length && !options.includePrerelease) {
      for (let i = 0; i < set2.length; i++) {
        debug(set2[i].semver);
        if (set2[i].semver === Comparator.ANY) {
          continue;
        }
        if (set2[i].semver.prerelease.length > 0) {
          const allowed = set2[i].semver;
          if (allowed.major === version2.major && allowed.minor === version2.minor && allowed.patch === version2.patch) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  };
  return range;
}
var comparator;
var hasRequiredComparator;
function requireComparator() {
  if (hasRequiredComparator) return comparator;
  hasRequiredComparator = 1;
  const ANY = Symbol("SemVer ANY");
  class Comparator {
    static get ANY() {
      return ANY;
    }
    constructor(comp, options) {
      options = parseOptions(options);
      if (comp instanceof Comparator) {
        if (comp.loose === !!options.loose) {
          return comp;
        } else {
          comp = comp.value;
        }
      }
      debug("comparator", comp, options);
      this.options = options;
      this.loose = !!options.loose;
      this.parse(comp);
      if (this.semver === ANY) {
        this.value = "";
      } else {
        this.value = this.operator + this.semver.version;
      }
      debug("comp", this);
    }
    parse(comp) {
      const r = this.options.loose ? re2[t.COMPARATORLOOSE] : re2[t.COMPARATOR];
      const m = comp.match(r);
      if (!m) {
        throw new TypeError(`Invalid comparator: ${comp}`);
      }
      this.operator = m[1] !== void 0 ? m[1] : "";
      if (this.operator === "=") {
        this.operator = "";
      }
      if (!m[2]) {
        this.semver = ANY;
      } else {
        this.semver = new SemVer(m[2], this.options.loose);
      }
    }
    toString() {
      return this.value;
    }
    test(version2) {
      debug("Comparator.test", version2, this.options.loose);
      if (this.semver === ANY || version2 === ANY) {
        return true;
      }
      if (typeof version2 === "string") {
        try {
          version2 = new SemVer(version2, this.options);
        } catch (er) {
          return false;
        }
      }
      return cmp(version2, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator)) {
        throw new TypeError("a Comparator is required");
      }
      if (!options || typeof options !== "object") {
        options = {
          loose: !!options,
          includePrerelease: false
        };
      }
      if (this.operator === "") {
        if (this.value === "") {
          return true;
        }
        return new Range(comp.value, options).test(this.value);
      } else if (comp.operator === "") {
        if (comp.value === "") {
          return true;
        }
        return new Range(this.value, options).test(comp.semver);
      }
      const sameDirectionIncreasing = (this.operator === ">=" || this.operator === ">") && (comp.operator === ">=" || comp.operator === ">");
      const sameDirectionDecreasing = (this.operator === "<=" || this.operator === "<") && (comp.operator === "<=" || comp.operator === "<");
      const sameSemVer = this.semver.version === comp.semver.version;
      const differentDirectionsInclusive = (this.operator === ">=" || this.operator === "<=") && (comp.operator === ">=" || comp.operator === "<=");
      const oppositeDirectionsLessThan = cmp(this.semver, "<", comp.semver, options) && (this.operator === ">=" || this.operator === ">") && (comp.operator === "<=" || comp.operator === "<");
      const oppositeDirectionsGreaterThan = cmp(this.semver, ">", comp.semver, options) && (this.operator === "<=" || this.operator === "<") && (comp.operator === ">=" || comp.operator === ">");
      return sameDirectionIncreasing || sameDirectionDecreasing || sameSemVer && differentDirectionsInclusive || oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
    }
  }
  comparator = Comparator;
  const parseOptions = requireParseOptions();
  const { re: re2, t } = requireRe();
  const cmp = requireCmp();
  const debug = requireDebug();
  const SemVer = requireSemver$1();
  const Range = requireRange();
  return comparator;
}
var satisfies_1;
var hasRequiredSatisfies;
function requireSatisfies() {
  if (hasRequiredSatisfies) return satisfies_1;
  hasRequiredSatisfies = 1;
  const Range = requireRange();
  const satisfies = (version2, range2, options) => {
    try {
      range2 = new Range(range2, options);
    } catch (er) {
      return false;
    }
    return range2.test(version2);
  };
  satisfies_1 = satisfies;
  return satisfies_1;
}
var toComparators_1;
var hasRequiredToComparators;
function requireToComparators() {
  if (hasRequiredToComparators) return toComparators_1;
  hasRequiredToComparators = 1;
  const Range = requireRange();
  const toComparators = (range2, options) => new Range(range2, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
  toComparators_1 = toComparators;
  return toComparators_1;
}
var maxSatisfying_1;
var hasRequiredMaxSatisfying;
function requireMaxSatisfying() {
  if (hasRequiredMaxSatisfying) return maxSatisfying_1;
  hasRequiredMaxSatisfying = 1;
  const SemVer = requireSemver$1();
  const Range = requireRange();
  const maxSatisfying = (versions, range2, options) => {
    let max = null;
    let maxSV = null;
    let rangeObj = null;
    try {
      rangeObj = new Range(range2, options);
    } catch (er) {
      return null;
    }
    versions.forEach((v) => {
      if (rangeObj.test(v)) {
        if (!max || maxSV.compare(v) === -1) {
          max = v;
          maxSV = new SemVer(max, options);
        }
      }
    });
    return max;
  };
  maxSatisfying_1 = maxSatisfying;
  return maxSatisfying_1;
}
var minSatisfying_1;
var hasRequiredMinSatisfying;
function requireMinSatisfying() {
  if (hasRequiredMinSatisfying) return minSatisfying_1;
  hasRequiredMinSatisfying = 1;
  const SemVer = requireSemver$1();
  const Range = requireRange();
  const minSatisfying = (versions, range2, options) => {
    let min = null;
    let minSV = null;
    let rangeObj = null;
    try {
      rangeObj = new Range(range2, options);
    } catch (er) {
      return null;
    }
    versions.forEach((v) => {
      if (rangeObj.test(v)) {
        if (!min || minSV.compare(v) === 1) {
          min = v;
          minSV = new SemVer(min, options);
        }
      }
    });
    return min;
  };
  minSatisfying_1 = minSatisfying;
  return minSatisfying_1;
}
var minVersion_1;
var hasRequiredMinVersion;
function requireMinVersion() {
  if (hasRequiredMinVersion) return minVersion_1;
  hasRequiredMinVersion = 1;
  const SemVer = requireSemver$1();
  const Range = requireRange();
  const gt = requireGt();
  const minVersion = (range2, loose) => {
    range2 = new Range(range2, loose);
    let minver = new SemVer("0.0.0");
    if (range2.test(minver)) {
      return minver;
    }
    minver = new SemVer("0.0.0-0");
    if (range2.test(minver)) {
      return minver;
    }
    minver = null;
    for (let i = 0; i < range2.set.length; ++i) {
      const comparators = range2.set[i];
      let setMin = null;
      comparators.forEach((comparator2) => {
        const compver = new SemVer(comparator2.semver.version);
        switch (comparator2.operator) {
          case ">":
            if (compver.prerelease.length === 0) {
              compver.patch++;
            } else {
              compver.prerelease.push(0);
            }
            compver.raw = compver.format();
          /* fallthrough */
          case "":
          case ">=":
            if (!setMin || gt(compver, setMin)) {
              setMin = compver;
            }
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${comparator2.operator}`);
        }
      });
      if (setMin && (!minver || gt(minver, setMin)))
        minver = setMin;
    }
    if (minver && range2.test(minver)) {
      return minver;
    }
    return null;
  };
  minVersion_1 = minVersion;
  return minVersion_1;
}
var valid;
var hasRequiredValid;
function requireValid() {
  if (hasRequiredValid) return valid;
  hasRequiredValid = 1;
  const Range = requireRange();
  const validRange = (range2, options) => {
    try {
      return new Range(range2, options).range || "*";
    } catch (er) {
      return null;
    }
  };
  valid = validRange;
  return valid;
}
var outside_1;
var hasRequiredOutside;
function requireOutside() {
  if (hasRequiredOutside) return outside_1;
  hasRequiredOutside = 1;
  const SemVer = requireSemver$1();
  const Comparator = requireComparator();
  const { ANY } = Comparator;
  const Range = requireRange();
  const satisfies = requireSatisfies();
  const gt = requireGt();
  const lt = requireLt();
  const lte = requireLte();
  const gte = requireGte();
  const outside = (version2, range2, hilo, options) => {
    version2 = new SemVer(version2, options);
    range2 = new Range(range2, options);
    let gtfn, ltefn, ltfn, comp, ecomp;
    switch (hilo) {
      case ">":
        gtfn = gt;
        ltefn = lte;
        ltfn = lt;
        comp = ">";
        ecomp = ">=";
        break;
      case "<":
        gtfn = lt;
        ltefn = gte;
        ltfn = gt;
        comp = "<";
        ecomp = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (satisfies(version2, range2, options)) {
      return false;
    }
    for (let i = 0; i < range2.set.length; ++i) {
      const comparators = range2.set[i];
      let high = null;
      let low = null;
      comparators.forEach((comparator2) => {
        if (comparator2.semver === ANY) {
          comparator2 = new Comparator(">=0.0.0");
        }
        high = high || comparator2;
        low = low || comparator2;
        if (gtfn(comparator2.semver, high.semver, options)) {
          high = comparator2;
        } else if (ltfn(comparator2.semver, low.semver, options)) {
          low = comparator2;
        }
      });
      if (high.operator === comp || high.operator === ecomp) {
        return false;
      }
      if ((!low.operator || low.operator === comp) && ltefn(version2, low.semver)) {
        return false;
      } else if (low.operator === ecomp && ltfn(version2, low.semver)) {
        return false;
      }
    }
    return true;
  };
  outside_1 = outside;
  return outside_1;
}
var gtr_1;
var hasRequiredGtr;
function requireGtr() {
  if (hasRequiredGtr) return gtr_1;
  hasRequiredGtr = 1;
  const outside = requireOutside();
  const gtr = (version2, range2, options) => outside(version2, range2, ">", options);
  gtr_1 = gtr;
  return gtr_1;
}
var ltr_1;
var hasRequiredLtr;
function requireLtr() {
  if (hasRequiredLtr) return ltr_1;
  hasRequiredLtr = 1;
  const outside = requireOutside();
  const ltr = (version2, range2, options) => outside(version2, range2, "<", options);
  ltr_1 = ltr;
  return ltr_1;
}
var intersects_1;
var hasRequiredIntersects;
function requireIntersects() {
  if (hasRequiredIntersects) return intersects_1;
  hasRequiredIntersects = 1;
  const Range = requireRange();
  const intersects = (r1, r2, options) => {
    r1 = new Range(r1, options);
    r2 = new Range(r2, options);
    return r1.intersects(r2);
  };
  intersects_1 = intersects;
  return intersects_1;
}
var simplify;
var hasRequiredSimplify;
function requireSimplify() {
  if (hasRequiredSimplify) return simplify;
  hasRequiredSimplify = 1;
  const satisfies = requireSatisfies();
  const compare = requireCompare();
  simplify = (versions, range2, options) => {
    const set2 = [];
    let min = null;
    let prev = null;
    const v = versions.sort((a, b) => compare(a, b, options));
    for (const version2 of v) {
      const included = satisfies(version2, range2, options);
      if (included) {
        prev = version2;
        if (!min)
          min = version2;
      } else {
        if (prev) {
          set2.push([min, prev]);
        }
        prev = null;
        min = null;
      }
    }
    if (min)
      set2.push([min, null]);
    const ranges = [];
    for (const [min2, max] of set2) {
      if (min2 === max)
        ranges.push(min2);
      else if (!max && min2 === v[0])
        ranges.push("*");
      else if (!max)
        ranges.push(`>=${min2}`);
      else if (min2 === v[0])
        ranges.push(`<=${max}`);
      else
        ranges.push(`${min2} - ${max}`);
    }
    const simplified = ranges.join(" || ");
    const original = typeof range2.raw === "string" ? range2.raw : String(range2);
    return simplified.length < original.length ? simplified : range2;
  };
  return simplify;
}
var subset_1;
var hasRequiredSubset;
function requireSubset() {
  if (hasRequiredSubset) return subset_1;
  hasRequiredSubset = 1;
  const Range = requireRange();
  const Comparator = requireComparator();
  const { ANY } = Comparator;
  const satisfies = requireSatisfies();
  const compare = requireCompare();
  const subset = (sub, dom, options = {}) => {
    if (sub === dom)
      return true;
    sub = new Range(sub, options);
    dom = new Range(dom, options);
    let sawNonNull = false;
    OUTER: for (const simpleSub of sub.set) {
      for (const simpleDom of dom.set) {
        const isSub = simpleSubset(simpleSub, simpleDom, options);
        sawNonNull = sawNonNull || isSub !== null;
        if (isSub)
          continue OUTER;
      }
      if (sawNonNull)
        return false;
    }
    return true;
  };
  const simpleSubset = (sub, dom, options) => {
    if (sub === dom)
      return true;
    if (sub.length === 1 && sub[0].semver === ANY) {
      if (dom.length === 1 && dom[0].semver === ANY)
        return true;
      else if (options.includePrerelease)
        sub = [new Comparator(">=0.0.0-0")];
      else
        sub = [new Comparator(">=0.0.0")];
    }
    if (dom.length === 1 && dom[0].semver === ANY) {
      if (options.includePrerelease)
        return true;
      else
        dom = [new Comparator(">=0.0.0")];
    }
    const eqSet = /* @__PURE__ */ new Set();
    let gt, lt;
    for (const c of sub) {
      if (c.operator === ">" || c.operator === ">=")
        gt = higherGT(gt, c, options);
      else if (c.operator === "<" || c.operator === "<=")
        lt = lowerLT(lt, c, options);
      else
        eqSet.add(c.semver);
    }
    if (eqSet.size > 1)
      return null;
    let gtltComp;
    if (gt && lt) {
      gtltComp = compare(gt.semver, lt.semver, options);
      if (gtltComp > 0)
        return null;
      else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<="))
        return null;
    }
    for (const eq of eqSet) {
      if (gt && !satisfies(eq, String(gt), options))
        return null;
      if (lt && !satisfies(eq, String(lt), options))
        return null;
      for (const c of dom) {
        if (!satisfies(eq, String(c), options))
          return false;
      }
      return true;
    }
    let higher, lower;
    let hasDomLT, hasDomGT;
    let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
    let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
    if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
      needDomLTPre = false;
    }
    for (const c of dom) {
      hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
      hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
      if (gt) {
        if (needDomGTPre) {
          if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
            needDomGTPre = false;
          }
        }
        if (c.operator === ">" || c.operator === ">=") {
          higher = higherGT(gt, c, options);
          if (higher === c && higher !== gt)
            return false;
        } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options))
          return false;
      }
      if (lt) {
        if (needDomLTPre) {
          if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
            needDomLTPre = false;
          }
        }
        if (c.operator === "<" || c.operator === "<=") {
          lower = lowerLT(lt, c, options);
          if (lower === c && lower !== lt)
            return false;
        } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options))
          return false;
      }
      if (!c.operator && (lt || gt) && gtltComp !== 0)
        return false;
    }
    if (gt && hasDomLT && !lt && gtltComp !== 0)
      return false;
    if (lt && hasDomGT && !gt && gtltComp !== 0)
      return false;
    if (needDomGTPre || needDomLTPre)
      return false;
    return true;
  };
  const higherGT = (a, b, options) => {
    if (!a)
      return b;
    const comp = compare(a.semver, b.semver, options);
    return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
  };
  const lowerLT = (a, b, options) => {
    if (!a)
      return b;
    const comp = compare(a.semver, b.semver, options);
    return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
  };
  subset_1 = subset;
  return subset_1;
}
var semver$1;
var hasRequiredSemver;
function requireSemver() {
  if (hasRequiredSemver) return semver$1;
  hasRequiredSemver = 1;
  const internalRe = requireRe();
  semver$1 = {
    re: internalRe.re,
    src: internalRe.src,
    tokens: internalRe.t,
    SEMVER_SPEC_VERSION: requireConstants().SEMVER_SPEC_VERSION,
    SemVer: requireSemver$1(),
    compareIdentifiers: requireIdentifiers().compareIdentifiers,
    rcompareIdentifiers: requireIdentifiers().rcompareIdentifiers,
    parse: requireParse(),
    valid: requireValid$1(),
    clean: requireClean(),
    inc: requireInc(),
    diff: requireDiff(),
    major: requireMajor(),
    minor: requireMinor(),
    patch: requirePatch(),
    prerelease: requirePrerelease(),
    compare: requireCompare(),
    rcompare: requireRcompare(),
    compareLoose: requireCompareLoose(),
    compareBuild: requireCompareBuild(),
    sort: requireSort(),
    rsort: requireRsort(),
    gt: requireGt(),
    lt: requireLt(),
    eq: requireEq(),
    neq: requireNeq(),
    gte: requireGte(),
    lte: requireLte(),
    cmp: requireCmp(),
    coerce: requireCoerce(),
    Comparator: requireComparator(),
    Range: requireRange(),
    satisfies: requireSatisfies(),
    toComparators: requireToComparators(),
    maxSatisfying: requireMaxSatisfying(),
    minSatisfying: requireMinSatisfying(),
    minVersion: requireMinVersion(),
    validRange: requireValid(),
    outside: requireOutside(),
    gtr: requireGtr(),
    ltr: requireLtr(),
    intersects: requireIntersects(),
    simplifyRange: requireSimplify(),
    subset: requireSubset()
  };
  return semver$1;
}
var semverExports = requireSemver();
const semver = /* @__PURE__ */ getDefaultExportFromCjs(semverExports);
const isUrl = (url) => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};
const isUrlEncode = (url) => {
  url = url || "";
  try {
    return url !== decodeURI(url);
  } catch {
    return false;
  }
};
const handleUrlEncode = (url) => isUrlEncode(url) ? url : encodeURI(url);
const handleStreamlinePluginName = (name) => name.replace(/(@[^/]+\/)?picgo-plugin-/, "");
const simpleClone = (obj) => JSON.parse(JSON.stringify(obj));
const enforceNumber = (num) => isNaN(+num) ? 0 : +num;
const trimValues = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  );
};
function encodeFilePath(filePath) {
  return filePath.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
}
const formatEndpoint = (endpoint, sslEnabled) => {
  const hasProtocol = /^https?:\/\//.test(endpoint);
  if (!hasProtocol) {
    return `${sslEnabled ? "https" : "http"}://${endpoint}`;
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, "https://") : endpoint.replace(/^https:\/\//, "http://");
};
const trimPath = (path2) => path2.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
const formatHttpProxy = (proxy, type) => {
  if (!proxy) return void 0;
  if (/^https?:\/\//.test(proxy)) {
    const { protocol: protocol2, hostname, port: port2 } = new URL(proxy);
    return type === "string" ? `${protocol2}//${hostname}:${port2}` : {
      host: hostname,
      port: Number(port2),
      protocol: protocol2.slice(0, -1)
    };
  }
  const [host, port] = proxy.split(":");
  return type === "string" ? `http://${host}:${port}` : {
    host,
    port: port ? Number(port) : 80,
    protocol: "http"
  };
};
const getExtension = (fileName) => path.extname(fileName).slice(1);
const isImage = (fileName) => ["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "svg", "avif"].includes(getExtension(fileName));
let tray;
const setTray = (t) => {
  tray = t;
};
function setTrayToolTip(title) {
  if (tray) {
    tray.setToolTip(title);
  }
}
const handleCopyUrl = (str) => {
  if (db.get(configPaths.settings.autoCopy) !== false) {
    clipboard.writeText(str);
  }
};
const showNotification = (options = {
  title: "",
  body: "",
  clickToCopy: false,
  copyContent: "",
  clickFn: () => {
  }
}) => {
  const notification = new Notification({
    title: options.title,
    body: options.body
    // icon: options.icon || undefined
  });
  const handleClick = () => {
    if (options.clickToCopy) {
      clipboard.writeText(options.copyContent || options.body);
    }
    if (options.clickFn) {
      options.clickFn();
    }
  };
  notification.once("click", handleClick);
  notification.once("close", () => {
    notification.removeListener("click", handleClick);
  });
  notification.show();
};
const calcDurationRange = (duration) => {
  if (duration < 1e3) return 500;
  if (duration < 1500) return 1e3;
  if (duration < 3e3) return 2e3;
  if (duration < 5e3) return 3e3;
  if (duration < 7e3) return 5e3;
  if (duration < 1e4) return 8e3;
  if (duration < 12e3) return 1e4;
  if (duration < 2e4) return 15e3;
  if (duration < 3e4) return 2e4;
  return 1e5;
};
const ensureFilePath = (filePath, prefix = "file://") => {
  filePath = filePath.replace(prefix, "");
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`;
  }
  filePath = decodeURIComponent(filePath);
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`;
  }
  return "";
};
const getClipboardFilePath = () => {
  const img = clipboard.readImage();
  const platform = process.platform;
  if (!img.isEmpty() && platform === "darwin") {
    let imgPath = clipboard.read("public.file-url");
    imgPath = ensureFilePath(imgPath);
    return imgPath ? imgPath.replace("file://", "") : "";
  }
  if (img.isEmpty() && platform === "win32") {
    const imgPath = clipboard.readBuffer("FileNameW")?.toString("ucs2")?.replace(RegExp(String.fromCharCode(0), "g"), "");
    return imgPath || "";
  }
  return "";
};
const handleUrlEncodeWithSetting = (url) => db.get(configPaths.settings.encodeOutputURL) ? handleUrlEncode(url) : url;
const c1nApi = "https://c1n.cn/link/short";
const generateC1NShortUrl = async (url) => {
  const c1nToken = db.get(configPaths.settings.c1nToken) || "";
  if (!c1nToken) {
    logger.warn("c1n token is not set");
    return url;
  }
  try {
    const form = new FormData();
    form.append("url", url);
    const res = await axios.post(c1nApi, form, {
      headers: {
        token: c1nToken
      }
    });
    if (res.status >= 200 && res.status < 300 && res.data?.code === 0) {
      return res.data.data;
    }
  } catch (e) {
    logger.error(e);
  }
  return url;
};
const generateYOURLSShortUrl = async (url) => {
  let domain = db.get(configPaths.settings.yourlsDomain) || "";
  const signature = db.get(configPaths.settings.yourlsSignature) || "";
  if (!domain || !signature) {
    logger.warn("Yourls server or signature is not set");
    return url;
  }
  if (!/^https?:\/\//.test(domain)) {
    domain = `http://${domain}`;
  }
  const params = new URLSearchParams({
    signature,
    action: "shorturl",
    format: "json",
    url
  });
  try {
    const res = await axios.get(`${domain}/yourls-api.php?${params.toString()}`);
    if (res.data?.shorturl) {
      return res.data.shorturl;
    }
  } catch (e) {
    if (e.response?.data?.message?.includes("already exists in database")) {
      return e.response.data.shorturl;
    }
    logger.error(e);
  }
  return url;
};
const generateCFWORKERShortUrl = async (url) => {
  let cfWorkerHost = db.get(configPaths.settings.cfWorkerHost) || "";
  cfWorkerHost = cfWorkerHost.replace(/\/$/, "");
  if (!cfWorkerHost) {
    logger.warn("CF Worker host is not set");
    return url;
  }
  try {
    const res = await axios.post(cfWorkerHost, { url });
    if (res.data?.status === 200 && res.data?.key?.startsWith("/")) {
      return `${cfWorkerHost}${res.data.key}`;
    }
  } catch (e) {
    logger.error(e);
  }
  return url;
};
const generateSinkShortUrl = async (url) => {
  let sinkDomain = db.get(configPaths.settings.sinkDomain) || "";
  const sinkToken = db.get(configPaths.settings.sinkToken) || "";
  if (!sinkDomain || !sinkToken) {
    logger.warn("Sink domain or token is not set");
    return url;
  }
  if (!/^https?:\/\//.test(sinkDomain)) {
    sinkDomain = `http://${sinkDomain}`;
  }
  if (sinkDomain.endsWith("/")) {
    sinkDomain = sinkDomain.slice(0, -1);
  }
  try {
    const res = await axios.post(
      `${sinkDomain}/api/link/create`,
      { url },
      { headers: { Authorization: `Bearer ${sinkToken}` } }
    );
    if (res.data?.link?.slug) {
      return `${sinkDomain}/${res.data.link.slug}`;
    }
  } catch (e) {
    logger.error(e);
  }
  return url;
};
const generateShortUrl = async (url) => {
  const server2 = db.get(configPaths.settings.shortUrlServer) || IShortUrlServer.C1N;
  switch (server2) {
    case IShortUrlServer.C1N:
      return generateC1NShortUrl(url);
    case IShortUrlServer.YOURLS:
      return generateYOURLSShortUrl(url);
    case IShortUrlServer.CFWORKER:
      return generateCFWORKERShortUrl(url);
    case IShortUrlServer.SINK:
      return generateSinkShortUrl(url);
    default:
      return url;
  }
};
const REMOTE_NOTICE_URL = "https://release.piclist.cn/remote-notice.json";
const REMOTE_NOTICE_LOCAL_STORAGE_FILE = "piclist-remote-notice.json";
const STORE_PATH$6 = app.getPath("userData");
const REMOTE_NOTICE_LOCAL_STORAGE_PATH = path.join(STORE_PATH$6, REMOTE_NOTICE_LOCAL_STORAGE_FILE);
class RemoteNoticeHandler {
  remoteNotice = null;
  remoteNoticeLocalCountStorage = null;
  async init() {
    this.remoteNotice = await this.getRemoteNoticeInfo();
    this.initLocalCountStorage();
  }
  initLocalCountStorage() {
    const localCountStorage = {};
    if (!fs.existsSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH)) {
      fs.writeFileSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH, JSON.stringify({}));
    }
    try {
      const localCountStorage2 = fs.readJSONSync(
        REMOTE_NOTICE_LOCAL_STORAGE_PATH,
        "utf8"
      );
      this.remoteNoticeLocalCountStorage = localCountStorage2;
    } catch (e) {
      this.remoteNoticeLocalCountStorage = localCountStorage;
    }
  }
  saveLocalCountStorage(newData) {
    if (newData) {
      this.remoteNoticeLocalCountStorage = newData;
    }
    fs.writeFileSync(REMOTE_NOTICE_LOCAL_STORAGE_PATH, JSON.stringify(this.remoteNoticeLocalCountStorage));
  }
  async getRemoteNoticeInfo() {
    try {
      const noticeInfo = await axios({
        method: "get",
        url: REMOTE_NOTICE_URL,
        responseType: "json"
      }).then((res) => res.data);
      return noticeInfo;
    } catch {
      return null;
    }
  }
  /**
   * if the notice is not shown or is always shown, then show the notice
   * @param action
   */
  checkActionCount(action) {
    try {
      if (!this.remoteNoticeLocalCountStorage) {
        return true;
      }
      const actionCount = this.remoteNoticeLocalCountStorage[action.id];
      if (actionCount === void 0) {
        if (action.triggerCount === IRemoteNoticeTriggerCount.ALWAYS) {
          this.remoteNoticeLocalCountStorage[action.id] = 1;
        } else {
          this.remoteNoticeLocalCountStorage[action.id] = true;
        }
        return true;
      } else {
        if (action.triggerCount !== IRemoteNoticeTriggerCount.ALWAYS) {
          return false;
        } else {
          const preCount = this.remoteNoticeLocalCountStorage[action.id];
          if (typeof preCount !== "number") {
            this.remoteNoticeLocalCountStorage[action.id] = true;
            return true;
          } else {
            this.remoteNoticeLocalCountStorage[action.id] = preCount + 1;
          }
          return true;
        }
      }
    } finally {
      this.saveLocalCountStorage();
    }
  }
  async doActions(actions) {
    for (const action of actions) {
      if (this.checkActionCount(action)) {
        switch (action.type) {
          case IRemoteNoticeActionType.SHOW_DIALOG: {
            const currentWindow = windowManager.getAvailableWindow();
            dialog.showOpenDialog(currentWindow, action.data?.options);
            break;
          }
          case IRemoteNoticeActionType.SHOW_NOTICE:
            showNotification({
              title: action.data?.title || "",
              body: action.data?.content || "",
              clickToCopy: !!action.data?.copyToClipboard,
              copyContent: action.data?.copyToClipboard || "",
              clickFn() {
                if (action.data?.url) {
                  shell.openExternal(action.data.url);
                }
              }
            });
            break;
          case IRemoteNoticeActionType.OPEN_URL:
            shell.openExternal(action.data?.url || "");
            break;
          case IRemoteNoticeActionType.COMMON:
            if (action.data?.copyToClipboard) {
              clipboard.writeText(action.data.copyToClipboard);
            }
            if (action.data?.url) {
              shell.openExternal(action.data.url);
            }
            break;
          case IRemoteNoticeActionType.SHOW_MESSAGE_BOX: {
            const currentWindow = windowManager.getAvailableWindow();
            dialog.showMessageBox(currentWindow, {
              title: action.data?.title || "",
              message: action.data?.content || "",
              type: "info",
              buttons: action.data?.buttons?.map((item) => item.label) || ["Yes"]
            }).then((res) => {
              const button = action.data?.buttons?.[res.response];
              if (button?.type === "cancel") ;
              else {
                if (button?.action) {
                  this.doActions([button?.action]);
                }
              }
            });
            break;
          }
        }
      }
    }
  }
  triggerHook(hook) {
    if (!this.remoteNotice || !this.remoteNotice.list) {
      return;
    }
    const actions = this.remoteNotice.list.filter((item) => {
      if (item.versionMatch) {
        switch (item.versionMatch) {
          case "exact":
            return item.versions.includes(app.getVersion());
          case "gte":
            return item.versions.some((version2) => {
              return semverExports.gte(app.getVersion(), version2);
            });
          case "lte":
            return item.versions.some((version2) => {
              return semverExports.lte(app.getVersion(), version2);
            });
        }
      }
      return item.versions.includes(app.getVersion());
    }).map((item) => item.actions).reduce((pre, cur) => pre.concat(cur), []).filter((item) => item.hooks.includes(hook));
    this.doActions(actions);
  }
}
const remoteNoticeHandler = new RemoteNoticeHandler();
class ShortKeyService {
  commandList = /* @__PURE__ */ new Map();
  registerCommand(command, handler) {
    this.commandList.set(command, handler);
  }
  unregisterCommand(command) {
    this.commandList.delete(command);
  }
  getShortKeyHandler(command) {
    const handler = this.commandList.get(command);
    if (handler) return handler;
    logger.warn(`cannot find command: ${command}`);
    return null;
  }
  getCommandList() {
    return [...this.commandList.keys()];
  }
}
const shortKeyService = new ShortKeyService();
const getWindowId = () => {
  return new Promise((resolve) => {
    bus.once(GET_WINDOW_ID_REPONSE, (id) => {
      resolve(id);
    });
    bus.emit(GET_WINDOW_ID);
  });
};
const getSettingWindowId = () => {
  return new Promise((resolve) => {
    bus.once(GET_SETTING_WINDOW_ID_RESPONSE, (id) => {
      resolve(id);
    });
    bus.emit(GET_SETTING_WINDOW_ID);
  });
};
const CLIPBOARD_IMAGE_FOLDER = "piclist-clipboard-images";
const DEFAULT_AES_PASSWORD = "aesPassword";
const cancelDownloadLoadingFileList = "cancelDownloadLoadingFileList";
const refreshDownloadFileTransferList = "refreshDownloadFileTransferList";
const picBedsCanbeDeleted = [
  "aliyun",
  "alist",
  "alistplist",
  "aws-s3",
  "aws-s3-plist",
  "dogecloud",
  "github",
  "huaweicloud-uploader",
  "imgur",
  "local",
  "lskyplist",
  "piclist",
  "qiniu",
  "sftpplist",
  "smms",
  "tcyun",
  "upyun",
  "webdavplist"
];
const waitForRename = (window2, id) => {
  return new Promise((resolve) => {
    ipcMain.once(`${RENAME_FILE_NAME}${id}`, (_, newName) => {
      resolve(newName);
      window2.close();
    });
    window2.on("close", () => {
      resolve(null);
      ipcMain.removeAllListeners(`${RENAME_FILE_NAME}${id}`);
      windowManager.deleteById(window2.id);
    });
  });
};
const handleTalkingData = (webContents, options) => {
  const { type, fromClipboard, count, duration } = options;
  const data = {
    EventId: "upload",
    Label: type,
    MapKv: {
      by: fromClipboard ? "clipboard" : "files",
      count,
      duration: calcDurationRange(duration || 0),
      type
    }
  };
  webContents.send(TALKING_DATA_EVENT, data);
};
class Uploader {
  webContents = null;
  constructor() {
    this.init();
  }
  init() {
    picgo.on(ICOREBuildInEvent.NOTIFICATION, (message) => {
      new Notification(message).show();
    });
    picgo.on(ICOREBuildInEvent.UPLOAD_PROGRESS, (progress) => {
      this.webContents?.send("uploadProgress", progress);
    });
    picgo.on(ICOREBuildInEvent.BEFORE_TRANSFORM, () => {
      if (db.get(configPaths.settings.uploadNotification)) {
        const notification = new Notification({
          title: T("UPLOAD_PROGRESS"),
          body: T("UPLOADING")
        });
        notification.show();
      }
    });
    picgo.helper.beforeUploadPlugins.register("renameFn", {
      handle: async (ctx) => {
        const rename = db.get(configPaths.settings.rename);
        const autoRename = db.get(configPaths.settings.autoRename);
        if (autoRename || rename) {
          await Promise.all(
            ctx.output.map(async (item, index) => {
              let name;
              const fileName = autoRename ? `${dayjs().add(index, "ms").format("YYYYMMDDHHmmssSSS")}${item.extname}` : item.fileName;
              if (rename) {
                const window2 = windowManager.create(IWindowList.RENAME_WINDOW);
                ipcMain.on(GET_RENAME_FILE_NAME, (evt, _) => {
                  try {
                    if (evt.sender.id === window2.webContents.id) {
                      logger.info("rename window ready, wait for rename...");
                      window2.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, window2.webContents.id);
                    }
                  } catch (e) {
                    logger.error(e);
                  }
                });
                name = await waitForRename(window2, window2.webContents.id);
              }
              item.fileName = name || fileName;
            })
          );
        }
      }
    });
  }
  setWebContents(webContents) {
    this.webContents = webContents;
    return this;
  }
  async getClipboardImagePath() {
    const imgPath = getClipboardFilePath();
    if (imgPath) return imgPath;
    const nativeImage = clipboard.readImage();
    if (nativeImage.isEmpty()) return false;
    const buffer = nativeImage.toPNG();
    const baseDir = picgo.baseDir;
    const fileName = `${dayjs().format("YYYYMMDDHHmmssSSS")}.png`;
    const filePath = path.join(baseDir, CLIPBOARD_IMAGE_FOLDER, fileName);
    await writeFile(filePath, buffer);
    return filePath;
  }
  /**
   * use electron's clipboard image to upload
   */
  async uploadWithBuildInClipboard() {
    let imgPath = false;
    try {
      imgPath = await this.getClipboardImagePath();
      if (!imgPath) return false;
      return await this.upload([imgPath]);
    } catch (e) {
      logger.error(e);
      return false;
    } finally {
      if (imgPath && imgPath.startsWith(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER))) {
        fs.remove(imgPath);
      }
    }
  }
  async uploadWithBuildInClipboardReturnCtx(img, skipProcess = false) {
    let imgPath = false;
    try {
      imgPath = await this.getClipboardImagePath();
      if (!imgPath) return false;
      return await this.uploadReturnCtx(img ?? [imgPath], skipProcess);
    } catch (e) {
      logger.error(e);
      return false;
    } finally {
      if (imgPath && imgPath.startsWith(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER))) {
        fs.remove(imgPath);
      }
    }
  }
  async uploadReturnCtx(img, skipProcess = false) {
    try {
      const startTime = Date.now();
      const ctx = await picgo.uploadReturnCtx(img, skipProcess);
      if (!Array.isArray(ctx.output) || !ctx.output.some((item) => item.imgUrl)) return false;
      if (this.webContents) {
        handleTalkingData(this.webContents, {
          fromClipboard: !img,
          type: db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || "smms",
          count: img ? img.length : 1,
          duration: Date.now() - startTime
        });
      }
      ctx.output.forEach((item) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)));
      });
      return ctx;
    } catch (e) {
      logger.error(e);
      setTimeout(() => {
        showNotification({
          title: T("UPLOAD_FAILED"),
          body: util$1.format(e.stack),
          clickToCopy: true
        });
      }, 500);
      return false;
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME);
    }
  }
  async upload(img) {
    try {
      const startTime = Date.now();
      const output = await picgo.upload(img);
      if (!Array.isArray(output) || !output.some((item) => item.imgUrl)) return false;
      if (this.webContents) {
        handleTalkingData(this.webContents, {
          fromClipboard: !img,
          type: db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || "smms",
          count: img ? img.length : 1,
          duration: Date.now() - startTime
        });
      }
      output.forEach((item) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)));
      });
      return output.filter((item) => item.imgUrl);
    } catch (e) {
      logger.error(e);
      setTimeout(() => {
        showNotification({
          title: T("UPLOAD_FAILED"),
          body: util$1.format(e.stack),
          clickToCopy: true
        });
      }, 500);
      return false;
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME);
    }
  }
}
const uploader = new Uploader();
const completeUploaderMetaConfig = (originData) => {
  return {
    _configName: "Default",
    ...trimValues(originData),
    _id: v4(),
    _createdAt: Date.now(),
    _updatedAt: Date.now()
  };
};
const changeSecondUploader = (type, config, id) => {
  if (!type) {
    return;
  }
  if (id) {
    picgo.saveConfig({
      [configPaths.picBed.secondUploaderId]: id
    });
  }
  if (config) {
    picgo.saveConfig({
      [configPaths.picBed.secondUploaderConfig]: config
    });
  }
  picgo.saveConfig({
    [configPaths.picBed.secondUploader]: type
  });
};
const changeCurrentUploader = (type, config, id) => {
  if (!type) {
    return;
  }
  if (id) {
    picgo.saveConfig({
      [`uploader.${type}.defaultId`]: id
    });
  }
  if (config) {
    picgo.saveConfig({
      [`picBed.${type}`]: config
    });
  }
  picgo.saveConfig({
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type
  });
  setTrayToolTip(`${type} ${config?._configName || ""}`);
};
const selectUploaderConfig = (type, id) => {
  const { configList } = getUploaderConfigList(type);
  const config = configList.find((item) => item._id === id);
  if (config) {
    picgo.saveConfig({
      [`uploader.${type}.defaultId`]: id,
      [`picBed.${type}`]: config
    });
  }
};
const getUploaderConfigList = (type) => {
  if (!type) {
    return {
      configList: [],
      defaultId: ""
    };
  }
  const currentUploaderConfig = picgo.getConfig(`uploader.${type}`) ?? {};
  let configList = currentUploaderConfig.configList;
  let defaultId = currentUploaderConfig.defaultId || "";
  if (!configList) {
    const res = upgradeUploaderConfig(type);
    configList = res.configList;
    defaultId = res.defaultId;
  }
  return {
    configList,
    defaultId
  };
};
const deleteUploaderConfig = (type, id) => {
  const { configList, defaultId } = getUploaderConfigList(type);
  if (configList.length <= 1) {
    return;
  }
  let newDefaultId = defaultId;
  const updatedConfigList = configList.filter((item) => item._id !== id);
  if (id === defaultId) {
    newDefaultId = updatedConfigList[0]._id;
    changeCurrentUploader(type, updatedConfigList[0], updatedConfigList[0]._id);
  }
  picgo.saveConfig({
    [`uploader.${type}.configList`]: updatedConfigList
  });
  return {
    configList: updatedConfigList,
    defaultId: newDefaultId
  };
};
const upgradeUploaderConfig = (type) => {
  const uploaderConfig = picgo.getConfig(`picBed.${type}`) ?? {};
  if (!uploaderConfig._id) {
    Object.assign(uploaderConfig, completeUploaderMetaConfig(uploaderConfig));
  }
  const uploaderConfigList = [uploaderConfig];
  picgo.saveConfig({
    [`uploader.${type}`]: {
      configList: uploaderConfigList,
      defaultId: uploaderConfig._id
    },
    [`picBed.${type}`]: uploaderConfig
  });
  return {
    configList: uploaderConfigList,
    defaultId: uploaderConfig._id
  };
};
const updateUploaderConfig = (type, id, config) => {
  const { configList, defaultId } = getUploaderConfigList(type);
  const existConfig = configList.find((item) => item._id === id);
  let updatedConfig;
  let updatedDefaultId = defaultId;
  if (existConfig) {
    updatedConfig = Object.assign(existConfig, trimValues(config), {
      _updatedAt: Date.now()
    });
  } else {
    updatedConfig = completeUploaderMetaConfig(config);
    updatedDefaultId = updatedConfig._id;
    configList.push(updatedConfig);
  }
  picgo.saveConfig({
    [`uploader.${type}.configList`]: configList,
    [`uploader.${type}.defaultId`]: updatedDefaultId,
    [`picBed.${type}`]: updatedConfig
  });
};
const resetUploaderConfig = (type, id) => {
  const { configList } = getUploaderConfigList(type);
  configList.forEach((item) => {
    if (item._id === id) {
      Object.keys(item).forEach((key) => {
        if (!["_configName", "_id", "_createdAt", "_updatedAt"].includes(key)) {
          delete item[key];
        }
      });
    }
  });
  picgo.saveConfig({
    [`uploader.${type}.configList`]: configList
  });
};
const formatCustomLink = (customLink, item) => {
  const fileName = item.fileName.replace(new RegExp(`\\${item.extname}$`), "");
  const url = item.url || item.imgUrl;
  const extName = item.extname;
  const formatObj = {
    url,
    fileName,
    extName
  };
  const keys = Object.keys(formatObj);
  keys.forEach((item2) => {
    if (customLink.indexOf(`$${item2}`) !== -1) {
      const reg = new RegExp(`\\$${item2}`, "g");
      customLink = customLink.replace(reg, formatObj[item2]);
    }
  });
  return customLink;
};
const pasteTemplate = async (style, item, customLink) => {
  let url = item.url || item.imgUrl;
  if (item.type === "aws-s3" || item.type === "aws-s3-plist") {
    url = item.imgUrl || item.url || "";
  }
  url = handleUrlEncodeWithSetting(url);
  const useShortUrl = db.get(configPaths.settings.useShortUrl) || false;
  if (useShortUrl) {
    url = item.shortUrl && item.shortUrl !== url ? item.shortUrl : await generateShortUrl(url);
  }
  const _customLink = customLink || "![$fileName]($url)";
  const tpl = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
    Custom: formatCustomLink(_customLink, {
      ...item,
      url
    })
  };
  return [tpl[style], useShortUrl ? url : ""];
};
const handleClipboardUploading = async () => {
  const useBuiltinClipboard = db.get(configPaths.settings.useBuiltinClipboard) === void 0 ? true : !!db.get(configPaths.settings.useBuiltinClipboard);
  const win = windowManager.getAvailableWindow();
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win.webContents).uploadWithBuildInClipboard();
  }
  return await uploader.setWebContents(win.webContents).upload();
};
const handleClipboardUploadingReturnCtx = async (img, skipProcess = false) => {
  const useBuiltinClipboard = db.get(configPaths.settings.useBuiltinClipboard) === void 0 ? true : !!db.get(configPaths.settings.useBuiltinClipboard);
  const win = windowManager.getAvailableWindow();
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win.webContents).uploadWithBuildInClipboardReturnCtx(img, skipProcess);
  }
  return await uploader.setWebContents(win.webContents).uploadReturnCtx(img, skipProcess);
};
const uploadClipboardFiles = async () => {
  const { needRestore, ctx } = await handleSecondaryUpload(void 0, void 0, "clipboard");
  let img = false;
  if (needRestore) {
    const res = await handleClipboardUploadingReturnCtx(ctx ? ctx.processedInput : void 0, true);
    img = res ? res.output : false;
  } else {
    img = await handleClipboardUploading();
  }
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
      const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      const [pastedText, shortUrl] = await pasteTemplate(pasteStyle, img[0], db.get(configPaths.settings.customLink));
      img[0].shortUrl = shortUrl;
      handleCopyUrl(pastedText);
      const isShowResultNotification = db.get(configPaths.settings.uploadResultNotification) === void 0 ? true : !!db.get(configPaths.settings.uploadResultNotification);
      if (isShowResultNotification) {
        const notification = new Notification({
          title: T("UPLOAD_SUCCEED"),
          body: shortUrl || img[0].imgUrl
          // icon: img[0].imgUrl
        });
        setTimeout(() => {
          notification.show();
        }, 100);
      }
      await GalleryDB.getInstance().insert(img[0]);
      trayWindow?.webContents?.send("clipboardFiles", []);
      trayWindow?.webContents?.send("uploadFiles", img);
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW).webContents?.send("updateGallery");
      }
      return {
        url: handleUrlEncodeWithSetting(img[0].imgUrl),
        fullResult: img[0]
      };
    } else {
      const notification = new Notification({
        title: T("UPLOAD_FAILED"),
        body: T("TIPS_UPLOAD_NOT_PICTURES")
      });
      notification.show();
      return {
        url: "",
        fullResult: {}
      };
    }
  } else {
    return {
      url: "",
      fullResult: {}
    };
  }
};
const uploadChoosedFiles = async (webContents, files) => {
  const input = files.map((item) => item.path);
  const rawInput = cloneDeep(input);
  const { needRestore, ctx } = await handleSecondaryUpload(webContents, input);
  let imgs = false;
  if (needRestore) {
    const res = await uploader.setWebContents(webContents).uploadReturnCtx(ctx ? ctx.processedInput : input, true);
    imgs = res ? res.output : false;
  } else {
    imgs = await uploader.setWebContents(webContents).upload(input);
  }
  const result = [];
  if (imgs !== false) {
    const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
    const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false;
    const pasteText = [];
    for (let i = 0; i < imgs.length; i++) {
      if (deleteLocalFile) {
        fs.remove(rawInput[i]).then(() => {
          picgo.log.info(`delete local file: ${rawInput[i]}`);
        }).catch((err) => {
          picgo.log.error(err);
        });
      }
      const [pasteTextItem, shortUrl] = await pasteTemplate(
        pasteStyle,
        imgs[i],
        db.get(configPaths.settings.customLink)
      );
      imgs[i].shortUrl = shortUrl;
      pasteText.push(pasteTextItem);
      const isShowResultNotification = db.get(configPaths.settings.uploadResultNotification) === void 0 ? true : !!db.get(configPaths.settings.uploadResultNotification);
      if (isShowResultNotification) {
        const notification = new Notification({
          title: T("UPLOAD_SUCCEED"),
          body: shortUrl || imgs[i].imgUrl
          // icon: files[i].path
        });
        setTimeout(() => {
          notification.show();
        }, i * 100);
      }
      await GalleryDB.getInstance().insert(imgs[i]);
      result.push({
        url: handleUrlEncodeWithSetting(imgs[i].imgUrl),
        fullResult: imgs[i]
      });
    }
    handleCopyUrl(pasteText.join("\n"));
    windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send("uploadFiles", imgs);
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW).webContents?.send("updateGallery");
    }
    return result;
  } else {
    return [];
  }
};
const handleSecondaryUpload = async (webContents, input, uploadType = "file") => {
  const enableSecondUploader = db.get(configPaths.settings.enableSecondUploader) || false;
  let currentPicBedType = "";
  let currentPicBedConfig = {};
  let currentPicBedConfigId = "";
  let needRestore = false;
  let ctx = false;
  if (enableSecondUploader) {
    const secondUploader = db.get(configPaths.picBed.secondUploader);
    const secondUploaderConfig = db.get(configPaths.picBed.secondUploaderConfig);
    const secondUploaderId = db.get(configPaths.picBed.secondUploaderId);
    const currentPicBed = db.get("picBed") || {};
    currentPicBedType = currentPicBed.uploader || currentPicBed.current || "smms";
    currentPicBedConfig = currentPicBed[currentPicBedType] || {};
    currentPicBedConfigId = currentPicBedConfig._id;
    if (secondUploader === currentPicBedType && secondUploaderConfig._configName === currentPicBedConfig._configName && secondUploaderId === currentPicBedConfigId) {
      picgo.log.info("second uploader is the same as current uploader");
    } else {
      needRestore = true;
      let secondImgs = false;
      changeCurrentUploader(secondUploader, secondUploaderConfig, secondUploaderId);
      if (uploadType === "clipboard") {
        ctx = await handleClipboardUploadingReturnCtx(void 0);
      } else {
        ctx = await uploader.setWebContents(webContents).uploadReturnCtx(input);
      }
      secondImgs = ctx ? ctx.output : false;
      if (secondImgs !== false) {
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
        if (uploadType === "clipboard") {
          if (secondImgs.length > 0) {
            await GalleryDB.getInstance().insert(secondImgs[0]);
            trayWindow?.webContents?.send("clipboardFiles", []);
            trayWindow?.webContents?.send("uploadFiles", secondImgs);
          }
        } else {
          for (const secondImgsItem of secondImgs) {
            await GalleryDB.getInstance().insert(secondImgsItem);
          }
          if (uploadType === "tray") {
            trayWindow?.webContents?.send("dragFiles", secondImgs);
          } else {
            trayWindow?.webContents?.send("uploadFiles", secondImgs);
          }
        }
        if (windowManager.has(IWindowList.SETTING_WINDOW) && uploadType !== "tray") {
          windowManager.get(IWindowList.SETTING_WINDOW).webContents?.send("updateGallery");
        }
      }
    }
  }
  if (needRestore) {
    changeCurrentUploader(currentPicBedType, currentPicBedConfig, currentPicBedConfigId);
  }
  return {
    needRestore,
    ctx
  };
};
class GuiApi {
  static instance;
  windowId = -1;
  settingWindowId = -1;
  constructor() {
    console.log("init guiapi");
  }
  static getInstance() {
    if (!GuiApi.instance) {
      GuiApi.instance = new GuiApi();
    }
    return GuiApi.instance;
  }
  async showSettingWindow() {
    this.settingWindowId = await getSettingWindowId();
    const settingWindow = BrowserWindow.fromId(this.settingWindowId);
    if (settingWindow?.isVisible()) {
      return true;
    }
    settingWindow?.show();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1e3);
    });
  }
  getWebcontentsByWindowId(id) {
    return BrowserWindow.fromId(id)?.webContents;
  }
  async showInputBox(options = {
    title: "",
    placeholder: ""
  }) {
    await this.showSettingWindow();
    this.getWebcontentsByWindowId(this.settingWindowId)?.send(SHOW_INPUT_BOX, options);
    return new Promise((resolve) => {
      ipcMain.once(SHOW_INPUT_BOX, (_, value) => {
        resolve(value);
      });
    });
  }
  async showFileExplorer(options = {}) {
    this.windowId = await getWindowId();
    const res = await dialog.showOpenDialog(BrowserWindow.fromId(this.windowId), options);
    return res.filePaths || [];
  }
  async upload(input) {
    this.windowId = await getWindowId();
    const webContents = this.getWebcontentsByWindowId(this.windowId);
    const rawInput = cloneDeep(input);
    const { needRestore, ctx } = await handleSecondaryUpload(webContents, input);
    let imgs = false;
    if (needRestore) {
      const res = await uploader.setWebContents(webContents).uploadReturnCtx(ctx ? ctx.processedInput : input, true);
      imgs = res ? res.output : false;
    } else {
      imgs = await uploader.setWebContents(webContents).upload(input);
    }
    if (imgs !== false) {
      const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false;
      const pasteText = [];
      for (let i = 0; i < imgs.length; i++) {
        if (deleteLocalFile) {
          await fs.remove(rawInput[i]);
        }
        const [pasteTextItem, shortUrl] = await pasteTemplate(
          pasteStyle,
          imgs[i],
          db.get(configPaths.settings.customLink)
        );
        imgs[i].shortUrl = shortUrl;
        pasteText.push(pasteTextItem);
        const isShowResultNotification = db.get(configPaths.settings.uploadResultNotification) === void 0 ? true : !!db.get(configPaths.settings.uploadResultNotification);
        if (isShowResultNotification) {
          const notification = new Notification({
            title: T("UPLOAD_SUCCEED"),
            body: shortUrl || imgs[i].imgUrl
            // icon: imgs[i].imgUrl
          });
          setTimeout(() => {
            notification.show();
          }, i * 100);
        }
        await GalleryDB.getInstance().insert(imgs[i]);
      }
      handleCopyUrl(pasteText.join("\n"));
      webContents?.send("uploadFiles", imgs);
      webContents?.send("updateGallery");
      return imgs;
    }
    return [];
  }
  showNotification(options = {
    title: "",
    body: ""
  }) {
    const notification = new Notification({
      title: options.title,
      body: options.body
    });
    notification.show();
  }
  showMessageBox(options = {
    title: "",
    message: "",
    type: "info",
    buttons: ["Yes", "No"]
  }) {
    return new Promise((resolve) => {
      getWindowId().then((id) => {
        this.windowId = id;
        dialog.showMessageBox(BrowserWindow.fromId(id), options).then((res) => {
          resolve({
            result: res.response,
            checkboxChecked: res.checkboxChecked
          });
        });
      });
    });
  }
  /**
   * get picgo config/data path
   */
  async getConfigPath() {
    const currentConfigPath = dbPathChecker();
    const galleryDBPath = getGalleryDBPath().dbPath;
    return {
      defaultConfigPath,
      currentConfigPath,
      galleryDBPath
    };
  }
  get galleryDB() {
    return new Proxy(GalleryDB.getInstance(), {
      get(target, prop) {
        if (prop === "overwrite") {
          return new Proxy(GalleryDB.getInstance().overwrite, {
            apply(target2, ctx, args) {
              return new Promise((resolve) => {
                const guiApi = GuiApi.getInstance();
                guiApi.showMessageBox({
                  title: T("TIPS_WARNING"),
                  message: T("TIPS_PLUGIN_REMOVE_GALLERY_ITEM"),
                  type: "info",
                  buttons: ["Yes", "No"]
                }).then((res) => {
                  if (res.result === 0) {
                    resolve(Reflect.apply(target2, ctx, args));
                  } else {
                    resolve(void 0);
                  }
                });
              });
            }
          });
        }
        if (prop === "removeById") {
          return new Proxy(GalleryDB.getInstance().removeById, {
            apply(target2, ctx, args) {
              return new Promise((resolve) => {
                const guiApi = GuiApi.getInstance();
                guiApi.showMessageBox({
                  title: T("TIPS_WARNING"),
                  message: T("TIPS_PLUGIN_REMOVE_GALLERY_ITEM"),
                  type: "info",
                  buttons: ["Yes", "No"]
                }).then((res) => {
                  if (res.result === 0) {
                    resolve(Reflect.apply(target2, ctx, args));
                  } else {
                    resolve(void 0);
                  }
                });
              });
            }
          });
        }
        return Reflect.get(target, prop);
      }
    });
  }
}
class ShortKeyHandler {
  isInModifiedMode = false;
  constructor() {
    bus.on(TOGGLE_SHORTKEY_MODIFIED_MODE, (flag) => {
      this.isInModifiedMode = flag;
    });
  }
  async init() {
    this.initBuiltInShortKey();
    await this.initPluginsShortKey();
  }
  initBuiltInShortKey() {
    const commands = db.get(configPaths.settings.shortKey._path);
    Object.keys(commands).filter((item) => item.includes("picgo:")).forEach((command) => {
      const config = commands[command];
      if (config.enable) {
        globalShortcut.register(config.key, () => {
          this.handler(command);
        });
      }
    });
  }
  async initPluginsShortKey() {
    const pluginList = picgo.pluginLoader.getList();
    for (const item of pluginList) {
      const plugin = await picgo.pluginLoader.getPlugin(item);
      if (plugin && plugin.commands) {
        if (typeof plugin.commands !== "function") {
          logger.warn(`${item}'s commands is not a function`);
          continue;
        }
        const commands = plugin.commands(picgo);
        for (const cmd of commands) {
          const command = `${item}:${cmd.name}`;
          if (db.has(`settings.shortKey[${command}]`)) {
            const commandConfig = db.get(`settings.shortKey.${command}`);
            if (commandConfig.enable) {
              this.registerShortKey(commandConfig, command, cmd.handle, false);
            }
          } else {
            this.registerShortKey(cmd, command, cmd.handle, true);
          }
        }
      } else {
        continue;
      }
    }
  }
  registerShortKey(config, command, handler, writeFlag) {
    shortKeyService.registerCommand(command, handler);
    if (config.key) {
      globalShortcut.register(config.key, () => {
        this.handler(command);
      });
    } else {
      logger.warn(`${command} do not provide a key to bind`);
    }
    if (writeFlag) {
      picgo.saveConfig({
        [`settings.shortKey.${command}`]: {
          enable: true,
          name: config.name,
          label: config.label,
          key: config.key
        }
      });
    }
  }
  // enable or disable shortKey
  bindOrUnbindShortKey(item, from) {
    const command = `${from}:${item.name}`;
    if (item.enable === false) {
      globalShortcut.unregister(item.key);
      picgo.saveConfig({
        [`settings.shortKey.${command}.enable`]: false
      });
      return true;
    } else {
      if (globalShortcut.isRegistered(item.key)) {
        return false;
      } else {
        picgo.saveConfig({
          [`settings.shortKey.${command}.enable`]: true
        });
        globalShortcut.register(item.key, () => {
          this.handler(command);
        });
        return true;
      }
    }
  }
  // update shortKey bindings
  updateShortKey(item, oldKey, from) {
    const command = `${from}:${item.name}`;
    if (globalShortcut.isRegistered(item.key)) return false;
    globalShortcut.unregister(oldKey);
    picgo.saveConfig({
      [`settings.shortKey.${command}.key`]: item.key
    });
    globalShortcut.register(item.key, () => {
      this.handler(`${from}:${item.name}`);
    });
    return true;
  }
  async handler(command) {
    if (this.isInModifiedMode) {
      return;
    }
    if (command.includes("picgo:")) {
      bus.emit(command);
    } else if (command.includes("picgo-plugin-")) {
      const handler = shortKeyService.getShortKeyHandler(command);
      if (handler) {
        return handler(picgo, GuiApi.getInstance());
      }
    } else {
      logger.warn(`can not find command: ${command}`);
    }
  }
  async registerPluginShortKey(pluginName) {
    const plugin = await picgo.pluginLoader.getPlugin(pluginName);
    if (plugin && plugin.commands) {
      if (typeof plugin.commands !== "function") {
        logger.warn(`${pluginName}'s commands is not a function`);
        return;
      }
      const commands = plugin.commands(picgo);
      for (const cmd of commands) {
        const command = `${pluginName}:${cmd.name}`;
        if (db.has(`settings.shortKey[${command}]`)) {
          const commandConfig = db.get(`settings.shortKey[${command}]`);
          this.registerShortKey(commandConfig, command, cmd.handle, false);
        } else {
          this.registerShortKey(cmd, command, cmd.handle, true);
        }
      }
    }
  }
  unregisterPluginShortKey(pluginName) {
    const commands = db.get(configPaths.settings.shortKey._path);
    const keyList = Object.keys(commands).filter((command) => command.includes(pluginName)).map((command) => {
      return {
        command,
        key: commands[command].key
      };
    });
    keyList.forEach((item) => {
      globalShortcut.unregister(item.key);
      shortKeyService.unregisterCommand(item.command);
      db.unset(configPaths.settings.shortKey._path, item.command);
    });
  }
}
const shortKeyHandler = new ShortKeyHandler();
const STORE_PATH$5 = dbPathDir();
const getConfig = (name, type, ctx) => {
  let config = [];
  if (name === "") {
    return config;
  } else {
    const handler = ctx.helper[type].get(name);
    if (handler) {
      if (handler.config) {
        config = handler.config(ctx);
      }
    }
    return config;
  }
};
const handleConfigWithFunction$1 = (config) => {
  for (const i in config) {
    if (typeof config[i].default === "function") {
      config[i].default = config[i].default();
    }
    if (typeof config[i].choices === "function") {
      config[i].choices = config[i].choices();
    }
  }
  return config;
};
const getPluginList = async () => {
  const pluginList = picgo.pluginLoader.getFullList();
  const list = [];
  for (const i in pluginList) {
    const plugin = await picgo.pluginLoader.getPlugin(pluginList[i]);
    const pluginPath = path.join(STORE_PATH$5, `/node_modules/${pluginList[i]}`);
    const pluginPKGPath = path.join(pluginPath, "package.json");
    if (!fs.existsSync(pluginPKGPath)) {
      continue;
    }
    const pluginPKG = fs.readJSONSync(pluginPKGPath, "utf8");
    const uploaderName = plugin.uploader || "";
    const transformerName = plugin.transformer || "";
    let menu = [];
    if (plugin.guiMenu) {
      menu = plugin.guiMenu(picgo).map((item) => ({
        label: item.label
      }));
    }
    let gui = false;
    if (pluginPKG.keywords && pluginPKG.keywords.length > 0) {
      if (pluginPKG.keywords.includes("picgo-gui-plugin")) {
        gui = true;
      }
    }
    const obj = {
      name: handleStreamlinePluginName(pluginList[i]),
      fullName: pluginList[i],
      author: pluginPKG.author.name || pluginPKG.author,
      description: pluginPKG.description,
      logo: "file://" + path.join(pluginPath, "logo.png").split(path.sep).join("/"),
      version: pluginPKG.version,
      gui,
      config: {
        plugin: {
          fullName: pluginList[i],
          name: handleStreamlinePluginName(pluginList[i]),
          config: plugin.config ? handleConfigWithFunction$1(plugin.config(picgo)) : []
        },
        uploader: {
          name: uploaderName,
          config: handleConfigWithFunction$1(getConfig(uploaderName, IPicGoHelperType.uploader, picgo))
        },
        transformer: {
          name: transformerName,
          config: handleConfigWithFunction$1(getConfig(uploaderName, IPicGoHelperType.transformer, picgo))
        }
      },
      enabled: picgo.getConfig(`picgoPlugins.${pluginList[i]}`),
      homepage: pluginPKG.homepage ? pluginPKG.homepage : "",
      guiMenu: menu,
      ing: false
    };
    list.push(obj);
  }
  return list;
};
const handleNPMError = () => {
  const handler = (msg) => {
    if (msg === "NPM is not installed") {
      dialog.showMessageBox({
        title: T("TIPS_ERROR"),
        message: T("TIPS_INSTALL_NODE_AND_RELOAD_PICGO"),
        buttons: ["Yes"]
      }).then((res) => {
        if (res.response === 0) {
          shell.openExternal("https://nodejs.org/");
        }
      });
    }
  };
  picgo.once(ICOREBuildInEvent.FAILED, handler);
  return () => picgo.off(ICOREBuildInEvent.FAILED, handler);
};
const handlePluginUpdate = async (fullName) => {
  const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
  const dispose = handleNPMError();
  const res = await picgo.pluginHandler.update(typeof fullName === "string" ? [fullName] : fullName);
  if (res.success) {
    window2.webContents.send("updateSuccess", res.body[0]);
  } else {
    showNotification({
      title: T("PLUGIN_UPDATE_FAILED"),
      body: res.body
    });
  }
  window2.webContents.send("hideLoading");
  dispose();
};
const handlePluginUninstall = async (fullName) => {
  const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
  const dispose = handleNPMError();
  const res = await picgo.pluginHandler.uninstall([fullName]);
  if (res.success) {
    window2.webContents.send("uninstallSuccess", res.body[0]);
    shortKeyHandler.unregisterPluginShortKey(res.body[0]);
  } else {
    showNotification({
      title: T("PLUGIN_UNINSTALL_FAILED"),
      body: res.body
    });
  }
  window2.webContents.send("hideLoading");
  dispose();
};
const pluginGetListFunc = async (event) => {
  try {
    const list = simpleClone(await getPluginList());
    event.sender.send("pluginList", list);
  } catch (e) {
    event.sender.send("pluginList", []);
    showNotification({
      title: T("TIPS_GET_PLUGIN_LIST_FAILED"),
      body: e.message
    });
    picgo.log.error(e);
  }
};
const pluginInstallFunc = async (event, args) => {
  const fullName = args[0];
  const dispose = handleNPMError();
  const res = await picgo.pluginHandler.install([fullName]);
  event.sender.send("installPlugin", {
    success: res.success,
    body: fullName,
    errMsg: res.success ? "" : res.body
  });
  if (res.success) {
    await shortKeyHandler.registerPluginShortKey(res.body[0]);
  } else {
    showNotification({
      title: T("PLUGIN_INSTALL_FAILED"),
      body: res.body
    });
  }
  event.sender.send("hideLoading");
  dispose();
};
const pluginImportLocalFunc = async (event) => {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
  const res = await dialog.showOpenDialog(settingWindow, {
    properties: ["openDirectory"]
  });
  const filePaths = res.filePaths;
  if (filePaths.length > 0) {
    const res2 = await picgo.pluginHandler.install(filePaths);
    if (res2.success) {
      try {
        const list = simpleClone(await getPluginList());
        event.sender.send("pluginList", list);
      } catch (e) {
        event.sender.send("pluginList", []);
        showNotification({
          title: T("TIPS_GET_PLUGIN_LIST_FAILED"),
          body: e.message
        });
      }
      showNotification({
        title: T("PLUGIN_IMPORT_SUCCEED"),
        body: ""
      });
    } else {
      showNotification({
        title: T("PLUGIN_IMPORT_FAILED"),
        body: res2.body
      });
    }
  }
  event.sender.send("hideLoading");
};
const pluginUpdateAllFunc = async (_, args) => {
  handlePluginUpdate(args[0]);
};
class ClipboardWatcher extends EventEmitter {
  // eslint-disable-next-line no-undef
  timer;
  lastImageHash;
  constructor() {
    super();
    this.lastImageHash = null;
    this.timer = null;
  }
  startListening(watchDelay = 500) {
    this.stopListening(false);
    this.timer = setInterval(() => {
      const image = clipboard.readImage();
      if (image.isEmpty()) return;
      const currentImageHash = this.getImageHash(image);
      if (this.lastImageHash === null || this.lastImageHash === currentImageHash) {
        this.lastImageHash = currentImageHash;
        return;
      }
      this.lastImageHash = currentImageHash;
      this.emit("change");
    }, watchDelay);
    logger.info("Start to watch clipboard");
  }
  stopListening(isLog = true) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.lastImageHash = null;
    }
    isLog && logger.info("Stop to watch clipboard");
  }
  getImageHash(image) {
    const buffer = image.toBitmap();
    return crypto.createHash("md5").update(buffer).digest("hex");
  }
}
const clipboardPoll = new ClipboardWatcher();
const getPicBeds = () => {
  const picBedTypes = picgo.helper.uploader.getIdList();
  const picBedFromDB = picgo.getConfig(configPaths.picBed.list) || [];
  const picBeds = picBedTypes.map((item) => {
    const visible = picBedFromDB.find((i) => i.type === item);
    return {
      type: item,
      name: picgo.helper.uploader.get(item).name || item,
      visible: visible ? visible.visible : true
    };
  }).sort((a) => {
    if (a.type === "tcyun") {
      return -1;
    }
    return 0;
  });
  return picBeds;
};
function openMiniWindow(hideSettingWindow = true) {
  const miniWindow = windowManager.get(IWindowList.MINI_WINDOW);
  miniWindow.removeAllListeners();
  if (db.get(configPaths.settings.miniWindowOntop)) {
    miniWindow.setAlwaysOnTop(true);
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const lastPosition = db.get(configPaths.settings.miniWindowPosition);
  if (lastPosition) {
    miniWindow.setPosition(lastPosition[0], lastPosition[1]);
  } else {
    miniWindow.setPosition(width - 100, height - 100);
  }
  const setPositionFunc = () => {
    const position = miniWindow.getPosition();
    db.set(configPaths.settings.miniWindowPosition, position);
  };
  miniWindow.on("close", setPositionFunc);
  miniWindow.on("move", setPositionFunc);
  miniWindow.show();
  miniWindow.focus();
  if (hideSettingWindow) {
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
    settingWindow.hide();
  } else {
    const autoCloseMainWindow = db.get(configPaths.settings.autoCloseMainWindow) || false;
    if (windowManager.has(IWindowList.SETTING_WINDOW) && autoCloseMainWindow) {
      windowManager.get(IWindowList.SETTING_WINDOW).hide();
    }
  }
}
const openMainWindow = () => {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
  const autoCloseMiniWindow = db.get(configPaths.settings.autoCloseMiniWindow) || false;
  settingWindow.show();
  settingWindow.focus();
  if (windowManager.has(IWindowList.MINI_WINDOW) && autoCloseMiniWindow) {
    windowManager.get(IWindowList.MINI_WINDOW).hide();
  }
};
const hideMiniWindow = () => {
  if (windowManager.has(IWindowList.MINI_WINDOW)) {
    windowManager.get(IWindowList.MINI_WINDOW).hide();
  }
};
const buildMiniPageMenu = () => {
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false;
  const ClipboardWatcher2 = clipboardPoll;
  const submenu = buildPicBedListMenu();
  const template = [
    {
      label: T("OPEN_MAIN_WINDOW"),
      click: openMainWindow
    },
    {
      label: T("CHOOSE_DEFAULT_PICBED"),
      type: "submenu",
      submenu
    },
    {
      label: T("UPLOAD_BY_CLIPBOARD"),
      click() {
        uploadClipboardFiles();
      }
    },
    {
      label: T("HIDE_MINI_WINDOW"),
      click() {
        BrowserWindow.getFocusedWindow().hide();
      }
    },
    {
      label: T("START_WATCH_CLIPBOARD"),
      click() {
        db.set(configPaths.settings.isListeningClipboard, true);
        ClipboardWatcher2.startListening();
        ClipboardWatcher2.on("change", () => {
          picgo.log.info("clipboard changed");
          uploadClipboardFiles();
        });
        buildMiniPageMenu();
      },
      visible: !isListeningClipboard
    },
    {
      label: T("STOP_WATCH_CLIPBOARD"),
      click() {
        db.set(configPaths.settings.isListeningClipboard, false);
        ClipboardWatcher2.stopListening();
        ClipboardWatcher2.removeAllListeners();
        buildMiniPageMenu();
      },
      visible: isListeningClipboard
    },
    {
      label: T("RELOAD_APP"),
      click() {
        app.relaunch();
        app.exit(0);
      }
    },
    {
      role: "quit",
      label: T("QUIT")
    }
  ];
  return Menu.buildFromTemplate(template);
};
const buildMainPageMenu = (win) => {
  const template = [
    {
      label: T("ABOUT"),
      click() {
        dialog.showMessageBox({
          title: "PicList",
          message: "PicList",
          detail: `Version: ${pkg.version}
Author: Kuingsmile
Github: https://github.com/Kuingsmile/PicList`
        });
      }
    },
    {
      label: T("SHOW_PICBED_QRCODE"),
      click() {
        win?.webContents?.send(SHOW_MAIN_PAGE_QRCODE);
      }
    },
    {
      label: T("OPEN_TOOLBOX"),
      click() {
        const window2 = windowManager.create(IWindowList.TOOLBOX_WINDOW);
        window2?.show();
      }
    },
    {
      label: T("SHOW_DEVTOOLS"),
      click() {
        win?.webContents?.openDevTools({ mode: "detach" });
      }
    },
    {
      label: T("FEEDBACK"),
      click() {
        const url = "https://github.com/Kuingsmile/PicList/issues";
        shell.openExternal(url);
      }
    }
  ];
  return Menu.buildFromTemplate(template);
};
const buildSecondPicBedMenu = () => {
  const picBeds = getPicBeds();
  const secondUploader = picgo.getConfig(configPaths.picBed.secondUploader);
  const defaultSecondUploaderId = picgo.getConfig(configPaths.picBed.secondUploaderId);
  const currentPicBedName = picBeds.find((item) => item.type === secondUploader)?.name;
  const picBedConfigList = picgo.getConfig("uploader");
  const currentPicBedMenuItem = [
    {
      label: `${T("CURRENT_SECOND_PICBED")} - ${currentPicBedName || "None"}`,
      enabled: false
    },
    {
      type: "separator"
    }
  ];
  let submenu = picBeds.filter((item) => item.visible).map((item) => {
    const configList = picBedConfigList?.[item.type]?.configList;
    const hasSubmenu = !!configList;
    return {
      label: item.name,
      type: !hasSubmenu ? "checkbox" : void 0,
      checked: !hasSubmenu ? secondUploader === item.type : void 0,
      submenu: hasSubmenu ? configList.map((config) => {
        return {
          label: config._configName || "Default",
          // if only one config, use checkbox, or radio will checked as default
          // see: https://github.com/electron/electron/issues/21292
          type: "checkbox",
          checked: config._id === defaultSecondUploaderId && item.type === secondUploader,
          click: function() {
            changeSecondUploader(item.type, config, config._id);
          }
        };
      }) : void 0,
      click: !hasSubmenu ? function() {
        picgo.saveConfig({
          [configPaths.picBed.secondUploader]: item.type
        });
      } : void 0
    };
  });
  submenu = currentPicBedMenuItem.concat(submenu);
  return Menu.buildFromTemplate(submenu);
};
const buildPicBedListMenu = () => {
  const picBeds = getPicBeds();
  const currentPicBed = picgo.getConfig(configPaths.picBed.uploader);
  const currentPicBedName = picBeds.find((item) => item.type === currentPicBed)?.name;
  const picBedConfigList = picgo.getConfig("uploader");
  const currentPicBedMenuItem = [
    {
      label: `${T("CURRENT_PICBED")} - ${currentPicBedName}`,
      enabled: false
    },
    {
      type: "separator"
    }
  ];
  let submenu = picBeds.filter((item) => item.visible).map((item) => {
    const configList = picBedConfigList?.[item.type]?.configList;
    const defaultId = picBedConfigList?.[item.type]?.defaultId;
    const hasSubmenu = !!configList;
    return {
      label: item.name,
      type: !hasSubmenu ? "checkbox" : void 0,
      checked: !hasSubmenu ? currentPicBed === item.type : void 0,
      submenu: hasSubmenu ? configList.map((config) => {
        return {
          label: config._configName || "Default",
          // if only one config, use checkbox, or radio will checked as default
          // see: https://github.com/electron/electron/issues/21292
          type: "checkbox",
          checked: config._id === defaultId && item.type === currentPicBed,
          click: function() {
            changeCurrentUploader(item.type, config, config._id);
            if (windowManager.has(IWindowList.SETTING_WINDOW)) {
              windowManager.get(IWindowList.SETTING_WINDOW).webContents.send("syncPicBed");
            }
            setTrayToolTip(`${item.type} ${config._configName || "Default"}`);
          }
        };
      }) : void 0,
      click: !hasSubmenu ? function() {
        picgo.saveConfig({
          [configPaths.picBed.current]: item.type,
          [configPaths.picBed.uploader]: item.type
        });
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW).webContents.send("syncPicBed");
        }
        setTrayToolTip(item.type);
      } : void 0
    };
  });
  submenu = currentPicBedMenuItem.concat(submenu);
  return Menu.buildFromTemplate(submenu);
};
const handleRestoreState = (item, name) => {
  if (item === "uploader") {
    const current = picgo.getConfig(configPaths.picBed.current);
    if (current === name) {
      picgo.saveConfig({
        [configPaths.picBed.current]: "smms",
        [configPaths.picBed.uploader]: "smms"
      });
    }
  }
  if (item === "transformer") {
    const current = picgo.getConfig(configPaths.picBed.transformer);
    if (current === name) {
      picgo.saveConfig({
        [configPaths.picBed.transformer]: "path"
      });
    }
  }
};
const buildPluginPageMenu = (plugin) => {
  const menu = [
    {
      label: T("ENABLE_PLUGIN"),
      enabled: !plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: true
        });
        const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, true);
      }
    },
    {
      label: T("DISABLE_PLUGIN"),
      enabled: plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: false
        });
        const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName);
        window2.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, false);
        window2.webContents.send(PICGO_HANDLE_PLUGIN_DONE, plugin.fullName);
        if (plugin.config.transformer.name) {
          handleRestoreState("transformer", plugin.config.transformer.name);
        }
        if (plugin.config.uploader.name) {
          handleRestoreState("uploader", plugin.config.uploader.name);
        }
      }
    },
    {
      label: T("UNINSTALL_PLUGIN"),
      click() {
        const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName);
        handlePluginUninstall(plugin.fullName);
      }
    },
    {
      label: T("UPDATE_PLUGIN"),
      click() {
        const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName);
        handlePluginUpdate(plugin.fullName);
      }
    }
  ];
  for (const i in plugin.config) {
    if (plugin.config[i].config.length > 0) {
      const obj = {
        label: T("CONFIG_THING", {
          c: `${i} - ${plugin.config[i].fullName || plugin.config[i].name}`
        }),
        click() {
          const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
          const currentType = i;
          const configName = plugin.config[i].fullName || plugin.config[i].name;
          const config = plugin.config[i].config;
          window2.webContents.send(PICGO_CONFIG_PLUGIN, currentType, configName, config);
        }
      };
      menu.push(obj);
    }
  }
  if (plugin.config.transformer.name) {
    const currentTransformer = picgo.getConfig(configPaths.picBed.transformer) || "path";
    const pluginTransformer = plugin.config.transformer.name;
    const obj = {
      label: `${currentTransformer === pluginTransformer ? T("DISABLE") : T("ENABLE")}transformer - ${plugin.config.transformer.name}`,
      click() {
        const transformer = plugin.config.transformer.name;
        const currentTransformer2 = picgo.getConfig(configPaths.picBed.transformer) || "path";
        if (currentTransformer2 === transformer) {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: "path"
          });
        } else {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: transformer
          });
        }
      }
    };
    menu.push(obj);
  }
  if (plugin.guiMenu) {
    menu.push({
      type: "separator"
    });
    for (const i of plugin.guiMenu) {
      menu.push({
        label: i.label,
        async click() {
          const picgPlugin = await picgo.pluginLoader.getPlugin(plugin.fullName);
          if (picgPlugin?.guiMenu?.(picgo)?.length) {
            const menu2 = picgPlugin.guiMenu(picgo);
            menu2.forEach((item) => {
              if (item.label === i.label) {
                item.handle(picgo, GuiApi.getInstance());
              }
            });
          }
        }
      });
    }
  }
  return Menu.buildFromTemplate(menu);
};
const isMacOS = process$1.platform === "darwin";
let version;
const clean = (version2) => version2.split(".").length === 1 ? `${version2}.0.0` : version2.split(".").length === 2 ? `${version2}.0` : version2;
const parseVersion = (plist) => {
  const matches = /<key>ProductVersion<\/key>\s*<string>([\d.]+)<\/string>/.exec(plist);
  if (!matches) {
    return;
  }
  return matches[1].replace("10.16", "11");
};
function macOSVersion() {
  if (!isMacOS) return "";
  if (!version) {
    const file = fs$1.readFileSync("/System/Library/CoreServices/SystemVersion.plist", "utf8");
    const matches = parseVersion(file);
    if (!matches) {
      return "";
    }
    version = clean(matches);
  }
  return version;
}
if (process$1.env.NODE_ENV === "test") {
  macOSVersion._parseVersion = parseVersion;
}
function isMacOSVersionGreaterThanOrEqualTo(version2) {
  if (!isMacOS) {
    return false;
  }
  version2 = version2.replace("10.16", "11");
  return semver.gte(macOSVersion(), clean(version2));
}
let contextMenu;
function setDockMenu() {
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false;
  const dockMenu = Menu.buildFromTemplate([
    {
      label: T("OPEN_MAIN_WINDOW"),
      click: openMainWindow
    },
    {
      label: T("START_WATCH_CLIPBOARD"),
      click() {
        db.set(configPaths.settings.isListeningClipboard, true);
        clipboardPoll.startListening();
        clipboardPoll.on("change", () => {
          picgo.log.info("clipboard changed");
          uploadClipboardFiles();
        });
        setDockMenu();
      },
      visible: !isListeningClipboard
    },
    {
      label: T("STOP_WATCH_CLIPBOARD"),
      click() {
        db.set(configPaths.settings.isListeningClipboard, false);
        clipboardPoll.stopListening();
        clipboardPoll.removeAllListeners();
        setDockMenu();
      },
      visible: isListeningClipboard
    }
  ]);
  app.dock?.setMenu(dockMenu);
}
function createMenu() {
  const submenu = buildPicBedListMenu();
  const appMenu = Menu.buildFromTemplate([
    {
      label: "PicList",
      submenu: [
        { label: T("OPEN_MAIN_WINDOW"), click: openMainWindow },
        {
          label: T("RELOAD_APP"),
          click() {
            app.relaunch();
            app.exit(0);
          }
        }
      ]
    },
    { label: T("CHOOSE_DEFAULT_PICBED"), type: "submenu", submenu },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
      ]
    },
    {
      label: T("QUIT"),
      submenu: [{ label: T("QUIT"), role: "quit" }]
    }
  ]);
  Menu.setApplicationMenu(appMenu);
}
function createContextMenu() {
  const ClipboardWatcher2 = clipboardPoll;
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false;
  const isMiniWindowVisible = windowManager.has(IWindowList.MINI_WINDOW) && windowManager.get(IWindowList.MINI_WINDOW).isVisible();
  const startWatchClipboard = () => {
    db.set(configPaths.settings.isListeningClipboard, true);
    ClipboardWatcher2.startListening();
    ClipboardWatcher2.on("change", () => {
      picgo.log.info("clipboard changed");
      uploadClipboardFiles();
    });
    createContextMenu();
  };
  const stopWatchClipboard = () => {
    db.set(configPaths.settings.isListeningClipboard, false);
    ClipboardWatcher2.stopListening();
    ClipboardWatcher2.removeAllListeners();
    createContextMenu();
  };
  if (process.platform === "darwin" || process.platform === "win32") {
    const submenu = buildPicBedListMenu();
    const template = [
      { label: T("OPEN_MAIN_WINDOW"), click: openMainWindow },
      { label: T("CHOOSE_DEFAULT_PICBED"), type: "submenu", submenu },
      {
        label: T("START_WATCH_CLIPBOARD"),
        click: startWatchClipboard,
        visible: !isListeningClipboard
      },
      {
        label: T("STOP_WATCH_CLIPBOARD"),
        click: stopWatchClipboard,
        visible: isListeningClipboard
      },
      {
        label: T("RELOAD_APP"),
        click() {
          app.relaunch();
          app.exit(0);
        }
      },
      { label: T("QUIT"), role: "quit" }
    ];
    if (process.platform === "win32") {
      template.splice(
        2,
        0,
        {
          label: T("OPEN_MINI_WINDOW"),
          click() {
            openMiniWindow(false);
          },
          visible: !isMiniWindowVisible
        },
        {
          label: T("HIDE_MINI_WINDOW"),
          click: hideMiniWindow,
          visible: isMiniWindowVisible
        }
      );
    }
    contextMenu = Menu.buildFromTemplate(template);
  } else if (process.platform === "linux") {
    contextMenu = Menu.buildFromTemplate([
      { label: T("OPEN_MAIN_WINDOW"), click: openMainWindow },
      {
        label: T("OPEN_MINI_WINDOW"),
        click() {
          openMiniWindow(false);
        },
        visible: !isMiniWindowVisible
      },
      {
        label: T("HIDE_MINI_WINDOW"),
        click: hideMiniWindow,
        visible: isMiniWindowVisible
      },
      {
        label: T("START_WATCH_CLIPBOARD"),
        click: startWatchClipboard,
        visible: !isListeningClipboard
      },
      {
        label: T("STOP_WATCH_CLIPBOARD"),
        click: stopWatchClipboard,
        visible: isListeningClipboard
      },
      {
        label: T("ABOUT"),
        click() {
          dialog.showMessageBox({
            title: "PicList",
            message: "PicList",
            buttons: ["Ok"],
            detail: `Version: ${pkg.version}
Author: Kuingsmile
Github: https://github.com/Kuingsmile/PicList`
          });
        }
      },
      { label: T("QUIT"), role: "quit" }
    ]);
  }
}
const getTrayIcon = () => {
  if (process.platform === "darwin") {
    const isMacOSGreaterThan11 = isMacOSVersionGreaterThanOrEqualTo("11");
    return isMacOSGreaterThan11 ? "./resources/menubar-newdarwinTemplate.png" : "./resources/menubar.png";
  } else {
    return "./resources/menubar-nodarwin.png";
  }
};
function createTray(tooltip) {
  const menubarPic = getTrayIcon();
  setTray(new Tray(menubarPic));
  tray.setToolTip(tooltip);
  if (process.platform === "darwin" || process.platform === "win32") {
    tray.on("right-click", () => {
      if (windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.get(IWindowList.TRAY_WINDOW).hide();
      }
      createContextMenu();
      tray.popUpContextMenu(contextMenu);
    });
    tray.on("click", (_, bounds) => {
      if (process.platform === "darwin") {
        toggleWindow(bounds);
        setTimeout(async () => {
          const img = clipboard.readImage();
          const obj = [];
          if (!img.isEmpty()) {
            const imgPath = clipboard.read("public.file-url");
            if (imgPath) {
              const decodePath = ensureFilePath(imgPath);
              if (decodePath === imgPath) {
                obj.push({
                  imgUrl: imgPath
                });
              } else {
                if (decodePath !== "") {
                  const base64 = await fs.readFile(decodePath.replace("file://", ""), { encoding: "base64" });
                  obj.push({
                    imgUrl: `data:image/png;base64,${base64}`
                  });
                }
              }
            } else {
              const imgUrl = img.toDataURL();
              obj.push({
                width: img.getSize().width,
                height: img.getSize().height,
                imgUrl
              });
            }
          }
          windowManager.get(IWindowList.TRAY_WINDOW).webContents.send("clipboardFiles", obj);
        }, 0);
      } else {
        if (windowManager.has(IWindowList.TRAY_WINDOW)) {
          windowManager.get(IWindowList.TRAY_WINDOW).hide();
        }
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
        const autoCloseMiniWindow = db.get(configPaths.settings.autoCloseMiniWindow) || false;
        settingWindow.show();
        settingWindow.focus();
        if (windowManager.has(IWindowList.MINI_WINDOW) && autoCloseMiniWindow) {
          windowManager.get(IWindowList.MINI_WINDOW).hide();
        }
      }
    });
    tray.on("drag-enter", () => {
      if (nativeTheme.shouldUseDarkColors) {
        tray.setImage("./resources/upload-dark.png");
      } else {
        tray.setImage("./resources/upload.png");
      }
    });
    tray.on("drag-end", () => {
      tray.setImage(getTrayIcon());
    });
    if (process.platform === "darwin") {
      tray.on("drop-files", async (_, files) => {
        const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
        const rawInput = cloneDeep(files);
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
        const { needRestore, ctx } = await handleSecondaryUpload(trayWindow.webContents, files, "tray");
        let imgs = false;
        if (needRestore) {
          const res = await uploader.setWebContents(trayWindow.webContents).uploadReturnCtx(ctx ? ctx.processedInput : files, true);
          imgs = res ? res.output : false;
        } else {
          imgs = await uploader.setWebContents(trayWindow.webContents).upload(files);
        }
        const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false;
        if (imgs !== false) {
          const pasteText = [];
          for (let i = 0; i < imgs.length; i++) {
            if (deleteLocalFile) {
              await fs.remove(rawInput[i]);
            }
            const [pasteTextItem, shortUrl] = await pasteTemplate(
              pasteStyle,
              imgs[i],
              db.get(configPaths.settings.customLink)
            );
            imgs[i].shortUrl = shortUrl;
            pasteText.push(pasteTextItem);
            const isShowResultNotification = db.get(configPaths.settings.uploadResultNotification) === void 0 ? true : !!db.get(configPaths.settings.uploadResultNotification);
            if (isShowResultNotification) {
              const notification = new Notification({
                title: T("UPLOAD_SUCCEED"),
                body: shortUrl || imgs[i].imgUrl
                // icon: files[i]
              });
              setTimeout(() => {
                notification.show();
              }, i * 100);
            }
            await GalleryDB.getInstance().insert(imgs[i]);
          }
          handleCopyUrl(pasteText.join("\n"));
          trayWindow.webContents.send("dragFiles", imgs);
        }
      });
    }
  } else if (process.platform === "linux") {
    createContextMenu();
    tray.setContextMenu(contextMenu);
  }
}
const toggleWindow = (bounds) => {
  const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
  if (trayWindow.isVisible()) {
    trayWindow.hide();
  } else {
    trayWindow.setPosition(bounds.x - 98 + 11, bounds.y, false);
    trayWindow.webContents.send("updateFiles");
    trayWindow.show();
    trayWindow.focus();
  }
};
function initEventCenter() {
  const eventList = {
    "picgo:upload": uploadClipboardFiles,
    [UPLOAD_WITH_CLIPBOARD_FILES]: busCallUploadClipboardFiles,
    [UPLOAD_WITH_FILES]: busCallUploadFiles,
    [GET_WINDOW_ID]: busCallGetWindowId,
    [GET_SETTING_WINDOW_ID]: busCallGetSettingWindowId,
    [CREATE_APP_MENU]: createMenu
  };
  for (const i in eventList) {
    bus.on(i, eventList[i]);
  }
}
async function busCallUploadClipboardFiles() {
  const result = await uploadClipboardFiles();
  const imgUrl = result.url;
  bus.emit(UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, imgUrl);
}
async function busCallUploadFiles(pathList) {
  const win = windowManager.getAvailableWindow();
  const result = await uploadChoosedFiles(win.webContents, pathList);
  const urls = result.map((item) => item.url);
  bus.emit(UPLOAD_WITH_FILES_RESPONSE, urls);
}
function busCallGetWindowId() {
  const win = windowManager.getAvailableWindow();
  bus.emit(GET_WINDOW_ID_REPONSE, win.id);
}
function busCallGetSettingWindowId() {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
  bus.emit(GET_SETTING_WINDOW_ID_RESPONSE, settingWindow.id);
}
const busEventList = {
  listen() {
    initEventCenter();
  }
};
class RPCRouter {
  routeMap = /* @__PURE__ */ new Map();
  add = (action, handler, type = IRPCType.SEND) => {
    this.routeMap.set(action, { handler, type });
    return this;
  };
  addBatch = (params) => {
    for (const { action, handler, type = IRPCType.SEND } of params) {
      this.routeMap.set(action, { handler, type });
    }
    return this;
  };
  routes() {
    return this.routeMap;
  }
}
function isInputConfigValid(config) {
  return typeof config === "object" && !Array.isArray(config) && Object.keys(config).length > 0;
}
const getFileMimeType = (filePath) => mime.lookup(filePath) || "application/octet-stream";
const getTempDirPath = () => {
  return path.join(app.getPath("temp"), "piclistTemp");
};
const checkTempFolderExist = async (tempPath) => {
  try {
    await fs.access(tempPath);
  } catch (e) {
    await fs.mkdir(tempPath);
  }
};
const downloadFileFromUrl = async (urls) => {
  const tempPath = getTempDirPath();
  await checkTempFolderExist(tempPath);
  const result = [];
  for (const url of urls) {
    const finishDownload = promisify(Stream.finished);
    const fileName = path.basename(url).split("?")[0];
    const filePath = path.join(tempPath, fileName);
    const writer = fs.createWriteStream(filePath);
    const res = await axios({
      method: "get",
      url,
      responseType: "stream"
    });
    res.data.pipe(writer);
    await finishDownload(writer);
    result.push(filePath);
  }
  return result;
};
const clearTempFolder = () => fs.emptyDirSync(getTempDirPath());
const md5$1 = (str, code) => crypto.createHash("md5").update(str).digest(code);
const hmacSha1Base64 = (secretKey, stringToSign) => crypto.createHmac("sha1", secretKey).update(Buffer.from(stringToSign, "utf8")).digest("base64");
const NewDownloader = async (instance, preSignedUrl, id, savedFilePath, logger2, proxy, headers) => {
  const options = {
    url: preSignedUrl,
    directory: path.dirname(savedFilePath),
    fileName: path.basename(savedFilePath),
    cloneFiles: false,
    onProgress: (percentage) => {
      instance.updateDownloadTask({
        id,
        progress: Math.floor(Number(percentage)),
        status: downloadTaskSpecialStatus.downloading
      });
    },
    maxAttempts: 3
  };
  if (proxy) {
    options.proxy = proxy;
  }
  if (headers) {
    options.headers = headers;
  }
  const downloader = new Downloader(options);
  try {
    await downloader.download();
    instance.updateDownloadTask({
      id,
      progress: 100,
      status: downloadTaskSpecialStatus.downloaded,
      finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
    });
    return true;
  } catch (e) {
    logger2?.error(formatError(e, { method: "NewDownloader" }));
    fs.remove(savedFilePath);
    instance.updateDownloadTask({
      id,
      progress: 0,
      status: commonTaskStatus.failed,
      response: formatError(e, { method: "NewDownloader" }),
      finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
    });
    return false;
  }
};
const gotUpload = async (instance, url, method, body, headers, id, logger2, timeout = 3e4, throwHttpErrors = false, agent = {}) => {
  got(url, {
    headers,
    method,
    body,
    timeout: {
      lookup: timeout
    },
    throwHttpErrors,
    agent
  }).on("uploadProgress", (progress) => {
    instance.updateUploadTask({
      id,
      progress: Math.floor(progress.percent * 100),
      status: uploadTaskSpecialStatus.uploading
    });
  }).then((res) => {
    instance.updateUploadTask({
      id,
      progress: res?.statusCode === 200 || res?.statusCode === 201 ? 100 : 0,
      status: res?.statusCode === 200 || res?.statusCode === 201 ? uploadTaskSpecialStatus.uploaded : commonTaskStatus.failed,
      finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
    });
  }).catch((err) => {
    logger2?.error(formatError(err, { method: "gotUpload" }));
    instance.updateUploadTask({
      id,
      progress: 0,
      response: formatError(err, { method: "gotUpload" }),
      status: commonTaskStatus.failed,
      finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
    });
  });
};
const formatError = (err, params) => {
  if (err instanceof RequestError) {
    return {
      ...params,
      message: err.message ?? "",
      name: "RequestError",
      code: err.code,
      stack: err.stack ?? "",
      timings: err.timings ?? {}
    };
  } else if (err instanceof Error) {
    return {
      ...params,
      name: err.name ?? "",
      message: err.message ?? "",
      stack: err.stack ?? ""
    };
  }
  if (typeof err === "object") {
    return `${JSON.stringify(err)}${JSON.stringify(params)}`;
  }
  return `${String(err)}${JSON.stringify(params)}`;
};
const commonOptions = {
  keepAlive: true,
  keepAliveMsecs: 1e3,
  scheduling: "lifo"
};
const getAgent = (proxy, https2 = true) => {
  const formatProxy = formatHttpProxy(proxy, "string");
  const commonResult = {
    https: void 0,
    http: void 0
  };
  if (!formatProxy) return commonResult;
  commonOptions.proxy = formatProxy.replace("127.0.0.1", "localhost");
  if (https2) {
    return {
      https: new HttpsProxyAgent({
        ...commonOptions,
        rejectUnauthorized: false
      }),
      http: void 0
    };
  }
  return {
    http: new HttpProxyAgent({
      ...commonOptions
    }),
    https: void 0
  };
};
const getInnerAgent = (proxy, sslEnabled = true) => {
  const formatProxy = formatHttpProxy(proxy, "object");
  if (sslEnabled) {
    return formatProxy ? {
      agent: new https.Agent({
        ...commonOptions,
        rejectUnauthorized: false,
        host: formatProxy.host,
        port: formatProxy.port
      })
    } : {
      agent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
      })
    };
  }
  return formatProxy ? {
    agent: new http.Agent({
      ...commonOptions,
      host: formatProxy.host,
      port: formatProxy.port
    })
  } : {
    agent: new http.Agent({
      ...commonOptions
    })
  };
};
function getOptions(method, headers, searchParams, responseType, body, timeout, proxy) {
  return {
    ...method && { method: method.toUpperCase() },
    ...headers && { headers },
    ...searchParams && { searchParams },
    ...body && { body },
    ...{ responseType },
    ...{ timeout: { request: 3e4 } },
    ...proxy && {
      agent: Object.fromEntries(Object.entries(getAgent(proxy)).filter(([, v]) => v !== void 0))
    },
    throwHttpErrors: false
  };
}
class ConcurrencyPromisePool {
  limit;
  queue;
  runningNum;
  results;
  constructor(limit) {
    this.limit = limit;
    this.queue = [];
    this.runningNum = 0;
    this.results = [];
  }
  all(promises = []) {
    return new Promise((resolve, reject) => {
      for (const promise of promises) {
        this._run(promise, resolve, reject);
      }
    });
  }
  _run(promise, resolve, reject) {
    if (this.runningNum >= this.limit) {
      this.queue.push(promise);
      return;
    }
    this.runningNum += 1;
    promise().then((res) => {
      this.results.push(res);
      --this.runningNum;
      if (this.queue.length === 0 && this.runningNum === 0) {
        return resolve(this.results);
      }
      if (this.queue.length > 0) {
        this._run(this.queue.shift(), resolve, reject);
      }
    }).catch(reject);
  }
}
class SSHClient {
  static _instance;
  static _client;
  _isConnected = false;
  static get instance() {
    return this._instance || (this._instance = new this());
  }
  static get client() {
    return this._client || (this._client = new NodeSSH());
  }
  changeWinStylePathToUnix(path2) {
    return path2.replace(/\\/g, "/");
  }
  async connect(config) {
    const { username, password, privateKey, passphrase } = config;
    const loginInfo = privateKey ? {
      username,
      privateKeyPath: privateKey,
      passphrase: passphrase || void 0
    } : { username, password };
    try {
      await SSHClient.client.connect({
        host: config.host,
        port: Number(config.port) || 22,
        ...loginInfo
      });
      this._isConnected = true;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
  async deleteFileSFTP(config, remote) {
    try {
      const client = new Client();
      const { username, password, privateKey, passphrase } = config;
      const loginInfo = privateKey ? {
        username,
        privateKey: fs.readFileSync(privateKey),
        passphrase: passphrase || void 0
      } : { username, password };
      remote = this.changeWinStylePathToUnix(remote);
      if (remote === "/" || remote.includes("*")) return false;
      const promise = new Promise((resolve, reject) => {
        client.on("ready", () => {
          client.sftp(
            (err, sftp) => {
              if (err) reject(false);
              sftp.unlink(remote, (err2) => {
                if (err2) reject(false);
                client.end();
                resolve(true);
              });
            }
          );
        }).connect({
          host: config.host,
          port: Number(config.port) || 22,
          ...loginInfo
        });
      });
      return await promise;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  async exec(script) {
    const execResult = await SSHClient.client.execCommand(script);
    return execResult.code === 0;
  }
  async execCommand(script) {
    const execResult = await SSHClient.client.execCommand(script);
    return execResult || { code: 1, stdout: "", stderr: "" };
  }
  async getFile(local, remote) {
    if (!this._isConnected) {
      throw new Error("SSH 未连接");
    }
    try {
      remote = this.changeWinStylePathToUnix(remote);
      local = this.changeWinStylePathToUnix(local);
      await SSHClient.client.getFile(local, remote, void 0, {
        concurrency: 1
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  async putFile(local, remote, config = {}) {
    if (!this._isConnected) {
      throw new Error("SSH 未连接");
    }
    try {
      remote = this.changeWinStylePathToUnix(remote);
      await this.mkdir(path.dirname(remote).replace(/^\/+|\/+$/g, ""), config);
      await SSHClient.client.putFile(local, remote);
      const fileMode = config.fileMode || "0644";
      if (fileMode !== "0644") {
        const script = `chmod ${fileMode} "${remote}"`;
        return await this.exec(script);
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  async mkdir(dirPath, config = {}) {
    if (!this._isConnected) {
      throw new Error("SSH 未连接");
    }
    try {
      const directoryMode = config.dirMode || "0755";
      if (directoryMode === "0755") {
        const script = `mkdir -p "${dirPath}"`;
        return await this.exec(script);
      } else {
        const dirs = dirPath.split("/");
        let currentPath = "";
        for (const dir of dirs) {
          if (dir) {
            currentPath += `/${dir}`;
            const script = `mkdir "${currentPath}" && chmod ${directoryMode} "${currentPath}"`;
            const result = await this.exec(script);
            if (!result) {
              return false;
            }
          }
        }
        return true;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  get isConnected() {
    return SSHClient.client.isConnected();
  }
  close() {
    SSHClient.client.dispose();
    this._isConnected = false;
  }
}
const dogeRegionMap = {
  "ap-shanghai": "0",
  "ap-beijing": "1",
  "ap-guangzhou": "2",
  "ap-chengdu": "3"
};
async function dogecloudApi$1(apiPath, data = {}, jsonMode = false, accessKey, secretKey) {
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data);
  const sign = crypto.createHmac("sha1", secretKey).update(Buffer.from(apiPath + "\n" + body, "utf8")).digest("hex");
  const authorization = `TOKEN ${accessKey}:${sign}`;
  try {
    const res = await axios.request({
      url: `https://api.dogecloud.com${apiPath}`,
      method: "POST",
      data: body,
      responseType: "json",
      headers: {
        "Content-Type": jsonMode ? "application/json" : "application/x-www-form-urlencoded",
        Authorization: authorization
      }
    });
    if (res.data.code !== 200) {
      throw new Error("API Error");
    }
    return res.data.data;
  } catch (err) {
    throw new Error("API Error");
  }
}
async function getDogeToken(accessKey, secretKey) {
  try {
    const data = await dogecloudApi$1(
      "/auth/tmp_token.json",
      {
        channel: "OSS_FULL",
        scopes: ["*"]
      },
      true,
      accessKey,
      secretKey
    );
    return data;
  } catch (err) {
    console.log(err);
    return {};
  }
}
async function removeFileFromS3InMain(configMap, dogeMode = false) {
  try {
    const {
      url: rawUrl,
      type,
      config: { accessKeyID, secretAccessKey, bucketName, endpoint, pathStyleAccess, rejectUnauthorized, proxy }
    } = configMap;
    let {
      imgUrl,
      config: { region }
    } = configMap;
    if (type === "aws-s3" || type === "aws-s3-plist") {
      imgUrl = rawUrl || imgUrl || "";
    }
    const url = new URL(!/^https?:\/\//.test(imgUrl) ? `http://${imgUrl}` : imgUrl);
    let fileKey = url.pathname.replace(/^\/+/, "");
    if (pathStyleAccess) {
      fileKey = fileKey.replace(/^[^/]+\//, "");
    }
    const endpointUrl = endpoint ? /^https?:\/\//.test(endpoint) ? endpoint : `http://${endpoint}` : void 0;
    if (endpointUrl && endpointUrl.includes("cloudflarestorage")) {
      region = region || "auto";
    }
    const sslEnabled = endpointUrl ? endpointUrl.startsWith("https") : true;
    const agent = getAgent(proxy, sslEnabled);
    const commonOptions2 = {
      keepAlive: true,
      keepAliveMsecs: 1e3,
      scheduling: "lifo"
    };
    const extraOptions = sslEnabled ? { rejectUnauthorized: !!rejectUnauthorized } : {};
    const handler = sslEnabled ? new NodeHttpHandler({
      httpsAgent: agent.https ? agent.https : new https.Agent({
        ...commonOptions2,
        ...extraOptions
      })
    }) : new NodeHttpHandler({
      httpAgent: agent.http ? agent.http : new http.Agent({
        ...commonOptions2,
        ...extraOptions
      })
    });
    const s3Options = {
      credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey
      },
      endpoint: endpointUrl,
      tls: sslEnabled,
      forcePathStyle: pathStyleAccess,
      region,
      requestHandler: handler
    };
    if (dogeMode) {
      s3Options.credentials = {
        accessKeyId: configMap.config.accessKeyID,
        secretAccessKey: configMap.config.secretAccessKey,
        sessionToken: configMap.config.sessionToken
      };
    }
    let result;
    try {
      fileKey = decodeURIComponent(fileKey);
    } catch (err) {
    }
    try {
      const client = new S3Client(s3Options);
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey
      });
      result = await client.send(command);
    } catch (err) {
      s3Options.region = "us-east-1";
      const client = new S3Client(s3Options);
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey
      });
      result = await client.send(command);
    }
    return result.$metadata.httpStatusCode === 204;
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function removeFileFromDogeInMain(configMap) {
  try {
    const {
      config: { bucketName, AccessKey, SecretKey }
    } = configMap;
    const token = await getDogeToken(AccessKey, SecretKey);
    const bucket = token.Buckets?.find((item) => item.name === bucketName || item.s3Bucket === bucketName);
    const newConfigMap = { ...configMap };
    newConfigMap.config = {
      ...newConfigMap.config,
      accessKeyID: token.Credentials?.accessKeyId,
      secretAccessKey: token.Credentials?.secretAccessKey,
      sessionToken: token.Credentials?.sessionToken,
      endpoint: bucket?.s3Endpoint,
      region: dogeRegionMap[bucket?.s3Endpoint?.split(".")[1] || "ap-shanghai"],
      bucketName: bucket?.s3Bucket
    };
    return await removeFileFromS3InMain(newConfigMap, true);
  } catch (err) {
    console.log(err);
    return false;
  }
}
function createHuaweiAuthorization(bucketName, path2, fileName, accessKey, secretKey, date = (/* @__PURE__ */ new Date()).toUTCString()) {
  const strToSign = `DELETE


${date}
/${bucketName}${path2}/${fileName}`;
  const singature = crypto.createHmac("sha1", secretKey).update(strToSign).digest("base64");
  return `OBS ${accessKey}:${singature}`;
}
async function removeFileFromHuaweiInMain(configMap) {
  const { fileName, config } = configMap;
  const { accessKeyId, accessKeySecret, bucketName, endpoint } = config;
  let path2 = config.path || "/";
  path2 = `/${path2.replace(/^\/+|\/+$/, "")}`;
  path2 = path2 === "/" ? "" : path2;
  const date = (/* @__PURE__ */ new Date()).toUTCString();
  const authorization = createHuaweiAuthorization(bucketName, path2, fileName, accessKeyId, accessKeySecret, date);
  try {
    const res = await axios.request({
      url: `https://${bucketName}.${endpoint}${encodeURI(path2)}/${encodeURIComponent(fileName)}`,
      method: "DELETE",
      responseType: "json",
      headers: {
        Host: `${bucketName}.${endpoint}`,
        Date: date,
        Authorization: authorization
      }
    });
    return res.status === 204;
  } catch (error) {
    console.log(error);
    return false;
  }
}
async function removeFileFromSFTPInMain(config, fileName) {
  try {
    const client = SSHClient.instance;
    await client.connect(config);
    const uploadPath = `/${config.uploadPath || ""}/`.replace(/\/+/g, "/");
    const remote = path.join(uploadPath, fileName);
    const deleteResult = await client.deleteFileSFTP(config, remote);
    client.close();
    return deleteResult;
  } catch (err) {
    console.log(err);
    return false;
  }
}
const galleryRouter = new RPCRouter();
const galleryRoutes = [
  {
    action: IRPCActionType.GALLERY_PASTE_TEXT,
    handler: async (_, args) => {
      const [item, copy = true] = args;
      const pasteStyle = picgo.getConfig(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
      const customLink = picgo.getConfig(configPaths.settings.customLink);
      const [txt, shortUrl] = await pasteTemplate(pasteStyle, item, customLink);
      if (copy) {
        clipboard.writeText(txt);
      }
      return [txt, shortUrl];
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_FILES,
    handler: async (_, args) => {
      setTimeout(() => {
        picgo.emit(ICOREBuildInEvent.REMOVE, args[0], GuiApi.getInstance());
      }, 500);
    }
  },
  {
    action: IRPCActionType.GALLERY_GET_DB,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.get(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_GET_BY_ID_DB,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.getById(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_UPDATE_BY_ID_DB,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.updateById(args[0], args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_BY_ID_DB,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.removeById(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.insert(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB_BATCH,
    handler: async (_, args) => {
      const dbStore = GalleryDB.getInstance();
      return await dbStore.insertMany(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_LOG_DELETE_MSG,
    handler: async (_, args) => {
      const [msg, logLevel] = args;
      console.log(msg, logLevel);
      logger[logLevel](msg);
    }
  },
  {
    action: IRPCActionType.GALLERY_DELETE_SFTP_FILE,
    handler: async (_, args) => {
      const [config, fileName] = args;
      return await removeFileFromSFTPInMain(config, fileName);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_AWS_S3_FILE,
    handler: async (_, args) => {
      return await removeFileFromS3InMain(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_DOGE_FILE,
    handler: async (_, args) => {
      return await removeFileFromDogeInMain(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_HUAWEI_OSS_FILE,
    handler: async (_, args) => {
      return await removeFileFromHuaweiInMain(args[0]);
    },
    type: IRPCType.INVOKE
  }
];
galleryRouter.addBatch(galleryRoutes);
class UpDownTaskQueue {
  static instance;
  uploadTaskQueue = [];
  downloadTaskQueue = [];
  persistPath = path.join(app.getPath("userData"), "UpDownTaskQueue.json");
  constructor() {
    this.restore();
  }
  static getInstance() {
    if (!UpDownTaskQueue.instance) {
      UpDownTaskQueue.instance = new UpDownTaskQueue();
    }
    return UpDownTaskQueue.instance;
  }
  getUploadTaskQueue() {
    return UpDownTaskQueue.getInstance().uploadTaskQueue;
  }
  getDownloadTaskQueue() {
    return UpDownTaskQueue.getInstance().downloadTaskQueue;
  }
  getUploadTask(taskId) {
    return UpDownTaskQueue.getInstance().uploadTaskQueue.find((item) => item.id === taskId);
  }
  getAllUploadTask() {
    return UpDownTaskQueue.getInstance().uploadTaskQueue;
  }
  addUploadTask(task) {
    UpDownTaskQueue.getInstance().uploadTaskQueue.push(task);
  }
  updateUploadTask(task) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex((item) => item.id === task.id);
    if (taskIndex !== -1) {
      const taskKeys = Object.keys(task);
      taskKeys.forEach((key) => {
        if (key !== "id") {
          UpDownTaskQueue.getInstance().uploadTaskQueue[taskIndex][key] = task[key];
        }
      });
    }
  }
  removeUploadTask(taskId) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex((item) => item.id === taskId);
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().uploadTaskQueue.splice(taskIndex, 1);
    }
  }
  removeDownloadTask(taskId) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex((item) => item.id === taskId);
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().downloadTaskQueue.splice(taskIndex, 1);
    }
  }
  getDownloadTask(taskId) {
    return UpDownTaskQueue.getInstance().downloadTaskQueue.find((item) => item.id === taskId);
  }
  getAllDownloadTask() {
    return UpDownTaskQueue.getInstance().downloadTaskQueue;
  }
  addDownloadTask(task) {
    UpDownTaskQueue.getInstance().downloadTaskQueue.push(task);
  }
  updateDownloadTask(task) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex((item) => item.id === task.id);
    if (taskIndex !== -1) {
      const taskKeys = Object.keys(task);
      taskKeys.forEach((key) => {
        if (key !== "id") {
          UpDownTaskQueue.getInstance().downloadTaskQueue[taskIndex][key] = task[key];
        }
      });
    }
  }
  clearUploadTaskQueue() {
    UpDownTaskQueue.getInstance().uploadTaskQueue = [];
  }
  removeUploadedTask() {
    UpDownTaskQueue.getInstance().uploadTaskQueue = UpDownTaskQueue.getInstance().uploadTaskQueue.filter(
      (item) => item.status !== uploadTaskSpecialStatus.uploaded && item.status !== commonTaskStatus.canceled && item.status !== commonTaskStatus.failed
    );
  }
  removeDownloadedTask() {
    UpDownTaskQueue.getInstance().downloadTaskQueue = UpDownTaskQueue.getInstance().downloadTaskQueue.filter(
      (item) => item.status !== downloadTaskSpecialStatus.downloaded && item.status !== commonTaskStatus.canceled && item.status !== commonTaskStatus.failed
    );
  }
  clearDownloadTaskQueue() {
    UpDownTaskQueue.getInstance().downloadTaskQueue = [];
  }
  clearAllTaskQueue() {
    this.clearUploadTaskQueue();
    this.clearDownloadTaskQueue();
  }
  persist() {
    try {
      this.checkPersistPath();
      fs.writeFileSync(
        this.persistPath,
        JSON.stringify({
          uploadTaskQueue: this.uploadTaskQueue,
          downloadTaskQueue: this.downloadTaskQueue
        })
      );
    } catch (e) {
      console.log(e);
    }
  }
  restore() {
    try {
      this.checkPersistPath();
      const persistData = JSON.parse(fs.readFileSync(this.persistPath, { encoding: "utf-8" }));
      this.uploadTaskQueue = persistData.uploadTaskQueue;
      this.downloadTaskQueue = persistData.downloadTaskQueue;
    } catch (e) {
      this.uploadTaskQueue = [];
      this.downloadTaskQueue = [];
    }
  }
  checkPersistPath() {
    if (!fs.existsSync(this.persistPath)) {
      fs.writeFileSync(
        this.persistPath,
        JSON.stringify({
          uploadTaskQueue: this.uploadTaskQueue,
          downloadTaskQueue: this.downloadTaskQueue
        })
      );
    }
    try {
      JSON.parse(fs.readFileSync(this.persistPath, { encoding: "utf-8" }));
    } catch (e) {
      fs.writeFileSync(
        this.persistPath,
        JSON.stringify({
          uploadTaskQueue: this.uploadTaskQueue,
          downloadTaskQueue: this.downloadTaskQueue
        })
      );
    }
  }
}
let AliyunApi$1 = class AliyunApi {
  ctx;
  accessKeyId;
  accessKeySecret;
  timeOut = 3e4;
  logger;
  constructor(accessKeyId, accessKeySecret, logger2) {
    this.ctx = new OSS({
      accessKeyId,
      accessKeySecret,
      secure: true
    });
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.logger = logger2;
  }
  formatFolder(item, slicedPrefix, urlPrefix) {
    return {
      key: item,
      url: `${urlPrefix}/${item}`,
      fileSize: 0,
      formatedTime: "",
      fileName: item.replace(slicedPrefix, "").replace("/", ""),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: item
    };
  }
  formatFile(item, slicedPrefix, urlPrefix) {
    const fileName = item.name.replace(slicedPrefix, "");
    return {
      ...item,
      key: item.name,
      fileName,
      fileSize: item.size,
      formatedTime: new Date(item.lastModified).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName),
      rawUrl: item.url,
      url: `${urlPrefix}/${item.name}`
    };
  }
  getCanonicalizedOSSHeaders(headers) {
    const lowerCaseHeaders = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key];
      return acc;
    }, {});
    let canonicalizedOSSHeaders = "";
    const headerKeys = Object.keys(lowerCaseHeaders).sort();
    headerKeys.forEach((key) => {
      key.startsWith("x-oss-") && (canonicalizedOSSHeaders += `${key}:${lowerCaseHeaders[key]}
`);
    });
    return canonicalizedOSSHeaders;
  }
  authorization(method, canonicalizedResource, headers, contentMd5, contentType) {
    const date = (/* @__PURE__ */ new Date()).toUTCString();
    const stringToSign = `${method.toUpperCase()}
${contentMd5}
${contentType}
${date}
${this.getCanonicalizedOSSHeaders(headers)}${canonicalizedResource}`;
    return `OSS ${this.accessKeyId}:${hmacSha1Base64(this.accessKeySecret, stringToSign)}`;
  }
  getNewCtx(region, bucket) {
    return new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region,
      bucket,
      secure: true
    });
  }
  /**
   * 获取存储桶列表
   */
  async getBucketList() {
    const getBuckets = async (marker) => {
      const res = await this.ctx.listBuckets({
        marker,
        "max-keys": 1e3
      });
      if (res?.res?.statusCode !== 200 || !res?.buckets) return { result: [], isTruncated: false };
      const formattedBuckets = res.buckets.map((item) => ({
        Name: item.name,
        Location: item.region,
        CreationDate: item.creationDate
      }));
      return {
        result: formattedBuckets,
        isTruncated: res.isTruncated,
        nextMarker: res.nextMarker
      };
    };
    const result = [];
    let NextMarker;
    let isTruncated;
    do {
      const { result: buckets, isTruncated: truncated, nextMarker } = await getBuckets(NextMarker);
      result.push(...buckets);
      NextMarker = nextMarker;
      isTruncated = truncated;
    } while (isTruncated);
    return result;
  }
  /**
   * 获取自定义域名
   */
  async getBucketDomain(param) {
    const headers = {
      Date: (/* @__PURE__ */ new Date()).toUTCString()
    };
    const authorization = this.authorization("GET", `/${param.bucketName}/?cname`, headers, "", "");
    const res = await axios({
      url: `https://${param.bucketName}.${param.region}.aliyuncs.com/?cname`,
      method: "GET",
      headers: {
        ...headers,
        Authorization: authorization
      }
    });
    if (res?.status === 200) {
      const parser = new fastxml.XMLParser();
      const result = parser.parse(res.data);
      if (result.ListCnameResult?.Cname) {
        const cnames = Array.isArray(result.ListCnameResult.Cname) ? result.ListCnameResult.Cname : [result.ListCnameResult.Cname];
        return cnames.filter((item) => item.Status === "Enabled").map((item) => item.Domain);
      }
    }
    return [];
  }
  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   * @description
   * acl: private | publicRead | publicReadWrite
   */
  async createBucket(configMap) {
    const client = new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region: configMap.region,
      secure: true
    });
    const aclTransMap = {
      private: "private",
      publicRead: "public-read",
      publicReadWrite: "public-read-write"
    };
    const res = await client.putBucket(configMap.BucketName, {
      acl: aclTransMap[configMap.acl],
      storageClass: "Standard",
      dataRedundancyType: "LRS",
      timeout: this.timeOut
    });
    return res?.res?.status === 200;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`;
    let marker;
    const cancelTask = [false];
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const client = this.getNewCtx(region, bucket);
    do {
      res = await client.listV2(
        {
          prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
          "max-keys": "1000",
          "continuation-token": marker
        },
        {
          timeout: this.timeOut
        }
      );
      if (res?.res?.statusCode === 200) {
        res?.objects?.forEach((item) => {
          item.size !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        });
        window2.webContents.send(refreshDownloadFileTransferList, result);
      } else {
        result.finished = true;
        window2.webContents.send(refreshDownloadFileTransferList, result);
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
        return;
      }
      marker = res.nextContinuationToken;
    } while (res.isTruncated === true && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`;
    let marker;
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const client = this.getNewCtx(region, bucket);
    do {
      res = await client.listV2(
        {
          prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
          delimiter: "/",
          "max-keys": "1000",
          "continuation-token": marker
        },
        {
          timeout: this.timeOut
        }
      );
      if (res?.res?.statusCode === 200) {
        res?.prefixes?.forEach((item) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
        });
        res?.objects?.forEach((item) => {
          item.size !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        });
        window2.webContents.send("refreshFileTransferList", result);
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
      marker = res.nextContinuationToken;
    } while (res.isTruncated === true && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList(configMap) {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      marker,
      itemsPerPage
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`;
    const client = this.getNewCtx(region, bucket);
    const res = await client.listV2(
      {
        prefix: slicedPrefix || void 0,
        delimiter: "/",
        "max-keys": itemsPerPage.toString(),
        "continuation-token": marker
      },
      {
        timeout: this.timeOut
      }
    );
    if (res?.res.statusCode !== 200) {
      return {
        fullList: [],
        isTruncated: false,
        nextMarker: "",
        success: false
      };
    }
    const fullList = [
      ...res.prefixes?.map((item) => this.formatFolder(item, slicedPrefix, urlPrefix)) || [],
      ...res.objects?.filter((item) => item.size !== 0).map((item) => this.formatFile(item, slicedPrefix, urlPrefix)) || []
    ];
    return {
      fullList,
      isTruncated: res.isTruncated,
      nextMarker: res.nextContinuationToken || "",
      success: true
    };
  }
  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap) {
    const { bucketName, region, oldKey, newKey } = configMap;
    const client = this.getNewCtx(region, bucketName);
    const copyRes = await client.copy(newKey, oldKey);
    if (copyRes?.res.statusCode === 200) {
      const deleteRes = await client.delete(oldKey);
      return deleteRes?.res.statusCode === 204;
    }
    return false;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { bucketName, region, key } = configMap;
    const client = this.getNewCtx(region, bucketName);
    const res = await client.delete(key);
    return res?.res.statusCode === 204;
  }
  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    const client = this.getNewCtx(region, bucketName);
    let marker;
    let isTruncated;
    const allFileList = {
      CommonPrefixes: [],
      Contents: []
    };
    do {
      const res = await client.listV2(
        {
          prefix: key,
          delimiter: "/",
          "max-keys": "1000",
          "continuation-token": marker
        },
        {
          timeout: this.timeOut
        }
      );
      if (res?.res.statusCode !== 200) return false;
      res.prefixes !== null && allFileList.CommonPrefixes.push(...res.prefixes);
      res.objects?.length > 0 && allFileList.Contents.push(...res.objects);
      isTruncated = res.isTruncated;
      marker = res.nextContinuationToken;
    } while (isTruncated);
    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        const successfully = await this.deleteBucketFolder({
          bucketName,
          region,
          key: item
        });
        if (!successfully) return false;
      }
    }
    if (allFileList.Contents.length > 0) {
      const cycle = Math.ceil(allFileList.Contents.length / 1e3);
      for (let i = 0; i < cycle; i++) {
        const deleteRes = await client.deleteMulti(
          allFileList.Contents.slice(i * 1e3, (i + 1) * 1e3).map((item) => item.name)
        );
        if (deleteRes?.res.statusCode !== 200) return false;
      }
    }
    return true;
  }
  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap) {
    const { bucketName, region, key, expires, customUrl } = configMap;
    const client = this.getNewCtx(region, bucketName);
    const res = client.signatureUrl(key, {
      expires: expires || 3600
    });
    return customUrl ? `${customUrl.replace(/\/+$/, "")}/${key}${res.slice(res.indexOf("?"))}` : res;
  }
  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key.startsWith("/") && (item.key = item.key.slice(1));
    });
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item;
      const client = this.getNewCtx(region, bucketName);
      const id = `${bucketName}-${region}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      });
      client.multipartUpload(key, filePath, {
        partSize: 1 * 1024 * 1024,
        mime: getFileMimeType(fileName),
        progress: (p) => {
          const id2 = `${bucketName}-${region}-${key}-${filePath}`;
          instance.updateUploadTask({
            id: id2,
            progress: Math.floor(p * 100),
            status: uploadTaskSpecialStatus.uploading
          });
        }
      }).then((res) => {
        const id2 = `${bucketName}-${region}-${key}-${filePath}`;
        if (res?.res?.statusCode === 200) {
          instance.updateUploadTask({
            id: id2,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            response: JSON.stringify(res),
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateUploadTask({
            id: id2,
            progress: 0,
            status: commonTaskStatus.failed,
            response: JSON.stringify(res),
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      }).catch((err) => {
        this.logger.error(
          formatError(err, {
            class: "AliyunApi",
            method: "uploadBucketFile"
          })
        );
        const id2 = `${bucketName}-${region}-${key}-${filePath}`;
        instance.updateUploadTask({
          id: id2,
          progress: 0,
          status: commonTaskStatus.failed,
          response: JSON.stringify(err),
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      });
    }
    return true;
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    const client = this.getNewCtx(region, bucketName);
    const res = await client.put(key, Buffer.from(""));
    return res?.res?.statusCode === 200;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName } = item;
      const client = this.getNewCtx(region, bucketName);
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      const preSignedUrl = client.signatureUrl(key, {
        expires: 60 * 60 * 48
      });
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(
        formatError(error, {
          class: "AliyunApi",
          method: "downloadBucketFile"
        })
      );
    });
    return true;
  }
};
let GithubApi$1 = class GithubApi {
  token;
  username;
  logger;
  proxy;
  proxyStr;
  baseUrl = "https://api.github.com";
  commonHeaders;
  constructor(token, username, proxy, logger2) {
    this.logger = logger2;
    this.token = token.startsWith("Bearer ") ? token : `Bearer ${token}`.trim();
    this.username = username;
    this.proxy = proxy;
    this.proxyStr = formatHttpProxy(proxy, "string");
    this.commonHeaders = {
      Authorization: this.token,
      Accept: "application/vnd.github+json"
    };
  }
  formatFolder(item, slicedPrefix, branch, repo, cdnUrl) {
    const key = `${slicedPrefix ? `${slicedPrefix}/` : ""}${item.path}/`;
    let rawUrl = "";
    const placeholders = ["{username}", "{repo}", "{branch}", "{path}"];
    rawUrl = cdnUrl ? placeholders.some((item2) => cdnUrl.includes(item2)) ? placeholders.reduce((url, ph) => {
      const value = ph === "{username}" ? this.username : ph === "{repo}" ? repo : ph === "{branch}" ? branch : ph === "{path}" ? key : "";
      return url.replaceAll(ph, value);
    }, cdnUrl) : `${cdnUrl}/${key}` : `https://raw.githubusercontent.com/${this.username}/${repo}/${branch}/${key}`;
    rawUrl = rawUrl.replace(/(?<!https?:)\/{2,}/g, "/");
    return {
      ...item,
      Key: key,
      url: rawUrl,
      key,
      fileSize: 0,
      formatedTime: "",
      fileName: item.path,
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    };
  }
  formatFile(item, slicedPrefix, branch, repo, cdnUrl) {
    let rawUrl = "";
    const placeholders = ["{username}", "{repo}", "{branch}", "{path}"];
    const key = slicedPrefix === "" ? item.path : `${slicedPrefix}/${item.path}`;
    rawUrl = cdnUrl ? placeholders.some((item2) => cdnUrl.includes(item2)) ? placeholders.reduce((url, ph) => {
      const value = ph === "{username}" ? this.username : ph === "{repo}" ? repo : ph === "{branch}" ? branch : ph === "{path}" ? `${slicedPrefix}/${item.path}` : "";
      return url.replaceAll(ph, value);
    }, cdnUrl) : `${cdnUrl}/${key}` : `https://raw.githubusercontent.com/${this.username}/${repo}/${branch}/${key}`;
    rawUrl = rawUrl.replace(/(?<!https?:)\/{2,}/g, "/");
    return {
      ...item,
      Key: key,
      key,
      fileSize: item.size,
      formatedTime: "",
      fileName: item.path,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.path),
      rawUrl: item.url,
      url: rawUrl
    };
  }
  /**
   * get repo list
   */
  async getBucketList() {
    let initPage = 1;
    let res;
    const result = [];
    do {
      res = await got(
        `${this.baseUrl}/user/repos`,
        getOptions(
          "GET",
          this.commonHeaders,
          { page: initPage, per_page: 100 },
          "json",
          void 0,
          void 0,
          this.proxy
        )
      );
      if (res.statusCode === 200) {
        res.body.forEach((item) => {
          result.push({
            ...item,
            Name: item.name,
            Location: item.id,
            CreationDate: item.created_at
          });
        });
      } else {
        return [];
      }
      initPage++;
    } while (res.body.length > 0);
    return result;
  }
  /**
   * 获取branch列表
   */
  async getBucketDomain(param) {
    const { bucketName: repo } = param;
    let initPage = 1;
    let res;
    const result = [];
    do {
      res = await got(
        `${this.baseUrl}/repos/${this.username}/${repo}/branches`,
        getOptions(
          "GET",
          this.commonHeaders,
          { page: initPage, per_page: 100 },
          "json",
          void 0,
          void 0,
          this.proxy
        )
      );
      if (res.statusCode === 200) {
        res.body.forEach((item) => result.push(item.name));
      } else {
        return [];
      }
      initPage++;
    } while (res.body.length > 0);
    return result;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: repo, customUrl: branch, prefix, cancelToken, cdnUrl } = configMap;
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, "");
    const cancelTask = [false];
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const treeQueue = [slicedPrefix];
    while (treeQueue.length) {
      if (cancelTask[0]) {
        result.finished = true;
        return result;
      }
      const currentPrefix = treeQueue[0];
      res = await got(
        `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${treeQueue.shift()}`,
        getOptions("GET", this.commonHeaders, {}, "json", void 0, void 0, this.proxy)
      );
      if (res && res.statusCode === 200) {
        const { tree } = res.body;
        tree.forEach((item) => {
          if (item.type === "tree") {
            treeQueue.push(`${currentPrefix}/${item.path}`);
          } else {
            result.fullList.push(this.formatFile(item, currentPrefix, branch, repo, cdnUrl));
          }
        });
        window2.webContents.send(refreshDownloadFileTransferList, result);
      } else {
        result.finished = true;
        window2.webContents.send(refreshDownloadFileTransferList, result);
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
        return;
      }
    }
    result.success = true;
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: repo, customUrl: branch, prefix, cancelToken, cdnUrl } = configMap;
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, "");
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${slicedPrefix}`,
      getOptions("GET", this.commonHeaders, void 0, "json", void 0, void 0, this.proxy)
    );
    if (res && res.statusCode === 200) {
      res.body.tree.forEach((item) => {
        if (item.type === "tree") {
          result.fullList.push(this.formatFolder(item, slicedPrefix, branch, repo, cdnUrl));
        } else {
          result.fullList.push(this.formatFile(item, slicedPrefix, branch, repo, cdnUrl));
        }
      });
    } else {
      result.finished = true;
      window2.webContents.send("refreshFileTransferList", result);
      ipcMain.removeAllListeners("cancelLoadingFileList");
      return;
    }
    result.success = true;
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { bucketName: repo, githubBranch: branch, key, DeleteHash: sha } = configMap;
    const body = {
      message: "deleted by PicList",
      sha,
      branch
    };
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${key}`,
      getOptions("DELETE", this.commonHeaders, void 0, "json", JSON.stringify(body), void 0, this.proxy)
    );
    return res.statusCode === 200;
  }
  /**
   * create a new tree to delete a folder
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { bucketName: repo, githubBranch: branch, key } = configMap;
    const refRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/refs/heads/${branch}`,
      getOptions("GET", this.commonHeaders, void 0, "json", void 0, void 0, this.proxy)
    );
    if (refRes.statusCode !== 200) return false;
    const refSha = refRes.body.object.sha;
    const rootRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/branches/${branch}`,
      getOptions("GET", void 0, void 0, "json", void 0, void 0, this.proxy)
    );
    if (rootRes.statusCode !== 200) return false;
    const rootSha = rootRes.body.commit.commit.tree.sha;
    const treeRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${key.replace(/(^\/+|\/+$)/g, "")}`,
      getOptions(
        "GET",
        this.commonHeaders,
        {
          recursive: true
        },
        "json",
        void 0,
        void 0,
        this.proxy
      )
    );
    if (treeRes.statusCode !== 200) return false;
    const oldTree = treeRes.body.tree;
    const newTree = oldTree.filter((item) => item.type === "blob").map((item) => ({
      path: `${key.replace(/(^\/+|\/+$)/g, "")}/${item.path}`,
      mode: item.mode,
      type: item.type,
      sha: null
    }));
    const newTreeShaRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees`,
      getOptions(
        "POST",
        this.commonHeaders,
        void 0,
        "json",
        JSON.stringify({
          base_tree: rootSha,
          tree: newTree
        }),
        void 0,
        this.proxy
      )
    );
    if (newTreeShaRes.statusCode !== 201) return false;
    const newTreeSha = newTreeShaRes.body.sha;
    const commitRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/commits`,
      getOptions(
        "POST",
        this.commonHeaders,
        void 0,
        "json",
        JSON.stringify({
          message: "deleted by PicList",
          tree: newTreeSha,
          parents: [refSha]
        }),
        void 0,
        this.proxy
      )
    );
    if (commitRes.statusCode !== 201) return false;
    const commitSha = commitRes.body.sha;
    const updateRefRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/refs/heads/${branch}`,
      getOptions(
        "PATCH",
        this.commonHeaders,
        void 0,
        "json",
        JSON.stringify({
          sha: commitSha
        }),
        void 0,
        this.proxy
      )
    );
    return updateRefRes.statusCode === 200;
  }
  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap) {
    const { bucketName: repo, customUrl: branch, key, rawUrl, githubPrivate: isPrivate } = configMap;
    if (!isPrivate) return rawUrl;
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${key}`,
      getOptions(
        "GET",
        this.commonHeaders,
        {
          ref: branch
        },
        "json",
        void 0,
        void 0,
        this.proxy
      )
    );
    return res.statusCode === 200 ? res.body.download_url : "";
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { bucketName: repo, githubBranch: branch, key } = configMap;
    const newFileKey = `${trimPath(key)}/.gitkeep`;
    const base64Content = Buffer.from("created by PicList").toString("base64");
    const body = {
      message: `created a new folder named ${key} by PicList`,
      content: base64Content,
      branch
    };
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${newFileKey}`,
      getOptions("PUT", this.commonHeaders, void 0, "json", JSON.stringify(body), void 0, this.proxy)
    );
    return res.statusCode === 201;
  }
  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key.startsWith("/") && (item.key = item.key.slice(1));
    });
    const filteredFileArray = fileArray.filter((item) => item.fileSize < 100 * 1024 * 1024);
    for (const item of filteredFileArray) {
      const { bucketName: repo, region, githubBranch: branch, key, filePath, fileName } = item;
      const id = `${repo}-${branch}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      const trimKey = trimPath(key);
      const base64Content = fs.readFileSync(filePath, { encoding: "base64" });
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: repo,
        targetFileRegion: region
      });
      gotUpload(
        instance,
        `${this.baseUrl}/repos/${this.username}/${repo}/contents/${trimKey}`,
        "PUT",
        JSON.stringify({
          message: "uploaded by PicList",
          branch,
          content: base64Content
        }),
        this.commonHeaders,
        id,
        this.logger,
        3e4,
        false,
        getAgent(this.proxy)
      );
    }
    return true;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName: repo, customUrl: branch, key, fileName, githubPrivate, githubUrl } = item;
      const id = `${repo}-${branch}-${key}-${fileName}`;
      const savedFilePath = path.join(downloadPath, fileName);
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      let downloadUrl;
      if (githubPrivate) {
        const preSignedUrl = await this.getPreSignedUrl({
          bucketName: repo,
          customUrl: branch,
          key,
          rawUrl: githubUrl,
          githubPrivate
        });
        downloadUrl = preSignedUrl;
      } else {
        downloadUrl = githubUrl;
      }
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, downloadUrl, id, savedFilePath, this.logger, this.proxyStr).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(
        formatError(error, {
          class: "GithubApi",
          method: "downloadBucketFile"
        })
      );
    });
    return true;
  }
};
let ImgurApi$1 = class ImgurApi {
  userName;
  accessToken;
  proxy;
  logger;
  proxyStr;
  tokenHeaders;
  idHeaders;
  baseUrl = "https://api.imgur.com/3";
  constructor(userName, accessToken, proxy, logger2) {
    this.userName = userName;
    this.accessToken = accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`;
    this.proxy = proxy;
    this.proxyStr = formatHttpProxy(proxy, "string");
    this.logger = logger2;
    this.tokenHeaders = {
      Authorization: this.accessToken
    };
  }
  formatFile(item) {
    const fileName = path.basename(item.link);
    const isImg = isImage(fileName);
    return {
      ...item,
      Key: fileName,
      key: fileName,
      fileName: `${item.name}${path.extname(item.link)}`,
      formatedTime: new Date(item.datetime * 1e3).toLocaleString(),
      fileSize: item.size,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImg,
      url: item.link,
      sha: item.deletehash
    };
  }
  /**
   * get repo list
   */
  async getBucketList() {
    let initPage = 0;
    let res;
    const result = [];
    do {
      res = await got(
        `${this.baseUrl}/account/${this.userName}/albums/${initPage}`,
        getOptions("GET", this.tokenHeaders, void 0, "json", void 0, void 0, this.proxy)
      );
      if (!(res.statusCode === 200 && res.body.success)) {
        return [];
      }
      result.push(...res.body.data);
      initPage++;
    } while (res.body.data.length > 0);
    const finalResult = result.map((item) => ({
      ...item,
      Name: item.title,
      Location: item.id,
      CreationDate: item.datetime
    }));
    finalResult.push({
      Name: "全部",
      Location: "unclassified",
      CreationDate: (/* @__PURE__ */ new Date()).getTime()
    });
    return finalResult;
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketConfig: { Location: albumHash },
      cancelToken
    } = configMap;
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    if (albumHash !== "unclassified") {
      res = await got(
        `${this.baseUrl}/account/${this.userName}/album/${albumHash}`,
        getOptions("GET", this.tokenHeaders, void 0, "json", void 0, void 0, this.proxy)
      );
      if (res.statusCode === 200 && res.body.success) {
        res.body.data.images.forEach((item) => {
          result.fullList.push(this.formatFile(item));
        });
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
    } else {
      let initPage = 0;
      do {
        res = await got(
          `${this.baseUrl}/account/${this.userName}/images/${initPage}`,
          getOptions("GET", this.tokenHeaders, void 0, "json", void 0, void 0, this.proxy)
        );
        if (res.statusCode === 200 && res.body.success) {
          res.body.data.forEach((item) => {
            result.fullList.push(this.formatFile(item));
          });
        } else {
          result.finished = true;
          window2.webContents.send("refreshFileTransferList", result);
          ipcMain.removeAllListeners("cancelLoadingFileList");
          return;
        }
        initPage++;
      } while (res.body.data.length > 0 && !cancelTask[0]);
    }
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  async deleteBucketFile(configMap) {
    const { DeleteHash: deleteHash } = configMap;
    const res = await got(
      `${this.baseUrl}/account/${this.userName}/image/${deleteHash}`,
      getOptions("DELETE", this.tokenHeaders, void 0, "json", void 0, void 0, this.proxy)
    );
    return res.statusCode === 200 && res.body.success;
  }
  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key = item.key.replace(/^\/+/, "");
    });
    for (const item of fileArray) {
      const { bucketName, region: albumHash, key, fileName, filePath, fileSize } = item;
      const id = `${albumHash}-${key}-${filePath}`;
      if (instance.getUploadTask(id) || fileSize > 1024 * 1024 * 200) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: albumHash
      });
      const form = new FormData();
      form.append("type", "file");
      form.append("description", "uploaded by PicList");
      form.append("name", path.basename(key, path.extname(key)));
      if (fileSize > 1024 * 1024 * 10) {
        form.append("video", fs.createReadStream(filePath), {
          filename: path.basename(key),
          contentType: getFileMimeType(fileName)
        });
      } else {
        form.append("image", fs.createReadStream(filePath), {
          filename: path.basename(key),
          contentType: getFileMimeType(fileName)
        });
      }
      albumHash !== "unclassified" && form.append("album", albumHash);
      const headers = form.getHeaders();
      headers.Authorization = this.accessToken;
      gotUpload(
        instance,
        `${this.baseUrl}/image`,
        "POST",
        form,
        headers,
        id,
        this.logger,
        3e4,
        false,
        getAgent(this.proxy)
      );
    }
    return true;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, githubUrl: url } = item;
      const id = `${bucketName}-${region}-${key}-${fileName}`;
      const savedFilePath = path.join(downloadPath, fileName);
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, url, id, savedFilePath, this.logger, this.proxyStr).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: "ImgurApi", method: "downloadBucketFile" }));
    });
    return true;
  }
};
let LocalApi$1 = class LocalApi {
  logger;
  isWindows;
  constructor(logger2) {
    this.logger = logger2;
    this.isWindows = process.platform === "win32";
  }
  logParam = (error, method) => this.logger.error(formatError(error, { class: "LocalApi", method }));
  // windows 系统下将路径转换为 unix 风格
  transPathToUnix(filePath) {
    if (!filePath) return "";
    return this.isWindows ? filePath.split(path.sep).join(path.posix.sep) : filePath.replace(/^\/+/, "");
  }
  transBack(filePath) {
    if (!filePath) return "";
    return this.isWindows ? filePath.split(path.posix.sep).join(path.sep).replace(/^\\+|\\+$/g, "") : `/${filePath.replace(/^\/+|\/+$/g, "")}`;
  }
  formatFolder(item, urlPrefix, fileName, filePath) {
    const key = `${this.transPathToUnix(filePath)}/`.replace(/\/+$/, "/");
    return {
      ...item,
      key,
      fileName,
      fileSize: 0,
      Key: key,
      formatedTime: "",
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url: urlPrefix
    };
  }
  formatFile(item, urlPrefix, fileName, filePath, isDownload = false) {
    const key = isDownload ? filePath : this.transPathToUnix(filePath);
    return {
      ...item,
      key,
      fileName,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.mtime).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName),
      url: urlPrefix
    };
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { prefix, customUrl = "", cancelToken } = configMap;
    const urlPrefix = customUrl.replace(/\/+$/, "");
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      res = fsWalk.walkSync(this.transBack(prefix), {
        followSymbolicLinks: true,
        fs,
        stats: true,
        throwErrorOnBrokenSymbolicLink: false
      });
      if (res.length) {
        result.fullList.push(
          ...res.filter((item) => item.stats?.isFile()).map((item) => this.formatFile(item, urlPrefix, item.name, item.path, true))
        );
        result.success = true;
      }
    } catch (error) {
      this.logParam(error, "getBucketListRecursively");
    }
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { customUrl = "", cancelToken, baseDir } = configMap;
    let prefix = configMap.prefix;
    prefix = this.transBack(prefix);
    const urlPrefix = customUrl.replace(/\/+$/, "");
    let webPath = configMap.webPath || "";
    if (webPath && customUrl && webPath !== "/") {
      webPath = webPath.replace(/^\/+|\/+$/, "");
    }
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      const res = await fs.readdir(prefix, {
        withFileTypes: true
      });
      if (res.length) {
        let urlPrefixF;
        res.forEach((item) => {
          const pathOfFile = path.join(prefix, item.name);
          let relative;
          if (customUrl) {
            const relativePath = path.relative(this.transBack(baseDir), pathOfFile);
            relative = urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, "/").replace(/\/+/g, "/");
            urlPrefixF = this.isWindows ? relative.replace(/\/[a-zA-Z]:\//, "/") : relative;
          } else {
            urlPrefixF = pathOfFile;
          }
          const stats = fs.statSync(pathOfFile);
          if (item.isDirectory()) {
            result.fullList.push(this.formatFolder(stats, urlPrefixF, item.name, pathOfFile));
          } else {
            result.fullList.push(this.formatFile(stats, urlPrefixF, item.name, pathOfFile));
          }
        });
        result.success = true;
      }
    } catch (error) {
      this.logParam(error, "getBucketListBackstage");
    }
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  async renameBucketFile(configMap) {
    const { oldKey, newKey } = configMap;
    let result = false;
    try {
      await fs.rename(this.transBack(oldKey), this.transBack(newKey));
      result = true;
    } catch (error) {
      this.logParam(error, "renameBucketFile");
    }
    return result;
  }
  async deleteBucketFile(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await fs.remove(this.transBack(key));
      result = true;
    } catch (error) {
      this.logParam(error, "deleteBucketFile");
    }
    return result;
  }
  async deleteBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await fs.rm(this.transBack(key), {
        recursive: true
      });
      result = true;
    } catch (error) {
      this.logParam(error, "deleteBucketFolder");
    }
    return result;
  }
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { alias, bucketName, key, filePath, fileName } = item;
      const id = `${alias}-${bucketName}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: "",
        noProgress: true
      });
      try {
        fs.ensureFileSync(this.transBack(key));
        await fs.copyFile(filePath, this.transBack(key));
        instance.updateUploadTask({
          id,
          progress: 100,
          status: uploadTaskSpecialStatus.uploaded,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      } catch (error) {
        this.logParam(error, "uploadBucketFile");
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      }
    }
    return true;
  }
  async createBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await fs.mkdir(this.transBack(key), {
        recursive: true
      });
      result = true;
    } catch (error) {
      this.logParam(error, "createBucketFolder");
    }
    return result;
  }
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { alias, bucketName, key, fileName } = item;
      const savedFilePath = path.join(downloadPath, fileName.replace(/[:*?"<>|]/g, ""));
      const id = `${alias}-${bucketName}-local-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      try {
        fs.ensureFileSync(savedFilePath);
        await fs.copyFile(this.transBack(key), savedFilePath);
        instance.updateDownloadTask({
          id,
          progress: 100,
          status: downloadTaskSpecialStatus.downloaded,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      } catch (error) {
        this.logParam(error, "downloadBucketFile");
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      }
    }
    return true;
  }
};
let QiniuApi$1 = class QiniuApi {
  mac;
  accessKey;
  secretKey;
  commonType = "application/x-www-form-urlencoded";
  host = "uc.qiniuapi.com";
  logger;
  timeout = 3e4;
  hostList = {
    getBucketList: "https://uc.qiniuapi.com/buckets",
    getBucketDomain: "https://uc.qiniuapi.com/v2/domains"
  };
  constructor(accessKey, secretKey, logger2) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.logger = logger2;
  }
  formatFolder(item, slicedPrefix, urlPrefix) {
    return {
      Key: item,
      key: item,
      url: `${urlPrefix}/${item}`,
      fileSize: 0,
      fileName: item.replace(slicedPrefix, "").replace("/", ""),
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    };
  }
  formatFile(item, slicedPrefix, urlPrefix) {
    const fileName = item.key.replace(slicedPrefix, "");
    return {
      ...item,
      fileName,
      url: `${urlPrefix}/${item.key}`,
      fileSize: item.fsize,
      formatedTime: new Date(parseInt(item.putTime.toString().slice(0, -4), 10)).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName)
    };
  }
  authorization(method, urlPath, host, body, query, contentType, xQiniuHeaders) {
    let signStr = `${method.toUpperCase()} ${urlPath}${query ? `?${query}` : ""}
Host: ${host}`;
    contentType && (signStr += `
Content-Type: ${contentType}`);
    if (xQiniuHeaders) {
      const xQiniuHeaderStr = Object.keys(xQiniuHeaders).sort().map((key) => `
${key}:${xQiniuHeaders[key]}`).join("");
      signStr += xQiniuHeaderStr;
    }
    signStr += "\n\n";
    if (contentType !== "application/octet-stream" && body) signStr += body;
    return `Qiniu ${this.accessKey}:${hmacSha1Base64(this.secretKey, signStr).replace(/\+/g, "-").replace(/\//g, "_")}`;
  }
  /**
   * 获取存储桶列表
   */
  async getBucketList() {
    const host = this.hostList.getBucketList;
    const authorization = qiniu.util.generateAccessToken(this.mac, host, void 0);
    const res = await axios.get(host, {
      headers: {
        Authorization: authorization,
        "Content-Type": this.commonType
      },
      timeout: this.timeout
    });
    if (res?.status === 200 && res?.data?.length) {
      const result = [];
      for (const dataItem of res.data) {
        const info = await this.getBucketInfo({ bucketName: dataItem });
        if (!info.success) return [];
        result.push({
          Name: dataItem,
          Location: info.zone,
          CreationDate: (/* @__PURE__ */ new Date()).toISOString(),
          Private: info.private
        });
      }
      return result;
    }
    return [];
  }
  /**
   * 获取存储桶详细信息
   */
  async getBucketInfo(param) {
    const { bucketName } = param;
    const urlPath = `/v2/bucketInfo?bucket=${bucketName}&fs=true`;
    const authorization = this.authorization("POST", urlPath, this.host, "", "", "application/json");
    const res = await axios({
      method: "post",
      url: `https://${this.host}/v2/bucketInfo`,
      params: {
        bucket: bucketName,
        fs: true
      },
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Host: this.host
      },
      timeout: this.timeout
    });
    return res?.status === 200 ? {
      success: true,
      private: res.data.private,
      zone: res.data.zone
    } : {
      success: false
    };
  }
  /**
   * 获取自定义域名
   */
  async getBucketDomain(param) {
    const { bucketName } = param;
    const host = this.hostList.getBucketDomain;
    const authorization = qiniu.util.generateAccessToken(this.mac, `${host}?tbl=${bucketName}`, void 0);
    const res = await axios.get(host, {
      params: {
        tbl: bucketName
      },
      headers: {
        Authorization: authorization,
        "Content-Type": this.commonType
      },
      timeout: this.timeout
    });
    return res?.status === 200 && res?.data?.length ? res.data : [];
  }
  /**
   * 修改存储桶权限
   */
  async setBucketAclPolicy(param) {
    const { bucketName } = param;
    let { isPrivate } = param;
    isPrivate = isPrivate ? 1 : 0;
    const urlPath = `/private?bucket=${bucketName}&private=${isPrivate}`;
    const authorization = this.authorization("POST", urlPath, this.host, "", "", this.commonType);
    const res = await axios({
      method: "post",
      url: `https://${this.host}/private`,
      params: {
        bucket: bucketName,
        private: isPrivate
      },
      headers: {
        Authorization: authorization,
        "Content-Type": this.commonType,
        Host: this.host
      },
      timeout: this.timeout
    });
    return res?.status === 200;
  }
  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: boolean // 是否公开访问
   * }
   */
  async createBucket(configMap) {
    const { BucketName, region, acl } = configMap;
    const urlPath = `/mkbucketv3/${BucketName}/region/${region}`;
    const authorization = this.authorization("POST", urlPath, this.host, "", "", "application/json");
    const res = await axios({
      method: "post",
      url: `https://${this.host}${urlPath}`,
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Host: this.host
      },
      timeout: this.timeout
    });
    return res?.status === 200 ? await this.setBucketAclPolicy({
      bucketName: BucketName,
      isPrivate: !acl
    }) : false;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: bucket, prefix, cancelToken, customUrl: urlPrefix } = configMap;
    let marker = void 0;
    const slicedPrefix = prefix.slice(1);
    const cancelTask = [false];
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    do {
      res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(
          bucket,
          {
            prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
            marker,
            limit: 1e3
          },
          (err, respBody, respInfo) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                respBody,
                respInfo
              });
            }
          }
        );
      });
      if (res && res.respInfo.statusCode === 200) {
        res.respBody && res.respBody.items && res.respBody.items.forEach((item) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        });
        window2.webContents.send(refreshDownloadFileTransferList, result);
      } else {
        result.finished = true;
        window2.webContents.send(refreshDownloadFileTransferList, result);
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
        return;
      }
      marker = res.respBody.marker;
    } while (res.respBody && res.respBody.marker && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: bucket, prefix, cancelToken, customUrl: urlPrefix } = configMap;
    let marker = void 0;
    const slicedPrefix = prefix.slice(1);
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    do {
      res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(
          bucket,
          {
            prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
            delimiter: "/",
            marker,
            limit: 1e3
          },
          (err, respBody, respInfo) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                respBody,
                respInfo
              });
            }
          }
        );
      });
      if (res && res.respInfo.statusCode === 200) {
        res.respBody && res.respBody.commonPrefixes && res.respBody.commonPrefixes.forEach((item) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
        });
        res.respBody && res.respBody.items && res.respBody.items.forEach((item) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        });
        window2.webContents.send("refreshFileTransferList", result);
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
      marker = res.respBody.marker;
    } while (res.respBody && res.respBody.marker && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList(configMap) {
    const { bucketName: bucket, prefix, marker, itemsPerPage, customUrl: urlPrefix } = configMap;
    const slicedPrefix = prefix.slice(1);
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    let res = {};
    const result = {
      fullList: [],
      isTruncated: false,
      nextMarker: "",
      success: false
    };
    res = await new Promise((resolve, reject) => {
      bucketManager.listPrefix(
        bucket,
        {
          limit: itemsPerPage,
          prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
          marker,
          delimiter: "/"
        },
        (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              respBody,
              respInfo
            });
          }
        }
      );
    });
    if (res?.respInfo?.statusCode === 200) {
      if (res.respBody?.commonPrefixes) {
        res.respBody.commonPrefixes.forEach((item) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
        });
      }
      if (res.respBody?.items) {
        res.respBody.items.forEach((item) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        });
      }
      result.isTruncated = !!res.respBody?.marker;
      result.nextMarker = res.respBody?.marker ? res.respBody.marker : "";
      result.success = true;
    }
    return result;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { bucketName, key } = configMap;
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    const res = await new Promise((resolve, reject) => {
      bucketManager.delete(bucketName, key, (err, respBody, respInfo) => {
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
    return res?.respInfo?.statusCode === 200;
  }
  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { bucketName, key } = configMap;
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    let marker = "";
    let isTruncated = true;
    const allFileList = {
      Contents: []
    };
    do {
      const res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(
          bucketName,
          {
            prefix: key,
            marker,
            limit: 1e3
          },
          (err, respBody, respInfo) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                respBody,
                respInfo
              });
            }
          }
        );
      });
      if (res?.respInfo?.statusCode === 200) {
        if (res.respBody?.items) {
          allFileList.Contents = allFileList.Contents.concat(res.respBody.items);
        }
        isTruncated = !!res.respBody?.marker;
        marker = res.respBody?.marker ? res.respBody.marker : "";
      } else {
        return false;
      }
    } while (isTruncated);
    const cycleNum = Math.ceil(allFileList.Contents.length / 1e3);
    for (let i = 0; i < cycleNum; i++) {
      const deleteOps = allFileList.Contents.slice(i * 1e3, (i + 1) * 1e3).map((item) => {
        return qiniu.rs.deleteOp(bucketName, item.key);
      });
      const res = await new Promise((resolve, reject) => {
        bucketManager.batch(deleteOps, (err, respBody, respInfo) => {
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
      if (res?.respInfo?.statusCode !== 200) return false;
    }
    return true;
  }
  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap) {
    const { bucketName, oldKey, newKey } = configMap;
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    const res = await new Promise((resolve, reject) => {
      bucketManager.move(
        bucketName,
        oldKey,
        bucketName,
        newKey,
        {
          force: true
        },
        (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              respBody,
              respInfo
            });
          }
        }
      );
    });
    return res?.respInfo?.statusCode === 200;
  }
  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap) {
    const { key, expires, customUrl } = configMap;
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    const urlPrefix = customUrl;
    const expiration = parseInt(Date.now() / 1e3 + expires);
    const res = bucketManager.privateDownloadUrl(urlPrefix, key, expiration);
    return res;
  }
  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key = item.key.replace(/^\/+/, "");
    });
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item;
      instance.addUploadTask({
        id: `${bucketName}-${region}-${key}-${filePath}`,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      });
      const config = new qiniu.conf.Config();
      const resumeUploader = new qiniu.resume_up.ResumeUploader(config);
      const putExtra = new qiniu.resume_up.PutExtra();
      const uploadToken = new qiniu.rs.PutPolicy({
        scope: `${bucketName}:${key}`,
        expires: 36e3
      }).uploadToken(this.mac);
      putExtra.fname = key;
      putExtra.params = {};
      putExtra.mimeType = getFileMimeType(fileName);
      putExtra.version = "v2";
      putExtra.partSize = 4 * 1024 * 1024;
      putExtra.progressCallback = (uploadBytes, totalBytes) => {
        const progress = Math.floor(uploadBytes / totalBytes * 100);
        instance.updateUploadTask({
          id: `${bucketName}-${region}-${key}-${filePath}`,
          progress,
          status: uploadTaskSpecialStatus.uploading
        });
      };
      resumeUploader.putFile(uploadToken, key, filePath, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          this.logger.error(
            formatError(respErr, {
              class: "Qiniu",
              method: "uploadBucketFile"
            })
          );
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
          return;
        }
        if (respInfo.statusCode === 200) {
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            response: JSON.stringify(respBody),
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      });
    }
    return true;
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { bucketName, key } = configMap;
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucketName}:${key}`
    });
    const uploadToken = putPolicy.uploadToken(this.mac);
    const FormUploader = new qiniu.form_up.FormUploader();
    const putExtra = new qiniu.form_up.PutExtra();
    const res = await new Promise((resolve, reject) => {
      FormUploader.put(uploadToken, key, "", putExtra, (err, respBody, respInfo) => {
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
    return res?.respInfo?.statusCode === 200;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      const preSignedUrl = await this.getPreSignedUrl({
        key,
        expires: 36e3,
        customUrl
      });
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: "QiniuApi", method: "downloadBucketFile" }));
    });
    return true;
  }
};
async function dogecloudApi(apiPath, data = {}, jsonMode = false, accessKey, secretKey) {
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data);
  const sign = crypto.createHmac("sha1", secretKey).update(Buffer.from(apiPath + "\n" + body, "utf8")).digest("hex");
  const authorization = `TOKEN ${accessKey}:${sign}`;
  try {
    const res = await axios.request({
      url: "https://api.dogecloud.com" + apiPath,
      method: "POST",
      data: body,
      responseType: "json",
      headers: {
        "Content-Type": jsonMode ? "application/json" : "application/x-www-form-urlencoded",
        Authorization: authorization
      }
    });
    if (res.data.code !== 200) {
      throw new Error("API Error");
    }
    return res.data.data;
  } catch (err) {
    throw new Error("API Error");
  }
}
async function getTempToken(accessKey, secretKey) {
  const dogeTempToken = await picgo.getConfig("Credentials.doge-token") || {};
  if (dogeTempToken.token && dogeTempToken.expires > Date.now() + 72e5) {
    return dogeTempToken.token;
  }
  try {
    const data = await dogecloudApi(
      "/auth/tmp_token.json",
      {
        channel: "OSS_FULL",
        scopes: ["*"]
      },
      true,
      accessKey,
      secretKey
    );
    const token = data.Credentials;
    picgo.saveConfig({
      Credentials: {
        "doge-token": {
          token,
          expires: data.ExpiredAt * 1e3
        }
      }
    });
    return token;
  } catch (err) {
    return {};
  }
}
class S3plistApi {
  baseOptions;
  logger;
  agent;
  proxy;
  dogeCloudSupport;
  accessKeyId;
  secretAccessKey;
  bucketName;
  constructor(accessKeyId, secretAccessKey, endpoint, sslEnabled, s3ForcePathStyle, proxy, logger2, dogeCloudSupport = false, bucketName = "") {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.dogeCloudSupport = dogeCloudSupport;
    this.bucketName = bucketName;
    this.baseOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      endpoint: endpoint ? formatEndpoint(endpoint, sslEnabled) : void 0,
      tls: sslEnabled,
      forcePathStyle: s3ForcePathStyle,
      requestHandler: this.setAgent(proxy, sslEnabled)
    };
    this.logger = logger2;
    this.proxy = formatHttpProxy(proxy, "string");
  }
  async getDogeCloudToken() {
    if (!this.dogeCloudSupport) return;
    const token = await getTempToken(this.accessKeyId, this.secretAccessKey);
    if (Object.keys(token).length === 0) {
      throw new Error("manage.setting.dogeCloudTokenError");
    }
    this.baseOptions.credentials = {
      accessKeyId: token.accessKeyId,
      secretAccessKey: token.secretAccessKey,
      sessionToken: token.sessionToken
    };
  }
  setAgent(proxy, sslEnabled) {
    const agent = getAgent(proxy, sslEnabled);
    const commonOptions2 = {
      keepAlive: true,
      keepAliveMsecs: 1e3,
      scheduling: "lifo"
    };
    const extraOptions = sslEnabled ? { rejectUnauthorized: false } : {};
    return sslEnabled ? new NodeHttpHandler({
      httpsAgent: agent.https ? agent.https : new https.Agent({
        ...commonOptions2,
        ...extraOptions
      })
    }) : new NodeHttpHandler({
      httpAgent: agent.http ? agent.http : new http.Agent({
        ...commonOptions2,
        ...extraOptions
      })
    });
  }
  logParam = (error, method) => this.logger.error(formatError(error, { class: "S3plistApi", method }));
  formatFolder(item, slicedPrefix, urlPrefix) {
    return {
      Key: item.Prefix,
      url: `${urlPrefix}/${item.Prefix}`,
      fileSize: 0,
      formatedTime: "",
      fileName: item.Prefix?.replace(slicedPrefix, "").replace("/", ""),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      key: item.Prefix
    };
  }
  formatFile(item, slicedPrefix, urlPrefix) {
    const fileName = item.Key?.replace(slicedPrefix, "");
    return {
      ...item,
      key: item.Key,
      url: `${urlPrefix}/${item.Key}`,
      fileName,
      fileSize: item.Size,
      formatedTime: new Date(item.LastModified).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName || "")
    };
  }
  async putPublicAccess(bucketName, client) {
    const input = {
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    };
    const command = new PutPublicAccessBlockCommand(input);
    const data = await client.send(command);
    if (data.$metadata.httpStatusCode !== 200) {
      this.logParam(data, "putPublicAccess");
      throw new Error("manage.setting.putPublicAccessError");
    }
  }
  /**
   * 新建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   */
  async createBucket(configMap) {
    const { BucketName, region, acl, endpoint } = configMap;
    try {
      await this.getDogeCloudToken();
      const options = { ...this.baseOptions };
      options.region = String(region) || "us-east-1";
      const client = new S3Client(options);
      const command = new ListBucketsCommand({});
      const data = await client.send(command);
      if (data.$metadata.httpStatusCode === 200) {
        const bucketList = data.Buckets?.map((item) => item.Name);
        if (bucketList?.includes(BucketName)) {
          return true;
        }
      }
      if (endpoint === "" || endpoint.includes("amazonaws")) {
        const createCommand = new CreateBucketCommand({
          Bucket: BucketName,
          ObjectOwnership: "BucketOwnerPreferred"
        });
        const createData = await client.send(createCommand);
        if (createData.$metadata.httpStatusCode === 200) {
          if (acl !== "private") {
            await this.putPublicAccess(BucketName, client);
            const putACLCommand = new PutBucketAclCommand({
              Bucket: BucketName,
              ACL: acl
            });
            const putACLData = await client.send(putACLCommand);
            if (putACLData.$metadata.httpStatusCode !== 200) {
              this.logParam(putACLData, "createBucket");
              return false;
            }
          }
          return true;
        } else {
          this.logParam(createData, "createBucket");
        }
      } else {
        const createCommand = new CreateBucketCommand({
          Bucket: BucketName,
          ACL: acl
        });
        const createData = await client.send(createCommand);
        if (createData.$metadata.httpStatusCode === 200) {
          return true;
        } else {
          this.logParam(createData, "createBucket");
        }
      }
    } catch (error) {
      this.logParam(error, "createBucket");
    }
    return false;
  }
  /**
   * 获取存储桶列表
   */
  async getBucketList() {
    if (this.dogeCloudSupport) {
      try {
        const res = await dogecloudApi("/oss/bucket/list.json", {}, false, this.accessKeyId, this.secretAccessKey);
        for (const item of res.buckets) {
          if (item.name === this.bucketName || item.s3Bucket === this.bucketName) {
            return [
              {
                Name: item.s3Bucket,
                CreationDate: item.ctime,
                Location: item.region
              }
            ];
          }
        }
        return [];
      } catch (error) {
        this.logParam(error, "getBucketList");
      }
      return [];
    }
    const options = { ...this.baseOptions };
    const result = [];
    const endpoint = options.endpoint || "";
    options.region = endpoint.includes("cloudflarestorage") ? "auto" : "us-east-1";
    try {
      const client = new S3Client(options);
      const data = await client.send(new ListBucketsCommand({}));
      if (data.$metadata.httpStatusCode !== 200) {
        this.logParam(data, "getBucketList");
        return result;
      }
      if (data.Buckets) {
        if (endpoint.includes("cloudflarestorage")) {
          result.push(
            ...data.Buckets.map((bucket) => ({
              Name: bucket.Name,
              CreationDate: bucket.CreationDate,
              Location: "auto"
            }))
          );
        } else {
          for (const bucket of data.Buckets) {
            const bucketName = bucket.Name;
            const bucketConfig = await client.send(
              new GetBucketLocationCommand({
                Bucket: bucketName
              })
            );
            result.push({
              Name: bucketName,
              CreationDate: bucket.CreationDate,
              Location: bucketConfig.$metadata.httpStatusCode === 200 ? bucketConfig.LocationConstraint?.toLowerCase() || "us-east-1" : "us-east-1"
            });
            if (bucketConfig.$metadata.httpStatusCode !== 200) {
              this.logParam(bucketConfig, "getBucketList");
            }
          }
        }
      }
    } catch (error) {
      this.logParam(error, "getBucketList");
    }
    return result;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`;
    let marker;
    const cancelTask = [false];
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      do {
        const options = { ...this.baseOptions };
        options.region = String(region) || "us-east-1";
        const client = new S3Client(options);
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
          MaxKeys: 1e3,
          ContinuationToken: marker
        });
        res = await client.send(command);
        if (res.$metadata.httpStatusCode === 200) {
          res.Contents && res.Contents.forEach((item) => {
            result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
          });
          window2.webContents.send(refreshDownloadFileTransferList, result);
        } else {
          this.logParam(res, "getBucketListRecursively");
          result.finished = true;
          window2.webContents.send(refreshDownloadFileTransferList, result);
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
          return;
        }
        marker = res.NextContinuationToken;
      } while (res.IsTruncated && !cancelTask[0]);
    } catch (error) {
      this.logParam(error, "getBucketListRecursively");
      result.finished = true;
      window2.webContents.send(refreshDownloadFileTransferList, result);
      ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      return;
    }
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`;
    let marker;
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      await this.getDogeCloudToken();
      do {
        const options = { ...this.baseOptions };
        options.region = String(region) || "us-east-1";
        const client = new S3Client(options);
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
          MaxKeys: 1e3,
          ContinuationToken: marker,
          Delimiter: "/"
        });
        res = await client.send(command);
        if (res.$metadata.httpStatusCode === 200) {
          res.CommonPrefixes && res.CommonPrefixes.forEach((item) => {
            result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
          });
          res.Contents && res.Contents.forEach((item) => {
            result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
          });
          window2.webContents.send("refreshFileTransferList", result);
        } else {
          this.logParam(res, "getBucketListBackstage");
          result.finished = true;
          window2.webContents.send("refreshFileTransferList", result);
          ipcMain.removeAllListeners("cancelLoadingFileList");
          return;
        }
        marker = res.NextContinuationToken;
      } while (res.IsTruncated && !cancelTask[0]);
    } catch (error) {
      this.logParam(error, "getBucketListBackstage");
      result.finished = true;
      window2.webContents.send("refreshFileTransferList", result);
      ipcMain.removeAllListeners("cancelLoadingFileList");
      return;
    }
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  async getBucketFileList(configMap) {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      marker,
      itemsPerPage
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`;
    const result = {
      fullList: [],
      isTruncated: false,
      nextMarker: "",
      success: false
    };
    try {
      await this.getDogeCloudToken();
      const options = {
        ...this.baseOptions,
        region: String(region) || "us-east-1"
      };
      const client = new S3Client(options);
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: slicedPrefix,
        ContinuationToken: marker === "" ? void 0 : marker,
        Delimiter: "/",
        MaxKeys: itemsPerPage
      });
      const data = await client.send(command);
      if (data.$metadata.httpStatusCode === 200) {
        result.fullList = [
          ...data.CommonPrefixes?.map((item) => this.formatFolder(item, slicedPrefix, urlPrefix)) || [],
          ...data.Contents?.map((item) => this.formatFile(item, slicedPrefix, urlPrefix)) || []
        ];
        result.isTruncated = data.IsTruncated || false;
        result.nextMarker = data.NextContinuationToken || "";
        result.success = true;
      }
    } catch (error) {
      this.logParam(error, "getBucketFileList");
    }
    return result;
  }
  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap) {
    const { bucketName, region, oldKey, newKey } = configMap;
    let result = false;
    try {
      await this.getDogeCloudToken();
      const options = {
        ...this.baseOptions,
        region: String(region) || "us-east-1"
      };
      const client = new S3Client(options);
      const command = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: encodeURI(`${bucketName}/${oldKey}`),
        Key: newKey
      });
      const data = await client.send(command);
      if (data.$metadata.httpStatusCode === 200) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey
        });
        const deleteData = await client.send(deleteCommand);
        if (deleteData.$metadata.httpStatusCode === 204) {
          result = true;
        } else {
          this.logParam(deleteData, "renameBucketFile");
        }
      } else {
        this.logParam(data, "renameBucketFile");
      }
    } catch (error) {
      this.logParam(error, "renameBucketFile");
    }
    return result;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { bucketName, region, key } = configMap;
    let result = false;
    try {
      await this.getDogeCloudToken();
      const options = { ...this.baseOptions };
      options.region = String(region) || "us-east-1";
      const client = new S3Client(options);
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      const data = await client.send(command);
      if (data.$metadata.httpStatusCode === 204) {
        result = true;
      } else {
        this.logParam(data, "deleteBucketFile");
      }
    } catch (error) {
      this.logParam(error, "deleteBucketFile");
    }
    return result;
  }
  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    let marker;
    let result = false;
    let IsTruncated;
    let res;
    const allFileList = {
      CommonPrefixes: [],
      Contents: []
    };
    try {
      await this.getDogeCloudToken();
      do {
        const options = { ...this.baseOptions };
        options.region = String(region) || "us-east-1";
        const client = new S3Client(options);
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          ContinuationToken: marker === "" ? void 0 : marker,
          Delimiter: "/",
          MaxKeys: 1e3
        });
        res = await client.send(command);
        if (res.$metadata.httpStatusCode === 200) {
          res.CommonPrefixes && allFileList.CommonPrefixes.push(...res.CommonPrefixes);
          res.Contents && allFileList.Contents.push(...res.Contents);
          IsTruncated = res.IsTruncated || false;
          marker = res.NextContinuationToken || "";
        } else {
          this.logParam(res, "deleteBucketFolder");
          return result;
        }
      } while (IsTruncated);
      if (allFileList.CommonPrefixes.length > 0) {
        for (const item of allFileList.CommonPrefixes) {
          res = await this.deleteBucketFolder({
            bucketName,
            region,
            key: item.Prefix
          });
          if (!res) {
            return result;
          }
        }
      }
      if (allFileList.Contents.length > 0) {
        const cycle = Math.ceil(allFileList.Contents.length / 1e3);
        const options = { ...this.baseOptions };
        options.region = String(region) || "us-east-1";
        const client = new S3Client(options);
        for (let i = 0; i < cycle; i++) {
          const deleteList = allFileList.Contents.slice(i * 1e3, (i + 1) * 1e3);
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: deleteList.map((item) => {
                return {
                  Key: item.Key
                };
              })
            }
          });
          res = await client.send(deleteCommand);
          if (res.$metadata.httpStatusCode !== 200) {
            this.logParam(res, "deleteBucketFolder");
            return result;
          }
        }
      }
      result = true;
      return result;
    } catch (error) {
      this.logParam(error, "deleteBucketFolder");
      return result;
    }
  }
  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap) {
    const { bucketName, region, key, expires } = configMap;
    try {
      await this.getDogeCloudToken();
      const options = { ...this.baseOptions };
      options.region = String(region) || "us-east-1";
      const client = new S3Client(options);
      const signedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        }),
        {
          expiresIn: expires || 3600
        }
      );
      return signedUrl;
    } catch (error) {
      this.logParam(error, "getPreSignedUrl");
      return "error";
    }
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    let result = false;
    try {
      await this.getDogeCloudToken();
      const options = { ...this.baseOptions };
      options.region = String(region) || "us-east-1";
      const client = new S3Client(options);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      const data = await client.send(command);
      if (data.$metadata.httpStatusCode === 200) {
        result = true;
      } else {
        this.logParam(data, "createBucketFolder");
      }
    } catch (error) {
      this.logParam(error, "createBucketFolder");
    }
    return result;
  }
  /**
   * upload file
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key.startsWith("/") && (item.key = item.key.slice(1));
    });
    const allowedAcl = [
      "private",
      "public-read",
      "public-read-write",
      "aws-exec-read",
      "authenticated-read",
      "bucket-owner-read",
      "bucket-owner-full-control"
    ];
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName, aclForUpload } = item;
      const id = `${bucketName}-${String(region)}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: String(region)
      });
      try {
        await this.getDogeCloudToken();
      } catch (error) {
        this.logParam(error, "uploadBucketFile");
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: JSON.stringify(error),
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
        continue;
      }
      const options = { ...this.baseOptions };
      options.region = String(region) || "us-east-1";
      const client = new S3Client(options);
      const fileStream = fs.createReadStream(filePath);
      const parallelUploads3 = new Upload({
        client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: fileStream,
          ContentType: getFileMimeType(fileName),
          ACL: allowedAcl.includes(aclForUpload) ? aclForUpload : "private",
          Metadata: {
            description: "uploaded by PicList"
          }
        }
      });
      parallelUploads3.on("httpUploadProgress", (progress) => {
        instance.updateUploadTask({
          id,
          progress: progress.loaded && progress.total ? Math.floor(progress.loaded / progress.total * 100) : 0,
          status: uploadTaskSpecialStatus.uploading
        });
      });
      parallelUploads3.done().then((data) => {
        if (data.$metadata.httpStatusCode === 200) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      }).catch((error) => {
        this.logParam(error, "uploadBucketFile");
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: JSON.stringify(error),
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      });
    }
    return true;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${bucketName}-${String(region)}-${key}-${savedFilePath}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      const preSignedUrl = await this.getPreSignedUrl({
        bucketName,
        region: String(region),
        key,
        expires: 36e3,
        customUrl
      });
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger, this.proxy).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logParam(error, "downloadBucketFile");
    });
    return true;
  }
}
class SftpApi {
  host;
  port;
  username;
  password;
  privateKey;
  passphrase;
  fileMode;
  dirMode;
  logger;
  ctx;
  config;
  constructor(host, port, username, password, privateKey, passphrase, fileMode, dirMode, logger2) {
    this.host = host;
    this.port = Number(port) || 22;
    this.username = username || "";
    this.password = password || "";
    this.privateKey = privateKey || "";
    this.passphrase = passphrase || "";
    this.fileMode = fileMode || "0664";
    this.dirMode = dirMode || "0775";
    this.logger = logger2;
    this.ctx = SSHClient.instance;
    this.config = {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      privateKey: this.privateKey,
      passphrase: this.passphrase
    };
  }
  logParam = (error, method) => this.logger.error(formatError(error, { class: "SftpApi", method }));
  transFormPermission = (permissionsStr) => {
    const permissions = permissionsStr.length === 10 ? permissionsStr.slice(1) : permissionsStr;
    let result = "";
    for (let i = 0; i < 3; i++) {
      const chunk = permissions.slice(i * 3, i * 3 + 3);
      let value = 0;
      if (chunk[0] === "r") value += 4;
      if (chunk[1] === "w") value += 2;
      if (chunk[2] === "x") value += 1;
      result += value;
    }
    return `0${result}`;
  };
  formatFolder(item, urlPrefix, isWebPath = false) {
    const key = item.key;
    let url;
    if (isWebPath) {
      url = urlPrefix;
    } else {
      if (this.username && this.password) {
        url = `sfpt://${this.username}:${this.password}@${urlPrefix}${item.filename}`;
      } else {
        url = `${urlPrefix}${item.filename}`;
      }
    }
    return {
      ...item,
      key,
      fileName: item.filename,
      fileSize: 0,
      Key: key,
      formatedTime: "",
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url
    };
  }
  formatFile(item, urlPrefix, isWebPath = false) {
    const key = item.key;
    return {
      ...item,
      key,
      fileName: item.filename,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.mtime).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.filename),
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`
    };
  }
  isRequestSuccess = (code) => code === 0;
  connectClient = async () => {
    try {
      await this.ctx.connect(this.config);
      if (!this.ctx.isConnected) {
        throw new Error("SSH 未连接");
      }
    } catch (error) {
      this.logParam(error, "connectClient");
    }
  };
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { prefix, customUrl, cancelToken } = configMap;
    const urlPrefix = customUrl || `${this.host}:${this.port}`;
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      await this.connectClient();
      res = await this.ctx.execCommand(`cd "${prefix}" && ls -la --time-style=long-iso`);
      this.ctx.close();
      if (this.isRequestSuccess(res.code)) {
        const formatedLSRes = this.formatLSResult(res.stdout, prefix);
        if (formatedLSRes.length) {
          formatedLSRes.forEach((item) => {
            if (!item.isDir) {
              result.fullList.push(this.formatFile(item, urlPrefix));
            }
          });
        }
        result.success = true;
      }
    } catch (error) {
      this.logParam(error, "getBucketListRecursively");
    }
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  formatLSResult(res, cwd) {
    const result = [];
    const resArray = res.trim().split("\n");
    resArray.slice(resArray[0].startsWith("total") ? 1 : 0).forEach((item) => {
      const [permissions, , owner, group, size, date, time, ...name] = item.trim().split(/\s+/);
      const filename = name.join(" ");
      if (filename === "." || filename === "..") {
        return;
      }
      const isDir = permissions.startsWith("d");
      const mtime = `${date} ${time}`;
      const key = path.join(cwd, filename).replace(/\\/g, "/").replace(/^\/+/, "");
      result.push({
        permissions,
        isDir,
        owner,
        group,
        size: Number(size) || 0,
        mtime,
        filename,
        key
      });
    });
    return result;
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { prefix, customUrl, cancelToken, baseDir } = configMap;
    let urlPrefix = customUrl || `${this.host}:${this.port}`;
    urlPrefix = urlPrefix.replace(/\/+$/, "");
    let webPath = configMap.webPath || "";
    if (webPath && customUrl && webPath !== "/") {
      webPath = webPath.replace(/^\/+|\/+$/, "");
    }
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      await this.connectClient();
      res = await this.ctx.execCommand(`cd "${prefix}" && ls -la --time-style=long-iso`);
      this.ctx.close();
      if (this.isRequestSuccess(res.code)) {
        const formatedLSRes = this.formatLSResult(res.stdout, prefix);
        if (formatedLSRes.length) {
          formatedLSRes.forEach((item) => {
            const relativePath = path.relative(baseDir, item.key.startsWith("/") ? item.key : `/${item.key}`);
            const relative = webPath && urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, "/").replace(/\/+/g, "/");
            if (item.isDir) {
              result.fullList.push(this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath));
            } else {
              result.fullList.push(this.formatFile(item, webPath ? relative : urlPrefix, !!webPath));
            }
          });
        }
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
    } catch (error) {
      this.logParam(error, "getBucketListBackstage");
      result.finished = true;
      window2.webContents.send("refreshFileTransferList", result);
      ipcMain.removeAllListeners("cancelLoadingFileList");
      return;
    }
    result.success = true;
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  async renameBucketFile(configMap) {
    const { oldKey, newKey } = configMap;
    let result = false;
    try {
      await this.connectClient();
      const res = await this.ctx.execCommand(`mv -f "/${oldKey.replace(/^\/+/, "")}" "/${newKey.replace(/^\/+/, "")}"`);
      this.ctx.close();
      result = this.isRequestSuccess(res.code);
    } catch (error) {
      this.logParam(error, "renameBucketFile");
    }
    return result;
  }
  async deleteBucketFile(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.connectClient();
      const res = await this.ctx.execCommand(`rm -f "/${key.replace(/^\/+/, "")}"`);
      this.ctx.close();
      result = this.isRequestSuccess(res.code);
    } catch (error) {
      this.logParam(error, "deleteBucketFile");
    }
    return result;
  }
  async deleteBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.connectClient();
      if (key.replace(/^\/+/, "") === "" || key.includes("*")) {
        throw new Error("禁止删除");
      }
      const res = await this.ctx.execCommand(`rm -rf "/${key.replace(/^\/+/, "")}"`);
      this.ctx.close();
      result = this.isRequestSuccess(res.code);
    } catch (error) {
      this.logParam(error, "deleteBucketFolder");
    }
    return result;
  }
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { alias, bucketName, region, key, filePath, fileName } = item;
      const id = `${alias}-${bucketName}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region,
        noProgress: false
      });
      try {
        await this.connectClient();
        const res = await this.ctx.putFile(filePath, `/${key.replace(/^\/+/, "")}`, {
          fileMode: this.fileMode,
          dirMode: this.dirMode
        });
        this.ctx.close();
        if (res) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      } catch (error) {
        this.logParam(error, "uploadBucketFile");
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      }
    }
    return true;
  }
  async createBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.connectClient();
      const res = await this.ctx.execCommand(`mkdir -p "/${key.replace(/^\/+/, "")}"`);
      this.ctx.close();
      result = this.isRequestSuccess(res.code);
    } catch (error) {
      this.logParam(error, "createBucketFolder");
    }
    return result;
  }
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { alias, bucketName, region, key, fileName } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${alias}-${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      try {
        await this.connectClient();
        const res = await this.ctx.getFile(savedFilePath, `/${key.replace(/^\/+/, "")}`);
        this.ctx.close();
        if (res) {
          instance.updateDownloadTask({
            id,
            progress: 100,
            status: downloadTaskSpecialStatus.downloaded,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateDownloadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      } catch (error) {
        this.logParam(error, "downloadBucketFile");
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      }
    }
    return true;
  }
}
let SmmsApi$1 = class SmmsApi {
  baseUrl = "https://smms.app/api/v2";
  token;
  axiosInstance;
  logger;
  timeout = 3e4;
  constructor(token, logger2) {
    this.token = token;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: this.token
      },
      httpsAgent: new Agent({
        keepAlive: true,
        timeout: this.timeout
      })
    });
    this.logger = logger2;
  }
  formatFile(item) {
    return {
      ...item,
      Key: item.path,
      key: item.path,
      fileName: item.filename,
      fileSize: item.size,
      formatedTime: new Date(item.created_at).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.storename),
      sha: item.hash,
      downloadUrl: item.url
    };
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { cancelToken } = configMap;
    let marker = 1;
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    do {
      res = await this.axiosInstance("/upload_history", {
        method: "GET",
        headers: {
          "Content-Type": "multipart/form-data"
        },
        params: {
          page: marker
        }
      });
      if (res && res.status === 200 && res.data && res.data.success) {
        if (res.data.Count === 0) {
          result.success = true;
          result.finished = true;
          window2.webContents.send("refreshFileTransferList", result);
          ipcMain.removeAllListeners("cancelLoadingFileList");
          return;
        } else {
          res.data.data.forEach((item) => {
            result.fullList.push(this.formatFile(item));
          });
          window2.webContents.send("refreshFileTransferList", result);
        }
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
      marker++;
    } while (!cancelTask[0] && res?.status === 200 && res?.data?.success && res.data.CurrentPage < res.data.TotalPages);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList({ currentPage }) {
    const result = {
      fullList: [],
      isTruncated: false,
      nextMarker: "",
      success: false
    };
    const res = await this.axiosInstance("/upload_history", {
      method: "GET",
      headers: {
        "Content-Type": "multipart/form-data"
      },
      params: {
        page: currentPage
      }
    });
    if (res?.status !== 200 || !res?.data?.success) return result;
    if (res.data.Count === 0) return { ...result, success: true };
    res.data.data.forEach((item) => {
      result.fullList.push(this.formatFile(item));
    });
    result.isTruncated = res.data.CurrentPage < res.data.TotalPages;
    result.nextMarker = res.data.CurrentPage + 1;
    result.success = true;
    return result;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * DeleteHash: string
   * }
   */
  async deleteBucketFile({ DeleteHash }) {
    const res = await this.axiosInstance(`/delete/${DeleteHash}`, {
      method: "GET",
      params: {
        hash: DeleteHash,
        format: "json"
      }
    });
    return res?.status === 200 && res?.data?.success;
  }
  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item;
      const id = `${bucketName}-${region}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      });
      const form = new FormData();
      form.append("format", "json");
      form.append("smfile", fs.createReadStream(filePath), {
        filename: path.basename(fileName),
        contentType: getFileMimeType(fileName)
      });
      const headers = form.getHeaders();
      headers.Authorization = this.token;
      const url = `${this.baseUrl}/upload`;
      gotUpload(instance, url, "POST", form, headers, id, this.logger);
    }
    return true;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, downloadUrl: preSignedUrl } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: "SmmsApi", method: "downloadBucketFile" }));
    });
    return true;
  }
};
let TcyunApi$1 = class TcyunApi {
  ctx;
  logger;
  constructor(secretId, secretKey, logger2) {
    this.ctx = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });
    this.logger = logger2;
  }
  formatFolder(item, slicedPrefix, urlPrefix) {
    return {
      ...item,
      key: item.Prefix,
      fileSize: 0,
      url: `${urlPrefix}/${item.Prefix}`,
      formatedTime: "",
      fileName: item.Prefix.replace(slicedPrefix, "").replace("/", ""),
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    };
  }
  formatFile(item, slicedPrefix, urlPrefix) {
    return {
      ...item,
      key: item.Key,
      fileName: item.Key.replace(slicedPrefix, ""),
      fileSize: parseInt(item.Size),
      formatedTime: new Date(item.LastModified).toLocaleString(),
      isDir: false,
      checked: false,
      isImage: isImage(item.Key),
      match: false,
      url: `${urlPrefix}/${item.Key}`
    };
  }
  /**
   * 获取存储桶列表
   */
  async getBucketList() {
    const res = await this.ctx.getService({});
    return res?.Buckets || [];
  }
  /**
   * 获取自定义域名
   */
  async getBucketDomain(param) {
    const { bucketName, region } = param;
    const res = await this.ctx.getBucketDomain({
      Bucket: bucketName,
      Region: region
    });
    if (res?.statusCode !== 200 || !res?.DomainRule?.length) return [];
    return res.DomainRule.filter((item) => item.Status === "ENABLED").map((item) => item.Name);
  }
  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   * @description
   * acl: private | publicRead | publicReadWrite
   */
  async createBucket(configMap) {
    const res = await this.ctx.putBucket({
      ACL: configMap.acl,
      Bucket: configMap.BucketName,
      Region: configMap.region
    });
    return res?.statusCode === 200;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      customUrl,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1, prefix.length);
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`;
    const cancelTask = [false];
    let marker;
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    let res = {};
    do {
      res = await this.ctx.getBucket({
        Bucket: bucket,
        Region: region,
        Prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
        Marker: marker
      });
      if (res?.statusCode === 200) {
        result.fullList.push(
          ...res.Contents.filter((item) => parseInt(item.Size) !== 0).map(
            (item) => this.formatFile(item, slicedPrefix, urlPrefix)
          )
        );
        window2.webContents.send(refreshDownloadFileTransferList, result);
      } else {
        result.finished = true;
        window2.webContents.send(refreshDownloadFileTransferList, result);
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
        return;
      }
      marker = res.NextMarker;
    } while (res.IsTruncated === "true" && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      customUrl,
      cancelToken
    } = configMap;
    const slicedPrefix = prefix.slice(1, prefix.length);
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`;
    const cancelTask = [false];
    let marker;
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    do {
      res = await this.ctx.getBucket({
        Bucket: bucket,
        Region: region,
        Prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
        Delimiter: "/",
        Marker: marker
      });
      if (res?.statusCode === 200) {
        result.fullList.push(
          ...res.CommonPrefixes.map((item) => this.formatFolder(item, slicedPrefix, urlPrefix)),
          ...res.Contents.filter((item) => parseInt(item.Size) !== 0).map(
            (item) => this.formatFile(item, slicedPrefix, urlPrefix)
          )
        );
        window2.webContents.send("refreshFileTransferList", result);
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
      marker = res.NextMarker;
    } while (res.IsTruncated === "true" && !cancelTask[0]);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList(configMap) {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      customUrl,
      marker,
      itemsPerPage
    } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`;
    const res = await this.ctx.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: slicedPrefix === "" ? void 0 : slicedPrefix,
      Delimiter: "/",
      Marker: marker,
      MaxKeys: itemsPerPage
    });
    if (res?.statusCode !== 200) {
      return {
        fullList: [],
        isTruncated: false,
        nextMarker: "",
        success: false
      };
    }
    const result = {
      fullList: [
        ...res.CommonPrefixes.map((item) => this.formatFolder(item, slicedPrefix, urlPrefix)),
        ...res.Contents.filter((item) => parseInt(item.Size) !== 0).map(
          (item) => this.formatFile(item, slicedPrefix, urlPrefix)
        )
      ],
      isTruncated: res.IsTruncated === "true",
      nextMarker: res.NextMarker || "",
      success: true
    };
    return result;
  }
  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap) {
    const { bucketName, region, oldKey, newKey } = configMap;
    const copyRes = await this.ctx.putObjectCopy({
      Bucket: bucketName,
      Region: region,
      Key: newKey,
      CopySource: handleUrlEncode(`${bucketName}.cos.${region}.myqcloud.com/${oldKey}`)
    });
    if (copyRes?.statusCode !== 200) return false;
    const deleteRes = await this.ctx.deleteObject({
      Bucket: bucketName,
      Region: region,
      Key: oldKey
    });
    return deleteRes?.statusCode === 204;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { bucketName, region, key } = configMap;
    const res = await this.ctx.deleteObject({
      Bucket: bucketName,
      Region: region,
      Key: key
    });
    return res?.statusCode === 204;
  }
  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    let marker;
    let res;
    const allFileList = {
      CommonPrefixes: [],
      Contents: []
    };
    do {
      res = await this.ctx.getBucket({
        Bucket: bucketName,
        Region: region,
        Prefix: key,
        Delimiter: "/",
        MaxKeys: 1e3,
        Marker: marker
      });
      if (res?.statusCode !== 200) return false;
      allFileList.CommonPrefixes.push(...res.CommonPrefixes);
      allFileList.Contents.push(...res.Contents);
      marker = res.NextMarker;
    } while (res.IsTruncated === "true");
    for (const item of allFileList.CommonPrefixes) {
      if (!await this.deleteBucketFolder({
        bucketName,
        region,
        key: item.Prefix
      })) {
        return false;
      }
    }
    const cycles = Math.ceil(allFileList.Contents.length / 1e3);
    for (let i = 0; i < cycles; i++) {
      const res2 = await this.ctx.deleteMultipleObject({
        Bucket: bucketName,
        Region: region,
        Objects: allFileList.Contents.slice(i * 1e3, (i + 1) * 1e3).map((item) => ({ Key: item.Key }))
      });
      if (res2?.statusCode !== 200) return false;
    }
    return true;
  }
  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap) {
    const { bucketName, region, key, expires, customUrl } = configMap;
    const res = this.ctx.getObjectUrl(
      {
        Bucket: bucketName,
        Region: region,
        Key: key,
        Expires: expires,
        Sign: true
      },
      () => {
      }
    );
    return customUrl ? `${customUrl.replace(/\/+$/, "")}/${key}${res.slice(res.indexOf("?"))}` : res;
  }
  /**
   * 高级上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const files = [];
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileSize, fileName } = item;
      const id = `${bucketName}-${region}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      });
      files.push({
        Bucket: bucketName,
        Region: region,
        Key: key,
        FilePath: filePath,
        ContentType: getFileMimeType(filePath),
        Body: fileSize > 1048576 ? fs.createReadStream(filePath) : void 0,
        onProgress: (progress) => {
          const cancelToken = "";
          instance.updateUploadTask({
            id,
            progress: Math.floor(progress.percent * 100),
            status: uploadTaskSpecialStatus.uploading,
            cancelToken
          });
        },
        onFileFinish: (err, data) => {
          if (data) {
            instance.updateUploadTask({
              id,
              progress: 100,
              status: uploadTaskSpecialStatus.uploaded,
              response: typeof data === "object" ? JSON.stringify(data) : String(data),
              finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
            });
          } else {
            this.logger.error(
              formatError(err, {
                method: "uploadBucketFile",
                class: "TcyunApi"
              })
            );
            instance.updateUploadTask({
              id,
              progress: 0,
              status: commonTaskStatus.failed,
              response: typeof err === "object" ? JSON.stringify(err) : String(err),
              finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
            });
          }
        }
      });
      this.ctx.uploadFiles({
        files
      });
    }
    return true;
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { bucketName, region, key } = configMap;
    const res = await this.ctx.putObject({
      Bucket: bucketName,
      Region: region,
      Key: key,
      Body: ""
    });
    return res?.statusCode === 200;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { bucketName, region, key, fileName } = item;
      const id = `${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: path.join(downloadPath, fileName)
      });
      fs.ensureDirSync(path.dirname(path.join(downloadPath, fileName)));
      this.ctx.downloadFile({
        Bucket: bucketName,
        Region: region,
        Key: key,
        RetryTimes: 3,
        ChunkSize: 1024 * 1024 * 1,
        FilePath: path.join(downloadPath, fileName),
        onProgress: (progress) => {
          instance.updateDownloadTask({
            id,
            progress: Math.floor(progress.percent * 100),
            status: downloadTaskSpecialStatus.downloading
          });
        }
      }).then((res) => {
        instance.updateDownloadTask({
          id,
          progress: res && res.statusCode === 200 ? 100 : 0,
          status: res && res.statusCode === 200 ? downloadTaskSpecialStatus.downloaded : commonTaskStatus.failed,
          response: typeof res === "object" ? JSON.stringify(res) : String(res),
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      }).catch((err) => {
        this.logger.error(
          formatError(err, {
            method: "downloadBucketFile",
            class: "TcyunApi"
          })
        );
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: typeof err === "object" ? JSON.stringify(err) : String(err),
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      });
    }
    return true;
  }
};
let UpyunApi$1 = class UpyunApi {
  ser;
  cli;
  bucket;
  operator;
  password;
  antiLeechToken;
  expireTime;
  stopMarker = "g2gCZAAEbmV4dGQAA2VvZg";
  logger;
  constructor(bucket, operator, password, logger2, antiLeechToken, expireTime) {
    this.ser = new Upyun.Service(bucket, operator, password);
    this.cli = new Upyun.Client(this.ser);
    this.bucket = bucket;
    this.operator = operator;
    this.password = password;
    this.logger = logger2;
    this.antiLeechToken = antiLeechToken || "";
    this.expireTime = expireTime || 24 * 60 * 60;
  }
  getAntiLeechParam(key) {
    const uri = `/${key}`.replace(/%2F/g, "/").replace(/^\/+/g, "/");
    const now = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
    const expire = this.expireTime ? now + parseInt(this.expireTime.toString(), 10) : now + 1800;
    const sign = md5$1(`${this.antiLeechToken}&${expire}&${uri}`, "hex");
    const upt = `${sign.substring(12, 20)}${expire}`;
    return `_upt=${upt}`;
  }
  formatFolder(item, slicedPrefix, urlPrefix) {
    const key = `${slicedPrefix}${item.name}/`;
    let url = `${urlPrefix}/${key}`;
    if (this.antiLeechToken) {
      url = `${url}?${this.getAntiLeechParam(key)}`;
    }
    return {
      ...item,
      key,
      url,
      fileSize: 0,
      formatedTime: "",
      fileName: item.name,
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: key
    };
  }
  formatFile(item, slicedPrefix, urlPrefix) {
    const key = `${slicedPrefix}${item.name}`;
    let url = `${urlPrefix}/${key}`;
    if (this.antiLeechToken) {
      url = `${url}?${this.getAntiLeechParam(key)}`;
    }
    return {
      ...item,
      fileName: item.name,
      fileSize: item.size,
      formatedTime: new Date(parseInt(item.time) * 1e3).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.name),
      url,
      key
    };
  }
  authorization(method, uri, contentMd5, operator, password) {
    return `UPYUN ${operator}:${hmacSha1Base64(
      md5$1(password, "hex"),
      `${method.toUpperCase()}&${encodeURI(uri)}&${(/* @__PURE__ */ new Date()).toUTCString()}${contentMd5 ? `&${contentMd5}` : ""}`
    )}`;
  }
  /**
   * 获取空间列表
   */
  async getBucketList() {
    return this.bucket;
  }
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: bucket, prefix, cancelToken } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`;
    const cancelTask = [false];
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    const folderQueue = [prefix];
    const getFolderFile = async (folder) => {
      let marker = "";
      const key = folder;
      do {
        res = await this.cli.listDir(key, {
          limit: 1e4,
          iter: marker
        });
        if (res) {
          res.files?.forEach((item) => {
            item.type === "F" && folderQueue.push(`${slicedPrefix}${item.name}/`);
            item.type === "N" && result.fullList.push(this.formatFile(item, folder, urlPrefix));
          });
          window2.webContents.send(refreshDownloadFileTransferList, result);
        } else {
          result.finished = true;
          window2.webContents.send(refreshDownloadFileTransferList, result);
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
          return;
        }
        marker = res.next;
      } while (!cancelTask[0] && res.next !== this.stopMarker);
    };
    while (folderQueue.length) {
      const folder = folderQueue.shift();
      await getFolderFile(folder);
    }
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { bucketName: bucket, prefix, cancelToken } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`;
    let marker = "";
    const cancelTask = [false];
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        cancelTask[0] = true;
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    do {
      res = await this.cli.listDir(prefix, {
        limit: 1e4,
        iter: marker
      });
      if (res) {
        res.files?.forEach((item) => {
          item.type === "N" && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
          item.type === "F" && result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
        });
        window2.webContents.send("refreshFileTransferList", result);
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
      marker = res.next;
    } while (!cancelTask[0] && res.next !== this.stopMarker);
    result.success = !cancelTask[0];
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList(configMap) {
    const { bucketName: bucket, prefix, marker, itemsPerPage } = configMap;
    const slicedPrefix = prefix.slice(1);
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`;
    let res = {};
    const result = {
      fullList: [],
      isTruncated: false,
      nextMarker: "",
      success: false
    };
    res = await this.cli.listDir(prefix, {
      limit: itemsPerPage,
      iter: marker || ""
    });
    if (res) {
      res.files?.forEach((item) => {
        item.type === "N" && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix));
        item.type === "F" && result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix));
      });
      result.isTruncated = res.next !== this.stopMarker;
      result.nextMarker = res.next;
      result.success = true;
    }
    return result;
  }
  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap) {
    const oldKey = configMap.oldKey;
    let newKey = configMap.newKey;
    const method = "PUT";
    if (newKey.endsWith("/")) {
      newKey = newKey.slice(0, -1);
    }
    const xUpyunMoveSource = `/${this.bucket}/${oldKey}`;
    const uri = `/${this.bucket}/${newKey}`;
    const authorization = this.authorization(method, uri, "", this.operator, this.password);
    const headers = {
      Authorization: authorization,
      "X-Upyun-Move-Source": xUpyunMoveSource,
      "Content-Length": 0,
      Date: (/* @__PURE__ */ new Date()).toUTCString()
    };
    const res = await axios({
      method,
      url: `http://v0.api.upyun.com${uri}`,
      headers
    });
    return res.status === 200;
  }
  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap) {
    const { key } = configMap;
    const res = await this.cli.deleteFile(key);
    return res;
  }
  /**
   * delete bucket folder
   * @param configMap
   */
  async deleteBucketFolder(configMap) {
    const { key } = configMap;
    let marker = "";
    let isTruncated;
    const allFileList = {
      CommonPrefixes: [],
      Contents: []
    };
    do {
      const res = await this.cli.listDir(key, {
        limit: 1e4,
        iter: marker
      });
      if (res) {
        res.files.forEach((item) => {
          item.type === "N" && allFileList.Contents.push({
            ...item,
            key: `${key}${item.name}`
          });
          item.type === "F" && allFileList.CommonPrefixes.push({
            ...item,
            key: `${key}${item.name}/`
          });
        });
        marker = res.next;
        isTruncated = res.next !== this.stopMarker;
      } else {
        return false;
      }
    } while (isTruncated);
    if (allFileList.Contents.length > 0) {
      let success = false;
      for (const allFileListItem of allFileList.Contents) {
        success = await this.cli.deleteFile(allFileListItem.key);
        if (!success) {
          return false;
        }
      }
    }
    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        const res = await this.deleteBucketFolder({
          key: item.key
        });
        if (!res) {
          return false;
        }
      }
    }
    const deleteSelf = await this.cli.deleteFile(key);
    if (!deleteSelf) {
      return false;
    }
    return true;
  }
  /**
   * upload file to bucket
   * axiso:onUploadProgress not work in nodejs , use got instead
   * @param configMap
   */
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    fileArray.forEach((item) => {
      item.key = item.key.replace(/^\/+/, "");
    });
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName, fileSize } = item;
      const id = `${bucketName}-${region}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      });
      const date = (/* @__PURE__ */ new Date()).toUTCString();
      const uri = `/${key}`;
      const method = "POST";
      const uplpadPolicy = {
        bucket: bucketName,
        "save-key": uri,
        expiration: Math.floor(Date.now() / 1e3) + 2592e3,
        date,
        "content-length": fileSize
      };
      const base64Policy = Buffer.from(JSON.stringify(uplpadPolicy)).toString("base64");
      const stringToSign = `${method}&/${bucketName}&${date}&${base64Policy}`;
      const signature = hmacSha1Base64(md5$1(this.password, "hex"), stringToSign);
      const authorization = `UPYUN ${this.operator}:${signature}`;
      const form = new FormData();
      form.append("policy", base64Policy);
      form.append("authorization", authorization);
      form.append("file", fs.createReadStream(filePath), {
        filename: path.basename(key),
        contentType: getFileMimeType(fileName)
      });
      const headers = form.getHeaders();
      headers.Host = "v0.api.upyun.com";
      headers.Date = date;
      headers.Authorization = authorization;
      gotUpload(instance, `http://v0.api.upyun.com/${bucketName}`, method, form, headers, id, this.logger);
    }
    return true;
  }
  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap) {
    const { key } = configMap;
    const res = await this.cli.makeDir(`/${key}`);
    return res;
  }
  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id: `${bucketName}-${region}-${key}`,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      const preSignedUrl = `${customUrl}/${key}`;
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger).then((res) => {
            if (res) {
              resolve(res);
            } else {
              reject(res);
            }
          });
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: "UpyunApi", method: "downloadBucketFile" }));
    });
    return true;
  }
};
const AUTH_KEY_VALUE_RE = /(\w+)=["']?([^'"]{1,10000})["']?/;
let NC = 0;
const NC_PAD = "00000000";
function md5(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}
function digestAuthHeader(method, uri, wwwAuthenticate, username, password) {
  const parts = wwwAuthenticate.split(",");
  const opts = {};
  for (const i of parts) {
    const m = AUTH_KEY_VALUE_RE.exec(i);
    if (m) {
      opts[m[1]] = m[2].replace(/["']/g, "");
    }
  }
  if (!opts.realm || !opts.nonce) {
    return "";
  }
  let qop = opts.qop || "";
  const userpassArray = [username, password];
  let nc = String(++NC);
  nc = NC_PAD.substring(nc.length) + nc;
  const cnonce = crypto.randomBytes(8).toString("hex");
  const ha1 = md5(userpassArray[0] + ":" + opts.realm + ":" + userpassArray[1]);
  const ha2 = md5(method.toUpperCase() + ":" + uri);
  let s = ha1 + ":" + opts.nonce;
  if (qop) {
    qop = qop.split(",")[0];
    s += ":" + nc + ":" + cnonce + ":" + qop;
  }
  s += ":" + ha2;
  const response = md5(s);
  let authstring = 'Digest username="' + userpassArray[0] + '", realm="' + opts.realm + '", nonce="' + opts.nonce + '", uri="' + uri + '", response="' + response + '"';
  if (opts.opaque) {
    authstring += ', opaque="' + opts.opaque + '"';
  }
  if (qop) {
    authstring += ", qop=" + qop + ", nc=" + nc + ', cnonce="' + cnonce + '"';
  }
  return authstring;
}
async function getAuthHeader(method, host, uri, username, password) {
  try {
    await axios.get(`${host}${uri}`);
  } catch (error) {
    if (error.response.status === 401 && error.response.headers["www-authenticate"]) {
      return digestAuthHeader(method, uri, error.response.headers["www-authenticate"], username, password);
    }
  }
}
class WebdavplistApi {
  endpoint;
  username;
  password;
  sslEnabled;
  proxy;
  proxyStr;
  authType;
  logger;
  agent;
  ctx;
  constructor(endpoint, username, password, sslEnabled, proxy, authType, logger2) {
    this.endpoint = formatEndpoint(endpoint, sslEnabled);
    this.username = username;
    this.password = password;
    this.sslEnabled = sslEnabled;
    this.proxy = proxy;
    this.proxyStr = formatHttpProxy(proxy, "string");
    this.authType = authType || "basic";
    this.logger = logger2;
    this.agent = getInnerAgent(proxy, sslEnabled).agent;
    const options = {
      username: this.username,
      password: this.password,
      maxBodyLength: 4 * 1024 * 1024 * 1024,
      maxContentLength: 4 * 1024 * 1024 * 1024,
      httpsAgent: sslEnabled ? this.agent : void 0,
      httpAgent: !sslEnabled ? this.agent : void 0
    };
    if (this.authType === "digest") {
      options.authType = AuthType.Digest;
    }
    this.ctx = createClient(this.endpoint, options);
  }
  logParam = (error, method) => this.logger.error(formatError(error, { class: "WebdavplistApi", method }));
  formatFolder(item, urlPrefix, isWebPath = false) {
    const key = item.filename.replace(/^\/+/, "");
    return {
      ...item,
      key,
      fileName: item.basename,
      fileSize: 0,
      Key: key,
      formatedTime: "",
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`
    };
  }
  formatFile(item, urlPrefix, isWebPath = false) {
    const key = item.filename.replace(/^\/+/, "");
    return {
      ...item,
      key,
      fileName: item.basename,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.lastmod).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.basename),
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`
    };
  }
  isRequestSuccess = (code) => code >= 200 && code < 300;
  async getBucketListRecursively(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { prefix, customUrl, cancelToken } = configMap;
    const urlPrefix = customUrl || this.endpoint;
    ipcMain.on(cancelDownloadLoadingFileList, (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      res = await this.ctx.getDirectoryContents(prefix, {
        deep: true,
        details: true
      });
      if (this.isRequestSuccess(res.status)) {
        if (res.data?.length) {
          res.data.forEach((item) => {
            if (item.type !== "directory") {
              result.fullList.push(this.formatFile(item, urlPrefix));
            }
          });
        }
        result.success = true;
      }
    } catch (error) {
      this.logParam(error, "getBucketListRecursively");
    }
    result.finished = true;
    window2.webContents.send(refreshDownloadFileTransferList, result);
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
  }
  async getBucketListBackstage(configMap) {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    const { prefix, customUrl, cancelToken, baseDir } = configMap;
    let urlPrefix = customUrl || this.endpoint;
    urlPrefix = urlPrefix.replace(/\/+$/, "");
    let webPath = configMap.webPath || "";
    if (webPath && customUrl && webPath !== "/") {
      webPath = webPath.replace(/^\/+|\/+$/, "");
    }
    ipcMain.on("cancelLoadingFileList", (_, token) => {
      if (token === cancelToken) {
        ipcMain.removeAllListeners("cancelLoadingFileList");
      }
    });
    let res = {};
    const result = {
      fullList: [],
      success: false,
      finished: false
    };
    try {
      res = await this.ctx.getDirectoryContents(prefix, {
        deep: false,
        details: true
      });
      if (this.isRequestSuccess(res.status)) {
        if (res.data?.length) {
          res.data.forEach((item) => {
            const relativePath = path.relative(baseDir, item.filename);
            const relative = webPath && urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, "/").replace(/\/+/g, "/");
            if (item.type === "directory") {
              result.fullList.push(this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath));
            } else {
              result.fullList.push(this.formatFile(item, webPath ? relative : urlPrefix, !!webPath));
            }
          });
        }
      } else {
        result.finished = true;
        window2.webContents.send("refreshFileTransferList", result);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return;
      }
    } catch (error) {
      this.logParam(error, "getBucketListBackstage");
      result.finished = true;
      window2.webContents.send("refreshFileTransferList", result);
      ipcMain.removeAllListeners("cancelLoadingFileList");
      return;
    }
    result.success = true;
    result.finished = true;
    window2.webContents.send("refreshFileTransferList", result);
    ipcMain.removeAllListeners("cancelLoadingFileList");
  }
  async renameBucketFile(configMap) {
    const { oldKey, newKey } = configMap;
    let result = false;
    try {
      await this.ctx.moveFile(oldKey, newKey);
      result = true;
    } catch (error) {
      this.logParam(error, "renameBucketFile");
    }
    return result;
  }
  async deleteBucketFile(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.ctx.deleteFile(key);
      result = true;
    } catch (error) {
      this.logParam(error, "deleteBucketFile");
    }
    return result;
  }
  async deleteBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.ctx.deleteFile(key);
      result = true;
    } catch (error) {
      this.logParam(error, "deleteBucketFolder");
    }
    return result;
  }
  async getPreSignedUrl(configMap) {
    const { key } = configMap;
    let result = "";
    try {
      const res = this.ctx.getFileDownloadLink(key);
      result = res;
    } catch (error) {
      this.logParam(error, "getPreSignedUrl");
    }
    return result;
  }
  async uploadBucketFile(configMap) {
    const { fileArray } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    for (const item of fileArray) {
      const { alias, bucketName, region, key, filePath, fileName } = item;
      const id = `${alias}-${bucketName}-${key}-${filePath}`;
      if (instance.getUploadTask(id)) {
        continue;
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region,
        noProgress: true
      });
      this.ctx.putFileContents(key, this.authType === "digest" ? fs.readFileSync(filePath) : fs.createReadStream(filePath), {
        overwrite: true,
        onUploadProgress: (progressEvent) => {
          instance.updateUploadTask({
            id,
            progress: Math.floor(progressEvent.loaded / progressEvent.total * 100),
            status: uploadTaskSpecialStatus.uploading
          });
        }
      }).then((res) => {
        if (res) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
          });
        }
      }).catch((error) => {
        this.logParam(error, "uploadBucketFile");
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: (/* @__PURE__ */ new Date()).toLocaleString()
        });
      });
    }
    return true;
  }
  async createBucketFolder(configMap) {
    const { key } = configMap;
    let result = false;
    try {
      await this.ctx.createDirectory(key, {
        recursive: true
      });
      result = true;
    } catch (error) {
      this.logParam(error, "createBucketFolder");
    }
    return result;
  }
  async downloadBucketFile(configMap) {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap;
    const instance = UpDownTaskQueue.getInstance();
    const promises = [];
    for (const item of fileArray) {
      const { alias, bucketName, region, key, fileName } = item;
      const savedFilePath = path.join(downloadPath, fileName);
      const id = `${alias}-${bucketName}-${region}-${key}`;
      if (instance.getDownloadTask(id)) {
        continue;
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      });
      let preSignedUrl = await this.getPreSignedUrl({
        key
      });
      let headers = {};
      if (this.authType === "basic" || !this.authType) {
        const base64Str = Buffer.from(`${this.username}:${this.password}`).toString("base64");
        headers = {
          Authorization: `Basic ${base64Str}`
        };
      } else if (this.authType === "digest") {
        const authHeader = await getAuthHeader(
          "GET",
          this.endpoint,
          `/${key.replace(/^\/+/, "")}`,
          this.username,
          this.password
        );
        headers = {
          Authorization: authHeader
        };
        preSignedUrl = `${this.endpoint}/${key.replace(/^\/+/, "")}`;
      }
      promises.push(
        () => new Promise((resolve, reject) => {
          NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger, this.proxyStr, headers).then(
            (res) => {
              if (res) {
                resolve(res);
              } else {
                reject(res);
              }
            }
          );
        })
      );
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount);
    pool.all(promises).catch((error) => {
      this.logParam(error, "downloadBucketFile");
    });
    return true;
  }
}
const API = {
  AliyunApi: AliyunApi$1,
  GithubApi: GithubApi$1,
  ImgurApi: ImgurApi$1,
  LocalApi: LocalApi$1,
  QiniuApi: QiniuApi$1,
  S3plistApi,
  SftpApi,
  SmmsApi: SmmsApi$1,
  TcyunApi: TcyunApi$1,
  UpyunApi: UpyunApi$1,
  WebdavplistApi
};
class ManageDB {
  #ctx;
  #db;
  constructor(ctx) {
    this.#ctx = ctx;
    this.#db = new JSONStore(this.#ctx.configPath);
    const initParams = {
      picBed: {},
      settings: {}
    };
    for (const key in initParams) {
      if (!this.#db.has(key)) {
        try {
          this.#db.set(key, initParams[key]);
        } catch (e) {
          this.#ctx.logger.error(e);
          throw e;
        }
      }
    }
  }
  read(flush) {
    return this.#db.read(flush);
  }
  get(key = "") {
    this.read(true);
    return this.#db.get(key);
  }
  set(key, value) {
    this.read(true);
    return this.#db.set(key, value);
  }
  has(key) {
    this.read(true);
    return this.#db.has(key);
  }
  unset(key, value) {
    this.read(true);
    return this.#db.unset(key, value);
  }
  saveConfig(config) {
    Object.keys(config).forEach((name) => {
      this.set(name, config[name]);
    });
  }
  removeConfig(config) {
    Object.keys(config).forEach((name) => {
      this.unset(name, config[name]);
    });
  }
}
const STORE_PATH$4 = app.getPath("userData");
const manageConfigFilePath = path.join(STORE_PATH$4, "manage.json");
const defaultManageConfigPath = manageConfigFilePath;
const manageConfigFileBackupPath = path.join(STORE_PATH$4, "manage.bak.json");
let _configFilePath = "";
let hasCheckPath = false;
const errorMsg = {
  broken: T("TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_DEFAULT"),
  brokenButBackup: T("TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_BACKUP")
};
function manageDbChecker() {
  if (process.type !== "renderer") {
    const manageConfigFilePath2 = managePathChecker();
    if (!fs.existsSync(manageConfigFilePath2)) {
      return;
    }
    let configFile = "{}";
    const optionsTpl = {
      title: T("TIPS_NOTICE"),
      body: ""
    };
    try {
      configFile = fs.readFileSync(manageConfigFilePath2, { encoding: "utf-8" });
      JSON.parse(configFile);
    } catch (e) {
      fs.unlinkSync(manageConfigFilePath2);
      if (fs.existsSync(manageConfigFileBackupPath)) {
        try {
          configFile = fs.readFileSync(manageConfigFileBackupPath, {
            encoding: "utf-8"
          });
          JSON.parse(configFile);
          writeFile.sync(manageConfigFilePath2, configFile, {
            encoding: "utf-8"
          });
          const stats = fs.statSync(manageConfigFileBackupPath);
          optionsTpl.body = `${errorMsg.brokenButBackup}
${T("TIPS_PICGO_BACKUP_FILE_VERSION", {
            v: dayjs(stats.mtime).format("YYYY-MM-DD HH:mm:ss")
          })}`;
          notificationList.push(optionsTpl);
          return;
        } catch (e2) {
          optionsTpl.body = errorMsg.broken;
          notificationList.push(optionsTpl);
          return;
        }
      }
      optionsTpl.body = errorMsg.broken;
      notificationList.push(optionsTpl);
      return;
    }
    writeFile.sync(manageConfigFileBackupPath, configFile, {
      encoding: "utf-8"
    });
  }
}
function managePathChecker() {
  if (_configFilePath) {
    return _configFilePath;
  }
  _configFilePath = defaultManageConfigPath;
  if (!fs.existsSync(defaultManageConfigPath)) {
    return _configFilePath;
  }
  try {
    const configString = fs.readFileSync(defaultManageConfigPath, {
      encoding: "utf-8"
    });
    const config = JSON.parse(configString);
    const userConfigPath = config.configPath || "";
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith(".json")) {
        _configFilePath = userConfigPath;
        return _configFilePath;
      }
    }
    return _configFilePath;
  } catch (e) {
    const manageLogPath = path.join(STORE_PATH$4, "manage-gui-local.log");
    const logger2 = getLogger(manageLogPath, "Manage");
    if (!hasCheckPath) {
      const optionsTpl = {
        title: T("TIPS_NOTICE"),
        body: T("TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR")
      };
      notificationList?.push(optionsTpl);
      hasCheckPath = true;
    }
    logger2("error", e);
    _configFilePath = defaultManageConfigPath;
    return _configFilePath;
  }
}
var ansiStyles = { exports: {} };
var colorName;
var hasRequiredColorName;
function requireColorName() {
  if (hasRequiredColorName) return colorName;
  hasRequiredColorName = 1;
  colorName = {
    "aliceblue": [240, 248, 255],
    "antiquewhite": [250, 235, 215],
    "aqua": [0, 255, 255],
    "aquamarine": [127, 255, 212],
    "azure": [240, 255, 255],
    "beige": [245, 245, 220],
    "bisque": [255, 228, 196],
    "black": [0, 0, 0],
    "blanchedalmond": [255, 235, 205],
    "blue": [0, 0, 255],
    "blueviolet": [138, 43, 226],
    "brown": [165, 42, 42],
    "burlywood": [222, 184, 135],
    "cadetblue": [95, 158, 160],
    "chartreuse": [127, 255, 0],
    "chocolate": [210, 105, 30],
    "coral": [255, 127, 80],
    "cornflowerblue": [100, 149, 237],
    "cornsilk": [255, 248, 220],
    "crimson": [220, 20, 60],
    "cyan": [0, 255, 255],
    "darkblue": [0, 0, 139],
    "darkcyan": [0, 139, 139],
    "darkgoldenrod": [184, 134, 11],
    "darkgray": [169, 169, 169],
    "darkgreen": [0, 100, 0],
    "darkgrey": [169, 169, 169],
    "darkkhaki": [189, 183, 107],
    "darkmagenta": [139, 0, 139],
    "darkolivegreen": [85, 107, 47],
    "darkorange": [255, 140, 0],
    "darkorchid": [153, 50, 204],
    "darkred": [139, 0, 0],
    "darksalmon": [233, 150, 122],
    "darkseagreen": [143, 188, 143],
    "darkslateblue": [72, 61, 139],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "darkturquoise": [0, 206, 209],
    "darkviolet": [148, 0, 211],
    "deeppink": [255, 20, 147],
    "deepskyblue": [0, 191, 255],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "dodgerblue": [30, 144, 255],
    "firebrick": [178, 34, 34],
    "floralwhite": [255, 250, 240],
    "forestgreen": [34, 139, 34],
    "fuchsia": [255, 0, 255],
    "gainsboro": [220, 220, 220],
    "ghostwhite": [248, 248, 255],
    "gold": [255, 215, 0],
    "goldenrod": [218, 165, 32],
    "gray": [128, 128, 128],
    "green": [0, 128, 0],
    "greenyellow": [173, 255, 47],
    "grey": [128, 128, 128],
    "honeydew": [240, 255, 240],
    "hotpink": [255, 105, 180],
    "indianred": [205, 92, 92],
    "indigo": [75, 0, 130],
    "ivory": [255, 255, 240],
    "khaki": [240, 230, 140],
    "lavender": [230, 230, 250],
    "lavenderblush": [255, 240, 245],
    "lawngreen": [124, 252, 0],
    "lemonchiffon": [255, 250, 205],
    "lightblue": [173, 216, 230],
    "lightcoral": [240, 128, 128],
    "lightcyan": [224, 255, 255],
    "lightgoldenrodyellow": [250, 250, 210],
    "lightgray": [211, 211, 211],
    "lightgreen": [144, 238, 144],
    "lightgrey": [211, 211, 211],
    "lightpink": [255, 182, 193],
    "lightsalmon": [255, 160, 122],
    "lightseagreen": [32, 178, 170],
    "lightskyblue": [135, 206, 250],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "lightsteelblue": [176, 196, 222],
    "lightyellow": [255, 255, 224],
    "lime": [0, 255, 0],
    "limegreen": [50, 205, 50],
    "linen": [250, 240, 230],
    "magenta": [255, 0, 255],
    "maroon": [128, 0, 0],
    "mediumaquamarine": [102, 205, 170],
    "mediumblue": [0, 0, 205],
    "mediumorchid": [186, 85, 211],
    "mediumpurple": [147, 112, 219],
    "mediumseagreen": [60, 179, 113],
    "mediumslateblue": [123, 104, 238],
    "mediumspringgreen": [0, 250, 154],
    "mediumturquoise": [72, 209, 204],
    "mediumvioletred": [199, 21, 133],
    "midnightblue": [25, 25, 112],
    "mintcream": [245, 255, 250],
    "mistyrose": [255, 228, 225],
    "moccasin": [255, 228, 181],
    "navajowhite": [255, 222, 173],
    "navy": [0, 0, 128],
    "oldlace": [253, 245, 230],
    "olive": [128, 128, 0],
    "olivedrab": [107, 142, 35],
    "orange": [255, 165, 0],
    "orangered": [255, 69, 0],
    "orchid": [218, 112, 214],
    "palegoldenrod": [238, 232, 170],
    "palegreen": [152, 251, 152],
    "paleturquoise": [175, 238, 238],
    "palevioletred": [219, 112, 147],
    "papayawhip": [255, 239, 213],
    "peachpuff": [255, 218, 185],
    "peru": [205, 133, 63],
    "pink": [255, 192, 203],
    "plum": [221, 160, 221],
    "powderblue": [176, 224, 230],
    "purple": [128, 0, 128],
    "rebeccapurple": [102, 51, 153],
    "red": [255, 0, 0],
    "rosybrown": [188, 143, 143],
    "royalblue": [65, 105, 225],
    "saddlebrown": [139, 69, 19],
    "salmon": [250, 128, 114],
    "sandybrown": [244, 164, 96],
    "seagreen": [46, 139, 87],
    "seashell": [255, 245, 238],
    "sienna": [160, 82, 45],
    "silver": [192, 192, 192],
    "skyblue": [135, 206, 235],
    "slateblue": [106, 90, 205],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "snow": [255, 250, 250],
    "springgreen": [0, 255, 127],
    "steelblue": [70, 130, 180],
    "tan": [210, 180, 140],
    "teal": [0, 128, 128],
    "thistle": [216, 191, 216],
    "tomato": [255, 99, 71],
    "turquoise": [64, 224, 208],
    "violet": [238, 130, 238],
    "wheat": [245, 222, 179],
    "white": [255, 255, 255],
    "whitesmoke": [245, 245, 245],
    "yellow": [255, 255, 0],
    "yellowgreen": [154, 205, 50]
  };
  return colorName;
}
var conversions;
var hasRequiredConversions;
function requireConversions() {
  if (hasRequiredConversions) return conversions;
  hasRequiredConversions = 1;
  const cssKeywords = requireColorName();
  const reverseKeywords = {};
  for (const key of Object.keys(cssKeywords)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
  const convert = {
    rgb: { channels: 3, labels: "rgb" },
    hsl: { channels: 3, labels: "hsl" },
    hsv: { channels: 3, labels: "hsv" },
    hwb: { channels: 3, labels: "hwb" },
    cmyk: { channels: 4, labels: "cmyk" },
    xyz: { channels: 3, labels: "xyz" },
    lab: { channels: 3, labels: "lab" },
    lch: { channels: 3, labels: "lch" },
    hex: { channels: 1, labels: ["hex"] },
    keyword: { channels: 1, labels: ["keyword"] },
    ansi16: { channels: 1, labels: ["ansi16"] },
    ansi256: { channels: 1, labels: ["ansi256"] },
    hcg: { channels: 3, labels: ["h", "c", "g"] },
    apple: { channels: 3, labels: ["r16", "g16", "b16"] },
    gray: { channels: 1, labels: ["gray"] }
  };
  conversions = convert;
  for (const model of Object.keys(convert)) {
    if (!("channels" in convert[model])) {
      throw new Error("missing channels property: " + model);
    }
    if (!("labels" in convert[model])) {
      throw new Error("missing channel labels property: " + model);
    }
    if (convert[model].labels.length !== convert[model].channels) {
      throw new Error("channel and label counts mismatch: " + model);
    }
    const { channels, labels } = convert[model];
    delete convert[model].channels;
    delete convert[model].labels;
    Object.defineProperty(convert[model], "channels", { value: channels });
    Object.defineProperty(convert[model], "labels", { value: labels });
  }
  convert.rgb.hsl = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h;
    let s;
    if (max === min) {
      h = 0;
    } else if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else if (b === max) {
      h = 4 + (r - g) / delta;
    }
    h = Math.min(h * 60, 360);
    if (h < 0) {
      h += 360;
    }
    const l = (min + max) / 2;
    if (max === min) {
      s = 0;
    } else if (l <= 0.5) {
      s = delta / (max + min);
    } else {
      s = delta / (2 - max - min);
    }
    return [h, s * 100, l * 100];
  };
  convert.rgb.hsv = function(rgb) {
    let rdif;
    let gdif;
    let bdif;
    let h;
    let s;
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function(c) {
      return (v - c) / 6 / diff + 1 / 2;
    };
    if (diff === 0) {
      h = 0;
      s = 0;
    } else {
      s = diff / v;
      rdif = diffc(r);
      gdif = diffc(g);
      bdif = diffc(b);
      if (r === v) {
        h = bdif - gdif;
      } else if (g === v) {
        h = 1 / 3 + rdif - bdif;
      } else if (b === v) {
        h = 2 / 3 + gdif - rdif;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return [
      h * 360,
      s * 100,
      v * 100
    ];
  };
  convert.rgb.hwb = function(rgb) {
    const r = rgb[0];
    const g = rgb[1];
    let b = rgb[2];
    const h = convert.rgb.hsl(rgb)[0];
    const w = 1 / 255 * Math.min(r, Math.min(g, b));
    b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
    return [h, w * 100, b * 100];
  };
  convert.rgb.cmyk = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const k = Math.min(1 - r, 1 - g, 1 - b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    return [c * 100, m * 100, y * 100, k * 100];
  };
  function comparativeDistance(x, y) {
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
  }
  convert.rgb.keyword = function(rgb) {
    const reversed = reverseKeywords[rgb];
    if (reversed) {
      return reversed;
    }
    let currentClosestDistance = Infinity;
    let currentClosestKeyword;
    for (const keyword of Object.keys(cssKeywords)) {
      const value = cssKeywords[keyword];
      const distance = comparativeDistance(rgb, value);
      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
    return currentClosestKeyword;
  };
  convert.keyword.rgb = function(keyword) {
    return cssKeywords[keyword];
  };
  convert.rgb.xyz = function(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
    g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
    b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return [x * 100, y * 100, z * 100];
  };
  convert.rgb.lab = function(rgb) {
    const xyz = convert.rgb.xyz(rgb);
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.hsl.rgb = function(hsl) {
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    let t2;
    let t3;
    let val;
    if (s === 0) {
      val = l * 255;
      return [val, val, val];
    }
    if (l < 0.5) {
      t2 = l * (1 + s);
    } else {
      t2 = l + s - l * s;
    }
    const t1 = 2 * l - t2;
    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      t3 = h + 1 / 3 * -(i - 1);
      if (t3 < 0) {
        t3++;
      }
      if (t3 > 1) {
        t3--;
      }
      if (6 * t3 < 1) {
        val = t1 + (t2 - t1) * 6 * t3;
      } else if (2 * t3 < 1) {
        val = t2;
      } else if (3 * t3 < 2) {
        val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
      } else {
        val = t1;
      }
      rgb[i] = val * 255;
    }
    return rgb;
  };
  convert.hsl.hsv = function(hsl) {
    const h = hsl[0];
    let s = hsl[1] / 100;
    let l = hsl[2] / 100;
    let smin = s;
    const lmin = Math.max(l, 0.01);
    l *= 2;
    s *= l <= 1 ? l : 2 - l;
    smin *= lmin <= 1 ? lmin : 2 - lmin;
    const v = (l + s) / 2;
    const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
    return [h, sv * 100, v * 100];
  };
  convert.hsv.rgb = function(hsv) {
    const h = hsv[0] / 60;
    const s = hsv[1] / 100;
    let v = hsv[2] / 100;
    const hi = Math.floor(h) % 6;
    const f = h - Math.floor(h);
    const p = 255 * v * (1 - s);
    const q = 255 * v * (1 - s * f);
    const t = 255 * v * (1 - s * (1 - f));
    v *= 255;
    switch (hi) {
      case 0:
        return [v, t, p];
      case 1:
        return [q, v, p];
      case 2:
        return [p, v, t];
      case 3:
        return [p, q, v];
      case 4:
        return [t, p, v];
      case 5:
        return [v, p, q];
    }
  };
  convert.hsv.hsl = function(hsv) {
    const h = hsv[0];
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const vmin = Math.max(v, 0.01);
    let sl;
    let l;
    l = (2 - s) * v;
    const lmin = (2 - s) * vmin;
    sl = s * vmin;
    sl /= lmin <= 1 ? lmin : 2 - lmin;
    sl = sl || 0;
    l /= 2;
    return [h, sl * 100, l * 100];
  };
  convert.hwb.rgb = function(hwb) {
    const h = hwb[0] / 360;
    let wh = hwb[1] / 100;
    let bl = hwb[2] / 100;
    const ratio = wh + bl;
    let f;
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }
    const i = Math.floor(6 * h);
    const v = 1 - bl;
    f = 6 * h - i;
    if ((i & 1) !== 0) {
      f = 1 - f;
    }
    const n = wh + f * (v - wh);
    let r;
    let g;
    let b;
    switch (i) {
      default:
      case 6:
      case 0:
        r = v;
        g = n;
        b = wh;
        break;
      case 1:
        r = n;
        g = v;
        b = wh;
        break;
      case 2:
        r = wh;
        g = v;
        b = n;
        break;
      case 3:
        r = wh;
        g = n;
        b = v;
        break;
      case 4:
        r = n;
        g = wh;
        b = v;
        break;
      case 5:
        r = v;
        g = wh;
        b = n;
        break;
    }
    return [r * 255, g * 255, b * 255];
  };
  convert.cmyk.rgb = function(cmyk) {
    const c = cmyk[0] / 100;
    const m = cmyk[1] / 100;
    const y = cmyk[2] / 100;
    const k = cmyk[3] / 100;
    const r = 1 - Math.min(1, c * (1 - k) + k);
    const g = 1 - Math.min(1, m * (1 - k) + k);
    const b = 1 - Math.min(1, y * (1 - k) + k);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.rgb = function(xyz) {
    const x = xyz[0] / 100;
    const y = xyz[1] / 100;
    const z = xyz[2] / 100;
    let r;
    let g;
    let b;
    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.204 + z * 1.057;
    r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
    g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
    b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    b = Math.min(Math.max(0, b), 1);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.lab = function(xyz) {
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.lab.xyz = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let x;
    let y;
    let z;
    y = (l + 16) / 116;
    x = a / 500 + y;
    z = y - b / 200;
    const y2 = y ** 3;
    const x2 = x ** 3;
    const z2 = z ** 3;
    y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
    x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
    z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
    x *= 95.047;
    y *= 100;
    z *= 108.883;
    return [x, y, z];
  };
  convert.lab.lch = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let h;
    const hr = Math.atan2(b, a);
    h = hr * 360 / 2 / Math.PI;
    if (h < 0) {
      h += 360;
    }
    const c = Math.sqrt(a * a + b * b);
    return [l, c, h];
  };
  convert.lch.lab = function(lch) {
    const l = lch[0];
    const c = lch[1];
    const h = lch[2];
    const hr = h / 360 * 2 * Math.PI;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    return [l, a, b];
  };
  convert.rgb.ansi16 = function(args, saturation = null) {
    const [r, g, b] = args;
    let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
    value = Math.round(value / 50);
    if (value === 0) {
      return 30;
    }
    let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
    if (value === 2) {
      ansi += 60;
    }
    return ansi;
  };
  convert.hsv.ansi16 = function(args) {
    return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
  };
  convert.rgb.ansi256 = function(args) {
    const r = args[0];
    const g = args[1];
    const b = args[2];
    if (r === g && g === b) {
      if (r < 8) {
        return 16;
      }
      if (r > 248) {
        return 231;
      }
      return Math.round((r - 8) / 247 * 24) + 232;
    }
    const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
    return ansi;
  };
  convert.ansi16.rgb = function(args) {
    let color = args % 10;
    if (color === 0 || color === 7) {
      if (args > 50) {
        color += 3.5;
      }
      color = color / 10.5 * 255;
      return [color, color, color];
    }
    const mult = (~~(args > 50) + 1) * 0.5;
    const r = (color & 1) * mult * 255;
    const g = (color >> 1 & 1) * mult * 255;
    const b = (color >> 2 & 1) * mult * 255;
    return [r, g, b];
  };
  convert.ansi256.rgb = function(args) {
    if (args >= 232) {
      const c = (args - 232) * 10 + 8;
      return [c, c, c];
    }
    args -= 16;
    let rem;
    const r = Math.floor(args / 36) / 5 * 255;
    const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
    const b = rem % 6 / 5 * 255;
    return [r, g, b];
  };
  convert.rgb.hex = function(args) {
    const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.hex.rgb = function(args) {
    const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    if (!match) {
      return [0, 0, 0];
    }
    let colorString = match[0];
    if (match[0].length === 3) {
      colorString = colorString.split("").map((char) => {
        return char + char;
      }).join("");
    }
    const integer = parseInt(colorString, 16);
    const r = integer >> 16 & 255;
    const g = integer >> 8 & 255;
    const b = integer & 255;
    return [r, g, b];
  };
  convert.rgb.hcg = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(Math.max(r, g), b);
    const min = Math.min(Math.min(r, g), b);
    const chroma = max - min;
    let grayscale;
    let hue;
    if (chroma < 1) {
      grayscale = min / (1 - chroma);
    } else {
      grayscale = 0;
    }
    if (chroma <= 0) {
      hue = 0;
    } else if (max === r) {
      hue = (g - b) / chroma % 6;
    } else if (max === g) {
      hue = 2 + (b - r) / chroma;
    } else {
      hue = 4 + (r - g) / chroma;
    }
    hue /= 6;
    hue %= 1;
    return [hue * 360, chroma * 100, grayscale * 100];
  };
  convert.hsl.hcg = function(hsl) {
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
    let f = 0;
    if (c < 1) {
      f = (l - 0.5 * c) / (1 - c);
    }
    return [hsl[0], c * 100, f * 100];
  };
  convert.hsv.hcg = function(hsv) {
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const c = s * v;
    let f = 0;
    if (c < 1) {
      f = (v - c) / (1 - c);
    }
    return [hsv[0], c * 100, f * 100];
  };
  convert.hcg.rgb = function(hcg) {
    const h = hcg[0] / 360;
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    if (c === 0) {
      return [g * 255, g * 255, g * 255];
    }
    const pure = [0, 0, 0];
    const hi = h % 1 * 6;
    const v = hi % 1;
    const w = 1 - v;
    let mg = 0;
    switch (Math.floor(hi)) {
      case 0:
        pure[0] = 1;
        pure[1] = v;
        pure[2] = 0;
        break;
      case 1:
        pure[0] = w;
        pure[1] = 1;
        pure[2] = 0;
        break;
      case 2:
        pure[0] = 0;
        pure[1] = 1;
        pure[2] = v;
        break;
      case 3:
        pure[0] = 0;
        pure[1] = w;
        pure[2] = 1;
        break;
      case 4:
        pure[0] = v;
        pure[1] = 0;
        pure[2] = 1;
        break;
      default:
        pure[0] = 1;
        pure[1] = 0;
        pure[2] = w;
    }
    mg = (1 - c) * g;
    return [
      (c * pure[0] + mg) * 255,
      (c * pure[1] + mg) * 255,
      (c * pure[2] + mg) * 255
    ];
  };
  convert.hcg.hsv = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    let f = 0;
    if (v > 0) {
      f = c / v;
    }
    return [hcg[0], f * 100, v * 100];
  };
  convert.hcg.hsl = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const l = g * (1 - c) + 0.5 * c;
    let s = 0;
    if (l > 0 && l < 0.5) {
      s = c / (2 * l);
    } else if (l >= 0.5 && l < 1) {
      s = c / (2 * (1 - l));
    }
    return [hcg[0], s * 100, l * 100];
  };
  convert.hcg.hwb = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    return [hcg[0], (v - c) * 100, (1 - v) * 100];
  };
  convert.hwb.hcg = function(hwb) {
    const w = hwb[1] / 100;
    const b = hwb[2] / 100;
    const v = 1 - b;
    const c = v - w;
    let g = 0;
    if (c < 1) {
      g = (v - c) / (1 - c);
    }
    return [hwb[0], c * 100, g * 100];
  };
  convert.apple.rgb = function(apple) {
    return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
  };
  convert.rgb.apple = function(rgb) {
    return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
  };
  convert.gray.rgb = function(args) {
    return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
  };
  convert.gray.hsl = function(args) {
    return [0, 0, args[0]];
  };
  convert.gray.hsv = convert.gray.hsl;
  convert.gray.hwb = function(gray) {
    return [0, 100, gray[0]];
  };
  convert.gray.cmyk = function(gray) {
    return [0, 0, 0, gray[0]];
  };
  convert.gray.lab = function(gray) {
    return [gray[0], 0, 0];
  };
  convert.gray.hex = function(gray) {
    const val = Math.round(gray[0] / 100 * 255) & 255;
    const integer = (val << 16) + (val << 8) + val;
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.rgb.gray = function(rgb) {
    const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return [val / 255 * 100];
  };
  return conversions;
}
var route;
var hasRequiredRoute;
function requireRoute() {
  if (hasRequiredRoute) return route;
  hasRequiredRoute = 1;
  const conversions2 = requireConversions();
  function buildGraph() {
    const graph = {};
    const models = Object.keys(conversions2);
    for (let len = models.length, i = 0; i < len; i++) {
      graph[models[i]] = {
        // http://jsperf.com/1-vs-infinity
        // micro-opt, but this is simple.
        distance: -1,
        parent: null
      };
    }
    return graph;
  }
  function deriveBFS(fromModel) {
    const graph = buildGraph();
    const queue = [fromModel];
    graph[fromModel].distance = 0;
    while (queue.length) {
      const current = queue.pop();
      const adjacents = Object.keys(conversions2[current]);
      for (let len = adjacents.length, i = 0; i < len; i++) {
        const adjacent = adjacents[i];
        const node = graph[adjacent];
        if (node.distance === -1) {
          node.distance = graph[current].distance + 1;
          node.parent = current;
          queue.unshift(adjacent);
        }
      }
    }
    return graph;
  }
  function link(from, to) {
    return function(args) {
      return to(from(args));
    };
  }
  function wrapConversion(toModel, graph) {
    const path2 = [graph[toModel].parent, toModel];
    let fn = conversions2[graph[toModel].parent][toModel];
    let cur = graph[toModel].parent;
    while (graph[cur].parent) {
      path2.unshift(graph[cur].parent);
      fn = link(conversions2[graph[cur].parent][cur], fn);
      cur = graph[cur].parent;
    }
    fn.conversion = path2;
    return fn;
  }
  route = function(fromModel) {
    const graph = deriveBFS(fromModel);
    const conversion = {};
    const models = Object.keys(graph);
    for (let len = models.length, i = 0; i < len; i++) {
      const toModel = models[i];
      const node = graph[toModel];
      if (node.parent === null) {
        continue;
      }
      conversion[toModel] = wrapConversion(toModel, graph);
    }
    return conversion;
  };
  return route;
}
var colorConvert;
var hasRequiredColorConvert;
function requireColorConvert() {
  if (hasRequiredColorConvert) return colorConvert;
  hasRequiredColorConvert = 1;
  const conversions2 = requireConversions();
  const route2 = requireRoute();
  const convert = {};
  const models = Object.keys(conversions2);
  function wrapRaw(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === void 0 || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      return fn(args);
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  function wrapRounded(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === void 0 || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      const result = fn(args);
      if (typeof result === "object") {
        for (let len = result.length, i = 0; i < len; i++) {
          result[i] = Math.round(result[i]);
        }
      }
      return result;
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  models.forEach((fromModel) => {
    convert[fromModel] = {};
    Object.defineProperty(convert[fromModel], "channels", { value: conversions2[fromModel].channels });
    Object.defineProperty(convert[fromModel], "labels", { value: conversions2[fromModel].labels });
    const routes2 = route2(fromModel);
    const routeModels = Object.keys(routes2);
    routeModels.forEach((toModel) => {
      const fn = routes2[toModel];
      convert[fromModel][toModel] = wrapRounded(fn);
      convert[fromModel][toModel].raw = wrapRaw(fn);
    });
  });
  colorConvert = convert;
  return colorConvert;
}
ansiStyles.exports;
var hasRequiredAnsiStyles;
function requireAnsiStyles() {
  if (hasRequiredAnsiStyles) return ansiStyles.exports;
  hasRequiredAnsiStyles = 1;
  (function(module) {
    const wrapAnsi16 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `\x1B[${code + offset}m`;
    };
    const wrapAnsi256 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `\x1B[${38 + offset};5;${code}m`;
    };
    const wrapAnsi16m = (fn, offset) => (...args) => {
      const rgb = fn(...args);
      return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    };
    const ansi2ansi = (n) => n;
    const rgb2rgb = (r, g, b) => [r, g, b];
    const setLazyProperty = (object, property, get2) => {
      Object.defineProperty(object, property, {
        get: () => {
          const value = get2();
          Object.defineProperty(object, property, {
            value,
            enumerable: true,
            configurable: true
          });
          return value;
        },
        enumerable: true,
        configurable: true
      });
    };
    let colorConvert2;
    const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
      if (colorConvert2 === void 0) {
        colorConvert2 = requireColorConvert();
      }
      const offset = isBackground ? 10 : 0;
      const styles = {};
      for (const [sourceSpace, suite] of Object.entries(colorConvert2)) {
        const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
        if (sourceSpace === targetSpace) {
          styles[name] = wrap(identity, offset);
        } else if (typeof suite === "object") {
          styles[name] = wrap(suite[targetSpace], offset);
        }
      }
      return styles;
    };
    function assembleStyles() {
      const codes = /* @__PURE__ */ new Map();
      const styles = {
        modifier: {
          reset: [0, 0],
          // 21 isn't widely supported and 22 does the same thing
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          // Bright color
          blackBright: [90, 39],
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          // Bright color
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles.color.gray = styles.color.blackBright;
      styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
      styles.color.grey = styles.color.blackBright;
      styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
      for (const [groupName, group] of Object.entries(styles)) {
        for (const [styleName, style] of Object.entries(group)) {
          styles[styleName] = {
            open: `\x1B[${style[0]}m`,
            close: `\x1B[${style[1]}m`
          };
          group[styleName] = styles[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
          value: group,
          enumerable: false
        });
      }
      Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false
      });
      styles.color.close = "\x1B[39m";
      styles.bgColor.close = "\x1B[49m";
      setLazyProperty(styles.color, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, false));
      setLazyProperty(styles.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, true));
      return styles;
    }
    Object.defineProperty(module, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  })(ansiStyles);
  return ansiStyles.exports;
}
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os2 = require$$0;
  const tty = require$$1;
  const hasFlag2 = requireHasFlag();
  const { env } = process;
  let forceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    forceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
      return 3;
    }
    if (hasFlag2("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os2.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version2 = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version2 >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
  return supportsColor_1;
}
var util;
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1;
  const stringReplaceAll = (string, substring, replacer) => {
    let index = string.indexOf(substring);
    if (index === -1) {
      return string;
    }
    const substringLength = substring.length;
    let endIndex = 0;
    let returnValue = "";
    do {
      returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
      endIndex = index + substringLength;
      index = string.indexOf(substring, endIndex);
    } while (index !== -1);
    returnValue += string.substr(endIndex);
    return returnValue;
  };
  const stringEncaseCRLFWithFirstIndex = (string, prefix, postfix, index) => {
    let endIndex = 0;
    let returnValue = "";
    do {
      const gotCR = string[index - 1] === "\r";
      returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
      endIndex = index + 1;
      index = string.indexOf("\n", endIndex);
    } while (index !== -1);
    returnValue += string.substr(endIndex);
    return returnValue;
  };
  util = {
    stringReplaceAll,
    stringEncaseCRLFWithFirstIndex
  };
  return util;
}
var templates;
var hasRequiredTemplates;
function requireTemplates() {
  if (hasRequiredTemplates) return templates;
  hasRequiredTemplates = 1;
  const TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
  const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
  const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
  const ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;
  const ESCAPES = /* @__PURE__ */ new Map([
    ["n", "\n"],
    ["r", "\r"],
    ["t", "	"],
    ["b", "\b"],
    ["f", "\f"],
    ["v", "\v"],
    ["0", "\0"],
    ["\\", "\\"],
    ["e", "\x1B"],
    ["a", "\x07"]
  ]);
  function unescape(c) {
    const u = c[0] === "u";
    const bracket = c[1] === "{";
    if (u && !bracket && c.length === 5 || c[0] === "x" && c.length === 3) {
      return String.fromCharCode(parseInt(c.slice(1), 16));
    }
    if (u && bracket) {
      return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
    }
    return ESCAPES.get(c) || c;
  }
  function parseArguments(name, arguments_) {
    const results = [];
    const chunks = arguments_.trim().split(/\s*,\s*/g);
    let matches;
    for (const chunk of chunks) {
      const number = Number(chunk);
      if (!Number.isNaN(number)) {
        results.push(number);
      } else if (matches = chunk.match(STRING_REGEX)) {
        results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
      } else {
        throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
      }
    }
    return results;
  }
  function parseStyle(style) {
    STYLE_REGEX.lastIndex = 0;
    const results = [];
    let matches;
    while ((matches = STYLE_REGEX.exec(style)) !== null) {
      const name = matches[1];
      if (matches[2]) {
        const args = parseArguments(name, matches[2]);
        results.push([name].concat(args));
      } else {
        results.push([name]);
      }
    }
    return results;
  }
  function buildStyle(chalk2, styles) {
    const enabled = {};
    for (const layer of styles) {
      for (const style of layer.styles) {
        enabled[style[0]] = layer.inverse ? null : style.slice(1);
      }
    }
    let current = chalk2;
    for (const [styleName, styles2] of Object.entries(enabled)) {
      if (!Array.isArray(styles2)) {
        continue;
      }
      if (!(styleName in current)) {
        throw new Error(`Unknown Chalk style: ${styleName}`);
      }
      current = styles2.length > 0 ? current[styleName](...styles2) : current[styleName];
    }
    return current;
  }
  templates = (chalk2, temporary) => {
    const styles = [];
    const chunks = [];
    let chunk = [];
    temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
      if (escapeCharacter) {
        chunk.push(unescape(escapeCharacter));
      } else if (style) {
        const string = chunk.join("");
        chunk = [];
        chunks.push(styles.length === 0 ? string : buildStyle(chalk2, styles)(string));
        styles.push({ inverse, styles: parseStyle(style) });
      } else if (close) {
        if (styles.length === 0) {
          throw new Error("Found extraneous } in Chalk template literal");
        }
        chunks.push(buildStyle(chalk2, styles)(chunk.join("")));
        chunk = [];
        styles.pop();
      } else {
        chunk.push(character);
      }
    });
    chunks.push(chunk.join(""));
    if (styles.length > 0) {
      const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? "" : "s"} (\`}\`)`;
      throw new Error(errMessage);
    }
    return chunks.join("");
  };
  return templates;
}
var source;
var hasRequiredSource;
function requireSource() {
  if (hasRequiredSource) return source;
  hasRequiredSource = 1;
  const ansiStyles2 = requireAnsiStyles();
  const { stdout: stdoutColor, stderr: stderrColor } = requireSupportsColor();
  const {
    stringReplaceAll,
    stringEncaseCRLFWithFirstIndex
  } = requireUtil();
  const { isArray } = Array;
  const levelMapping = [
    "ansi",
    "ansi",
    "ansi256",
    "ansi16m"
  ];
  const styles = /* @__PURE__ */ Object.create(null);
  const applyOptions = (object, options = {}) => {
    if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
      throw new Error("The `level` option should be an integer from 0 to 3");
    }
    const colorLevel = stdoutColor ? stdoutColor.level : 0;
    object.level = options.level === void 0 ? colorLevel : options.level;
  };
  class ChalkClass {
    constructor(options) {
      return chalkFactory(options);
    }
  }
  const chalkFactory = (options) => {
    const chalk3 = {};
    applyOptions(chalk3, options);
    chalk3.template = (...arguments_) => chalkTag(chalk3.template, ...arguments_);
    Object.setPrototypeOf(chalk3, Chalk.prototype);
    Object.setPrototypeOf(chalk3.template, chalk3);
    chalk3.template.constructor = () => {
      throw new Error("`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.");
    };
    chalk3.template.Instance = ChalkClass;
    return chalk3.template;
  };
  function Chalk(options) {
    return chalkFactory(options);
  }
  for (const [styleName, style] of Object.entries(ansiStyles2)) {
    styles[styleName] = {
      get() {
        const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
        Object.defineProperty(this, styleName, { value: builder });
        return builder;
      }
    };
  }
  styles.visible = {
    get() {
      const builder = createBuilder(this, this._styler, true);
      Object.defineProperty(this, "visible", { value: builder });
      return builder;
    }
  };
  const usedModels = ["rgb", "hex", "keyword", "hsl", "hsv", "hwb", "ansi", "ansi256"];
  for (const model of usedModels) {
    styles[model] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(ansiStyles2.color[levelMapping[level]][model](...arguments_), ansiStyles2.color.close, this._styler);
          return createBuilder(this, styler, this._isEmpty);
        };
      }
    };
  }
  for (const model of usedModels) {
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles[bgModel] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(ansiStyles2.bgColor[levelMapping[level]][model](...arguments_), ansiStyles2.bgColor.close, this._styler);
          return createBuilder(this, styler, this._isEmpty);
        };
      }
    };
  }
  const proto = Object.defineProperties(() => {
  }, {
    ...styles,
    level: {
      enumerable: true,
      get() {
        return this._generator.level;
      },
      set(level) {
        this._generator.level = level;
      }
    }
  });
  const createStyler = (open, close, parent) => {
    let openAll;
    let closeAll;
    if (parent === void 0) {
      openAll = open;
      closeAll = close;
    } else {
      openAll = parent.openAll + open;
      closeAll = close + parent.closeAll;
    }
    return {
      open,
      close,
      openAll,
      closeAll,
      parent
    };
  };
  const createBuilder = (self, _styler, _isEmpty) => {
    const builder = (...arguments_) => {
      if (isArray(arguments_[0]) && isArray(arguments_[0].raw)) {
        return applyStyle(builder, chalkTag(builder, ...arguments_));
      }
      return applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
    };
    Object.setPrototypeOf(builder, proto);
    builder._generator = self;
    builder._styler = _styler;
    builder._isEmpty = _isEmpty;
    return builder;
  };
  const applyStyle = (self, string) => {
    if (self.level <= 0 || !string) {
      return self._isEmpty ? "" : string;
    }
    let styler = self._styler;
    if (styler === void 0) {
      return string;
    }
    const { openAll, closeAll } = styler;
    if (string.indexOf("\x1B") !== -1) {
      while (styler !== void 0) {
        string = stringReplaceAll(string, styler.close, styler.open);
        styler = styler.parent;
      }
    }
    const lfIndex = string.indexOf("\n");
    if (lfIndex !== -1) {
      string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
    }
    return openAll + string + closeAll;
  };
  let template;
  const chalkTag = (chalk3, ...strings) => {
    const [firstString] = strings;
    if (!isArray(firstString) || !isArray(firstString.raw)) {
      return strings.join(" ");
    }
    const arguments_ = strings.slice(1);
    const parts = [firstString.raw[0]];
    for (let i = 1; i < firstString.length; i++) {
      parts.push(
        String(arguments_[i - 1]).replace(/[{}\\]/g, "\\$&"),
        String(firstString.raw[i])
      );
    }
    if (template === void 0) {
      template = requireTemplates();
    }
    return template(chalk3, parts.join(""));
  };
  Object.defineProperties(Chalk.prototype, styles);
  const chalk2 = Chalk();
  chalk2.supportsColor = stdoutColor;
  chalk2.stderr = Chalk({ level: stderrColor ? stderrColor.level : 0 });
  chalk2.stderr.supportsColor = stderrColor;
  source = chalk2;
  return source;
}
var sourceExports = requireSource();
const chalk = /* @__PURE__ */ getDefaultExportFromCjs(sourceExports);
class ManageLogger {
  #level = {
    [ILogType.success]: "green",
    [ILogType.info]: "blue",
    [ILogType.warn]: "yellow",
    [ILogType.error]: "red"
  };
  #ctx;
  #logLevel;
  #logPath;
  constructor(ctx) {
    this.#ctx = ctx;
  }
  #handleLog(type, ...msg) {
    const logHeader = chalk[this.#level[type]](`[PicList ${type.toUpperCase()}]`);
    console.log(logHeader, ...msg);
    this.#logLevel = this.#ctx.getConfig(configPaths.settings.logLevel);
    this.#logPath = this.#ctx.getConfig(configPaths.settings.logPath) || path.join(this.#ctx.baseDir, "./manage.log");
    setTimeout(() => {
      try {
        const result = this.#checkLogFileIsLarge(this.#logPath);
        if (result.isLarge) {
          const warningMsg = `Log file is too large (> ${result.logFileSizeLimit / 1024 / 1024 || "10"} MB), recreate log file`;
          console.log(chalk.yellow("[PicList WARN]:"), warningMsg);
          this.#recreateLogFile(this.#logPath);
          msg.unshift(warningMsg);
        }
        this.#handleWriteLog(this.#logPath, type, ...msg);
      } catch (e) {
        console.error("[PicList Error] on checking log file size", e);
      }
    }, 0);
  }
  #checkLogFileIsLarge(logPath) {
    if (fs.existsSync(logPath)) {
      const logFileSize = fs.statSync(logPath).size;
      const logFileSizeLimit = enforceNumber(this.#ctx.getConfig(configPaths.settings.logFileSizeLimit) || 10) * 1024 * 1024;
      return {
        isLarge: logFileSize > logFileSizeLimit,
        logFileSize,
        logFileSizeLimit
      };
    }
    fs.ensureFileSync(logPath);
    return {
      isLarge: false
    };
  }
  #recreateLogFile(logPath) {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
      fs.createFileSync(logPath);
    }
  }
  #handleWriteLog(logPath, type, ...msg) {
    try {
      if (this.#checkLogLevel(type, this.#logLevel)) {
        let log = `${dayjs().format("YYYY-MM-DD HH:mm:ss")} [PicList ${type.toUpperCase()}] `;
        msg.forEach((item) => {
          log += this.#formatLogItem(item, type);
        });
        log += "\n";
        fs.appendFileSync(logPath, log);
      }
    } catch (e) {
      console.error("[PicList Error] on writing log file", e);
    }
  }
  #formatLogItem(item, type) {
    let result = "";
    if (item instanceof Error && type === "error") {
      result += `
------Error Stack Begin------
${util$1.format(item?.stack)}
-------Error Stack End------- `;
    } else {
      if (typeof item === "object") {
        if (item?.stack) {
          result += `
------Error Stack Begin------
${util$1.format(item.stack)}
-------Error Stack End------- `;
        }
        item = JSON.stringify(item, (key, value) => key === "stack" ? void 0 : value, 2);
      }
      result += `${item} `;
    }
    return result;
  }
  #checkLogLevel(type, level) {
    if (level === void 0 || level === "all") {
      return true;
    }
    if (Array.isArray(level)) {
      return level.some((item) => item === type || item === "all");
    }
    return type === level;
  }
  success(...msq) {
    return this.#handleLog(ILogType.success, ...msq);
  }
  info(...msq) {
    return this.#handleLog(ILogType.info, ...msq);
  }
  error(...msq) {
    return this.#handleLog(ILogType.error, ...msq);
  }
  warn(...msq) {
    return this.#handleLog(ILogType.warn, ...msq);
  }
  debug(...msq) {
    if (process.env.NODE_ENV === "development") {
      this.#handleLog(ILogType.info, ...msq);
    }
  }
}
class ManageApi extends EventEmitter {
  _config;
  db;
  currentPicBed;
  configPath;
  baseDir;
  logger;
  currentPicBedConfig;
  constructor(currentPicBed = "") {
    super();
    this.currentPicBed = currentPicBed || "placeholder";
    this.configPath = managePathChecker();
    this.initConfigPath();
    this.logger = new ManageLogger(this);
    this.initconfig();
    this.currentPicBedConfig = this.getPicBedConfig(this.currentPicBed);
  }
  getMsgParam(method) {
    return {
      class: "ManageApi",
      method,
      picbedName: this.currentPicBedConfig.picBedName
    };
  }
  errorMsg(err, param) {
    this.logger.error(formatError(err, param));
  }
  createClient() {
    const name = this.currentPicBedConfig.picBedName;
    switch (name) {
      case "aliyun":
        return new API.AliyunApi(
          this.currentPicBedConfig.accessKeyId,
          this.currentPicBedConfig.accessKeySecret,
          this.logger
        );
      case "github":
        return new API.GithubApi(
          this.currentPicBedConfig.token,
          this.currentPicBedConfig.githubUsername,
          this.currentPicBedConfig.proxy,
          this.logger
        );
      case "imgur":
        return new API.ImgurApi(
          this.currentPicBedConfig.imgurUserName,
          this.currentPicBedConfig.accessToken,
          this.currentPicBedConfig.proxy,
          this.logger
        );
      case "local":
        return new API.LocalApi(this.logger);
      case "qiniu":
        return new API.QiniuApi(this.currentPicBedConfig.accessKey, this.currentPicBedConfig.secretKey, this.logger);
      case "smms":
        return new API.SmmsApi(this.currentPicBedConfig.token, this.logger);
      case "s3plist":
        return new API.S3plistApi(
          this.currentPicBedConfig.accessKeyId,
          this.currentPicBedConfig.secretAccessKey,
          this.currentPicBedConfig.endpoint,
          this.currentPicBedConfig.sslEnabled,
          this.currentPicBedConfig.s3ForcePathStyle,
          this.currentPicBedConfig.proxy,
          this.logger,
          this.currentPicBedConfig.dogeCloudSupport || false,
          this.currentPicBedConfig.bucketName || ""
        );
      case "sftp":
        return new API.SftpApi(
          this.currentPicBedConfig.host,
          this.currentPicBedConfig.port,
          this.currentPicBedConfig.username,
          this.currentPicBedConfig.password,
          this.currentPicBedConfig.privateKey,
          this.currentPicBedConfig.passphrase,
          this.currentPicBedConfig.fileMode,
          this.currentPicBedConfig.dirMode,
          this.logger
        );
      case "tcyun":
        return new API.TcyunApi(this.currentPicBedConfig.secretId, this.currentPicBedConfig.secretKey, this.logger);
      case "upyun":
        return new API.UpyunApi(
          this.currentPicBedConfig.bucketName,
          this.currentPicBedConfig.operator,
          this.currentPicBedConfig.password,
          this.logger,
          this.currentPicBedConfig.antiLeechToken,
          this.currentPicBedConfig.expireTime
        );
      case "webdavplist":
        return new API.WebdavplistApi(
          this.currentPicBedConfig.endpoint,
          this.currentPicBedConfig.username,
          this.currentPicBedConfig.password,
          this.currentPicBedConfig.sslEnabled,
          this.currentPicBedConfig.proxy,
          this.currentPicBedConfig.authType,
          this.logger
        );
      default:
        return {};
    }
  }
  getPicBedConfig(picBedName) {
    return this.getConfig(`picBed.${picBedName}`);
  }
  initConfigPath() {
    if (this.configPath === "") {
      this.configPath = `${homedir()}/.piclist/manage.json`;
    }
    if (path.extname(this.configPath).toUpperCase() !== ".JSON") {
      this.configPath = "";
      throw Error("The configuration file only supports JSON format.");
    }
    this.baseDir = path.dirname(this.configPath);
    const exist = fs.pathExistsSync(this.configPath);
    if (!exist) {
      fs.ensureFileSync(this.configPath);
    }
  }
  initconfig() {
    this.db = new ManageDB(this);
    this._config = this.db.read(true);
  }
  getConfig(name) {
    if (!name) {
      return this._config;
    }
    return get(this._config, name);
  }
  saveConfig(config) {
    if (!isInputConfigValid(config)) {
      this.logger.warn("the format of config is invalid, please provide object");
      return;
    }
    this.setConfig(config);
    this.db.saveConfig(config);
  }
  removeConfig(key, propName) {
    if (!key || !propName) {
      return;
    }
    this.unsetConfig(key, propName);
    this.db.unset(key, propName);
  }
  setConfig(config) {
    if (!isInputConfigValid(config)) {
      this.logger.warn("the format of config is invalid, please provide object");
      return;
    }
    Object.keys(config).forEach((name) => {
      set(this._config, name, config[name]);
    });
  }
  unsetConfig(key, propName) {
    if (!key || !propName) return;
    unset(this.getConfig(key), propName);
  }
  async getBucketList(param) {
    let client;
    const name = this.currentPicBedConfig.picBedName.replace("plist", "");
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "github":
      case "imgur":
      case "s3plist":
        try {
          client = this.createClient();
          return await client.getBucketList();
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getBucketList"));
          return [];
        }
      case "upyun":
        return [
          {
            Name: this.currentPicBedConfig.bucketName,
            Location: "upyun",
            CreationDate: (/* @__PURE__ */ new Date()).toISOString()
          }
        ];
      case "smms":
      case "webdavplist":
      case "local":
      case "sftp":
        return [
          {
            Name: name,
            Location: name,
            CreationDate: (/* @__PURE__ */ new Date()).toISOString()
          }
        ];
      default:
        console.log(param);
        return [];
    }
  }
  async getBucketInfo(param) {
    console.log(param);
    return {};
  }
  async getBucketDomain(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "github":
        try {
          client = this.createClient();
          return await client.getBucketDomain(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getBucketDomain"));
          return [];
        }
      case "upyun":
        return [this.currentPicBedConfig.customUrl];
      case "smms":
        return ["https://smms.app"];
      case "imgur":
        return ["https://imgur.com"];
      default:
        return [];
    }
  }
  async createBucket(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "s3plist":
        try {
          client = this.createClient();
          return await client.createBucket(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("createBucket"));
          return false;
        }
      default:
        return false;
    }
  }
  async deleteBucket(param) {
    console.log(param);
    return false;
  }
  async getOperatorList(param) {
    console.log(param);
    return [];
  }
  async addOperator(param) {
    console.log(param);
    return false;
  }
  async deleteOperator(param) {
    console.log(param);
    return false;
  }
  async getBucketAclPolicy(param) {
    console.log(param);
    return {};
  }
  async setBucketAclPolicy(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "qiniu":
        try {
          client = new API.QiniuApi(this.currentPicBedConfig.accessKey, this.currentPicBedConfig.secretKey, this.logger);
          return await client.setBucketAclPolicy(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("setBucketAclPolicy"));
          return false;
        }
      default:
        return false;
    }
  }
  async getBucketListRecursively(param) {
    let client;
    let window2;
    const defaultResult = {
      fullList: [],
      success: false,
      finished: true
    };
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "github":
      case "imgur":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.getBucketListRecursively(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getBucketListRecursively"));
          window2 = windowManager.get(IWindowList.SETTING_WINDOW);
          window2.webContents.send(refreshDownloadFileTransferList, defaultResult);
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
          return {};
        }
      default:
        window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send(refreshDownloadFileTransferList, defaultResult);
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList);
        return {};
    }
  }
  /**
   * 后台更新bucket文件列表
   * @param param
   * @returns
   */
  async getBucketListBackstage(param) {
    let client;
    let window2;
    const defaultResult = {
      fullList: [],
      success: false,
      finished: true
    };
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "github":
      case "imgur":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.getBucketListBackstage(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getBucketListBackstage"));
          window2 = windowManager.get(IWindowList.SETTING_WINDOW);
          window2.webContents.send("refreshFileTransferList", defaultResult);
          ipcMain.removeAllListeners("cancelLoadingFileList");
          return {};
        }
      default:
        window2 = windowManager.get(IWindowList.SETTING_WINDOW);
        window2.webContents.send("refreshFileTransferList", defaultResult);
        ipcMain.removeAllListeners("cancelLoadingFileList");
        return {};
    }
  }
  /**
   * 获取文件夹列表
   * 结果统一进行格式化 文件夹提取到最前
   * key: 完整路径
   * fileName: 文件名
   * formatedTime: 格式化时间
   * isDir: 是否是文件夹
   * fileSize: 文件大小
   **/
  async getBucketFileList(param) {
    const defaultResponse = {
      fullList: [],
      isTruncated: false,
      nextMarker: "",
      success: false
    };
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "s3plist":
        try {
          client = this.createClient();
          return await client.getBucketFileList(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getBucketFileList"));
          return defaultResponse;
        }
      default:
        return defaultResponse;
    }
  }
  async deleteBucketFile(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "github":
      case "imgur":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          const res = await client.deleteBucketFile(param);
          return res;
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("deleteBucketFile"));
          return false;
        }
      default:
        return false;
    }
  }
  async deleteBucketFolder(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "github":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.deleteBucketFolder(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("deleteBucketFolder"));
          return false;
        }
      default:
        return false;
    }
  }
  async renameBucketFile(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.renameBucketFile(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("renameBucketFile"));
          return false;
        }
      default:
        return false;
    }
  }
  async downloadBucketFile(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "github":
      case "imgur":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          const res = await client.downloadBucketFile(param);
          return res;
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("downloadBucketFile"));
          return false;
        }
      default:
        return false;
    }
  }
  async copyMoveBucketFile(param) {
    console.log(param);
    return false;
  }
  async createBucketFolder(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "github":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.createBucketFolder(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("createBucketFolder"));
          return false;
        }
      default:
        return false;
    }
  }
  async uploadBucketFile(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "upyun":
      case "smms":
      case "github":
      case "imgur":
      case "s3plist":
      case "webdavplist":
      case "local":
      case "sftp":
        try {
          client = this.createClient();
          return await client.uploadBucketFile(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("uploadBucketFile"));
          return false;
        }
      default:
        return false;
    }
  }
  async getPreSignedUrl(param) {
    let client;
    switch (this.currentPicBedConfig.picBedName) {
      case "tcyun":
      case "aliyun":
      case "qiniu":
      case "github":
      case "s3plist":
      case "webdavplist":
        try {
          client = this.createClient();
          return await client.getPreSignedUrl(param);
        } catch (error) {
          this.errorMsg(error, this.getMsgParam("getPreSignedUrl"));
          return "error";
        }
      default:
        return "error";
    }
  }
}
const bucketRoutes = [
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getBucketList();
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getBucketListBackstage(args[1]);
    }
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getBucketListRecursively(args[1]);
    }
  },
  {
    action: IRPCActionType.MANAGE_CREATE_BUCKET,
    handler: async (_, args) => {
      return new ManageApi(args[0]).createBucket(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getBucketFileList(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_DOMAIN,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getBucketDomain(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_SET_BUCKET_ACL_POLICY,
    handler: async (_, args) => {
      return new ManageApi(args[0]).setBucketAclPolicy(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_RENAME_BUCKET_FILE,
    handler: async (_, args) => {
      return new ManageApi(args[0]).renameBucketFile(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_DELETE_BUCKET_FILE,
    handler: async (_, args) => {
      return new ManageApi(args[0]).deleteBucketFile(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER,
    handler: async (_, args) => {
      return new ManageApi(args[0]).deleteBucketFolder(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
    handler: async (_, args) => {
      return new ManageApi(args[0]).getPreSignedUrl(args[1]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE,
    handler: async (_, args) => {
      return new ManageApi(args[0]).uploadBucketFile(args[1]);
    }
  },
  {
    action: IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE,
    handler: async (_, args) => {
      return new ManageApi(args[0]).downloadBucketFile(args[1]);
    }
  },
  {
    action: IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER,
    handler: async (_, args) => {
      return new ManageApi(args[0]).createBucketFolder(args[1]);
    },
    type: IRPCType.INVOKE
  }
];
manageDbChecker();
const getManageApi = (picBedName = "placeholder") => {
  return new ManageApi(picBedName);
};
const manageApi = getManageApi();
const configRoutes = [
  {
    action: IRPCActionType.MANAGE_GET_CONFIG,
    handler: async (_, args) => {
      return manageApi.getConfig(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_SAVE_CONFIG,
    handler: async (_, args) => {
      manageApi.saveConfig(args[0]);
    }
  },
  {
    action: IRPCActionType.MANAGE_REMOVE_CONFIG,
    handler: async (_, args) => {
      manageApi.removeConfig(args[0], args[1]);
    }
  }
];
const upDownLoadRoutes = [
  {
    action: IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG,
    handler: async () => {
      const res = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"]
      });
      return res.canceled ? [] : res.filePaths;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllUploadTask();
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllDownloadTask();
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_DELETE_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeUploadedTask();
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearUploadTaskQueue();
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeDownloadedTask();
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearDownloadTaskQueue();
    }
  },
  {
    action: IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER,
    handler: async () => {
      const res = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });
      return res.filePaths[0];
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
    handler: async () => {
      return app.getPath("downloads");
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER,
    handler: async (_, args) => {
      const path2 = args[0];
      if (path2) {
        shell.showItemInFolder(path2);
      } else {
        shell.openPath(app.getPath("downloads"));
      }
    }
  },
  {
    action: IRPCActionType.MANAGE_OPEN_LOCAL_FILE,
    handler: async (_, args) => {
      const fullPath = args[0];
      fs.existsSync(fullPath) ? shell.showItemInFolder(fullPath) : shell.openPath(path.dirname(fullPath));
    }
  },
  {
    action: IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL,
    handler: async (_, args) => {
      return await downloadFileFromUrl(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64,
    handler: async (_, args) => {
      return fs.readFileSync(args[0], "base64");
    },
    type: IRPCType.INVOKE
  }
];
const manageRouter = new RPCRouter();
const manageRoutes = [...configRoutes, ...bucketRoutes, ...upDownLoadRoutes];
manageRouter.addBatch(manageRoutes);
const picbedRouter = new RPCRouter();
const handleConfigWithFunction = (config) => {
  for (const i in config) {
    if (typeof config[i].default === "function") {
      config[i].default = config[i].default();
    }
    if (typeof config[i].choices === "function") {
      config[i].choices = config[i].choices();
    }
  }
  return config;
};
const picbedRoutes = [
  {
    action: IRPCActionType.PICBED_GET_CONFIG_LIST,
    handler: async (_, args) => {
      const config = getUploaderConfigList(args[0]);
      return config;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.PICBED_DELETE_CONFIG,
    handler: async (_, args) => {
      const [type, id] = args;
      const config = deleteUploaderConfig(type, id);
      return config;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_SELECT,
    handler: async (_, args) => {
      const [type, id] = args;
      selectUploaderConfig(type, id);
      return true;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_UPDATE_CONFIG,
    handler: async (_, args) => {
      const [type, id, config] = args;
      updateUploaderConfig(type, id, config);
      return true;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_RESET_CONFIG,
    handler: async (_, args) => {
      const [type, id] = args;
      resetUploaderConfig(type, id);
      return true;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.PICBED_GET_PICBED_CONFIG,
    handler: async (_, args) => {
      const type = args[0];
      const name = picgo.helper.uploader.get(type)?.name || type;
      if (picgo.helper.uploader.get(type)?.config) {
        const _config = picgo.helper.uploader.get(type).config(picgo);
        const config = handleConfigWithFunction(_config);
        return {
          config,
          name
        };
      } else {
        return {
          config: [],
          name
        };
      }
    },
    type: IRPCType.INVOKE
  }
];
picbedRouter.addBatch(picbedRoutes);
const pluginRouter = new RPCRouter();
const pluginRoutes = [
  {
    action: IRPCActionType.PLUGIN_GET_LIST,
    handler: pluginGetListFunc
  },
  {
    action: IRPCActionType.PLUGIN_INSTALL,
    handler: pluginInstallFunc
  },
  {
    action: IRPCActionType.PLUGIN_IMPORT_LOCAL,
    handler: pluginImportLocalFunc
  },
  {
    action: IRPCActionType.PLUGIN_UPDATE_ALL,
    handler: pluginUpdateAllFunc
  }
];
pluginRouter.addBatch(pluginRoutes);
const markdownContent = `
## 内置Server的使用

PicList内置了一个小型的服务器，用于接收来自其他应用或其他主机的HTTP请求来上传图片。

默认监听地址：\`0.0.0.0\`，默认监听端口：\`36677\`

### 接口鉴权

当将接口暴露于公网时，为了防止恶意上传，PicList提供了接口鉴权功能。

![202310102349225](https://assets.piclist.cn/image/202310102349225.webp)

发送请求时添加URL查询参数\`key\`即可，例如：\`http://xxx:36677/upload?key=xxx\`。

### 表单上传

- 请求方法: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- 请求body: \`multipart/form-data\`格式，key任选，value为图片文件

即可上传。

### HTTP调用上传剪贴板图片

- 请求方法: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- 请求body: \`{list: ['xxx.jpg']}\` 必须是JSON格式

即可上传。

### configName和picbed参数

PicList支持通过设置\`picbed\`和\`configName\`两个URL查询参数来指定上传图床和配置文件。例如：
\`http://127.0.0.1:36677/upload?picbed=aws-s3&configName=piclist-test\`

该配置将会使用\`aws-s3\`图床，并且使用\`piclist-test\`配置文件。

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "result": ["url"]
}
\`\`\`

### HTTP调用上传具体路径图片

- method: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- request body: \`{list: ['xxx.jpg']}\` 必须是JSON格式

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "result": ["url"]
}
\`\`\`

### HTTP调用删除图片

- method: \`POST\`
- url: \`http://127.0.0.1:36677/delete\` （此处以默认配置为例）
- request body: \`{list: [{xx:xx}]}\` 必须是JSON格式

list中的每一项都是一个对象，由上传接口返回数据的\`fullResult\`字段组成。

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "message": xxx
}
\`\`\`
`;
class Router {
  #router = /* @__PURE__ */ new Map();
  #addRoute(method, url, callback, urlparams) {
    if (!this.#router.has(url)) {
      this.#router.set(url, /* @__PURE__ */ new Map());
    }
    this.#router.get(url).set(method, { handler: callback, urlparams });
  }
  get(url, callback, urlparams) {
    this.#addRoute("GET", url, callback, urlparams);
  }
  post(url, callback, urlparams) {
    this.#addRoute("POST", url, callback, urlparams);
  }
  any(url, callback, urlparams) {
    this.#addRoute("GET", url, callback, urlparams);
    this.#addRoute("POST", url, callback, urlparams);
  }
  getHandler(url, method) {
    if (this.#router.has(url)) {
      const methods = this.#router.get(url);
      if (methods.has(method)) {
        return methods.get(method);
      }
    }
    return null;
  }
}
const router = new Router();
const deleteLog = (fileName, type, isSuccess = true, msg) => {
  console.log(`Delete ${fileName} on ${type} ${isSuccess ? "success" : "failed"}, message: ${msg || ""}`);
};
const deleteFailedLog = (fileName, type, error) => {
  deleteLog(fileName, type, false);
  console.error(error);
};
class AlistApi {
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      const { version: version2, url, uploadPath, token } = config;
      if (String(version2) === "2") {
        deleteLog(fileName, "Alist", false, "Alist version 2 is not supported, deletion is skipped");
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
          dir: path.join("/", uploadPath, path.dirname(fileName)),
          names: [path.basename(fileName)]
        }
      });
      if (result.data.code === 200) {
        deleteLog(fileName, "Alist");
        return true;
      }
      deleteLog(fileName, "Alist", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Alist", error);
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
        deleteFailedLog(fileName, "Alist", "No valid token or username/password provided");
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
          dir: path.join("/", uploadPath, path.dirname(fileName)),
          names: [path.basename(fileName)]
        }
      });
      if (result.data.code === 200) {
        deleteLog(fileName, "Alist");
        return true;
      }
      deleteLog(fileName, "Alist", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Alist", error);
      return false;
    }
  }
}
class AliyunApi2 {
  static #getKey(fileName, path2) {
    return path2 && path2 !== "/" ? `${path2.replace(/^\/+|\/+$/, "")}/${fileName}` : fileName;
  }
  static async delete(configMap) {
    const { fileName, config } = configMap;
    try {
      const client = new OSS({ ...config, region: config.area });
      const key = AliyunApi2.#getKey(fileName, config.path);
      const result = await client.delete(key);
      if (result.res.status === 204) {
        deleteLog(fileName, "Aliyun");
        return true;
      }
      deleteLog(fileName, "Aliyun", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Aliyun", error);
      return false;
    }
  }
}
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
let AwsS3Api$1 = class AwsS3Api {
  static async delete(configMap) {
    try {
      return await removeFileFromS3InMain(getRawData(configMap));
    } catch (error) {
      deleteFailedLog(configMap.fileName, "AWS S3", error);
      return false;
    }
  }
};
class AwsS3Api2 {
  static async delete(configMap) {
    try {
      return await removeFileFromDogeInMain(getRawData(configMap));
    } catch (error) {
      deleteFailedLog(configMap.fileName, "DogeCloud", error);
      return false;
    }
  }
}
class GithubApi2 {
  static #createOctokit(token) {
    return new Octokit({
      auth: token
    });
  }
  static #createKey(path2, fileName) {
    const formatedFileName = fileName.replace(/%2F/g, "/");
    return path2 && path2 !== "/" ? `${path2.replace(/^\/+|\/+$/, "")}/${formatedFileName}` : formatedFileName;
  }
  static async delete(configMap) {
    const {
      fileName,
      hash,
      config: { repo, token, branch, path: path2 }
    } = configMap;
    const [owner, repoName] = repo.split("/");
    const octokit = GithubApi2.#createOctokit(token);
    const key = GithubApi2.#createKey(path2, fileName);
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
        deleteLog(fileName, "GitHub");
        return true;
      }
      deleteLog(fileName, "GitHub", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "GitHub", error);
      return false;
    }
  }
}
class HuaweicloudApi {
  static async delete(configMap) {
    try {
      return await removeFileFromHuaweiInMain(getRawData(configMap));
    } catch (error) {
      deleteFailedLog(configMap.fileName, "HuaweiCloud", error);
      return false;
    }
  }
}
class ImgurApi2 {
  static #baseUrl = "https://api.imgur.com/3";
  static async delete(configMap) {
    const { config: { clientId = "", username = "", accessToken = "" } = {}, hash = "" } = configMap;
    let Authorization, apiUrl;
    if (username && accessToken) {
      Authorization = `Bearer ${accessToken}`;
      apiUrl = `${ImgurApi2.#baseUrl}/account/${username}/image/${hash}`;
    } else if (clientId) {
      Authorization = `Client-ID ${clientId}`;
      apiUrl = `${ImgurApi2.#baseUrl}/image/${hash}`;
    } else {
      deleteLog(hash, "Imgur", false, "No credentials found");
      return false;
    }
    try {
      const response = await axios.delete(apiUrl, {
        headers: { Authorization },
        timeout: 3e4
      });
      if (response.status === 200) {
        deleteLog(hash, "Imgur");
        return true;
      }
      deleteLog(hash, "Imgur", false);
      return false;
    } catch (error) {
      deleteFailedLog(hash, "Imgur", error);
      return false;
    }
  }
}
class LocalApi2 {
  static async delete(configMap) {
    const { hash } = configMap;
    if (!hash) {
      deleteLog(hash, "Local", false, "Local.delete: invalid params");
      return false;
    }
    try {
      await fs.remove(hash);
      deleteLog(hash, "Local");
      return true;
    } catch (error) {
      deleteFailedLog(hash, "Local", error);
      return false;
    }
  }
}
class LskyplistApi {
  static async delete(configMap) {
    const { hash, config } = configMap;
    if (!hash || !config || !config.token) {
      deleteLog(hash, "Lskyplist", false, "LskyplistApi.delete: invalid params");
      return false;
    }
    const { host, token, version: version2 } = config;
    if (version2 !== "V2") {
      deleteLog(hash, "Lskyplist", false, "LskyplistApi.delete: invalid version");
      return false;
    }
    const v2Headers = {
      Accept: "application/json",
      Authorization: token || void 0
    };
    const requestAgent = new https.Agent({
      rejectUnauthorized: false
    });
    try {
      const response = await axios.delete(`${host}/api/v1/images/${hash}`, {
        headers: v2Headers,
        timeout: 3e4,
        httpsAgent: requestAgent
      });
      if (response.status === 200 && response.data.status === true) {
        deleteLog(hash, "Lskyplist");
        return true;
      }
      deleteLog(hash, "Lskyplist", false);
      return false;
    } catch (error) {
      deleteFailedLog(hash, "Lskyplist", error);
      return false;
    }
  }
}
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
      const response = await axios.post(url, {
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
class QiniuApi2 {
  static async delete(configMap) {
    const {
      fileName,
      config: { accessKey, secretKey, bucket, path: path2 }
    } = configMap;
    const mac = new window.node.qiniu.auth.digest.Mac(accessKey, secretKey);
    const qiniuConfig = new window.node.qiniu.conf.Config();
    try {
      const bucketManager = new window.node.qiniu.rs.BucketManager(mac, qiniuConfig);
      const formattedPath = path2?.replace(/^\/+|\/+$/, "") || "";
      const key = path2 === "/" || !path2 ? fileName : `${formattedPath}/${fileName}`;
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
      return await removeFileFromSFTPInMain(getRawData(config), fileName);
    } catch (error) {
      deleteFailedLog(fileName, "SFTP", error);
      return false;
    }
  }
}
class SmmsApi2 {
  static #baseUrl = "https://smms.app/api/v2";
  static async delete(configMap) {
    const { hash, config } = configMap;
    if (!hash || !config || !config.token) {
      deleteLog(hash, "Smms", false, "SmmsApi.delete: invalid params");
      return false;
    }
    const { token } = config;
    try {
      const response = await axios.get(`${SmmsApi2.#baseUrl}/delete/${hash}`, {
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
        deleteLog(hash, "Smms");
        return true;
      }
      deleteLog(hash, "Smms", false);
      return false;
    } catch (error) {
      deleteFailedLog(hash, "Smms", error);
      return false;
    }
  }
}
class TcyunApi2 {
  static #createCOS(SecretId, SecretKey) {
    return new COS({
      SecretId,
      SecretKey
    });
  }
  static async delete(configMap) {
    const {
      fileName,
      config: { secretId, secretKey, bucket, area, path: path2 }
    } = configMap;
    try {
      const cos = TcyunApi2.#createCOS(secretId, secretKey);
      let key;
      if (path2 === "/" || !path2) {
        key = `/${fileName}`;
      } else {
        key = `/${path2.replace(/^\/+|\/+$/, "")}/${fileName}`;
      }
      const result = await cos.deleteObject({
        Bucket: bucket,
        Region: area,
        Key: key
      });
      if (result.statusCode === 204) {
        deleteLog(fileName, "Tcyun");
        return true;
      }
      deleteLog(fileName, "Tcyun", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Tcyun", error);
      return false;
    }
  }
}
class UpyunApi2 {
  static async delete(configMap) {
    const {
      fileName,
      config: { bucket, operator, password, path: path2 }
    } = configMap;
    try {
      const service = new Upyun.Service(bucket, operator, password);
      const client = new Upyun.Client(service);
      let key;
      if (path2 === "/" || !path2) {
        key = fileName;
      } else {
        key = `${path2.replace(/^\/+|\/+$/, "")}/${fileName}`;
      }
      const result = await client.deleteFile(key);
      if (result) {
        deleteLog(fileName, "Upyun");
        return true;
      }
      deleteLog(fileName, "Upyun", false);
      return false;
    } catch (error) {
      deleteFailedLog(fileName, "Upyun", error);
      return false;
    }
  }
}
class WebdavApi {
  static async delete(configMap) {
    const {
      fileName,
      config: { host, username, password, path: path2, sslEnabled, authType }
    } = configMap;
    const endpoint = formatEndpoint(host, sslEnabled);
    const options = {
      username,
      password
    };
    if (authType === "digest") {
      options.authType = AuthType.Digest;
    }
    const ctx = createClient(endpoint, options);
    let key;
    if (path2 === "/" || !path2) {
      key = fileName;
    } else {
      key = `${path2.replace(/^\/+|\/+$/, "")}/${fileName}`;
    }
    try {
      await ctx.deleteFile(key);
      deleteLog(fileName, "WebDAV");
      return true;
    } catch (error) {
      deleteFailedLog(fileName, "WebDAV", error);
      return false;
    }
  }
}
const apiMap = {
  alist: AlistApi,
  alistplist: AListplistApi,
  aliyun: AliyunApi2,
  "aws-s3": AwsS3Api$1,
  "aws-s3-plist": AwsS3Api$1,
  dogecloud: AwsS3Api2,
  github: GithubApi2,
  "huaweicloud-uploader": HuaweicloudApi,
  imgur: ImgurApi2,
  local: LocalApi2,
  lskyplist: LskyplistApi,
  piclist: PiclistApi,
  qiniu: QiniuApi2,
  sftpplist: SftpPlistApi,
  smms: SmmsApi2,
  tcyun: TcyunApi2,
  upyun: UpyunApi2,
  webdavplist: WebdavApi
};
class ALLApi {
  static async delete(configMap) {
    const api = apiMap[configMap.type];
    return api ? await api.delete(configMap) : false;
  }
}
const handleResponse = ({
  response,
  statusCode = 200,
  header = {
    "Content-Type": "application/json",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-origin": "*"
  },
  body = {
    success: false
  }
}) => {
  if (body?.success === false) {
    logger.warn("[PicList Server] upload failed, see piclist.log for more detail ↑");
  }
  response.writeHead(statusCode, header);
  response.write(JSON.stringify(body));
  response.end();
};
const ensureHTTPLink = (url) => {
  return url.startsWith("http") ? url : `http://${url}`;
};
const deleteChoosedFiles = async (list) => {
  const result = [];
  for (const item of list) {
    if (item.id) {
      try {
        const dbStore = GalleryDB.getInstance();
        const file = await dbStore.getById(item.id);
        await dbStore.removeById(item.id);
        if (await db.get(configPaths.settings.deleteCloudFile)) {
          if (item.type !== void 0 && picBedsCanbeDeleted.includes(item.type)) {
            const noteFunc = (value) => {
              const notification = new Notification({
                title: T("MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2"),
                body: T(value ? "GALLERY_SYNC_DELETE_NOTICE_SUCCEED" : "GALLERY_SYNC_DELETE_NOTICE_FAILED")
              });
              notification.show();
            };
            setTimeout(() => {
              ALLApi.delete(item).then(noteFunc);
            }, 0);
          }
        }
        setTimeout(() => {
          picgo.emit(ICOREBuildInEvent.REMOVE, [file], GuiApi.getInstance());
        }, 500);
        result.push(true);
      } catch (e) {
        result.push(false);
      }
    }
  }
  if (windowManager.has(IWindowList.SETTING_WINDOW)) {
    windowManager.get(IWindowList.SETTING_WINDOW).webContents?.send("updateGallery");
  }
  return result;
};
class AESHelper {
  key = crypto.pbkdf2Sync(
    picgo.getConfig(configPaths.settings.aesPassword) || DEFAULT_AES_PASSWORD,
    Buffer.from("a8b3c4d2e4f5098712345678feedc0de", "hex"),
    1e5,
    32,
    "sha512"
  );
  encrypt(plainText) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }
  decrypt(encryptedData) {
    const [ivHex, encryptedText] = encryptedData.split(":");
    if (!ivHex || !encryptedText) return "{}";
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
const appPath$1 = app.getPath("userData");
const serverTempDir$1 = path.join(appPath$1, "serverTemp");
const STORE_PATH$3 = dbPathDir();
const LOG_PATH = path.join(STORE_PATH$3, "piclist.log");
const errorMessage = `upload error. see ${LOG_PATH} for more detail.`;
const deleteErrorMessage = `delete error. see ${LOG_PATH} for more detail.`;
async function responseForGet({ response }) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  const htmlContent = marked(markdownContent);
  response.write(htmlContent);
  response.end();
}
router.get("/", responseForGet);
router.get("/upload", responseForGet);
router.post(
  "/upload",
  async ({
    response,
    list = [],
    urlparams
  }) => {
    try {
      const picbed = urlparams?.get("picbed");
      const passedKey = urlparams?.get("key");
      const serverKey = picgo.getConfig(configPaths.settings.serverKey) || "";
      const useShortUrl = picgo.getConfig(configPaths.settings.useShortUrl);
      if (serverKey && passedKey !== serverKey) {
        handleResponse({
          response,
          body: {
            success: false,
            message: "server key is uncorrect"
          }
        });
        return;
      }
      let currentPicBedType = "";
      let currentPicBedConfig = {};
      let currentPicBedConfigId = "";
      let needRestore = false;
      if (picbed) {
        const currentPicBed = picgo.getConfig("picBed") || {};
        currentPicBedType = currentPicBed.uploader || currentPicBed.current || "smms";
        currentPicBedConfig = currentPicBed[currentPicBedType] || {};
        currentPicBedConfigId = currentPicBedConfig._id;
        const configName = urlparams?.get("configName") || currentPicBed[picbed]?._configName;
        if (picbed === currentPicBedType && configName === currentPicBedConfig._configName) {
        } else {
          needRestore = true;
          const picBeds = picgo.getConfig("uploader");
          const currentPicBedList = picBeds?.[picbed]?.configList;
          if (currentPicBedList) {
            const currentConfig = currentPicBedList?.find((item) => item._configName === configName);
            if (currentConfig) {
              changeCurrentUploader(picbed, currentConfig, currentConfig._id);
            }
          }
        }
      }
      if (list.length === 0) {
        logger.info("[PicList Server] upload clipboard file");
        const result = await uploadClipboardFiles();
        const res = useShortUrl ? result.fullResult.shortUrl || result.url : result.url;
        const fullResult = result.fullResult;
        fullResult.imgUrl = useShortUrl ? fullResult.shortUrl || fullResult.imgUrl : fullResult.imgUrl;
        logger.info("[PicList Server] upload result:", res);
        if (res) {
          const treatedFullResult = {
            isEncrypted: 1,
            EncryptedData: new AESHelper().encrypt(JSON.stringify(fullResult)),
            ...fullResult
          };
          delete treatedFullResult.config;
          handleResponse({
            response,
            body: {
              success: true,
              result: [res],
              fullResult: [treatedFullResult]
            }
          });
        } else {
          handleResponse({
            response,
            body: {
              success: false,
              message: errorMessage
            }
          });
        }
      } else {
        logger.info("[PicList Server] upload files in list");
        const pathList = list.map((item) => {
          return {
            path: item
          };
        });
        const win = windowManager.getAvailableWindow();
        const result = await uploadChoosedFiles(win.webContents, pathList);
        const res = result.map((item) => {
          return useShortUrl ? item.fullResult.shortUrl || item.url : item.url;
        });
        const fullResult = result.map((item) => {
          const treatedItem = {
            isEncrypted: 1,
            EncryptedData: new AESHelper().encrypt(JSON.stringify(item.fullResult)),
            ...item.fullResult
          };
          delete treatedItem.config;
          treatedItem.imgUrl = useShortUrl ? treatedItem.shortUrl || treatedItem.imgUrl : treatedItem.imgUrl;
          return treatedItem;
        });
        logger.info("[PicList Server] upload result", res.join(" ; "));
        if (res.length) {
          handleResponse({
            response,
            body: {
              success: true,
              result: res,
              fullResult
            }
          });
        } else {
          handleResponse({
            response,
            body: {
              success: false,
              message: errorMessage
            }
          });
        }
      }
      fs.emptyDirSync(serverTempDir$1);
      if (needRestore) {
        changeCurrentUploader(currentPicBedType, currentPicBedConfig, currentPicBedConfigId);
      }
    } catch (err) {
      logger.error(err);
      handleResponse({
        response,
        body: {
          success: false,
          message: errorMessage
        }
      });
    }
  }
);
router.post(
  "/delete",
  async ({ response, list = [] }) => {
    if (list.length === 0) {
      handleResponse({
        response,
        body: {
          success: false,
          message: "no file to delete"
        }
      });
      return;
    }
    try {
      const aesHelper = new AESHelper();
      const treatList = list.map((item) => {
        if (!item.isEncrypted) return item;
        return JSON.parse(aesHelper.decrypt(item.EncryptedData));
      });
      const result = await deleteChoosedFiles(treatList);
      const successCount = result.filter((item) => item).length;
      const failCount = result.length - successCount;
      handleResponse({
        response,
        body: {
          success: !!successCount,
          message: successCount ? `delete success: ${successCount}, fail: ${failCount}` : deleteErrorMessage
        }
      });
    } catch (err) {
      logger.error(err);
      handleResponse({
        response,
        body: {
          success: false,
          message: deleteErrorMessage
        }
      });
    }
  }
);
router.any("/heartbeat", async ({ response }) => {
  handleResponse({
    response,
    body: {
      success: true,
      result: "alive"
    }
  });
});
const DEFAULT_PORT = 36677;
const DEFAULT_HOST = "0.0.0.0";
const appPath = app.getPath("userData");
const serverTempDir = path.join(appPath, "serverTemp");
fs.ensureDirSync(serverTempDir);
const multerStorage = multer.diskStorage({
  destination: function(_req, _file, cb) {
    fs.ensureDirSync(serverTempDir);
    cb(null, serverTempDir);
  },
  filename: function(_req, file, cb) {
    if (!/[^\u0000-\u00ff]/.test(file.originalname)) {
      file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    }
    cb(null, file.originalname);
  }
});
const uploadMulter = multer({
  storage: multerStorage
});
class Server {
  #httpServer;
  #config;
  constructor() {
    this.#config = this.getConfigWithDefaults();
    this.#httpServer = http.createServer(this.#handleRequest);
  }
  getConfigWithDefaults() {
    let config = picgo.getConfig(configPaths.settings.server);
    if (!this.#isValidConfig(config)) {
      config = { port: DEFAULT_PORT, host: DEFAULT_HOST, enable: true };
      picgo.saveConfig({ [configPaths.settings.server]: config });
    }
    return config;
  }
  #isValidConfig(config) {
    return config && config.port && config.host && config.enable !== void 0;
  }
  #handleRequest = (request, response) => {
    switch (request.method) {
      case "OPTIONS":
        handleResponse({ response });
        break;
      case "POST":
        this.#handlePostRequest(request, response);
        break;
      case "GET":
        this.#handleGetRequest(request, response);
        break;
      default:
        logger.warn(`[PicList Server] don't support [${request.method}] method`);
        response.statusCode = 405;
        response.end();
    }
  };
  #handlePostRequest = (request, response) => {
    const [url, query] = (request.url || "").split("?");
    if (!router.getHandler(url, "POST")) {
      logger.warn(`[PicList Server] don't support [${url}] endpoint`);
      handleResponse({
        response,
        statusCode: 404,
        body: {
          success: false
        }
      });
    } else {
      const remoteAddress = request.socket.remoteAddress || "unknown";
      logger.info("[PicList Server] get a POST request from IP:", remoteAddress);
      let urlSP = query ? new URLSearchParams(query) : void 0;
      if (remoteAddress === "::1" || remoteAddress === "127.0.0.1") {
        const serverKey = picgo.getConfig(configPaths.settings.serverKey) || "";
        if (urlSP) {
          urlSP.set("key", serverKey);
        } else {
          urlSP = new URLSearchParams("key=" + serverKey);
        }
      }
      if (request.headers["content-type"] && request.headers["content-type"].startsWith("multipart/form-data")) {
        uploadMulter.any()(request, response, (err) => {
          if (err) {
            logger.info("[PicList Server]", err);
            return handleResponse({
              response,
              body: {
                success: false,
                message: "Error processing formData"
              }
            });
          }
          const list = request.files.map((file) => file.path);
          logger.info("[PicList Server] get a formData request");
          const handler = router.getHandler(url, "POST")?.handler;
          if (handler) {
            handler({
              list,
              response,
              urlparams: urlSP
            });
          }
        });
      } else {
        let body = "";
        let postObj;
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          try {
            postObj = body === "" ? {} : JSON.parse(body);
          } catch (err) {
            logger.error("[PicList Server]", err);
            return handleResponse({
              response,
              body: {
                success: false,
                message: "Not sending data in JSON format"
              }
            });
          }
          logger.info("[PicList Server] get the request", body);
          const handler = router.getHandler(url, "POST")?.handler;
          handler({
            ...postObj,
            response,
            urlparams: urlSP
          });
        });
      }
    }
  };
  #handleGetRequest = (_request, response) => {
    const [url, query] = (_request.url || "").split("?");
    if (!router.getHandler(url, "GET")) {
      logger.info(`[PicList Server] don't support [${url}] endpoint`);
      response.statusCode = 404;
      response.end();
    } else {
      const handler = router.getHandler(url, "GET")?.handler;
      if (handler) {
        handler({
          response,
          urlparams: query ? new URLSearchParams(query) : void 0
        });
      }
    }
  };
  // port as string is a bug
  #listen = (port) => {
    logger.info(`[PicList Server] is listening at ${port} of ${this.#config.host}`);
    if (typeof port === "string") {
      port = parseInt(port, 10);
    }
    this.#httpServer.listen(port, this.#config.host).on("error", async (err) => {
      if (err.code === "EADDRINUSE") {
        try {
          await axios.post(ensureHTTPLink(`${this.#config.host}:${port}/heartbeat`));
          logger.info(`[PicList Server] server is already running at ${port}`);
          this.shutdown(true);
        } catch (e) {
          logger.warn(`[PicList Server] ${port} is busy, trying with port ${port + 1}`);
          this.#listen(port + 1);
        }
      } else {
        logger.error("[PicList Server]", err);
      }
    });
  };
  startup() {
    if (this.#config.enable) {
      this.#listen(this.#config.port);
    }
  }
  shutdown(hasStarted) {
    this.#httpServer.close();
    if (!hasStarted) {
      logger.info("[PicList Server] shutdown");
    }
  }
  restart() {
    this.shutdown();
    this.#config = this.getConfigWithDefaults();
    this.startup();
  }
}
const server$1 = new Server();
const defaultPath = process.platform === "win32" ? "C:\\Users" : "/";
function generateDirectoryListingHtml(files, requestPath) {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h1>Directory Listing</h1><ul>';
  files.forEach((file) => {
    const filePath = path.join(requestPath, file);
    html += `<li><a href="${encodeFilePath(filePath)}">${file}</a></li>`;
  });
  html += "</ul></body></html>";
  return html;
}
function serveDirectory(res, filePath, requestPath) {
  fs.readdir(filePath, (err, files) => {
    if (err) {
      res.writeHead(500);
      res.end("Error listing directory contents");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(generateDirectoryListingHtml(files, requestPath));
    }
  });
}
function serveFile(res, filePath) {
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
  readStream.on("error", () => {
    res.writeHead(500);
    res.end("Error reading file");
  });
}
class WebServer {
  #server;
  #config;
  constructor() {
    this.loadConfig();
    this.initServer();
  }
  loadConfig() {
    this.#config = {
      enableWebServer: picgo.getConfig(configPaths.settings.enableWebServer) || false,
      webServerHost: picgo.getConfig(configPaths.settings.webServerHost) || "0.0.0.0",
      webServerPort: picgo.getConfig(configPaths.settings.webServerPort) || 37777,
      webServerPath: picgo.getConfig(configPaths.settings.webServerPath) || defaultPath
    };
  }
  initServer() {
    this.#server = http.createServer((req, res) => {
      const requestPath = req.url?.split("?")[0];
      const filePath = path.join(this.#config.webServerPath, decodeURIComponent(requestPath || ""));
      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          serveDirectory(res, filePath, requestPath);
        } else {
          serveFile(res, filePath);
        }
      } catch (err) {
        res.writeHead(404);
        res.end("404 Not Found");
      }
    });
  }
  start() {
    if (this.#config.enableWebServer) {
      this.#server.listen(
        this.#config.webServerPort === 36699 ? 37777 : this.#config.webServerPort,
        this.#config.webServerHost,
        () => {
          logger.info(
            `Web server is running at http://${this.#config.webServerHost}:${this.#config.webServerPort}, root path is ${this.#config.webServerPath}`
          );
        }
      ).on("error", (err) => {
        logger.error(err);
      });
    } else {
      logger.info("Web server is not enabled");
    }
  }
  stop() {
    this.#server.close(() => {
      logger.info("Web server is stopped");
    });
  }
  restart() {
    this.stop();
    this.loadConfig();
    this.initServer();
    this.start();
  }
}
const webServer = new WebServer();
const advancedRoutes = [
  {
    action: IRPCActionType.ADVANCED_UPDATE_SERVER,
    handler: async () => {
      server$1.restart();
    }
  },
  {
    action: IRPCActionType.ADVANCED_STOP_WEB_SERVER,
    handler: async () => {
      webServer.stop();
    }
  },
  {
    action: IRPCActionType.ADVANCED_RESTART_WEB_SERVER,
    handler: async () => {
      webServer.restart();
    }
  }
];
const STORE_PATH$2 = app.getPath("userData");
const readFileAsBase64 = (filePath) => fs.readFileSync(filePath, { encoding: "base64" });
const isHttpResSuccess = (res) => res.status >= 200 && res.status < 300;
const uploadOrUpdateMsg = (fileName, isUpdate = true) => isUpdate ? `update ${fileName} from PicList` : `upload ${fileName} from PicList`;
const getSyncConfig = () => {
  return db.get(configPaths.settings.sync) || {
    type: "github",
    username: "",
    repo: "",
    branch: "",
    token: "",
    proxy: ""
  };
};
const getProxyagent = (proxy) => {
  return proxy ? new HttpsProxyAgent({
    keepAlive: true,
    keepAliveMsecs: 1e3,
    rejectUnauthorized: false,
    proxy: proxy.replace("127.0.0.1", "localhost"),
    scheduling: "lifo"
  }) : void 0;
};
function getOctokit(syncConfig) {
  const { token, proxy } = syncConfig;
  return new Octokit({
    auth: token,
    request: {
      agent: getProxyagent(proxy)
    }
  });
}
const isSyncConfigValidate = ({
  type,
  username,
  repo,
  branch,
  token,
  webdavEndpoint,
  webdavUsername,
  webdavPassword,
  webdavAuthType,
  webdavSslEnabled,
  webdavSavePath
}) => {
  if (type === "webdav") {
    return type && webdavEndpoint && webdavUsername && webdavPassword && webdavAuthType !== void 0 && webdavSslEnabled !== void 0 && webdavSavePath !== void 0;
  }
  return type && username && repo && branch && token;
};
async function uploadLocalToRemote(syncConfig, fileName) {
  const localFilePath = path.join(STORE_PATH$2, fileName);
  if (!fs.existsSync(localFilePath)) {
    return false;
  }
  const { username, repo, branch, token, type } = syncConfig;
  const defaultConfig = {
    content: readFileAsBase64(localFilePath),
    message: uploadOrUpdateMsg(fileName, false),
    branch
  };
  try {
    switch (type) {
      case "gitee": {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`;
        const res = await axios.post(url, {
          ...defaultConfig,
          access_token: token
        });
        return isHttpResSuccess(res);
      }
      case "github": {
        const octokit = getOctokit(syncConfig);
        const res = await octokit.rest.repos.createOrUpdateFileContents({
          ...defaultConfig,
          owner: username,
          repo,
          path: fileName
        });
        return isHttpResSuccess(res);
      }
      case "gitea": {
        const { endpoint = "" } = syncConfig;
        const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`;
        const headers = {
          Authorization: `token ${token}`
        };
        const res = await axios.post(apiUrl, defaultConfig, { headers });
        return isHttpResSuccess(res);
      }
      case "webdav": {
        const {
          webdavEndpoint = "",
          webdavUsername,
          webdavPassword,
          webdavAuthType = "basic",
          webdavSslEnabled = true,
          webdavSavePath = ""
        } = syncConfig;
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled);
        const options = {
          username: webdavUsername,
          password: webdavPassword
        };
        if (webdavAuthType === "digest") {
          options.authType = AuthType.Digest;
        }
        const client = createClient(webdavEndpointF, options);
        const fileContent = fs.readFileSync(localFilePath);
        const remoteFilePath = webdavSavePath ? `${webdavSavePath}/${fileName}`.replace(/^\/+|\/+$/g, "").replace(/\/\/+/g, "/") : fileName;
        const remoteDir = path.dirname(remoteFilePath);
        if (remoteDir !== "/") {
          await client.createDirectory(remoteDir, { recursive: true });
        }
        await client.putFileContents(remoteFilePath, fileContent, { overwrite: true });
        return true;
      }
      default:
        return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}
async function updateLocalToRemote(syncConfig, fileName) {
  const localFilePath = path.join(STORE_PATH$2, fileName);
  if (!fs.existsSync(localFilePath)) {
    return false;
  }
  const { username, repo, branch, token, type } = syncConfig;
  const defaultConfig = {
    branch,
    message: uploadOrUpdateMsg(fileName),
    content: readFileAsBase64(localFilePath)
  };
  switch (type) {
    case "gitee": {
      const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`;
      const shaRes = await axios.get(url, {
        params: {
          access_token: token,
          ref: branch
        }
      });
      if (!isHttpResSuccess(shaRes)) {
        return false;
      }
      const sha = shaRes.data.sha;
      const res = await axios.put(url, {
        ...defaultConfig,
        owner: username,
        repo,
        path: fileName,
        sha,
        access_token: token
      });
      return isHttpResSuccess(res);
    }
    case "github": {
      const octokit = getOctokit(syncConfig);
      const shaRes = await octokit.rest.repos.getContent({
        owner: username,
        repo,
        path: fileName,
        ref: branch
      });
      if (shaRes.status !== 200) {
        throw new Error("get sha failed");
      }
      const data = shaRes.data;
      const sha = data.sha;
      const res = await octokit.rest.repos.createOrUpdateFileContents({
        ...defaultConfig,
        owner: username,
        repo,
        path: fileName,
        sha
      });
      return res.status === 200;
    }
    case "gitea": {
      const { endpoint = "" } = syncConfig;
      const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`;
      const headers = {
        Authorization: `token ${token}`
      };
      const shaRes = await axios.get(apiUrl, {
        headers
      });
      if (!isHttpResSuccess(shaRes)) {
        throw new Error("get sha failed");
      }
      const data = shaRes.data;
      const sha = data.sha;
      const res = await axios.put(
        apiUrl,
        {
          ...defaultConfig,
          sha
        },
        {
          headers
        }
      );
      return isHttpResSuccess(res);
    }
    case "webdav": {
      const {
        webdavEndpoint = "",
        webdavUsername,
        webdavPassword,
        webdavAuthType = "basic",
        webdavSslEnabled = true,
        webdavSavePath = ""
      } = syncConfig;
      const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled);
      const options = {
        username: webdavUsername,
        password: webdavPassword
      };
      if (webdavAuthType === "digest") {
        options.authType = AuthType.Digest;
      }
      const client = createClient(webdavEndpointF, options);
      const fileContent = fs.readFileSync(localFilePath);
      const remoteFilePath = webdavSavePath ? `${webdavSavePath}/${fileName}`.replace(/^\/+|\/+$/g, "").replace(/\/\/+/g, "/") : fileName;
      const remoteDir = path.dirname(remoteFilePath);
      if (remoteDir !== "/") {
        await client.createDirectory(remoteDir, { recursive: true });
      }
      await client.putFileContents(remoteFilePath, fileContent, { overwrite: true });
      return true;
    }
    default:
      return false;
  }
}
async function uploadFile(fileName) {
  const syncConfig = getSyncConfig();
  if (!isSyncConfigValidate(syncConfig)) {
    logger.error("sync config is invalid");
    return 0;
  }
  const uploadFunc = async (file) => {
    let result = false;
    try {
      result = await updateLocalToRemote(syncConfig, file);
    } catch (error) {
      result = await uploadLocalToRemote(syncConfig, file);
    }
    logger.info(`upload ${file} ${result ? "success" : "failed"}`);
    return result ? 1 : 0;
  };
  let count = 0;
  for (const file of fileName) {
    count += await uploadFunc(file);
  }
  return count;
}
async function downloadAndWriteFile(url, localFilePath, config, isWriteJson = false) {
  const res = await axios.get(url, config);
  if (isHttpResSuccess(res)) {
    await fs.writeFile(
      localFilePath,
      isWriteJson ? JSON.stringify(res.data, null, 2) : Buffer.from(res.data.content, "base64")
    );
    return true;
  }
  return false;
}
async function downloadRemoteToLocal(syncConfig, fileName) {
  const localFilePath = path.join(STORE_PATH$2, fileName);
  const { username, repo, branch, token, proxy, type } = syncConfig;
  try {
    switch (type) {
      case "gitee": {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`;
        return downloadAndWriteFile(url, localFilePath, {
          params: {
            access_token: token,
            ref: branch
          }
        });
      }
      case "github": {
        const octokit = getOctokit(syncConfig);
        const res = await octokit.rest.repos.getContent({
          owner: username,
          repo,
          path: fileName,
          ref: branch
        });
        if (res.status === 200) {
          const data = res.data;
          const downloadUrl = data.download_url;
          return downloadAndWriteFile(
            downloadUrl,
            localFilePath,
            {
              httpsAgent: getProxyagent(proxy)
            },
            true
          );
        }
        return false;
      }
      case "gitea": {
        const { endpoint = "" } = syncConfig;
        const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`;
        return downloadAndWriteFile(apiUrl, localFilePath, {
          headers: {
            Authorization: `token ${token}`
          },
          params: {
            ref: branch
          }
        });
      }
      case "webdav": {
        const {
          webdavEndpoint = "",
          webdavUsername,
          webdavPassword,
          webdavAuthType = "basic",
          webdavSslEnabled = true,
          webdavSavePath = ""
        } = syncConfig;
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled);
        const options = {
          username: webdavUsername,
          password: webdavPassword
        };
        if (webdavAuthType === "digest") {
          options.authType = AuthType.Digest;
        }
        const client = createClient(webdavEndpointF, options);
        const remoteFilePath = webdavSavePath ? path.join(webdavSavePath, fileName) : fileName;
        const fileContent = await client.getFileContents(remoteFilePath);
        await fs.writeFile(localFilePath, fileContent);
        return true;
      }
      default:
        return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}
async function downloadFile(fileName) {
  const syncConfig = getSyncConfig();
  if (!isSyncConfigValidate(syncConfig)) {
    logger.error("sync config is invalid");
    return 0;
  }
  const downloadFunc = async (file) => {
    const result = await downloadRemoteToLocal(syncConfig, file);
    logger.info(`download ${file} ${result ? "success" : "failed"}`);
    return result ? 1 : 0;
  };
  return (await Promise.all(fileName.map(downloadFunc))).reduce((a, b) => a + b, 0);
}
const STORE_PATH$1 = app.getPath("userData");
const commonConfigList = ["data.json", "data.bak.json"];
const manageConfigList = ["manage.json", "manage.bak.json"];
const configureRoutes = [
  {
    action: IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO,
    handler: async () => {
      const picGoConfigPath = STORE_PATH$1.replace("piclist", "picgo");
      const files = ["data.json", "data.bak.json", "picgo.db", "picgo.bak.db"];
      try {
        await Promise.all(
          files.map(async (file) => {
            const sourcePath = path.join(picGoConfigPath, file);
            const targetPath = path.join(STORE_PATH$1, file.replace("picgo", "piclist"));
            await fs.copy(sourcePath, targetPath, { overwrite: true });
          })
        );
        return true;
      } catch (err) {
        logger.error(err);
        throw new Error("Migrate failed");
      }
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
    handler: async () => {
      return await uploadFile(commonConfigList);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
    handler: async () => {
      return await uploadFile(manageConfigList);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
    handler: async () => {
      return await uploadFile([...commonConfigList, ...manageConfigList]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
    handler: async () => {
      return await downloadFile(commonConfigList);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
    handler: async () => {
      return await downloadFile(manageConfigList);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
    handler: async () => {
      return await downloadFile([...commonConfigList, ...manageConfigList]);
    },
    type: IRPCType.INVOKE
  }
];
const STORE_PATH = dbPathDir();
const mainAppRoutes = [
  {
    action: IRPCActionType.PICLIST_GET_CONFIG,
    handler: async (_, args) => {
      return picgo.getConfig(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.PICLIST_GET_CONFIG_SYNC,
    handler: async (event, args) => {
      const result = picgo.getConfig(args[0]);
      const eventInstance = event;
      eventInstance.returnValue = result;
    }
  },
  {
    action: IRPCActionType.PICLIST_SAVE_CONFIG,
    handler: async (_, args) => {
      picgo.saveConfig(args[0]);
    }
  },
  {
    action: IRPCActionType.PICLIST_OPEN_FILE,
    handler: async (_, args) => {
      const abFilePath = path.join(STORE_PATH, args[0]);
      if (!fs.existsSync(abFilePath)) {
        fs.writeFileSync(abFilePath, "");
      }
      shell.openPath(abFilePath);
    }
  },
  {
    action: IRPCActionType.PICLIST_OPEN_DIRECTORY,
    handler: async (_, args) => {
      let [dirPath, inStorePath = true] = args;
      if (inStorePath) {
        dirPath = path.join(STORE_PATH, dirPath || "");
      }
      if (!dirPath || !fs.existsSync(dirPath)) {
        return;
      }
      shell.openPath(dirPath);
    }
  },
  {
    action: IRPCActionType.PICLIST_AUTO_START,
    handler: async (_, args) => {
      app.setLoginItemSettings({
        openAtLogin: args[0]
      });
    }
  }
];
const notificationFunc = (result) => {
  const notification = new Notification({
    title: T(`OPERATION_${result ? "SUCCEED" : "FAILED"}`),
    body: T(`TIPS_SHORTCUT_MODIFIED_${result ? "SUCCEED" : "CONFLICT"}`)
  });
  notification.show();
};
const shortKeyRoutes = [
  {
    action: IRPCActionType.SHORTKEY_UPDATE,
    handler: async (_, args) => {
      const [item, oldKey, from] = args;
      const result = shortKeyHandler.updateShortKey(item, oldKey, from);
      notificationFunc(result);
      return result;
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
    handler: async (_, args) => {
      const [item, from] = args;
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from);
      notificationFunc(result);
    }
  },
  {
    action: IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE,
    handler: async (_, args) => {
      const [status] = args;
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, status);
    }
  }
];
const settingRouter = new RPCRouter();
const settingRoutes = [...advancedRoutes, ...configureRoutes, ...mainAppRoutes, ...shortKeyRoutes];
settingRouter.addBatch(settingRoutes);
const appRoutes = [
  {
    action: IRPCActionType.GET_PLATFORM,
    handler: async (event) => {
      event.returnValue = process.platform;
    }
  },
  {
    action: IRPCActionType.RELOAD_APP,
    handler: async () => {
      app.relaunch();
      app.exit(0);
    }
  },
  {
    action: IRPCActionType.OPEN_FILE,
    handler: async (_, args) => {
      shell.openPath(args[0]);
    }
  },
  {
    action: IRPCActionType.OPEN_URL,
    handler: async (_, args) => {
      shell.openExternal(args[0]);
    }
  },
  {
    action: IRPCActionType.GET_LANGUAGE_LIST,
    handler: async (event) => {
      event.returnValue = i18nManager.languageList;
    }
  },
  {
    action: IRPCActionType.GET_CURRENT_LANGUAGE,
    handler: async (event) => {
      const { lang, locales } = i18nManager.getCurrentLocales();
      event.returnValue = [lang, locales];
    }
  },
  {
    action: IRPCActionType.SET_CURRENT_LANGUAGE,
    handler: async (_, args) => {
      i18nManager.setCurrentLanguage(args[0]);
      const { lang, locales } = i18nManager.getCurrentLocales();
      picgo.i18n.setLanguage(lang);
      if (process.platform === "darwin") {
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
        trayWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales);
      }
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
      settingWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales);
      if (windowManager.has(IWindowList.MINI_WINDOW)) {
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW);
        miniWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales);
      }
    }
  }
];
const windowRoutes = [
  {
    action: IRPCActionType.HIDE_DOCK,
    handler: async (_, args) => {
      args[0] ? app.dock?.hide() : app.dock?.show();
    }
  },
  {
    action: IRPCActionType.OPEN_WINDOW,
    handler: async (_, args) => {
      const window2 = windowManager.get(args[0]);
      if (window2) {
        window2.show();
      }
    }
  },
  {
    action: IRPCActionType.OPEN_MANUAL_WINDOW,
    handler: async () => {
      windowManager.get(IWindowList.MANUAL_WINDOW).show();
    }
  },
  {
    action: IRPCActionType.OPEN_MINI_WINDOW,
    handler: async () => {
      openMiniWindow();
    }
  },
  {
    action: IRPCActionType.CLOSE_WINDOW,
    handler: async () => {
      const window2 = BrowserWindow.getFocusedWindow();
      if (process.platform === "linux") {
        window2?.hide();
      } else {
        window2?.close();
      }
    }
  },
  {
    action: IRPCActionType.MINIMIZE_WINDOW,
    handler: async () => {
      const window2 = BrowserWindow.getFocusedWindow();
      window2?.minimize();
    }
  },
  {
    action: IRPCActionType.SHOW_MINI_PAGE_MENU,
    handler: async () => {
      const window2 = windowManager.get(IWindowList.MINI_WINDOW);
      const menu = buildMiniPageMenu();
      menu.popup({
        window: window2
      });
    }
  },
  {
    action: IRPCActionType.SHOW_MAIN_PAGE_MENU,
    handler: async () => {
      const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
      const menu = buildMainPageMenu(window2);
      menu.popup({
        window: window2
      });
    }
  },
  {
    action: IRPCActionType.SHOW_UPLOAD_PAGE_MENU,
    handler: async () => {
      const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
      const menu = buildPicBedListMenu();
      menu.popup({
        window: window2
      });
    }
  },
  {
    action: IRPCActionType.SHOW_SECOND_UPLOADER_MENU,
    handler: async () => {
      const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
      const menu = buildSecondPicBedMenu();
      menu.popup({
        window: window2
      });
    }
  },
  {
    action: IRPCActionType.SHOW_PLUGIN_PAGE_MENU,
    handler: async (_, args) => {
      const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
      const menu = buildPluginPageMenu(args[0]);
      menu.popup({
        window: window2
      });
    }
  },
  {
    action: IRPCActionType.SET_MINI_WINDOW_POS,
    handler: async (_, args) => {
      const window2 = BrowserWindow.getFocusedWindow();
      window2?.setBounds(args[0]);
    }
  },
  {
    action: IRPCActionType.MINI_WINDOW_ON_TOP,
    handler: async (_, args) => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW);
      miniWindow.setAlwaysOnTop(args[0]);
    }
  },
  {
    action: IRPCActionType.MAIN_WINDOW_ON_TOP,
    handler: async () => {
      const mainWindow = windowManager.get(IWindowList.SETTING_WINDOW);
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
    }
  },
  {
    action: IRPCActionType.UPDATE_MINI_WINDOW_ICON,
    handler: async (_, args) => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW);
      miniWindow.webContents.send("updateMiniIcon", args[0]);
    }
  },
  {
    action: IRPCActionType.REFRESH_SETTING_WINDOW,
    handler: async () => {
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
      settingWindow.webContents.session.clearCache().then(() => {
        settingWindow.webContents.reloadIgnoringCache();
      });
    }
  }
];
const systemRouter = new RPCRouter();
const systemRoutes = [...appRoutes, ...windowRoutes];
systemRouter.addBatch(systemRoutes);
function sendToolboxResWithType(type) {
  return (event, res) => {
    return event.sender.send(IRPCActionType.TOOLBOX_CHECK_RES, {
      ...res,
      type
    });
  };
}
const sendToolboxRes$1 = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD);
const defaultClipboardImagePath = path.join(defaultConfigPath, CLIPBOARD_IMAGE_FOLDER);
const checkClipboardUploadMap = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async (event) => {
    sendToolboxRes$1(event, {
      status: IToolboxItemCheckStatus.LOADING
    });
    const configFilePath2 = dbPathChecker();
    if (fs.existsSync(configFilePath2)) {
      const dirPath = path.dirname(configFilePath2);
      const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER);
      if (fs.existsSync(clipboardImagePath)) {
        sendToolboxRes$1(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T("TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_TIPS", {
            path: clipboardImagePath
          }),
          value: clipboardImagePath
        });
      } else {
        sendToolboxRes$1(event, {
          status: IToolboxItemCheckStatus.ERROR,
          msg: T("TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS", {
            path: clipboardImagePath
          }),
          value: path.dirname(clipboardImagePath)
        });
      }
    } else {
      sendToolboxRes$1(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T("TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS", {
          path: defaultClipboardImagePath
        }),
        value: path.dirname(defaultClipboardImagePath)
      });
    }
  }
};
const fixClipboardUploadMap = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async () => {
    const configFilePath2 = dbPathChecker();
    const dirPath = path.dirname(configFilePath2);
    const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER);
    try {
      fs.mkdirsSync(clipboardImagePath);
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.SUCCESS
      };
    } catch (e) {
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.ERROR,
        msg: T("TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_ERROR_TIPS", {
          path: clipboardImagePath
        }),
        value: path.dirname(clipboardImagePath)
      };
    }
  }
};
const checkFileMap = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async (event) => {
    const sendToolboxRes2 = sendToolboxResWithType(IToolboxItemType.IS_CONFIG_FILE_BROKEN);
    sendToolboxRes2(event, {
      status: IToolboxItemCheckStatus.LOADING
    });
    const configFilePath2 = dbPathChecker();
    try {
      if (fs.existsSync(configFilePath2)) {
        await fs.readJSON(configFilePath2);
        sendToolboxRes2(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T("TOOLBOX_CHECK_CONFIG_FILE_PATH_TIPS", {
            path: configFilePath2
          }),
          value: configFilePath2
        });
      }
    } catch (e) {
      sendToolboxRes2(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T("TOOLBOX_CHECK_CONFIG_FILE_BROKEN_TIPS"),
        value: path.dirname(configFilePath2)
      });
    }
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: async (event) => {
    const sendToolboxRes2 = sendToolboxResWithType(IToolboxItemType.IS_GALLERY_FILE_BROKEN);
    sendToolboxRes2(event, {
      status: IToolboxItemCheckStatus.LOADING
    });
    const galleryDB = GalleryDB.getInstance();
    if (galleryDB.errorList.length === 0) {
      sendToolboxRes2(event, {
        status: IToolboxItemCheckStatus.SUCCESS,
        msg: T("TOOLBOX_CHECK_GALLERY_FILE_PATH_TIPS", {
          path: DB_PATH
        }),
        value: path.dirname(DB_PATH)
      });
    } else {
      sendToolboxRes2(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: T("TOOLBOX_CHECK_GALLERY_FILE_BROKEN_TIPS"),
        value: path.dirname(DB_PATH)
      });
    }
  }
};
const fixFileMap = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(dbPathChecker());
    } catch (e) {
    }
    return {
      type: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS
    };
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(DB_PATH);
    } catch (e) {
    }
    return {
      type: IToolboxItemType.IS_GALLERY_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS
    };
  }
};
var tunnel$2 = {};
var hasRequiredTunnel$1;
function requireTunnel$1() {
  if (hasRequiredTunnel$1) return tunnel$2;
  hasRequiredTunnel$1 = 1;
  var tls = require$$1$1;
  var http2 = require$$2;
  var https2 = require$$3;
  var events = require$$4;
  var util2 = require$$6;
  tunnel$2.httpOverHttp = httpOverHttp;
  tunnel$2.httpsOverHttp = httpsOverHttp;
  tunnel$2.httpOverHttps = httpOverHttps;
  tunnel$2.httpsOverHttps = httpsOverHttps;
  function httpOverHttp(options) {
    var agent = new TunnelingAgent(options);
    agent.request = http2.request;
    return agent;
  }
  function httpsOverHttp(options) {
    var agent = new TunnelingAgent(options);
    agent.request = http2.request;
    agent.createSocket = createSecureSocket;
    agent.defaultPort = 443;
    return agent;
  }
  function httpOverHttps(options) {
    var agent = new TunnelingAgent(options);
    agent.request = https2.request;
    return agent;
  }
  function httpsOverHttps(options) {
    var agent = new TunnelingAgent(options);
    agent.request = https2.request;
    agent.createSocket = createSecureSocket;
    agent.defaultPort = 443;
    return agent;
  }
  function TunnelingAgent(options) {
    var self = this;
    self.options = options || {};
    self.proxyOptions = self.options.proxy || {};
    self.maxSockets = self.options.maxSockets || http2.Agent.defaultMaxSockets;
    self.requests = [];
    self.sockets = [];
    self.on("free", function onFree(socket, host, port, localAddress) {
      var options2 = toOptions(host, port, localAddress);
      for (var i = 0, len = self.requests.length; i < len; ++i) {
        var pending = self.requests[i];
        if (pending.host === options2.host && pending.port === options2.port) {
          self.requests.splice(i, 1);
          pending.request.onSocket(socket);
          return;
        }
      }
      socket.destroy();
      self.removeSocket(socket);
    });
  }
  util2.inherits(TunnelingAgent, events.EventEmitter);
  TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
    var self = this;
    var options = mergeOptions({ request: req }, self.options, toOptions(host, port, localAddress));
    if (self.sockets.length >= this.maxSockets) {
      self.requests.push(options);
      return;
    }
    self.createSocket(options, function(socket) {
      socket.on("free", onFree);
      socket.on("close", onCloseOrRemove);
      socket.on("agentRemove", onCloseOrRemove);
      req.onSocket(socket);
      function onFree() {
        self.emit("free", socket, options);
      }
      function onCloseOrRemove(err) {
        self.removeSocket(socket);
        socket.removeListener("free", onFree);
        socket.removeListener("close", onCloseOrRemove);
        socket.removeListener("agentRemove", onCloseOrRemove);
      }
    });
  };
  TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
    var self = this;
    var placeholder = {};
    self.sockets.push(placeholder);
    var connectOptions = mergeOptions({}, self.proxyOptions, {
      method: "CONNECT",
      path: options.host + ":" + options.port,
      agent: false,
      headers: {
        host: options.host + ":" + options.port
      }
    });
    if (options.localAddress) {
      connectOptions.localAddress = options.localAddress;
    }
    if (connectOptions.proxyAuth) {
      connectOptions.headers = connectOptions.headers || {};
      connectOptions.headers["Proxy-Authorization"] = "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
    }
    debug("making CONNECT request");
    var connectReq = self.request(connectOptions);
    connectReq.useChunkedEncodingByDefault = false;
    connectReq.once("response", onResponse);
    connectReq.once("upgrade", onUpgrade);
    connectReq.once("connect", onConnect);
    connectReq.once("error", onError);
    connectReq.end();
    function onResponse(res) {
      res.upgrade = true;
    }
    function onUpgrade(res, socket, head) {
      process.nextTick(function() {
        onConnect(res, socket, head);
      });
    }
    function onConnect(res, socket, head) {
      connectReq.removeAllListeners();
      socket.removeAllListeners();
      if (res.statusCode !== 200) {
        debug(
          "tunneling socket could not be established, statusCode=%d",
          res.statusCode
        );
        socket.destroy();
        var error = new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
        error.code = "ECONNRESET";
        options.request.emit("error", error);
        self.removeSocket(placeholder);
        return;
      }
      if (head.length > 0) {
        debug("got illegal response body from proxy");
        socket.destroy();
        var error = new Error("got illegal response body from proxy");
        error.code = "ECONNRESET";
        options.request.emit("error", error);
        self.removeSocket(placeholder);
        return;
      }
      debug("tunneling connection has established");
      self.sockets[self.sockets.indexOf(placeholder)] = socket;
      return cb(socket);
    }
    function onError(cause) {
      connectReq.removeAllListeners();
      debug(
        "tunneling socket could not be established, cause=%s\n",
        cause.message,
        cause.stack
      );
      var error = new Error("tunneling socket could not be established, cause=" + cause.message);
      error.code = "ECONNRESET";
      options.request.emit("error", error);
      self.removeSocket(placeholder);
    }
  };
  TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
    var pos = this.sockets.indexOf(socket);
    if (pos === -1) {
      return;
    }
    this.sockets.splice(pos, 1);
    var pending = this.requests.shift();
    if (pending) {
      this.createSocket(pending, function(socket2) {
        pending.request.onSocket(socket2);
      });
    }
  };
  function createSecureSocket(options, cb) {
    var self = this;
    TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
      var hostHeader = options.request.getHeader("host");
      var tlsOptions = mergeOptions({}, self.options, {
        socket,
        servername: hostHeader ? hostHeader.replace(/:.*$/, "") : options.host
      });
      var secureSocket = tls.connect(0, tlsOptions);
      self.sockets[self.sockets.indexOf(socket)] = secureSocket;
      cb(secureSocket);
    });
  }
  function toOptions(host, port, localAddress) {
    if (typeof host === "string") {
      return {
        host,
        port,
        localAddress
      };
    }
    return host;
  }
  function mergeOptions(target) {
    for (var i = 1, len = arguments.length; i < len; ++i) {
      var overrides = arguments[i];
      if (typeof overrides === "object") {
        var keys = Object.keys(overrides);
        for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
          var k = keys[j];
          if (overrides[k] !== void 0) {
            target[k] = overrides[k];
          }
        }
      }
    }
    return target;
  }
  var debug;
  if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
    debug = function() {
      var args = Array.prototype.slice.call(arguments);
      if (typeof args[0] === "string") {
        args[0] = "TUNNEL: " + args[0];
      } else {
        args.unshift("TUNNEL:");
      }
      console.error.apply(console, args);
    };
  } else {
    debug = function() {
    };
  }
  tunnel$2.debug = debug;
  return tunnel$2;
}
var tunnel$1;
var hasRequiredTunnel;
function requireTunnel() {
  if (hasRequiredTunnel) return tunnel$1;
  hasRequiredTunnel = 1;
  tunnel$1 = requireTunnel$1();
  return tunnel$1;
}
var tunnelExports = requireTunnel();
const tunnel = /* @__PURE__ */ getDefaultExportFromCjs(tunnelExports);
function getProxy(proxyStr) {
  if (proxyStr) {
    try {
      const proxyOptions = new URL(proxyStr);
      return {
        host: proxyOptions.hostname,
        port: parseInt(proxyOptions.port || "0", 10),
        protocol: proxyOptions.protocol
      };
    } catch (e) {
    }
  }
  return null;
}
const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_PROXY);
const checkProxyMap = {
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: async (event) => {
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING
    });
    const configFilePath2 = dbPathChecker();
    if (fs.existsSync(configFilePath2)) {
      let config;
      try {
        config = await fs.readJSON(configFilePath2);
      } catch (e) {
      }
      if (!config) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T("TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS")
        });
      }
      const proxy = config.picBed?.proxy;
      if (!proxy) {
        return sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: T("TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS")
        });
      } else {
        const proxyOptions = getProxy(proxy);
        if (!proxyOptions) {
          return sendToolboxRes(event, {
            status: IToolboxItemCheckStatus.ERROR,
            msg: T("TOOLBOX_CHECK_PROXY_PROXY_IS_NOT_CORRECT")
          });
        } else {
          const httpsAgent = tunnel.httpsOverHttp({
            proxy: {
              host: proxyOptions.host,
              port: proxyOptions.port
            }
          });
          try {
            await axios.get("https://www.google.com", {
              httpsAgent
            });
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.SUCCESS,
              msg: T("TOOLBOX_CHECK_PROXY_SUCCESS_TIPS")
            });
          } catch (e) {
            console.log(e);
            return sendToolboxRes(event, {
              status: IToolboxItemCheckStatus.ERROR,
              msg: T("TOOLBOX_CHECK_PROXY_PROXY_IS_NOT_WORKING")
            });
          }
        }
      }
    }
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.SUCCESS,
      msg: T("TOOLBOX_CHECK_PROXY_NO_PROXY_TIPS")
    });
  }
};
const toolboxRouter = new RPCRouter();
const toolboxCheckMap = {
  ...checkFileMap,
  ...checkClipboardUploadMap,
  ...checkProxyMap
};
const toolboxFixMap = {
  ...fixFileMap,
  ...fixClipboardUploadMap
};
toolboxRouter.add(
  IRPCActionType.TOOLBOX_CHECK,
  async (event, args) => {
    const [type] = args;
    if (type) {
      const handler = toolboxCheckMap[type];
      if (handler) {
        handler(event);
      }
    } else {
      for (const key in toolboxCheckMap) {
        const handler = toolboxCheckMap[key];
        if (handler) {
          handler(event);
        }
      }
    }
  },
  IRPCType.SEND
).add(
  IRPCActionType.TOOLBOX_CHECK_FIX,
  async (event, args) => {
    const [type] = args;
    const handler = toolboxFixMap[type];
    if (handler) {
      return await handler(event);
    }
  },
  IRPCType.INVOKE
);
const trayRouter = new RPCRouter();
const trayRoutes = [
  {
    action: IRPCActionType.TRAY_SET_TOOL_TIP,
    handler: async (_, args) => {
      setTrayToolTip(args[0]);
    }
  },
  {
    action: IRPCActionType.TRAY_GET_SHORT_URL,
    handler: async (_, args) => {
      return await generateShortUrl(args[0]);
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES,
    handler: async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW);
      const img = await uploader.setWebContents(trayWindow.webContents).uploadWithBuildInClipboard();
      if (img !== false) {
        const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN;
        const [pasteText, shortUrl] = await pasteTemplate(pasteStyle, img[0], db.get(configPaths.settings.customLink));
        img[0].shortUrl = shortUrl;
        handleCopyUrl(pasteText);
        const isShowResultNotification = db.get(configPaths.settings.uploadResultNotification) === void 0 ? true : !!db.get(configPaths.settings.uploadResultNotification);
        if (isShowResultNotification) {
          const notification = new Notification({
            title: T("UPLOAD_SUCCEED"),
            body: shortUrl || img[0].imgUrl
            // icon: file[0]
            // icon: img[0].imgUrl
          });
          notification.show();
        }
        await GalleryDB.getInstance().insert(img[0]);
        trayWindow.webContents.send("clipboardFiles", []);
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW).webContents.send("updateGallery");
        }
      }
      trayWindow.webContents.send("uploadFiles");
    }
  }
];
trayRouter.addBatch(trayRoutes);
const uploadRouter = new RPCRouter();
const uploadRoutes = [
  {
    action: IRPCActionType.MAIN_GET_PICBED,
    handler: async () => {
      return getPicBeds();
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE,
    handler: async () => {
      uploadClipboardFiles();
    }
  },
  {
    action: IRPCActionType.UPLOAD_CHOOSED_FILES,
    handler: async (evt, args) => {
      return uploadChoosedFiles(evt.sender, args[0]);
    }
  }
];
uploadRouter.addBatch(uploadRoutes);
class RPCServer {
  routes = /* @__PURE__ */ new Map();
  routesWithResponse = /* @__PURE__ */ new Map();
  rpcEventHandler = async (event, action, args) => {
    try {
      const route2 = this.routes.get(action);
      await route2?.handler?.(event, args);
    } catch (e) {
      logger.error(e);
    }
  };
  rpcEventHandlerWithResponse = async (event, action, args) => {
    try {
      const route2 = this.routesWithResponse.get(action);
      return await route2?.handler?.(event, args);
    } catch (e) {
      logger.error(e);
      return void 0;
    }
  };
  start() {
    ipcMain.on(RPC_ACTIONS, this.rpcEventHandler);
    ipcMain.handle(RPC_ACTIONS_INVOKE, this.rpcEventHandlerWithResponse);
  }
  use(routes2) {
    for (const [action, route2] of routes2) {
      if (route2.type === IRPCType.SEND) {
        this.routes.set(action, route2);
      } else {
        this.routesWithResponse.set(action, route2);
      }
    }
  }
  stop() {
    ipcMain.off(RPC_ACTIONS, this.rpcEventHandler);
  }
}
const rpcServer = new RPCServer();
const routes = [
  galleryRouter.routes(),
  picbedRouter.routes(),
  pluginRouter.routes(),
  settingRouter.routes(),
  systemRouter.routes(),
  toolboxRouter.routes(),
  trayRouter.routes(),
  uploadRouter.routes(),
  manageRouter.routes()
];
for (const route2 of routes) {
  rpcServer.use(route2);
}
const imgFilePath = path.join(picgo.baseDir, "imgTemp");
fs.ensureDirSync(imgFilePath);
const serverPort = 36699;
let server;
function startFileServer() {
  server = http.createServer((req, res) => {
    const requestPath = req.url?.split("?")[0];
    const filePath = path.join(imgFilePath, decodeURIComponent(requestPath));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("404 Not Found");
      } else {
        res.end(data);
      }
    });
  });
  server.listen(serverPort, () => {
    logger.info(`File server is running, http://localhost:${serverPort}`);
  }).on("error", (err) => {
    logger.error(err);
  });
}
function stopFileServer() {
  server.close(() => {
    logger.info("File server is stopped");
  });
}
function fixPath() {
  if (process.platform === "win32") {
    return;
  }
  process.env.PATH = shellPath.sync() || ["./node_modules/.bin", "/.nodebrew/current/bin", "/usr/local/bin", process.env.PATH].join(":");
}
const configPath = dbPathChecker();
const CONFIG_DIR = path.dirname(configPath);
function beforeOpen() {
  if (process.platform === "darwin") {
    resolveMacWorkFlow();
  }
  resolveClipboardImageGenerator();
  resolveOtherI18nFiles();
}
function copyFileOutsideOfElectronAsar(sourceInAsarArchive, destOutsideAsarArchive) {
  if (fs.existsSync(sourceInAsarArchive)) {
    if (fs.statSync(sourceInAsarArchive).isFile()) {
      const file = destOutsideAsarArchive;
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(file, fs.readFileSync(sourceInAsarArchive));
    } else if (fs.statSync(sourceInAsarArchive).isDirectory()) {
      fs.readdirSync(sourceInAsarArchive).forEach(function(fileOrFolderName) {
        copyFileOutsideOfElectronAsar(
          `${sourceInAsarArchive}/${fileOrFolderName}`,
          `${destOutsideAsarArchive}/${fileOrFolderName}`
        );
      });
    }
  }
}
function resolveMacWorkFlow() {
  const dest = `${os.homedir()}/Library/Services/Upload pictures with PicList.workflow`;
  try {
    copyFileOutsideOfElectronAsar(path.join("./resources", "Upload pictures with PicList.workflow"), dest);
  } catch (e) {
    console.log(e);
  }
}
function diffFilesAndUpdate(filePath1, filePath2) {
  try {
    const file1 = fs.existsSync(filePath1) && fs.readFileSync(filePath1);
    const file2 = fs.existsSync(filePath1) && fs.readFileSync(filePath2);
    if (!file1 || !file2 || !file1.equals(file2)) {
      fs.copyFileSync(filePath1, filePath2);
    }
  } catch (e) {
    console.error(e);
    fs.copyFileSync(filePath1, filePath2);
  }
}
function resolveClipboardImageGenerator() {
  const clipboardFiles = getClipboardFiles();
  if (!fs.pathExistsSync(path.join(CONFIG_DIR, "windows10.ps1"))) {
    clipboardFiles.forEach((item) => {
      fs.copyFileSync(item.origin, item.dest);
    });
  } else {
    clipboardFiles.forEach((item) => {
      diffFilesAndUpdate(item.origin, item.dest);
    });
  }
  function getClipboardFiles() {
    const files = ["linux.sh", "mac.applescript", "windows.ps1", "windows10.ps1", "wsl.sh"];
    return files.map((item) => {
      return {
        origin: path.join("./resources", item),
        dest: path.join(CONFIG_DIR, item)
      };
    });
  }
}
function resolveOtherI18nFiles() {
  const i18nFolder = path.join(CONFIG_DIR, "i18n");
  if (!fs.pathExistsSync(i18nFolder)) {
    fs.mkdirSync(i18nFolder);
  }
  i18nManager.setOutterI18nFolder(i18nFolder);
  const i18nFiles = fs.readdirSync(path.join(CONFIG_DIR, "i18n"), {
    withFileTypes: true
  });
  i18nFiles.forEach((item) => {
    if (item.isFile() && item.name?.endsWith(".yml")) {
      const i18nFilePath = path.join(i18nFolder, item.name);
      const i18nFile = fs.readFileSync(i18nFilePath, "utf8");
      try {
        const i18nFileObj = yaml.load(i18nFile);
        if (i18nFileObj?.LANG_DISPLAY_LABEL) {
          i18nManager.addI18nFile(item.name.replace(".yml", ""), i18nFileObj.LANG_DISPLAY_LABEL);
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}
const getUploadFiles = (argv = process.argv, cwd = process.cwd(), logger2) => {
  const uploadIndex = argv.indexOf("upload");
  if (uploadIndex === -1) return [];
  const fileList = argv.slice(uploadIndex + 1);
  if (fileList.length === 0) return null;
  return fileList.map((item) => {
    if (isUrl(item) || path.isAbsolute(item)) return { path: item };
    const resolvedPath = path.join(cwd, item);
    if (fs.existsSync(resolvedPath)) {
      return { path: resolvedPath };
    }
    logger2.warn(`cli -> can't get file: ${resolvedPath}, invalid path`);
    return null;
  }).filter((item) => item !== null);
};
const initI18n = () => {
  const currentLanguage = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN;
  i18nManager.setCurrentLanguage(currentLanguage);
};
const updateChecker = async () => {
  let showTip = db.get(configPaths.settings.showUpdateTip);
  if (showTip === void 0) {
    db.set(configPaths.settings.showUpdateTip, true);
    showTip = true;
  }
  if (showTip) {
    try {
      await updater.autoUpdater.checkForUpdatesAndNotify();
    } catch (err) {
    }
  }
};
const isDevelopment = process.env.NODE_ENV !== "production";
const handleStartUpFiles = (argv, cwd) => {
  const files = getUploadFiles(argv, cwd, logger);
  if (files === null) {
    logger.info("cli -> uploading file from clipboard");
    uploadClipboardFiles();
    return true;
  }
  if (files.length > 0) {
    logger.info("cli -> uploading files from cli", ...files.map((file) => file.path));
    const win = windowManager.getAvailableWindow();
    uploadChoosedFiles(win.webContents, files);
    return true;
  }
  return false;
};
updater.autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://release.piclist.cn/latest",
  channel: "latest"
});
updater.autoUpdater.autoDownload = false;
updater.autoUpdater.on("update-available", async (info) => {
  const lang = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN;
  let updateLog = "";
  try {
    const url = lang === II18nLanguage.ZH_CN ? "https://release.piclist.cn/currentVersion.md" : "https://release.piclist.cn/currentVersion_en.md";
    const res = await axios.get(url);
    updateLog = res.data;
  } catch (e) {
    logger.error(e);
  }
  const maxLogLength = 800;
  let displayLog = updateLog;
  let truncatedNote = "";
  if (updateLog.length > maxLogLength) {
    const truncatePoint = updateLog.lastIndexOf("\n", maxLogLength);
    displayLog = updateLog.substring(0, truncatePoint > 0 ? truncatePoint : maxLogLength);
    truncatedNote = lang === II18nLanguage.ZH_CN ? "\n\n... (更多详情请查看完整更新日志)" : "\n\n... (See full changelog for more details)";
  }
  dialog.showMessageBox({
    type: "info",
    title: T("FIND_NEW_VERSION"),
    buttons: ["Yes", "Go to download page"],
    message: T("TIPS_FIND_NEW_VERSION", {
      v: info.version
    }) + "\n\n" + displayLog + truncatedNote,
    checkboxLabel: T("NO_MORE_NOTICE"),
    checkboxChecked: false
  }).then((result) => {
    if (result.response === 0) {
      updater.autoUpdater.downloadUpdate();
    } else {
      shell.openExternal("https://github.com/Kuingsmile/PicList/releases/latest");
    }
    db.set(configPaths.settings.showUpdateTip, !result.checkboxChecked);
  }).catch((err) => {
    logger.error(err);
  });
});
updater.autoUpdater.on("download-progress", (progressObj) => {
  const percent = {
    progress: progressObj.percent
  };
  const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
  window2.webContents.send("updateProgress", percent);
});
updater.autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    type: "info",
    title: T("UPDATE_DOWNLOADED"),
    buttons: ["Yes", "No"],
    message: T("TIPS_UPDATE_DOWNLOADED")
  }).then((result) => {
    const window2 = windowManager.get(IWindowList.SETTING_WINDOW);
    window2.webContents.send("updateProgress", { progress: 100 });
    if (result.response === 0) {
      updater.autoUpdater.quitAndInstall();
    }
  }).catch((err) => {
    logger.error(err);
  });
});
updater.autoUpdater.on("error", (err) => {
  console.log(err);
});
class LifeCycle {
  async #beforeReady() {
    protocol.registerSchemesAsPrivileged([{ scheme: "picgo", privileges: { secure: true, standard: true } }]);
    fixPath();
    beforeOpen();
    getManageApi();
    UpDownTaskQueue.getInstance();
    initI18n();
    rpcServer.start();
    busEventList.listen();
  }
  #onReady() {
    const readyFunction = async () => {
      windowManager.create(IWindowList.TRAY_WINDOW);
      windowManager.create(IWindowList.SETTING_WINDOW);
      const isAutoListenClipboard = db.get(configPaths.settings.isAutoListenClipboard) || false;
      const ClipboardWatcher2 = clipboardPoll;
      if (isAutoListenClipboard) {
        db.set(configPaths.settings.isListeningClipboard, true);
        ClipboardWatcher2.startListening();
        ClipboardWatcher2.on("change", () => {
          picgo.log.info("clipboard changed");
          uploadClipboardFiles();
        });
      } else {
        db.set(configPaths.settings.isListeningClipboard, false);
      }
      const isHideDock = db.get(configPaths.settings.isHideDock) || false;
      let startMode = db.get(configPaths.settings.startMode) || ISartMode.QUIET;
      if (process.platform === "darwin" && startMode === ISartMode.MINI) {
        startMode = ISartMode.QUIET;
      }
      const currentPicBed = db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || "smms";
      const currentPicBedConfig = db.get(`picBed.${currentPicBed}`)?._configName || "Default";
      const tooltip = `${currentPicBed} ${currentPicBedConfig}`;
      if (process.platform === "darwin") {
        isHideDock ? app.dock?.hide() : setDockMenu();
        startMode !== ISartMode.NO_TRAY && createTray(tooltip);
      } else {
        createTray(tooltip);
      }
      db.set(configPaths.needReload, false);
      updateChecker();
      process.nextTick(() => {
        shortKeyHandler.init();
      });
      server$1.startup();
      webServer.start();
      startFileServer();
      if (process.env.NODE_ENV !== "development") {
        handleStartUpFiles(process.argv, process.cwd());
      }
      if (notificationList && notificationList.length > 0) {
        while (notificationList.length) {
          const option = notificationList.pop();
          const notice = new Notification(option);
          notice.show();
        }
      }
      await remoteNoticeHandler.init();
      remoteNoticeHandler.triggerHook(IRemoteNoticeTriggerHook.APP_START);
      if (startMode === ISartMode.MINI && process.platform !== "darwin") {
        windowManager.create(IWindowList.MINI_WINDOW);
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW);
        miniWindow.removeAllListeners();
        if (db.get(configPaths.settings.miniWindowOntop)) {
          miniWindow.setAlwaysOnTop(true);
        }
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        const lastPosition = db.get(configPaths.settings.miniWindowPosition);
        if (lastPosition) {
          miniWindow.setPosition(lastPosition[0], lastPosition[1]);
        } else {
          miniWindow.setPosition(width - 100, height - 100);
        }
        const setPositionFunc = () => {
          const position = miniWindow.getPosition();
          db.set(configPaths.settings.miniWindowPosition, position);
        };
        miniWindow.on("close", setPositionFunc);
        miniWindow.on("move", setPositionFunc);
        miniWindow.show();
        miniWindow.focus();
      } else if (startMode === ISartMode.MAIN) {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
        settingWindow.show();
        settingWindow.focus();
      }
      const clipboardDir = path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER);
      fs.emptyDir(clipboardDir);
    };
    app.whenReady().then(readyFunction);
  }
  #onRunning() {
    app.on("second-instance", (_, commandLine, workingDirectory) => {
      logger.info("detect second instance");
      const result = handleStartUpFiles(commandLine, workingDirectory);
      if (!result) {
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW);
          if (settingWindow.isMinimized()) {
            settingWindow.restore();
          }
          settingWindow.focus();
        }
      }
    });
    app.on("activate", () => {
      if (!windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.create(IWindowList.TRAY_WINDOW);
      }
      if (!windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.create(IWindowList.SETTING_WINDOW);
      }
    });
    app.setLoginItemSettings({
      openAtLogin: db.get(configPaths.settings.autoStart) || false
    });
    if (process.platform === "win32") {
      app.setAppUserModelId("com.kuingsmile.piclist");
    }
    if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes("Unity")) {
      process.env.XDG_CURRENT_DESKTOP = "Unity";
    }
  }
  #onQuit() {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
    app.on("will-quit", () => {
      UpDownTaskQueue.getInstance().persist();
      clearTempFolder();
      globalShortcut.unregisterAll();
      bus.removeAllListeners();
      server$1.shutdown();
      webServer.stop();
      stopFileServer();
    });
    if (isDevelopment) {
      if (process.platform === "win32") {
        process.on("message", (data) => {
          if (data === "graceful-exit") {
            app.quit();
          }
        });
      } else {
        process.on("SIGTERM", () => {
          app.quit();
        });
      }
    }
  }
  async launchApp() {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    } else {
      await this.#beforeReady();
      this.#onReady();
      this.#onRunning();
      this.#onQuit();
    }
  }
}
const bootstrap = new LifeCycle();
bootstrap.launchApp();
