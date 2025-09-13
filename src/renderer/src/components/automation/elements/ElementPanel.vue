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
      <draggable
        v-model="filteredElements"
        :group="{ name: 'elements', pull: 'clone', put: false }"
        :sort="false"
        item-key="type"
        class="element-grid"
      >
        <template #item="{ element }">
          <div
            class="element-item"
            :draggable="true"
            @dragstart="onDragStart($event, element)"
          >
            <el-icon class="element-icon">
              <component :is="getIconComponent(element.icon)" />
            </el-icon>
            <div class="element-info">
              <div class="element-name">{{ element.name }}</div>
              <div class="element-description">{{ element.description }}</div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import ElementTypes from './ElementTypes.js'
import {
  ChromeFilled,
  Close,
  Pointer,
  Edit,
  DataAnalysis,
  Clock,
  Sort,
  Download,
  Search
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 活动的元件分类
const activeCategory = ref('browser')

// 根据分类获取元件
const elementsByCategory = computed(() => {
  const browserElements = [
    ElementTypes.BROWSER_OPEN,
    ElementTypes.BROWSER_CLOSE
  ]

  const interactionElements = [
    ElementTypes.CLICK_ELEMENT,
    ElementTypes.INPUT_TEXT
  ]

  const dataElements = [
    ElementTypes.EXTRACT_DATA
  ]

  const logicElements = [
    ElementTypes.WAIT,
    ElementTypes.IF_CONDITION
  ]

  const fileElements = [
    ElementTypes.SAVE_FILE
  ]

  const categoryMap = {
    browser: browserElements,
    interaction: interactionElements,
    data: dataElements,
    logic: logicElements,
    file: fileElements
  }

  return categoryMap[activeCategory.value] || []
})

// 根据搜索关键词过滤元件
const filteredElements = computed(() => {
  if (!searchKeyword.value.trim()) {
    return elementsByCategory.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return elementsByCategory.value.filter(element =>
    element.name.toLowerCase().includes(keyword) ||
    element.description.toLowerCase().includes(keyword)
  )
})

// 获取图标组件
const getIconComponent = (iconName) => {
  const iconMap = {
    ChromeFilled,
    Browser: ChromeFilled,
    Close,
    Pointer,
    Edit,
    DataAnalysis,
    Clock,
    Sort,
    Download
  }

  return iconMap[iconName] || 'el-icon-menu'
}

// 处理拖拽开始事件
const onDragStart = (event, element) => {
  // 将元件数据存储在拖拽事件中
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'element',
    elementData: {
      ...element,
      id: Date.now().toString(), // 生成唯一ID
      position: { x: 0, y: 0 }
    }
  }))
}
</script>

<style scoped>
.element-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
}

.element-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.element-panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
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

.element-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.element-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
}

.element-item:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.element-item:active {
  cursor: grabbing;
}

.element-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.element-info {
  text-align: center;
}

.element-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--color-text-primary);
}

.element-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

/* 自定义滚动条 */
.element-list::-webkit-scrollbar {
  width: 6px;
}

.element-list::-webkit-scrollbar-track {
  background: var(--color-background);
}

.element-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.element-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-disabled);
}
</style>
