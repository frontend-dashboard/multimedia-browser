<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getThemeClass } from './utils/themeUtils.js'

const { t } = useI18n()

const ipcHandle = () => window.electron.ipcRenderer.send('ping')

// 计算当前应使用的主题类（仅用于模板绑定）
const themeClass = computed(() => {
  return getThemeClass()
})

// 组件挂载时的其他初始化操作
onMounted(() => {
  // 主题应用已在main.js中处理
})
</script>

<template>
  <div class="app-container" :class="themeClass">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="navbar-brand">
        <img alt="logo" class="logo" src="./assets/electron.svg" />
        <span class="app-name">{{ t('app.name') }}</span>
      </div>

      <div class="navbar-nav">
        <RouterLink to="/" class="nav-link" active-class="active">{{
          t('navigation.home')
        }}</RouterLink>
        <RouterLink to="/media" class="nav-link" active-class="active">{{
          t('navigation.media')
        }}</RouterLink>
        <RouterLink to="/rpa" class="nav-link" active-class="active">{{
          t('navigation.rpa')
        }}</RouterLink>
        <RouterLink to="/settings" class="nav-link" active-class="active">{{
          t('navigation.settings')
        }}</RouterLink>
      </div>

      <div class="navbar-actions">
        <button class="btn btn-small" @click="ipcHandle">{{ t('actions.sendIPC') }}</button>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  color: var(--color-text);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  height: 32px;
  width: 32px;
}

.app-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text);
}

.navbar-nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  font-size: 14px;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  background-color: #6988e6;
  color: white;
}

.navbar-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #6988e6;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #5a78d6;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

.main-content {
  height: calc(100vh - 68px);
  padding: 2rem;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .navbar-nav {
    gap: 0.5rem;
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
