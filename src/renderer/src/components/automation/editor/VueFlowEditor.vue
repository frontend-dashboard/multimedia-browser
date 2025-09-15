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
        <el-icon><Refresh /></el-icon> 重置大小
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
        :nodes="elements"
        :edges="edges"
        :nodes-draggable="true"
        :connection-mode="connectionMode"
        :snap-to-grid="snapToGrid"
        :snap-grid="[20, 20]"
        :fit-view="false"
        :min-zoom="0.5"
        :max-zoom="2"
        class="vue-flow-workspace"
        @drop="handleDrop"
        @dragover="handleDragOver"
      >
        <!-- 背景网格 -->
        <Background
          gap="20"
          stroke="var(--color-border)"
          stroke-width="1"
          class="vue-flow-background"
        />

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
            <!-- 左侧连接点（用于接收连接） -->
            <Handle
              :id="`${data.id}-left`"
              type="target"
              position="left"
              class="handle handle-left"
            />

            <div class="node-header">
              <el-icon class="node-icon">
                <component :is="getIconComponent(data.icon)" />
              </el-icon>
              <span class="node-name">{{ data.name }}</span>
              <div class="node-actions">
                <el-icon
                  class="node-action node-remove"
                  title="删除节点"
                  @click.stop="removeElement(data.id)"
                >
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

            <!-- 右侧连接点（用于发送连接） -->
            <Handle
              :id="`${data.id}-right`"
              type="source"
              position="right"
              class="handle handle-right"
            />
          </div>
        </template>

        <MiniMap :node-stroke-color="nodeStroke" :node-color="nodeColor" />
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

        <!-- 浏览器运行按钮 - 仅对BROWSER_OPEN类型节点显示 -->
        <div v-if="selectedNode.data.type === 'BROWSER_OPEN'" class="property-group">
          <el-button type="primary" size="small" class="run-browser-btn" @click="runBrowserNode">
            运行
          </el-button>
        </div>
      </div>
    </div>

    <!-- <InteractionControls /> -->
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
// 导入 VueFlow 相关组件
import { VueFlow, useVueFlow, Handle } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { ZoomIn, ZoomOut, Refresh, FullScreen, Close } from '@element-plus/icons-vue'
// 导入Element Plus消息组件
import { ElMessage } from 'element-plus'
// 导入图标工具函数
import { getIconComponent } from '../utils/iconUtils.js'
// 导入布局工具
import { useLayout } from '../utils/useLayout.js'

// import InteractionControls from './InteractionControls.vue'

// 导入所需的样式
import '@vue-flow/core/dist/style.css'

// 定义 props
const props = defineProps({
  workflow: {
    type: Object,
    required: true
  }
})

// 已移除自动同步机制，因此不再需要 emits

// 初始化 Vue Flow 实例
const vueFlowRef = ref(null)
const {
  // 保留实际使用的事件处理器和函数
  onConnect,
  onNodeDragStop,
  onNodeDragStart,
  addEdges,
  addNodes,
  dimensions,
  toObject,
  fromObject,
  onNodeClick,
  onConnectionSuccess,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onZoom,
  onDrop,
  onDragOver,
  onPaneClick,
  zoom
} = useVueFlow()

// 初始化布局工具
const { layout: dagreLayout } = useLayout()

// 组件状态
const elements = ref([])
const edges = ref([])
const selectedNode = ref(null)
const hoveredNodeId = ref(null)
const focusedNodeId = ref(null) // 用于存储当前焦点节点ID
const connectionMode = ref('loose')
const snapToGrid = ref(true)
const currentZoom = ref(1)

// MiniMap 配置
const nodeStroke = '#3b82f6' // 节点描边颜色
const nodeColor = '#e2e8f0' // 节点填充颜色

