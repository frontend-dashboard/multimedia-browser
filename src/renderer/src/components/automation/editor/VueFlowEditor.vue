<template>
  <div class="vue-flow-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button size="small" @click="zoomIn">
        <el-icon><ZoomIn /></el-icon> 放大
      </el-button>
      <el-button size="small" @click="zoomOut">
        <el-icon><ZoomOut /></el-icon> 缩小
      </el-button>
      <el-button size="small" @click="resetZoom">
        <el-icon><Refresh /></el-icon> 重置
      </el-button>
      <div class="toolbar-separator"></div>
      <el-button size="small" @click="layoutGraph('TB')">
        <el-icon><Monitor /></el-icon> 垂直布局
      </el-button>
      <el-button size="small" @click="layoutGraph('LR')">
        <el-icon><ArrowDown /></el-icon> 水平布局
      </el-button>
      <div class="toolbar-separator"></div>
      <el-button size="small" @click="centerCanvas">
        <el-icon><FullScreen /></el-icon> 居中
      </el-button>
    </div>

    <!-- Vue Flow 工作区 -->
    <div class="vue-flow-container">
      <VueFlow
        ref="vueFlowRef"
        v-model="elements"
        :connections="connections"
        :nodes-draggable="true"
        :connection-mode="connectionMode"
        :snap-to-grid="snapToGrid"
        :snap-grid="[20, 20]"
        :fit-view="false"
        :min-zoom="0.5"
        :max-zoom="2"
        class="vue-flow-workspace"
        @node-drag-stop="handleNodeDragStop"
        @node-drag-start="handleNodeDragStart"
        @connection-success="handleConnectionSuccess"
        @node-mouseenter="handleNodeMouseEnter"
        @node-mouseleave="handleNodeMouseLeave"
        @connect="handleConnect"
        @zoom="handleZoom"
        @drop="handleDrop"
        @dragover="handleDragOver"
      >
        <!-- 背景网格 -->
        <Background gap="20" stroke="var(--color-border)" stroke-width="1" class="vue-flow-background" />
        
        <!-- 基础控制按钮 -->
        <Controls position="top-right" />

        <!-- 自定义节点 -->
        <template #node-custom-node="{ data }">
          <div
            class="custom-node"
            :class="{
              'custom-node-selected': data.selected,
              'custom-node-hover': data.id === hoveredNodeId,
              'custom-node-focused': data.id === focusedNodeId
            }"
          >
            <div class="node-header">
              <el-icon class="node-icon">
                <component :is="getIconComponent(data.icon)" />
              </el-icon>
              <span class="node-name">{{ data.name }}</span>
              <div class="node-actions">
                <el-icon class="node-action node-remove" title="删除节点" @click.stop="removeElement(data.id)">
                  <Close />
                </el-icon>
              </div>
            </div>

            <div v-if="data.params && data.params.length > 0" class="node-params">
              <div v-for="param in data.params.slice(0, 2)" :key="param.key" class="param-item">
                <label class="param-label">{{ param.label }}</label>
                <div class="param-value">{{ getParamDisplayValue(data.paramValues, param) }}</div>
              </div>
              <div v-if="data.params.length > 2" class="param-more">
                +{{ data.params.length - 2 }} 个参数
              </div>
            </div>
          </div>
        </template>
      </VueFlow>
    </div>

    <!-- 属性面板 -->
    <div v-if="selectedNode" class="editor-properties">
      <div class="properties-header">
        <h3>属性面板</h3>
      </div>

      <div class="element-properties">
        <h4>{{ selectedNode.data.name }}</h4>
        <el-divider />

        <!-- 基础属性 -->
        <div class="property-group">
          <h5>基础属性</h5>
          <el-input v-model="selectedNode.data.name" placeholder="节点名称" />
        </div>

        <!-- 位置属性 -->
        <div class="property-group">
          <h5>位置</h5>
          <div class="position-inputs">
            <el-input-number
              v-model="selectedNode.position.x"
              label="X"
              :min="0"
              @change="handleNodePositionChange"
            />
            <el-input-number
              v-model="selectedNode.position.y"
              label="Y"
              :min="0"
              @change="handleNodePositionChange"
            />
          </div>
        </div>

        <!-- 节点参数 -->
        <div
          v-if="selectedNode.data.params && selectedNode.data.params.length > 0"
          class="property-group"
        >
          <h5>节点参数</h5>
          <div v-for="param in selectedNode.data.params" :key="param.key" class="param-item">
            <label class="param-label">
              {{ param.label }}
              <span v-if="param.required" class="required-mark">*</span>
            </label>
            <div class="param-input">
              <el-input
                v-if="param.type === 'string'"
                v-model="selectedNode.data.paramValues[param.key]"
                :placeholder="`请输入${param.label}`"
                size="small"
                @change="handleNodeUpdate"
              />
              <el-input-number
                v-else-if="param.type === 'number'"
                v-model="selectedNode.data.paramValues[param.key]"
                :min="0"
                size="small"
                @change="handleNodeUpdate"
              />
              <el-select
                v-else-if="param.type === 'select'"
                v-model="selectedNode.data.paramValues[param.key]"
                placeholder="请选择"
                size="small"
                @change="handleNodeUpdate"
              >
                <el-option
                  v-for="option in param.options"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-switch
                v-else-if="param.type === 'boolean'"
                v-model="selectedNode.data.paramValues[param.key]"
                @change="handleNodeUpdate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
