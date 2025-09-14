<template>
  <div class="workflow-editor">
    <!-- 主要内容区（包含工作区和属性面板） -->
    <div class="editor-content">
      <!-- 工作区 -->
      <div class="editor-canvas" ref="canvasRef" @dragover="handleDragOver" @drop="handleDrop" @click="handleCanvasClick">
        <!-- 工作区背景 -->
        <div class="canvas-grid"></div>

        <!-- 连接线 -->
        <svg class="connection-layer" ref="connectionLayerRef">
          <path
            v-for="connection in connections"
            :key="connection.id"
            :d="getConnectionPath(connection)"
            class="connection-path"
            :class="{ 'connection-path-selected': connection.selected }"
            @click="selectConnection(connection)"
            :stroke-width="connection.selected ? 3 : 2"
          />

          <!-- 临时连接线（拖拽时） -->
          <path
            v-if="tempConnection"
            :d="getTempConnectionPath()"
            class="temp-connection-path"
            stroke-width="2"
          />
        </svg>

        <!-- 元件节点 -->
          <draggable
            :list="elements"
            :group="{ name: 'elements', pull: false, put: true }"
            item-key="id"
            class="element-nodes"
            @end="onElementDragEnd"
          >
          <template #item="{ element: item }">
            <div
              class="element-node"
              :class="{ 'element-node-selected': item.selected }"
              :style="{
                left: item.position.x + 'px',
                top: item.position.y + 'px'
              }"
              @click.stop="selectElement(item)"
              @mousedown.stop="onElementMouseDown"
            >
              <!-- 节点头部 -->
              <div class="node-header">
                <el-icon class="node-icon">
                  <component :is="getIconComponent(item.icon)" />
                </el-icon>
                <span class="node-name">{{ item.name }}</span>
                <el-icon class="node-remove" @click.stop="removeElement(item)">
                  <Close />
                </el-icon>
              </div>

              <!-- 节点参数 -->
              <div class="node-params">
                <div v-for="param in item.params" :key="param.key" class="param-item">
                  <label class="param-label">{{ param.label }}</label>
                  <div class="param-input">
                    <el-input
                      v-if="param.type === 'string'"
                      v-model="item.paramValues[param.key]"
                      placeholder="请输入"
                      size="small"
                    />
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="item.paramValues[param.key]"
                      :min="0"
                      size="small"
                    />
                    <el-select
                      v-else-if="param.type === 'select'"
                      v-model="item.paramValues[param.key]"
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
                      v-model="item.paramValues[param.key]"
                    />
                  </div>
                </div>
              </div>

              <!-- 连接点 -->
              <div class="connection-points">
                <div
                  class="connection-point input-point"
                  @dragstart="onInputDragStart($event, item)"
                  title="输入连接点"
                ></div>
                <div
                  class="connection-point output-point"
                  @dragstart="onOutputDragStart($event, item)"
                  title="输出连接点"
                ></div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 属性面板 -->
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { Close } from '@element-plus/icons-vue'
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

// 定义props，接收workflow数据
const props = defineProps({
  workflow: {
    type: Object,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['workflow-updated'])

// 创建本地深拷贝，避免直接修改props
const localWorkflow = ref(JSON.parse(JSON.stringify(props.workflow)))

// 监听props变化
watch(() => props.workflow, (newWorkflow) => {
  localWorkflow.value = JSON.parse(JSON.stringify(newWorkflow))
}, { deep: true })

// 计算属性，提供给draggable组件使用
const elements = computed({
  get() {
    console.log('elements get:', localWorkflow.value?.elements || [])
    return localWorkflow.value?.elements || []
  },
  set(newElements) {
    localWorkflow.value.elements = newElements
    emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))
  }
})

// 调试：检查props和localWorkflow的初始状态
console.log('Initial props.workflow:', props.workflow)
console.log('Initial localWorkflow:', localWorkflow.value)

