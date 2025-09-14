<template>
  <div class="workflow-editor">
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
      <el-button size="small" @click="centerCanvas">
        <el-icon><FullScreen /></el-icon> 居中
      </el-button>
    </div>

    <!-- 主要内容区 -->
    <div class="editor-content">
      <!-- 工作区 -->
      <div 
          class="editor-canvas-container" 
          @wheel.prevent="handleWheel"
        >
          <div
            class="editor-canvas"
            ref="canvasRef"
            :style="canvasStyle"
            @dragover="handleDragOver"
            @drop="handleDrop"
            @mousedown="handleCanvasMouseDown"
            @click="handleCanvasClick"
          >
          <!-- 工作区背景 -->
          <div class="canvas-grid"></div>

          <!-- 连接线层 -->
          <svg class="connection-layer" ref="connectionLayerRef">
            <!-- 渲染所有连接线 -->
            <g class="connections-group">
              <path
                v-for="connection in connections"
                :key="connection.id"
                :d="getConnectionPath(connection)"
                class="connection-path"
                :class="{ 'connection-path-selected': connection.selected }"
                @click.stop="selectConnection(connection)"
                :stroke-width="connection.selected ? 3 : 2"
                :data-source-id="connection.sourceId"
                :data-target-id="connection.targetId"
              />
            </g>

            <!-- 临时连接线（拖拽时） -->
            <path
              v-if="tempConnection"
              :d="getTempConnectionPath()"
              class="temp-connection-path"
              stroke-width="2"
            />
          </svg>

          <!-- 节点层 -->
          <div class="element-nodes" @click="handleNodesContainerClick">
            <!-- 调试: 显示元素数量 -->
            <div v-if="isDebug" class="debug-info">元素数量: {{ elements.length }}</div>

            <!-- 渲染所有节点 -->
            <div
              v-for="element in elements"
              :key="element.id"
              class="element-node"
              :class="{
                'element-node-selected': element.selected,
                'element-node-hover': hoveredElementId === element.id
              }"
              :style="{
                left: element.position.x + 'px',
                top: element.position.y + 'px'
              }"
              @mouseenter="hoveredElementId = element.id"
              @mouseleave="hoveredElementId = null"
            >
              <!-- 节点头部 - 点击可拖拽元素 -->
              <div class="node-header" @mousedown.stop="handleNodeHeaderMouseDown($event, element)">
                <el-icon class="node-icon">
                  <component :is="getIconComponent(element.icon)" />
                </el-icon>
                <span class="node-name">{{ element.name }}</span>
                <el-icon class="node-remove" @click.stop="removeElement(element)">
                  <Close />
                </el-icon>
              </div>

              <!-- 节点参数 - 点击可显示属性面板 -->
              <div class="node-params" @click.stop="selectElement(element)">
                <div v-for="param in element.params" :key="param.key" class="param-item">
                  <label class="param-label">{{ param.label }}</label>
                  <div class="param-input">
                    <el-input
                      v-if="param.type === 'string'"
                      v-model="element.paramValues[param.key]"
                      placeholder="请输入"
                      size="small"
                    />
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="element.paramValues[param.key]"
                      :min="0"
                      size="small"
                    />
                    <el-select
                      v-else-if="param.type === 'select'"
                      v-model="element.paramValues[param.key]"
                      placeholder="请选择"
                      size="small"
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
                      v-model="element.paramValues[param.key]"
                    />
                  </div>
                </div>
              </div>

              <!-- 连接点 -->
              <div class="connection-points" @click.stop="clearSelection">
                <div
                  class="connection-point input-point"
                  @dragstart="onInputDragStart($event, element)"
                  title="输入连接点"
                ></div>
                <div
                  class="connection-point output-point"
                  @dragstart="onOutputDragStart($event, element)"
                  title="输出连接点"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 属性面板 - 仅在选中元素或连接线时显示 -->
      <div v-if="selectedElement || selectedConnection" class="editor-properties">
        <div class="properties-header">
          <h3>属性面板</h3>
        </div>

        <div v-if="selectedElement" class="element-properties">
          <h4>{{ selectedElement.name }}</h4>
          <el-divider />

          <!-- 基础属性 -->
          <div class="property-group">
            <h5>基础属性</h5>
            <el-input v-model="selectedElement.name" placeholder="元件名称" />
          </div>

          <!-- 位置属性 -->
          <div class="property-group">
            <h5>位置</h5>
            <div class="position-inputs">
              <el-input-number v-model="selectedElement.position.x" label="X" :min="0" />
              <el-input-number v-model="selectedElement.position.y" label="Y" :min="0" />
            </div>
          </div>

          <!-- 元件特有属性 -->
          <div
            v-if="selectedElement.params && selectedElement.params.length > 0"
            class="property-group"
          >
            <h5>元件属性</h5>
            <div v-for="param in selectedElement.params" :key="param.key" class="param-item">
              <label class="param-label"
                >{{ param.label }}<span v-if="param.required" class="required-mark">*</span></label
              >
              <div class="param-input">
                <el-input
                  v-if="param.type === 'string'"
                  v-model="selectedElement.paramValues[param.key]"
                  :placeholder="'请输入'"
                />
                <el-input-number
                  v-else-if="param.type === 'number'"
                  v-model="selectedElement.paramValues[param.key]"
                  :min="0"
                />
                <el-select
                  v-else-if="param.type === 'select'"
                  v-model="selectedElement.paramValues[param.key]"
                  placeholder="请选择"
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
                  v-model="selectedElement.paramValues[param.key]"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 连接线属性 -->
        <div v-else-if="selectedConnection" class="connection-properties">
          <h4>连接线属性</h4>
          <el-divider />
          <div class="property-group">
            <h5>连接信息</h5>
            <el-input v-model="selectedConnection.id" placeholder="连接ID" disabled />
            <el-input v-model="selectedConnection.name" placeholder="连接名称" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close, ZoomIn, ZoomOut, Refresh, FullScreen } from '@element-plus/icons-vue'
