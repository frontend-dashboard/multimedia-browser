<script setup>
import { RouterView } from 'vue-router'
import { KeepAlive, computed } from 'vue'
import { getThemeClass } from '@renderer/utils/themeUtils.js'
import NavBar from '@renderer/components/NavBar.vue'

// 计算当前应使用的主题类
const themeClass = computed(() => {
  return getThemeClass()
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
      <!-- 使用KeepAlive组件实现路由缓存 -->
      <!-- 只缓存那些设置了meta: { keepAlive: true }的路由组件 -->
      <!-- 按照Electron环境最佳实践，不使用解构赋值 -->
      <RouterView v-slot="slotProps">
        <!-- 显示当前路由的缓存状态 -->
        <div
          style="
            background: rgba(0, 0, 0, 0.05);
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 14px;
          "
        >
          当前路由: {{ slotProps.route && slotProps.route.path ? slotProps.route.path : '未知' }} |
          缓存状态:
          <span :style="{ color: shouldKeepAlive(slotProps.route) ? 'green' : 'red' }">
            {{ shouldKeepAlive(slotProps.route) ? '已启用缓存' : '未启用缓存' }}
          </span>
        </div>

        <!-- 优化的keepAlive实现，根据路由meta.keepAlive属性决定是否缓存 -->
        <div v-if="shouldKeepAlive(slotProps.route)">
          <KeepAlive>
            <component
              :is="slotProps.Component"
              :key="slotProps.route && slotProps.route.fullPath ? slotProps.route.fullPath : ''"
            />
          </KeepAlive>
        </div>
        <div v-else>
          <component
            :is="slotProps.Component"
            :key="slotProps.route && slotProps.route.fullPath ? slotProps.route.fullPath : ''"
          />
        </div>
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
