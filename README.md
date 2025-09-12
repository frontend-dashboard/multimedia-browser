# multimedia-browser

## 项目概述

这是一个使用 Electron 和 Vue.js 构建的现代化多媒体浏览器应用程序，旨在提供一个跨平台的媒体文件浏览和管理解决方案。应用支持文件预览、主题切换、国际化等功能，并提供了直观的用户界面。

## 技术栈

- **主框架**：Electron v37.2.3
- **前端框架**：Vue.js v3.5.17
- **状态管理**：Pinia v3.0.3
- **路由管理**：Vue Router v4.5.1
- **UI组件库**：Element Plus v2.11.2
- **构建工具**：Vite v7.0.5 + electron-vite v4.0.0
- **打包工具**：electron-builder v25.1.8
- **代码质量**：ESLint v9.31.0 + Prettier v3.6.2
- **国际化**：Vue I18n v11.1.12

## 项目结构

项目采用典型的Electron应用架构，分为三个主要部分：主进程、预加载脚本和渲染进程。渲染进程采用Vue.js单页应用架构，包含组件、路由、状态管理等模块。

```
src/
├── main/       # 主进程 - 负责窗口创建和应用生命周期管理
│   └── index.js
├── preload/    # 预加载脚本 - 负责主进程和渲染进程间的安全通信
│   └── index.js
└── renderer/   # 渲染进程 - 基于Vue.js的前端应用界面
    ├── index.html
    └── src/
        ├── App.vue            # 应用根组件
        ├── assets/            # 静态资源文件
        ├── components/        # 可复用组件
        ├── i18n/              # 国际化配置
        ├── main.js            # 应用入口文件
        ├── router/            # 路由配置
        ├── store/             # Pinia状态管理
        │   ├── index.js
        │   └── modules/
        ├── utils/             # 工具函数
        └── views/             # 页面组件
            ├── HomeView.vue   # 首页
            ├── MediaView.vue  # 媒体浏览页面
            └── SettingsView.vue # 设置页面
```

## 开发环境

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## 项目设置

### 安装依赖

```bash
$ npm install
```

### 开发模式

```bash
$ npm run dev
```

开发模式下，应用会启动开发服务器并自动打开应用窗口。开发服务器支持热重载，修改代码后会自动更新界面。

### 构建应用

```bash
# Windows平台
$ npm run build:win

# macOS平台
$ npm run build:mac

# Linux平台
$ npm run build:linux

# 构建所有平台
$ npm run build

# 构建但不打包
$ npm run build:unpack
```

构建完成后，可执行文件将位于`dist`目录中。

### 代码质量检查

```bash
# 格式化代码
$ npm run format

# 检查代码质量
$ npm run lint

# 自动修复代码问题
$ npm run fix
```

## 核心功能

### 1. 媒体文件浏览

- 浏览本地文件系统中的图片、音频和视频文件
- 支持不同视图模式（网格视图、列表视图）
- 提供文件排序和过滤功能
- 显示文件详细信息（名称、大小、类型等）

### 2. 主题系统

应用支持三种主题模式：
- **浅色主题**：明亮、清爽的界面风格
- **深色主题**：适合夜间使用，减少眼部疲劳
- **系统主题**：自动跟随操作系统的主题设置

主题设置会保存在本地存储中，下次启动应用时会自动应用上次选择的主题。

### 3. 国际化支持

应用支持多语言切换，包括：
- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- 英文 (en-US)

语言设置同样保存在本地存储中。

### 4. 设置功能

在设置页面，用户可以配置：
- 主题偏好
- 语言选择
- 显示选项（如是否显示文件扩展名、隐藏文件等）
- 媒体视图设置

### 5. IPC通信

应用实现了主进程和渲染进程之间的安全通信机制，可以在渲染进程中通过预加载的API访问Node.js功能。

### 6. 版本信息显示

显示当前应用使用的Electron、Chromium和Node.js版本信息。

## 未来计划

- 增加更多的媒体文件类型支持（如视频、音频、图片等）
- 实现文件搜索和过滤功能
- 增加批量操作功能（如批量删除、批量重命名等）
- 提供插件系统，支持用户自定义功能扩展
- 优化性能，支持大文件和大目录的浏览和管理
- 增加文件标签功能，支持文件分类和标记
- 增加文件属性编辑功能，支持文件元数据的查看和修改
- 实现文件预览功能，支持常见媒体格式的快速预览
- 添加文件操作历史记录，方便用户撤销操作
- 增加多窗口支持，提高多任务处理效率

## 使用指南

### 启动应用

