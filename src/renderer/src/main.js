import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElIcons from '@element-plus/icons-vue'
import i18n from './i18n'

const app = createApp(App)
const pinia = createPinia()

// 注册所有Element Plus图标
for (const name in ElIcons) {
  app.component(name, ElIcons[name])
}

// 导入主题工具函数
import { initializeTheme } from './utils/themeUtils.js'

// 初始化主题
initializeTheme()

app.use(router)
app.use(pinia)
app.use(ElementPlus)
app.use(i18n)

app.mount('#app')