import {
  ChromeFilled,
  Close as CloseIcon,
  Pointer,
  Edit,
  DataAnalysis,
  Clock,
  Sort,
  Download
} from '@element-plus/icons-vue'

// 导入日志工具
import logger from '@renderer/utils/logger.js'

// Props
const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({})
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['workflow-updated', 'selection-changed'])

// 响应式数据 - 使用reactive创建本地工作流对象
const localWorkflow = reactive({
  elements: props.workflow.elements || [],
  connections: props.workflow.connections || []
})

// 确保elements和connections数组存在
if (!localWorkflow.elements) {
  localWorkflow.elements = []
}
if (!localWorkflow.connections) {
  localWorkflow.connections = []
}

// 计算属性
const elements = computed(() => localWorkflow.elements || [])
const connections = computed(() => localWorkflow.connections || [])

// 画布状态
const canvasRef = ref(null)
const connectionLayerRef = ref(null)

// 缩放和位置 - 重构核心功能
const scale = ref(1)
const canvasPosition = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const initialCanvasPosition = ref({ x: 0, y: 0 })

// 拖拽状态
const tempConnection = ref(null)
const isConnecting = ref(false)

// 选中状态
const selectedElement = ref(null)
const selectedConnection = ref(null)
const hoveredElementId = ref(null)

// 调试模式
const isDebug = ref(false)

// 画布样式 - 动态计算缩放和位置，并设置画布大小以支持连线功能
const canvasStyle = computed(() => ({
  width: '4000px',
  height: '3000px',
  transform: `scale(${scale.value}) translate(${canvasPosition.value.x}px, ${canvasPosition.value.y}px)`,
  transformOrigin: '0 0',
  transition: isPanning.value ? 'none' : 'transform 0.2s ease'
}))

