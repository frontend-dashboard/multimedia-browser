<template>
  <div class="preview-container">
    <div class="preview-content">
      <!-- 图片预览 -->
      <div v-if="isImage" class="image-preview">
        <el-image
          :src="getLocalFileUrl(previewUrl)"
          fit="contain"
          :preview-src-list="[getLocalFileUrl(previewUrl)]"
          @load="loading = false"
          @error="handleError('图片加载失败')"
          preview-teleported
          :z-index="3000"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
              <p>图片加载失败</p>
              <p class="error-detail" v-if="previewUrl">URL: {{ previewUrl }}</p>
            </div>
          </template>
        </el-image>
      </div>

      <!-- 视频预览 -->
      <div v-if="isVideo" class="video-preview">
        <video
          :src="getLocalFileUrl(previewUrl)"
          controls
          autoplay
          muted
          playsinline
          @loadedmetadata="loading = false"
          @error="handleError('视频加载失败')"
          class="preview-video"
        ></video>
      </div>

      <!-- 文档预览 (PPT, Word, Excel, PDF) -->
      <div v-if="isDocument" class="document-preview">
        <iframe
          :src="getDocumentPreviewUrl()"
          frameborder="0"
          class="document-frame"
          @load="loading = false"
          @error="handleError('文档加载失败')"
        ></iframe>
      </div>

      <!-- 不支持的类型 -->
      <div v-if="isUnsupported" class="unsupported-type">
        <el-empty description="不支持的文件类型">
          <template #image>
            <el-icon class="empty-icon"><Document /></el-icon>
          </template>
          <template #description>
            <p>无法预览此类型的文件: {{ fileExtension }}</p>
          </template>
        </el-empty>
      </div>

      <!-- 错误信息 -->
      <el-alert
        v-if="errorMessage"
        :message="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
      ></el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  previewUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '资源预览'
  },
  visible: {
    type: Boolean,
    default: true
  }
})

// 状态管理
const loading = ref(true)
const errorMessage = ref('')

// 从 URL 中提取文件后缀（如 .pdf、.jpg）
const fileExtension = computed(() => {
  // 处理 URL 中的查询参数或哈希（如 https://xxx/file.pdf?a=1#hash）
  const urlWithoutParams = props.previewUrl.split(/[?#]/)[0]
  // 提取最后一个 . 后的字符串作为后缀（忽略大小写）
  const match = urlWithoutParams.match(/\.([a-zA-Z0-9]+)$/)
  return match ? `.${match[1].toLowerCase()}` : ''
})

// 映射文件后缀到 MIME 类型
const mimeType = computed(() => {
  const extensionMap = {
    // 图片类型
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    // 视频类型
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    // 文档类型
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  return extensionMap[fileExtension.value] || ''
})

// 计算属性 - 判断文件类型
const isImage = computed(() => {
  return mimeType.value.startsWith('image/')
})

const isVideo = computed(() => {
  return mimeType.value.startsWith('video/')
})

const isDocument = computed(() => {
  const docMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
  return docMimeTypes.includes(mimeType.value)
})

const isUnsupported = computed(() => {
  return !isImage.value && !isVideo.value && !isDocument.value
})

// 处理错误
const handleError = (message) => {
  loading.value = false
  console.error(`预览加载失败: ${message}, URL: ${props.previewUrl}`)
  errorMessage.value = message
}

// 使用preload中提供的安全文件URL获取方法
const getLocalFileUrl = (path) => {
  try {
    // 检查window.api是否可用
    if (window && window.api && window.api.getSafeFileUrl) {
      const safeUrl = window.api.getSafeFileUrl(path)
      console.log('安全文件URL:', safeUrl)
      return safeUrl
    } else {
      console.warn('window.api.getSafeFileUrl不可用，使用备用方法')

      // 备用方法：处理Windows路径
      let filePath = path
      if (filePath.includes('\\')) {
        filePath = filePath.replace(/\\/g, '/')
      }

      return filePath
    }
  } catch (error) {
    console.error('获取安全文件URL失败:', error)
    return path
  }
}

// 获取文档预览 URL
const getDocumentPreviewUrl = () => {
  // 转换为可预览的URL格式
  const previewUrl = getLocalFileUrl(props.previewUrl)

  if (mimeType.value === 'application/pdf') {
    return previewUrl // PDF 可直接通过 URL 预览
  }

  // 对于Office文档，如果是本地文件，我们无法直接使用微软在线预览服务
  // 因为微软预览服务需要可公开访问的URL
  if (previewUrl.startsWith('file://')) {
    console.warn('本地Office文档无法通过微软预览服务预览，将尝试直接使用file://协议打开')
    return previewUrl
  }

  // 非本地文件使用微软在线预览服务
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewUrl)}`
}

// 监听 URL 变化，重新加载
watch(
  () => props.previewUrl,
  () => {
    console.log(props.previewUrl)
    loading.value = true
    errorMessage.value = ''
  }
)
</script>

<style scoped lang="scss">
.preview-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview,
.video-preview,
.document-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.error-detail {
  font-size: 0.8rem;
  color: #999;
  margin-top: 8px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-error .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
}

.document-frame {
  width: 100%;
  height: 100%;
}

.unsupported-type {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 60px;
  height: 60px;
}
</style>
