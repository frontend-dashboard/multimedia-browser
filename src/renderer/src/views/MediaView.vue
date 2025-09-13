<template>
  <div class="media-view">
    <el-card class="header-card mb-4" shadow="never">
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

    <el-card class="path-card mb-4" shadow="never">
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

    <el-card shadow="never">
      <div
        v-loading="loading"
        :element-loading-text="t('media.loading')"
        element-loading-spinner="el-icon-loading"
      >
        <el-empty
          v-if="filteredMediaFiles.length === 0 && !loading"
          :description="t('media.noFilesFound')"
          :image-size="100"
        >
          <div class="empty-hint">{{ t('media.selectMediaDirHint') }}</div>
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
                @error="handleImageError($event, file)"
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
          <span>{{ t('media.fileDetails') }}</span>
        </div>
      </template>
      <el-descriptions border :column="{ xs: 1, sm: 2 }">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

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

// 处理图片加载错误
const handleImageError = (error, file) => {
  console.error('图片加载失败事件:', error)
  console.error('图片路径:', getPreviewUrl(file))
  console.error('原始文件路径:', file.path)
  console.error('文件类型:', file.type)

  // 在控制台中显示更详细的错误信息
  if (error.target && error.target.src) {
    console.error('实际请求的URL:', error.target.src)
    console.error('是否以file://开头:', error.target.src.startsWith('file://'))
  }
}

// 获取预览URL（使用自定义的media-file协议）
const getPreviewUrl = (file) => {
  try {
    // 使用我们自定义的'media-file'协议来加载文件
    // 这可以避免一些安全限制，同时也能更可靠地加载本地文件

    // 将反斜杠替换为正斜杠，确保路径格式一致
    let normalizedPath = file.path.replace(/\\/g, '/')

    // 对路径进行URL编码，确保特殊字符不会导致问题
    const encodedPath = encodeURIComponent(normalizedPath)

    // 使用我们自定义的协议
    const previewUrl = 'media-file://' + encodedPath

    return previewUrl
  } catch (error) {
    console.error('生成预览URL时出错:', error)
    // 作为最后的后备方案，使用简单的file://协议
    return 'file://' + file.path
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