// 只在初始化时使用props数据
onMounted(() => {
  // 初始化时从props获取数据
  if (
    props.workflow &&
    (props.workflow.elements?.length > 0 || props.workflow.connections?.length > 0)
  ) {
    Object.assign(localWorkflow, JSON.parse(JSON.stringify(props.workflow)))
  } else {
    initWorkflow()
  }

  // 添加全局鼠标移动事件，用于更新临时连接线
  const handleMouseMove = (event) => {
    if (isConnecting.value && tempConnection.value) {
      const rect = canvasRef.value.getBoundingClientRect()
      tempConnection.value.currentPoint = {
        x: (event.clientX - rect.left) / scale.value,
        y: (event.clientY - rect.top) / scale.value
      }
    }
  }

  document.addEventListener('mousemove', handleMouseMove)

  // 清理函数
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
  })
})

// 监听工作流内部变化，通知父组件
watch(
  () => [localWorkflow.elements, localWorkflow.connections],
  () => {
    emit('workflow-updated', { ...localWorkflow })
  },
  { deep: true }
)

// 监听选中状态变化
watch([selectedElement, selectedConnection], () => {
  emit('selection-changed', {
    element: selectedElement.value,
    connection: selectedConnection.value
  })
})

// 获取图标组件
const getIconComponent = (iconName) => {
  const iconMap = {
    browser: ChromeFilled,
    click: Pointer,
    input: Edit,
    wait: Clock,
    data: DataAnalysis,
    sort: Sort,
    download: Download,
    close: CloseIcon
  }
  return iconMap[iconName] || ChromeFilled
}

// 保存工作流
const saveWorkflow = () => {
  try {
    // 将工作流数据保存到本地存储
    const workflowData = JSON.parse(JSON.stringify(localWorkflow))
    localStorage.setItem('savedWorkflow', JSON.stringify(workflowData))
    // 触发事件通知父组件
    emit('workflow-updated', workflowData)
    logger.info('工作流保存成功')
  } catch (error) {
    logger.error('保存工作流失败:', error)
    alert('保存工作流失败，请重试')
  }
}

// 加载工作流
const loadWorkflow = () => {
  try {
    // 从本地存储加载工作流数据
    const savedWorkflow = localStorage.getItem('savedWorkflow')
    if (savedWorkflow) {
      const parsedWorkflow = JSON.parse(savedWorkflow)
      // 更新本地工作流
      Object.assign(localWorkflow, parsedWorkflow)
      logger.info('工作流加载成功')
    } else {
      alert('没有找到已保存的工作流')
    }
  } catch (error) {
    logger.error('加载工作流失败:', error)
    alert('加载工作流失败，请重试')
  }
}

// 清空画布
const onWorkflowCleared = () => {
  // 清空本地工作流
  localWorkflow.elements = []
  localWorkflow.connections = []
  // 清空选中状态
  selectedElement.value = null
  selectedConnection.value = null
  tempConnection.value = null
  console.log('画布已清空')
  // 触发事件通知父组件
  emit('workflow-updated', { ...localWorkflow })
}

// 添加元素
const addElement = (elementData) => {
  const newElement = {
    id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: elementData.name,
    type: elementData.type,
    icon: elementData.icon,
    position: elementData.position || { x: 100, y: 100 },
    params: elementData.params || [],
    paramValues: elementData.paramValues || {},
    selected: false
  }

  // 初始化参数值
  newElement.params.forEach((param) => {
    if (!(param.key in newElement.paramValues)) {
      newElement.paramValues[param.key] = param.defaultValue || ''
    }
  })

  localWorkflow.elements.push(newElement)
  return newElement
}

// 删除元素
const removeElement = (element) => {
  if (props.readOnly) return

  // 先删除与该元素相关的连接
  localWorkflow.connections = localWorkflow.connections.filter((connection) => {
    return connection.sourceId !== element.id && connection.targetId !== element.id
  })

  // 然后删除元素
  const index = localWorkflow.elements.findIndex((e) => e.id === element.id)
  if (index !== -1) {
    localWorkflow.elements.splice(index, 1)
  }

  // 清除选中状态
  if (selectedElement.value === element) {
    selectedElement.value = null
  }
}

