import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // 打开目录选择对话框
  openDirectory: () => {
    return ipcRenderer.invoke('open-directory-dialog')
  },
  // 获取目录下的文件
  getFilesInDirectory: (path) => {
    return ipcRenderer.invoke('get-files-in-directory', path)
  },
  // 获取视频封面
  getVideoThumbnail: (videoPath) => {
    return ipcRenderer.invoke('get-video-thumbnail', videoPath)
  },
  // 获取安全的文件URL（使用自定义协议）
  getSafeFileUrl: (filePath) => {
    try {
      // 使用已注册的'media-file'协议创建安全的URL
      return `media-file://${encodeURIComponent(filePath)}`
    } catch (error) {
      console.error('创建安全文件URL失败:', error)
      return ''
    }
  }
}

// 安全地向渲染器进程暴露API
try {
  contextBridge.exposeInMainWorld('electron', {
    // 只暴露需要的Electron API
    ipcRenderer: {
      invoke: ipcRenderer.invoke,
      on: ipcRenderer.on,
      off: ipcRenderer.off,
      send: ipcRenderer.send
    },
    process: {
      versions: process.versions
    }
  })
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose APIs to renderer process:', error)
}
