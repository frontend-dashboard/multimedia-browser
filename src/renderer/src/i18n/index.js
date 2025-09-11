import { createI18n } from 'vue-i18n'

// 导入语言包
import zhCN from './zh-CN.js'
import zhTW from './zh-TW.js'
import enUS from './en-US.js'

// 获取存储的语言设置，如果没有则使用默认语言
const storedLanguage = localStorage.getItem('language') || 'zh-CN'

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: storedLanguage, // 设置当前语言
  fallbackLocale: 'zh-CN', // 设置回退语言
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS
  }
})

export default i18n