// 导入 VueFlow 相关组件
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import { ZoomIn, ZoomOut, Refresh, FullScreen, Close } from '@element-plus/icons-vue'
// 导入图标工具函数
import { getIconComponent } from '../utils/iconUtils.js'

// 导入所需的样式
import '@vue-flow/core/dist/style.css'

// 定义 props
const props = defineProps({
  workflow: {
    type: Object,
    required: true
  }
})

// 定义 emits
const emit = defineEmits(['workflow-updated'])

// 初始化 Vue Flow 实例
const vueFlowRef = ref(null)
const flowInstance = useVueFlow()

// 新版本的Vue Flow API已经变更，我们需要使用flowInstance中的方法

// 组件状态
const elements = ref([])
const connections = ref([])
const selectedNode = ref(null)
const hoveredNodeId = ref(null)
const focusedNodeId = ref(null)  // 用于存储当前焦点节点ID
const connectionMode = ref('loose')
const snapToGrid = ref(true)
const currentZoom = ref(1)

// 监听工作流数据变化，同步到 Vue Flow
watch(
  () => props.workflow,
  (newWorkflow) => {
    if (newWorkflow) {
      // 将工作流元素转换为 Vue Flow 节点格式
      elements.value = newWorkflow.elements.map((el) => ({
        id: el.id,
        type: 'custom-node',
        position: { x: el.position.x, y: el.position.y },
        data: {
          ...el,
          // Vue Flow 要求数据中包含必要的属性
          selected: el.selected || false,
          paramValues: el.paramValues || {}
        },
        selected: el.selected || false
      }))

      // 将工作流连接转换为 Vue Flow 连接格式
      connections.value = newWorkflow.connections.map((conn) => ({
        id: conn.id || `conn_${conn.sourceId}_${conn.targetId}`,
        source: conn.sourceId,
        target: conn.targetId,
        sourceHandle: conn.sourceHandle || 'bottom',
        targetHandle: conn.targetHandle || 'top',
        selected: conn.selected || false
      }))
    }
  },
  { immediate: true, deep: true }
)

// 监听元素和连接变化，通知父组件
watch(
  [elements, connections],
  () => {
    // 构建工作流数据
    const updatedWorkflow = {
      ...props.workflow,
      elements: elements.value.map((node) => ({
        id: node.id,
        name: node.data.name,
        icon: node.data.icon,
        position: node.position,
        params: node.data.params || [],
        paramValues: node.data.paramValues || {},
        selected: node.selected
      })),
      connections: connections.value.map((conn) => ({
        id: conn.id,
        sourceId: conn.source,
        targetId: conn.target,
        selected: conn.selected
      }))
    }

    emit('workflow-updated', updatedWorkflow)
  },
  { deep: true }
)

// 处理节点点击
const handleNodeClick = (event, node) => {
  try {
    console.log('handleNodeClick called with:', { eventType: event?.type, hasNode: !!node })

    // 添加多层安全检查
    if (!event) {
      console.warn('handleNodeClick called without an event parameter')
      return
    }

    if (!node) {
      console.warn('handleNodeClick called without a node parameter', {
        eventType: event.type,
        target: event.target?.tagName,
        currentTarget: event.currentTarget?.tagName,
        caller: new Error().stack?.split('\n')[2] // 尝试获取调用者信息
      })
      return
    }

    if (!node.data) {
      console.warn('handleNodeClick called with a node that has no data property', {
        nodeId: node.id
      })
      return
    }

    // 清除之前的选中状态
    if (selectedNode.value && selectedNode.value.data) {
      selectedNode.value.data.selected = false
    }

    // 设置新的选中状态
    node.data.selected = true
    selectedNode.value = node
    
    // 设置焦点节点
    focusedNodeId.value = node.id
  } catch (error) {
    console.error('Error in handleNodeClick:', error)
  }
}

