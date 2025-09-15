<template>
  <div class="rpa-main">
    <!-- 主工具栏 -->
    <div class="main-toolbar">
      <div class="toolbar-left">
        <h1 class="app-title">RPA网页自动化工具</h1>
      </div>
      <div class="toolbar-center">
        <el-button type="primary" @click="newWorkflow">新建流程</el-button>
        <el-button @click="saveWorkflow">保存流程</el-button>
        <el-button @click="loadWorkflow">加载流程</el-button>
        <el-button @click="clearWorkflow">清空画布</el-button>
      </div>
      <div class="toolbar-right">
        <el-dropdown @command="handleThemeChange">
          <el-button type="default" class="theme-switch-btn">
            <el-icon v-if="currentTheme === 'light'">
              <Sunny />
            </el-icon>
            <el-icon v-else-if="currentTheme === 'dark'">
              <Moon />
            </el-icon>
            <el-icon v-else>
              <Monitor />
            </el-icon>
            <span>{{ getThemeDisplayText() }}</span>
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="light">
                <el-icon><Sunny /></el-icon>
                <span>亮色模式</span>
              </el-dropdown-item>
              <el-dropdown-item command="dark">
                <el-icon><Moon /></el-icon>
                <span>暗色模式</span>
              </el-dropdown-item>
              <el-dropdown-item command="system">
                <el-icon><Monitor /></el-icon>
                <span>跟随系统</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="success" @click="playWorkflow">运行</el-button>
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
        <VueFlowEditor ref="vueFlowEditorRef" :workflow="workflow" />
      </div>

      <!-- 右侧面板 - 标签页切换 -->
      <div class="right-panel" :style="{ display: 'none' }">
        <!-- 标签页导航 -->
        <div class="right-panel-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'player' }"
            @click="switchTab('player')"
          >
            播放器
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'logs' }"
            @click="switchTab('logs')"
          >
            日志查看
          </div>
        </div>

        <!-- 标签页内容 -->
        <div class="right-panel-content">
          <WorkflowPlayer
            v-if="activeTab === 'player'"
            ref="workflowPlayerRef"
            :workflow="workflow"
          />
          <LogViewer v-else-if="activeTab === 'logs'" />
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="rpa-statusbar">
      <div class="status-item">
        <span>元件数量: {{ workflow.elements.length }}</span>
      </div>
      <div class="status-item">
        <span>连接数量: {{ workflow.edges.length }}</span>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import ElementPanel from './elements/ElementPanel.vue'
import VueFlowEditor from './editor/VueFlowEditor.vue'
import WorkflowPlayer from './player/WorkflowPlayer.vue'
import LogViewer from '../LogViewer.vue'

// 导入元件类型定义
import ElementTypes from './elements/ElementTypes.js'

// 导入日志工具
import logger from '@renderer/utils/logger.js'

// 导入主题工具函数
import { saveAndApplyTheme, setupSystemThemeListener } from '@renderer/utils/themeUtils.js'

// 导入Element Plus图标
import { ArrowDown, Monitor, Moon, Sunny } from '@element-plus/icons-vue'