安装依赖后，使用`npm run dev`命令启动开发模式，或使用构建后的可执行文件启动应用。

### 浏览媒体文件

应用启动后，在媒体浏览页面可以查看和管理本地媒体文件。使用界面上的控件可以切换视图模式、排序方式和过滤条件。

### 更改主题

在设置页面，通过下拉菜单选择喜欢的主题模式：
1. 点击导航栏中的"设置"按钮进入设置页面
2. 在"界面设置"部分找到"主题"选项
3. 从下拉菜单中选择"浅色主题"、"深色主题"或"系统主题"
4. 选择后主题会立即应用

### 切换语言

在设置页面，通过下拉菜单切换应用语言：
1. 在"界面设置"部分找到"语言"选项
2. 从下拉菜单中选择偏好的语言
3. 语言会立即切换

### 开发工具

- 在应用窗口中按F12键可以打开开发者工具
- 支持热重载，修改代码后界面会自动更新

## 开发注意事项

1. **进程间通信**：使用IPC机制在主进程和渲染进程之间传递数据
2. **上下文隔离**：应用启用了上下文隔离，确保渲染进程的安全性
3. **预加载脚本**：所有需要从渲染进程访问的Node.js API都应在preload脚本中暴露
4. **主题管理**：主题相关的工具函数统一存放在`utils/themeUtils.js`中，避免代码重复
5. **国际化**：新添加的文本内容需要在所有语言文件中进行翻译
6. **代码规范**：遵循项目的ESLint和Prettier配置

## 主题开发指南

应用的主题样式主要通过CSS变量实现，位于`src/renderer/src/assets/`目录下：

- `base.css`：定义基础的CSS变量和重置样式
- `main.css`：定义主要的应用样式和Element Plus组件的主题适配

添加新的组件样式时，需要确保同时提供浅色主题和深色主题的样式定义。

## 国际化开发指南

添加新的文本内容时，需要在`src/renderer/src/i18n/`目录下的所有语言文件中添加对应的翻译：

- `zh-CN.js`：简体中文翻译
- `zh-TW.js`：繁体中文翻译
- `en-US.js`：英文翻译

## 依赖

### 核心依赖

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Pinia](https://pinia.vuejs.org/) - Vue状态管理库
- [Vue Router](https://router.vuejs.org/) - Vue路由管理库
- [Element Plus](https://element-plus.org/) - Vue 3 UI组件库
- [Vue I18n](https://vue-i18n.intlify.dev/) - Vue国际化解决方案
- [Electron Updater](https://www.electron.build/auto-update.html) - 自动更新功能

### 开发依赖

- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [electron-vite](https://github.com/electron-vite/electron-vite) - 专为Electron设计的构建工具
- [electron-builder](https://www.electron.build/) - 打包和分发Electron应用
- [ESLint](https://eslint.org/) - JavaScript代码质量工具
- [Prettier](https://prettier.io/) - 代码格式化工具
- [@electron-toolkit](https://github.com/alex8088/electron-toolkit) - Electron开发工具集

## 代码规范

项目遵循以下代码规范：

- 使用2空格缩进
- 使用单引号代替双引号
- 不使用分号
- 最大行宽为100字符
- 不使用尾部逗号
- 使用LF行尾符
- 自动插入文件末尾的换行符
- 自动修剪行尾空白

这些规范通过.editorconfig和.prettierrc.yaml文件定义，建议使用配置了相应插件的VSCode进行开发。

## 贡献指南

我们欢迎并感谢社区贡献！如果你有兴趣参与项目开发，请遵循以下步骤：

1. Fork项目仓库
2. 创建你自己的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 将你的更改推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

在提交代码前，请确保：

- 代码符合项目的编码规范
- 没有引入新的Eslint错误
- 对新增功能编写了必要的文档
- 新功能在主要平台上进行了测试

## 问题反馈

如果在使用过程中遇到问题或有改进建议，请通过以下方式提交：

1. 通过 [GitHub Issues](https://github.com/yourusername/multimedia-browser/issues) 提交问题
2. 提供详细的问题描述，包括：
   - 问题发生的环境（操作系统、应用版本）
   - 问题的详细描述
   - 复现步骤
   - 预期行为和实际行为
   - 相关的错误日志或截图

我们会尽快处理您的反馈。

## 协议

该项目使用MIT许可证。详见[LICENSE](LICENSE)文件。

## 致谢

感谢所有为该项目做出贡献的开发者和用户！

感谢以下开源项目的支持：
- Electron
- Vue.js
- Element Plus
- Vite
