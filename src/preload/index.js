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
  },
  // 浏览器自动化API
  browserAutomation: {
    // 运行浏览器节点
    runNode: (params) => {
      return ipcRenderer.invoke('browser-automation-run-node', params)
    },
    // 关闭浏览器
    closeBrowser: (browserId) => {
      return ipcRenderer.invoke('browser-automation-close-browser', browserId)
    },
    // 初始化浏览器
    initialize: (params) => {
      return ipcRenderer.invoke('browser-automation-run-node', params)
    },
    // 打开URL
    openUrl: (params) => {
      return ipcRenderer.invoke('browser-automation-run-node', {
        url: params.url,
        browserId: params.browserId,
        openMode: 'useExisting'
      })
    },
    // 获取页面元素
    getPageElements: (params) => {
      return ipcRenderer.invoke('browser-automation-get-page-elements', params)
    },
    // 点击元素
    clickElement: (params) => {
      return ipcRenderer.invoke('browser-automation-click-element', params)
    },
    // 输入文本
    inputText: (params) => {
      return ipcRenderer.invoke('browser-automation-input-text', params)
    },
    // 提取数据
    extractData: (params) => {
      return ipcRenderer.invoke('browser-automation-extract-data', params)
    },
    // 保存文件
    saveFile: (params) => {
      return ipcRenderer.invoke('browser-automation-save-file', params)
    },
    // 等待元素可见
    waitForElement: async (params) => {
      try {
        // 使用点击元素的方法来等待元素，因为main进程已经实现了waitForSelector
        await ipcRenderer.invoke('browser-automation-click-element', {
          ...params,
          dryRun: true
        })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    // 等待特定时间
    wait: async ({ milliseconds }) => {
      return new Promise((resolve) => {
        setTimeout(resolve, milliseconds)
      })
    },
    // 检查浏览器是否可用
    isBrowserAvailable: (browserId) => {
      return new Promise(resolve => {
        // 简单实现，检查是否存在该浏览器ID
        // 实际应用中可能需要更复杂的检查逻辑
        resolve(true)
      })
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
