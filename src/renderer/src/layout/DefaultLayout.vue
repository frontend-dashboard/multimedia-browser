<script setup>
import { RouterView } from 'vue-router'
import { KeepAlive, computed } from 'vue'
import { getThemeClass } from '@renderer/utils/themeUtils.js'
import NavBar from '@renderer/components/NavBar.vue'

// 计算当前应使用的主题类
const themeClass = computed(() => {
  return getThemeClass()
})

// 缓存的路由组件名称列表
const cachedViews = computed(() => {
  return ['RPAView']
})

// 判断路由是否需要缓存
const shouldKeepAlive = (route) => {
  console.log('检查路由缓存状态:', {
    path: route?.path,
    name: route?.name,
    meta: route?.meta,
    keepAlive: route && route.meta && route.meta.keepAlive === true
  })
  return route && route.meta && route.meta.keepAlive === true
}
</script>

<template>
  <div class="app-container" :class="themeClass">
    <NavBar />
    <!-- 主要内容区域 -->
    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
        <div
          style="
            background: rgba(0, 0, 0, 0.05);
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 14px;
          "
        >
          当前路由:
          {{ route && route.path ? route.path : '未知' }} | 缓存状态:
          <span :style="{ color: shouldKeepAlive(route) ? 'green' : 'red' }">
            {{ shouldKeepAlive(route) ? '已启用缓存' : '未启用缓存' }}
          </span>
          <span> 缓存组件名称: {{ cachedViews.join(', ') }} </span>
        </div>
        <!-- 缓存路由组件 -->
        <KeepAlive :include="cachedViews">
          <Component :is="Component" :key="route.path" />
        </KeepAlive>
      </RouterView>
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
