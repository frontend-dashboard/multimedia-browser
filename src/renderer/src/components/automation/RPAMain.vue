<template>
  <div class="rpa-main">
    <!-- 主工具栏 -->
    <div class="main-toolbar">
      <div class="toolbar-left">
        <h1 class="app-title">网页自动化RPA工具</h1>
      </div>
      <div class="toolbar-center">
        <el-button type="primary" @click="newWorkflow">新建流程</el-button>
        <el-button @click="saveWorkflow">保存流程</el-button>
        <el-button @click="loadWorkflow">加载流程</el-button>
        <el-button @click="clearWorkflow">清空画布</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="success" @click="playWorkflow">播放</el-button>
      </div>
    </div>

    <!-- 主界面布局 -->
    <div class="rpa-layout">
      <!-- 左侧元件面板 -->
      <div class="left-panel">
        <ElementPanel />
      </div>

      <!-- 中间工作区 -->
      <div class="center-panel">
        <WorkflowEditor
          ref="workflowEditorRef"
          :workflow="workflow"
          @workflow-updated="handleWorkflowUpdated"
        />
      </div>

      <!-- 右侧播放器和属性面板 -->
      <div class="right-panel">
        <WorkflowPlayer ref="workflowPlayerRef" :workflow="workflow" />
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="rpa-statusbar">
      <div class="status-item">
        <span>元件数量: {{ workflow.elements.length }}</span>
      </div>
      <div class="status-item">
        <span>连接数量: {{ workflow.connections.length }}</span>
      </div>
      <div class="status-item">
        <span>已保存: {{ isSaved ? '是' : '否' }}</span>
      </div>
      <div class="status-item">
        <span>最后修改: {{ lastModified ? formatDate(lastModified) : '从未' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import ElementPanel from './elements/ElementPanel.vue'
import WorkflowEditor from './editor/WorkflowEditor.vue'
import WorkflowPlayer from './player/WorkflowPlayer.vue'

// 工作流数据
const workflow = reactive({
  name: '未命名流程',
  description: '',
  elements: [
    {
      id: '1',
      name: '浏览器打开',
      icon: 'ChromeFilled',
      position: { x: 50, y: 100 },
      params: [
        { key: 'url', label: '网址', type: 'string', defaultValue: 'https://www.example.com' }
      ],
      paramValues: { url: 'https://www.example.com' },
      selected: false
    },
    {
      id: '2',
      name: '等待',
      icon: 'Clock',
      position: { x: 300, y: 100 },
      params: [{ key: 'seconds', label: '等待时间(秒)', type: 'string', defaultValue: '2' }],
      paramValues: { seconds: '2' },
      selected: false
    },
    {
      id: '3',
      name: '数据处理',
      icon: 'DataAnalysis',
      position: { x: 550, y: 100 },
      params: [{ key: 'operation', label: '操作类型', type: 'string', defaultValue: '提取' }],
      paramValues: { operation: '提取' },
      selected: false
    }
  ],
  connections: []
})

// 组件引用
const workflowEditorRef = ref(null)
const workflowPlayerRef = ref(null)

// 状态信息
const isSaved = ref(true)
const lastModified = ref(null)

// 格式化日期
const formatDate = (date) => {
  return date.toLocaleString()
}

// 监听工作流变化
watch(
  () => ({ ...workflow }),
  () => {
    isSaved.value = false
    lastModified.value = new Date()
  },
  { deep: true }
)

// 保存工作流
const saveWorkflow = () => {
  if (workflowEditorRef.value && workflowEditorRef.value.saveWorkflow) {
    workflowEditorRef.value.saveWorkflow()
    isSaved.value = true
  }
}

// 加载工作流
const loadWorkflow = () => {
  if (workflowEditorRef.value && workflowEditorRef.value.loadWorkflow) {
    workflowEditorRef.value.loadWorkflow()
    isSaved.value = true
  }
}

// 播放工作流
const playWorkflow = () => {
  if (workflowPlayerRef.value && workflowPlayerRef.value.togglePlayPause) {
    workflowPlayerRef.value.togglePlayPause()
  }
}

// 新建工作流
const newWorkflow = () => {
  if (workflow.elements.length > 0) {
    if (!confirm('确定要新建流程吗？当前未保存的内容将会丢失。')) {
      return
    }
  }

  // 重置工作流数据为默认值
  Object.assign(workflow, {
    name: '未命名流程',
    description: '',
    elements: [],
    connections: []
  })

  isSaved.value = false
  lastModified.value = new Date()

  // 通知子组件重置状态
  if (workflowEditorRef.value && workflowEditorRef.value.resetWorkflow) {
    workflowEditorRef.value.resetWorkflow()
  }
}

// 清空画布
const clearWorkflow = () => {
  if (workflow.elements.length > 0 || workflow.connections.length > 0) {
    if (!confirm('确定要清空画布吗？当前未保存的内容将会丢失。')) {
      return
    }
  }

  workflow.elements = []
  workflow.connections = []
  isSaved.value = false
  lastModified.value = new Date()

  // 通知子组件更新状态
  if (workflowEditorRef.value && workflowEditorRef.value.onWorkflowCleared) {
    workflowEditorRef.value.onWorkflowCleared()
  }
}

// 处理工作流更新事件
const handleWorkflowUpdated = (updatedWorkflow) => {
  // 更新工作流数据
  Object.assign(workflow, updatedWorkflow)
  isSaved.value = false
  lastModified.value = new Date()
}

// 监听键盘快捷键
const handleKeyDown = (event) => {
  // Ctrl/Cmd + S: 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveWorkflow()
  }

  // Ctrl/Cmd + O: 加载
  if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
    event.preventDefault()
    loadWorkflow()
  }

  // Ctrl/Cmd + N: 新建
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    newWorkflow()
  }

  // 空格键: 播放/暂停
  if (
    event.code === 'Space' &&
    event.target.tagName !== 'INPUT' &&
    event.target.tagName !== 'TEXTAREA'
  ) {
    event.preventDefault()
    playWorkflow()
  }
}

