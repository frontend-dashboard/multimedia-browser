<template>
  <div class="settings-view">
    <h1>应用设置</h1>
    
    <div class="settings-container">
      <div class="settings-section">
        <h2>显示设置</h2>
        
        <div class="setting-item">
          <label>默认视图模式</label>
          <select v-model="defaultViewMode" @change="updateDefaultViewMode">
            <option value="grid">网格视图</option>
            <option value="list">列表视图</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>默认排序方式</label>
          <select v-model="defaultSortBy" @change="updateDefaultSortBy">
            <option value="name">按名称排序</option>
            <option value="date">按日期排序</option>
            <option value="size">按大小排序</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>默认排序顺序</label>
          <select v-model="defaultSortOrder" @change="updateDefaultSortOrder">
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>媒体设置</h2>
        
        <div class="setting-item">
          <label>默认媒体类型筛选</label>
          <select v-model="defaultMediaType" @change="updateDefaultMediaType">
            <option value="all">所有类型</option>
            <option value="images">仅图片</option>
            <option value="videos">仅视频</option>
            <option value="audio">仅音频</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showFileExtensions"
              @change="updateShowFileExtensions"
            />
            显示文件扩展名
          </label>
        </div>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showHiddenFiles"
              @change="updateShowHiddenFiles"
            />
            显示隐藏文件
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>界面设置</h2>
        
        <div class="setting-item">
          <label>主题</label>
          <select v-model="theme" @change="updateTheme">
            <option value="dark">深色模式</option>
            <option value="light">浅色模式</option>
            <option value="system">跟随系统</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>语言</label>
          <select v-model="language" @change="updateLanguage">
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>关于应用</h2>
        
        <div class="about-info">
          <p><strong>多媒体浏览器</strong></p>
          <p>版本: 1.0.0</p>
          <p>一个基于Electron和Vue.js的跨平台媒体浏览应用</p>
          <p>MIT许可证</p>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button class="btn btn-primary" @click="saveSettings">保存设置</button>
      <button class="btn btn-secondary" @click="resetSettings">重置为默认值</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '../store/modules/media'

const mediaStore = useMediaStore()

// 设置状态
const defaultViewMode = ref('grid')
const defaultSortBy = ref('name')
const defaultSortOrder = ref('asc')
const defaultMediaType = ref('all')
const showFileExtensions = ref(false)
const showHiddenFiles = ref(false)
const theme = ref('dark')
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
  theme.value = localStorage.getItem('theme') || 'dark'
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
    localStorage.setItem('theme', 'dark')
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

.settings-view h1 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: var(--color-text);
}

.settings-container {
  display: grid;
  gap: 30px;
  margin-bottom: 40px;
}

.settings-section {
  background-color: var(--color-background-soft);
  border-radius: 10px;
  padding: 25px;
}

.settings-section h2 {
  font-size: 1.4rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text);
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-text);
}

.setting-item select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 5px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.about-info {
  text-align: center;
  padding: 20px;
  background-color: var(--color-background-mute);
  border-radius: 8px;
}

.about-info p {
  margin: 8px 0;
  color: var(--color-text-2);
}

.about-info strong {
  font-size: 1.2rem;
  color: var(--color-text);
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-primary {
  background-color: #6988e6;
  color: white;
}

.btn-primary:hover {
  background-color: #5a78d6;
}

.btn-secondary {
  background-color: var(--ev-button-alt-bg);
  color: var(--ev-button-alt-text);
  border: 1px solid var(--ev-button-alt-border);
}

.btn-secondary:hover {
  background-color: var(--ev-button-alt-hover-bg);
}

@media (max-width: 768px) {
  .settings-container {
    gap: 20px;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>