// 保存工作流
const saveWorkflow = () => {
  try {
    // 将工作流数据保存到本地存储
    const workflowData = JSON.parse(JSON.stringify(localWorkflow.value))
    console.log('workflowData', workflowData)
    localStorage.setItem('savedWorkflow', JSON.stringify(workflowData))
    // 触发事件通知父组件
    emit('workflow-updated', workflowData)
    console.log('工作流保存成功')
  } catch (error) {
    console.error('保存工作流失败:', error)
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
      // 触发事件通知父组件更新工作流
      emit('workflow-updated', parsedWorkflow)
      console.log('工作流加载成功')
    } else {
      alert('没有找到已保存的工作流')
    }
  } catch (error) {
    console.error('加载工作流失败:', error)
    alert('加载工作流失败，请重试')
  }
}

// 清空画布回调
const onWorkflowCleared = () => {
  // 清空选中状态
  selectedElement.value = null
  selectedConnection.value = null
  tempConnection.value = null
  console.log('画布已清空')
}

// 元件拖拽结束处理
const onElementDragEnd = () => {
  // 触发更新事件，让父组件知道工作流已更改
  emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))
}

// 暴露方法给父组件
defineExpose({
  saveWorkflow,
  loadWorkflow,
  onWorkflowCleared
})

// 画布引用
const canvasRef = ref(null)
const connectionLayerRef = ref(null)

// 选中的元素和连接
const selectedElement = ref(null)
const selectedConnection = ref(null)

// 临时连接（拖拽中）
const tempConnection = ref(null)

// 根据分类获取元件
const connections = computed(() => localWorkflow.value.connections)

// 获取图标组件
const getIconComponent = (iconName) => {
  const iconMap = {
    ChromeFilled,
    Browser: ChromeFilled,
    Close: CloseIcon,
    Pointer,
    Edit,
    DataAnalysis,
    Clock,
    Sort,
    Download
  }

  return iconMap[iconName] || 'el-icon-menu'
}

// 选择元件
const selectElement = (element) => {
  // 更新本地工作流
  localWorkflow.value.elements = localWorkflow.value.elements.map(el => ({
    ...el,
    selected: el.id === element.id
  }))

  localWorkflow.value.connections = localWorkflow.value.connections.map(conn => ({
    ...conn,
    selected: false
  }))

  // 触发事件通知父组件更新工作流
  emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))

  // 更新本地选中状态
  selectedElement.value = element
  selectedConnection.value = null
}

// 选择连接
const selectConnection = (connection) => {
  // 更新本地工作流
  localWorkflow.value.elements = localWorkflow.value.elements.map(el => ({
    ...el,
    selected: false
  }))

  localWorkflow.value.connections = localWorkflow.value.connections.map(conn => ({
    ...conn,
    selected: conn.id === connection.id
  }))

  // 触发事件通知父组件更新工作流
  emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))

  // 更新本地选中状态
  selectedConnection.value = connection
  selectedElement.value = null
}

// 移除元件
const removeElement = (element) => {
  // 创建新的连接数组，移除与当前元素相关的连接
  localWorkflow.value.connections = localWorkflow.value.connections.filter(
    (conn) => conn.sourceId !== element.id && conn.targetId !== element.id
  )

  // 创建新的元素数组，移除当前元素
  localWorkflow.value.elements = localWorkflow.value.elements.filter((el) => el.id !== element.id)

  // 触发事件通知父组件更新工作流
  emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))

  // 清除选中状态
  if (selectedElement.value === element) {
    selectedElement.value = null
  }
}

// 处理输入连接点拖拽开始
const onInputDragStart = (event, targetElement) => {
  event.dataTransfer.effectAllowed = 'connect'
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'input-connection',
      targetId: targetElement.id
    })
  )
}

// 处理输出连接点拖拽开始
const onOutputDragStart = (event, sourceElement) => {
  event.dataTransfer.effectAllowed = 'connect'
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'output-connection',
      sourceId: sourceElement.id,
      sourcePosition: {
        x: event.clientX,
        y: event.clientY
      }
    })
  )
}

