<template>
  <div class="rpa-view">
    <div class="rpa-view-header">
      <div class="rpa-view-header-title">{{ title }}</div>
    </div>
    <div class="rpa-view-content">
      <div class="rpa-view-content-title">
        <el-input v-model="title" placeholder="修改此文本测试缓存效果" />
      </div>

      <!-- 缓存状态指示器 -->
      <div class="cache-indicator">
        <el-alert
          :title="'组件缓存状态：' + (isCached ? '已缓存' : '未缓存')"
          :type="isCached ? 'success' : 'info'"
          :closable="false"
        />
        <div class="mount-time">组件挂载时间：{{ mountTime }}</div>
        <div class="update-count">组件更新次数：{{ updateCount }}</div>
      </div>

      <!-- 测试按钮 -->
      <div class="test-buttons">
        <el-button @click="incrementUpdateCount">更新组件状态</el-button>
        <el-button type="primary" @click="$router.push('/media')">跳转到其他页面测试</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onUpdated, onActivated, onDeactivated } from 'vue'

const title = ref('RPA 视图')
const isCached = ref(false)
const mountTime = ref('')
const updateCount = ref(0)

// 组件挂载时设置挂载时间
onMounted(() => {
  mountTime.value = new Date().toLocaleString()
  console.log('RPAView 组件已挂载 - 时间戳:', Date.now())
})

// 组件更新时增加更新计数
onUpdated(() => {
  updateCount.value++
  console.log('RPAView 组件已更新 - 更新次数:', updateCount.value)
})

// KeepAlive特有的生命周期钩子
// 在组件被缓存后再次激活时调用
onActivated(() => {
  isCached.value = true
  console.log('RPAView 组件被激活 - 从缓存中恢复')
})

// 在组件被缓存前调用
onDeactivated(() => {
  console.log('RPAView 组件被停用时 - 存入缓存')
})

// 组件卸载时记录日志（如果没有被缓存）
onUnmounted(() => {
  console.log('RPAView 组件已卸载 - 时间戳:', Date.now())
})

// 增加更新计数的方法
const incrementUpdateCount = () => {
  updateCount.value++
}
</script>

<style scoped>
.rpa-view {
  padding: 20px;
}

.rpa-view-header {
  margin-bottom: 20px;
}

.rpa-view-header-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text);
}

.rpa-view-content {
  background: var(--color-background-soft);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.rpa-view-content-title {
  margin-bottom: 20px;
}

.cache-indicator {
  margin-bottom: 20px;
}

.mount-time,
.update-count {
  margin-top: 10px;
  color: var(--color-text-2);
}

.test-buttons {
  display: flex;
  gap: 10px;
}
</style>
