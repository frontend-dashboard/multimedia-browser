import { v4 as uuidv4 } from 'uuid'

class BrowserAutomation {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.process?.type === 'renderer'
    this.events = new Map()
    this.browserInstances = new Map()
    this.playwright = null

    // 注意：在纯浏览器环境中，无法导入和使用Node.js的Playwright库
    // 这里只在Electron的渲染进程中尝试使用Playwright
    // 在开发环境的浏览器中，我们将使用模拟模式
    if (process.env.NODE_ENV === 'development') {
      console.log('在开发环境中使用浏览器模式，将使用模拟功能')
    }
  }

  // 初始化浏览器
  async initialize(params = {}) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器
        if (this.playwright) {
          const {
            browserType = 'chrome',
            headless = false,
            incognito = false,
            windowSize = 'default'
          } = params
          const playwrightBrowserType = browserType === 'chrome' ? 'chromium' : browserType

          // 检查Playwright是否支持指定的浏览器类型
          if (this.playwright[playwrightBrowserType]) {
            console.log(`在开发环境中使用Playwright打开${playwrightBrowserType}浏览器`)

            // 设置浏览器启动选项
            const launchOptions = {
              headless: headless,
              slowMo: 100,
              timeout: 30000
            }

            let browser
            let context

            // 根据浏览器类型启动
            if (incognito) {
              // 启动普通浏览器然后创建隐身上下文
              browser = await this.playwright[playwrightBrowserType].launch(launchOptions)
              context = await browser.newContext({ incognito: true })
            } else {
              // 直接启动浏览器
              browser = await this.playwright[playwrightBrowserType].launch(launchOptions)
              context = await browser.newContext()
            }

            // 创建新页面
            const page = await context.newPage()

            // 根据windowSize设置窗口状态
            if (windowSize === 'maximized') {
              await page.maximize()
            } else if (windowSize === 'fullscreen') {
              await page.fullscreen()
            }

            // 生成浏览器ID
            const browserId = uuidv4()

            // 存储浏览器实例信息
            this.browserInstances.set(browserId, {
              browser: browser,
              context: context,
              browserType: playwrightBrowserType,
              incognito: incognito
            })

            // 监听浏览器关闭事件，自动从活动浏览器列表中移除
            browser.on('disconnected', () => {
              this.browserInstances.delete(browserId)
              console.log(`浏览器已关闭，从活动列表中移除: ${browserId}`)
            })

            return { success: true, browserId: browserId }
          } else {
            console.warn(`Playwright不支持浏览器类型: ${playwrightBrowserType}`)
            // 如果不支持，回退到模拟模式
            console.log('使用模拟浏览器初始化')
            return { success: true, browserId: 'mock-browser' }
          }
        } else {
          // 如果Playwright未加载成功，使用模拟模式
          console.log('使用模拟浏览器初始化')
          return { success: true, browserId: 'mock-browser' }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.initialize(params)
      }

      throw new Error('浏览器初始化失败')
    } catch (error) {
      console.error('浏览器初始化失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 打开URL
  async openUrl({ browserId, url, newTab = false }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context

          console.log(`在开发环境中使用Playwright打开URL: ${url}`)

          let page

          if (newTab) {
            // 在新标签页中打开
            page = await context.newPage()
          } else {
            // 获取当前页面
            const pages = await context.pages()
            page = pages.length > 0 ? pages[0] : await context.newPage()
          }

          // 导航到URL
          await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000
          })

          console.log(`URL已成功打开: ${url}`)
          return { success: true }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟打开URL:', url)
          return { success: true }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.openUrl({ browserId, url, newTab })
      }

      throw new Error('打开URL失败')
    } catch (error) {
      console.error('打开URL失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 关闭浏览器
  async closeBrowser(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试关闭真实的Playwright浏览器
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          console.log(`在开发环境中使用Playwright关闭浏览器实例: ${browserId}`)
          await browserInstance.browser.close()
          this.browserInstances.delete(browserId)
          console.log(`浏览器实例已成功关闭: ${browserId}`)
          return { success: true }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟关闭浏览器')
          return { success: true }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.closeBrowser(browserId)
      }

      throw new Error('关闭浏览器失败')
    } catch (error) {
      console.error('关闭浏览器失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 点击元素
  async clickElement({
    browserId,
    selector,
    waitForNavigation = false,
    dryRun = false,
    timeout = 30000
  }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行点击操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context
          const pages = await context.pages()

          if (pages.length === 0) {
            return { success: false, error: '没有找到活动页面' }
          }

          const page = pages[0]
          console.log(`在开发环境中使用Playwright${dryRun ? '检查' : '点击'}元素: ${selector}`)

          // 等待元素出现
          await page.waitForSelector(selector, { timeout })

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
            console.log(`元素已成功点击: ${selector}`)
          } else {
            console.log(`dryRun模式，已确认元素存在: ${selector}`)
          }

          return { success: true }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟点击元素:', selector)
          return { success: true }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.clickElement({
          browserId,
          selector,
          waitForNavigation,
          dryRun,
          timeout
        })
      }

      throw new Error('点击元素失败')
    } catch (error) {
      console.error('点击元素失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 输入文本
  async inputText({ browserId, selector, text, timeout = 30000 }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行输入文本操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context
          const pages = await context.pages()

          if (pages.length === 0) {
            return { success: false, error: '没有找到活动页面' }
          }

          const page = pages[0]
          console.log(`在开发环境中使用Playwright输入文本到元素: ${selector}`)

          // 等待元素出现并输入文本
          await page.waitForSelector(selector, { timeout })
          await page.fill(selector, text)

          console.log(`文本已成功输入: ${text}`)
          return { success: true }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟输入文本到元素:', selector)
          return { success: true }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.inputText({
          browserId,
          selector,
          text,
          timeout
        })
      }

      throw new Error('输入文本失败')
    } catch (error) {
      console.error('输入文本失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 提取数据
  async extractData({
    browserId,
    selector,
    extractType = 'text',
    attribute = '',
    timeout = 30000
  }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行数据提取操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context
          const pages = await context.pages()

          if (pages.length === 0) {
            return { success: false, error: '没有找到活动页面' }
          }

          const page = pages[0]
          console.log(
            `在开发环境中使用Playwright提取数据: 选择器=${selector}, 提取类型=${extractType}`
          )

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
            case 'attribute':
              extractedData = await page.getAttribute(selector, attribute || 'href')
              break
            case 'value':
              extractedData = await page.inputValue(selector)
              break
            default:
              extractedData = await page.textContent(selector)
          }

          console.log(`成功提取数据，长度: ${extractedData ? extractedData.length : 0}`)
          return { success: true, data: extractedData }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟提取数据:', selector)
          // 模拟数据返回
          const mockData =
            extractType === 'text'
              ? '模拟提取的文本数据'
              : extractType === 'attribute'
                ? '模拟属性值'
                : extractType === 'html'
                  ? '<div>模拟HTML内容</div>'
                  : '模拟数据'
          return { success: true, data: mockData }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.extractData({
          browserId,
          selector,
          extractType,
          attribute,
          timeout
        })
      }

      throw new Error('提取数据失败')
    } catch (error) {
      console.error('提取数据失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 选择下拉菜单选项
  async selectOption({ browserId, selector, value, label }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟选择下拉菜单选项:', value || label)
        return { success: true }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.selectOption({
          browserId,
          selector,
          value,
          label
        })
      }

      throw new Error('选择下拉菜单选项失败')
    } catch (error) {
      console.error('选择下拉菜单选项失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 滚动页面
  async scrollPage({ browserId, selector, x = 0, y = 0, behavior = 'smooth' }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟滚动页面')
        return { success: true }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.scrollPage({
          browserId,
          selector,
          x,
          y,
          behavior
        })
      }

      throw new Error('滚动页面失败')
    } catch (error) {
      console.error('滚动页面失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 刷新页面
  async refreshPage(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟刷新页面')
        return { success: true }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.refreshPage(browserId)
      }

      throw new Error('刷新页面失败')
    } catch (error) {
      console.error('刷新页面失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 悬停元素
  async hoverElement({ browserId, selector }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟悬停元素:', selector)
        return { success: true }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.hoverElement({ browserId, selector })
      }

      throw new Error('悬停元素失败')
    } catch (error) {
      console.error('悬停元素失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取当前URL
  async getCurrentUrl(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟获取当前URL')
        return { success: true, url: 'https://example.com/mock-url' }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.getCurrentUrl(browserId)
      }

      throw new Error('获取当前URL失败')
    } catch (error) {
      console.error('获取当前URL失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取页面标题
  async getPageTitle(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟获取页面标题')
        return { success: true, title: '模拟页面标题' }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.getPageTitle(browserId)
      }

      throw new Error('获取页面标题失败')
    } catch (error) {
      console.error('获取页面标题失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 截图
  async takeScreenshot({ browserId, selector = '', path = '' }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟截图')
        return { success: true, screenshotPath: '/mock/screenshot.png' }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.takeScreenshot({ browserId, selector, path })
      }

      throw new Error('截图失败')
    } catch (error) {
      console.error('截图失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 等待元素可见
  async waitForElement({ browserId, selector, timeout = 5000 }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行等待元素操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context
          const pages = await context.pages()

          if (pages.length === 0) {
            return { success: false, error: '没有找到活动页面' }
          }

          console.log(`在开发环境中使用Playwright等待元素可见: ${selector}`)

          // 使用clickElement的dryRun模式来等待元素可见
          await this.clickElement({ browserId, selector, dryRun: true, timeout })

          console.log(`元素已可见: ${selector}`)
          return { success: true }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟等待元素可见:', selector)
          return { success: true }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.waitForElement({
          browserId,
          selector,
          timeout
        })
      }

      throw new Error('等待元素可见失败')
    } catch (error) {
      console.error('等待元素可见失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 等待特定时间
  async wait({ browserId, milliseconds }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟等待:', milliseconds, '毫秒')
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: true }), milliseconds)
        })
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.wait({ browserId, milliseconds })
      }

      throw new Error('等待失败')
    } catch (error) {
      console.error('等待失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 执行JavaScript代码
  async executeJavaScript({ browserId, code, args = [] }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟执行JavaScript代码')
        return { success: true, result: '模拟JavaScript执行结果' }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.executeJavaScript({ browserId, code, args })
      }

      throw new Error('执行JavaScript代码失败')
    } catch (error) {
      console.error('执行JavaScript代码失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 事件系统
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => callback(data))
    }
  }

  // 检查浏览器是否可用
  isBrowserAvailable(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        return true
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return window.electron.browserAutomation.isBrowserAvailable(browserId)
      }

      return false
    } catch (error) {
      console.error('检查浏览器可用性失败:', error)
      return false
    }
  }

  // 获取页面实例
  async getPage(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟获取页面实例')
        return { success: true, page: { id: 'mock-page' } }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.getPage(browserId)
      }

      throw new Error('获取页面实例失败')
    } catch (error) {
      console.error('获取页面实例失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取浏览器实例
  async getBrowser(browserId) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        console.log('模拟获取浏览器实例')
        return { success: true, browser: { id: browserId } }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.getBrowser(browserId)
      }

      throw new Error('获取浏览器实例失败')
    } catch (error) {
      console.error('获取浏览器实例失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取页面元素
  async getPageElements({ browserId, selector, extractDetails = false, timeout = 30000 }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行获取页面元素操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          const browserInstance = this.browserInstances.get(browserId)
          const context = browserInstance.context
          const pages = await context.pages()

          if (pages.length === 0) {
            return { success: false, error: '没有找到活动页面' }
          }

          const page = pages[0]
          console.log(`在开发环境中使用Playwright获取页面元素: ${selector}`)

          // 等待元素出现
          await page.waitForSelector(selector, { timeout })

          // 获取所有匹配的元素
          const elements = await page.$$eval(
            selector,
            (nodes, extractDetails) => {
              return nodes.map((node, index) => {
                const baseElement = {
                  text: node.textContent?.trim() || '',
                  href: node.getAttribute('href') || '',
                  innerHTML: node.innerHTML || '',
                  id: node.id || '',
                  className: node.className || '',
                  tagName: node.tagName.toLowerCase(),
                  textContent: node.textContent || ''
                }

                if (extractDetails) {
                  // 提取更多详细信息
                  const attributes = {}
                  for (let i = 0; i < node.attributes.length; i++) {
                    const attr = node.attributes[i]
                    attributes[attr.name] = attr.value
                  }

                  // 生成唯一选择器
                  let selector = ''
                  if (node.id) {
                    selector = `#${node.id}`
                  } else if (node.className) {
                    selector = `.${node.className.split(' ').join('.')}`
                  } else {
                    selector = `${node.tagName.toLowerCase()}:nth-child(${index + 1})`
                  }

                  return {
                    ...baseElement,
                    selector,
                    attributes,
                    outerHTML: node.outerHTML || '',
                    position: {
                      top: node.getBoundingClientRect().top,
                      left: node.getBoundingClientRect().left,
                      width: node.getBoundingClientRect().width,
                      height: node.getBoundingClientRect().height
                    },
                    parentTag: node.parentElement?.tagName.toLowerCase() || '',
                    childCount: node.children.length
                  }
                }

                return baseElement
              })
            },
            extractDetails
          )

          console.log(`成功获取页面元素，数量: ${elements.length}`)
          return { success: true, elements }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟获取页面元素:', selector)
          // 模拟返回元素列表
          const mockElements = [
            {
              tagName: 'div',
              textContent: '模拟元素1',
              id: 'element-1',
              className: 'test-class',
              selector: '#element-1',
              attributes: {
                id: 'element-1',
                class: 'test-class'
              }
            },
            {
              tagName: 'button',
              textContent: '点击按钮',
              id: '',
              className: 'btn btn-primary',
              selector: '.btn.btn-primary',
              attributes: {
                class: 'btn btn-primary',
                type: 'button'
              }
            }
          ]
          return { success: true, elements: mockElements }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.getPageElements({
          browserId,
          selector,
          extractDetails
        })
      }

      throw new Error('获取页面元素失败')
    } catch (error) {
      console.error('获取页面元素失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 已移除元素选择器相关功能

  // 保存文件
  async saveFile({ browserId, data, filePath, format }) {
    try {
      if (process.env.NODE_ENV === 'development' && !this.isElectron) {
        // 尝试使用真实的Playwright浏览器执行文件保存操作
        if (this.playwright && this.browserInstances.has(browserId)) {
          console.log(`在开发环境中保存文件: 路径=${filePath}`)

          try {
            // 在浏览器环境中，我们不能直接写入文件系统
            // 但可以尝试触发文件下载
            // 根据格式设置合适的MIME类型
            let mimeType = 'application/octet-stream'
            if (format === 'json') {
              mimeType = 'application/json'
            } else if (format === 'csv') {
              mimeType = 'text/csv'
            } else if (format === 'txt') {
              mimeType = 'text/plain'
            }

            const blob = new Blob([data], { type: mimeType })
            const urlObject = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = urlObject

            // 确保文件有正确的扩展名
            let fileName = filePath.split('/').pop()
            if (format && !fileName.includes('.')) {
              fileName = `${fileName}.${format}`
            }
            a.download = fileName

            // 模拟点击下载
            document.body.appendChild(a)
            a.click()

            // 清理
            setTimeout(() => {
              document.body.removeChild(a)
              URL.revokeObjectURL(urlObject)
            }, 100)

            console.log(`文件下载已触发: ${fileName}`)
            return {
              success: true,
              message: '文件下载已触发，请在浏览器中完成保存',
              filePath: '/mock/' + filePath
            }
          } catch (error) {
            console.error('文件保存失败:', error)
            throw new Error(`文件保存失败: ${error.message}`)
          }
        } else {
          // 如果Playwright未加载成功或浏览器实例不存在，使用模拟模式
          console.log('模拟保存文件:', filePath)
          return { success: true, filePath: '/mock/' + filePath }
        }
      }

      if (this.isElectron && window.electron.browserAutomation) {
        return await window.electron.browserAutomation.saveFile({
          browserId,
          data,
          filePath,
          format
        })
      }

      throw new Error('保存文件失败')
    } catch (error) {
      console.error('保存文件失败:', error)
      return { success: false, error: error.message }
    }
  }
}

// 导出单例实例
export const browserAutomation = new BrowserAutomation()
export default browserAutomation