// 处理元件鼠标按下
const onElementMouseDown = (event) => {
  if (event.button === 0) {
    // 左键
    // 允许在元素上开始拖拽
    event.stopPropagation()
  }
}

// 获取连接路径
const getConnectionPath = (connection) => {
  const sourceElement = localWorkflow.value.elements.find((el) => el.id === connection.sourceId)
  const targetElement = localWorkflow.value.elements.find((el) => el.id === connection.targetId)

  if (!sourceElement || !targetElement) {
    return ''
  }

  // 计算连接点坐标
  const sourceX = sourceElement.position.x + 200
  const sourceY = sourceElement.position.y + 50
  const targetX = targetElement.position.x
  const targetY = targetElement.position.y + 50

  // 创建贝塞尔曲线
  const controlPoint1X = sourceX + 50
  const controlPoint1Y = sourceY
  const controlPoint2X = targetX - 50
  const controlPoint2Y = targetY

  return `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`
}

// 获取临时连接路径
const getTempConnectionPath = () => {
  if (!tempConnection.value) {
    return ''
  }

  const { sourcePosition, targetPosition } = tempConnection.value

  const controlPoint1X = sourcePosition.x + 50
  const controlPoint1Y = sourcePosition.y
  const controlPoint2X = targetPosition.x - 50
  const controlPoint2Y = targetPosition.y

  return `M ${sourcePosition.x} ${sourcePosition.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetPosition.x} ${targetPosition.y}`
}



// 处理拖拽悬停
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

// 处理拖拽放置
const handleDrop = (event) => {
  event.preventDefault()

  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    const canvasRect = canvasRef.value.getBoundingClientRect()

    if (data.type === 'element') {
      // 从元件面板拖拽新元件到工作区
      const newElement = {
        ...data.elementData,
        position: {
          x: event.clientX - canvasRect.left,
          y: event.clientY - canvasRect.top
        },
        paramValues: {}
      }

      // 初始化参数值
      if (newElement.params) {
        newElement.params.forEach((param) => {
          newElement.paramValues[param.key] = param.defaultValue
        })
      }

      // 添加新元件到本地工作流
      localWorkflow.value.elements = [...localWorkflow.value.elements, newElement]

      // 触发事件通知父组件更新工作流
      emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))

      // 选择新添加的元素
      selectElement(newElement)
    }
  } catch (error) {
    console.error('处理拖拽放置失败:', error)
  }
}

// 处理画布点击
const handleCanvasClick = () => {
  // 更新本地工作流
  localWorkflow.value.elements = localWorkflow.value.elements.map(el => ({
    ...el,
    selected: false
  }))

  localWorkflow.value.connections = localWorkflow.value.connections.map(conn => ({
    ...conn,
    selected: false
  }))

  // 触发事件通知父组件更新工作流
  emit('workflow-updated', JSON.parse(JSON.stringify(localWorkflow.value)))

  // 更新本地选中状态
  selectedElement.value = null
  selectedConnection.value = null
}

// 生命周期钩子
// 不需要在mounted和unmounted中添加事件监听器，因为已经在模板中直接绑定了
// onMounted(() => {
//   // 监听画布事件
//   if (canvasRef.value) {
//     canvasRef.value.addEventListener('dragover', handleDragOver)
//     canvasRef.value.addEventListener('drop', handleDrop)
//     canvasRef.value.addEventListener('click', handleCanvasClick)
//   }
// })
//
// onUnmounted(() => {
//   // 移除事件监听
//   if (canvasRef.value) {
//     canvasRef.value.removeEventListener('dragover', handleDragOver)
//     canvasRef.value.removeEventListener('drop', handleDrop)
//     canvasRef.value.removeEventListener('click', handleCanvasClick)
//   }
// })
</script>

<style scoped>
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}



.editor-canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background-color: #fafafa;
  min-height: 0; /* 确保flex子元素可以收缩 */
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
  cursor: move;
  transition: all 0.2s ease;
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
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.param-item {
  margin-bottom: 8px;
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