// 创建节点的辅助函数
const createNode = (id, elementType, x, y) => {
  // 处理类型名称映射（ElementTypes和ElementPanel中的名称不匹配）
  const typeMapping = {
    WAIT_TIME: 'WAIT',
    CONDITION_IF: 'IF_CONDITION',
    WRITE_FILE: 'SAVE_FILE'
  }

  // 获取实际的类型定义
  const mappedType = typeMapping[elementType] || elementType
  const typeDef = ElementTypes[mappedType]

  // 如果在ElementTypes中找到了定义，则使用它
  if (typeDef) {
    // 构建默认参数值
    const paramValues = {}
    typeDef.params.forEach((param) => {
      paramValues[param.key] = param.defaultValue
    })

    return {
      id,
      type: 'custom-node',
      data: {
        id,
        type: typeDef.type,
        name: typeDef.name,
        icon: typeDef.icon,
        params: typeDef.params,
        paramValues,
        selected: false
      },
      position: { x, y },
      selected: false
    }
  } else {
    // 为ElementPanel中额外的元件类型创建默认节点配置
    // 这些类型在ElementTypes中没有定义，但在ElementPanel中有
    const defaultIcons = {
      BROWSER_REFRESH: 'Refresh',
      BROWSER_NAVIGATE: 'ArrowRight',
      SELECT_OPTION: 'Select',
      SCROLL_PAGE: 'RefreshRight',
      HOVER_ELEMENT: 'Mouse',
      SAVE_DATA: 'Document',
      PROCESS_DATA: 'Operation',
      COMPARE_DATA: 'Operation',
      LOOP_FOR: 'RefreshLeft',
      TRY_CATCH: 'Warning',
      READ_FILE: 'Document',
      UPLOAD_FILE: 'Upload',
      DOWNLOAD_FILE: 'Download'
    }

    const defaultNames = {
      BROWSER_REFRESH: '刷新页面',
      BROWSER_NAVIGATE: '导航到URL',
      SELECT_OPTION: '选择选项',
      SCROLL_PAGE: '滚动页面',
      HOVER_ELEMENT: '悬停元素',
      SAVE_DATA: '保存数据',
      PROCESS_DATA: '处理数据',
      COMPARE_DATA: '比较数据',
      LOOP_FOR: '循环',
      TRY_CATCH: '异常处理',
      READ_FILE: '读取文件',
      UPLOAD_FILE: '上传文件',
      DOWNLOAD_FILE: '下载文件'
    }

    // 简单的默认参数（实际在ElementPanel中会被覆盖）
    const defaultParams = []
    const paramValues = {}

    return {
      id,
      type: 'custom-node',
      data: {
        id,
        type: elementType,
        name: defaultNames[elementType] || elementType,
        icon: defaultIcons[elementType] || 'Menu',
        params: defaultParams,
        paramValues,
        selected: false
      },
      position: { x, y },
      selected: false
    }
  }
}

// 工作流数据
const workflow = reactive({
  name: '未命名流程',
  description: '',
  elements: [
    // 浏览器操作相关节点
    createNode('1', 'BROWSER_OPEN', 50, 100),
    createNode('2', 'BROWSER_CLOSE', 50, 250),

    // 页面交互相关节点
    createNode('3', 'CLICK_ELEMENT', 300, 100),
    createNode('4', 'INPUT_TEXT', 300, 250),

    // 数据处理相关节点
    createNode('5', 'EXTRACT_DATA', 550, 100),

    // 逻辑控制相关节点
    createNode('6', 'WAIT', 800, 100),
    createNode('7', 'IF_CONDITION', 800, 250),

    // 文件操作相关节点
    createNode('8', 'SAVE_FILE', 1050, 100)
  ].filter(Boolean), // 过滤掉可能的null值
  edges: [
    // 基本流程连接
    {
      id: 'edge-1-3',
      source: '1',
      target: '3',
      sourceHandle: '1-right',
      targetHandle: '3-left'
    },
    {
      id: 'edge-3-4',
      source: '3',
      target: '4',
      sourceHandle: '3-right',
      targetHandle: '4-left'
    },
    {
      id: 'edge-4-5',
      source: '4',
      target: '5',
      sourceHandle: '4-right',
      targetHandle: '5-left'
    },
    {
      id: 'edge-5-6',
      source: '5',
      target: '6',
      sourceHandle: '5-right',
      targetHandle: '6-left'
    },
    {
      id: 'edge-6-8',
      source: '6',
      target: '8',
      sourceHandle: '6-right',
      targetHandle: '8-left'
    },
    {
      id: 'edge-8-2',
      source: '8',
      target: '2',
      sourceHandle: '8-right',
      targetHandle: '2-left'
    }
  ]
})

// 组件引用
const vueFlowEditorRef = ref(null)
const workflowPlayerRef = ref(null)

// 标签页状态
const activeTab = ref('player') // player 或 logs

// 状态信息
const isSaved = ref(true)
const lastModified = ref(null)

// 主题相关状态
const currentTheme = ref(localStorage.getItem('theme') || 'light')
let themeCleanup = null

// 切换标签页
const switchTab = (tabName) => {
  activeTab.value = tabName
  logger.info(`切换到${tabName === 'player' ? '播放器' : '日志查看器'}标签页`)
}

// 格式化日期
const formatDate = (date) => {
  return date.toLocaleString()
}

// 移除导致递归更新的深度监听器

// 保存工作流
const saveWorkflow = () => {
  if (vueFlowEditorRef.value && vueFlowEditorRef.value.getWorkflowData) {
    // 从编辑器获取最新的工作流数据
    const updatedWorkflow = vueFlowEditorRef.value.getWorkflowData()
    // 更新本地工作流数据
    Object.assign(workflow, updatedWorkflow)
    isSaved.value = true
    lastModified.value = new Date()
    console.log('工作流已保存', updatedWorkflow)
  }
}

