<template>
  <div class="home-view">
    <h1>多媒体浏览器</h1>
    <p>欢迎使用多媒体浏览器应用程序</p>
    
    <div class="features">
      <div class="feature-card">
        <h3>浏览媒体文件</h3>
        <p>浏览和管理您的本地图片、音频和视频文件</p>
        <router-link to="/media" class="btn">开始浏览</router-link>
      </div>
      
      <div class="feature-card">
        <h3>媒体预览</h3>
        <p>预览各种格式的媒体文件</p>
      </div>
      
      <div class="feature-card">
        <h3>自定义设置</h3>
        <p>根据您的喜好自定义应用设置</p>
        <router-link to="/settings" class="btn">前往设置</router-link>
      </div>
    </div>
    
    <div class="tips">
      <h3>使用提示</h3>
      <ul>
        <li>点击"开始浏览"按钮浏览您的媒体文件</li>
        <li>在媒体浏览页面可以按类型筛选文件</li>
        <li>使用设置页面自定义应用外观和行为</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// 可以在这里添加组件的逻辑
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

.home-view h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: var(--color-text);
}

.home-view p {
  font-size: 1.2rem;
  color: var(--color-text-2);
  margin-bottom: 40px;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.feature-card {
  background-color: var(--color-background-soft);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--color-text);
}

.feature-card p {
  font-size: 1rem;
  color: var(--color-text-2);
  margin-bottom: 20px;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--ev-button-alt-bg);
  color: var(--ev-button-alt-text);
  border: none;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s ease;
  cursor: pointer;
}

.btn:hover {
  background-color: var(--ev-button-alt-hover-bg);
}

.tips {
  background-color: var(--color-background-mute);
  padding: 30px;
  border-radius: 10px;
  max-width: 800px;
  margin: 0 auto;
}

.tips h3 {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: var(--color-text);
}

.tips ul {
  list-style: none;
  padding: 0;
}

.tips li {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-2);
}

.tips li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .home-view h1 {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}
</style>