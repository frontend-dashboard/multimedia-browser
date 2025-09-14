<template>
  <div class="vue-flow-test">
    <div class="test-header">
      <h2>Vue Flow 功能测试</h2>
      <p>此组件用于测试 @vue-flow/core 的基本功能</p>
    </div>
    
    <div class="test-toolbar">
      <el-button @click="addNode('basic')">添加基础节点</el-button>
      <el-button @click="addNode('advanced')">添加高级节点</el-button>
      <el-button @click="clearNodes">清空节点</el-button>
      <el-button @click="centerView">居中视图</el-button>
      <el-switch v-model="snapToGrid" active-text="网格对齐" inactive-text="自由定位" />
    </div>
    
    <div class="test-content">
      <div class="vue-flow-wrapper">
        <VueFlow
          v-model="elements"
          :connections="connections"
          :nodes-draggable="true"
          :connection-mode="connectionMode"
          :snap-to-grid="snapToGrid"
          :snap-grid="[20, 20]"
          :min-zoom="0.5"
          :max-zoom="2"
          @node-drag-stop="handleNodeDragStop"
          @connection-success="handleConnectionSuccess"
          @node-click="handleNodeClick"
          @connect="handleConnect"
          ref="vueFlowRef"
        >
          <!-- 基础控制按钮 -->
          <Controls />
          
          <!-- 自定义节点 -->
          <template #node-basic="{ data }">
            <BasicNode :data="data" :selected="data.selected" />
          </template>
          
          <template #node-advanced="{ data }">
            <AdvancedNode :data="data" :selected="data.selected" />
          </template>
        </VueFlow>
      </div>
      
      <div class="test-info">
        <h3>节点信息</h3>
        <div v-if="selectedNode" class="node-details">
          <p><strong>ID:</strong> {{ selectedNode.id }}</p>
          <p><strong>类型:</strong> {{ selectedNode.type }}</p>
          <p><strong>位置:</strong> X: {{ Math.round(selectedNode.position.x) }}, Y: {{ Math.round(selectedNode.position.y) }}</p>
          <p v-if="selectedNode.data.name"><strong>名称:</strong> {{ selectedNode.data.name }}</p>
          <p v-if="selectedNode.data.description"><strong>描述:</strong> {{ selectedNode.data.description }}</p>
        </div>
        <div v-else class="no-selection">
          <p>未选中任何节点</p>
        </div>
        
        <h3>统计信息</h3>
        <div class="stats">
          <p>节点数量: {{ elements.length }}</p>
          <p>连接数量: {{ connections.length }}</p>
        </div>
      </div>
    </div>
    
    <div class="test-footer">
      <p>提示: 点击节点可选中，拖拽节点可移动位置，拖拽节点两端的连接点可创建连接</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { DataAnalysis, ChromeFilled } from '@element-plus/icons-vue'

// 导入样式
import '@vue-flow/core/dist/style.css'

// 基础节点组件
const BasicNode = (props) => {
  const { data, selected } = props
  
  return (
    <div 
      class={`basic-node ${selected ? 'selected' : ''}`}
    >
      <div class="node-header">
        <el-icon class="node-icon"><ChromeFilled /></el-icon>
        <span class="node-name">{data.name || '基础节点'}</span>
      </div>
      <div class="node-content">
        <div class="node-handles">
          <div class="handle input-handle" data-handle-type="target" data-handle-position="left"></div>
          <div class="handle output-handle" data-handle-type="source" data-handle-position="right"></div>
        </div>
      </div>
    </div>
  )
}

// 高级节点组件
const AdvancedNode = (props) => {
  const { data, selected } = props
  
  return (
    <div 
      class={`advanced-node ${selected ? 'selected' : ''}`}
    >
      <div class="node-header">
        <el-icon class="node-icon"><DataAnalysis /></el-icon>
        <span class="node-name">{data.name || '高级节点'}</span>
      </div>
      <div class="node-content">
        <p class="node-description">{data.description || '这是一个高级节点'}</p>
        {data.params && (
          <div class="node-params">
            {Object.entries(data.params).map(([key, value]) => (
              <div key={key} class="param-item">
                <span class="param-key">{key}:</span>
                <span class="param-value">{value}</span>
              </div>
            ))}
          </div>
        )}
        <div class="node-handles">
          <div class="handle input-handle" data-handle-type="target" data-handle-position="left"></div>
          <div class="handle output-handle" data-handle-type="source" data-handle-position="right"></div>
        </div>
      </div>
    </div>
  )
}

// Vue Flow 实例
const vueFlowRef = ref(null)
const { centerView: centerVueFlowView } = useVueFlow()

// 状态
const elements = ref([])
const connections = ref([])
const selectedNode = ref(null)
const connectionMode = ref('loose')
const snapToGrid = ref(true)
let nodeCounter = 1

// 组件挂载时初始化一些示例节点
onMounted(() => {
  // 创建一些示例节点
  createSampleNodes()
})

