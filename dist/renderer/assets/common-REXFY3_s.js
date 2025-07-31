import { g as getConfig } from "./dataSender-Bg45AIFL.js";
import { s as safeSliceF, a as isNeedToShorten, h as handleUrlEncode } from "./common-DNjr697i.js";
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}
const randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
const native = { randomUUID };
function v4(options, buf, offset) {
  if (native.randomUUID && true && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return unsafeStringify(rnds);
}
const availableIconList = [
  "_blank",
  "_page",
  "3g2",
  "3gp",
  "7z",
  "aac",
  "accdb",
  "adt",
  "ai",
  "aiff",
  "aly",
  "amiga",
  "amr",
  "ape",
  "apk",
  "arj",
  "asf",
  "asm",
  "asx",
  "au",
  "avc",
  "avi",
  "avif",
  "avs",
  "bak",
  "bas",
  "bat",
  "bmp",
  "bom",
  "c",
  "cda",
  "cdr",
  "chm",
  "class",
  "cmd",
  "com",
  "cpp",
  "css",
  "csv",
  "dart",
  "dat",
  "ddb",
  "dif",
  "divx",
  "dll",
  "dmg",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dotx",
  "dsl",
  "dv",
  "dvd",
  "dvdaudio",
  "dwg",
  "dxf",
  "emf",
  "env",
  "eot",
  "eps",
  "exe",
  "exif",
  "fakesmms",
  "flc",
  "fli",
  "flv",
  "folder",
  "fon",
  "font",
  "for",
  "fpx",
  "fv",
  "gif",
  "gitingore",
  "gitkeep",
  "gz",
  "h",
  "hdri",
  "hlp",
  "hpp",
  "htm",
  "html",
  "ico",
  "ics",
  "int",
  "ipynb",
  "iso",
  "java",
  "jpeg",
  "jpg",
  "js",
  "json",
  "key",
  "ksp",
  "less",
  "lib",
  "lic",
  "license",
  "log",
  "lst",
  "lua",
  "mac",
  "map",
  "markdown",
  "md",
  "mdf",
  "mht",
  "mhtml",
  "mid",
  "midi",
  "mkv",
  "mmf",
  "mod",
  "mov",
  "mp2",
  "mp3",
  "mp4",
  "mpa",
  "mpe",
  "mpeg",
  "mpeg1",
  "mpeg2",
  "mpg",
  "mppro",
  "msg",
  "mts",
  "mux",
  "mv",
  "navi",
  "obj",
  "odf",
  "ods",
  "odt",
  "ogg",
  "one",
  "otf",
  "otp",
  "ots",
  "ott",
  "pas",
  "pcd",
  "pcx",
  "pdf",
  "php",
  "pic",
  "png",
  "ppt",
  "pptx",
  "proe",
  "prt",
  "psd",
  "py",
  "pyc",
  "qsv",
  "qt",
  "quicktime",
  "ra",
  "ram",
  "rar",
  "raw",
  "rb",
  "realaudio",
  "rm",
  "rmvb",
  "rp",
  "rtf",
  "s48",
  "sacd",
  "sass",
  "sch",
  "scss",
  "sh",
  "sql",
  "stp",
  "svcd",
  "svg",
  "swf",
  "sys",
  "tga",
  "tgz",
  "tiff",
  "tmp",
  "ts",
  "ttc",
  "ttf",
  "txt",
  "ufo",
  "unknown",
  "vcd",
  "vob",
  "voc",
  "vqf",
  "vue",
  "wav",
  "wdl",
  "webm",
  "webp",
  "wki",
  "wma",
  "wmf",
  "wmv",
  "wmvhd",
  "woff",
  "woff2",
  "wps",
  "wpt",
  "x_t",
  "xls",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xmind",
  "xml",
  "xv",
  "xvid",
  "yaml",
  "yml",
  "z",
  "zip"
];
function randomStringGenerator(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}
function renameFileNameWithTimestamp(oldName) {
  return `${Math.floor(Date.now() / 1e3)}${randomStringGenerator(5)}${window.node.path.extname(oldName)}`;
}
function renameFileNameWithRandomString(oldName, length = 5) {
  return `${randomStringGenerator(length)}${window.node.path.extname(oldName)}`;
}
function renameFormatHelper(num) {
  return num.toString().length === 1 ? `0${num}` : num.toString();
}
function getMd5(input) {
  return window.node.crypto.createHash("md5").update(input).digest("hex");
}
function renameFileNameWithCustomString(oldName, customFormat, affixFileName) {
  const date = /* @__PURE__ */ new Date();
  const year = date.getFullYear().toString();
  const fileBaseName = window.node.path.basename(oldName, window.node.path.extname(oldName));
  const conversionMap = {
    "{Y}": () => year,
    "{y}": () => year.slice(2),
    "{m}": () => renameFormatHelper(date.getMonth() + 1),
    "{d}": () => renameFormatHelper(date.getDate()),
    "{h}": () => renameFormatHelper(date.getHours()),
    "{i}": () => renameFormatHelper(date.getMinutes()),
    "{s}": () => renameFormatHelper(date.getSeconds()),
    "{ms}": () => date.getMilliseconds().toString().padStart(3, "0"),
    "{md5}": () => getMd5(fileBaseName),
    "{md5-16}": () => getMd5(fileBaseName).slice(0, 16),
    "{filename}": () => affixFileName ? window.node.path.basename(affixFileName, window.node.path.extname(affixFileName)) : window.node.path.basename(oldName, window.node.path.extname(oldName)),
    "{uuid}": () => v4().replace(/-/g, ""),
    "{timestamp}": () => date.getTime().toString()
  };
  if (customFormat === void 0 || !Object.keys(conversionMap).some((item) => customFormat.includes(item)) && !customFormat.includes("{str-")) {
    return oldName;
  }
  const ext = window.node.path.extname(oldName);
  let newName = Object.keys(conversionMap).reduce((acc, cur) => {
    return acc.replace(new RegExp(cur, "g"), conversionMap[cur]());
  }, customFormat) + ext;
  const strRegex = /{str-(\d+)}/gi;
  newName = newName.replace(strRegex, (_, group1) => {
    const length = parseInt(group1, 10);
    return randomStringGenerator(length);
  });
  return newName;
}
function renameFile({ timestampRename, randomStringRename, customRename, customRenameFormat }, oldName = "") {
  switch (true) {
    case timestampRename:
      return renameFileNameWithTimestamp(oldName);
    case randomStringRename:
      return renameFileNameWithRandomString(oldName, 20);
    case customRename:
      return renameFileNameWithCustomString(oldName, customRenameFormat);
    default:
      return oldName;
  }
}
async function formatLink(url, fileName, type, format) {
  const encodedUrl = await getConfig("settings.isEncodeUrl") ? handleUrlEncode(url) : url;
  switch (type) {
    case "markdown":
      return `![${fileName}](${encodedUrl})`;
    case "html":
      return `<img src="${encodedUrl}" alt="${fileName}"/>`;
    case "bbcode":
      return `[img]${encodedUrl}[/img]`;
    case "url":
      return encodedUrl;
    case "markdown-with-link":
      return `[![${fileName}](${encodedUrl})](${encodedUrl})`;
    case "custom":
      if (format && (format.includes("$url") || format.includes("$fileName"))) {
        return format.replace(/\$url/g, encodedUrl).replace(/\$fileName/g, fileName);
      }
      return encodedUrl;
    default:
      return encodedUrl;
  }
}
function getFileIconPath(fileName) {
  const ext = window.node.path.extname(fileName).slice(1).toLowerCase();
  return availableIconList.includes(ext) ? `${ext}.webp` : "unknown.webp";
}
const units = ["B", "KB", "MB", "GB", "TB", "PB"];
function formatFileSize(size) {
  if (size === 0) return "";
  const index = Math.floor(Math.log2(size) / 10);
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`;
}
function formatFileName(fileName, length = 20) {
  let ext = window.node.path.extname(fileName);
  ext = ext.length > 5 ? ext.slice(ext.length - 5) : ext;
  const name = window.node.path.basename(fileName, ext);
  return isNeedToShorten(fileName, length) ? `${safeSliceF(name, length - 3 - ext.length)}...${ext}` : fileName;
}
function formObjToTableData(obj) {
  const exclude = [void 0, null, "", "transformedConfig"];
  return Object.keys(obj).filter((key) => !exclude.includes(obj[key])).map((key) => ({
    key,
    value: typeof obj[key] === "object" ? JSON.stringify(obj[key]) : obj[key]
  })).sort((a, b) => a.key.localeCompare(b.key));
}
function isValidUrl(str) {
  try {
    return !!new URL(str);
  } catch (e) {
    return false;
  }
}
const svg = `
  <path class="path" d="
    M 30 15
    L 28 17
    M 25.61 25.61
    A 15 15, 0, 0, 1, 15 30
    A 15 15, 0, 1, 1, 27.99 7.5
    L 15 15
  " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
  `;
function customStrMatch(str, pattern) {
  if (!str || !pattern) return false;
  try {
    const reg = new RegExp(pattern, "ug");
    return reg.test(str);
  } catch (e) {
    console.error(e);
    return false;
  }
}
function customStrReplace(str, pattern, replacement) {
  if (!str || !pattern) return str;
  replacement = replacement || "";
  let result = str;
  try {
    const reg = new RegExp(pattern, "ug");
    result = str.replace(reg, replacement);
    result = renameFileNameWithCustomString(result, result, str);
  } catch (e) {
    console.error(e);
  }
  return result;
}
const customRenameFormatTable = [
  {
    placeholder: "{Y}",
    description: "年份，4位数",
    placeholderB: "{y}",
    descriptionB: "年份，2位数"
  },
  {
    placeholder: "{m}",
    description: "月份(01-12)",
    placeholderB: "{d}",
    descriptionB: "日期(01-31)"
  },
  {
    placeholder: "{h}",
    description: "小时(00-23)",
    placeholderB: "{i}",
    descriptionB: "分钟(00-59)"
  },
  {
    placeholder: "{s}",
    description: "秒(00-59)",
    placeholderB: "{ms}",
    descriptionB: "毫秒(000-999)"
  },
  {
    placeholder: "{timestamp}",
    description: "时间戳（毫秒）",
    placeholderB: "{uuid}",
    descriptionB: "uuid字符串"
  },
  {
    placeholder: "{md5}",
    description: "md5",
    placeholderB: "{md5-16}",
    descriptionB: "md5前16位"
  },
  {
    placeholder: "{str-number}",
    description: "number位随机字符串",
    placeholderB: "{filename}",
    descriptionB: "原文件名"
  }
];
const buildInRenameFormatTable = [
  {
    placeholder: "{Y}",
    description: "年份，4位数",
    placeholderB: "{timestamp}",
    descriptionB: "时间戳（毫秒）"
  },
  {
    placeholder: "{y}",
    description: "年份，2位数",
    placeholderB: "{md5}",
    descriptionB: "md5"
  },
  {
    placeholder: "{m}",
    description: "月份(01-12)",
    placeholderB: "{md5-16}",
    descriptionB: "md5前16位"
  },
  {
    placeholder: "{d}",
    description: "日期(01-31)",
    placeholderB: "{localFolder:<number>}",
    descriptionB: "本地文件夹层级"
  },
  {
    placeholder: "{h}",
    description: "小时(00-23)",
    placeholderB: "{uuid}",
    descriptionB: "uuid字符串"
  },
  {
    placeholder: "{i}",
    description: "分钟(00-59)",
    placeholderB: "{filename}",
    descriptionB: "原文件名"
  },
  {
    placeholder: "{s}",
    description: "秒(00-59)",
    placeholderB: "{str-number}",
    descriptionB: "number位随机字符串"
  },
  {
    placeholder: "{ms}",
    description: "毫秒(000-999)"
  }
];
export {
  customStrMatch as a,
  formatFileName as b,
  customRenameFormatTable as c,
  formatLink as d,
  customStrReplace as e,
  formatFileSize as f,
  getFileIconPath as g,
  formObjToTableData as h,
  isValidUrl as i,
  buildInRenameFormatTable as j,
  renameFile as r,
  svg as s,
  v4 as v
};
