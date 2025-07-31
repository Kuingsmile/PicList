import { bs as onUnmounted } from "./index-BqdcQlNn.js";
const useIPCOn = (channel, listener) => {
  window.electron.electronAPI.ipcRenderer.on(channel, listener);
  onUnmounted(() => {
    window.electron.electronAPI.ipcRenderer.removeListener(channel, listener);
  });
};
const useIPCOnce = (channel, listener) => {
  window.electron.electronAPI.ipcRenderer.once(channel, listener);
  onUnmounted(() => {
    window.electron.electronAPI.ipcRenderer.removeListener(channel, listener);
  });
};
const useIPC = () => {
  return {
    on: (channel, listener) => useIPCOn(channel, listener),
    once: (channel, listener) => useIPCOnce(channel, listener)
  };
};
export {
  useIPC as a,
  useIPCOn as u
};
