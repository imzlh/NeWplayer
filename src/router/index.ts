import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      keepAlive: true,
    },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: {
      title: '搜索',
      keepAlive: true,
    },
  },
  {
    path: '/search/:wd/:type?',
    name: 'SearchWithParams',
    component: () => import('@/views/Search.vue'),
    meta: {
      title: '搜索',
      keepAlive: true,
    },
  },
  {
    path: '/playlist/:id',
    name: 'Playlist',
    component: () => import('@/views/Playlist.vue'),
    meta: {
      title: '歌单',
      keepAlive: false,
    },
  },
  {
    path: '/album/:id',
    name: 'Album',
    component: () => import('@/views/Album.vue'),
    meta: {
      title: '专辑',
      keepAlive: false,
    },
  },
  {
    path: '/artist/:id',
    name: 'Artist',
    component: () => import('@/views/Artist.vue'),
    meta: {
      title: '歌手',
      keepAlive: false,
    },
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User.vue'),
    meta: {
      title: '我的',
      keepAlive: true,
      requiresAuth: true,
    },
  },
  {
    path: '/user-playlists',
    name: 'UserPlaylists',
    component: () => import('@/views/UserPlaylists.vue'),
    meta: {
      title: '我的歌单',
      keepAlive: false,
      requiresAuth: true,
    },
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: {
      title: '用户详情',
      keepAlive: false,
      requiresAuth: false,
    },
  },
  {
    path: '/daily-recommend',
    name: 'DailyRecommend',
    component: () => import('@/views/DailyRecommend.vue'),
    meta: {
      title: '每日推荐',
      keepAlive: false,
      requiresAuth: false,
    },
  },
  {
    path: '/recommend',
    name: 'Recommend',
    component: () => import('@/views/PlaylistRecommend.vue'),
    meta: {
      title: '推荐歌单',
      keepAlive: false,
      requiresAuth: false,
    }
  },
  {
    path: '/toplist',
    name: 'TopList',
    component: () => import('@/views/TopList.vue'),
    meta: {
      title: '排行榜',
      keepAlive: false,
      requiresAuth: false,
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      keepAlive: false,
      guestOnly: true,
    },
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue'),
    meta: {
      title: '播放历史',
      keepAlive: false,
    },
  },
  {
    path: '/favorite',
    name: 'Favorite',
    component: () => import('@/views/Favorite.vue'),
    meta: {
      title: '我喜欢的音乐',
      keepAlive: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      keepAlive: false,
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 网易云音乐`
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }
  
  // 仅游客可访问的页面（如登录页）
  if (to.meta.guestOnly && userStore.isLoggedIn) {
    next('/')
    return
  }
  
  next()
})

export default router