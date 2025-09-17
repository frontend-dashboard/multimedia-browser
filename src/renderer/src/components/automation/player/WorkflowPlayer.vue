<template>
  <div v-if="isDebuggingEnabled" class="workflow-player">
    <!-- 运行器控制面板 -->
    <div class="player-controls">
      <div class="control-group">
        <!-- 运行/暂停按钮 -->
        <el-button
          :type="playState === 'stopped' || playState === 'paused' ? 'primary' : 'default'"
          :disabled="!canPlay"
          @click="togglePlayPause"
        >
          <el-icon>
            <component :is="playState === 'playing' ? VideoPause : VideoPlay" />
          </el-icon>
          {{ playState === 'playing' ? '暂停' : '运行' }}
        </el-button>
        <!-- 停止 -->
        <el-button type="danger" :disabled="playState === 'stopped'" @click="stopPlayback">
          <el-icon><Stopwatch /></el-icon>
          停止
        </el-button>
      </div>

      <div class="control-group">
        <el-switch v-model="enableDebugging" active-text="调试模式" inactive-text="正常模式" />

        <!-- 调试模式关闭 -->
        <el-button link @click="toggleDebugging">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 运行状态显示 -->
    <div class="player-status">
      <div class="status-info">
        <span class="status-label">当前状态：</span>
        <span class="status-value" :class="'status-' + playState">
          {{ getPlayStateText(playState) }}
        </span>
      </div>

      <div v-if="currentElement" class="status-info">
        <span class="status-label">当前执行：</span>
        <span class="status-value">{{ currentElement.name }}</span>
      </div>

      <div class="status-info">
        <span class="status-label">已执行：</span>
        <span class="status-value">{{ executedCount }}/{{ totalElements }}</span>
      </div>

      <div class="status-info">
        <span class="status-label">执行时间：</span>
        <span class="status-value">{{ formatTime(elapsedTime) }}</span>
      </div>
    </div>

    <!-- 执行日志 -->
    <div class="execution-log">
      <div class="log-header">
        <h3>执行日志</h3>
        <el-button size="small" @click="clearLog">清空</el-button>
      </div>

      <div ref="logContentRef" class="log-content">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="'log-level-' + log.level"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-level">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
          <template v-if="log.details">
            <pre class="log-details">{{ JSON.stringify(log.details, null, 2) }}</pre>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { VideoPlay, VideoPause, Stopwatch } from '@element-plus/icons-vue'

// 导入工具
import logger from '@renderer/utils/logger.js'
import { Initializer } from '../elements/ElementTypes'

// 从全局window对象获取api，通过IPC调用main进程的真实浏览器功能
const browserAutomation = window.api?.browserAutomation || {
  // 提供降级实现，确保在API不可用时也不会崩溃
  isBrowserAvailable: () => Promise.resolve(false),
  initialize: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  openUrl: () => Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  clickElement: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  inputText: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  extractData: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  waitForElement: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  wait: (params) => new Promise((resolve) => setTimeout(resolve, params?.milliseconds || 0)),
  saveFile: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  getPageElements: () =>
    Promise.resolve({ success: false, error: 'Browser automation API not available' }),
  // 添加事件处理方法以防止错误
  on: () => {}, // 空实现，不执行任何操作
  off: () => {} // 空实现，不执行任何操作
}

// Props
const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({
      elements: [],
      edges: []
    })
  }
})

// 运行状态相关变量
const playState = ref('stopped') // stopped, playing, paused
const currentElement = ref(null)
const currentElementIndex = ref(-1)
const executedCount = ref(0)
const totalElements = computed(() => props.workflow.elements.length)
const enableDebugging = ref(false)
const currentBrowserUrl = ref('')
const isDebuggingEnabled = ref(true)

// 调试模式开启/关闭
const toggleDebugging = () => {
  isDebuggingEnabled.value = !isDebuggingEnabled.value
}

// 执行时间相关变量
const startTime = ref(0)
const elapsedTime = ref(0)
let timeInterval = null

// 浏览器状态 - 使用ref使其成为响应式变量
const currentBrowserId = ref(null)

// 执行日志相关变量
const logs = ref([])
const logContentRef = ref(null)
let logUnsubscribe = null

