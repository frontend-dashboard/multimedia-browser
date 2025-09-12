import { createRouter, createWebHashHistory } from 'vue-router'

// 定义路由
const routes = [
  {
    path: '/',
    component: () => import('@renderer/layout/DefaultLayout.vue'),
    meta: {
      keepAlive: true
    },
    children: [
      {
        path: '/',
        name: 'Home',
        component: () => import('@renderer/views/HomeView.vue'),
        meta: {
          keepAlive: false
        }
      },
      {
        path: 'media',
        name: 'Media',
        component: () => import('@renderer/views/MediaView.vue'),
        meta: {
          keepAlive: false
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@renderer/views/SettingsView.vue'),
        meta: {
          keepAlive: false
        }
      },
      {
        path: 'rpa',
        name: 'RPA',
        component: () => import('@renderer/views/RPAView.vue'),
        meta: {
          keepAlive: true
        }
      }
    ]
  }
]

// 创建路由器实例
const router = createRouter({
  history: createWebHashHistory(), // 使用hash模式路由，适合Electron应用
  routes
})

export default router
