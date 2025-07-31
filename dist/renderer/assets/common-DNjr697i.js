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
const enforceNumber = (num) => isNaN(+num) ? 0 : +num;
function isNeedToShorten(alias, cutOff = 20) {
  return [...alias].reduce((len, char) => len + (char.charCodeAt(0) > 255 ? 2 : 1), 0) > cutOff;
}
function safeSliceF(str, total) {
  let result = "";
  let totalLen = 0;
  for (const s of str) {
    if (totalLen >= total) {
      break;
    }
    result += s;
    totalLen += s.charCodeAt(0) > 255 ? 2 : 1;
  }
  return result;
}
const formatEndpoint = (endpoint, sslEnabled) => {
  const hasProtocol = /^https?:\/\//.test(endpoint);
  if (!hasProtocol) {
    return `${sslEnabled ? "https" : "http"}://${endpoint}`;
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, "https://") : endpoint.replace(/^https:\/\//, "http://");
};
const trimPath = (path) => path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
export {
  isNeedToShorten as a,
  handleStreamlinePluginName as b,
  enforceNumber as e,
  formatEndpoint as f,
  handleUrlEncode as h,
  isUrl as i,
  safeSliceF as s,
  trimPath as t
};
