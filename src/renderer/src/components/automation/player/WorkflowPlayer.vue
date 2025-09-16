<template>
  <div class="workflow-player">
    <!-- 播放器控制面板 -->
    <div class="player-controls">
      <div class="control-group">
        <el-button
          :type="playState === 'stopped' || playState === 'paused' ? 'primary' : 'default'"
          :disabled="!canPlay"
          @click="togglePlayPause"
        >
          <el-icon>
            <component :is="playState === 'playing' ? VideoPause : VideoPlay" />
          </el-icon>
          {{ playState === 'playing' ? '暂停' : '播放' }}
        </el-button>

        <el-button
          type="danger"
          :disabled="playState === 'stopped'"
          @click="stopPlayback"
        >
          <el-icon><Stopwatch /></el-icon>
          停止
        </el-button>

        <el-button
          :disabled="playState !== 'paused' && playState !== 'stopped'"
          @click="stepForward"
        >
          <el-icon><Right /></el-icon>
          单步执行
        </el-button>
      </div>

      <div class="control-group">
        <el-input-number
          v-model="playbackSpeed"
          :min="0.1"
          :max="5"
          :step="0.1"
          label="播放速度"
          size="small"
        />

        <el-switch
          v-model="enableDebugging"
          active-text="调试模式"
          inactive-text="正常模式"
        />
      </div>
    </div>

    <!-- 播放状态显示 -->
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

    <!-- 浏览器预览 -->
    <div v-if="showBrowserPreview" class="browser-preview">
      <div class="preview-header">
        <h3>浏览器预览</h3>
        <el-button size="small" @click="closeBrowserPreview">关闭</el-button>
      </div>

      <div class="preview-content">
        <!-- 在实际应用中，这里会嵌入一个浏览器视图 -->
        <div class="browser-placeholder">
          <p>浏览器预览区域</p>
          <p v-if="currentBrowserUrl">当前URL: {{ currentBrowserUrl }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { VideoPlay, VideoPause, Stopwatch, Right } from '@element-plus/icons-vue'

// 导入工具
import logger from '@renderer/utils/logger.js'
import browserAutomation from '@renderer/utils/browserAutomation.js'

// 已移除元素选择器组件

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

// 播放状态相关变量
const playState = ref('stopped') // stopped, playing, paused
const currentElement = ref(null)
const currentElementIndex = ref(-1)
const executedCount = ref(0)
const totalElements = computed(() => props.workflow.elements.length)
const playbackSpeed = ref(1)
const enableDebugging = ref(false)
const showBrowserPreview = ref(false)
const currentBrowserUrl = ref('')

// 执行时间相关变量
const startTime = ref(0)
const elapsedTime = ref(0)
let timeInterval = null

// 浏览器状态
let currentBrowserId = null

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
    playing: '播放中',
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
const executeElement = async (element) => {
  if (!element) {
    return false
  }

  currentElement.value = element
  addLog('info', `开始执行：${element.name}`, element)

  try {
    // 根据元件类型执行不同的操作
    await executeElementAction(element)

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

const executeElementAction = async (element) => {
  // 这里使用实际的浏览器自动化API来执行操作
  // 优先使用element.data.type，如果不存在则回退到element.type
  const elementType = element.data?.type || element.type

  // 添加事件监听器以获取页面状态更新
  const handlePageLoaded = (url) => {
    currentBrowserUrl.value = url
    addLog('info', `页面已加载：${url}`)
  }

  const handlePageConsole = (message) => {
    addLog('info', `页面控制台：${message}`)
  }

  const handlePageError = (errorMessage) => {
    addLog('error', `页面错误：${errorMessage}`)
  }

  // 设置事件监听器
  browserAutomation.on('pageLoaded', handlePageLoaded)
  browserAutomation.on('pageConsole', handlePageConsole)
  browserAutomation.on('pageError', handlePageError)

  try {
    // 获取参数值，支持两种数据结构
    const getParamValue = (key, defaultValue = '') => {
      return element.data?.paramValues?.[key] || element.paramValues?.[key] || defaultValue
    }
    
    switch (elementType) {
      case 'BROWSER_OPEN': {
        const url = getParamValue('url', 'https://www.example.com')
        const browserType = getParamValue('browserType', 'chrome')

        // 转换浏览器类型名称以匹配Playwright的命名约定
        const playwrightBrowserType = browserType === 'chrome' ? 'chromium' : browserType

        addLog('info', `正在打开${browserType}浏览器：${url}`)

        // 初始化浏览器
        const initResult = await browserAutomation.initialize({
          browserType: playwrightBrowserType,
          headless: false
        })
        
        if (initResult.success) {
          currentBrowserId = initResult.browserId
          
          // 打开URL
          await browserAutomation.openUrl({ browserId: currentBrowserId, url })
        } else {
          throw new Error('浏览器初始化失败: ' + initResult.error)
        }

        currentBrowserUrl.value = url
        showBrowserPreview.value = true

        addLog('success', `浏览器已成功打开，当前URL：${url}`)
        break
      }

      case 'BROWSER_CLOSE': {
        addLog('info', '正在关闭浏览器')
        if (currentBrowserId) {
          await browserAutomation.closeBrowser(currentBrowserId)
          currentBrowserId = null
        }
        showBrowserPreview.value = false
        addLog('success', '浏览器已成功关闭')
        break
      }

      case 'CLICK_ELEMENT': {
        const selector = getParamValue('selector', '')
        const waitForNavigation = getParamValue('waitForNavigation', true) !== false
        const clickCount = getParamValue('clickCount', 1)

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog('info', `正在点击元素：${selector}${clickCount > 1 ? ` (${clickCount}次)` : ''}${waitForNavigation ? '（等待页面加载）' : ''}`)

        // 等待元素可见
        await browserAutomation.waitForElement({ browserId: currentBrowserId, selector, timeout: 5000 })

        // 点击元素
        await browserAutomation.clickElement({ browserId: currentBrowserId, selector, waitForNavigation })

        addLog('success', `元素已成功点击：${selector}`)
        break
      }

      case 'INPUT_TEXT': {
        const selector = getParamValue('selector', '')
        const text = getParamValue('text', '')
        const clearBefore = getParamValue('clearBefore', true) !== false

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog('info', `正在${clearBefore ? '清空并' : ''}输入文本到 ${selector}：${text}`)

        // 等待元素可见
        await browserAutomation.waitForElement({ browserId: currentBrowserId, selector, timeout: 5000 })

        // 输入文本
        await browserAutomation.inputText({ browserId: currentBrowserId, selector, text })

        addLog('success', `文本已成功输入到：${selector}`)
        break
      }

      case 'EXTRACT_DATA': {
        const selector = getParamValue('selector', '')
        const extractType = getParamValue('extractType', 'text')
        const attributeName = getParamValue('attributeName', 'href')
        const variableName = getParamValue('variableName', 'extractedData')

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog('info', `正在从 ${selector} 提取 ${extractType} 数据到变量 ${variableName}`)

        // 等待元素可见
        await browserAutomation.waitForElement({ browserId: currentBrowserId, selector, timeout: 5000 })

        // 提取数据
        const result = await browserAutomation.extractData({ browserId: currentBrowserId, selector, extractType, attribute: attributeName })

        // 模拟存储提取的数据到变量（实际应用中可能需要更复杂的变量管理系统）
        // 这里只是记录到日志中
        addLog('success', `数据已成功提取到变量 ${variableName}`, {
          extractedValue: result.data
        })
        break
      }

      case 'WAIT': {
        const waitSeconds = getParamValue('seconds', 2)
        addLog('info', `等待 ${waitSeconds} 秒`)

        // 实际等待指定的时间
        await browserAutomation.wait({ browserId: currentBrowserId, milliseconds: (waitSeconds * 1000) / playbackSpeed.value })

        addLog('success', `等待完成`)
        break
      }

      case 'IF_CONDITION': {
        const condition = getParamValue('condition', 'true')
        addLog('info', `条件判断：${condition}`)

        // 在实际应用中，这里应该有更复杂的条件评估逻辑
        // 这里只是简单的模拟
        addLog('info', `条件评估完成`)
        break
      }

      case 'SAVE_FILE': {
        const filePath = element.paramValues?.filePath || 'output.txt'
        const format = element.paramValues?.format || 'txt'

        // 在实际应用中，这里应该调用文件系统API来保存文件
        // 由于在渲染进程中，我们可能需要通过IPC与主进程通信
        addLog('info', `保存文件：${filePath} (格式：${format})`)
        addLog('info', '文件保存功能在渲染进程中受到限制，需要通过主进程API实现')
        break
      }

      case 'GET_PAGE_ELEMENTS': {
        const selector = getParamValue('selector', '*')
        const extractDetails = getParamValue('extractDetails', false)
        const variableName = getParamValue('variableName', 'pageElements')

        addLog('info', `正在获取页面元素，选择器：${selector}${extractDetails ? '（包含详细信息）' : ''}`)

        // 获取页面元素
        const result = await browserAutomation.getPageElements({
          browserId: currentBrowserId,
          selector,
          extractDetails
        })

        addLog('success', `已成功获取 ${result.elements.length} 个页面元素到变量 ${variableName}`)
        break
      }

      default: {
        addLog('warn', `未知元件类型：${element.type}`)
        break
      }
    }
  } catch (error) {
    addLog('error', `执行操作失败：${error.message}`)
    throw error
  } finally {
    // 清理事件监听器
    browserAutomation.off('pageLoaded', handlePageLoaded)
    browserAutomation.off('pageConsole', handlePageConsole)
    browserAutomation.off('pageError', handlePageError)
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
      }, 500 / playbackSpeed.value) // 元件间的延迟
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
    // 开始播放
    playState.value = 'playing'
    currentElementIndex.value = -1
    executedCount.value = 0
    elapsedTime.value = 0
    startTimer()

    // 清空当前执行状态
    currentElement.value = null

    addLog('info', '开始执行工作流')
    await executeNextElement()
  } else if (playState.value === 'playing') {
    // 暂停播放
    playState.value = 'paused'
    stopTimer()
    addLog('info', '工作流暂停执行')
  } else if (playState.value === 'paused') {
    // 继续播放
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
  addLog('info', '工作流已停止')
}

const stepForward = async () => {
  if (playState.value === 'playing') {
    return
  }

  // 如果是停止状态，初始化执行环境
  if (playState.value === 'stopped') {
    currentElementIndex.value = -1
    executedCount.value = 0
    elapsedTime.value = 0
    startTimer()

    // 清空当前执行状态
    currentElement.value = null

    addLog('info', '开始单步执行工作流')
  }

  // 设置为暂停状态
  playState.value = 'paused'

  // 执行下一个元件
  await executeNextElement()

  // 如果所有元件都执行完了，停止计时器
  if (executedCount.value >= totalElements.value) {
    stopTimer()
    playState.value = 'stopped'
    addLog('success', '工作流执行完成')
  }
}

const closeBrowserPreview = () => {
  showBrowserPreview.value = false
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
  
  addLog('info', '播放器已初始化')
})

onUnmounted(() => {
  // 取消日志订阅
  if (typeof logUnsubscribe === 'function') {
    logUnsubscribe()
  }
  
  stopTimer()
  // 确保在组件卸载时关闭浏览器
  if (currentBrowserId) {
    browserAutomation.closeBrowser(currentBrowserId).catch((err) => {
      console.error('关闭浏览器时出错:', err)
    })
    currentBrowserId = null
  }
  addLog('info', '播放器已卸载')
})
</script>

<style scoped>
.workflow-player {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* 控制面板样式 */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
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
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  gap: 24px;
  font-size: 14px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  color: var(--color-text-secondary);
}

.status-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.status-stopped {
  color: var(--color-text-secondary);
}

.status-playing {
  color: #67c23a;
}

.status-paused {
  color: #e6a23c;
}

/* 执行日志样式 */
.execution-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-border);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.log-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.log-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background-color: #fafafa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}

.log-time {
  color: var(--color-text-secondary);
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
  background-color: #ecf5ff;
  color: #409eff;
}

.log-level-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.log-level-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.log-level-error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.log-message {
  color: var(--color-text-primary);
}

.log-details {
  margin: 8px 0 0 0;
  padding: 8px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow-x: auto;
}

/* 浏览器预览样式 */
.browser-preview {
  height: 300px;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.preview-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.preview-content {
  flex: 1;
  background-color: white;
  border: 1px solid var(--color-border);
  margin: 12px;
  border-radius: 4px;
  overflow: hidden;
}

.browser-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
  background-color: #f5f5f5;
}

.browser-placeholder p {
  margin: 4px 0;
}

/* 自定义滚动条 */
.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: var(--color-background);
}

.log-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-disabled);
}
</style>
