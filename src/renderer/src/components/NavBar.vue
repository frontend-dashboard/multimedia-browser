<script setup>
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const activeIndex = ref('home')

const handleSelect = (key) => {
  activeIndex.value = key
  router.push(`/${key}`)
}

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <img alt="logo" class="logo" src="@renderer/assets/electron.svg" />
      <span class="app-name">{{ t('app.name') }}</span>
    </div>

    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
    >
      <el-menu-item index="home">{{ t('navigation.home') }}</el-menu-item>
      <el-menu-item index="media">{{ t('navigation.media') }}</el-menu-item>
      <el-menu-item index="settings">{{ t('navigation.settings') }}</el-menu-item>
      <el-menu-item index="rpa">{{ t('navigation.rpa') }}</el-menu-item>
    </el-menu>

    <el-button type="primary" @click="ipcHandle">{{ t('actions.sendIPC') }}</el-button>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
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
  color: var(--el-text-color-primary);
}

/* 重置el-menu边框样式 */
.el-menu,
.el-menu-item {
  border: none !important;
}

/* 响应式设计 */
@media (max-width: 650px) {
  .navbar {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
}
</style>