// 使用更健壮的方式监听Vue Flow的节点点击事件
// 首先移除任何可能存在的旧监听器
// 然后添加新的监听器
onMounted(() => {
  // 确保flowInstance已经初始化
  if (flowInstance && flowInstance.onNodeClick) {
    console.log('Setting up node click listener')
    // 注意：VueFlow API可能会有变化，这里使用try-catch确保兼容性
    try {
      // 尝试使用现代API方式 - 处理可能的参数格式变化
      flowInstance.onNodeClick((...args) => {
        console.log('Node click event received via flowInstance', {
          argsCount: args.length,
          args: args
        })

        // 处理可能的参数格式变化
        let event, node
        if (args.length === 1) {
          // 可能是VueFlow新版本的API，参数是单个对象
          const payload = args[0]
          event = payload.event || payload
          node = payload.node
        } else if (args.length >= 2) {
          // 传统API格式
          event = args[0]
          node = args[1]
        }

        // 只有当node存在时才调用handleNodeClick，避免不必要的警告
        if (node) {
          handleNodeClick(event, node)
        } else {
          console.log('Skipping handleNodeClick call due to missing node parameter')
        }
      })
    } catch (error) {
      console.warn('Failed to set up node click listener with modern API:', error)
      // 尝试使用备选方案 - 监听底层DOM事件（如果需要）
    }
  }
  
  // 监听画布点击事件，用于清除焦点状态
  const canvasElement = document.querySelector('.vue-flow__viewport')
  if (canvasElement) {
    canvasElement.addEventListener('click', (event) => {
      // 只有当点击的是画布本身而不是节点时才清除焦点
      if (event.target.classList.contains('vue-flow__viewport') || 
          event.target.classList.contains('vue-flow__background')) {
        focusedNodeId.value = null
      }
    })
  }
})

// 处理节点拖动
const handleNodeDragStart = () => {
  // 节点拖动开始时的处理逻辑
}

const handleNodeDragStop = () => {
  // 节点拖动结束时自动保存位置更新
  handleNodeUpdate()
}

// 处理节点位置变化
const handleNodePositionChange = () => {
  handleNodeUpdate()
}

// 处理节点更新
const handleNodeUpdate = () => {
  // 触发工作流更新事件
  emit('workflow-updated', {
    ...props.workflow,
    elements: elements.value.map((node) => ({
      id: node.id,
      name: node.data.name,
      icon: node.data.icon,
      position: node.position,
      params: node.data.params || [],
      paramValues: node.data.paramValues || {},
      selected: node.selected
    })),
    connections: connections.value.map((conn) => ({
      id: conn.id,
      sourceId: conn.source,
      targetId: conn.target,
      selected: conn.selected
    }))
  })
}

// 处理连接成功
const handleConnectionSuccess = (params) => {
  const { edge } = params
  connections.value.push({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    selected: false
  })
}

// 处理连接创建
const handleConnect = (connection) => {
  // 生成唯一的连接 ID
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    ...connection,
    id: connectionId
  }
}

// 处理节点鼠标悬停
const handleNodeMouseEnter = (event, node) => {
  hoveredNodeId.value = node.id
}

const handleNodeMouseLeave = () => {
  hoveredNodeId.value = null
}

// 处理缩放
const handleZoom = (zoomLevel) => {
  currentZoom.value = zoomLevel
}

// 工具栏方法
const zoomIn = () => {
  // 在新版本中使用flowInstance的zoom方法
  if (flowInstance.zoom) {
    flowInstance.zoom(1.2)
  } else if (vueFlowRef.value && vueFlowRef.value.zoomTo) {
    // 备选方案：使用vueFlowRef的zoomTo方法
    vueFlowRef.value.zoomTo(flowInstance.viewport.zoom * 1.2)
  }
}

const zoomOut = () => {
  // 在新版本中使用flowInstance的zoom方法
  if (flowInstance.zoom) {
    flowInstance.zoom(0.8)
  } else if (vueFlowRef.value && vueFlowRef.value.zoomTo) {
    // 备选方案：使用vueFlowRef的zoomTo方法
    vueFlowRef.value.zoomTo(flowInstance.viewport.zoom * 0.8)
  }
}

const resetZoom = () => {
  // 在新版本中使用flowInstance的zoom方法
  if (flowInstance.zoom) {
    flowInstance.zoom(1)
  } else if (vueFlowRef.value && vueFlowRef.value.zoomTo) {
    // 备选方案：使用vueFlowRef的zoomTo方法
    vueFlowRef.value.zoomTo(1)
  }
}

