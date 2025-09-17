<template>
  <div class="element-panel">
    <div class="element-panel-header">
      <h3>元件库</h3>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索元件"
        clearable
        :prefix-icon="Search"
        size="small"
      />
    </div>

    <div class="element-categories">
      <el-tabs v-model="activeCategory" size="small" class="element-tabs">
        <el-tab-pane label="浏览器操作" name="browser" />
        <el-tab-pane label="页面交互" name="interaction" />
        <el-tab-pane label="数据处理" name="data" />
        <el-tab-pane label="逻辑控制" name="logic" />
        <el-tab-pane label="文件操作" name="file" />
      </el-tabs>
    </div>

    <div class="element-list">
      <!-- 可拖拽的元件列表 - 纵向展示 -->
      <div class="element-list-container">
        <div
          v-for="element in filteredElements"
          :key="element.type"
          class="element-item"
          :draggable="true"
          @dragstart="handleElementDragStart($event, element)"
        >
          <el-icon class="element-icon"><component :is="getIconComponent(element.icon)" /></el-icon>
          <div class="element-info">
            <div class="element-name">{{ element.name }}</div>
            <div class="element-description">{{ element.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ChromeFilled,
  Close,
  Pointer,
  Edit,
  DataAnalysis,
  Clock,
  Sort,
  Download,
  Search,
  Refresh,
  ArrowRight,
  Select,
  RefreshRight,
  Operation,
  RefreshLeft,
  Warning,
  Document,
  EditPen,
  Upload,
  Switch,
  Mouse
} from '@element-plus/icons-vue'

// 导入元件类型定义
import ElementTypes, { Initializer } from './ElementTypes.js'

// 搜索关键词
const searchKeyword = ref('')

// 活动的元件分类 - 直接设置默认分类为'browser'
const activeCategory = ref('browser')

// 拖拽事件处理函数
const handleElementDragStart = (event, element) => {
  try {
    // 获取元件参数定义
    const params = getElementParams(element.type)

    // 构建默认参数值对象
    const paramValues = {}
    params.forEach((param) => {
      if (Object.prototype.hasOwnProperty.call(param, 'defaultValue')) {
        paramValues[param.key] = param.defaultValue
      } else {
        // 根据类型设置默认值
        switch (param.type) {
          case 'boolean':
            paramValues[param.key] = false
            break
          case 'string':
            paramValues[param.key] = ''
            break
          case 'number':
            paramValues[param.key] = 0
            break
          default:
            paramValues[param.key] = ''
        }
      }
    })

    // 构建WorkflowEditor期望的数据格式
    const dragData = {
      type: 'element',
      elementData: {
        id: `element_${Date.now()}`,
        type: element.type,
        name: element.name,
        description: element.description,
        icon: element.icon,
        // 根据不同元件类型定义不同的参数，使属性面板能够显示和编辑
        params: params,
        // 添加参数值对象，确保参数面板能够正确绑定和显示参数值
        paramValues: paramValues
      }
    }

    // 设置拖拽数据
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    // 设置拖拽时的视觉效果
    event.dataTransfer.effectAllowed = 'copy'
  } catch (error) {
    console.error('拖拽开始时出错:', error)
  }
}

// 获取元件参数定义，使用ElementInitializer
const getElementParams = (elementType) => {
  try {
    // 使用ElementInitializer获取元件参数定义
    const typeDef = Initializer.getElementTypeDefinition(elementType)
    if (typeDef && typeDef.params) {
      // 将label重命名为name以兼容现有代码
      return typeDef.params.map((param) => ({
        ...param,
        name: param.label // 保持向后兼容性
      }))
    }

    console.warn(`未找到元件类型 ${elementType} 的参数定义`)
    return []
  } catch (error) {
    console.error(`获取元件参数定义时出错:`, error)
    return []
  }
}

// 获取图标组件
const getIconComponent = (name) => {
  const iconMap = {
    ChromeFilled,
    Close,
    Pointer,
    Edit,
    DataAnalysis,
    Clock,
    Sort,
    Download,
    Refresh,
    ArrowRight,
    Select,
    RefreshRight,
    Operation,
    RefreshLeft,
    Warning,
    Document,
    EditPen,
    Upload,
    Switch,
    Mouse
  }
  return iconMap[name] || 'el-icon-menu'
}

// 从ElementTypes动态获取所有元件
const allElements = computed(() => {
  return Object.values(ElementTypes).map((element) => ({
    type: element.type,
    name: element.name,
    description: element.description,
    icon: element.icon,
    category: element.category
  }))
})

// 根据分类获取元件
const elementsByCategory = computed(() => {
  // 过滤出当前分类的元件
  return allElements.value.filter((element) => element.category === activeCategory.value) || []
})

// 搜索和分类过滤后的元件
const filteredElements = computed(() => {
  let elements = elementsByCategory.value

  // 应用搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    elements = elements.filter(
      (element) =>
        element.name.toLowerCase().includes(keyword) ||
        element.description.toLowerCase().includes(keyword)
    )
  }

  return elements
})
</script>

<style scoped>
.element-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
}

.element-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.element-panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.element-categories {
  padding: 0 16px;
}

.element-tabs {
  width: 100%;
}

.element-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.element-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.element-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
}

.element-item:hover {
  background-color: var(--el-fill-color-hover);
  border-color: var(--el-color-primary);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.element-icon {
  font-size: 24px;
  margin-right: 12px;
  margin-bottom: 0;
  color: var(--el-color-primary);
}

.element-info {
  flex: 1;
  text-align: left;
}

.element-item:hover {
  background-color: var(--el-fill-color-hover);
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.element-item:active {
  cursor: grabbing;
}

.element-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--el-color-primary);
}

.element-info {
  text-align: center;
}

.element-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.element-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
}

/* 自定义滚动条 */
.element-list::-webkit-scrollbar {
  width: 6px;
}

.element-list::-webkit-scrollbar-track {
  background: var(--el-bg-color);
}

.element-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.element-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-disabled);
}
</style>
