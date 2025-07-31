import { m as triggerRPC, j as IRPCActionType, s as sendRPC } from "./index-BqdcQlNn.js";
function saveConfig(config, value) {
  const configObj = typeof config === "string" ? { [config]: value } : config;
  sendRPC(IRPCActionType.MANAGE_SAVE_CONFIG, configObj);
}
async function getConfig(key) {
  return await triggerRPC(IRPCActionType.MANAGE_GET_CONFIG, key);
}
function removeConfig(key, propName) {
  sendRPC(IRPCActionType.MANAGE_REMOVE_CONFIG, key, propName);
}
export {
  getConfig as g,
  removeConfig as r,
  saveConfig as s
};
