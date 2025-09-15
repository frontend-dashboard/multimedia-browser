import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
// 尝试导入Playwright
let playwright
try {
  playwright = require('playwright')
} catch {
  console.warn('Playwright未安装，将使用系统默认浏览器替代')
}

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
      // 启用web安全策略
      webSecurity: true,
      allowRunningInsecureContent: false,
      // 启用Node.js集成，但保持上下文隔离以提高安全性
      nodeIntegration: true,
      contextIsolation: true
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

  // 存储已打开的浏览器实例
  const activeBrowsers = new Map()

  // 浏览器自动化功能
  const browserAutomation = {
    // 运行浏览器节点
    async runBrowserNode(params) {
      const {
        url,
        openMode = 'useExisting',
        browserType = 'chrome',
        incognito = false,
        windowSize = 'default',
        customWidth = 1280,
        customHeight = 800,
        waitUntil = 'networkidle',
        timeout = 30000
      } = params

      try {
        // 如果Playwright已安装，使用Playwright打开浏览器
        if (playwright) {
          // 转换浏览器类型名称以匹配Playwright的命名约定
          const playwrightBrowserType = browserType === 'chrome' ? 'chromium' : browserType
          
          // 检查Playwright是否支持指定的浏览器类型
          if (!playwright[playwrightBrowserType]) {
            console.warn(`Playwright不支持浏览器类型: ${playwrightBrowserType}`)
            // 使用系统默认浏览器
            const result = await shell.openExternal(url)
            return {
              success: result,
              message: result ? '已使用系统默认浏览器打开URL' : '无法打开URL',
              browserType: 'system'
            }
          }
          
          console.log(
            `使用Playwright打开浏览器: ${playwrightBrowserType}, URL: ${url}, 隐身模式: ${incognito}`
          )

          // 如果选择在已打开的浏览器中打开，检查是否有相同类型的浏览器实例
          if (openMode === 'useExisting') {
            // 查找是否有相同类型且非隐身模式的浏览器实例
            for (const [id, instance] of activeBrowsers.entries()) {
              if (instance.browserType === playwrightBrowserType && !instance.incognito) {
                console.log(`使用已打开的浏览器: ${playwrightBrowserType}, URL: ${url}`)
                try {
                  // 创建新页面
                  const page = await instance.context.newPage()
                  
                  // 根据windowSize设置窗口状态
                  if (windowSize === 'maximized') {
                    await page.maximize()
                  } else if (windowSize === 'fullscreen') {
                    await page.fullscreen()
                  } else if (windowSize === 'custom') {
                    await page.setViewportSize({ width: customWidth, height: customHeight })
                  }
                  
                  // 导航到URL
                  await page.goto(url, {
                    waitUntil: waitUntil,
                    timeout: timeout
                  })
                  
                  return {
                    success: true,
                    message: `已在现有${browserType}浏览器中打开${url}`,
                    browserId: id,
                    windowSize: windowSize
                  }
                } catch (error) {
                  console.error('使用现有浏览器时出错:', error)
                  // 如果出错，继续创建新浏览器
                  break
                }
              }
            }
          }
          
          console.log(`使用Playwright打开浏览器: ${playwrightBrowserType}, URL: ${url}, 隐身模式: ${incognito}`)
          
          // 设置浏览器启动选项
          const launchOptions = {
            headless: false, // 显示浏览器窗口
            slowMo: 100, // 慢动作执行
            timeout: timeout // 设置超时时间
          }

          // 如果选择了隐身模式，使用隐身上下文
          let browser
          let context

          // 根据浏览器类型启动
          if (incognito) {
            // 启动普通浏览器然后创建隐身上下文
            browser = await playwright[playwrightBrowserType].launch(launchOptions)
            context = await browser.newContext({ incognito: true })
          } else {
            // 直接启动浏览器
            browser = await playwright[playwrightBrowserType].launch(launchOptions)
            context = await browser.newContext()
          }

          // 设置窗口大小
          if (windowSize === 'custom') {
            await context.newPage({
              viewport: { width: customWidth, height: customHeight }
            })
          } else {
            // 创建新页面
            const page = await context.newPage()

            // 根据windowSize设置窗口状态
            if (windowSize === 'maximized') {
              await page.maximize()
            } else if (windowSize === 'fullscreen') {
              await page.fullscreen()
            }

            // 导航到URL
            await page.goto(url, {
              waitUntil: waitUntil,
              timeout: timeout
            })

            console.log(`已成功打开URL: ${url}, 窗口模式: ${windowSize}`)
          }

          // 不关闭浏览器，让用户可以交互
          // 注意：在实际应用中，您可能需要实现一个关闭机制
          
          // 存储浏览器实例信息
          const browserId = browser._browserContextId
          activeBrowsers.set(browserId, {
            browser: browser,
            context: context,
            browserType: playwrightBrowserType,
            incognito: incognito
          })

          // 监听浏览器关闭事件，自动从活动浏览器列表中移除
          browser.on('disconnected', () => {
            activeBrowsers.delete(browserId)
            console.log(`浏览器已关闭，从活动列表中移除: ${browserId}`)
          })

          return {
            success: true,
            message: `已使用${browserType}浏览器打开${url}${incognito ? '(隐身模式)' : ''}`,
            browserId: browserId, // 返回浏览器ID以便后续操作
            windowSize: windowSize
          }
        } else {
          // 如果Playwright未安装，使用系统默认浏览器
          console.log('使用系统默认浏览器打开URL:', url)
          const result = await shell.openExternal(url)

          return {
            success: result,
            message: result ? '已使用系统默认浏览器打开URL' : '无法打开URL',
            browserType: 'system'
          }
        }
      } catch (error) {
        console.error('运行浏览器节点时出错:', error)
        return {
          success: false,
          error: error.message
        }
      }
    },

    // 关闭浏览器
    async closeBrowser(browserId) {
      try {
        // 检查是否有指定ID的浏览器实例
        if (activeBrowsers.has(browserId)) {
          const browserInstance = activeBrowsers.get(browserId)
          await browserInstance.browser.close()
          activeBrowsers.delete(browserId)
          console.log(`成功关闭浏览器实例: ${browserId}`)
          return { success: true }
        } else {
          console.warn(`未找到浏览器实例: ${browserId}`)
          return { success: false, error: '未找到指定的浏览器实例' }
        }
      } catch (error) {
        console.error('关闭浏览器时出错:', error)
        return { success: false, error: error.message }
      }
    }
  }

  // 注册IPC处理程序
  ipcMain.handle('browser-automation-run-node', async (_, params) => {
    return await browserAutomation.runBrowserNode(params)
  })

  ipcMain.handle('browser-automation-close-browser', async (_, browserId) => {
    return await browserAutomation.closeBrowser(browserId)
  })

  // 处理打开目录对话框
  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择媒体文件目录'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // 获取视频封面
  ipcMain.handle('get-video-thumbnail', async (_, videoPath) => {
    try {
      // 检查文件是否存在
      await fs.access(videoPath)

      // 方案1: 使用Electron的nativeImage和视频第一帧
      // 注意：这种方法在某些Electron版本中可能不支持
      // 我们先实现一个基本的方案，实际项目中可能需要使用ffmpeg等工具

      // 在实际应用中，您可能需要使用ffmpeg或其他工具来提取视频的第一帧
      // 下面是使用ffmpeg的示例代码（注释形式）

      // 简单方案：尝试使用视频URL作为封面（实际项目中可能需要更复杂的实现）
      // 在实际应用中，您可能需要使用ffmpeg或其他工具来提取视频的第一帧
      // 这里我们先返回一个基本的实现，返回视频本身作为封面（浏览器会自动显示第一帧）

      // 如果您安装了ffmpeg，可以使用以下代码来提取视频封面
      /*
      const ffmpegPath = '/usr/local/bin/ffmpeg'; // 请根据您的实际路径修改

      return new Promise((resolve, reject) => {
        const process = spawn(ffmpegPath, [
          '-i', videoPath,
          '-ss', '00:00:01', // 提取第1秒的帧
          '-vframes', '1',
          '-vf', 'scale=320:-1', // 缩放到宽度320，高度自动
          thumbnailPath
        ]);

        process.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, thumbnailPath });
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      });
      */

      // 基本实现：返回视频路径作为封面
      // 浏览器会尝试显示视频的第一帧作为封面
      return {
        success: true,
        thumbnailUrl: `media-file://${encodeURIComponent(videoPath)}`
      }
    } catch (error) {
      console.error('获取视频封面失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
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
