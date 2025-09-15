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
import ElementTypes from './ElementTypes.js'

// 搜索关键词
const searchKeyword = ref('')

// 活动的元件分类 - 直接设置默认分类为'browser'
const activeCategory = ref('browser')

// 拖拽事件处理函数
const handleElementDragStart = (event, element) => {
  try {
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
        params: getElementParams(element.type)
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

// 获取元件参数定义，用于属性面板显示
const getElementParams = (elementType) => {
  // 尝试从ElementTypes中获取参数定义
  const typeDef = ElementTypes[elementType]
  if (typeDef && typeDef.params) {
    return typeDef.params
  }

  // 为ElementPanel中额外的元件类型提供参数定义
  switch (elementType) {
    case 'BROWSER_REFRESH':
      return [
        {
          key: 'waitForLoad',
          name: '等待加载',
          type: 'boolean',
          defaultValue: true,
          required: false
        }
      ]
    case 'BROWSER_NAVIGATE':
      return [
        {
          key: 'url',
          name: '网址',
          type: 'string',
          defaultValue: 'https://www.example.com',
          required: true
        },
        {
          key: 'waitForLoad',
          name: '等待加载',
          type: 'boolean',
          defaultValue: true,
          required: false
        }
      ]
    case 'SELECT_OPTION':
      return [
        { key: 'selector', name: '选择器', type: 'string', defaultValue: '', required: true },
        { key: 'optionText', name: '选项文本', type: 'string', defaultValue: '', required: false },
        { key: 'optionValue', name: '选项值', type: 'string', defaultValue: '', required: false }
      ]
    case 'SCROLL_PAGE':
      return [
        {
          key: 'scrollType',
          name: '滚动方式',
          type: 'select',
          defaultValue: 'down',
          options: ['up', 'down', 'toTop', 'toBottom', 'toElement'],
          required: true
        },
        { key: 'selector', name: '元素选择器', type: 'string', defaultValue: '', required: false },
        { key: 'distance', name: '滚动距离', type: 'number', defaultValue: 500, required: false }
      ]
    case 'HOVER_ELEMENT':
      return [{ key: 'selector', name: '选择器', type: 'string', defaultValue: '', required: true }]
    case 'SAVE_DATA':
      return [
        {
          key: 'variableName',
          name: '变量名',
          type: 'string',
          defaultValue: 'data',
          required: true
        },
        { key: 'dataValue', name: '数据值', type: 'string', defaultValue: '', required: true }
      ]
    case 'PROCESS_DATA':
      return [
        {
          key: 'inputVariable',
          name: '输入变量',
          type: 'string',
          defaultValue: '',
          required: true
        },
        {
          key: 'outputVariable',
          name: '输出变量',
          type: 'string',
          defaultValue: '',
          required: true
        },
        {
          key: 'processType',
          name: '处理类型',
          type: 'select',
          defaultValue: 'uppercase',
          options: ['uppercase', 'lowercase', 'trim', 'split', 'join'],
          required: true
        }
      ]
    case 'COMPARE_DATA':
      return [
        { key: 'value1', name: '值1', type: 'string', defaultValue: '', required: true },
        { key: 'value2', name: '值2', type: 'string', defaultValue: '', required: true },
        {
          key: 'operator',
          name: '运算符',
          type: 'select',
          defaultValue: 'equal',
          options: ['equal', 'notEqual', 'greaterThan', 'lessThan'],
          required: true
        },
        {
          key: 'resultVariable',
          name: '结果变量',
          type: 'string',
          defaultValue: 'compareResult',
          required: true
        }
      ]
    case 'WAIT_TIME':
      return [{ key: 'seconds', name: '等待秒数', type: 'number', defaultValue: 2, required: true }]
    case 'CONDITION_IF':
      return [
        { key: 'condition', name: '条件表达式', type: 'string', defaultValue: '', required: true },
        {
          key: 'trueBranchId',
          name: '条件为真时执行',
          type: 'string',
          defaultValue: '',
          required: false
        },
        {
          key: 'falseBranchId',
          name: '条件为假时执行',
          type: 'string',
          defaultValue: '',
          required: false
        }
      ]
    case 'LOOP_FOR':
      return [
        { key: 'loopCount', name: '循环次数', type: 'number', defaultValue: 5, required: true },
        {
          key: 'loopVariable',
          name: '循环变量名',
          type: 'string',
          defaultValue: 'i',
          required: false
        }
      ]
    case 'TRY_CATCH':
      return [
        {
          key: 'errorVariable',
          name: '错误变量名',
          type: 'string',
          defaultValue: 'error',
          required: false
        }
      ]
    case 'READ_FILE':
      return [
        { key: 'filePath', name: '文件路径', type: 'string', defaultValue: '', required: true },
        {
          key: 'encoding',
          name: '编码格式',
          type: 'select',
          defaultValue: 'utf8',
          options: ['utf8', 'ascii', 'base64'],
          required: false
        },
        {
          key: 'outputVariable',
          name: '输出变量',
          type: 'string',
          defaultValue: 'fileContent',
          required: true
        }
      ]
    case 'WRITE_FILE':
      return [
        { key: 'filePath', name: '文件路径', type: 'string', defaultValue: '', required: true },
        { key: 'content', name: '文件内容', type: 'string', defaultValue: '', required: true },
        {
          key: 'encoding',
          name: '编码格式',
          type: 'select',
          defaultValue: 'utf8',
          options: ['utf8', 'ascii', 'base64'],
          required: false
        },
        { key: 'append', name: '追加模式', type: 'boolean', defaultValue: false, required: false }
      ]
    case 'DOWNLOAD_FILE':
      return [
        { key: 'url', name: '文件URL', type: 'string', defaultValue: '', required: true },
        { key: 'savePath', name: '保存路径', type: 'string', defaultValue: '', required: true }
      ]
    case 'UPLOAD_FILE':
      return [
        {
          key: 'selector',
          name: '上传元素选择器',
          type: 'string',
          defaultValue: '',
          required: true
        },
        { key: 'filePath', name: '文件路径', type: 'string', defaultValue: '', required: true }
      ]
    default:
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

// 所有元件数据，按分类组织
const allElements = [
  // 浏览器操作
  {
    type: 'BROWSER_OPEN',
    name: '打开浏览器',
    description: '打开指定URL的浏览器窗口',
    icon: 'ChromeFilled',
    category: 'browser'
  },
  {
    type: 'BROWSER_CLOSE',
    name: '关闭浏览器',
    description: '关闭当前浏览器窗口',
    icon: 'Close',
    category: 'browser'
  },
  {
    type: 'BROWSER_REFRESH',
    name: '刷新页面',
    description: '刷新当前浏览器页面',
    icon: 'Refresh',
    category: 'browser'
  },
  {
    type: 'BROWSER_NAVIGATE',
    name: '导航到URL',
    description: '在当前窗口导航到指定URL',
    icon: 'ArrowRight',
    category: 'browser'
  },

  // 页面交互
  {
    type: 'CLICK_ELEMENT',
    name: '点击元素',
    description: '点击页面上的指定元素',
    icon: 'Pointer',
    category: 'interaction'
  },
  {
    type: 'INPUT_TEXT',
    name: '输入文本',
    description: '在输入框中输入文本',
    icon: 'Edit',
    category: 'interaction'
  },
  {
    type: 'SELECT_OPTION',
    name: '选择选项',
    description: '从下拉菜单中选择选项',
    icon: 'Select',
    category: 'interaction'
  },
  {
    type: 'SCROLL_PAGE',
    name: '滚动页面',
    description: '滚动页面到指定位置',
    icon: 'RefreshRight',
    category: 'interaction'
  },
  {
    type: 'HOVER_ELEMENT',
    name: '悬停元素',
    description: '鼠标悬停在指定元素上',
    icon: 'Mouse',
    category: 'interaction'
  },

  // 数据处理
  {
    type: 'EXTRACT_DATA',
    name: '提取数据',
    description: '从页面提取数据',
    icon: 'DataAnalysis',
    category: 'data'
  },
  {
    type: 'SAVE_DATA',
    name: '保存数据',
    description: '将数据保存到变量或文件',
    icon: 'Document',
    category: 'data'
  },
  {
    type: 'PROCESS_DATA',
    name: '处理数据',
    description: '对数据进行转换处理',
    icon: 'Operation',
    category: 'data'
  },
  {
    type: 'COMPARE_DATA',
    name: '比较数据',
    description: '比较两个数据值',
    icon: 'Operation',
    category: 'data'
  },

  // 逻辑控制
  {
    type: 'WAIT_TIME',
    name: '等待时间',
    description: '暂停执行指定时间',
    icon: 'Clock',
    category: 'logic'
  },
  {
    type: 'CONDITION_IF',
    name: '条件判断',
    description: '根据条件执行不同操作',
    icon: 'Switch',
    category: 'logic'
  },
  {
    type: 'LOOP_FOR',
    name: '循环',
    description: '重复执行一组操作',
    icon: 'RefreshLeft',
    category: 'logic'
  },
  {
    type: 'TRY_CATCH',
    name: '异常处理',
    description: '捕获并处理异常',
    icon: 'Warning',
    category: 'logic'
  },

  // 文件操作
  {
    type: 'READ_FILE',
    name: '读取文件',
    description: '读取本地文件内容',
    icon: 'Document',
    category: 'file'
  },
  {
    type: 'WRITE_FILE',
    name: '写入文件',
    description: '将数据写入到本地文件',
    icon: 'EditPen',
    category: 'file'
  },
  {
    type: 'DOWNLOAD_FILE',
    name: '下载文件',
    description: '从网页下载文件',
    icon: 'Download',
    category: 'file'
  },
  {
    type: 'UPLOAD_FILE',
    name: '上传文件',
    description: '上传文件到网页',
    icon: 'Upload',
    category: 'file'
  }
]

// 根据分类获取元件
const elementsByCategory = computed(() => {
  // 过滤出当前分类的元件
  const result = allElements.filter((element) => element.category === activeCategory.value) || []

  return result
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

.element-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.element-item {
  display: flex;
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
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.element-icon {
  font-size: 24px;
  margin-right: 12px;
  margin-bottom: 0;
  color: var(--color-primary);
}

.element-info {
  flex: 1;
  text-align: left;
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
