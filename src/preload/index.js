import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 打开目录选择对话框
  openDirectory: () => {
    return electronAPI.ipcRenderer.invoke('open-directory-dialog')
  },
  // 获取目录下的文件
  getFilesInDirectory: (path) => {
    return electronAPI.ipcRenderer.invoke('get-files-in-directory', path)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: electronAPI.ipcRenderer,
      process: {
        versions: process.versions
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.electron.process = {
    versions: process.versions
  }
  window.api = api
}
