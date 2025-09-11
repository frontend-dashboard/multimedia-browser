import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { dialog } from 'electron'
import fs from 'fs/promises'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 放宽安全限制以允许加载本地文件
      webSecurity: false,
      allowRunningInsecureContent: true,
      // 启用Node.js集成
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 在开发模式下自动打开开发者工具，便于调试
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 注册自定义协议 'media-file' 来处理本地媒体文件
  protocol.registerFileProtocol('media-file', (request, callback) => {
    // 从URL中提取文件路径
    const url = request.url.replace('media-file://', '')
    // 解码URL编码的字符
    const filePath = decodeURIComponent(url)
    console.log('通过自定义协议请求的文件:', filePath)
    // 回调函数返回文件路径
    callback(filePath)
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 处理打开目录对话框
  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择媒体文件目录'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // 处理获取目录下的文件
  ipcMain.handle('get-files-in-directory', async (_, directoryPath) => {
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true })

      // 过滤文件类型
      const supportedExtensions = {
        images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
        videos: ['mp4', 'avi', 'mov', 'mkv', 'wmv'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'aac']
      }

      const files = []

      for (const entry of entries) {
        if (!entry.isFile()) continue

        const fileName = entry.name
        const filePath = join(directoryPath, fileName)

        try {
          // 获取文件信息
          const stats = await fs.stat(filePath)

          // 确定文件类型
          let fileType = 'other'
          const extension = fileName.toLowerCase().split('.').pop()

          for (const [type, extensions] of Object.entries(supportedExtensions)) {
            if (extensions.includes(extension)) {
              fileType = type
              break
            }
          }

          files.push({
            name: fileName,
            path: filePath,
            size: stats.size,
            type: fileType,
            modifiedTime: stats.mtimeMs
          })
        } catch (error) {
          console.warn(`无法读取文件信息: ${filePath}`, error)
        }
      }

      return files
    } catch (error) {
      console.error('读取目录内容失败:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