// 监听工作流数据变化，同步到 Vue Flow
watch(
  () => props.workflow,
  (newWorkflow) => {
    if (newWorkflow) {
      // 将工作流元素转换为 Vue Flow 节点格式
      elements.value = newWorkflow.elements.map((el) => ({
        id: el.id,
        type: 'custom-node',
        position: { x: el.position?.x || 0, y: el.position?.y || 0 },
        data: {
          // 确保type参数值被保留
          type: el.type || el.data?.type,
          // 保留其他属性
          ...(el.data ? el.data : el),
          // Vue Flow 要求数据中包含必要的属性
          selected: el.selected || (el.data && el.data.selected) || false,
          paramValues: el.paramValues || (el.data && el.data.paramValues) || {}
        },
        selected: el.selected || (el.data && el.data.selected) || false
      }))

      // 将工作流连接转换为 Vue Flow 连接格式
      edges.value = newWorkflow.edges.map((conn) => ({
        id: conn.id || `edge_${conn.source}_${conn.target}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle || 'bottom',
        targetHandle: conn.targetHandle || 'top',
        selected: conn.selected || false
      }))
    }
  },
  { immediate: true, deep: true }
)

onConnect((params) => {
  console.log('connect', params)
  addEdges(params)
})

// 导出工作流数据的方法，供父组件在保存时调用
const exportWorkflowData = () => {
  // 使用 Vue Flow 提供的 toObject 方法获取工作流数据
  if (toObject) {
    const flowData = toObject()
    return {
      ...props.workflow,
      elements: flowData.nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        icon: node.data.icon,
        position: node.position,
        params: node.data.params || [],
        paramValues: node.data.paramValues || {},
        selected: node.selected
      })),
      edges: flowData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'smoothstep',
        selected: edge.selected
      }))
    }
  } else {
    // 降级方案：使用当前实现
    return {
      ...props.workflow,
      elements: elements.value.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        icon: node.data.icon,
        position: node.position,
        params: node.data.params || [],
        paramValues: node.data.paramValues || {},
        selected: node.selected
      })),
      edges: edges.value.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        type: conn.type || 'smoothstep',
        selected: conn.selected
      }))
    }
  }
}

// 移除自动同步，改为由父组件主动获取数据
// 注：所有编辑器操作将仅更新本地状态，不再自动通知父组件

// 处理节点点击
const handleNodeClick = (event, node) => {
  try {
    // 添加多层安全检查
    if (!event || !node || !node.data) {
      return
    }

    // 清除之前的选中状态
    if (selectedNode.value && selectedNode.value.data) {
      selectedNode.value.data.selected = false
    }

    // 设置新的选中状态
    node.data.selected = true
    selectedNode.value = node
    focusedNodeId.value = node.id
  } catch (error) {
    console.error('Error in handleNodeClick:', error)
  }
}

// 处理画布点击，关闭属性面板
const handlePaneClick = () => {
  focusedNodeId.value = null
  // 点击非节点位置时，关闭属性面板
  if (selectedNode.value) {
    // 清除选中节点的选中状态
    selectedNode.value.data.selected = false
    // 关闭属性面板
    selectedNode.value = null
  }
}

// 运行浏览器节点
const runBrowserNode = async () => {
  try {
    if (!selectedNode.value || !selectedNode.value.data || selectedNode.value.data.type !== 'BROWSER_OPEN') {
      return
    }

    const nodeData = selectedNode.value.data
    const url = nodeData.paramValues.url || 'https://www.example.com'
    const browserType = nodeData.paramValues.browserType || 'chrome'
    const incognito = nodeData.paramValues.incognito || false
    const windowSize = nodeData.paramValues.windowSize || 'default'
    const customWidth = nodeData.paramValues.customWidth || 1280
    const customHeight = nodeData.paramValues.customHeight || 800
    const waitUntil = nodeData.paramValues.waitUntil || 'networkidle'
    const timeout = nodeData.paramValues.timeout || 30000

    console.log(
      `运行浏览器: ${browserType}, 打开URL: ${url}, 隐身模式: ${incognito}, 窗口大小: ${windowSize}`
    )

    // 通过preload脚本中暴露的API调用主进程的浏览器自动化功能
    if (window.api && window.api.browserAutomation) {
      try {
        const result = await window.api.browserAutomation.runNode({
          url,
          browserType,
          incognito,
          windowSize,
          customWidth,
          customHeight,
          waitUntil,
          timeout
        })
        console.log('浏览器运行结果:', result)
        // 显示成功消息
        if (result.success) {
          ElMessage.success(result.message || '浏览器已成功打开')
        } else {
          ElMessage.error(result.error || '打开浏览器失败')
        }
      } catch (error) {
        console.error('调用浏览器自动化API失败:', error)
        ElMessage.error('调用浏览器自动化API失败')
      }
    } else {
      console.log('在开发环境中模拟打开浏览器')
      // 在开发环境中可以模拟这个行为
      window.open(url, '_blank')
      ElMessage.info('在开发环境中已尝试打开浏览器')
    }
  } catch (error) {
    console.error('运行浏览器节点出错:', error)
  }
}

// 设置所有VueFlow事件监听
onMounted(() => {
  // 节点点击事件
  if (onNodeClick) {
    try {
      onNodeClick((...args) => {
        let event, node
        if (args.length === 1) {
          const payload = args[0]
          event = payload.event || payload
          node = payload.node
        } else if (args.length >= 2) {
          event = args[0]
          node = args[1]
        }

        if (node) {
          handleNodeClick(event, node)
        }
      })
    } catch (error) {
      console.warn('Failed to set up node click listener:', error)
    }
  }

  // 节点拖动开始事件
  if (onNodeDragStart) {
    onNodeDragStart(handleNodeDragStart)
  }

  // 节点拖动结束事件
  if (onNodeDragStop) {
    onNodeDragStop(handleNodeDragStop)
  }

  // 连接成功事件
  if (onConnectionSuccess) {
    onConnectionSuccess(handleEdgeSuccess)
  }

  // 节点鼠标悬停事件
  if (onNodeMouseEnter) {
    onNodeMouseEnter((event, node) => handleNodeMouseEnter(event, node))
  }

  // 节点鼠标离开事件
  if (onNodeMouseLeave) {
    onNodeMouseLeave(handleNodeMouseLeave)
  }

  // 缩放事件
  if (onZoom) {
    onZoom(handleZoom)
  }

  // 拖放事件
  if (onDrop) {
    onDrop(handleDrop)
  }

  // 拖拽悬停事件
  if (onDragOver) {
    onDragOver(handleDragOver)
  }

  // 使用Vue Flow的官方paneClick事件（推荐方式）
  if (onPaneClick) {
    try {
      onPaneClick(handlePaneClick)
    } catch (error) {
      console.warn('Failed to set up pane click listener:', error)
      // 如果onPaneClick不可用，回退到DOM事件监听
      const canvasElement = document.querySelector('.vue-flow__viewport')
      if (canvasElement) {
        canvasElement.addEventListener('click', (event) => {
          if (
            event.target.classList.contains('vue-flow__viewport') ||
            event.target.classList.contains('vue-flow__background')
          ) {
            handlePaneClick()
          }
        })
      }
    }
  } else {
    // 如果onPaneClick不可用，使用DOM事件监听作为后备方案
    const canvasElement = document.querySelector('.vue-flow__viewport')
    if (canvasElement) {
      canvasElement.addEventListener('click', (event) => {
        if (
          event.target.classList.contains('vue-flow__viewport') ||
          event.target.classList.contains('vue-flow__background')
        ) {
          handlePaneClick()
        }
      })
    }
  }
})

// 处理节点拖动
const handleNodeDragStart = () => {
  // 节点拖动开始时的处理逻辑
}

const handleNodeDragStop = (event) => {
  try {
    // 确保事件和节点存在
    if (event && event.node) {
      // 先记录节点的基本位置信息（来自事件对象）
      const nodePosition = event.node.position
      console.log('节点位置信息 (来自事件对象):', nodePosition)

      // 尝试使用 dimensions API 但增加错误处理和日志记录
      if (dimensions) {
        try {
          // 记录 dimensions 对象的结构以便调试
          console.log('dimensions 对象结构:', {
            hasValue: dimensions.value !== undefined,
            valueType: typeof dimensions.value,
            isObject: dimensions.value && typeof dimensions.value === 'object',
            hasGetNodeRect: dimensions.value && typeof dimensions.value.getNodeRect === 'function'
          })

          // 只有当 getNodeRect 方法存在时才调用
          if (dimensions.value && typeof dimensions.value.getNodeRect === 'function') {
            const nodeDimensions = dimensions.value.getNodeRect(event.node.id)
            console.log('节点尺寸信息 (来自 dimensions API):', nodeDimensions)
          }
        } catch (dimensionsError) {
          console.warn('使用 dimensions API 时出错，但不影响功能:', dimensionsError)
        }
      }
    }
    // 节点拖动结束时的处理逻辑 - 不再自动通知父组件
  } catch (error) {
    console.error('Error in handleNodeDragStop:', error)
  }
}

// 处理节点位置变化
const handleNodePositionChange = () => {
  // 节点位置变化的处理逻辑 - 不再自动通知父组件
}

// 处理节点数据更新
const handleNodeUpdate = () => {
  try {
    if (!selectedNode.value || !selectedNode.value.data) return

    // 对不同类型的参数进行特定处理
    selectedNode.value.data.params.forEach((param) => {
      const key = param.key
      let value = selectedNode.value.data.paramValues[key]

      // 确保参数值符合类型要求
      if (param.type === 'number' && value !== null && value !== undefined) {
        // 转换为数字类型
        selectedNode.value.data.paramValues[key] = Number(value)
      } else if (param.type === 'boolean') {
        // 确保布尔值类型正确
        selectedNode.value.data.paramValues[key] = !!value
      } else if (param.type === 'string' && value === null) {
        // 确保字符串类型不为null
        selectedNode.value.data.paramValues[key] = ''
      }

      // 必填参数验证
      if (param.required && (!value || value === '')) {
        console.warn(`节点"${selectedNode.value.data.name}"的必填参数"${param.label}"未设置`)
      }
    })

    // 标记节点为已更新（可以用于UI反馈）
    // 注意：不再自动通知父组件，而是由父组件主动获取数据
  } catch (error) {
    console.error('更新节点数据时出错:', error)
  }
}

// 处理连接成功
const handleEdgeSuccess = (params) => {
  try {
    if (!params || !params.edge) {
      console.warn('Invalid edge connection params:', params)
      return
    }

    const { edge } = params
    edges.value.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type || 'smoothstep',
      selected: false
    })
  } catch (error) {
    console.error('Error in handleEdgeSuccess:', error)
  }
}

// 处理节点鼠标悬停
const handleNodeMouseEnter = (event, node) => {
  if (node && node.id) {
    hoveredNodeId.value = node.id
  }
}

const handleNodeMouseLeave = () => {
  hoveredNodeId.value = null
}

// 处理缩放
const handleZoom = (zoomLevel) => {
  currentZoom.value = zoomLevel
}

// 工具栏方法 - 统一处理缩放逻辑
const handleZoomChange = (scaleFactor) => {
  if (zoom) {
    zoom(scaleFactor)
  } else if (vueFlowRef.value && vueFlowRef.value.zoomTo) {
    const newZoomLevel = currentZoom.value * scaleFactor
    if (!isNaN(newZoomLevel)) {
      vueFlowRef.value.zoomTo(newZoomLevel)
    }
  }
}

const zoomIn = () => {
  handleZoomChange(1.2)
}

const zoomOut = () => {
  handleZoomChange(0.8)
}

const resetZoom = () => {
  if (zoom) {
    zoom(1)
  } else if (vueFlowRef.value && vueFlowRef.value.zoomTo) {
    vueFlowRef.value.zoomTo(1)
  }
}

const centerCanvas = () => {
  // 在新版本中使用vueFlowRef的fitView方法来居中画布
  if (vueFlowRef.value) {
    vueFlowRef.value.fitView()
  }
}

// 使用 dagre 库的布局算法
const layout = (nodes, edges, direction) => {
  try {
    // 调用从 useLayout composable 导入的 dagre 布局函数
    return dagreLayout(nodes, edges, direction)
  } catch (error) {
    console.warn('Dagre布局失败，使用备选布局方案:', error)

    // 复制节点数组以避免直接修改原始数据
    const newNodes = [...nodes]

    // 如果没有节点，直接返回
    if (newNodes.length === 0) {
      return newNodes
    }

    // 简单备选布局算法
    const nodeGap = 150
    const centerOffset = 200

    newNodes.forEach((node, index) => {
      if (direction === 'TB') {
        // 垂直布局 (top to bottom) - 简单线性排列
        node.position.x = centerOffset
        node.position.y = 100 + index * nodeGap
      } else {
        // 水平布局 (left to right) - 简单线性排列
        node.position.x = 100 + index * nodeGap
        node.position.y = centerOffset
      }
    })

    return newNodes
  }
}

// 执行布局
const layoutGraph = async (direction) => {
  try {
    let workflowData = exportWorkflowData()
    console.log('workflowData:', workflowData.elements)
    console.log('workflowData:', workflowData.edges)
    // 执行布局算法
    const newNodes = layout(workflowData.elements, workflowData.edges, direction)

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
    console.log('handleDrop called')
    // 获取拖拽数据
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))
    console.log('dragData:', dragData)

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

      // 使用 Vue Flow 提供的 addNodes 方法添加新节点
      if (addNodes) {
        addNodes([newNode])
      } else {
        // 降级方案：直接添加到元素数组
        elements.value.push(newNode)
      }
    }
  } catch (error) {
    console.error('拖拽元素到画布时出错:', error)
  }
}

const handleDragOver = (event) => {
  console.log('handleDragOver called')
  event.preventDefault() // 允许放置
}

// 移除元素
const removeElement = (nodeId) => {
  // 移除节点
  elements.value = elements.value.filter((node) => node.id !== nodeId)

  // 移除与该节点相关的所有连接
  edges.value = edges.value.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

  // 清除选中状态
  if (selectedNode.value && selectedNode.value.id === nodeId) {
    selectedNode.value = null
  }
}

// 辅助方法：获取参数显示值
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
  // 使用 Vue Flow 提供的 fromObject 方法重置数据
  if (fromObject) {
    fromObject({
      nodes: [],
      edges: []
    })
  } else {
    // 降级方案：直接清空数组
    elements.value = []
    edges.value = []
  }
  selectedNode.value = null
}

const onWorkflowCleared = () => {
  resetWorkflow()
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
  loadWorkflow,
  // 新增：提供获取工作流数据的方法，供父组件在保存时调用
  getWorkflowData: exportWorkflowData
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

.editor-properties {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
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

.run-browser-btn {
  width: 100%;
  margin-top: 8px;
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

.required-mark {
  color: #f56c6c;
}

.param-input {
  width: 100%;
}

/* 自定义节点样式 - 合并重复定义 */
.custom-node {
  position: relative;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-800);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 180px;
  animation: fadeIn 0.3s ease;
  cursor: grab;
  z-index: 1;
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

/* 左侧连接点 */
.handle-left {
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
}

/* 右侧连接点 */
.handle-right {
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
}

/* 连接点悬停效果 */
.handle:hover,
.custom-node:hover .handle {
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* 重置左侧连接点悬停的transform */
.handle-left:hover,
.custom-node:hover .handle-left {
  transform: translateY(-50%) scale(1.1);
}

/* 重置右侧连接点悬停的transform */
.handle-right:hover,
.custom-node:hover .handle-right {
  transform: translateY(-50%) scale(1.1);
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
  box-shadow:
    0 0 0 2px var(--color-primary),
    0 4px 12px rgba(59, 130, 246, 0.2);
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

/* 节点参数项样式 */
.node-params .param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 2px 0;
}

.node-params .param-item:last-child {
  margin-bottom: 0;
}

.param-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
  margin-right: 8px;
  margin-bottom: 4px;
  cursor: grab;
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
  /* 响应式节点 */
  .custom-node {
    min-width: 140px;
  }

  .node-header {
    padding: 8px 10px;
  }

  .node-params {
    padding: 8px 10px;
  }

  /* 响应式属性面板 */
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
