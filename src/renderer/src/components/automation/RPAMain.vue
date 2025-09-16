<template>
  <div class="rpa-main">
    <!-- 主工具栏 -->
    <div class="main-toolbar">
      <div class="toolbar-left">
        <h1 class="app-title">RPA网页自动化工具</h1>
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
        <el-button type="success" @click="playWorkflow">运行</el-button>
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
import ElementPanel from './elements/ElementPanel.vue'
import VueFlowEditor from './editor/VueFlowEditor.vue'
import WorkflowPlayer from './player/WorkflowPlayer.vue'

// 导入日志工具
import logger from '@renderer/utils/logger.js'

// 导入主题工具函数
import { saveAndApplyTheme, setupSystemThemeListener } from '@renderer/utils/themeUtils.js'

// 导入Element Plus图标
import { ArrowDown, Monitor, Moon, Sunny } from '@element-plus/icons-vue'

// 工作流数据
const workflow = reactive({
  name: 'RPA初始化演示工作流',
  description: '包含所有支持的RPA元件类型的演示工作流',
  elements: [
    {
      id: 'element_browser_open',
      type: 'BROWSER_OPEN',
      name: '打开浏览器',
      icon: 'Browser',
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
          defaultValue: 'newBrowser',
          description: '在已打开的浏览器中打开，若没有则打开一个；或在新的浏览器中打开'
        },
        {
          key: 'browserType',
          label: '浏览器类型',
          type: 'select',
          options: ['chrome', 'firefox', 'safari'],
          defaultValue: 'chrome',
          description: '选择要使用的浏览器类型'
        },
        {
          key: 'incognito',
          label: '无痕模式',
          type: 'boolean',
          defaultValue: false,
          description: '是否以无痕模式打开浏览器'
        },
        {
          key: 'windowSize',
          label: '窗口大小',
          type: 'select',
          options: ['default', 'maximized', 'fullscreen', 'custom'],
          defaultValue: 'maximized',
          description: '浏览器窗口的打开方式'
        },
        {
          key: 'waitUntil',
          label: '等待加载完成',
          type: 'select',
          options: ['load', 'domcontentloaded', 'networkidle', 'commit'],
          defaultValue: 'networkidle',
          description: '页面加载完成的判断条件'
        },
        {
          key: 'timeout',
          label: '超时时间(ms)',
          type: 'number',
          defaultValue: 30000,
          description: '页面加载的最大等待时间'
        }
      ],
      paramValues: {
        url: 'https://www.example.com',
        openMode: 'newBrowser',
        browserType: 'chrome',
        incognito: false,
        windowSize: 'maximized',
        waitUntil: 'networkidle',
        timeout: 30000
      }
    },
    {
      id: 'element_browser_navigate',
      type: 'BROWSER_NAVIGATE',
      name: '导航到URL',
      icon: 'Navigation',
      position: { x: 300, y: 50 },
      params: [
        {
          key: 'url',
          label: 'URL地址',
          type: 'string',
          required: true,
          defaultValue: 'https://www.baidu.com'
        },
        {
          key: 'waitForLoad',
          label: '等待加载完成',
          type: 'boolean',
          defaultValue: true,
          description: '是否等待页面加载完成'
        }
      ],
      paramValues: {
        url: 'https://www.baidu.com',
        waitForLoad: true
      }
    },
    {
      id: 'element_input_text',
      type: 'INPUT_TEXT',
      name: '输入文本',
      icon: 'Edit',
      position: { x: 500, y: 50 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '',
          description: 'CSS或XPath选择器'
        },
        {
          key: 'text',
          label: '输入文本',
          type: 'string',
          required: true,
          defaultValue: '',
          description: '要输入的文本内容'
        },
        {
          key: 'clearBefore',
          label: '先清空',
          type: 'boolean',
          defaultValue: true,
          description: '输入前是否清空已有内容'
        }
      ],
      paramValues: {
        selector: '#kw',
        text: '三字经的正规全文',
        clearBefore: true
      }
    },
    {
      id: 'element_click_search',
      type: 'CLICK_ELEMENT',
      name: '点击搜索',
      icon: 'Pointer',
      position: { x: 700, y: 50 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '',
          description: 'CSS或XPath选择器'
        },
        {
          key: 'waitForNavigation',
          label: '等待页面加载',
          type: 'boolean',
          defaultValue: true,
          description: '点击后是否等待页面导航完成'
        },
        {
          key: 'clickCount',
          label: '点击次数',
          type: 'number',
          defaultValue: 1,
          description: '单击或双击'
        }
      ],
      paramValues: {
        selector: '#su',
        waitForNavigation: true,
        clickCount: 1
      }
    },
    {
      id: 'element_wait_search',
      type: 'WAIT',
      name: '等待搜索结果',
      icon: 'Clock',
      position: { x: 100, y: 150 },
      params: [
        { key: 'seconds', label: '等待秒数', type: 'number', required: true, defaultValue: 2 }
      ],
      paramValues: { seconds: 2 }
    },
    {
      id: 'element_click_tab',
      type: 'CLICK_ELEMENT',
      name: '点击标签',
      icon: 'Pointer',
      position: { x: 300, y: 150 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '',
          description: 'CSS或XPath选择器'
        },
        {
          key: 'waitForNavigation',
          label: '等待页面加载',
          type: 'boolean',
          defaultValue: true,
          description: '点击后是否等待页面导航完成'
        },
        {
          key: 'clickCount',
          label: '点击次数',
          type: 'number',
          defaultValue: 1,
          description: '单击或双击'
        }
      ],
      paramValues: {
        selector: '#content_left > .s-tab-item:nth-child(2)',
        waitForNavigation: true,
        clickCount: 1
      }
    },
    {
      id: 'element_hover_element',
      type: 'HOVER_ELEMENT',
      name: '悬停元素',
      icon: 'MousePointer',
      position: { x: 500, y: 150 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '',
          description: 'CSS或XPath选择器'
        }
      ],
      paramValues: {
        selector: '#content_left .result:first-child'
      }
    },
    {
      id: 'element_scroll_page',
      type: 'SCROLL_PAGE',
      name: '滚动页面',
      icon: 'ScrollText',
      position: { x: 700, y: 150 },
      params: [
        {
          key: 'scrollType',
          label: '滚动类型',
          type: 'select',
          options: ['up', 'down', 'top', 'bottom'],
          defaultValue: 'down',
          description: '向上、向下、滚动到顶部或底部'
        },
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          defaultValue: '',
          description: '可选的CSS或XPath选择器'
        }
      ],
      paramValues: {
        scrollType: 'down',
        selector: ''
      }
    },
    {
      id: 'element_extract_data',
      type: 'EXTRACT_DATA',
      name: '提取数据',
      icon: 'DataAnalysis',
      position: { x: 100, y: 250 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '',
          description: 'CSS或XPath选择器'
        },
        {
          key: 'extractType',
          label: '提取类型',
          type: 'select',
          options: ['text', 'attribute', 'html', 'value'],
          defaultValue: 'text',
          description: '提取元素的文本、属性、HTML或值'
        },
        {
          key: 'variableName',
          label: '变量名',
          type: 'string',
          required: true,
          defaultValue: 'pageData',
          description: '存储提取数据的变量名称'
        }
      ],
      paramValues: {
        selector: '#content_left',
        extractType: 'text',
        variableName: 'pageData'
      }
    },
    {
      id: 'element_get_page_elements',
      type: 'GET_PAGE_ELEMENTS',
      name: '获取页面元素',
      icon: 'ElementPlus',
      position: { x: 300, y: 250 },
      params: [
        {
          key: 'browserId',
          label: '浏览器ID',
          type: 'string',
          defaultValue: '',
          description: '可选的浏览器实例ID'
        },
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: '.result',
          description: 'CSS或XPath选择器'
        },
        {
          key: 'extractDetails',
          label: '提取详情',
          type: 'boolean',
          defaultValue: true,
          description: '是否提取元素的详细信息'
        },
        {
          key: 'variableName',
          label: '变量名',
          type: 'string',
          required: true,
          defaultValue: 'searchResults',
          description: '存储结果的变量名称'
        }
      ],
      paramValues: {
        browserId: '',
        selector: '.result',
        extractDetails: true,
        variableName: 'searchResults'
      }
    },
    {
      id: 'element_process_data',
      type: 'PROCESS_DATA',
      name: '处理数据',
      icon: 'RefreshCw',
      position: { x: 500, y: 250 },
      params: [
        {
          key: 'inputVariable',
          label: '输入变量',
          type: 'string',
          required: true,
          defaultValue: 'pageData',
          description: '要处理的输入变量'
        },
        {
          key: 'operationType',
          label: '操作类型',
          type: 'select',
          options: ['trim', 'toLowerCase', 'toUpperCase', 'split'],
          defaultValue: 'trim',
          description: '数据处理操作类型'
        },
        {
          key: 'outputVariable',
          label: '输出变量',
          type: 'string',
          required: true,
          defaultValue: 'processedData',
          description: '存储处理结果的变量名称'
        }
      ],
      paramValues: {
        inputVariable: 'pageData',
        operationType: 'trim',
        outputVariable: 'processedData'
      }
    },
    {
      id: 'element_compare_data',
      type: 'COMPARE_DATA',
      name: '比较数据',
      icon: 'Diff',
      position: { x: 700, y: 250 },
      params: [
        {
          key: 'value1',
          label: '值1',
          type: 'string',
          required: true,
          defaultValue: 'pageData',
          description: '要比较的第一个值'
        },
        {
          key: 'value2',
          label: '值2',
          type: 'string',
          defaultValue: '',
          description: '要比较的第二个值'
        },
        {
          key: 'operator',
          label: '运算符',
          type: 'select',
          options: ['equal', 'notEqual', 'greaterThan', 'lessThan'],
          defaultValue: 'notEqual',
          description: '比较运算符'
        },
        {
          key: 'resultVariable',
          label: '结果变量',
          type: 'string',
          required: true,
          defaultValue: 'hasData',
          description: '存储比较结果的变量名称'
        }
      ],
      paramValues: {
        value1: 'pageData',
        value2: '',
        operator: 'notEqual',
        resultVariable: 'hasData'
      }
    },
    {
      id: 'element_if_condition',
      type: 'IF_CONDITION',
      name: '条件判断',
      icon: 'Filter',
      position: { x: 100, y: 350 },
      params: [
        {
          key: 'condition',
          label: '条件表达式',
          type: 'string',
          required: true,
          defaultValue: 'hasData === true',
          description: 'JavaScript条件表达式'
        },
        {
          key: 'trueBranchId',
          label: '真分支ID',
          type: 'string',
          defaultValue: '',
          description: '条件为真时执行的分支元素ID'
        },
        {
          key: 'falseBranchId',
          label: '假分支ID',
          type: 'string',
          defaultValue: '',
          description: '条件为假时执行的分支元素ID'
        }
      ],
      paramValues: {
        condition: 'hasData === true',
        trueBranchId: '',
        falseBranchId: ''
      }
    },
    {
      id: 'element_loop_for',
      type: 'LOOP_FOR',
      name: '循环',
      icon: 'Repeat',
      position: { x: 300, y: 350 },
      params: [
        {
          key: 'loopCount',
          label: '循环次数',
          type: 'number',
          required: true,
          defaultValue: 2,
          description: '循环执行的次数'
        },
        {
          key: 'loopVariable',
          label: '循环变量',
          type: 'string',
          defaultValue: 'i',
          description: '循环计数器变量名'
        }
      ],
      paramValues: {
        loopCount: 2,
        loopVariable: 'i'
      }
    },
    {
      id: 'element_try_catch',
      type: 'TRY_CATCH',
      name: '异常处理',
      icon: 'AlertTriangle',
      position: { x: 500, y: 350 },
      params: [
        {
          key: 'errorVariable',
          label: '错误变量',
          type: 'string',
          defaultValue: 'error',
          description: '存储错误信息的变量名称'
        }
      ],
      paramValues: {
        errorVariable: 'error'
      }
    },
    {
      id: 'element_read_file',
      type: 'READ_FILE',
      name: '读取文件',
      icon: 'FileOpen',
      position: { x: 700, y: 350 },
      params: [
        {
          key: 'filePath',
          label: '文件路径',
          type: 'string',
          required: true,
          defaultValue: '~/Desktop/sample.txt',
          description: '要读取的文件路径'
        },
        {
          key: 'encoding',
          label: '编码',
          type: 'select',
          options: ['utf8', 'ascii', 'base64'],
          defaultValue: 'utf8',
          description: '文件编码格式'
        },
        {
          key: 'outputVariable',
          label: '输出变量',
          type: 'string',
          required: true,
          defaultValue: 'fileContent',
          description: '存储文件内容的变量名称'
        }
      ],
      paramValues: {
        filePath: '~/Desktop/sample.txt',
        encoding: 'utf8',
        outputVariable: 'fileContent'
      }
    },
    {
      id: 'element_write_file',
      type: 'WRITE_FILE',
      name: '写入文件',
      icon: 'FileEdit',
      position: { x: 100, y: 450 },
      params: [
        {
          key: 'filePath',
          label: '文件路径',
          type: 'string',
          required: true,
          defaultValue: '~/Desktop/output.txt',
          description: '要写入的文件路径'
        },
        {
          key: 'content',
          label: '内容',
          type: 'string',
          required: true,
          defaultValue: '${processedData}',
          description: '要写入的内容，可以使用变量'
        },
        {
          key: 'encoding',
          label: '编码',
          type: 'select',
          options: ['utf8', 'ascii', 'base64'],
          defaultValue: 'utf8',
          description: '文件编码格式'
        },
        {
          key: 'append',
          label: '追加模式',
          type: 'boolean',
          defaultValue: false,
          description: '是否以追加模式写入'
        }
      ],
      paramValues: {
        filePath: '~/Desktop/output.txt',
        content: '${processedData}',
        encoding: 'utf8',
        append: false
      }
    },
    {
      id: 'element_save_file',
      type: 'SAVE_FILE',
      name: '保存文件',
      icon: 'Download',
      position: { x: 300, y: 450 },
      params: [
        { key: 'data', label: '数据', type: 'string', required: true, defaultValue: '${pageData}' },
        { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '~/Desktop/国庆搜索结果.txt' },
        {
          key: 'format',
          label: '文件格式',
          type: 'select',
          options: ['txt', 'json', 'csv'],
          defaultValue: 'txt'
        }
      ],
      paramValues: {
        data: '${pageData}',
        filePath: '~/Desktop/国庆搜索结果.txt',
        format: 'txt'
      }
    },
    {
      id: 'element_download_file',
      type: 'DOWNLOAD_FILE',
      name: '下载文件',
      icon: 'DownloadCloud',
      position: { x: 500, y: 450 },
      params: [
        {
          key: 'url',
          label: '文件URL',
          type: 'string',
          required: true,
          defaultValue: 'https://example.com/sample.pdf',
          description: '要下载的文件URL'
        },
        {
          key: 'savePath',
          label: '保存路径',
          type: 'string',
          required: true,
          defaultValue: '~/Downloads/sample.pdf',
          description: '文件保存的本地路径'
        }
      ],
      paramValues: {
        url: 'https://example.com/sample.pdf',
        savePath: '~/Downloads/sample.pdf'
      }
    },
    {
      id: 'element_upload_file',
      type: 'UPLOAD_FILE',
      name: '上传文件',
      icon: 'UploadCloud',
      position: { x: 700, y: 450 },
      params: [
        {
          key: 'selector',
          label: '文件输入选择器',
          type: 'string',
          required: true,
          defaultValue: 'input[type=file]',
          description: '文件输入框的CSS或XPath选择器'
        },
        {
          key: 'filePath',
          label: '本地文件路径',
          type: 'string',
          required: true,
          defaultValue: '~/Desktop/upload.txt',
          description: '要上传的本地文件路径'
        }
      ],
      paramValues: {
        selector: 'input[type=file]',
        filePath: '~/Desktop/upload.txt'
      }
    },
    {
      id: 'element_browser_refresh',
      type: 'BROWSER_REFRESH',
      name: '刷新页面',
      icon: 'RefreshLeft',
      position: { x: 300, y: 550 },
      params: [
        {
          key: 'waitForLoad',
          label: '等待加载完成',
          type: 'boolean',
          defaultValue: true,
          description: '是否等待页面加载完成'
        }
      ],
      paramValues: {
        waitForLoad: true
      }
    },
    {
      id: 'element_browser_close',
      type: 'BROWSER_CLOSE',
      name: '关闭浏览器',
      icon: 'Close',
      position: { x: 500, y: 550 },
      params: [],
      paramValues: {}
    },
    {
      id: 'element_select_option',
      type: 'SELECT_OPTION',
      name: '选择选项',
      icon: 'Select',
      position: { x: 100, y: 550 },
      params: [
        {
          key: 'selector',
          label: '选择器',
          type: 'string',
          required: true,
          defaultValue: 'select',
          description: '下拉选择框的CSS或XPath选择器'
        },
        {
          key: 'optionText',
          label: '选项文本',
          type: 'string',
          defaultValue: 'Option 1',
          description: '要选择的选项文本（与value二选一）'
        },
        {
          key: 'optionValue',
          label: '选项值',
          type: 'string',
          defaultValue: 'option1',
          description: '要选择的选项值（与text二选一）'
        }
      ],
      paramValues: {
        selector: 'select',
        optionText: 'Option 1',
        optionValue: 'option1'
      }
    }
  ],
  edges: [
    {
      id: 'edge-element_browser_open-element_browser_navigate',
      source: 'element_browser_open',
      target: 'element_browser_navigate',
      sourceHandle: 'element_browser_open-right',
      targetHandle: 'element_browser_navigate-left',
      type: 'default'
    },
    {
      id: 'edge-element_browser_navigate-element_input_text',
      source: 'element_browser_navigate',
      target: 'element_input_text',
      sourceHandle: 'element_browser_navigate-right',
      targetHandle: 'element_input_text-left',
      type: 'default'
    },
    {
      id: 'edge-element_input_text-element_click_search',
      source: 'element_input_text',
      target: 'element_click_search',
      sourceHandle: 'element_input_text-right',
      targetHandle: 'element_click_search-left',
      type: 'default'
    },
    {
      id: 'edge-element_click_search-element_wait_search',
      source: 'element_click_search',
      target: 'element_wait_search',
      sourceHandle: 'element_click_search-right',
      targetHandle: 'element_wait_search-left',
      type: 'default'
    },
    {
      id: 'edge-element_wait_search-element_click_tab',
      source: 'element_wait_search',
      target: 'element_click_tab',
      sourceHandle: 'element_wait_search-right',
      targetHandle: 'element_click_tab-left',
      type: 'default'
    },
    {
      id: 'edge-element_click_tab-element_hover_element',
      source: 'element_click_tab',
      target: 'element_hover_element',
      sourceHandle: 'element_click_tab-right',
      targetHandle: 'element_hover_element-left',
      type: 'default'
    },
    {
      id: 'edge-element_hover_element-element_scroll_page',
      source: 'element_hover_element',
      target: 'element_scroll_page',
      sourceHandle: 'element_hover_element-right',
      targetHandle: 'element_scroll_page-left',
      type: 'default'
    },
    {
      id: 'edge-element_scroll_page-element_extract_data',
      source: 'element_scroll_page',
      target: 'element_extract_data',
      sourceHandle: 'element_scroll_page-right',
      targetHandle: 'element_extract_data-left',
      type: 'default'
    },
    {
      id: 'edge-element_extract_data-element_get_page_elements',
      source: 'element_extract_data',
      target: 'element_get_page_elements',
      sourceHandle: 'element_extract_data-right',
      targetHandle: 'element_get_page_elements-left',
      type: 'default'
    },
    {
      id: 'edge-element_get_page_elements-element_process_data',
      source: 'element_get_page_elements',
      target: 'element_process_data',
      sourceHandle: 'element_get_page_elements-right',
      targetHandle: 'element_process_data-left',
      type: 'default'
    },
    {
      id: 'edge-element_process_data-element_compare_data',
      source: 'element_process_data',
      target: 'element_compare_data',
      sourceHandle: 'element_process_data-right',
      targetHandle: 'element_compare_data-left',
      type: 'default'
    },
    {
      id: 'edge-element_compare_data-element_if_condition',
      source: 'element_compare_data',
      target: 'element_if_condition',
      sourceHandle: 'element_compare_data-right',
      targetHandle: 'element_if_condition-left',
      type: 'default'
    },
    {
      id: 'edge-element_if_condition-element_loop_for',
      source: 'element_if_condition',
      target: 'element_loop_for',
      sourceHandle: 'element_if_condition-right',
      targetHandle: 'element_loop_for-left',
      type: 'default'
    },
    {
      id: 'edge-element_loop_for-element_try_catch',
      source: 'element_loop_for',
      target: 'element_try_catch',
      sourceHandle: 'element_loop_for-right',
      targetHandle: 'element_try_catch-left',
      type: 'default'
    },
    {
      id: 'edge-element_try_catch-element_read_file',
      source: 'element_try_catch',
      target: 'element_read_file',
      sourceHandle: 'element_try_catch-right',
      targetHandle: 'element_read_file-left',
      type: 'default'
    },
    {
      id: 'edge-element_read_file-element_write_file',
      source: 'element_read_file',
      target: 'element_write_file',
      sourceHandle: 'element_read_file-right',
      targetHandle: 'element_write_file-left',
      type: 'default'
    },
    {
      id: 'edge-element_write_file-element_save_file',
      source: 'element_write_file',
      target: 'element_save_file',
      sourceHandle: 'element_write_file-right',
      targetHandle: 'element_save_file-left',
      type: 'default'
    },
    {
      id: 'edge-element_save_file-element_download_file',
      source: 'element_save_file',
      target: 'element_download_file',
      sourceHandle: 'element_save_file-right',
      targetHandle: 'element_download_file-left',
      type: 'default'
    },
    {
      id: 'edge-element_download_file-element_upload_file',
      source: 'element_download_file',
      target: 'element_upload_file',
      sourceHandle: 'element_download_file-right',
      targetHandle: 'element_upload_file-left',
      type: 'default'
    },
    {
      id: 'edge-element_upload_file-element_select_option',
      source: 'element_upload_file',
      target: 'element_select_option',
      sourceHandle: 'element_upload_file-right',
      targetHandle: 'element_select_option-left',
      type: 'default'
    },
    {
      id: 'edge-element_select_option-element_browser_refresh',
      source: 'element_select_option',
      target: 'element_browser_refresh',
      sourceHandle: 'element_select_option-right',
      targetHandle: 'element_browser_refresh-left',
      type: 'default'
    },
    {
      id: 'edge-element_browser_refresh-element_browser_close',
      source: 'element_browser_refresh',
      target: 'element_browser_close',
      sourceHandle: 'element_browser_refresh-right',
      targetHandle: 'element_browser_close-left',
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
  background-color: var(--color-background);
  color: var(--color-text);
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
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  color: var(--color-primary);
}

.app-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
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
  background-color: var(--color-background);
}

/* 左侧面板 - 元件库 */
.left-panel {
  width: 260px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--color-background-light);
  border-right: 1px solid var(--color-border);
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
  background-color: var(--color-background-light);
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 右侧面板 - 播放器和日志 */
.right-panel {
  width: 380px;
  height: 100%;
  flex-shrink: 0;
  background-color: var(--color-background-light);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.right-panel-tabs {
  display: flex;
  height: 40px;
  background-color: var(--color-background-950);
  border-bottom: 1px solid var(--color-border);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  user-select: none;
}

.tab-item:hover {
  background-color: var(--color-background-900);
  color: var(--color-text-primary);
}

.tab-item.active {
  background-color: var(--color-background-light);
  color: var(--color-primary);
  font-weight: 500;
  border-bottom: 2px solid var(--color-primary);
}

.right-panel-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.rpa-statusbar {
  height: 36px;
  background-color: var(--color-background-950);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-size: 12px;
  color: var(--color-text-secondary);
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