const centerCanvas = () => {
  // 在新版本中使用vueFlowRef的fitView方法来居中画布
  if (vueFlowRef.value) {
    vueFlowRef.value.fitView()
  }
}

// 简单布局算法，参考Vue Flow官网示例
const layout = (nodes, edges, direction) => {
  // 复制节点数组以避免直接修改原始数据
  const newNodes = [...nodes]
  
  // 如果没有节点，直接返回
  if (newNodes.length === 0) {
    return newNodes
  }
  
  // 节点间距
  const nodeGap = 150
  // 层级间距
  const levelGap = 180
  
  // 构建节点映射
  const nodeMap = new Map(newNodes.map(node => [node.id, node]))
  
  // 找出所有根节点（没有入边的节点）
  const rootNodes = newNodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  )
  
  // 计算每个节点的层级
  const nodeLevels = new Map()
  
  // BFS计算层级
  const calculateLevels = () => {
    const queue = [...rootNodes]
    
    // 设置根节点层级为0
    rootNodes.forEach(node => nodeLevels.set(node.id, 0))
    
    while (queue.length > 0) {
      const current = queue.shift()
      const currentLevel = nodeLevels.get(current.id)
      const nextLevel = currentLevel + 1
      
      // 找到当前节点的所有子节点
      const childEdges = edges.filter(edge => edge.source === current.id)
      
      childEdges.forEach(edge => {
        const childNode = nodeMap.get(edge.target)
        if (childNode && !nodeLevels.has(childNode.id)) {
          nodeLevels.set(childNode.id, nextLevel)
          queue.push(childNode)
        }
      })
    }
    
    // 如果没有根节点（环形图），默认将所有节点放在同一层
    if (nodeLevels.size === 0) {
      newNodes.forEach(node => nodeLevels.set(node.id, 0))
    }
  }
  
  calculateLevels()
  
  // 按层级分组节点
  const levelGroups = new Map()
  nodeLevels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level).push(nodeMap.get(nodeId))
  })
  
  // 计算每个层级的节点位置
  const levelKeys = Array.from(levelGroups.keys()).sort((a, b) => a - b)
  
  levelKeys.forEach(level => {
    const levelNodes = levelGroups.get(level)
    const levelCount = levelNodes.length
    const levelOffset = (levelCount - 1) * nodeGap / 2
    
    levelNodes.forEach((node, index) => {
      if (direction === 'TB') {
        // 垂直布局 (top to bottom)
        node.position.x = 200 + level * levelGap
        node.position.y = 100 + index * nodeGap - levelOffset
      } else {
        // 水平布局 (left to right)
        node.position.x = 100 + index * nodeGap - levelOffset
        node.position.y = 200 + level * levelGap
      }
    })
  })
  
  return newNodes
}

// 执行布局
const layoutGraph = async (direction) => {
  try {
    // 执行布局算法
    const newNodes = layout(elements.value, connections.value, direction)
    
    // 更新节点位置
    elements.value = newNodes
    
    // 使用nextTick确保DOM更新后再调整视图
    await nextTick()
    
    // 调整视图以适应所有节点
    if (vueFlowRef.value) {
      vueFlowRef.value.fitView()
    }
  } catch (error) {
    console.error('执行布局时出错:', error)
  }
}

// 处理拖拽元素到画布
const handleDrop = (event) => {
  try {
    // 获取拖拽数据
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))

    if (dragData.type === 'element' && dragData.elementData) {
      // 获取相对于画布的位置
      const { offsetLeft, offsetTop } = event.currentTarget
      const x = event.clientX - offsetLeft
      const y = event.clientY - offsetTop

      // 转换为网格对齐的位置
      const gridSize = 20
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize

      // 创建新节点
      const newNode = {
        id: dragData.elementData.id,
        type: 'custom-node',
        position: { x: snappedX, y: snappedY },
        data: {
          ...dragData.elementData,
          selected: false,
          paramValues: dragData.elementData.params.reduce((acc, param) => {
            acc[param.key] = param.defaultValue
            return acc
          }, {})
        },
        selected: false
      }

      // 添加新节点到画布
      elements.value.push(newNode)
    }
  } catch (error) {
    console.error('拖拽元素到画布时出错:', error)
  }
}

const handleDragOver = (event) => {
  event.preventDefault() // 允许放置
}

// 移除元素
const removeElement = (nodeId) => {
  // 移除节点
  elements.value = elements.value.filter((node) => node.id !== nodeId)

  // 移除与该节点相关的所有连接
  connections.value = connections.value.filter(
    (conn) => conn.source !== nodeId && conn.target !== nodeId
  )

  // 清除选中状态
  if (selectedNode.value && selectedNode.value.id === nodeId) {
    selectedNode.value = null
  }
}

