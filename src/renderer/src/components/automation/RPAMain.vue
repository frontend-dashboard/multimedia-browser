<template>
  <div class="rpa-main">
    <!-- 主工具栏 -->
    <div class="main-toolbar">
      <div class="toolbar-left">
        <!-- 返回， 只有在不是首页时才显示 -->
        <el-button icon="Back" type="primary" @click="goBack" v-if="!isHome">返回</el-button>
        <h1 class="app-title">RPA网页自动化工具</h1>
        <div class="app-subtitle"></div>
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
        <!-- <el-button type="success" @click="playWorkflow">运行</el-button> -->
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
      <div class="right-panel">
        <!-- 标签页导航 -->
        <div class="right-panel-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'player' }"
            @click="switchTab('player')"
          >
            播放器 & 日志
          </div>
        </div>

        <!-- 标签页内容 -->
        <div class="right-panel-content">
          <WorkflowPlayer ref="workflowPlayerRef" :workflow="workflow" />
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
import { useRouter } from 'vue-router'
import ElementPanel from './elements/ElementPanel.vue'
import VueFlowEditor from './editor/VueFlowEditor.vue'
import WorkflowPlayer from './player/WorkflowPlayer.vue'

// 导入日志工具
import logger from '@renderer/utils/logger.js'

// 导入主题工具函数
import { saveAndApplyTheme, setupSystemThemeListener } from '@renderer/utils/themeUtils.js'

// 导入Element Plus图标
import { ArrowDown, Monitor, Moon, Sunny } from '@element-plus/icons-vue'

// 判断当前是否为首页
const isHome = ref(false)
const router = useRouter()

