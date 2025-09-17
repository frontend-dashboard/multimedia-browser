<script setup>
import { RouterView, useRouter } from 'vue-router'
import { computed } from 'vue'
import { getThemeClass } from '@renderer/utils/themeUtils.js'
import NavBar from '@renderer/components/NavBar.vue'

const router = useRouter()

// 计算当前应使用的主题类
const themeClass = computed(() => {
  return getThemeClass()
})

// 缓存的路由组件名称列表
const cachedViews = computed(() => {
  const allRoutes = router.getRoutes()
  return allRoutes.filter((item) => item.meta?.keepAlive).map((item) => item.name)
})
</script>

<template>
  <div class="app-container" :class="themeClass">
    <NavBar />
    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
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
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.main-content {
  height: calc(100vh - 68px);
  overflow: auto;
}
</style>