// 辅助方法
const getParamDisplayValue = (paramValues, param) => {
  const value = paramValues[param.key]
  if (value === undefined || value === null) {
    return '未设置'
  }

  // 对于长字符串进行截断显示
  if (typeof value === 'string' && value.length > 10) {
    return value.substring(0, 10) + '...'
  }

  return value.toString()
}

// 暴露方法给父组件
const resetWorkflow = () => {
  elements.value = []
  connections.value = []
  selectedNode.value = null
}

const onWorkflowCleared = () => {
  elements.value = []
  connections.value = []
  selectedNode.value = null
}

const saveWorkflow = () => {
  // 这个方法会由父组件实现
  console.log('保存工作流')
}

const loadWorkflow = () => {
  // 这个方法会由父组件实现
  console.log('加载工作流')
}

// 暴露方法给父组件
defineExpose({
  resetWorkflow,
  onWorkflowCleared,
  saveWorkflow,
  loadWorkflow
})
</script>

<style scoped>
.vue-flow-editor {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-light);
}

.editor-toolbar {
  height: 40px;
  background-color: var(--color-background-900);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background-color: var(--color-border);
  margin: 0 4px;
}

.vue-flow-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.vue-flow-workspace {
  height: 100%;
  width: 100%;
  background-color: var(--color-background-light);
}

.editor-properties {
  position: absolute;
  top: 50px;
  right: 10px;
  width: 300px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  z-index: 1000;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.properties-header {
  margin-bottom: 12px;
}

.properties-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.element-properties h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--color-text-primary);
}

.property-group {
  margin-bottom: 16px;
}

.property-group h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.position-inputs {
  display: flex;
  gap: 8px;
}

.position-inputs .el-input-number {
  flex: 1;
}

.param-item {
  margin-bottom: 12px;
}

.param-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.required-mark {
  color: #f56c6c;
}

.param-input {
  width: 100%;
}

/* 自定义节点样式 */
.custom-node {
  min-width: 150px;
  background-color: var(--color-background-800);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

/* 自定义节点基础样式 */
.custom-node {
  position: relative;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-800);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 180px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 连接点样式 */
.handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: var(--color-primary);
  border: 2px solid white;
  border-radius: 50%;
  cursor: crosshair;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  opacity: 0.8;
}

.handle-top {
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
}

.handle-bottom {
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
}

.handle:hover,
.custom-node:hover .handle {
  opacity: 1;
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* 节点状态样式 */
.custom-node:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.custom-node-selected {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  background-color: rgba(59, 130, 246, 0.05);
}

.custom-node-focused {
  box-shadow: 0 0 0 2px var(--color-primary), 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* 节点头部样式 */
.node-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: var(--color-background-700);
  border-bottom: 1px solid var(--color-border);
  border-radius: 8px 8px 0 0;
}

.node-icon {
  margin-right: 8px;
  color: var(--color-primary);
  font-size: 16px;
}

.node-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 0;
}

.node-actions {
  display: flex;
  gap: 4px;
}

.node-action {
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
}

.custom-node:hover .node-action {
  opacity: 1;
}

.node-action:hover {
  background-color: var(--color-background-600);
  color: var(--color-text-primary);
}

.node-remove:hover {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

/* 节点参数样式 */
.node-params {
  padding: 10px 12px;
  background-color: var(--color-background-800);
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 2px 0;
}

.param-item:last-child {
  margin-bottom: 0;
}

.param-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
  margin-right: 8px;
}

.param-value {
  font-size: 12px;
  color: var(--color-text-tertiary);
  word-break: break-all;
  text-align: right;
}

.param-more {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dotted var(--color-border);
}

/* 响应式节点 */
@media (max-width: 768px) {
  .custom-node {
    min-width: 140px;
  }
  
  .node-header {
    padding: 8px 10px;
  }
  
  .node-params {
    padding: 8px 10px;
  }
}

/* 连接线样式 */
.connection-path {
  stroke: #94a3b8;
  stroke-width: 2;
  fill: none;
  marker-end: url(#arrowhead);
  transition: all 0.2s ease;
}

.connection-path:hover {
  stroke: var(--color-primary);
  stroke-width: 3;
}

.connection-path-selected {
  stroke: var(--color-primary) !important;
  stroke-width: 3 !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .editor-properties {
    position: relative;
    width: 100%;
    top: 0;
    right: 0;
    max-height: 200px;
    border-radius: 0;
  }
}
</style>
