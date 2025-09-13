<template>
  <div class="rpa-main">
    <!-- 主界面布局 -->
    <div class="rpa-layout">
      <!-- 左侧元件面板 -->
      <div class="left-panel">
        <ElementPanel />
      </div>
      
      <!-- 中间工作区 -->
      <div class="center-panel">
        <WorkflowEditor ref="workflowEditorRef" :workflow="workflow" />
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
  elements: [],
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
  
  // 空格键: 播放/暂停
  if (event.code === 'Space' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
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
}

.rpa-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 250px;
  height: 100%;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
}

.center-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel {
  width: 350px;
  height: 100%;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.rpa-statusbar {
  height: 32px;
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.status-item {
  margin-right: 24px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .right-panel {
    width: 300px;
  }
}

@media (max-width: 1024px) {
  .left-panel {
    width: 200px;
  }
  
  .right-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .rpa-layout {
    flex-direction: column;
  }
  
  .left-panel,
  .right-panel {
    width: 100%;
    height: 300px;
  }
}
</style>