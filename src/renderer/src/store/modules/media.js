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
    }
  }),

  getters: {
    // 获取筛选后的媒体文件
    filteredMediaFiles: (state) => {
      let files = [...state.mediaFiles]
      
      // 类型筛选
      if (state.filter.type !== 'all') {
        files = files.filter(file => file.type.startsWith(state.filter.type))
      }
      
      // 搜索筛选
      if (state.filter.search) {
        const searchLower = state.filter.search.toLowerCase()
        files = files.filter(file => 
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
      this.mediaFiles = this.mediaFiles.filter(file => file.path !== filePath)
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
    
    // 清除所有数据
    clearAll() {
      this.mediaFiles = []
      this.selectedFile = null
      this.currentPath = ''
    }
  }
})