// 生命周期钩子
onMounted(() => {
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 初始化最后修改时间
  lastModified.value = new Date()
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.rpa-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主工具栏样式 */
.main-toolbar {
  height: 60px;
  background-color: #f8f9fa;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}

.app-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.rpa-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: #f0f2f5;
}

.left-panel {
  width: 260px;
  height: 100%;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  transition: all 0.3s ease;
}

.center-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.right-panel {
  width: 380px;
  height: 100%;
  flex-shrink: 0;
  background-color: #ffffff;
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.rpa-statusbar {
  height: 36px;
  background-color: #fafafa;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.status-item {
  margin-right: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-item:last-child {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .right-panel {
    width: 340px;
  }
}

@media (max-width: 1200px) {
  .left-panel {
    width: 240px;
  }

  .right-panel {
    width: 300px;
  }

  .center-panel {
    margin: 6px;
  }

  .app-title {
    font-size: 18px;
  }

  .app-subtitle {
    display: none;
  }
}

@media (max-width: 1024px) {
  .main-toolbar {
    padding: 0 16px;
    height: 52px;
  }

  .left-panel {
    width: 200px;
  }

  .right-panel {
    width: 280px;
  }

  .app-title {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .main-toolbar {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .rpa-layout {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    width: 100%;
    height: 280px;
  }

  .center-panel {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    flex: 2;
  }

  .rpa-statusbar {
    padding: 0 16px;
    flex-wrap: wrap;
    height: auto;
    min-height: 36px;
  }

  .status-item {
    margin-right: 16px;
    margin-bottom: 4px;
  }
}

/* 按钮样式优化 */
.el-button {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.el-button:active {
  transform: translateY(0);
}
</style>
