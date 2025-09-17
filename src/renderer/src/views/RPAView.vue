<template>
  <div class="rpa-view">
    <div class="rpa-view-content">
      <RPAMain />
    </div>
  </div>
</template>

<script setup>
import RPAMain from '@renderer/components/automation/RPAMain.vue'

defineOptions({
  name: 'RPAView'
})
</script>

<style scoped>
.rpa-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rpa-view-header {
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.rpa-view-header-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.rpa-view-header-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.rpa-view-content {
  flex: 1;
  overflow: hidden;
  background: var(--el-bg-color);
}

/* 隐藏滚动条但保留滚动功能 */
.rpa-view-content::-webkit-scrollbar {
  display: none;
}

.rpa-view-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