// 计算属性
const canPlay = computed(() => {
  return props.workflow.elements && props.workflow.elements.length > 0
})

// 日志处理函数
const handleGlobalLogUpdate = (newLog) => {
  logs.value.push(newLog)

  // 限制日志数量
  if (logs.value.length > 2000) {
    logs.value = logs.value.slice(-1500)
  }

  // 自动滚动到底部
  nextTick(() => {
    if (logContentRef.value) {
      // 检查是否需要自动滚动到底部
      const shouldAutoScroll =
        !logContentRef.value.scrollTop ||
        logContentRef.value.scrollTop ===
          logContentRef.value.scrollHeight - logContentRef.value.clientHeight

      if (shouldAutoScroll) {
        logContentRef.value.scrollTop = logContentRef.value.scrollHeight
      }
    }
  })
}

const addLog = (level, message, details = null) => {
  // 发送到全局日志系统
  switch (level) {
    case 'debug':
      logger.debug(message, details)
      break
    case 'info':
      logger.info(message, details)
      break
    case 'success':
      logger.info(message, details) // 使用info级别，因为logger没有success级别
      break
    case 'warn':
      logger.warn(message, details)
      break
    case 'error':
      logger.error(message, details)
      break
  }
}

const clearLog = () => {
  logger.clearLogs()
  logs.value = []
}

// 计时器相关函数
const startTimer = () => {
  startTime.value = Date.now() - elapsedTime.value
  timeInterval = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value
  }, 1000)
}

const stopTimer = () => {
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
}