// 处理输入连接点拖拽开始
const onInputDragStart = (event, element) => {
  if (props.readOnly) return

  isConnecting.value = true
  tempConnection.value = {
    sourceId: null,
    targetId: element.id,
    isInput: true,
    startPoint: getEventPosition(event)
  }
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({ targetId: element.id, isInput: true })
  )
}

// 处理输出连接点拖拽开始
const onOutputDragStart = (event, element) => {
  if (props.readOnly) return

  isConnecting.value = true
  tempConnection.value = {
    sourceId: element.id,
    targetId: null,
    isInput: false,
    startPoint: getEventPosition(event)
  }
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({ sourceId: element.id, isInput: false })
  )
}

// 获取事件位置（考虑缩放）
const getEventPosition = (event) => {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) / scale.value,
    y: (event.clientY - rect.top) / scale.value
  }
}

// 获取连接路径（优化贝塞尔曲线）
const getConnectionPath = (connection) => {
  // 找到源元素和目标元素
  const sourceElement = localWorkflow.elements.find((el) => el.id === connection.sourceId)
  const targetElement = localWorkflow.elements.find((el) => el.id === connection.targetId)

  if (!sourceElement || !targetElement) {
    return ''
  }

  // 计算连接点位置（考虑元素中心点）
  const nodeWidth = 150
  const nodeHeight = 100

  const sourceX = sourceElement.position.x + nodeWidth // 输出点在元素右侧
  const sourceY = sourceElement.position.y + nodeHeight / 2 // 输出点在元素中间
  const targetX = targetElement.position.x // 输入点在元素左侧
  const targetY = targetElement.position.y + nodeHeight / 2 // 输入点在元素中间

  // 贝塞尔曲线 - 优化连接线的平滑度
  const controlPointDistance = Math.max(50, Math.abs(sourceX - targetX) / 2)
  return `M ${sourceX} ${sourceY} C ${sourceX + controlPointDistance} ${sourceY}, ${targetX - controlPointDistance} ${targetY}, ${targetX} ${targetY}`
}

// 获取临时连接路径
const getTempConnectionPath = () => {
  if (!tempConnection.value) {
    return ''
  }

  const { startPoint, currentPoint } = tempConnection.value
  if (!currentPoint) {
    return ''
  }

  const controlPointDistance = Math.max(50, Math.abs(startPoint.x - currentPoint.x) / 2)
  return `M ${startPoint.x} ${startPoint.y} C ${startPoint.x + controlPointDistance} ${startPoint.y}, ${currentPoint.x - controlPointDistance} ${currentPoint.y}, ${currentPoint.x} ${currentPoint.y}`
}

// 处理拖拽悬停
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

// 处理拖拽放置
const handleDrop = (event) => {
  event.preventDefault()

  // 检查是否是从外部拖入的元素
  try {
    const data = event.dataTransfer.getData('application/json')

    // 检查数据是否存在且不为空
    if (data && data.trim()) {
      const elementData = JSON.parse(data)

      // 处理元素拖拽
      if (elementData.type) {
        const position = getEventPosition(event)
        const newElement = addElement({
          ...elementData,
          position: {
            x: position.x - 75, // 元素宽度的一半
            y: position.y - 50 // 元素高度的一半
          }
        })
        // 选择新添加的元素
        selectElement(newElement)
      }

      // 处理连接拖拽
      else if (elementData.sourceId || elementData.targetId) {
        // 这里应该有更详细的连接逻辑
        console.log('连接数据:', elementData)
      }
    } else {
      // 数据为空时，可以选择记录日志或忽略
      console.log('未找到有效的JSON数据进行拖拽')
    }
  } catch (error) {
    console.error('处理拖拽数据错误:', error)
    // 可以添加用户友好的错误提示
  }

  // 清除临时连接
  tempConnection.value = null
  isConnecting.value = false
}

