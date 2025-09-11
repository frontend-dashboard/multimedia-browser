<template>
  <div class="settings-view">
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span class="header-title">应用设置</span>
        </div>
      </template>
    </el-card>

    <el-card shadow="never" class="mt-4">
      <el-form label-width="120px">
        <el-form-item label="显示设置" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>显示设置</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item label="默认视图模式">
          <el-select v-model="defaultViewMode" @change="updateDefaultViewMode" style="width: 100%">
            <el-option label="网格视图" value="grid" />
            <el-option label="列表视图" value="list" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认排序方式">
          <el-select v-model="defaultSortBy" @change="updateDefaultSortBy" style="width: 100%">
            <el-option label="按名称排序" value="name" />
            <el-option label="按日期排序" value="date" />
            <el-option label="按大小排序" value="size" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认排序顺序">
          <el-select
            v-model="defaultSortOrder"
            @change="updateDefaultSortOrder"
            style="width: 100%"
          >
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-form-item>

        <el-form-item label="媒体设置" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>媒体设置</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item label="默认媒体类型">
          <el-select
            v-model="defaultMediaType"
            @change="updateDefaultMediaType"
            style="width: 100%"
          >
            <el-option label="所有类型" value="all" />
            <el-option label="仅图片" value="images" />
            <el-option label="仅视频" value="videos" />
            <el-option label="仅音频" value="audio" />
          </el-select>
        </el-form-item>

        <el-form-item label="显示文件扩展名">
          <el-checkbox v-model="showFileExtensions" @change="updateShowFileExtensions">
            显示文件扩展名
          </el-checkbox>
        </el-form-item>

        <el-form-item label="显示隐藏文件">
          <el-checkbox v-model="showHiddenFiles" @change="updateShowHiddenFiles">
            显示隐藏文件
          </el-checkbox>
        </el-form-item>

        <el-form-item label="界面设置" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>界面设置</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item label="主题">
          <el-select v-model="theme" @change="updateTheme" style="width: 100%">
            <el-option label="白色模式" value="white" />
            <el-option label="浅色模式" value="light" />
            <el-option label="深色模式" value="dark" />
            <el-option label="跟随系统" value="system" />
          </el-select>
        </el-form-item>

        <el-form-item label="语言">
          <el-select v-model="language" @change="updateLanguage" style="width: 100%">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>

        <el-form-item label="关于应用" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>关于应用</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item>
          <el-card class="about-card" :body-style="{ padding: '20px', textAlign: 'center' }">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="应用名称">多媒体浏览器</el-descriptions-item>
              <el-descriptions-item label="版本">1.0.0</el-descriptions-item>
              <el-descriptions-item label="描述"
                >一个基于Electron和Vue.js的跨平台媒体浏览应用</el-descriptions-item
              >
              <el-descriptions-item label="许可证">MIT许可证</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="actions">
      <el-button type="primary" @click="saveSettings" icon="Save">保存设置</el-button>
      <el-button type="default" @click="resetSettings" icon="RefreshRight">重置为默认值</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'

// 图标已在main.js中全局注册，不需要在此处导入

const mediaStore = useMediaStore()

// 设置状态
const defaultViewMode = ref('grid')
const defaultSortBy = ref('name')
const defaultSortOrder = ref('asc')
const defaultMediaType = ref('all')
const showFileExtensions = ref(false)
const showHiddenFiles = ref(false)
const theme = ref('light')
const language = ref('zh-CN')

// 从store加载设置
const loadSettings = () => {
  const storeSettings = mediaStore.settings

  defaultViewMode.value = storeSettings.viewMode || 'grid'
  defaultSortBy.value = storeSettings.sortBy || 'name'
  defaultSortOrder.value = storeSettings.sortOrder || 'asc'
  defaultMediaType.value = mediaStore.filter.type || 'all'

  // 从localStorage加载其他设置
  showFileExtensions.value = localStorage.getItem('showFileExtensions') === 'true'
  showHiddenFiles.value = localStorage.getItem('showHiddenFiles') === 'true'
  theme.value = localStorage.getItem('theme') || 'light'
  language.value = localStorage.getItem('language') || 'zh-CN'
}

// 更新设置的方法
const updateDefaultViewMode = () => {
  mediaStore.updateSettings({ viewMode: defaultViewMode.value })
}

const updateDefaultSortBy = () => {
  mediaStore.updateSettings({ sortBy: defaultSortBy.value })
}

const updateDefaultSortOrder = () => {
  mediaStore.updateSettings({ sortOrder: defaultSortOrder.value })
}

const updateDefaultMediaType = () => {
  mediaStore.updateFilter({ type: defaultMediaType.value })
}

const updateShowFileExtensions = () => {
  localStorage.setItem('showFileExtensions', showFileExtensions.value)
}

const updateShowHiddenFiles = () => {
  localStorage.setItem('showHiddenFiles', showHiddenFiles.value)
}

const updateTheme = () => {
  localStorage.setItem('theme', theme.value)
  // 这里可以添加应用主题的逻辑
  applyTheme()
}

const updateLanguage = () => {
  localStorage.setItem('language', language.value)
  // 这里可以添加应用语言的逻辑
}

// 保存所有设置
const saveSettings = () => {
  // 已经通过update方法保存了大部分设置
  // 这里可以添加额外的保存逻辑或显示保存成功的提示
  alert('设置已保存！')
}

// 重置为默认值
const resetSettings = () => {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    // 重置store设置
    mediaStore.updateSettings({
      viewMode: 'grid',
      sortBy: 'name',
      sortOrder: 'asc'
    })

    mediaStore.updateFilter({
      type: 'all'
    })

    // 重置localStorage设置
    localStorage.setItem('showFileExtensions', 'false')
    localStorage.setItem('showHiddenFiles', 'false')
    localStorage.setItem('theme', 'light')
    localStorage.setItem('language', 'zh-CN')

    // 重新加载设置
    loadSettings()
  }
}

// 应用主题
const applyTheme = () => {
  // 在实际应用中，这里可以添加切换CSS变量或类的逻辑
  console.log('应用主题:', theme.value)
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
  applyTheme()
})
</script>

<style scoped>
.settings-view {
  max-width: 800px;
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

.mt-4 {
  margin-top: 16px;
}

.about-card {
  background-color: var(--color-background-soft);
  margin-top: 10px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 15px 0;
}

/* 覆盖element-plus的一些样式以适应我们的主题 */
.el-divider--content-center .el-divider__text {
  color: var(--color-text);
}

/* 确保响应式布局 */
@media (max-width: 768px) {
  .settings-view {
    padding: 10px;
  }

  .card-header {
    font-size: 1.2rem;
  }

  .header-title {
    font-size: 1.2rem;
  }

  .actions {
    flex-direction: column;
  }

  .actions .el-button {
    width: 100%;
  }
}
</style>
