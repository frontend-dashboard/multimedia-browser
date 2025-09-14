<template>
  <div class="log-viewer">
    <div class="log-header">
      <h3>应用日志</h3>
      <div class="log-actions">
        <el-select v-model="filterLevel" placeholder="日志级别" size="small">
          <el-option label="全部" value=""></el-option>
          <el-option label="调试" value="debug"></el-option>
          <el-option label="信息" value="info"></el-option>
          <el-option label="警告" value="warn"></el-option>
          <el-option label="错误" value="error"></el-option>
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索日志"
          size="small"
          class="search-input"
        ></el-input>
        <el-button size="small" @click="clearLogs">清空</el-button>
        <el-button size="small" type="primary" @click="saveLogs">导出</el-button>
        <el-button size="small" @click="refreshLogs">刷新</el-button>
      </div>
    </div>

    <div ref="logContentRef" class="log-content">
      <div v-if="filteredLogs.length === 0" class="no-logs">
        {{ loading ? '加载中...' : '暂无日志' }}
      </div>
      <div
        v-for="(log, index) in filteredLogs"
        :key="log.id || index"
        class="log-item"
        :class="`log-level-${log.level}`"
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import logger from '@renderer/utils/logger.js'

// 状态
const logs = ref([])
const filterLevel = ref('')
const searchText = ref('')
const logContentRef = ref(null)
const loading = ref(false)
let unsubscribe = null

// 过滤后的日志
const filteredLogs = computed(() => {
  let filtered = [...logs.value]

  // 按级别过滤
  if (filterLevel.value) {
    filtered = filtered.filter((log) => log.level === filterLevel.value)
  }

  // 按文本搜索
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filtered = filtered.filter(
      (log) =>
        log.message.toLowerCase().includes(searchLower) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
    )
  }

  // 按时间倒序排列
  return filtered.reverse()
})

// 加载日志
const loadLogs = () => {
  loading.value = true
  try {
    // 获取最新的日志
    logs.value = logger.getLogs()
  } catch (error) {
    console.error('加载日志失败:', error)
  } finally {
    loading.value = false

    // 自动滚动到底部
    nextTick(() => {
      if (logContentRef.value) {
        logContentRef.value.scrollTop = logContentRef.value.scrollHeight
      }
    })
  }
}

// 刷新日志
const refreshLogs = () => {
  loadLogs()
  logger.info('日志列表已刷新')
}

// 清空日志
const clearLogs = () => {
  if (confirm('确定要清空所有日志吗？此操作不可恢复。')) {
    logger.clearLogs()
    loadLogs()
    logger.info('所有日志已清空')
  }
}

// 保存日志
const saveLogs = async () => {
  try {
    await logger.saveLogsToFile()
  } catch (error) {
    console.error('保存日志失败:', error)
    alert('保存日志失败，请重试')
  }
}

// 监听日志变化
const handleLogUpdate = (newLog) => {
  logs.value.push(newLog)

  // 如果日志数量过多，自动清理
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

// 生命周期
onMounted(() => {
  loadLogs()

  // 订阅日志更新
  unsubscribe = logger.subscribeToLogs(handleLogUpdate)

  logger.info('日志查看器已初始化')
})

onUnmounted(() => {
  // 取消订阅
  if (typeof unsubscribe === 'function') {
    unsubscribe()
  }

  logger.info('日志查看器已关闭')
})

// 监听过滤条件变化，自动滚动到底部
watch([filterLevel, searchText], () => {
  nextTick(() => {
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight
    }
  })
})
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
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

.log-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.log-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background-color: #fafafa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--color-text-secondary);
  font-style: italic;
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

.log-level-debug {
  background-color: #f4f4f5;
  color: #6b7280;
}

.log-level-info {
  background-color: #ecf5ff;
  color: #409eff;
}

.log-level-warn {
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
</style>
