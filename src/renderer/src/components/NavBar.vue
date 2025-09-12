<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <img alt="logo" class="logo" src="@renderer/assets/electron.svg" />
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
</template>

<style scoped>
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
}
</style>