<template>
  <div class="media-view">
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Folder /></el-icon>
          <span class="header-title">媒体浏览</span>
        </div>
      </template>

      <div class="controls">
        <el-input
          v-model="searchTerm"
          placeholder="搜索文件..."
          prefix-icon="Search"
          @input="handleSearch"
          class="search-input"
        />

        <el-select
          v-model="selectedType"
          @change="handleTypeFilter"
          placeholder="选择类型"
          class="filter-select"
        >
          <el-option label="所有类型" value="all" />
          <el-option label="图片" value="images" />
          <el-option label="视频" value="videos" />
          <el-option label="音频" value="audio" />
        </el-select>

        <div class="view-controls">
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            icon="Grid"
            @click="setViewMode('grid')"
            circle
            title="网格视图"
          />
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            icon="List"
            @click="setViewMode('list')"
            circle
            title="列表视图"
          />
        </div>
      </div>
    </el-card>

    <el-card class="path-card mb-4" shadow="never">
      <div class="current-path">
        <el-breadcrumb separator-class="el-icon-arrow-right">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>媒体浏览</el-breadcrumb-item>
          <el-breadcrumb-item>{{
            currentPath ? currentPath.split('/').pop() : '未选择路径'
          }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-button type="primary" @click="openDirectory" :loading="loading">
          <el-icon><FolderOpened /></el-icon>
          选择目录
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <div
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-spinner="el-icon-loading"
      >
        <el-empty
          v-if="filteredMediaFiles.length === 0 && !loading"
          description="没有找到媒体文件"
          :image-size="100"
        >
          <div class="empty-hint">请选择包含媒体文件的目录</div>
        </el-empty>

        <div v-else class="media-grid" :class="viewMode">
          <el-card
            v-for="file in filteredMediaFiles"
            :key="file.path"
            :class="['media-item', { selected: selectedFile && selectedFile.path === file.path }]"
            shadow="hover"
            :body-style="{ padding: '15px', cursor: 'pointer' }"
            @click="selectFile(file)"
          >
            <div class="media-preview">
              <!-- 根据文件类型显示不同的预览图标 -->
              <el-image
                v-if="file.type.startsWith('images')"
                :src="getPreviewUrl(file)"
                :alt="file.name"
                class="preview-image"
                fit="cover"
                lazy
              >
                <template #error>
                  <div class="preview-icon">
                    <el-icon size="40"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else-if="file.type.startsWith('videos')" class="preview-icon">
                <el-icon size="40"><VideoCamera /></el-icon>
              </div>
              <div v-else-if="file.type.startsWith('audio')" class="preview-icon">
                <el-icon size="40"><Mic /></el-icon>
              </div>
              <div v-else class="preview-icon">
                <el-icon size="40"><Document /></el-icon>
              </div>
            </div>
            <div class="media-info">
              <p class="file-name">{{ file.name }}</p>
              <p class="file-size">{{ formatFileSize(file.size) }}</p>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 选中文件的详细信息 -->
    <el-card v-if="selectedFile" shadow="never" class="mt-4">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>文件详情</span>
        </div>
      </template>
      <el-descriptions border :column="{ xs: 1, sm: 2 }">
        <el-descriptions-item label="文件名">{{ selectedFile.name }}</el-descriptions-item>
        <el-descriptions-item label="大小">{{
          formatFileSize(selectedFile.size)
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{
          getFileType(selectedFile.type)
        }}</el-descriptions-item>
        <el-descriptions-item label="路径">{{ selectedFile.path }}</el-descriptions-item>
        <el-descriptions-item label="修改日期">{{
          formatDate(selectedFile.modifiedTime)
        }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'
// Icons are globally registered in main.js, no need to import here

const mediaStore = useMediaStore()

// 组件状态
const searchTerm = ref('')
const selectedType = ref('all')
const viewMode = ref('grid')
const loading = ref(false)

// 计算属性 - 从store获取数据
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
  if (file.type.startsWith('images')) {
    return file.path
  } else if (file.type.startsWith('videos')) {
    return file.path
  } else if (file.type.startsWith('audio')) {
    return file.path
  } else {
    return 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000)
  }
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

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  margin-top: 15px;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filter-select {
  min-width: 150px;
}

.view-controls {
  display: flex;
  gap: 5px;
}

.current-path {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.media-grid {
  min-height: 350px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.media-grid.list {
  grid-template-columns: 1fr;
}

.media-item {
  transition: all 0.3s ease;
}

.media-item:hover {
  transform: translateY(-2px);
}

.media-item.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

.media-preview {
  width: 100%;
  height: 160px;
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
}

.preview-icon {
  height: 100%;
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
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

.empty-hint {
  margin-top: 10px;
  color: var(--color-text-2);
  font-size: 0.9rem;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .current-path {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .card-header {
    font-size: 1.2rem;
  }

  .header-title {
    font-size: 1.2rem;
  }
}
</style>
