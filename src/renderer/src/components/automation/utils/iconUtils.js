// 图标工具函数 - 用于处理Vue Flow编辑器中的图标显示

import {
  ChromeFilled,
  Close,
  Pointer,
  Edit,
  DataAnalysis,
  Clock,
  Sort,
  Download,
  Refresh,
  ArrowRight,
  Select,
  RefreshRight,
  Operation,
  RefreshLeft,
  Warning,
  Document,
  EditPen,
  Upload,
  Switch,
  Mouse,
  ZoomIn,
  ZoomOut,
  FullScreen,
  ArrowDown,
  Monitor,
  Moon,
  Sunny
} from '@element-plus/icons-vue'

/**
 * 图标映射表 - 将图标名称映射到对应的图标组件
 */
export const iconMap = {
  ChromeFilled,
  Close,
  Pointer,
  Edit,
  DataAnalysis,
  Clock,
  Sort,
  Download,
  Refresh,
  ArrowRight,
  Select,
  RefreshRight,
  Operation,
  RefreshLeft,
  Warning,
  Document,
  EditPen,
  Upload,
  Switch,
  Mouse,
  ZoomIn,
  ZoomOut,
  FullScreen,
  ArrowDown,
  Monitor,
  Moon,
  Sunny
}

/**
 * 获取图标组件
 * @param {string} iconName - 图标名称
 * @returns {Component} 图标组件
 */
export const getIconComponent = (iconName) => {
  return iconMap[iconName] || ChromeFilled
}

/**
 * 获取图标颜色
 * @param {string} category - 元件分类
 * @returns {string} 颜色代码
 */
export const getIconColorByCategory = (category) => {
  const colorMap = {
    browser: '#4285f4', // 蓝色 - 浏览器操作
    interaction: '#34a853', // 绿色 - 页面交互
    data: '#ea4335', // 红色 - 数据处理
    logic: '#fbbc05', // 黄色 - 逻辑控制
    file: '#8e24aa' // 紫色 - 文件操作
  }

  return colorMap[category] || '#666666'
}

/**
 * 根据节点类型获取节点背景色
 * @param {Object} node - Vue Flow 节点对象
 * @returns {string} 背景色代码
 */
export const getNodeBackgroundColor = (node) => {
  if (!node || !node.data || !node.data.category) {
    return '#1e293b' // 默认背景色
  }

  const baseColor = getIconColorByCategory(node.data.category)
  // 返回稍暗的颜色作为节点背景
  return adjustColorBrightness(baseColor, -30)
}

/**
 * 调整颜色亮度
 * @param {string} color - 颜色代码
 * @param {number} percent - 亮度调整百分比 (-100 到 100)
 * @returns {string} 调整后的颜色代码
 */
export const adjustColorBrightness = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16)
  let G = parseInt(color.substring(3, 5), 16)
  let B = parseInt(color.substring(5, 7), 16)

  R = Math.floor((R * (100 + percent)) / 100)
  G = Math.floor((G * (100 + percent)) / 100)
  B = Math.floor((B * (100 + percent)) / 100)

  R = R < 255 ? R : 255
  G = G < 255 ? G : 255
  B = B < 255 ? B : 255

  R = R > 0 ? R : 0
  G = G > 0 ? G : 0
  B = B > 0 ? B : 0

  R = Math.round(R)
  G = Math.round(G)
  B = Math.round(B)

  const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16)
  const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16)
  const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16)

  return '#' + RR + GG + BB
}

/**
 * 获取节点分类图标
 * @param {string} category - 节点分类
 * @returns {string} 图标名称
 */
export const getCategoryIcon = (category) => {
  const categoryIcons = {
    browser: 'ChromeFilled',
    interaction: 'Pointer',
    data: 'DataAnalysis',
    logic: 'Switch',
    file: 'Document'
  }

  return categoryIcons[category] || 'ChromeFilled'
}

/**
 * 检查图标是否存在
 * @param {string} iconName - 图标名称
 * @returns {boolean} 是否存在
 */
export const iconExists = (iconName) => {
  return !!iconMap[iconName]
}

/**
 * 获取所有可用图标名称
 * @returns {string[]} 图标名称数组
 */
export const getAllIconNames = () => {
  return Object.keys(iconMap)
}

/**
 * 根据图标名称获取分类建议
 * @param {string} iconName - 图标名称
 * @returns {string} 建议的分类
 */
export const getCategorySuggestionByIcon = (iconName) => {
  const iconCategories = {
    ChromeFilled: 'browser',
    Close: 'browser',
    Pointer: 'interaction',
    Edit: 'interaction',
    DataAnalysis: 'data',
    Clock: 'logic',
    Refresh: 'browser',
    ArrowRight: 'browser',
    Select: 'interaction',
    RefreshRight: 'interaction',
    Operation: 'data',
    RefreshLeft: 'logic',
    Warning: 'logic',
    Document: 'file',
    EditPen: 'file',
    Download: 'file',
    Upload: 'file',
    Switch: 'logic',
    Mouse: 'interaction'
  }

  return iconCategories[iconName] || 'browser'
}

/**
 * 获取默认图标
 * @returns {Component} 默认图标组件
 */
export const getDefaultIcon = () => {
  return ChromeFilled
}
