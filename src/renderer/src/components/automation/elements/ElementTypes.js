/**
 * RPA 工具元件类型定义与初始化系统
 *
 * 这个模块定义了所有支持的RPA元件类型，并提供标准化的初始化流程，包括：
 * 1. 元件类型定义和参数结构
 * 2. 元件分类管理
 * 3. 标准化的元件实例化函数
 * 4. 参数验证与默认值设置
 */

// 定义元件分类
const ElementCategories = {
  BROWSER: 'browser', // 浏览器操作
  INTERACTION: 'interaction', // 页面交互
  DATA: 'data', // 数据处理
  LOGIC: 'logic', // 逻辑控制
  FILE: 'file' // 文件操作
}

// 定义 RPA 工具支持的元件类型
const ElementTypes = {
  // 浏览器操作元件
  BROWSER_OPEN: {
    type: 'BROWSER_OPEN',
    name: '打开浏览器',
    description: '使用Playwright打开指定URL的浏览器窗口',
    icon: 'ChromeFilled',
    category: ElementCategories.BROWSER,
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
        defaultValue: 'useExisting',
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
        key: 'headless',
        label: '无头模式',
        type: 'boolean',
        defaultValue: false,
        description: '是否以无头模式运行（无界面）'
      },
      {
        key: 'incognito',
        label: '隐身模式',
        type: 'boolean',
        defaultValue: false,
        description: '是否以隐身模式运行（隐私浏览）'
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
    ],
    // 执行前的参数验证
    validateParams: (params) => {
      if (!params.url || typeof params.url !== 'string') {
        return { valid: false, error: 'URL地址是必需的且必须是字符串' }
      }
      if (params.timeout && (typeof params.timeout !== 'number' || params.timeout < 0)) {
        return { valid: false, error: '超时时间必须是非负数字' }
      }
      return { valid: true }
    }
  },

  BROWSER_CLOSE: {
    type: 'BROWSER_CLOSE',
    name: '关闭浏览器',
    description: '关闭当前Playwright浏览器实例',
    icon: 'Close',
    category: ElementCategories.BROWSER,
    params: [],
    validateParams: () => ({ valid: true })
  },

  BROWSER_REFRESH: {
    type: 'BROWSER_REFRESH',
    name: '刷新页面',
    description: '刷新当前浏览器页面',
    icon: 'Refresh',
    category: ElementCategories.BROWSER,
    params: [
      {
        key: 'waitForLoad',
        label: '等待加载',
        type: 'boolean',
        defaultValue: true,
        description: '刷新后是否等待页面加载完成'
      }
    ],
    validateParams: () => ({ valid: true })
  },

  BROWSER_NAVIGATE: {
    type: 'BROWSER_NAVIGATE',
    name: '导航到URL',
    description: '在当前窗口导航到指定URL',
    icon: 'ArrowRight',
    category: ElementCategories.BROWSER,
    params: [
      {
        key: 'url',
        label: '网址',
        type: 'string',
        required: true,
        defaultValue: 'https://www.example.com'
      },
      {
        key: 'waitForLoad',
        label: '等待加载',
        type: 'boolean',
        defaultValue: true
      }
    ],
    validateParams: (params) => {
      if (!params.url || typeof params.url !== 'string') {
        return { valid: false, error: '网址是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  // 页面交互元件
  CLICK_ELEMENT: {
    type: 'CLICK_ELEMENT',
    name: '点击元素',
    description: '在页面上点击指定的元素',
    icon: 'Pointer',
    category: ElementCategories.INTERACTION,
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
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '选择器是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  INPUT_TEXT: {
    type: 'INPUT_TEXT',
    name: '输入文本',
    description: '在输入框中输入文本',
    icon: 'Edit',
    category: ElementCategories.INTERACTION,
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
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '选择器是必需的且必须是字符串' }
      }
      if (params.text === undefined) {
        return { valid: false, error: '输入文本是必需的' }
      }
      return { valid: true }
    }
  },

  SELECT_OPTION: {
    type: 'SELECT_OPTION',
    name: '选择选项',
    description: '从下拉菜单中选择选项',
    icon: 'Select',
    category: ElementCategories.INTERACTION,
    params: [
      { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' },
      { key: 'optionText', label: '选项文本', type: 'string', defaultValue: '' },
      { key: 'optionValue', label: '选项值', type: 'string', defaultValue: '' }
    ],
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '选择器是必需的且必须是字符串' }
      }
      if (!params.optionText && !params.optionValue) {
        return { valid: false, error: '选项文本或选项值必须提供一个' }
      }
      return { valid: true }
    }
  },

  SCROLL_PAGE: {
    type: 'SCROLL_PAGE',
    name: '滚动页面',
    description: '滚动页面到指定位置',
    icon: 'RefreshRight',
    category: ElementCategories.INTERACTION,
    params: [
      {
        key: 'scrollType',
        label: '滚动方式',
        type: 'select',
        defaultValue: 'down',
        options: ['up', 'down', 'toTop', 'toBottom', 'toElement'],
        required: true
      },
      { key: 'selector', label: '元素选择器', type: 'string', defaultValue: '', required: false }
    ],
    validateParams: (params) => {
      const validScrollTypes = ['up', 'down', 'toTop', 'toBottom', 'toElement']
      if (!params.scrollType || !validScrollTypes.includes(params.scrollType)) {
        return { valid: false, error: '无效的滚动方式' }
      }
      if (
        params.scrollType === 'toElement' &&
        (!params.selector || typeof params.selector !== 'string')
      ) {
        return { valid: false, error: '滚动到元素时必须提供选择器' }
      }
      return { valid: true }
    }
  },

  HOVER_ELEMENT: {
    type: 'HOVER_ELEMENT',
    name: '悬停元素',
    description: '鼠标悬停在指定元素上',
    icon: 'Mouse',
    category: ElementCategories.INTERACTION,
    params: [
      { key: 'selector', label: '选择器', type: 'string', required: true, defaultValue: '' }
    ],
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '选择器是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  // 数据处理元件
  EXTRACT_DATA: {
    type: 'EXTRACT_DATA',
    name: '提取数据',
    description: '从页面元素中提取数据并存储到变量',
    icon: 'DataAnalysis',
    category: ElementCategories.DATA,
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
    ],
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '选择器是必需的且必须是字符串' }
      }
      if (!params.variableName || typeof params.variableName !== 'string') {
        return { valid: false, error: '变量名是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  GET_PAGE_ELEMENTS: {
    type: 'GET_PAGE_ELEMENTS',
    name: '获取页面元素',
    description: '获取当前页面中的所有或指定的元素信息',
    icon: 'DataAnalysis',
    category: ElementCategories.DATA,
    params: [
      {
        key: 'browserId',
        label: '浏览器ID',
        type: 'string',
        required: true,
        defaultValue: '',
        description: '打开的浏览器实例ID，用于识别目标浏览器'
      },
      {
        key: 'selector',
        label: '元素选择器',
        type: 'string',
        defaultValue: '*',
        description: 'CSS选择器，默认为"*"获取所有元素'
      },
      {
        key: 'extractDetails',
        label: '提取详细信息',
        type: 'boolean',
        defaultValue: true,
        description: '是否提取元素的详细信息（如属性、文本内容等）'
      },
      {
        key: 'variableName',
        label: '变量名',
        type: 'string',
        required: true,
        defaultValue: 'pageElements',
        description: '存储提取的元素信息的变量名称'
      }
    ],
    validateParams: (params) => {
      if (!params.browserId || typeof params.browserId !== 'string') {
        return { valid: false, error: '浏览器ID是必需的且必须是字符串' }
      }
      if (!params.variableName || typeof params.variableName !== 'string') {
        return { valid: false, error: '变量名是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  PROCESS_DATA: {
    type: 'PROCESS_DATA',
    name: '处理数据',
    description: '对数据进行转换处理',
    icon: 'Operation',
    category: ElementCategories.DATA,
    params: [
      { key: 'inputVariable', label: '输入变量', type: 'string', required: true, defaultValue: '' },
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
    validateParams: (params) => {
      if (!params.inputVariable || typeof params.inputVariable !== 'string') {
        return { valid: false, error: '输入变量是必需的且必须是字符串' }
      }
      if (!params.outputVariable || typeof params.outputVariable !== 'string') {
        return { valid: false, error: '输出变量是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  COMPARE_DATA: {
    type: 'COMPARE_DATA',
    name: '比较数据',
    description: '比较两个数据值',
    icon: 'Operation',
    category: ElementCategories.DATA,
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
    validateParams: (params) => {
      if (!params.resultVariable || typeof params.resultVariable !== 'string') {
        return { valid: false, error: '结果变量是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  // 逻辑控制元件
  WAIT: {
    type: 'WAIT',
    name: '等待',
    description: '暂停执行指定的时间',
    icon: 'Clock',
    category: ElementCategories.LOGIC,
    params: [
      { key: 'seconds', label: '等待秒数', type: 'number', required: true, defaultValue: 2 }
    ],
    validateParams: (params) => {
      if (!params.seconds || typeof params.seconds !== 'number' || params.seconds < 0) {
        return { valid: false, error: '等待秒数必须是非负数字' }
      }
      return { valid: true }
    }
  },

  IF_CONDITION: {
    type: 'IF_CONDITION',
    name: '条件判断',
    description: '根据条件执行不同的操作',
    icon: 'Switch',
    category: ElementCategories.LOGIC,
    params: [
      { key: 'condition', label: '条件表达式', type: 'string', required: true, defaultValue: '' },
      { key: 'trueBranchId', label: '条件为真时执行', type: 'string', defaultValue: '' },
      { key: 'falseBranchId', label: '条件为假时执行', type: 'string', defaultValue: '' }
    ],
    validateParams: (params) => {
      if (!params.condition || typeof params.condition !== 'string') {
        return { valid: false, error: '条件表达式是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  LOOP_FOR: {
    type: 'LOOP_FOR',
    name: '循环',
    description: '重复执行一组操作',
    icon: 'RefreshLeft',
    category: ElementCategories.LOGIC,
    params: [
      { key: 'loopCount', label: '循环次数', type: 'number', required: true, defaultValue: 5 },
      { key: 'loopVariable', label: '循环变量名', type: 'string', defaultValue: 'i' }
    ],
    validateParams: (params) => {
      if (!params.loopCount || typeof params.loopCount !== 'number' || params.loopCount < 1) {
        return { valid: false, error: '循环次数必须是大于0的数字' }
      }
      return { valid: true }
    }
  },

  TRY_CATCH: {
    type: 'TRY_CATCH',
    name: '异常处理',
    description: '捕获并处理异常',
    icon: 'Warning',
    category: ElementCategories.LOGIC,
    params: [{ key: 'errorVariable', label: '错误变量名', type: 'string', defaultValue: 'error' }],
    validateParams: () => ({ valid: true })
  },

  // 文件操作元件
  SAVE_FILE: {
    type: 'SAVE_FILE',
    name: '保存文件',
    description: '保存数据到本地文件',
    icon: 'Download',
    category: ElementCategories.FILE,
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
    validateParams: (params) => {
      if (!params.filePath || typeof params.filePath !== 'string') {
        return { valid: false, error: '文件路径是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  READ_FILE: {
    type: 'READ_FILE',
    name: '读取文件',
    description: '读取本地文件内容',
    icon: 'Document',
    category: ElementCategories.FILE,
    params: [
      { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' },
      {
        key: 'encoding',
        label: '编码格式',
        type: 'select',
        defaultValue: 'utf8',
        options: ['utf8', 'ascii', 'base64'],
        required: false
      },
      {
        key: 'outputVariable',
        label: '输出变量',
        type: 'string',
        required: true,
        defaultValue: 'fileContent'
      }
    ],
    validateParams: (params) => {
      if (!params.filePath || typeof params.filePath !== 'string') {
        return { valid: false, error: '文件路径是必需的且必须是字符串' }
      }
      if (!params.outputVariable || typeof params.outputVariable !== 'string') {
        return { valid: false, error: '输出变量是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  WRITE_FILE: {
    type: 'WRITE_FILE',
    name: '写入文件',
    description: '将数据写入到本地文件',
    icon: 'EditPen',
    category: ElementCategories.FILE,
    params: [
      { key: 'filePath', label: '文件路径', type: 'string', required: true, defaultValue: '' },
      { key: 'content', label: '文件内容', type: 'string', required: true, defaultValue: '' },
      {
        key: 'encoding',
        label: '编码格式',
        type: 'select',
        defaultValue: 'utf8',
        options: ['utf8', 'ascii', 'base64'],
        required: false
      },
      { key: 'append', label: '追加模式', type: 'boolean', defaultValue: false, required: false }
    ],
    validateParams: (params) => {
      if (!params.filePath || typeof params.filePath !== 'string') {
        return { valid: false, error: '文件路径是必需的且必须是字符串' }
      }
      if (params.content === undefined) {
        return { valid: false, error: '文件内容是必需的' }
      }
      return { valid: true }
    }
  },

  DOWNLOAD_FILE: {
    type: 'DOWNLOAD_FILE',
    name: '下载文件',
    description: '从网页下载文件',
    icon: 'Download',
    category: ElementCategories.FILE,
    params: [
      { key: 'url', label: '文件URL', type: 'string', required: true, defaultValue: '' },
      { key: 'savePath', label: '保存路径', type: 'string', required: true, defaultValue: '' }
    ],
    validateParams: (params) => {
      if (!params.url || typeof params.url !== 'string') {
        return { valid: false, error: '文件URL是必需的且必须是字符串' }
      }
      if (!params.savePath || typeof params.savePath !== 'string') {
        return { valid: false, error: '保存路径是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  },

  UPLOAD_FILE: {
    type: 'UPLOAD_FILE',
    name: '上传文件',
    description: '上传文件到网页',
    icon: 'Upload',
    category: ElementCategories.FILE,
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
    validateParams: (params) => {
      if (!params.selector || typeof params.selector !== 'string') {
        return { valid: false, error: '上传元素选择器是必需的且必须是字符串' }
      }
      if (!params.filePath || typeof params.filePath !== 'string') {
        return { valid: false, error: '文件路径是必需的且必须是字符串' }
      }
      return { valid: true }
    }
  }
}

/**
 * 元件初始化管理器
 * 提供标准化的元件实例化、参数验证和初始化流程
 */
const ElementInitializer = {
  /**
   * 创建元件实例
   * @param {string} elementType - 元件类型
   * @param {Object} position - 元件在画布中的位置 {x, y}
   * @param {Object} customParams - 自定义参数值
   * @returns {Object} 初始化后的元件实例
   */
  createElementInstance: (elementType, position = { x: 0, y: 0 }, customParams = {}) => {
    // 检查元件类型是否存在
    const typeDef = ElementTypes[elementType]
    if (!typeDef) {
      throw new Error(`未知的元件类型: ${elementType}`)
    }

    // 生成唯一ID
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建参数默认值映射
    const paramDefaults = typeDef.params.reduce((acc, param) => {
      acc[param.key] = param.defaultValue
      return acc
    }, {})

    // 合并默认参数和自定义参数
    const paramValues = { ...paramDefaults, ...customParams }

    // 验证参数
    const validation = typeDef.validateParams(paramValues)
    if (!validation.valid) {
      throw new Error(`参数验证失败: ${validation.error}`)
    }

    // 创建元件实例
    return {
      id,
      type: elementType,
      name: typeDef.name,
      description: typeDef.description,
      icon: typeDef.icon,
      category: typeDef.category,
      position: { x: position.x || 0, y: position.y || 0 },
      params: typeDef.params,
      paramValues,
      selected: false,
      // 初始化时间戳
      createdAt: Date.now()
    }
  },

  /**
   * 获取所有元件类型
   * @returns {Object} 所有元件类型定义
   */
  getAllElementTypes: () => {
    return ElementTypes
  },

  /**
   * 根据分类获取元件类型
   * @param {string} category - 元件分类
   * @returns {Array} 该分类下的所有元件类型
   */
  getElementTypesByCategory: (category) => {
    return Object.values(ElementTypes).filter((element) => element.category === category)
  },

  /**
   * 获取元件类型定义
   * @param {string} elementType - 元件类型
   * @returns {Object|null} 元件类型定义或null
   */
  getElementTypeDefinition: (elementType) => {
    return ElementTypes[elementType] || null
  },

  /**
   * 验证元件参数
   * @param {string} elementType - 元件类型
   * @param {Object} params - 要验证的参数
   * @returns {Object} 验证结果 {valid: boolean, error?: string}
   */
  validateElementParams: (elementType, params) => {
    const typeDef = ElementTypes[elementType]
    if (!typeDef) {
      return { valid: false, error: `未知的元件类型: ${elementType}` }
    }

    return typeDef.validateParams(params)
  },

  /**
   * 获取元件参数默认值
   * @param {string} elementType - 元件类型
   * @returns {Object} 参数默认值映射
   */
  getDefaultParams: (elementType) => {
    const typeDef = ElementTypes[elementType]
    if (!typeDef || !typeDef.params) {
      return {}
    }

    return typeDef.params.reduce((acc, param) => {
      acc[param.key] = param.defaultValue
      return acc
    }, {})
  },

  /**
   * 创建工作流节点
   * 为Vue Flow编辑器创建标准化的节点对象
   * @param {string} elementType - 元件类型
   * @param {Object} options - 选项配置
   * @returns {Object} Vue Flow标准节点对象
   */
  createWorkflowNode: (elementType, options = {}) => {
    const typeDef = ElementTypes[elementType]
    if (!typeDef) {
      throw new Error(`未知的元件类型: ${elementType}`)
    }

    // 生成唯一ID或使用提供的ID
    const id = options.id || `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建参数默认值映射
    const paramDefaults = typeDef.params.reduce((acc, param) => {
      acc[param.key] = param.defaultValue
      return acc
    }, {})

    // 合并默认参数和自定义参数
    const paramValues = { ...paramDefaults, ...(options.initialParams || {}) }

    // 创建Vue Flow标准节点对象
    return {
      id,
      type: 'custom-node',
      data: {
        id,
        type: elementType,
        name: typeDef.name,
        description: typeDef.description,
        icon: typeDef.icon,
        category: typeDef.category,
        params: typeDef.params.map((param) => ({
          ...param,
          name: param.label // 保持向后兼容性
        })),
        paramValues,
        selected: false,
        createdAt: Date.now()
      },
      position: options.position || { x: 0, y: 0 },
      selected: false
    }
  },

  /**
   * 初始化元件类型系统
   * 确保所有元件类型都已正确加载
   */
  initializeElementTypeSystem: () => {
    // 注册所有元件类型
    console.log(`初始化元件类型系统，共加载 ${Object.keys(ElementTypes).length} 种元件类型`)

    // 按分类统计元件数量
    const categoryStats = {}
    Object.values(ElementTypes).forEach((element) => {
      if (!categoryStats[element.category]) {
        categoryStats[element.category] = 0
      }
      categoryStats[element.category]++
    })

    console.log('元件类型统计:', categoryStats)
  },

  /**
   * 执行元件操作
   * @param {string} elementType - 元件类型
   * @param {Object} context - 执行上下文，包含：
   *   - browserId: 浏览器实例ID
   *   - browserAutomation: 浏览器自动化API
   *   - addLog: 日志记录函数
   *   - getParamValue: 参数获取函数
   * @returns {Object} 执行结果
   */
  executeElement: async (elementType, context) => {
    const { browserId, browserAutomation, addLog, getParamValue } = context

    // 检查元件类型是否存在
    const typeDef = ElementTypes[elementType]
    if (!typeDef) {
      throw new Error(`未知的元件类型: ${elementType}`)
    }

    // 根据元件类型执行相应操作
    switch (elementType) {
      case 'BROWSER_OPEN': {
        let url = getParamValue('url', 'https://www.example.com')
        url = url || 'https://www.example.com'
        const browserType = getParamValue('browserType', 'chrome')
        const playwrightBrowserType = browserType === 'chrome' ? 'chromium' : browserType

        const headless = getParamValue('headless', false)
        const incognito = getParamValue('incognito', false)

        addLog(
          'info',
          `正在打开${browserType}浏览器：${url}，无头模式：${headless}，隐身模式：${incognito}`
        )

        const runResult = await browserAutomation.runNode({
          url: url,
          browserType: playwrightBrowserType,
          headless: headless,
          incognito: incognito,
          openMode: 'new',
          waitUntil: 'networkidle'
        })

        if (!runResult.success) {
          throw new Error('浏览器初始化失败: ' + runResult.error)
        }

        addLog('success', `浏览器已成功打开，当前URL：${url}`)
        return { success: true, browserId: runResult.browserId, url }
      }

      case 'BROWSER_CLOSE': {
        addLog('info', '正在关闭浏览器')
        if (browserId) {
          await browserAutomation.closeBrowser(browserId)
        }
        addLog('success', '浏览器已成功关闭')
        return { success: true }
      }

      case 'CLICK_ELEMENT': {
        const selector = getParamValue('selector', '')
        const waitForNavigation = getParamValue('waitForNavigation', true) !== false
        const clickCount = getParamValue('clickCount', 1)

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog(
          'info',
          `正在点击元素：${selector}${clickCount > 1 ? ` (${clickCount}次)` : ''}${waitForNavigation ? '（等待页面加载）' : ''}`
        )

        // 等待元素可见
        await browserAutomation.waitForElement({
          browserId,
          selector,
          timeout: 5000
        })

        // 点击元素
        await browserAutomation.clickElement({
          browserId,
          selector,
          waitForNavigation
        })

        addLog('success', `元素已成功点击：${selector}`)
        return { success: true }
      }

      case 'INPUT_TEXT': {
        const selector = getParamValue('selector', '')
        const text = getParamValue('text', '')
        const clearBefore = getParamValue('clearBefore', true) !== false

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog('info', `正在${clearBefore ? '清空并' : ''}输入文本到 ${selector}：${text}`)

        // 等待元素可见
        await browserAutomation.waitForElement({
          browserId,
          selector,
          timeout: 5000
        })

        // 输入文本
        await browserAutomation.inputText({ browserId, selector, text, clearBefore })

        addLog('success', `文本已成功输入到：${selector}`)
        return { success: true }
      }

      case 'EXTRACT_DATA': {
        const selector = getParamValue('selector', '')
        const extractType = getParamValue('extractType', 'text')
        const attributeName = getParamValue('attributeName', 'href')
        const variableName = getParamValue('variableName', 'extractedData')

        if (!selector) {
          throw new Error('选择器不能为空')
        }

        addLog('info', `正在从 ${selector} 提取 ${extractType} 数据到变量 ${variableName}`)

        // 等待元素可见
        await browserAutomation.waitForElement({
          browserId,
          selector,
          timeout: 5000
        })

        // 提取数据
        const result = await browserAutomation.extractData({
          browserId,
          selector,
          extractType,
          attribute: attributeName
        })

        addLog('success', `数据已成功提取到变量 ${variableName}`, {
          extractedValue: result.data
        })
        return { success: true, extractedData: result.data }
      }

      case 'WAIT': {
        const waitSeconds = getParamValue('seconds', 2)
        addLog('info', `等待 ${waitSeconds} 秒`)

        // 实际等待指定的时间
        await browserAutomation.wait({
          browserId,
          milliseconds: waitSeconds * 1000
        })

        addLog('success', `等待完成`)
        return { success: true }
      }

      case 'SAVE_FILE': {
        const filePath = getParamValue('filePath', 'output.txt')
        const format = getParamValue('format', 'txt')
        const data = getParamValue('data', '')

        // 调用文件保存API
        addLog('info', `保存文件：${filePath} (格式：${format})`)

        const result = await browserAutomation.saveFile({
          browserId,
          data,
          filePath,
          format
        })

        if (result.success) {
          addLog('success', `文件已成功保存到: ${result.filePath || filePath}`)
        } else {
          addLog('error', `保存文件失败: ${result.error || '未知错误'}`)
          throw new Error(result.error || '保存文件失败')
        }
        return { success: true, filePath: result.filePath || filePath }
      }

      default: {
        addLog('warn', `未实现的元件类型：${elementType}`)
        throw new Error(`未实现的元件类型：${elementType}`)
      }
    }
  }
}

/**
 * 元件类型系统初始化
 * 在应用启动时初始化所有元件类型
 */
const initializeElementTypeSystem = () => {
  // 注册所有元件类型
  console.log(`初始化元件类型系统，共加载 ${Object.keys(ElementTypes).length} 种元件类型`)

  // 按分类统计元件数量
  const categoryStats = {}
  Object.values(ElementTypes).forEach((element) => {
    if (!categoryStats[element.category]) {
      categoryStats[element.category] = 0
    }
    categoryStats[element.category]++
  })

  console.log('元件类型统计:', categoryStats)

  return {
    ElementTypes,
    ElementCategories,
    ElementInitializer
  }
}

// 导出初始化后的元件类型系统
export const {
  ElementTypes: Types,
  ElementCategories: Categories,
  ElementInitializer: Initializer
} = initializeElementTypeSystem()

export default ElementTypes
