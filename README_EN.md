# multimedia-browser

## Project Overview

This is a modern multimedia browser application built with Electron and Vue.js, designed to provide a cross-platform solution for browsing and managing media files. The application supports file preview, theme switching, internationalization, and provides an intuitive user interface.

## Future Plans

- Add support for more media file types (such as videos, audio, images, etc.)
- Implement file search and filtering functionality
- Add batch operation features (such as batch deletion, batch renaming, etc.)
- Provide a plugin system to support user-defined feature extensions
- Optimize performance to support browsing and managing large files and directories
- Add file tagging functionality to support file categorization and marking
- Add file property editing functionality to support viewing and modifying file metadata
- Implement file preview functionality to support quick preview of common media formats
- Add file operation history to facilitate users undoing operations
- Add multi-window support to improve multitasking efficiency

## Technology Stack

- **Main Framework**: Electron v37.2.3
- **Frontend Framework**: Vue.js v3.5.17
- **State Management**: Pinia v3.0.3
- **Routing**: Vue Router v4.5.1
- **UI Component Library**: Element Plus v2.11.2
- **Build Tools**: Vite v7.0.5 + electron-vite v4.0.0
- **Packaging Tool**: electron-builder v25.1.8
- **Code Quality**: ESLint v9.31.0 + Prettier v3.6.2
- **Internationalization**: Vue I18n v11.1.12

## Project Structure

The project adopts a typical Electron application architecture, divided into three main parts: main process, preload script, and renderer process. The renderer process uses Vue.js single-page application architecture, including components, routing, state management, and other modules.

```
src/
├── main/       # Main process - responsible for window creation and application lifecycle management
│   └── index.js
├── preload/    # Preload script - responsible for secure communication between main process and renderer process
│   └── index.js
└── renderer/   # Renderer process - Vue.js-based frontend application interface
    ├── index.html
    └── src/
        ├── App.vue            # Application root component
        ├── assets/            # Static resource files
        ├── components/        # Reusable components
        ├── i18n/              # Internationalization configuration
        ├── main.js            # Application entry file
        ├── router/            # Routing configuration
        ├── store/             # Pinia state management
        │   ├── index.js
        │   └── modules/
        ├── utils/             # Utility functions
        └── views/             # Page components
            ├── HomeView.vue   # Home page
            ├── MediaView.vue  # Media browsing page
            └── SettingsView.vue # Settings page
```

## Development Environment

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install Dependencies

```bash
$ npm install
```

### Development Mode

```bash
$ npm run dev
```

In development mode, the application will start a development server and automatically open an application window. The development server supports hot reloading, and the interface will automatically update after code changes.

### Build Application

```bash
# Windows platform
$ npm run build:win

# macOS platform
$ npm run build:mac

# Linux platform
$ npm run build:linux

# Build for all platforms
$ npm run build

# Build without packaging
$ npm run build:unpack
```

After building, the executable files will be located in the `dist` directory.

### Code Quality Check

```bash
# Format code
$ npm run format

# Check code quality
$ npm run lint

# Automatically fix code issues
$ npm run fix
```

## Core Features

### 1. Media File Browsing

- Browse image, audio, and video files in the local file system
- Support different view modes (grid view, list view)
- Provide file sorting and filtering functionality
- Display detailed file information (name, size, type, etc.)

### 2. Theme System

The application supports three theme modes:
- **Light Theme**: Bright and refreshing interface style
- **Dark Theme**: Suitable for night use, reducing eye fatigue
- **System Theme**: Automatically follows the operating system's theme settings

Theme settings are saved in local storage, and the last selected theme will be automatically applied when the application starts next time.

### 3. Internationalization Support

The application supports multiple language switching, including:
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- English (en-US)

Language settings are also saved in local storage.

### 4. Settings Functionality

On the settings page, users can configure:
- Theme preferences
- Language selection
- Display options (such as showing file extensions, hidden files, etc.)
- Media view settings

### 5. IPC Communication

The application implements a secure communication mechanism between the main process and renderer process, allowing access to Node.js functionality in the renderer process through preloaded APIs.

### 6. Version Information Display

Display version information of Electron, Chromium, and Node.js currently used by the application.

## User Guide

### Start the Application

After installing dependencies, use the `npm run dev` command to start development mode, or use the built executable file to start the application.

### Browse Media Files

