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
      pageSize: 30, // 每页显示的文件数量
      hasMore: true // 是否还有更多文件可以加载
    }
  }),

  getters: {
    // 获取筛选后的媒体文件
    filteredMediaFiles: (state) => {
      let files = [...state.mediaFiles]

      // 类型筛选
      if (state.filter.type !== 'all') {
        files = files.filter((file) => file.type.startsWith(state.filter.type))
      }

      // 搜索筛选
      if (state.filter.search) {
        const searchLower = state.filter.search.toLowerCase()
        files = files.filter(
          (file) =>
            file.name.toLowerCase().includes(searchLower) ||
            file.path.toLowerCase().includes(searchLower)
        )
      }

      // 排序
      files.sort((a, b) => {
        let comparison = 0
        switch (state.settings.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'date':
            comparison = a.modifiedTime - b.modifiedTime
            break
          case 'size':
            comparison = a.size - b.size
            break
        }
        return state.settings.sortOrder === 'asc' ? comparison : -comparison
      })

      return files
    },

    // 获取当前页的媒体文件（用于分页渲染）
    paginatedMediaFiles: (state) => {
      // 直接内联实现筛选逻辑以避免依赖getters参数
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

      // 分页逻辑
      const { currentPage, pageSize } = state.pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize

      // 更新是否还有更多文件的状态
      state.pagination.hasMore = endIndex < files.length

      // 返回当前页的文件
      return files.slice(0, endIndex)
    }
  },

  actions: {
    // 设置媒体文件列表
    setMediaFiles(files) {
      this.mediaFiles = files
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

    // 加载下一页
    loadMore() {
      if (this.pagination.hasMore) {
        this.pagination.currentPage++
      }
    },

    // 重置分页
    resetPagination() {
      this.pagination.currentPage = 1
      this.pagination.hasMore = true
    },

    // 清除所有数据
    clearAll() {
      this.mediaFiles = []
      this.selectedFile = null
      this.currentPath = ''
      this.resetPagination()
    }
  }
})
