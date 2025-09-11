<template>
  <div class="media-view">
    <div class="header">
      <h1>媒体浏览</h1>

      <div class="controls">
        <div class="search-bar">
          <input type="text" placeholder="搜索文件..." v-model="searchTerm" @input="handleSearch" />
        </div>

        <div class="filter-controls">
          <select v-model="selectedType" @change="handleTypeFilter">
            <option value="all">所有类型</option>
            <option value="images">图片</option>
            <option value="videos">视频</option>
            <option value="audio">音频</option>
          </select>
        </div>

        <div class="view-controls">
          <button
            :class="{ active: viewMode === 'grid' }"
            @click="setViewMode('grid')"
            title="网格视图"
          >
            🗂️
          </button>
          <button
            :class="{ active: viewMode === 'list' }"
            @click="setViewMode('list')"
            title="列表视图"
          >
            📋
          </button>
        </div>
      </div>
    </div>

    <div class="current-path">
      <p>当前路径: {{ currentPath || '未选择路径' }}</p>
      <button class="btn" @click="openDirectory">选择目录</button>
    </div>

    <div class="media-grid" :class="viewMode">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredMediaFiles.length === 0" class="empty-state">
        <p>没有找到媒体文件</p>
        <p>请选择包含媒体文件的目录</p>
      </div>
      <div v-else>
        <div
          v-for="file in filteredMediaFiles"
          :key="file.path"
          class="media-item"
          :class="{ selected: selectedFile?.path === file.path }"
          @click="selectFile(file)"
        >
          <div class="media-preview">
            <!-- 根据文件类型显示不同的预览图标 -->
            <img
              v-if="file.type.startsWith('images')"
              :src="getPreviewUrl(file)"
              alt="{{ file.name }}"
              class="preview-image"
              loading="lazy"
            />
            <div v-else-if="file.type.startsWith('videos')" class="preview-icon">🎬</div>
            <div v-else-if="file.type.startsWith('audio')" class="preview-icon">🎵</div>
            <div v-else class="preview-icon">📄</div>
          </div>
          <div class="media-info">
            <p class="file-name">{{ file.name }}</p>
            <p class="file-size">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中文件的详细信息 -->
    <div v-if="selectedFile" class="file-details">
      <h3>文件详情</h3>
      <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
      <p><strong>大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
      <p><strong>类型:</strong> {{ getFileType(selectedFile.type) }}</p>
      <p><strong>路径:</strong> {{ selectedFile.path }}</p>
      <p><strong>修改日期:</strong> {{ formatDate(selectedFile.modifiedTime) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'

const mediaStore = useMediaStore()

// 组件状态
const searchTerm = ref('')
const selectedType = ref('all')
const viewMode = ref('grid')
const loading = ref(false)

// 计算属性 - 从store获取数据
const mediaFiles = computed(() => mediaStore.mediaFiles)
const selectedFile = computed(() => mediaStore.selectedFile)
const currentPath = computed(() => mediaStore.currentPath)
const filteredMediaFiles = computed(() => mediaStore.filteredMediaFiles)

// 处理搜索
const handleSearch = () => {
  mediaStore.updateFilter({ search: searchTerm.value })
}

// 处理类型筛选
const handleTypeFilter = () => {
  mediaStore.updateFilter({ type: selectedType.value })
}

// 设置视图模式
const setViewMode = (mode) => {
  viewMode.value = mode
  mediaStore.updateSettings({ viewMode: mode })
}

// 选择文件
const selectFile = (file) => {
  mediaStore.setSelectedFile(file)
}

// 打开目录 - 这只是一个模拟，实际应用中需要使用Electron的对话框API
const openDirectory = () => {
  loading.value = true

  // 模拟加载媒体文件
  setTimeout(() => {
    // 模拟媒体文件数据
    const mockMediaFiles = [
      {
        name: 'example1.jpg',
        path: '/path/to/example1.jpg',
        size: 2048000, // 2MB
        type: 'images/jpeg',
        modifiedTime: Date.now() - 86400000 // 1天前
      },
      {
        name: 'example2.png',
        path: '/path/to/example2.png',
        size: 1536000, // 1.5MB
        type: 'images/png',
        modifiedTime: Date.now() - 172800000 // 2天前
      },
      {
        name: 'audio.mp3',
        path: '/path/to/audio.mp3',
        size: 5242880, // 5MB
        type: 'audio/mpeg',
        modifiedTime: Date.now() - 259200000 // 3天前
      },
      {
        name: 'video.mp4',
        path: '/path/to/video.mp4',
        size: 20971520, // 20MB
        type: 'videos/mp4',
        modifiedTime: Date.now() - 345600000 // 4天前
      }
    ]

    mediaStore.setCurrentPath('/path/to/media')
    mediaStore.setMediaFiles(mockMediaFiles)
    loading.value = false
  }, 1000)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件类型
const getFileType = (type) => {
  if (type.startsWith('images')) return '图片'
  if (type.startsWith('videos')) return '视频'
  if (type.startsWith('audio')) return '音频'
  return '其他'
}

// 格式化日期
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString()
}

// 获取预览URL（模拟）
const getPreviewUrl = (file) => {
  // 在实际应用中，这里应该返回实际文件的URL
  // 对于Electron应用，可以使用file://协议或data URL
  return 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000)
}

// 组件挂载时从store加载设置
onMounted(() => {
  viewMode.value = mediaStore.settings.viewMode
  selectedType.value = mediaStore.filter.type
  searchTerm.value = mediaStore.filter.search
})
</script>

<style scoped>
.media-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: var(--color-text);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.search-bar input {
  padding: 10px 15px;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 5px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-size: 14px;
  min-width: 250px;
}

.filter-controls select {
  padding: 10px 15px;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 5px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-size: 14px;
}

.view-controls {
  display: flex;
  gap: 5px;
}

.view-controls button {
  padding: 10px 15px;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 5px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
}

.view-controls button:hover,
.view-controls button.active {
  background-color: var(--ev-button-alt-hover-bg);
}

.current-path {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: var(--color-background-soft);
  border-radius: 5px;
}

.current-path p {
  color: var(--color-text-2);
  margin: 0;
}

.btn {
  padding: 8px 16px;
  background-color: var(--ev-button-alt-bg);
  color: var(--ev-button-alt-text);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: var(--ev-button-alt-hover-bg);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.media-grid.list {
  grid-template-columns: 1fr;
}

.loading,
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-2);
}

.media-item {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.media-item.selected {
  border-color: #6988e6;
  background-color: rgba(105, 136, 230, 0.1);
}

.media-preview {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background-color: var(--color-background-mute);
  border-radius: 5px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon {
  font-size: 3rem;
}

.media-info {
  text-align: center;
}

.file-name {
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 5px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.9rem;
  color: var(--color-text-2);
  margin: 0;
}

.file-details {
  background-color: var(--color-background-soft);
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
}

.file-details h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: var(--color-text);
}

.file-details p {
  margin: 8px 0;
  color: var(--color-text-2);
}

.file-details strong {
  color: var(--color-text);
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar input {
    min-width: auto;
  }

  .current-path {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
