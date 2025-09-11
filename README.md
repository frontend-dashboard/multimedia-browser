# multimedia-browser

## 项目概述

这是一个使用Electron和Vue.js构建的多媒体浏览器应用程序，旨在提供一个跨平台的媒体文件浏览和管理解决方案。

## 技术栈

- **主框架**：Electron v37.2.3
- **前端框架**：Vue.js v3.5.17
- **构建工具**：Vite v7.0.5 + electron-vite v4.0.0
- **打包工具**：electron-builder v25.1.8
- **代码质量**：ESLint v9.31.0 + Prettier v3.6.2

## 项目结构

项目采用典型的Electron应用架构，分为三个主要部分：

```
src/
├── main/       # 主进程 - 负责窗口创建和应用生命周期管理
├── preload/    # 预加载脚本 - 负责主进程和渲染进程间的安全通信
└── renderer/   # 渲染进程 - 基于Vue.js的前端应用界面
```

## Recommended IDE Setup

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
```

构建完成后，可执行文件将位于`dist`目录中。

## 核心功能

当前应用实现了以下功能：

1. 显示Electron、Chromium和Node.js版本信息
2. 提供基本的UI界面（包含logo、文本和操作按钮）
3. 支持IPC通信示例（通过Send IPC按钮）
4. 提供开发工具快捷方式（F12）

## 开发注意事项

1. **进程间通信**：使用IPC机制在主进程和渲染进程之间传递数据
2. **上下文隔离**：应用启用了上下文隔离，确保渲染进程的安全性
3. **预加载脚本**：所有需要从渲染进程访问的Node.js API都应在preload脚本中暴露

## 未来发展方向

作为一个多媒体浏览器应用，计划添加以下功能：

1. 文件系统访问功能，用于浏览本地媒体文件
2. 媒体播放器组件，支持播放图片、音频和视频
3. 媒体组织和分类功能
4. 搜索和过滤功能
5. 媒体预览和编辑功能

## License

MIT License