// 工具函数
const getPlayStateText = (state) => {
  const stateMap = {
    stopped: '已停止',
    playing: '运行中',
    paused: '已暂停'
  }

  return stateMap[state] || '未知状态'
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 执行相关函数
// 获取参数值的工具函数
const getParamValue = (paramName, defaultValue, element) => {
  return element.paramValues?.[paramName] !== undefined
    ? element.paramValues[paramName]
    : defaultValue
}

// 执行单个元件
// 需要浏览器的元件类型列表
const BROWSER_REQUIRED_ELEMENTS = ['CLICK_ELEMENT', 'INPUT_TEXT', 'EXTRACT_DATA', 'WAIT']

const executeElement = async (element) => {
  try {
    currentElement.value = element
    addLog('info', `开始执行：${element.name}`, element)
    // 添加调试日志跟踪currentBrowserId
    addLog('debug', `当前浏览器ID: ${currentBrowserId.value}`)

    // 检查是否需要浏览器但没有浏览器实例
    console.log('currentBrowserId.value', currentBrowserId.value)
    console.log('BROWSER_REQUIRED_ELEMENTS.value', BROWSER_REQUIRED_ELEMENTS)
    if (BROWSER_REQUIRED_ELEMENTS.includes(element.type) && !currentBrowserId.value) {
      addLog('debug', `元件${element.name}(${element.type})需要浏览器，但currentBrowserId为null`)
      throw new Error('请先执行"打开浏览器"元件来创建浏览器实例')
    }

    // 使用ElementInitializer执行元件
    const executionResult = await Initializer.executeElement(element.type, {
      element,
      browserId: currentBrowserId.value,
      browserAutomation,
      addLog,
      getParamValue: (paramName, defaultValue) => getParamValue(paramName, defaultValue, element)
    })

    // 如果是打开浏览器操作，更新当前浏览器ID
    if (element.type === 'BROWSER_OPEN' && executionResult.browserId) {
      addLog('debug', `浏览器打开成功，设置currentBrowserId为: ${executionResult.browserId}`)
      currentBrowserId.value = executionResult.browserId
      currentBrowserUrl.value = executionResult.url
    }

    addLog('success', `执行成功：${element.name}`)
    executedCount.value++
    return true
  } catch (error) {
    addLog('error', `执行失败：${element.name}`, { error: error.message })
    return false
  } finally {
    if (enableDebugging.value && playState.value === 'playing') {
      // 调试模式下，每个元件执行后暂停
      playState.value = 'paused'
      stopTimer()
    }
  }
}

const executeNextElement = async () => {
  if (!props.workflow.elements || props.workflow.elements.length === 0) {
    addLog('info', '工作流为空，无法执行')
    return
  }

  // 查找下一个要执行的元件
  let nextElement = null

  if (currentElementIndex.value === -1) {
    // 从第一个元件开始
    nextElement = props.workflow.elements[0]
    currentElementIndex.value = 0
  } else {
    // 查找下一个元件（简化版，实际应该根据连接关系确定）
    currentElementIndex.value++
    if (currentElementIndex.value < props.workflow.elements.length) {
      nextElement = props.workflow.elements[currentElementIndex.value]
    }
  }

  if (nextElement) {
    const success = await executeElement(nextElement)

    if (success && playState.value === 'playing') {
      // 继续执行下一个元件
      setTimeout(() => {
        executeNextElement()
      }, 500) // 元件间的延迟
    }
  } else {
    // 工作流执行完成
    addLog('success', '工作流执行完成')
    playState.value = 'stopped'
    stopTimer()
  }
}

// 用户交互函数
const togglePlayPause = async () => {
  if (playState.value === 'stopped') {
    // 开始运行
    playState.value = 'playing'
    currentElementIndex.value = -1
    executedCount.value = 0
    elapsedTime.value = 0
    startTimer()

    // 清空当前执行状态
    currentElement.value = null
    // 重置浏览器ID，确保重新开始时需要重新打开浏览器
    currentBrowserId.value = null

    addLog('info', '开始执行工作流')
    await executeNextElement()
  } else if (playState.value === 'playing') {
    // 暂停运行
    playState.value = 'paused'
    stopTimer()
    addLog('info', '工作流暂停执行')
  } else if (playState.value === 'paused') {
    // 继续运行
    playState.value = 'playing'
    startTimer()
    addLog('info', '工作流继续执行')
    await executeNextElement()
  }
}

const stopPlayback = () => {
  playState.value = 'stopped'
  stopTimer()
  currentElementIndex.value = -1
  currentElement.value = null
  // 重置浏览器ID，确保重新开始时需要重新打开浏览器
  currentBrowserId.value = null
  addLog('info', '工作流已停止')
}

// 监听器
watch(
  () => props.workflow,
  () => {
    if (playState.value !== 'stopped') {
      stopPlayback()
    }
  },
  { deep: true }
)

// 生命周期钩子
onMounted(() => {
  // 初始时加载所有全局日志
  logs.value = logger.getLogs()

  // 订阅全局日志更新
  logUnsubscribe = logger.subscribeToLogs(handleGlobalLogUpdate)

  addLog('info', '运行器已初始化')
})

onUnmounted(() => {
  // 取消日志订阅
  if (typeof logUnsubscribe === 'function') {
    logUnsubscribe()
  }

  stopTimer()
  // 确保在组件卸载时关闭浏览器
  if (currentBrowserId.value) {
    browserAutomation.closeBrowser(currentBrowserId.value).catch((err) => {
      console.error('关闭浏览器时出错:', err)
    })
    currentBrowserId.value = null
  }
  addLog('info', '运行器已卸载')
})
</script>

<style scoped>
.workflow-player {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

/* 控制面板样式 */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  gap: 16px;
}

.control-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 状态显示样式 */
.player-status {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  gap: 24px;
  font-size: 14px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  color: var(--el-text-color-secondary);
}

.status-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.status-stopped {
  color: var(--el-text-color-secondary);
}

.status-playing {
  color: var(--el-text-color-primary);
}

.status-paused {
  color: var(--el-text-color-primary);
}

/* 执行日志样式 */
.execution-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--el-border-color);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.log-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.log-content {
  padding: 12px;
  overflow-y: auto;
  background-color: var(--el-bg-color);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  height: 153px;
  overflow: auto;
}

.log-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.log-time {
  color: var(--el-text-color-secondary);
  margin-right: 8px;
}

.log-level {
  display: inline-block;
  padding: 2px 6px;
  margin-right: 8px;
  font-size: 11px;
  border-radius: 3px;
  font-weight: 500;
}

.log-level-info {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.log-level-success {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.log-level-warning {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.log-level-error {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.log-message {
  color: var(--el-text-color-primary);
}

.log-details {
  margin: 8px 0 0 0;
  padding: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow-x: auto;
}

/* 自定义滚动条 */
.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: var(--el-bg-color);
}

.log-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-disabled);
}
</style>
