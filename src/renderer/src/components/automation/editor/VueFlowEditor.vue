<template>
  <div class="vue-flow-editor">
    <!-- Vue Flow 工作区 -->
    <div class="vue-flow-container">
      <VueFlow
        ref="vueFlowRef"
        :nodes="elements"
        :edges="edges"
        :nodes-draggable="false"
        :connection-mode="'strict'"
        :fit-view="true"
        class="vue-flow-workspace"
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
              'custom-node-focused': data.id === focusedNodeId
            }"
            @click="handleNodeClick(data.id)"
          >
            <div class="node-header">
              <el-icon class="node-icon">
                <component :is="getIconComponent(data.icon)" />
              </el-icon>
              <span class="node-name">{{ data.name }}</span>
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
            />
            <el-input-number
              v-model="selectedNode.position.y"
              label="Y"
              :min="0"
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
              />
              <el-input-number
                v-else-if="param.type === 'number'"
                v-model="selectedNode.data.paramValues[param.key]"
                :min="0"
                size="small"
              />
              <el-select
                v-else-if="param.type === 'select'"
                v-model="selectedNode.data.paramValues[param.key]"
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
                v-model="selectedNode.data.paramValues[param.key]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
// 导入 VueFlow 相关组件
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
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

// 初始化 Vue Flow 实例
const vueFlowRef = ref(null)

// 组件状态
const elements = ref([])
const edges = ref([])
const selectedNode = ref(null)
const focusedNodeId = ref(null) // 用于存储当前焦点节点ID

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
          ...el,
          // Vue Flow 要求数据中包含必要的属性
          selected: el.selected || false,
          paramValues: el.paramValues || {}
        },
        selected: el.selected || false
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

onMounted(() => {
  // 监听画布点击事件，用于清除焦点状态
  const canvasElement = document.querySelector('.vue-flow__viewport')
  if (canvasElement) {
    canvasElement.addEventListener('click', (event) => {
      if (
        event.target.classList.contains('vue-flow__viewport') ||
        event.target.classList.contains('vue-flow__background')
      ) {
        focusedNodeId.value = null
      }
    })
  }
})

// 处理节点点击
const handleNodeClick = (nodeId) => {
  try {
    // 找到节点
    const node = elements.value.find(n => n.id === nodeId)
    if (!node || !node.data) {
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
</script>

<style scoped>
.vue-flow-editor {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-light);
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
  top: 10px;
  right: 10px;
  width: 300px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  z-index: 1000;
  max-height: calc(100vh - 40px);
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

.required-mark {
  color: #f56c6c;
}

.param-input {
  width: 100%;
}

/* 自定义节点样式 */
.custom-node {
  position: relative;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-800);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 180px;
  cursor: pointer;
  z-index: 1;
  padding: 8px;
}

/* 节点状态样式 */
.custom-node:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.custom-node-selected {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
}

.custom-node-focused {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 节点头部样式 */
.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 8px;
}

.node-icon {
  color: var(--color-primary);
}

.node-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* 节点参数样式 */
.node-params {
  font-size: 12px;
}

.param-item {
  margin-bottom: 4px;
}

.param-label {
  color: var(--color-text-secondary);
  margin-right: 4px;
}

.param-value {
  color: var(--color-text-primary);
  margin-top: 2px;
}

.param-more {
  color: var(--color-text-secondary);
  font-size: 11px;
  margin-top: 2px;
}
</style>
