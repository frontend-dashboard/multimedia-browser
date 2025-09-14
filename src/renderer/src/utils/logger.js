/**
 * 全局日志工具
 * 支持不同日志级别、控制台输出和应用内日志面板
 */

// 日志级别常量
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}

// 当前日志级别配置
let currentLogLevel = LOG_LEVELS.INFO

// 应用内日志存储
let appLogs = []

// 日志最大数量限制
const MAX_LOGS = 1000

// 日志订阅者列表
const logSubscribers = []

/**
 * 设置当前日志级别
 * @param {string} level - 日志级别
 */
export const setLogLevel = (level) => {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level
    console.log(`日志级别已设置为: ${level}`)
  } else {
    console.error(`无效的日志级别: ${level}，支持的级别: ${Object.values(LOG_LEVELS).join(', ')}`)
  }
}

/**
 * 检查日志级别是否应该被记录
 * @param {string} level - 要检查的日志级别
 * @returns {boolean} - 是否应该记录该级别的日志
 */
const shouldLog = (level) => {
  const levelOrder = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR]
  return levelOrder.indexOf(level) >= levelOrder.indexOf(currentLogLevel)
}

/**
 * 创建日志条目
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 * @returns {Object} - 日志条目对象
 */
const createLogEntry = (level, message, details = null) => {
  const timestamp = new Date().toLocaleString()
  const logEntry = {
    id: Date.now(),
    timestamp,
    level,
    message,
    details
  }

  // 添加到应用内日志存储
  appLogs.push(logEntry)

  // 限制日志数量
  if (appLogs.length > MAX_LOGS) {
    appLogs.shift()
  }

  return logEntry
}

/**
 * 通知所有订阅者
 * @param {Object} logEntry - 日志条目
 */
const notifySubscribers = (logEntry) => {
  logSubscribers.forEach((subscriber) => {
    try {
      subscriber(logEntry)
    } catch (error) {
      console.error('日志订阅者处理失败:', error)
    }
  })
}

/**
 * 基础日志函数
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 */
const log = (level, message, details = null) => {
  if (!shouldLog(level)) {
    return
  }

  // 创建日志条目
  const logEntry = createLogEntry(level, message, details)

  // 控制台输出
  switch (level) {
    case LOG_LEVELS.DEBUG:
      if (details) {
        console.debug(`[${logEntry.timestamp}] [${level}] ${message}`, details)
      } else {
        console.debug(`[${logEntry.timestamp}] [${level}] ${message}`)
      }
      break
    case LOG_LEVELS.INFO:
      if (details) {
        console.info(`[${logEntry.timestamp}] [${level}] ${message}`, details)
      } else {
        console.info(`[${logEntry.timestamp}] [${level}] ${message}`)
      }
      break
    case LOG_LEVELS.WARN:
      if (details) {
        console.warn(`[${logEntry.timestamp}] [${level}] ${message}`, details)
      } else {
        console.warn(`[${logEntry.timestamp}] [${level}] ${message}`)
      }
      break
    case LOG_LEVELS.ERROR:
      if (details) {
        console.error(`[${logEntry.timestamp}] [${level}] ${message}`, details)
      } else {
        console.error(`[${logEntry.timestamp}] [${level}] ${message}`)
      }
      break
  }

  // 通知订阅者
  notifySubscribers(logEntry)
}

/**
 * 调试日志
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 */
export const debug = (message, details = null) => {
  log(LOG_LEVELS.DEBUG, message, details)
}

/**
 * 信息日志
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 */
export const info = (message, details = null) => {
  log(LOG_LEVELS.INFO, message, details)
}

/**
 * 警告日志
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 */
export const warn = (message, details = null) => {
  log(LOG_LEVELS.WARN, message, details)
}

/**
 * 错误日志
 * @param {string} message - 日志消息
 * @param {any} details - 附加详情（可选）
 */
export const error = (message, details = null) => {
  log(LOG_LEVELS.ERROR, message, details)
}

/**
 * 清除应用内日志
 */
export const clearLogs = () => {
  appLogs = []
}

/**
 * 获取应用内日志
 * @param {Object} options - 过滤选项
 * @param {string} options.level - 日志级别过滤
 * @param {number} options.limit - 返回的最大日志数量
 * @returns {Array} - 日志数组
 */
export const getLogs = (options = {}) => {
  let filteredLogs = [...appLogs]

  // 按级别过滤
  if (options.level) {
    filteredLogs = filteredLogs.filter((log) => log.level === options.level)
  }

  // 限制数量
  if (options.limit && options.limit > 0) {
    filteredLogs = filteredLogs.slice(-options.limit)
  }

  return filteredLogs
}

/**
 * 订阅日志更新
 * @param {Function} callback - 日志更新时的回调函数
 * @returns {Function} - 取消订阅的函数
 */
export const subscribeToLogs = (callback) => {
  if (typeof callback === 'function') {
    logSubscribers.push(callback)

    // 返回取消订阅函数
    return () => {
      const index = logSubscribers.indexOf(callback)
      if (index > -1) {
        logSubscribers.splice(index, 1)
      }
    }
  }

  console.error('日志订阅回调必须是一个函数')
  return () => {}
}

/**
 * 保存日志到本地文件
 * @returns {Promise<void>} - 保存操作的Promise
 */
export const saveLogsToFile = async () => {
  try {
    const logsToSave = JSON.stringify(appLogs, null, 2)
    const blob = new Blob([logsToSave], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `app-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    info('日志已保存到文件')
  } catch (err) {
    error('保存日志文件失败', err)
    throw err
  }
}

// 默认导出所有日志函数
export default {
  setLogLevel,
  debug,
  info,
  warn,
  error,
  clearLogs,
  getLogs,
  subscribeToLogs,
  saveLogsToFile,
  LOG_LEVELS
}
