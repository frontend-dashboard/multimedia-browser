// 主题相关工具函数

/**
 * 获取当前应使用的主题类名
 * @param {string} theme - 主题设置值 ('light', 'dark', 'system')
 * @returns {string} - 'light-theme' 或 'dark-theme'
 */
export const getThemeClass = (theme = null) => {
  // 如果没有提供主题，则从localStorage获取或使用默认值
  const currentTheme = theme || localStorage.getItem('theme') || 'light'

  // 跟随系统模式
  if (currentTheme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme'
  }

  // 手动选择模式
  return currentTheme === 'dark' ? 'dark-theme' : 'light-theme'
}

/**
 * 应用主题到根元素
 * @param {string} theme - 可选，指定要应用的主题
 */
export const applyTheme = (theme = null) => {
  const root = document.documentElement
  const themeClass = getThemeClass(theme)

  // 移除所有主题类
  root.classList.remove('light-theme', 'dark-theme')
  // 添加当前主题类
  root.classList.add(themeClass)

  console.log('应用主题:', themeClass)
}

/**
 * 保存主题设置并应用
 * @param {string} theme - 要保存的主题值
 */
export const saveAndApplyTheme = (theme) => {
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}

/**
 * 初始化主题（应用启动时使用）
 */
export const initializeTheme = () => {
  applyTheme()
}

/**
 * 创建系统主题变化的事件监听器
 * @param {Function} callback - 当系统主题变化且当前设置为系统模式时触发的回调
 * @returns {Function} - 返回一个清理函数，用于移除事件监听器
 */
export const setupSystemThemeListener = (callback = null) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  // 定义处理函数
  const handleSystemThemeChange = () => {
    const currentTheme = localStorage.getItem('theme') || 'light'
    if (currentTheme === 'system') {
      if (callback) {
        callback()
      } else {
        applyTheme()
      }
    }
  }
  
  // 添加事件监听器
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  
  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
}