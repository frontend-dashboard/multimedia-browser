<template>
  <div class="home-view">
    <el-card class="welcome-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>{{ t('app.name') }}</span>
        </div>
      </template>
      <div class="welcome-content">
        <p>{{ t('home.welcome') }}</p>
      </div>
    </el-card>

    <el-divider />

    <div class="features">
      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <h3>{{ t('home.browseMedia') }}</h3>
        <p>{{ t('home.browseMediaDesc') }}</p>
        <router-link to="/media">
          <el-button type="primary" size="default" class="mt-4">
            {{ t('home.startBrowsing') }}
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>

      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><Picture /></el-icon>
        </div>
        <h3>{{ t('home.mediaPreview') }}</h3>
        <p>{{ t('home.mediaPreviewDesc') }}</p>
        <router-link to="/media">
          <el-button type="default" size="default" class="mt-4">
            {{ t('home.viewDetails') }}
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>

      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h3>{{ t('home.customSettings') }}</h3>
        <p>{{ t('home.customSettingsDesc') }}</p>
        <router-link to="/settings">
          <el-button type="default" size="default" class="mt-4">
            {{ t('home.goToSettings') }}
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>
    </div>

    <el-divider />

    <el-alert :title="t('home.usageTips')" type="info" :closable="false" class="tips">
      <ul class="tips-list">
        <li>{{ t('home.tip1') }}</li>
        <li>{{ t('home.tip2') }}</li>
        <li>{{ t('home.tip3') }}</li>
      </ul>
    </el-alert>
  </div>
</template>

<script setup>
//
defineOptions({
  name: 'HomeView'
})
// 图标已在main.js中全局注册，不需要在此处导入
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.home-view {
  padding: 20px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-text);
}

.welcome-content {
  text-align: center;
  padding: 20px 0;
  font-size: 1.2rem;
  color: var(--color-text-2);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.feature-card {
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: var(--el-color-primary);
  text-align: center;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--color-text);
  text-align: center;
}

.feature-card p {
  font-size: 1rem;
  color: var(--color-text-2);
  margin-bottom: 20px;
  text-align: center;
}

.tips {
  max-width: 800px;
  margin: 0 auto;
}

.tips-list {
  margin-top: 10px;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 5px;
  color: var(--color-text-2);
}

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }

  .card-header {
    font-size: 1.5rem;
  }
}
</style>