// 加载工作流
const loadWorkflow = () => {
  if (vueFlowEditorRef.value && vueFlowEditorRef.value.loadWorkflow) {
    vueFlowEditorRef.value.loadWorkflow()
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
    edges: []
  })

  isSaved.value = false
  lastModified.value = new Date()

  // 通知子组件重置状态
  if (vueFlowEditorRef.value && vueFlowEditorRef.value.resetWorkflow) {
    vueFlowEditorRef.value.resetWorkflow()
  }
}

// 清空画布
const clearWorkflow = () => {
  if (workflow.elements.length > 0 || workflow.edges.length > 0) {
    if (!confirm('确定要清空画布吗？当前未保存的内容将会丢失。')) {
      return
    }
  }

  workflow.elements = []
  workflow.edges = []
  isSaved.value = false
  lastModified.value = new Date()

  // 通知子组件更新状态
  if (vueFlowEditorRef.value && vueFlowEditorRef.value.onWorkflowCleared) {
    vueFlowEditorRef.value.onWorkflowCleared()
  }
}

// 已移除自动更新机制，改为在保存时主动获取数据
// 此函数已不再使用

// 组件挂载时记录日志
onMounted(() => {
  logger.info('RPAMain组件已挂载，工作流系统初始化完成')
  logger.debug(`初始工作流包含${workflow.elements.length}个元件和${workflow.edges.length}个连接`)
})

// 处理主题切换
const handleThemeChange = (theme) => {
  currentTheme.value = theme
  saveAndApplyTheme(theme)
  logger.info(`主题已切换为: ${getThemeDisplayText()}`)
}

// 获取主题显示文本
const getThemeDisplayText = () => {
  const displayTextMap = {
    light: '亮色',
    dark: '暗色',
    system: '跟随系统'
  }
  return displayTextMap[currentTheme.value] || '亮色'
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

  // 初始化主题
  currentTheme.value = localStorage.getItem('theme') || 'light'

  // 设置系统主题变化的监听器
  themeCleanup = setupSystemThemeListener(() => {
    if (currentTheme.value === 'system') {
      logger.info('系统主题已变化，自动更新应用主题')
    }
  })
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)

  // 清理主题相关资源
  if (themeCleanup) {
    themeCleanup()
  }
})
</script>

<style scoped>
/* 主容器样式 */
.rpa-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主题切换按钮样式 */
.theme-switch-btn {
  margin-right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 主工具栏样式 */
.main-toolbar {
  height: 60px;
  background-color: var(--color-background-light);
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
  color: var(--color-primary);
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

/* 主要布局区域 */
.rpa-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--color-background);
}

/* 左侧面板 - 元件库 */
.left-panel {
  width: 260px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--color-background-light);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* 中间工作区面板 - 核心编辑区域 */
.center-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-light);
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 右侧面板 - 播放器和日志 */
.right-panel {
  width: 380px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--color-background-light);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.right-panel-tabs {
  display: flex;
  height: 40px;
  background-color: var(--color-background-950);
  border-bottom: 1px solid var(--color-border);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  user-select: none;
}

.tab-item:hover {
  background-color: var(--color-background-900);
  color: var(--color-text-primary);
}

.tab-item.active {
  background-color: var(--color-background-light);
  color: var(--color-primary);
  font-weight: 500;
  border-bottom: 2px solid var(--color-primary);
}

.right-panel-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.rpa-statusbar {
  height: 36px;
  background-color: var(--color-background-950);
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

/* 响应式设计 - 根据不同屏幕尺寸优化布局 */
/* 大屏幕优化 */
@media (max-width: 1400px) {
  .right-panel {
    width: 340px;
  }
}

/* 中等屏幕优化 */
@media (max-width: 1200px) {
  .left-panel {
    width: 240px;
  }

  .right-panel {
    width: 300px;
  }

  /* 减少中间面板边距，增加可用空间 */
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

/* 小屏幕优化 */
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

/* 平板/移动端优化 */
@media (max-width: 768px) {
  /* 工具栏调整为垂直排列 */
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

  /* 布局改为垂直方向，方便移动设备操作 */
  .rpa-layout {
    flex-direction: column;
  }

  /* 左右面板调整为固定高度，可滚动 */
  .left-panel,
  .right-panel {
    width: 100%;
    height: 280px;
  }

  /* 中间面板(工作区)调整为无间距、无圆角，增加可用空间 */
  .center-panel {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    flex: 2;
  }

  /* 状态栏调整为自适应高度 */
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