// 处理画布点击
const handleCanvasClick = (event) => {
  // 只有点击的是画布本身时才清除选中状态
  // 避免点击节点或其他元素时也清除选中状态
  if (event.target === event.currentTarget) {
    // 清除所有选中状态
    clearSelection()
  }
}

// 处理节点容器点击
const handleNodesContainerClick = (event) => {
  // 只有当直接点击节点容器背景时才触发
  if (event.target === event.currentTarget) {
    clearSelection()
  }
}

// 清除选中状态
const clearSelection = () => {
  selectedElement.value = null
  selectedConnection.value = null

  // 重置元素选中状态
  localWorkflow.elements.forEach((element) => {
    element.selected = false
  })

  // 重置连接选中状态
  localWorkflow.connections.forEach((connection) => {
    connection.selected = false
  })
}

// 选择元素
const selectElement = (element) => {
  // 清除之前的选中状态
  clearSelection()

  // 设置新的选中状态
  element.selected = true
  selectedElement.value = element

  // 调试信息
  console.log('选中的元素:', element)
  console.log('selectedElement值:', selectedElement.value)
}

// 选择连接
const selectConnection = (connection) => {
  // 清除之前的选中状态
  clearSelection()

  // 设置新的选中状态
  connection.selected = true
  selectedConnection.value = connection
}

// 处理节点头部鼠标按下事件 - 用于拖拽元素
const handleNodeHeaderMouseDown = (event, element) => {
  if (props.readOnly) return

  // 防止冒泡到画布事件
  event.stopPropagation()

  // 开始拖拽
  const startX = event.clientX
  const startY = event.clientY
  const startElementX = element.position.x
  const startElementY = element.position.y

  const handleMouseMove = (e) => {
    const dx = (e.clientX - startX) / scale.value
    const dy = (e.clientY - startY) / scale.value

    element.position.x = startElementX + dx
    element.position.y = startElementY + dy
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 画布拖拽开始
const handleCanvasMouseDown = (event) => {
  // 只有在没有选中任何元素或连接且点击的是画布背景时才允许拖拽
  if (!selectedElement.value && !selectedConnection.value && event.target === canvasRef.value) {
    isPanning.value = true
    panStart.value = {
      x: event.clientX,
      y: event.clientY
    }
    initialCanvasPosition.value = {
      x: canvasPosition.value.x,
      y: canvasPosition.value.y
    }

    const handleMouseMove = (e) => {
      if (isPanning.value) {
        const dx = e.clientX - panStart.value.x
        const dy = e.clientY - panStart.value.y

        canvasPosition.value = {
          x: initialCanvasPosition.value.x + dx,
          y: initialCanvasPosition.value.y + dy
        }
      }
    }

    const handleMouseUp = () => {
      isPanning.value = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
}

// 缩放功能（鼠标滚轮）
const handleWheel = (event) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.5, Math.min(2, scale.value + delta))

  if (newScale !== scale.value) {
    // 计算鼠标在画布上的位置
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = (event.clientX - rect.left) / scale.value
    const mouseY = (event.clientY - rect.top) / scale.value

    // 调整画布位置，使鼠标指向的点保持不变
    canvasPosition.value = {
      x: mouseX * scale.value - mouseX * newScale + canvasPosition.value.x,
      y: mouseY * scale.value - mouseY * newScale + canvasPosition.value.y
    }

    scale.value = newScale
  }
}

// 工具栏缩放功能
const zoomIn = () => {
  scale.value = Math.min(2, scale.value + 0.1)
}

const zoomOut = () => {
  scale.value = Math.max(0.5, scale.value - 0.1)
}

const resetZoom = () => {
  scale.value = 1
  canvasPosition.value = { x: 0, y: 0 }
}

// 居中画布
const centerCanvas = () => {
  if (!canvasRef.value || localWorkflow.elements.length === 0) return

  const canvasContainer = canvasRef.value.parentElement
  const containerWidth = canvasContainer.clientWidth
  const containerHeight = canvasContainer.clientHeight

  // 计算所有元素的中心点
  let totalX = 0
  let totalY = 0

  localWorkflow.elements.forEach((element) => {
    totalX += element.position.x + 75 // 75 是元素宽度的一半
    totalY += element.position.y + 50 // 50 是元素高度的一半
  })

  const centerX = totalX / localWorkflow.elements.length
  const centerY = totalY / localWorkflow.elements.length

  // 计算需要移动的距离
  canvasPosition.value = {
    x: containerWidth / 2 / scale.value - centerX,
    y: containerHeight / 2 / scale.value - centerY
  }
}

// 初始化工作流
const initWorkflow = () => {
  if (!localWorkflow.elements.length) {
    // 添加一些示例元素
    addElement({
      name: '浏览器打开',
      type: 'browser',
      icon: 'browser',
      params: [
        {
          key: 'url',
          label: 'URL地址',
          type: 'string',
          required: true,
          defaultValue: 'https://www.example.com'
        }
      ]
    })

    addElement({
      name: '点击操作',
      type: 'click',
      icon: 'click',
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '#button'
        }
      ]
    })
  }
}

