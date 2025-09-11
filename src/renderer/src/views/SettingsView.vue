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
      <el-form>
        <el-form-item label="" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>{{ t('settings.display') }}</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item :label="t('settings.defaultViewMode')">
          <el-select v-model="defaultViewMode" @change="updateDefaultViewMode" style="width: 100%">
            <el-option :label="t('options.gridView')" value="grid" />
            <el-option :label="t('options.listView')" value="list" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('settings.defaultSortBy')">
          <el-select v-model="defaultSortBy" @change="updateDefaultSortBy" style="width: 100%">
            <el-option :label="t('options.sortByName')" value="name" />
            <el-option :label="t('options.sortByDate')" value="date" />
            <el-option :label="t('options.sortBySize')" value="size" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('settings.defaultSortOrder')">
          <el-select
            v-model="defaultSortOrder"
            @change="updateDefaultSortOrder"
            style="width: 100%"
          >
            <el-option :label="t('options.ascending')" value="asc" />
            <el-option :label="t('options.descending')" value="desc" />
          </el-select>
        </el-form-item>

        <el-form-item label="" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>{{ t('settings.media') }}</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item :label="t('settings.defaultMediaType')">
          <el-select
            v-model="defaultMediaType"
            @change="updateDefaultMediaType"
            style="width: 100%"
          >
            <el-option :label="t('options.allTypes')" value="all" />
            <el-option :label="t('options.imagesOnly')" value="images" />
            <el-option :label="t('options.videosOnly')" value="videos" />
            <el-option :label="t('options.audioOnly')" value="audio" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('settings.showFileExtensions')">
          <el-checkbox v-model="showFileExtensions" @change="updateShowFileExtensions">
            {{ t('settings.showFileExtensions') }}
          </el-checkbox>
        </el-form-item>

        <el-form-item :label="t('settings.showHiddenFiles')">
          <el-checkbox v-model="showHiddenFiles" @change="updateShowHiddenFiles">
            {{ t('settings.showHiddenFiles') }}
          </el-checkbox>
        </el-form-item>

        <el-form-item label="" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>{{ t('settings.interface') }}</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item :label="t('settings.theme')">
          <el-select v-model="theme" @change="updateTheme" style="width: 100%">
            <el-option :label="t('options.lightTheme')" value="light" />
            <el-option :label="t('options.darkTheme')" value="dark" />
            <el-option :label="t('options.systemTheme')" value="system" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('settings.language')">
          <el-select v-model="language" @change="updateLanguage" style="width: 100%">
            <el-option :label="t('options.simplifiedChinese')" value="zh-CN" />
            <el-option :label="t('options.traditionalChinese')" value="zh-TW" />
            <el-option :label="t('options.english')" value="en-US" />
          </el-select>
        </el-form-item>

        <el-form-item label="" prop="section-title">
          <el-divider content-position="left">
            <el-text type="primary" size="large"><strong>{{ t('settings.about') }}</strong></el-text>
          </el-divider>
        </el-form-item>

        <el-form-item>
          <el-card class="about-card">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="t('settings.appName')">{{ t('app.name') }}</el-descriptions-item>
              <el-descriptions-item :label="t('settings.version')">1.0.0</el-descriptions-item>
              <el-descriptions-item :label="t('settings.description')">{{ t('app.description') }}</el-descriptions-item>
              <el-descriptions-item :label="t('settings.license')">MIT License</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="actions">
      <el-button type="primary" @click="saveSettings" icon="Save">{{ t('settings.save') }}</el-button>
      <el-button type="default" @click="resetSettings" icon="RefreshRight">{{ t('settings.reset') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

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
  // 更新i18n的locale
  locale.value = language.value
}

// 保存所有设置
const saveSettings = () => {
  // 已经通过update方法保存了大部分设置
  // 这里可以添加额外的保存逻辑或显示保存成功的提示
  alert(t('settings.settingsSaved'))
}

// 重置为默认值
const resetSettings = () => {
  if (confirm(t('settings.confirmReset'))) {
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
  const root = document.documentElement

  // 移除所有主题类
  root.classList.remove('light-theme', 'dark-theme')

  // 跟随系统模式
  if (theme.value === 'system') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(isDarkMode ? 'dark-theme' : 'light-theme')
  } else {
    // 手动选择模式
    if (theme.value === 'dark') {
      root.classList.add('dark-theme')
    } else if (theme.value === 'light') {
      root.classList.add('light-theme')
    }
  }

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
  width: 100%;
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
