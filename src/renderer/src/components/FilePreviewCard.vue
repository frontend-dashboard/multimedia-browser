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
        <!-- 使用视频元素并自动加载第一帧 -->
        <div class="video-thumbnail-wrapper">
          <video
            class="preview-video-thumbnail"
            :src="videoSourceUrl"
            muted
            playsinline
            loop
            autoplay
            @canplay="captureFirstFrame"
            @error="handleVideoThumbnailError"
          >
            您的浏览器不支持视频播放
          </video>
          <!-- 如果封面加载失败，显示默认视频图标 -->
          <div v-if="videoThumbnailError" class="preview-icon fallback-icon">
            <el-icon size="40"><VideoCamera /></el-icon>
          </div>
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
import { computed, ref } from 'vue'
import { VideoCamera } from '@element-plus/icons-vue'

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

// 视频封面加载状态
const videoThumbnailError = ref(false)
// 重试次数
const retryCount = ref(0)
// 最大重试次数
const MAX_RETRIES = 2

// 计算属性
// 视频源URL，用于加载视频并显示第一帧
const videoSourceUrl = computed(() => {
  try {
    // 获取原始文件路径
    const originalPath = props.file.path

    // 规范化路径分隔符
    let normalizedPath = originalPath.replace(/\\/g, '/')

    // 对路径进行URL编码，确保特殊字符不会导致问题
    const encodedPath = encodeURIComponent(normalizedPath)

    // 返回视频文件的URL
    return 'media-file://' + encodedPath
  } catch (error) {
    console.error('生成视频源URL时出错:', error)
    return '' // 如果出错则返回空字符串
  }
})

// 捕获视频第一帧后暂停，避免自动播放
const captureFirstFrame = (event) => {
  try {
    const videoElement = event.target
    // 暂停视频，只显示第一帧
    videoElement.pause()
    // 重置视频到开始位置，确保显示的是第一帧
    videoElement.currentTime = 0
  } catch (error) {
    console.error('捕获视频第一帧时出错:', error)
  }
}

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

// 处理视频封面加载错误
const handleVideoThumbnailError = (error) => {
  // 记录错误详情，包括错误类型和可能的原因
  console.error('视频封面加载失败事件:', {
    errorType: error.type || '未知错误',
    errorTarget: error.target ? error.target.src : '未知目标',
    errorMessage: error.message || '无错误信息',
    videoPath: props.file.path,
    fileName: props.file.name
  })

  // 实现重试逻辑
  if (retryCount.value < MAX_RETRIES) {
    // 增加重试计数
    retryCount.value++
    console.log(`尝试重新加载视频封面 (${retryCount.value}/${MAX_RETRIES})`)

    // 延迟一段时间后重试，使用指数退避策略
    const delay = Math.pow(2, retryCount.value) * 100 // 100ms, 200ms, 400ms...
    setTimeout(() => {
      try {
        // 重置视频元素以重新加载
        const videoElement = error.target
        if (videoElement) {
          // 修改URL参数来强制重新加载（在原有URL后添加时间戳）
          const timestamp = new Date().getTime()
          const urlWithTimestamp =
            videoSourceUrl.value +
            (videoSourceUrl.value.includes('?') ? '&' : '?') +
            't=' +
            timestamp

          // 清空error状态并重新设置src
          videoThumbnailError.value = false
          videoElement.src = urlWithTimestamp
          videoElement.load()
        }
      } catch (retryError) {
        console.error(`第${retryCount.value}次重试失败:`, retryError)
        // 如果重试也失败，标记为错误
        if (retryCount.value >= MAX_RETRIES) {
          videoThumbnailError.value = true
        }
      }
    }, delay)
  } else {
    // 达到最大重试次数，显示错误状态
    console.warn(`已达到最大重试次数(${MAX_RETRIES})，无法加载视频封面`)
    videoThumbnailError.value = true
  }
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
  background-color: var(--el-bg-color);
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
  overflow: hidden;
}

/* 视频缩略图容器 */
.video-thumbnail-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 视频封面缩略图样式 */
.preview-video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: var(--el-fill-color-light);
}

/* 封面加载失败时的后备图标 */
.fallback-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
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
  background-color: var(--el-bg-color);
}

.file-name {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  margin: 0;
  color: var(--el-text-color-secondary);
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
