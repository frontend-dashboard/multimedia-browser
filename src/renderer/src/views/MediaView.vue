<template>
  <div class="media-view">
    <el-card class="header-card mb-4" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Folder /></el-icon>
          <span class="header-title">{{ t('navigation.media') }}</span>
        </div>
      </template>
      <div class="current-path">
        <el-breadcrumb separator-class="el-icon-arrow-right">
          <el-breadcrumb-item :to="{ path: '/' }">{{ t('navigation.home') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ t('navigation.media') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{
            currentPath ? currentPath.split('/').pop() : t('media.noPathSelected')
          }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-button type="primary" :loading="loading" @click="openDirectory">
          <el-icon><FolderOpened /></el-icon>
          {{ t('media.selectDirectory') }}
        </el-button>
      </div>
    </el-card>
    <!-- 路径卡片 -->
    <el-card class="path-card mb-4" shadow="hover">
      <div class="controls">
        <el-input
          v-model="searchTerm"
          :placeholder="t('media.searchPlaceholder')"
          prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />

        <el-select
          v-model="selectedType"
          :placeholder="t('media.selectType')"
          class="filter-select"
          @change="handleTypeFilter"
        >
          <el-option :label="t('options.allTypes')" value="all" />
          <el-option :label="t('media.image')" value="images" />
          <el-option :label="t('media.video')" value="videos" />
          <el-option :label="t('media.audio')" value="audio" />
        </el-select>

        <div class="view-controls">
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            icon="Grid"
            circle
            :title="t('options.gridView')"
            @click="setViewMode('grid')"
          />
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            icon="List"
            circle
            :title="t('options.listView')"
            @click="setViewMode('list')"
          />
        </div>
      </div>
    </el-card>
    <!-- 媒体文件卡片 -->
    <el-card shadow="hover">
      <div v-loading="loading" :element-loading-text="t('media.loading')">
        <!-- 空状态提示 -->
        <el-empty
          v-if="filteredMediaFiles.length === 0 && !loading"
          :description="t('media.noFilesFound')"
          :image-size="100"
        >
          <div class="empty-hint">{{ t('media.selectMediaDirHint') }}</div>
        </el-empty>
        <!-- 媒体文件列表 -->
        <div v-else class="media-grid" :class="viewMode">
          <FilePreviewCard
            v-for="file in filteredMediaFiles"
            :key="file.path"
            :file="file"
            :is-selected="selectedFile && selectedFile.path === file.path"
            @click="selectFile"
          />
        </div>
      </div>
    </el-card>
    <!-- 文件详情抽屉 -->
    <el-drawer v-model="drawerVisible" :size="drawerSize" :before-close="handleClose">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ t('media.fileDetails') }}</span>
        </div>
      </template>
      <el-descriptions border :column="1" label-width="100px">
        <el-descriptions-item :label="t('media.fileName')">
          {{ selectedFile.name }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('media.fileSize')">
          {{ formatFileSize(selectedFile.size) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('media.fileType')">
          {{ getFileType(selectedFile.type) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('media.filePath')">
          {{ selectedFile.path }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('media.modifiedDate')">
          {{ formatDate(selectedFile.modifiedTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

// 导入新的文件预览组件
import FilePreviewCard from '../components/FilePreviewCard.vue'

defineOptions({
  name: 'MediaView'
})

const { t } = useI18n()
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
const drawerSize = ref('600px')
const drawerVisible = ref(false)

// 处理抽屉关闭
const handleClose = () => {
  drawerVisible.value = false
}

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
  drawerVisible.value = true
}

// 打开目录
const openDirectory = async () => {
  loading.value = true

  try {
    // 检查是否在Electron环境中运行
    if (window.api && typeof window.api.openDirectory === 'function') {
      // 在Electron环境中，调用主进程打开目录选择对话框
      const directoryPath = await window.api.openDirectory()

      // 如果用户取消选择，直接返回
      if (!directoryPath) {
        loading.value = false
        return
      }

      // 获取目录下的媒体文件
      const mediaFiles = await window.api.getFilesInDirectory(directoryPath)

      // 更新媒体库状态
      mediaStore.setCurrentPath(directoryPath)
      mediaStore.setMediaFiles(mediaFiles)
    } else {
      // 在浏览器环境中，显示一个提示
      ElMessage.info('此功能需要在Electron应用程序中运行才能访问本地文件系统。')
    }
  } catch (error) {
    console.error('打开目录失败:', error)
    // 显示错误提示
    ElMessage.error(t('media.openDirectoryError'))
  } finally {
    loading.value = false
  }
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
  if (type.startsWith('images')) return t('media.image')
  if (type.startsWith('videos')) return t('media.video')
  if (type.startsWith('audio')) return t('media.audio')
  return t('media.other')
}

// 格式化日期
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString()
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
  gap: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filter-select {
  max-width: 200px;
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
  min-height: 285px;
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
</style>