// 暴露方法给父组件
defineExpose({
  saveWorkflow,
  loadWorkflow,
  onWorkflowCleared,
  addElement
})

// 生命周期钩子 - 已在上文统一处理
onUnmounted(() => {
  // 清理所有事件监听器
  isPanning.value = false
  isConnecting.value = false
})
</script>

<style scoped>
/* 编辑器主容器 */
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* 内容区域布局 */
.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 画布容器 - 选中元素时留出属性面板空间，未选中时自动扩展 */
.editor-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--color-background-light);
  margin-right: 0; /* 默认不预留空间 */
  transition: margin-right 0.3s ease;
}

/* 当存在选中元素或连接线时，为属性面板留出空间 */
.editor-content:has(.editor-properties) .editor-canvas-container {
  margin-right: 300px;
}

/* 画布本身 */
.editor-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  background-color: #fafafa;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}

.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: visiblePainted;
  z-index: 10;
}

.connection-path {
  fill: none;
  stroke: #909399;
  stroke-linecap: round;
  stroke-linejoin: round;
  cursor: pointer;
}

.connection-path-selected {
  stroke: var(--color-primary) !important;
}

.temp-connection-path {
  fill: none;
  stroke: #409eff;
  stroke-dasharray: 5, 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.element-nodes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
}

.element-node {
  position: absolute;
  width: 200px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 20;
  transition: all 0.2s ease;
  user-select: none;
}

.element-node:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.element-node-selected {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  border-radius: 6px 6px 0 0;
  cursor: move;
}

.node-icon {
  margin-right: 8px;
  color: var(--color-primary);
}

.node-name {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-primary);
}

.node-remove {
  color: var(--color-text-disabled);
  cursor: pointer;
  transition: color 0.2s ease;
}

.node-remove:hover {
  color: #f56c6c;
}

.node-params {
  cursor: pointer;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--color-background);
}

.param-item {
  margin-bottom: 8px;
}

.param-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  cursor: pointer;
}

.required-mark {
  color: #f56c6c;
}

.connection-points {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -8px;
  width: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 0;
}

.connection-point {
  width: 10px;
  height: 10px;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connection-point:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

.editor-properties {
  width: 300px;
  background-color: var(--color-background-soft);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.properties-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.properties-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.element-properties {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.element-properties h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.property-group {
  margin-bottom: 20px;
}

.property-group h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 500;
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

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
}

/* 自定义滚动条 */
.node-params::-webkit-scrollbar,
.element-properties::-webkit-scrollbar {
  width: 6px;
}

.node-params::-webkit-scrollbar-track,
.element-properties::-webkit-scrollbar-track {
  background: var(--color-background);
}

.node-params::-webkit-scrollbar-thumb,
.element-properties::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.node-params::-webkit-scrollbar-thumb:hover,
.element-properties::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-disabled);
}
</style>
