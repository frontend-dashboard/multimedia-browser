import './assets/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// 导入Element Plus的基本样式和暗黑模式样式
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// 导入自定义主题变量，确保Element Plus变量被正确定义
import './assets/element-variables.css'
import * as ElIcons from '@element-plus/icons-vue'
import i18n from './i18n'

// 导入日志工具
import logger, { setLogLevel, LOG_LEVELS } from './utils/logger.js'

// 捕获ResizeObserver循环错误
if (window.ResizeObserver) {
  const originalResizeObserver = window.ResizeObserver
  window.ResizeObserver = class ResizeObserver extends originalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        // 使用requestAnimationFrame来防止循环错误
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer)
          } catch (error) {
            if (error.message && error.message.includes('ResizeObserver loop')) {
              console.warn('ResizeObserver循环错误已捕获，不影响功能')
            } else {
              console.error('ResizeObserver错误:', error)
            }
          }
        })
      })
    }
  }
}

const app = createApp(App)
const pinia = createPinia()

// 注册所有Element Plus图标
for (const name in ElIcons) {
  app.component(name, ElIcons[name])
}

// 导入主题工具函数 - 现在使用的是Element Plus主题系统
import { initializeTheme } from './utils/themeUtils.js'

// 初始化Element Plus主题
initializeTheme()

// 设置日志级别 - 开发环境可以设置为DEBUG，生产环境设置为INFO
if (import.meta.env.DEV) {
  setLogLevel(LOG_LEVELS.DEBUG)
  logger.debug('应用启动 - 开发模式')
} else {
  setLogLevel(LOG_LEVELS.INFO)
  logger.info('应用启动 - 生产模式')
}

// 挂载日志工具到Vue实例，便于全局访问
app.config.globalProperties.$logger = logger

// 全局提供日志工具
app.provide('logger', logger)

app.use(router)
app.use(pinia)
app.use(ElementPlus)
app.use(i18n)

// 应用挂载
app.mount('#app')
logger.info('应用挂载完成')
