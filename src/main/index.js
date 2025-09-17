import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
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
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    ...(process.platform === 'darwin' ? { icon: join(__dirname, '../../build/icon.icns') } : {}),
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

  // 存储已打开的浏览器实例
  const activeBrowsers = new Map()

  // 辅助函数：解析窗口大小
  function parseWindowSize(windowSize) {
    let viewportSize = { width: 1920, height: 1080 }
    if (windowSize) {
      const [width, height] = windowSize.split(',').map(Number)
      if (!isNaN(width) && !isNaN(height)) {
        viewportSize = { width, height }
      }
    }
    return viewportSize
  }

  // 通用错误处理辅助函数
  function withErrorHandling(asyncFunction) {
    return async function (...args) {
      try {
        return await asyncFunction(...args)
      } catch (error) {
        console.error('操作执行出错:', error)
        return {
          success: false,
          error: error.message || '未知错误'
        }
      }
    }
  }

  // 检查浏览器实例的辅助函数
  function getValidBrowserInstance(browserId) {
    if (!activeBrowsers.has(browserId)) {
      console.warn(`未找到浏览器实例: ${browserId}`)
      return { valid: false, result: { success: false, error: '未找到指定的浏览器实例' } }
    }

    const browserInstance = activeBrowsers.get(browserId)
    const context = browserInstance.context
    const pages = context.pages()

    if (pages.length === 0) {
      return { valid: false, result: { success: false, error: '没有找到活动页面' } }
    }

    return { valid: true, browserInstance, context, page: pages[0] }
  }

  // 浏览器自动化API
  const browserAutomation = {
    // 添加runNode方法作为runBrowserNode的别名，确保与preload中的调用匹配
    runNode: withErrorHandling(async (params) => {
      return await browserAutomation.runBrowserNode(params)
    }),

    // 运行浏览器节点
    runBrowserNode: withErrorHandling(async function (params) {
      const {
        url,
        browserType = 'chromium',
        headless = false,
        incognito = false,
        openMode = 'new',
        waitUntil = 'networkidle',
        windowSizeParam = '1920,1080'
      } = params

      // 创建可变的窗口大小变量
      let windowSize = windowSizeParam

      // 转换浏览器类型到Playwright支持的格式
      const playwrightBrowserType =
        browserType.toLowerCase() === 'firefox'
          ? 'firefox'
          : browserType.toLowerCase() === 'webkit'
            ? 'webkit'
            : 'chromium' // Edge也使用chromium

      // 检查是否已存在相同类型的浏览器实例，且openMode为useExisting
      if (openMode === 'useExisting') {
        for (const [id, instance] of activeBrowsers.entries()) {
          if (instance.type === playwrightBrowserType && !instance.isIncognito) {
            console.log(`复用现有浏览器实例: ${id}`)

            // 如果提供了URL，则导航到该URL
            if (url) {
              const context = instance.context
              const pages = await context.pages()
              if (pages.length > 0) {
                const page = pages[0]
                await page.goto(url, { waitUntil })
              }
            }

            return {
              success: true,
              message: '成功复用现有浏览器实例',
              browserId: id,
              url: url || 'about:blank'
            }
          }
        }

        // 如果没有找到匹配的浏览器实例，继续创建新的
        console.log('未找到可复用的浏览器实例，创建新实例')
      }

      // 启动浏览器
      console.log(
        `启动浏览器: ${playwrightBrowserType}, 无头模式: ${headless}, 隐身模式: ${incognito}，窗口大小: ${windowSize}`
      )

      // 添加是否保持浏览器打开的参数，默认为true
      const keepOpen = params.keepOpen !== false // 默认为true，除非明确设置为false
      // 辅助函数：设置浏览器图标启动参数
      function setupBrowserIconArgs(args, browserType) {
        if (browserType !== 'chromium') return args

        try {
          const os = require('os')
          const platform = os.platform()
          const fs = require('fs')

          // 根据操作系统选择合适的图标文件
          const iconPath =
            platform === 'darwin'
              ? join(__dirname, '../../build/icon.icns')
              : join(__dirname, '../../build/icon.png')

          // 调试信息
          console.log(`当前操作系统: ${platform}`)
          console.log(`尝试设置浏览器图标路径: ${iconPath}`)

          // 验证图标文件是否存在
          const fileExists = fs.existsSync(iconPath)
          console.log(`图标文件是否存在: ${fileExists}`)

          if (fileExists) {
            // 根据平台添加图标相关参数
            if (platform === 'darwin') {
              args.push(`--app=${url || 'about:blank'}`)
              args.push(`--icon=${iconPath}`)
              args.push('--use-mock-keychain')
              args.push('--no-first-run')
              args.push('--disable-features=AlternatePageFavicon')
            } else {
              args.push(`--app-icon=${iconPath}`)
              args.push(`--window-icon=${iconPath}`)
            }

            // 通用参数
            args.push(`--class=MultimediaBrowser`)
            args.push('--disable-extensions')
            args.push('--disable-default-apps')
          } else {
            console.warn('警告: 图标文件不存在，无法设置浏览器图标')
          }
        } catch (error) {
          console.error('设置浏览器图标时出错:', error)
        }

        return args
      }

      // 准备浏览器启动参数
      const launchArgs = setupBrowserIconArgs(
        [
          '--disable-blink-features=AutomationControlled',
          '--start-maximized',
          `--window-size=${windowSize}`
        ],
        playwrightBrowserType
      )

      // 打印最终的启动参数，以便调试
      console.log('浏览器启动参数:', launchArgs)

      // 启动浏览器时设置ignoreDefaultArgs来禁用一些可能干扰图标的默认参数
      const browser = await playwright[playwrightBrowserType].launch({
        headless: headless, // 使用传入的无头模式参数
        slowMo: 100, // 添加小延迟，便于观察
        args: launchArgs
      })

      // 如果需要无头模式但没有设置窗口大小，可以在这里设置默认窗口大小
      if (headless && !windowSize) {
        windowSize = '1920,1080'
      }

      // 处理无痕模式
      let context
      let isIncognito = false

      if (incognito) {
        // 创建真正的无痕上下文
        const viewportSize = parseWindowSize(windowSize)

        context = await browser.newContext({
          incognito: true, // 明确启用无痕模式
          viewport: viewportSize
        })
        isIncognito = true
      } else {
        // 获取默认上下文，如果没有则创建一个
        const contexts = browser.contexts()
        if (contexts && contexts.length > 0) {
          context = contexts[0]
        } else {
          // 如果没有默认上下文，创建一个新的
          // 解析windowSize字符串为viewport对象
          let viewportSize = parseWindowSize(windowSize)

          context = await browser.newContext({
            viewport: viewportSize
          })
        }
      }

      // 根据openMode处理窗口大小
      let processedWindowSize
      if (windowSize && typeof windowSize === 'object') {
        processedWindowSize = windowSize
      } else {
        // 处理字符串值的窗口大小
        switch (windowSize) {
          case 'maximized':
            processedWindowSize = { maximize: true }
            break
          case 'fullscreen':
            processedWindowSize = { fullscreen: true }
            break
          default:
            processedWindowSize = { width: 1920, height: 1080 }
        }
      }

      // 创建页面
      let page
      if (context.pages().length > 0) {
        page = context.pages()[0]
      } else {
        page = await context.newPage()
      }

      // 设置窗口大小
      if (processedWindowSize.maximize) {
        await page.bringToFront()
        await page.setViewportSize({ width: 1920, height: 1080 })
      } else if (processedWindowSize.fullscreen) {
        await page.bringToFront()
        await page.setViewportSize({ width: 1920, height: 1080 })
        // Playwright没有直接的全屏API，需要通过页面操作来实现
      } else if (processedWindowSize.width && processedWindowSize.height) {
        await page.setViewportSize({
          width: processedWindowSize.width,
          height: processedWindowSize.height
        })
      }

      // 导航到URL
      const navigationUrl = url || 'https://www.example.com'
      console.log(`导航到URL: ${navigationUrl}`)
      await page.goto(navigationUrl, { waitUntil })

      // 如果不需要保持浏览器打开，则不进行等待
      if (!keepOpen) {
        // 不做任何等待，让浏览器自然关闭
      } else {
        // 添加一些等待时间，让用户有机会查看图标效果
        console.log('浏览器已启动，保持打开状态以观察图标效果...')
        // 注意：在实际应用中，应该设置一个事件监听器来处理页面关闭事件
      }

      // 生成唯一的浏览器ID
      const browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 监听页面关闭事件，如果所有页面都关闭，则自动关闭浏览器
      page.on('close', async () => {
        const remainingPages = context.pages()
        if (remainingPages.length === 0) {
          console.log(`浏览器实例 ${browserId} 的所有页面都已关闭，正在关闭浏览器`)
          await browser.close()
          activeBrowsers.delete(browserId)

          // 通知所有渲染进程浏览器已关闭
          try {
            const windows = BrowserWindow.getAllWindows()
            windows.forEach((window) => {
              window.webContents.send('browser-closed', { browserId })
            })
          } catch (error) {
            console.error('发送浏览器关闭通知失败:', error)
          }
        }
      })

      // 存储浏览器实例
      activeBrowsers.set(browserId, {
        browser,
        context,
        type: playwrightBrowserType,
        isIncognito,
        _browserContextId: browserId
      })

      console.log(`浏览器实例创建成功: ${browserId}`)

      return {
        success: true,
        message: '成功启动浏览器',
        browserId: browserId,
        url: navigationUrl,
        browserType: playwrightBrowserType
      }
    }),

    // 关闭浏览器
    closeBrowser: withErrorHandling(async (browserId) => {
      if (!activeBrowsers.has(browserId)) {
        console.warn(`未找到浏览器实例: ${browserId}`)
        return { success: false, error: '未找到指定的浏览器实例' }
      }

      const browserInstance = activeBrowsers.get(browserId)
      await browserInstance.browser.close()
      activeBrowsers.delete(browserId)
      console.log(`成功关闭浏览器实例: ${browserId}`)

      // 通知所有渲染进程浏览器已关闭
      try {
        const windows = BrowserWindow.getAllWindows()
        windows.forEach((window) => {
          window.webContents.send('browser-closed', { browserId })
        })
      } catch (error) {
        console.error('发送浏览器关闭通知失败:', error)
      }
      return { success: true }
    }),

    // 获取页面元素
    getPageElements: withErrorHandling(async (params) => {
      const { browserId, selector, timeout = 30000 } = params

      const instanceCheck = getValidBrowserInstance(browserId)
      if (!instanceCheck.valid) {
        return instanceCheck.result
      }

      const { page } = instanceCheck
      console.log(`获取页面元素: 浏览器ID=${browserId}, 选择器=${selector}`)

      // 等待元素出现
      await page.waitForSelector(selector, { timeout })

      // 获取所有匹配的元素
      const elements = await page.$$(selector)
      const elementDetails = []

      for (const element of elements) {
        try {
          // 获取元素的基本信息
          const text = await element.textContent()
          const tagName = await element.evaluate((el) => el.tagName.toLowerCase())
          const attributes = await element.evaluate((el) => {
            const attrs = {}
            for (let i = 0; i < el.attributes.length; i++) {
              attrs[el.attributes[i].name] = el.attributes[i].value
            }
            return attrs
          })

          // 获取元素的位置和大小
          const boundingBox = await element.boundingBox()

          elementDetails.push({
            text,
            tagName,
            attributes,
            boundingBox,
            index: elementDetails.length
          })
        } catch (error) {
          console.warn('获取元素信息时出错:', error)
        }
      }

      console.log(`成功获取 ${elementDetails.length} 个元素`)
      return {
        success: true,
        elements: elementDetails
      }
    }),

    // 点击元素
    clickElement: withErrorHandling(async (params) => {
      const {
        browserId,
        selector,
        waitForNavigation = false,
        timeout = 60000,
        retryCount = 2,
        retryDelay = 1000,
        dryRun = false
      } = params
      console.log('clickElement params: ', { browserId, selector, timeout })

      const instanceCheck = getValidBrowserInstance(browserId)
      if (!instanceCheck.valid) {
        return instanceCheck.result
      }

      const { page } = instanceCheck
      console.log(
        `点击元素: 浏览器ID=${browserId}, 选择器=${selector}, 等待导航=${waitForNavigation}, dryRun=${dryRun}, 超时=${timeout}ms`
      )

      // 添加更多调试信息
      const currentUrl = await page.url()
      console.log(`当前页面URL: ${currentUrl}`)

      // 尝试列出页面上的所有textarea元素，帮助诊断选择器问题
      try {
        const textareas = await page.$$('textarea')
        console.log(`页面上找到 ${textareas.length} 个textarea元素`)

        // 获取前3个textarea的id和class信息
        for (let i = 0; i < Math.min(3, textareas.length); i++) {
          const id = await textareas[i].getAttribute('id')
          const className = await textareas[i].getAttribute('class')
          console.log(`Textarea ${i + 1}: id="${id}", class="${className}"`)
        }
      } catch (err) {
        console.log('获取textarea信息时出错:', err.message)
      }

      // 等待元素出现，带重试机制
      let retries = 0
      let elementFound = false
      while (retries <= retryCount && !elementFound) {
        try {
          await page.waitForSelector(selector, { timeout })
          elementFound = true
          break
        } catch (err) {
          retries++
          if (retries > retryCount) {
            throw new Error(`元素未找到（已重试${retryCount}次）: ${selector} - ${err.message}`)
          }
          console.log(`重试查找元素 ${selector}，第${retries}次尝试...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      // 如果不是dryRun模式，则执行点击操作
      if (!dryRun) {
        // 如果需要等待导航完成
        if (waitForNavigation) {
          const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle' })
          await page.click(selector)
          await navigationPromise
        } else {
          await page.click(selector)
        }
        console.log(`成功点击元素: ${selector}`)
      } else {
        console.log(`dryRun模式，已确认元素存在: ${selector}`)
      }

      return { success: true }
    }),

    // 输入文本
    inputText: withErrorHandling(async (params) => {
      const {
        browserId,
        selector,
        text,
        clearBefore = true,
        timeout = 60000,
        retryCount = 2,
        retryDelay = 1000
      } = params

      const instanceCheck = getValidBrowserInstance(browserId)
      if (!instanceCheck.valid) {
        return instanceCheck.result
      }

      const { page } = instanceCheck
      console.log(
        `输入文本: 浏览器ID=${browserId}, 选择器=${selector}, 文本=${text}, clearBefore=${clearBefore}, 超时=${timeout}ms`
      )

      // 等待元素出现，带重试机制
      let retries = 0
      let elementFound = false
      while (retries <= retryCount && !elementFound) {
        try {
          await page.waitForSelector(selector, { timeout })
          elementFound = true
          break
        } catch (err) {
          retries++
          if (retries > retryCount) {
            throw new Error(`元素未找到（已重试${retryCount}次）: ${selector} - ${err.message}`)
          }
          console.log(`重试查找元素 ${selector}，第${retries}次尝试...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      // 根据clearBefore决定输入方式
      if (clearBefore) {
        // 清空并输入文本
        await page.fill(selector, text)
      } else {
        // 不清空，直接添加文本
        await page.type(selector, text)
      }

      console.log(`成功输入文本: ${text}`)
      return { success: true }
    }),

    // 提取数据
    extractData: withErrorHandling(async (params) => {
      const {
        browserId,
        selector,
        extractType = 'text',
        timeout = 30000,
        attribute,
        attributeName
      } = params

      const instanceCheck = getValidBrowserInstance(browserId)
      if (!instanceCheck.valid) {
        return instanceCheck.result
      }

      const { page } = instanceCheck
      console.log(`提取数据: 浏览器ID=${browserId}, 选择器=${selector}, 提取类型=${extractType}`)

      // 等待元素出现
      await page.waitForSelector(selector, { timeout })

      let extractedData

      switch (extractType) {
        case 'text':
          extractedData = await page.textContent(selector)
          break
        case 'html':
          extractedData = await page.innerHTML(selector)
          break
        case 'attribute': {
          // 如果是属性，优先使用attribute参数，其次使用attributeName参数
          const attrName = attribute || attributeName || 'href'
          extractedData = await page.getAttribute(selector, attrName)
          break
        }
        case 'value':
          extractedData = await page.inputValue(selector)
          break
        default:
          extractedData = await page.textContent(selector)
      }

      console.log(`成功提取数据，长度: ${extractedData ? extractedData.length : 0}`)
      return {
        success: true,
        data: extractedData
      }
    }),

    // 保存文件
    saveFile: withErrorHandling(async (params) => {
      const { filePath, content } = params

      // 处理波浪号路径
      const resolvedPath = filePath.replace(/^~/, process.env.HOME || process.env.USERPROFILE)
      console.log(`保存文件到: ${resolvedPath}`)

      // 确保content不是undefined
      const safeContent = content || ''

      // 确保目录存在
      const dirPath = join(resolvedPath, '..')
      await fs.mkdir(dirPath, { recursive: true })

      // 写入文件
      await fs.writeFile(resolvedPath, safeContent, 'utf8')

      console.log(`文件保存成功: ${resolvedPath}`)
      return { success: true, filePath: resolvedPath }
    })
  }

  // 注册IPC处理程序
  ipcMain.handle('browser-automation-run-node', async (_, params) => {
    return await browserAutomation.runNode(params)
  })

  ipcMain.handle('browser-automation-close-browser', async (_, browserId) => {
    return await browserAutomation.closeBrowser(browserId)
  })

  // 处理获取页面元素
  ipcMain.handle('browser-automation-get-page-elements', async (_, params) => {
    return await browserAutomation.getPageElements(params)
  })

  // 处理点击元素
  ipcMain.handle('browser-automation-click-element', async (_, params) => {
    return await browserAutomation.clickElement(params)
  })

  // 处理输入文本
  ipcMain.handle('browser-automation-input-text', async (_, params) => {
    return await browserAutomation.inputText(params)
  })

  // 处理提取数据
  ipcMain.handle('browser-automation-extract-data', async (_, params) => {
    return await browserAutomation.extractData(params)
  })

  // 处理保存文件
  ipcMain.handle('browser-automation-save-file', async (_, params) => {
    return await browserAutomation.saveFile(params)
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
  ipcMain.handle(
    'get-video-thumbnail',
    withErrorHandling(async (_, videoPath) => {
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
    })
  )

  // 处理获取目录下的文件
  ipcMain.handle(
    'get-files-in-directory',
    withErrorHandling(async (_, directoryPath) => {
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

      return { success: true, files }
    })
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed on all platforms
app.on('window-all-closed', () => {
  app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