After starting the application, you can view and manage local media files on the media browsing page. Use the controls on the interface to switch view modes, sorting methods, and filtering criteria.

### Change Theme

On the settings page, select your preferred theme mode through the drop-down menu:
1. Click the "Settings" button in the navigation bar to enter the settings page
2. Find the "Theme" option in the "Interface Settings" section
3. Select "Light Theme", "Dark Theme", or "System Theme" from the drop-down menu
4. The theme will be applied immediately after selection

### Switch Language

On the settings page, switch the application language through the drop-down menu:
1. Find the "Language" option in the "Interface Settings" section
2. Select your preferred language from the drop-down menu
3. The language will switch immediately

### Development Tools

- Press F12 in the application window to open developer tools
- Supports hot reloading, the interface will automatically update after code changes

## Development Notes

1. **Inter-process Communication**: Use IPC mechanism to transfer data between main process and renderer process
2. **Context Isolation**: The application enables context isolation to ensure the security of the renderer process
3. **Preload Script**: All Node.js APIs that need to be accessed from the renderer process should be exposed in the preload script
4. **Theme Management**: Theme-related utility functions are uniformly stored in `utils/themeUtils.js` to avoid code duplication
5. **Internationalization**: Newly added text content needs to be translated in all language files
6. **Code Standards**: Follow the project's ESLint and Prettier configurations

## Theme Development Guide

The application's theme styles are mainly implemented through CSS variables, located in the `src/renderer/src/assets/` directory:

- `base.css`: Defines basic CSS variables and reset styles
- `main.css`: Defines main application styles and theme adaptation for Element Plus components

When adding new component styles, ensure that both light theme and dark theme style definitions are provided.

## Internationalization Development Guide

When adding new text content, corresponding translations need to be added to all language files in the `src/renderer/src/i18n/` directory:

- `zh-CN.js`: Simplified Chinese translation
- `zh-TW.js`: Traditional Chinese translation
- `en-US.js`: English translation

## Dependencies

### Core Dependencies

- [Electron](https://www.electronjs.org/) - Cross-platform desktop application framework
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Pinia](https://pinia.vuejs.org/) - Vue state management library
- [Vue Router](https://router.vuejs.org/) - Vue routing library
- [Element Plus](https://element-plus.org/) - Vue 3 UI component library
- [Vue I18n](https://vue-i18n.intlify.dev/) - Vue internationalization solution
- [Electron Updater](https://www.electron.build/auto-update.html) - Auto-update functionality

### Development Dependencies

- [Vite](https://vitejs.dev/) - Next generation frontend build tool
- [electron-vite](https://github.com/electron-vite/electron-vite) - Build tool designed specifically for Electron
- [electron-builder](https://www.electron.build/) - Package and distribute Electron applications
- [ESLint](https://eslint.org/) - JavaScript code quality tool
- [Prettier](https://prettier.io/) - Code formatting tool
- [@electron-toolkit](https://github.com/alex8088/electron-toolkit) - Electron development toolset

## Code Standards

The project follows the following code standards:

- Use 2-space indentation
- Use single quotes instead of double quotes
- Do not use semicolons
- Maximum line width is 100 characters
- Do not use trailing commas
- Use LF line endings
- Automatically insert a newline at the end of files
- Automatically trim trailing whitespace

These standards are defined through .editorconfig and .prettierrc.yaml files. It is recommended to use VSCode configured with corresponding plugins for development.

## Contribution Guide

We welcome and appreciate community contributions! If you are interested in participating in project development, please follow these steps:

1. Fork the project repository
2. Create your own feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push your changes to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Before submitting code, please ensure:

- The code complies with the project's coding standards
- No new ESLint errors are introduced
- Necessary documentation has been written for new features
- New features have been tested on major platforms

## Issue Reporting

If you encounter problems during use or have improvement suggestions, please submit them through the following methods:

1. Submit issues through [GitHub Issues](https://github.com/yourusername/multimedia-browser/issues)
2. Provide detailed issue descriptions, including:
   - Environment where the issue occurred (operating system, application version)
   - Detailed description of the issue
   - Reproduction steps
   - Expected and actual behavior
   - Relevant error logs or screenshots

We will handle your feedback as soon as possible.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Thank you to all developers and users who have contributed to this project!

Thanks for the support of the following open source projects:
- Electron
- Vue.js
- Element Plus
- Vite
