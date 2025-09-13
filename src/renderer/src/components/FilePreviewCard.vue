<template>
  <el-card
    :class="['file-preview-card', { selected: isSelected }]"
    shadow="hover"
    :body-style="{ padding: '0px', cursor: 'pointer' }"
    @click="handleClick"
  >
    <div class="preview-container">
      <!-- 图片预览 -->
      <el-image
        v-if="file.type.startsWith('images')"
        :src="previewUrl"
        :alt="file.name"
        class="preview-image"
        fit="cover"
        lazy
        @error="handleImageError"
      >
        <template #error>
          <div class="preview-icon">
            <el-icon size="40"><Picture /></el-icon>
          </div>
        </template>
      </el-image>

      <!-- 视频预览 -->
      <div v-else-if="file.type.startsWith('videos')" class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><VideoCamera /></el-icon>
        </div>
        <div class="file-type-badge">视频</div>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="file.type.startsWith('audio')" class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><Mic /></el-icon>
        </div>
        <div class="file-type-badge">音频</div>
      </div>

      <!-- PDF预览 -->
      <div v-else-if="isPDFFile" class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><Document /></el-icon>
        </div>
        <div class="file-type-badge">PDF</div>
      </div>

      <!-- PPT/PPTX预览 -->
      <div v-else-if="isPresentationFile" class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><Document /></el-icon>
        </div>
        <div class="file-type-badge">演示</div>
      </div>

      <!-- Excel预览 -->
      <div v-else-if="isSpreadsheetFile" class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><Document /></el-icon>
        </div>
        <div class="file-type-badge">表格</div>
      </div>

      <!-- 其他文件类型 -->
      <div v-else class="preview-icon-container">
        <div class="preview-icon">
          <el-icon size="40"><Document /></el-icon>
        </div>
        <div class="file-type-badge">文件</div>
      </div>
    </div>

    <div class="file-info">
      <p class="file-name" :title="file.name">{{ truncatedFileName }}</p>
      <p class="file-meta">{{ formatFileSize(file.size) }}</p>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click'])

// 计算属性
const previewUrl = computed(() => {
  try {
    // 使用我们自定义的'media-file'协议来加载文件
    // 这可以避免一些安全限制，同时也能更可靠地加载本地文件

    // 将反斜杠替换为正斜杠，确保路径格式一致
    let normalizedPath = props.file.path.replace(/\\/g, '/')

    // 对路径进行URL编码，确保特殊字符不会导致问题
    const encodedPath = encodeURIComponent(normalizedPath)

    // 使用我们自定义的协议
    const previewUrl = 'media-file://' + encodedPath

    return previewUrl
  } catch (error) {
    console.error('生成预览URL时出错:', error)
    // 作为最后的后备方案，使用简单的file://协议
    return 'file://' + props.file.path
  }
})

// 判断是否为PDF文件
const isPDFFile = computed(() => {
  return props.file.name.toLowerCase().endsWith('.pdf')
})

// 判断是否为演示文稿文件
const isPresentationFile = computed(() => {
  const extensions = ['.ppt', '.pptx']
  const lowerName = props.file.name.toLowerCase()
  return extensions.some((ext) => lowerName.endsWith(ext))
})

// 判断是否为电子表格文件
const isSpreadsheetFile = computed(() => {
  const extensions = ['.xls', '.xlsx', '.csv']
  const lowerName = props.file.name.toLowerCase()
  return extensions.some((ext) => lowerName.endsWith(ext))
})

// 截取文件名，太长时显示省略号
const truncatedFileName = computed(() => {
  const maxLength = 15
  const name = props.file.name
  if (name.length <= maxLength) {
    return name
  }
  // 保留扩展名
  const lastDotIndex = name.lastIndexOf('.')
  if (lastDotIndex > -1) {
    const extension = name.substring(lastDotIndex)
    const baseName = name.substring(0, lastDotIndex)
    if (baseName.length <= maxLength) {
      return name
    }
    return baseName.substring(0, maxLength - extension.length - 3) + '...' + extension
  }
  return name.substring(0, maxLength) + '...'
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理图片加载错误
const handleImageError = (error) => {
  console.error('图片加载失败事件:', error)
  console.error('图片路径:', previewUrl.value)
  console.error('原始文件路径:', props.file.path)
  console.error('文件类型:', props.file.type)
}

// 处理点击事件
const handleClick = () => {
  emit('click', props.file)
}
</script>

<style scoped>
.file-preview-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;
}

.file-preview-card.selected {
  border-color: #6988e6 !important;
  box-shadow: 0 0 8px rgba(105, 136, 230, 0.3);
}

.preview-container {
  position: relative;
  width: 100%;
  height: 160px;
  background-color: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
}

.file-type-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.file-info {
  padding: 12px;
  text-align: center;
  background-color: var(--color-background);
}

.file-name {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: var(--color-text);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  margin: 0;
  color: var(--color-text-2);
  font-size: 12px;
}

/* 在网格视图中调整样式 */
:deep(.media-grid.grid) .file-preview-card {
  margin-bottom: 16px;
}

/* 在列表视图中调整样式 */
:deep(.media-grid.list) .file-preview-card {
  flex-direction: row;
  margin-bottom: 8px;
}

:deep(.media-grid.list) .preview-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

:deep(.media-grid.list) .file-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  padding: 8px 12px;
}

:deep(.media-grid.list) .preview-icon {
  font-size: 24px;
}

:deep(.media-grid.list) .preview-icon el-icon {
  size: 24px;
}
</style>
