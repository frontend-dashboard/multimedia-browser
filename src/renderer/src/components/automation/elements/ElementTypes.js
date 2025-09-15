// 定义 RPA 工具支持的元件类型
const ElementTypes = {
  // 浏览器操作元件
  BROWSER_OPEN: {
    type: 'BROWSER_OPEN',
    name: '打开浏览器',
    description: '使用Playwright打开指定URL的浏览器窗口',
    icon: 'Browser',
    params: [
      {
        key: 'url',
        label: 'URL地址',
        type: 'string',
        required: true,
        defaultValue: 'https://www.example.com'
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
        label: '隐身模式',
        type: 'boolean',
        defaultValue: false,
        description: '是否以隐身模式打开浏览器'
      },
      {
        key: 'windowSize',
        label: '窗口大小',
        type: 'select',
        options: ['default', 'maximized', 'fullscreen', 'custom'],
        defaultValue: 'default',
        description: '浏览器窗口的打开方式'
      },
      {
        key: 'customWidth',
        label: '自定义宽度',
        type: 'number',
        defaultValue: 1280,
        description: '自定义窗口宽度（仅在窗口大小选择"custom"时生效）'
      },
      {
        key: 'customHeight',
        label: '自定义高度',
        type: 'number',
        defaultValue: 800,
        description: '自定义窗口高度（仅在窗口大小选择"custom"时生效）'
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
    ]
  },

  BROWSER_CLOSE: {
    type: 'BROWSER_CLOSE',
    name: '关闭浏览器',
    description: '关闭当前Playwright浏览器实例',
    icon: 'Close',
    params: []
  },

  // 页面交互元件
  CLICK_ELEMENT: {
    type: 'CLICK_ELEMENT',
    name: '点击元素',
    description: '在页面上点击指定的元素',
    icon: 'Pointer',
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
    ]
  },

  INPUT_TEXT: {
    type: 'INPUT_TEXT',
    name: '输入文本',
    description: '在输入框中输入文本',
    icon: 'Edit',
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
    ]
  },

  // 数据处理元件
  EXTRACT_DATA: {
    type: 'EXTRACT_DATA',
    name: '提取数据',
    description: '从页面元素中提取数据并存储到变量',
    icon: 'DataAnalysis',
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
        key: 'attributeName',
        label: '属性名',
        type: 'string',
        defaultValue: 'href',
        description: '当提取类型为属性时，指定要提取的属性名'
      },
      {
        key: 'variableName',
        label: '变量名',
        type: 'string',
        required: true,
        defaultValue: 'extractedData',
        description: '存储提取数据的变量名称'
      }
    ]
  },

  // 逻辑控制元件
  WAIT: {
    type: 'WAIT',
    name: '等待',
    description: '暂停执行指定的时间',
    icon: 'Clock',
    params: [{ key: 'seconds', label: '等待秒数', type: 'number', required: true, defaultValue: 2 }]
  },

  IF_CONDITION: {
    type: 'IF_CONDITION',
    name: '条件判断',
    description: '根据条件执行不同的操作',
    icon: 'Sort',
    params: [
      { key: 'condition', label: '条件表达式', type: 'string', required: true, defaultValue: '' },
      { key: 'trueBranchId', label: '条件为真时执行', type: 'string', defaultValue: '' },
      { key: 'falseBranchId', label: '条件为假时执行', type: 'string', defaultValue: '' }
    ]
  },

  // 文件操作元件
  SAVE_FILE: {
    type: 'SAVE_FILE',
    name: '保存文件',
    description: '保存数据到本地文件',
    icon: 'Download',
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
    ]
  }
}

export default ElementTypes
