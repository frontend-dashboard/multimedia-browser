<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { useMediaStore } from './store/modules/media'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const mediaStore = useMediaStore()
const isDarkTheme = computed(() => {
  const theme = localStorage.getItem('theme') || 'dark'
  return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
})
</script>

<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="navbar-brand">
        <img alt="logo" class="logo" src="./assets/electron.svg" />
        <span class="app-name">多媒体浏览器</span>
      </div>
      
      <div class="navbar-nav">
        <RouterLink to="/" class="nav-link" active-class="active">首页</RouterLink>
        <RouterLink to="/media" class="nav-link" active-class="active">媒体浏览</RouterLink>
        <RouterLink to="/settings" class="nav-link" active-class="active">设置</RouterLink>
      </div>
      
      <div class="navbar-actions">
        <button class="btn btn-small" @click="ipcHandle">
          发送IPC
        </button>
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  padding: 0.5rem 1rem;
  color: var(--color-text);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
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
  flex: 1;
  padding: 2rem;
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
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 14px;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