// 工作流数据
const workflow = reactive({
  name: '完整元件展示流程',
  description: '展示所有RPA元件类型的示例工作流',
  elements: [
    // 浏览器操作元件
    {
      id: 'element_browser_open',
      type: 'BROWSER_OPEN',
      name: '打开浏览器',
      icon: 'ChromeFilled',
      position: { x: 100, y: 50 },
      params: [
        {
          key: 'url',
          label: 'URL地址',
          type: 'string',
          required: true,
          defaultValue: 'https://www.example.com'
        },
        {
          key: 'openMode',
          label: '打开方式',
          type: 'select',
          options: ['useExisting', 'newBrowser'],
          defaultValue: 'useExisting'
        },
        {
          key: 'browserType',
          label: '浏览器类型',
          type: 'select',
          options: ['chrome', 'firefox', 'safari'],
          defaultValue: 'chrome'
        },
        { key: 'incognito', label: '无痕模式', type: 'boolean', defaultValue: false },
        {
          key: 'windowSize',
          label: '窗口大小',
          type: 'select',
          options: ['default', 'maximized', 'fullscreen', 'custom'],
          defaultValue: 'default'
        },
        { key: 'customWidth', label: '自定义宽度', type: 'number', defaultValue: 1280 },
        { key: 'customHeight', label: '自定义高度', type: 'number', defaultValue: 800 },
        {
          key: 'waitUntil',
          label: '等待加载完成',
          type: 'select',
          options: ['load', 'domcontentloaded', 'networkidle', 'commit'],
          defaultValue: 'networkidle'
        },
        { key: 'timeout', label: '超时时间(ms)', type: 'number', defaultValue: 30000 }
      ],
      paramValues: {
        url: 'https://www.example.com',
        openMode: 'newBrowser',
        browserType: 'chrome',
        incognito: false,
        windowSize: 'default',
        customWidth: 1280,
        customHeight: 800,
        waitUntil: 'networkidle',
        timeout: 30000
      }
    },
    {
      id: 'element_browser_navigate',
      type: 'BROWSER_NAVIGATE',
      name: '导航到URL',
      icon: 'ArrowRight',
      position: { x: 300, y: 50 },
      params: [
        {
          key: 'url',
          label: '网址',
          type: 'string',
          required: true,
          defaultValue: 'https://www.example.com'
        },
        { key: 'waitForLoad', label: '等待加载', type: 'boolean', defaultValue: true }
      ],
      paramValues: {
        url: 'https://www.example.com/search',
        waitForLoad: true
      }
    },
    {
      id: 'element_browser_refresh',
      type: 'BROWSER_REFRESH',
      name: '刷新页面',
      icon: 'Refresh',
      position: { x: 500, y: 50 },
      params: [{ key: 'waitForLoad', label: '等待加载', type: 'boolean', defaultValue: true }],
      paramValues: {
        waitForLoad: true
      }
    },
    {
      id: 'element_browser_close',
      type: 'BROWSER_CLOSE',
      name: '关闭浏览器',
      icon: 'Close',
      position: { x: 700, y: 50 },
      params: [],
      paramValues: {}
    },

    // 页面交互元件
    {
      id: 'element_input_text',
      type: 'INPUT_TEXT',
      name: '输入文本',
      icon: 'Edit',
      position: { x: 100, y: 150 },
      params: [
        { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' },
        { key: 'text', label: '输入文本', type: 'string', required: true, defaultValue: '' },
        { key: 'clearBefore', label: '先清空', type: 'boolean', defaultValue: true }
      ],
      paramValues: {
        selector: 'input[type="text"]',
        text: '测试搜索内容',
        clearBefore: true
      }
    },
    {
      id: 'element_click_element',
      type: 'CLICK_ELEMENT',
      name: '点击元素',
      icon: 'Pointer',
      position: { x: 300, y: 150 },
      params: [
        { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' },
        { key: 'waitForNavigation', label: '等待页面加载', type: 'boolean', defaultValue: true },
        { key: 'clickCount', label: '点击次数', type: 'number', defaultValue: 1 }
      ],
      paramValues: {
        selector: 'button[type="submit"]',
        waitForNavigation: true,
        clickCount: 1
      }
    },
    {
      id: 'element_select_option',
      type: 'SELECT_OPTION',
      name: '选择选项',
      icon: 'Select',
      position: { x: 500, y: 150 },
      params: [
        { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' },
        { key: 'optionText', label: '选项文本', type: 'string', defaultValue: '' },
        { key: 'optionValue', label: '选项值', type: 'string', defaultValue: '' }
      ],
      paramValues: {
        selector: 'select[name="category"]',
        optionText: '全部',
        optionValue: 'all'
      }
    },
    {
      id: 'element_scroll_page',
      type: 'SCROLL_PAGE',
      name: '滚动页面',
      icon: 'RefreshRight',
      position: { x: 700, y: 150 },
      params: [
        {
          key: 'scrollType',
          label: '滚动方式',
          type: 'select',
          defaultValue: 'down',
          options: ['up', 'down', 'toTop', 'toBottom', 'toElement'],
          required: true
        },
        { key: 'selector', label: '元素选择器', type: 'string', defaultValue: '' }
      ],
      paramValues: {
        scrollType: 'down',
        selector: ''
      }
    },
    {
      id: 'element_hover_element',
      type: 'HOVER_ELEMENT',
      name: '悬停元素',
      icon: 'Mouse',
      position: { x: 900, y: 150 },
      params: [
        { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' }
      ],
      paramValues: {
        selector: '.dropdown-menu'
      }
    },

    // 数据处理元件
    {
      id: 'element_extract_data',
      type: 'EXTRACT_DATA',
      name: '提取数据',
      icon: 'DataAnalysis',
      position: { x: 100, y: 250 },
      params: [
        { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' },
        {
          key: 'extractType',
          label: '提取类型',
          type: 'select',
          options: ['text', 'attribute', 'html', 'value'],
          defaultValue: 'text'
        },
        { key: 'attributeName', label: '属性名', type: 'string', defaultValue: 'href' },
        {
          key: 'variableName',
          label: '变量名',
          type: 'string',
          required: true,
          defaultValue: 'extractedData'
        }
      ],
      paramValues: {
        selector: '#search-results',
        extractType: 'text',
        attributeName: 'href',
        variableName: 'searchResultsData'
      }
    },
    {
      id: 'element_get_page_elements',
      type: 'GET_PAGE_ELEMENTS',
      name: '获取页面元素',
      icon: 'DataAnalysis',
      position: { x: 300, y: 250 },
      params: [
        { key: 'browserId', label: '浏览器ID', type: 'string', required: true, defaultValue: '' },
        { key: 'selector', label: '元素选择器', type: 'string', defaultValue: '*' },
        { key: 'extractDetails', label: '提取详细信息', type: 'boolean', defaultValue: true },
        {
          key: 'variableName',
          label: '变量名',
          type: 'string',
          required: true,
          defaultValue: 'pageElements'
        }
      ],
      paramValues: {
        browserId: '',
        selector: '.search-result-item',
        extractDetails: true,
        variableName: 'searchItems'
      }
    },
    {
      id: 'element_process_data',
      type: 'PROCESS_DATA',
      name: '处理数据',
      icon: 'Operation',
      position: { x: 500, y: 250 },
      params: [
        {
          key: 'inputVariable',
          label: '输入变量',
          type: 'string',
          required: true,
          defaultValue: ''
        },
        {
          key: 'operationType',
          label: '操作类型',
          type: 'select',
          options: ['uppercase', 'lowercase', 'trim', 'parseJson', 'stringify'],
          defaultValue: 'uppercase'
        },
        {
          key: 'outputVariable',
          label: '输出变量',
          type: 'string',
          required: true,
          defaultValue: 'processedData'
        }
      ],
      paramValues: {
        inputVariable: 'searchResultsData',
        operationType: 'trim',
        outputVariable: 'processedSearchData'
      }
    },
    {
      id: 'element_compare_data',
      type: 'COMPARE_DATA',
      name: '比较数据',
      icon: 'Operation',
      position: { x: 700, y: 250 },
      params: [
        { key: 'value1', label: '第一个值', type: 'string', required: true, defaultValue: '' },
        { key: 'value2', label: '第二个值', type: 'string', required: true, defaultValue: '' },
        {
          key: 'operator',
          label: '比较操作符',
          type: 'select',
          options: ['equal', 'notEqual', 'greaterThan', 'lessThan'],
          required: true,
          defaultValue: 'equal'
        },
        {
          key: 'resultVariable',
          label: '结果变量',
          type: 'string',
          required: true,
          defaultValue: 'compareResult'
        }
      ],
      paramValues: {
        value1: '${processedSearchData.length}',
        value2: '0',
        operator: 'greaterThan',
        resultVariable: 'hasResults'
      }
    },

    // 逻辑控制元件
    {
      id: 'element_wait',
      type: 'WAIT',
      name: '等待',
      icon: 'Clock',
      position: { x: 100, y: 350 },
      params: [
        { key: 'seconds', label: '等待秒数', type: 'number', required: true, defaultValue: 2 }
      ],
      paramValues: {
        seconds: 2
      }
    },
    {
      id: 'element_if_condition',
      type: 'IF_CONDITION',
      name: '条件判断',
      icon: 'Switch',
      position: { x: 300, y: 350 },
      params: [
        { key: 'condition', label: '条件表达式', type: 'string', required: true, defaultValue: '' },
        { key: 'trueBranchId', label: '条件为真时执行', type: 'string', defaultValue: '' },
        { key: 'falseBranchId', label: '条件为假时执行', type: 'string', defaultValue: '' }
      ],
      paramValues: {
        condition: '${hasResults}',
        trueBranchId: 'element_save_file',
        falseBranchId: 'element_browser_close'
      }
    },
    {
      id: 'element_loop_for',
      type: 'LOOP_FOR',
      name: '循环',
      icon: 'RefreshLeft',
      position: { x: 500, y: 350 },
      params: [
        { key: 'loopCount', label: '循环次数', type: 'number', required: true, defaultValue: 5 },
        { key: 'loopVariable', label: '循环变量名', type: 'string', defaultValue: 'i' }
      ],
      paramValues: {
        loopCount: 3,
        loopVariable: 'loopIndex'
      }
    },
    {
      id: 'element_try_catch',
      type: 'TRY_CATCH',
      name: '异常处理',
      icon: 'Warning',
      position: { x: 700, y: 350 },
      params: [
        { key: 'errorVariable', label: '错误变量名', type: 'string', defaultValue: 'error' }
      ],
      paramValues: {
        errorVariable: 'errorInfo'
      }
    },

    // 文件操作元件
    {
      id: 'element_save_file',
      type: 'SAVE_FILE',
      name: '保存文件',
      icon: 'Download',
      position: { x: 100, y: 450 },
      params: [
        { key: 'data', label: '数据', type: 'string', required: true, defaultValue: '' },
        { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' },
        {
          key: 'format',
          label: '文件格式',
          type: 'select',
          options: ['txt', 'json', 'csv'],
          defaultValue: 'txt'
        }
      ],
      paramValues: {
        data: '${processedSearchData}',
        filePath: 'search_results.txt',
        format: 'txt'
      }
    },
    {
      id: 'element_read_file',
      type: 'READ_FILE',
      name: '读取文件',
      icon: 'Document',
      position: { x: 300, y: 450 },
      params: [
        { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' },
        {
          key: 'encoding',
          label: '编码格式',
          type: 'select',
          defaultValue: 'utf8',
          options: ['utf8', 'ascii', 'base64']
        },
        {
          key: 'outputVariable',
          label: '输出变量',
          type: 'string',
          required: true,
          defaultValue: 'fileContent'
        }
      ],
      paramValues: {
        filePath: 'config.json',
        encoding: 'utf8',
        outputVariable: 'configData'
      }
    },
    {
      id: 'element_write_file',
      type: 'WRITE_FILE',
      name: '写入文件',
      icon: 'EditPen',
      position: { x: 500, y: 450 },
      params: [
        { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' },
        { key: 'content', label: '文件内容', type: 'string', required: true, defaultValue: '' },
        {
          key: 'encoding',
          label: '编码格式',
          type: 'select',
          defaultValue: 'utf8',
          options: ['utf8', 'ascii', 'base64']
        },
        { key: 'append', label: '追加模式', type: 'boolean', defaultValue: false }
      ],
      paramValues: {
        filePath: 'output.log',
        content: '${new Date().toISOString()}: Process completed\n',
        encoding: 'utf8',
        append: true
      }
    },
    {
      id: 'element_download_file',
      type: 'DOWNLOAD_FILE',
      name: '下载文件',
      icon: 'Download',
      position: { x: 700, y: 450 },
      params: [
        { key: 'url', label: '文件URL', type: 'string', required: true, defaultValue: '' },
        { key: 'savePath', label: '保存路径', type: 'string', required: true, defaultValue: '' }
      ],
      paramValues: {
        url: 'https://example.com/file.zip',
        savePath: './downloads/file.zip'
      }
    },
    {
      id: 'element_upload_file',
      type: 'UPLOAD_FILE',
      name: '上传文件',
      icon: 'Upload',
      position: { x: 900, y: 450 },
      params: [
        {
          key: 'selector',
          label: '上传元素选择器',
          type: 'string',
          required: true,
          defaultValue: ''
        },
        { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' }
      ],
      paramValues: {
        selector: 'input[type="file"]',
        filePath: './uploads/test.txt'
      }
    }
  ],
  edges: [
    // 浏览器操作元件连接
    {
      id: 'edge-browser_open-browser_navigate',
      source: 'element_browser_open',
      target: 'element_browser_navigate',
      sourceHandle: 'element_browser_open-right',
      targetHandle: 'element_browser_navigate-left',
      type: 'default'
    },
    {
      id: 'edge-browser_navigate-browser_refresh',
      source: 'element_browser_navigate',
      target: 'element_browser_refresh',
      sourceHandle: 'element_browser_navigate-right',
      targetHandle: 'element_browser_refresh-left',
      type: 'default'
    },
    {
      id: 'edge-browser_refresh-browser_close',
      source: 'element_browser_refresh',
      target: 'element_browser_close',
      sourceHandle: 'element_browser_refresh-right',
      targetHandle: 'element_browser_close-left',
      type: 'default'
    },

    // 页面交互元件连接
    {
      id: 'edge-browser_navigate-input_text',
      source: 'element_browser_navigate',
      target: 'element_input_text',
      sourceHandle: 'element_browser_navigate-bottom',
      targetHandle: 'element_input_text-top',
      type: 'default'
    },
    {
      id: 'edge-input_text-click_element',
      source: 'element_input_text',
      target: 'element_click_element',
      sourceHandle: 'element_input_text-right',
      targetHandle: 'element_click_element-left',
      type: 'default'
    },
    {
      id: 'edge-click_element-select_option',
      source: 'element_click_element',
      target: 'element_select_option',
      sourceHandle: 'element_click_element-right',
      targetHandle: 'element_select_option-left',
      type: 'default'
    },
    {
      id: 'edge-select_option-scroll_page',
      source: 'element_select_option',
      target: 'element_scroll_page',
      sourceHandle: 'element_select_option-right',
      targetHandle: 'element_scroll_page-left',
      type: 'default'
    },
    {
      id: 'edge-scroll_page-hover_element',
      source: 'element_scroll_page',
      target: 'element_hover_element',
      sourceHandle: 'element_scroll_page-right',
      targetHandle: 'element_hover_element-left',
      type: 'default'
    },

    // 数据处理元件连接
    {
      id: 'edge-hover_element-extract_data',
      source: 'element_hover_element',
      target: 'element_extract_data',
      sourceHandle: 'element_hover_element-bottom',
      targetHandle: 'element_extract_data-top',
      type: 'default'
    },
    {
      id: 'edge-extract_data-get_page_elements',
      source: 'element_extract_data',
      target: 'element_get_page_elements',
      sourceHandle: 'element_extract_data-right',
      targetHandle: 'element_get_page_elements-left',
      type: 'default'
    },
    {
      id: 'edge-get_page_elements-process_data',
      source: 'element_get_page_elements',
      target: 'element_process_data',
      sourceHandle: 'element_get_page_elements-right',
      targetHandle: 'element_process_data-left',
      type: 'default'
    },
    {
      id: 'edge-process_data-compare_data',
      source: 'element_process_data',
      target: 'element_compare_data',
      sourceHandle: 'element_process_data-right',
      targetHandle: 'element_compare_data-left',
      type: 'default'
    },

    // 逻辑控制元件连接
    {
      id: 'edge-compare_data-wait',
      source: 'element_compare_data',
      target: 'element_wait',
      sourceHandle: 'element_compare_data-bottom',
      targetHandle: 'element_wait-top',
      type: 'default'
    },
    {
      id: 'edge-wait-if_condition',
      source: 'element_wait',
      target: 'element_if_condition',
      sourceHandle: 'element_wait-right',
      targetHandle: 'element_if_condition-left',
      type: 'default'
    },
    {
      id: 'edge-if_condition-loop_for',
      source: 'element_if_condition',
      target: 'element_loop_for',
      sourceHandle: 'element_if_condition-right',
      targetHandle: 'element_loop_for-left',
      type: 'default'
    },
    {
      id: 'edge-loop_for-try_catch',
      source: 'element_loop_for',
      target: 'element_try_catch',
      sourceHandle: 'element_loop_for-right',
      targetHandle: 'element_try_catch-left',
      type: 'default'
    },

    // 文件操作元件连接
    {
      id: 'edge-try_catch-save_file',
      source: 'element_try_catch',
      target: 'element_save_file',
      sourceHandle: 'element_try_catch-bottom',
      targetHandle: 'element_save_file-top',
      type: 'default'
    },
    {
      id: 'edge-save_file-read_file',
      source: 'element_save_file',
      target: 'element_read_file',
      sourceHandle: 'element_save_file-right',
      targetHandle: 'element_read_file-left',
      type: 'default'
    },
    {
      id: 'edge-read_file-write_file',
      source: 'element_read_file',
      target: 'element_write_file',
      sourceHandle: 'element_read_file-right',
      targetHandle: 'element_write_file-left',
      type: 'default'
    },
    {
      id: 'edge-write_file-download_file',
      source: 'element_write_file',
      target: 'element_download_file',
      sourceHandle: 'element_write_file-right',
      targetHandle: 'element_download_file-left',
      type: 'default'
    },
    {
      id: 'edge-download_file-upload_file',
      source: 'element_download_file',
      target: 'element_upload_file',
      sourceHandle: 'element_download_file-right',
      targetHandle: 'element_upload_file-left',
      type: 'default'
    },
    {
      id: 'edge-upload_file-browser_close',
      source: 'element_upload_file',
      target: 'element_browser_close',
      sourceHandle: 'element_upload_file-top',
      targetHandle: 'element_browser_close-bottom',
      type: 'default'
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

// 回退
const goBack = () => {
  router.back()
  logger.info(`回退到上一页`)
}

// 切换标签页
const switchTab = (tabName) => {
  activeTab.value = tabName
  logger.info(`切换到播放器 & 日志标签页`)
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
    console.log('工作流已保存', JSON.stringify(updatedWorkflow))
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
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
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
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
  color: var(--el-color-primary);
}

.app-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  background-color: var(--el-bg-color);
}

/* 左侧面板 - 元件库 */
.left-panel {
  width: 260px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--el-fill-color);
  border-right: 1px solid var(--el-border-color);
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
  background-color: var(--el-fill-color);
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 右侧面板 - 播放器和日志 */
.right-panel {
  width: 380px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--el-fill-color);
  border-left: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.right-panel-tabs {
  display: flex;
  height: 40px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
  user-select: none;
}

.tab-item:hover {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.tab-item.active {
  background-color: var(--el-fill-color);
  color: var(--el-color-primary);
  font-weight: 500;
  border-bottom: 2px solid var(--el-color-primary);
}

.right-panel-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.rpa-statusbar {
  height: 36px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
