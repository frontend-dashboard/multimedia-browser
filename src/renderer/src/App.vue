<script setup>
import { RouterView } from 'vue-router'
import { computed } from 'vue'
import { getThemeClass } from './utils/themeUtils.js'
import NavBar from './components/NavBar.vue'

// 计算当前应使用的主题类（仅用于模板绑定）
const themeClass = computed(() => {
  return getThemeClass()
})
</script>

<template>
  <div class="app-container" :class="themeClass">
    <NavBar />
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

.main-content {
  height: calc(100vh - 68px);
  padding: 2rem;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
