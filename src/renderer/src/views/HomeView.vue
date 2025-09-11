<template>
  <div class="home-view">
    <el-card class="welcome-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>多媒体浏览器</span>
        </div>
      </template>
      <div class="welcome-content">
        <p>欢迎使用多媒体浏览器应用程序</p>
      </div>
    </el-card>

    <el-divider />

    <div class="features">
      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <h3>浏览媒体文件</h3>
        <p>浏览和管理您的本地图片、音频和视频文件</p>
        <router-link to="/media">
          <el-button type="primary" size="default" class="mt-4">
            开始浏览
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>

      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><Pictures /></el-icon>
        </div>
        <h3>媒体预览</h3>
        <p>预览各种格式的媒体文件</p>
        <router-link to="/media">
          <el-button type="default" size="default" class="mt-4">
            查看详情
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>

      <el-card class="feature-card" shadow="hover" :body-style="{ padding: '25px' }">
        <div class="card-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h3>自定义设置</h3>
        <p>根据您的喜好自定义应用设置</p>
        <router-link to="/settings">
          <el-button type="default" size="default" class="mt-4">
            前往设置
            <el-icon><Right /></el-icon>
          </el-button>
        </router-link>
      </el-card>
    </div>

    <el-divider />

    <el-alert title="使用提示" type="info" :closable="false" class="tips">
      <ul class="tips-list">
        <li>点击"开始浏览"按钮浏览您的媒体文件</li>
        <li>在媒体浏览页面可以按类型筛选文件</li>
        <li>使用设置页面自定义应用外观和行为</li>
      </ul>
    </el-alert>
  </div>
</template>

<script setup>
// 图标已在main.js中全局注册，不需要在此处导入
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
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
