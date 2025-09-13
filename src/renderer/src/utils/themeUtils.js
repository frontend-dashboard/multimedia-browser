// 主题相关工具函数

/**
 * 获取当前应使用的Element Plus主题
 * @param {string} theme - 主题设置值 ('light', 'dark', 'system')
 * @returns {string} - 'light' 或 'dark'
 */
export const getThemeClass = (theme = null) => {
  // 如果没有提供主题，则从localStorage获取或使用默认值
  const currentTheme = theme || localStorage.getItem('theme') || 'light'

  // 跟随系统模式
  if (currentTheme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // 手动选择模式
  return currentTheme === 'dark' ? 'dark' : 'light'
}

/**
 * 应用Element Plus主题到根元素
 * @param {string} theme - 可选，指定要应用的主题
 */
export const applyTheme = (theme = null) => {
  const root = document.documentElement
  const currentTheme = getThemeClass(theme)

  // 设置Element Plus的主题
  root.setAttribute('data-theme', currentTheme)

  // 为了兼容现有样式，仍然保留原有的主题类
  root.classList.remove('light', 'dark')
  root.classList.add(`${currentTheme}`)

  console.log('应用Element Plus主题:', currentTheme)
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
 * 初始化Element Plus主题（应用启动时使用）
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
