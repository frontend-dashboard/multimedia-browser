import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElIcons from '@element-plus/icons-vue'

const app = createApp(App)
const pinia = createPinia()

// 注册所有Element Plus图标
for (const name in ElIcons) {
  app.component(name, ElIcons[name])
}

app.use(router)
app.use(pinia)
app.use(ElementPlus)

app.mount('#app')
