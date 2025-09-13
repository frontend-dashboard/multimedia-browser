import './assets/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// 导入Element Plus的基本样式和暗黑模式样式
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElIcons from '@element-plus/icons-vue'
import i18n from './i18n'

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

app.use(router)
app.use(pinia)
app.use(ElementPlus)
app.use(i18n)

app.mount('#app')
