import { defineStore } from 'pinia'

export const useMediaStore = defineStore('media', {
  state: () => ({
    // 媒体文件列表
    mediaFiles: [],
    // 当前选中的媒体文件
    selectedFile: null,
    // 当前目录路径
    currentPath: '',
    // 媒体文件筛选器
    filter: {
      type: 'all', // 'all', 'images', 'videos', 'audio'
      search: ''
    },
    // 媒体库设置
    settings: {
      viewMode: 'grid', // 'grid', 'list'
      sortBy: 'name', // 'name', 'date', 'size'
      sortOrder: 'asc' // 'asc', 'desc'
    },
    // 分页相关状态
    pagination: {
      currentPage: 1, // 当前页码
      pageSize: 40, // 每页显示的文件数量 (增加每页数量，减少加载次数)
      hasMore: true, // 是否还有更多文件可以加载
      isLoading: false, // 是否正在加载中，避免重复加载
      preloadPages: 3 // 预加载的页数，提前加载更多内容减少用户等待
    },
    // 已加载的媒体文件缓存，用于优化分页性能
    loadedMediaFiles: []
  }),

  getters: {
    // 获取筛选后的媒体文件
    filteredMediaFiles: (state) => {
      let files = [...state.mediaFiles]

      // 类型筛选
      if (state.filter.type !== 'all') {
        files = files.filter((file) => file.type && file.type.startsWith(state.filter.type))
      }

      // 搜索筛选
      if (state.filter.search) {
        const searchLower = state.filter.search.toLowerCase()
        files = files.filter(
          (file) =>
            (file.name && file.name.toLowerCase().includes(searchLower)) ||
            (file.path && file.path.toLowerCase().includes(searchLower))
        )
      }

      // 排序
      files.sort((a, b) => {
        let comparison = 0
        switch (state.settings.sortBy) {
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '')
            break
          case 'date':
            comparison = (a.modifiedTime || 0) - (b.modifiedTime || 0)
            break
          case 'size':
            comparison = (a.size || 0) - (b.size || 0)
            break
        }
        return state.settings.sortOrder === 'asc' ? comparison : -comparison
      })

      return files
    },

    // 获取当前页的媒体文件（用于分页渲染）
    paginatedMediaFiles: (state) => {
      // 实现前端分页逻辑
      const { currentPage, pageSize } = state.pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize

      // 从已预加载的所有文件中截取当前页的数据
      return state.loadedMediaFiles.slice(startIndex, endIndex)
    }
  },

  actions: {
    // 设置媒体文件列表
    setMediaFiles(files) {
      this.mediaFiles = files
      // 初始化已加载的文件
      this.initLoadedFiles()
    },

    // 添加单个媒体文件
    addMediaFile(file) {
      this.mediaFiles.push(file)
    },

    // 移除媒体文件
    removeMediaFile(filePath) {
      this.mediaFiles = this.mediaFiles.filter((file) => file.path !== filePath)
    },

    // 设置当前选中的文件
    setSelectedFile(file) {
      this.selectedFile = file
    },

    // 设置当前目录路径
    setCurrentPath(path) {
      this.currentPath = path
    },

    // 更新筛选条件
    updateFilter(filter) {
      this.filter = { ...this.filter, ...filter }
    },

    // 更新设置
    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
    },

    // 加载下一页或多页，支持无感预加载
    async loadMore(pagesToLoad = null) {
      // 如果正在加载或没有更多数据，则不执行加载
      if (this.pagination.isLoading || !this.pagination.hasMore) {
        return Promise.resolve()
      }

      try {
        // 设置加载状态
        this.pagination.isLoading = true

        // 获取筛选后的所有文件
        const filteredFiles = this.filteredMediaFiles

        // 获取分页配置
        const { currentPage, pageSize, preloadPages } = this.pagination
        // 如果没有指定加载页数，则使用预加载配置的页数
        const pagesToLoadValue = pagesToLoad || Math.min(preloadPages, 5) // 最多预加载5页避免过度消耗资源

        // 计算加载范围
        const endPage = currentPage + pagesToLoadValue
        const startIndex = currentPage * pageSize
        const endIndex = endPage * pageSize

        // 更新分页状态
        this.pagination.currentPage = endPage
        this.pagination.hasMore = endIndex < filteredFiles.length

        // 只加载新增的页面内容并添加到已加载文件中
        const newPageFiles = filteredFiles.slice(startIndex, endIndex)

        // 优化性能：如果文件数量较少，可以立即添加，避免不必要的等待
        if (newPageFiles.length < pageSize * 2) {
          this.loadedMediaFiles = [...this.loadedMediaFiles, ...newPageFiles]
        } else {
          // 对于大量数据，使用微任务延迟添加，避免阻塞UI
          await new Promise((resolve) => setTimeout(resolve, 50))
          this.loadedMediaFiles = [...this.loadedMediaFiles, ...newPageFiles]
        }

        return Promise.resolve()
      } catch (error) {
        console.error('加载更多文件失败:', error)
        return Promise.reject(error)
      } finally {
        // 无论成功失败，都要重置加载状态
        this.pagination.isLoading = false
      }
    },

    // 重置分页
    resetPagination() {
      this.pagination.currentPage = 1
      this.pagination.hasMore = true
      this.pagination.isLoading = false
      this.loadedMediaFiles = []
    },

    // 清除所有数据
    clearAll() {
      this.mediaFiles = []
      this.selectedFile = null
      this.currentPath = ''
      this.resetPagination()
    },

    // 初始化已加载文件（预加载所有文件）
    initLoadedFiles() {
      const filteredFiles = this.filteredMediaFiles

      // 预加载所有文件
      this.loadedMediaFiles = filteredFiles

      // 更新分页状态
      this.pagination.hasMore = false // 已经加载了所有文件
      this.pagination.currentPage = 1 // 重置到第一页

      // 确保加载状态被正确重置
      this.pagination.isLoading = false
    }
  }
})