// 创建示例节点
const createSampleNodes = () => {
  elements.value = [
    {
      id: 'node-1',
      type: 'basic',
      position: { x: 100, y: 100 },
      data: {
        name: '开始节点',
        selected: false
      }
    },
    {
      id: 'node-2',
      type: 'advanced',
      position: { x: 350, y: 100 },
      data: {
        name: '处理节点',
        description: '处理数据的节点',
        params: {
          timeout: '3000ms',
          retries: 3
        },
        selected: false
      }
    },
    {
      id: 'node-3',
      type: 'basic',
      position: { x: 600, y: 100 },
      data: {
        name: '结束节点',
        selected: false
      }
    }
  ]
  
  // 创建一些示例连接
  connections.value = [
    {
      id: 'connection-1',
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'right',
      targetHandle: 'left'
    },
    {
      id: 'connection-2',
      source: 'node-2',
      target: 'node-3',
      sourceHandle: 'right',
      targetHandle: 'left'
    }
  ]
}

// 添加节点
const addNode = (type) => {
  const nodeId = `node-${Date.now()}-${nodeCounter++}`
  const x = 100 + Math.random() * 500
  const y = 100 + Math.random() * 300
  
  let nodeData = {}
  
  if (type === 'basic') {
    nodeData = {
      id: nodeId,
      type: 'basic',
      position: { x, y },
      data: {
        name: `基础节点 ${nodeCounter - 1}`,
        selected: false
      }
    }
  } else if (type === 'advanced') {
    nodeData = {
      id: nodeId,
      type: 'advanced',
      position: { x, y },
      data: {
        name: `高级节点 ${nodeCounter - 1}`,
        description: `这是高级节点 ${nodeCounter - 1} 的描述`,
        params: {
          timestamp: new Date().toISOString(),
          random: Math.random().toFixed(2)
        },
        selected: false
      }
    }
  }
  
  elements.value.push(nodeData)
}

// 清空节点
const clearNodes = () => {
  elements.value = []
  connections.value = []
  selectedNode.value = null
}

// 居中视图
const centerView = () => {
  if (vueFlowRef.value) {
    centerVueFlowView()
  }
}

// 处理节点拖动停止
const handleNodeDragStop = (event, node) => {
  console.log('节点拖动停止:', node)
}

// 处理连接成功
const handleConnectionSuccess = (params) => {
  const { edge } = params
  console.log('连接成功:', edge)
}

// 处理节点点击
const handleNodeClick = (event, node) => {
  // 清除之前的选中状态
  if (selectedNode.value) {
    selectedNode.value.data.selected = false
  }
  
  // 设置新的选中状态
  node.data.selected = true
  selectedNode.value = node
}

// 处理连接创建
const handleConnect = (connection) => {
  // 生成唯一的连接 ID
  const connectionId = `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    ...connection,
    id: connectionId,
  }
}
</script>

<style scoped>
.vue-flow-test {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-light);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.test-header {
  padding: 16px 24px;
  background-color: var(--color-background-900);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.test-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.test-header p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.test-toolbar {
  padding: 12px 24px;
  background-color: var(--color-background-800);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.test-toolbar .el-button {
  flex-shrink: 0;
}

.test-toolbar .el-switch {
  margin-left: auto;
}

.test-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.vue-flow-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.test-info {
  width: 300px;
  background-color: var(--color-background-800);
  border-left: 1px solid var(--color-border);
  padding: 16px;
  overflow-y: auto;
}

.test-info h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.node-details {
  background-color: var(--color-background-700);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.node-details p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.node-details strong {
  color: var(--color-text-primary);
}

.no-selection {
  text-align: center;
  padding: 20px;
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.stats {
  background-color: var(--color-background-700);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
}

.stats p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.test-footer {
  padding: 12px 24px;
  background-color: var(--color-background-900);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.test-footer p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 节点样式 */
.basic-node {
  min-width: 120px;
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.basic-node.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.advanced-node {
  min-width: 150px;
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.advanced-node.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #334155;
  border-bottom: 1px solid #475569;
}

.node-icon {
  margin-right: 8px;
  color: #3b82f6;
}

.node-name {
  font-size: 13px;
  font-weight: 500;
  color: #f8fafc;
}

.node-content {
  padding: 8px 12px;
  position: relative;
}

.node-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #94a3b8;
}

.node-params {
  margin-bottom: 8px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
}

.param-key {
  color: #94a3b8;
}

.param-value {
  color: #f8fafc;
  font-weight: 500;
}

.node-handles {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.handle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #3b82f6;
  border: 2px solid #f8fafc;
  pointer-events: all;
  cursor: pointer;
}

.input-handle {
  margin-left: -5px;
}

.output-handle {
  margin-right: -5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-content {
    flex-direction: column;
  }
  
  .test-info {
    width: 100%;
    height: 200px;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
  
  .test-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .test-toolbar .el-switch {
    margin-left: 0;
    align-self: flex-start;
  }
}
</style>