<template>
  <div class="music-app">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <transition :name="getTransitionName(route)" mode="out-in">
        <KeepAlive :include="['Home', 'Search', 'User']" :max="10">
          <component :is="Component" :key="getComponentKey(route)" />
        </KeepAlive>
      </transition>
    </router-view>
    
    <!-- 全局播放器 -->
    <Player v-if="showPlayer" @close="closePlayer" />
    
    <!-- 迷你播放器 -->
    <MiniPlayer v-if="showMiniPlayer" />
    
    <!-- 底部导航 -->
    <Nav v-if="showNav" />
    
    <!-- Toast组件 -->
    <Toast ref="toastRef" />

    <!-- 全局text文本显示 -->
    <Text :modelValue="textStore.showTextDisplay.value" @close="hideText()"
      :text="textStore.displayText.value" :title="textStore.displayTitle.value" />
    
    <!-- 全局Action组件 -->
    <Action
      v-model="showActionSheet"
      :options="actionSheetOptions"
      @select="handleActionSelect"
    />
    
    <!-- 设置组件 -->
    <Settings v-model:show="showSettings" @close="showSettings = false" />
    
    <!-- 确认对话框组件 -->
    <Confirm />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import { showActionSheet, actionSheetOptions, handleActionSelect } from '@/stores/action'

import Nav from '@/components/Nav.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import Player from '@/components/PlayCard.vue'
import Toast from '@/components/Toast.vue'
import Action from '@/components/Action.vue'
import Settings from '@/components/Settings.vue'
import Confirm from '@/components/Confirm.vue'
import Text from './components/Text.vue'
import { hideText, textStore } from './stores/text'

const route = useRoute()
const userStore = useUserStore()
const playerStore = usePlayerStore()
const settingsStore = useSettingsStore()

// 设置面板显示状态
const showSettings = ref(false)

// 用于记录路由历史，判断页面切换方向
const history = ref<string[]>([route.path])

// 获取页面切换动画名称
const getTransitionName = (toRoute: any) => {
  const fromPath = history.value[history.value.length - 1]
  const toPath = toRoute.path
  
  // 更新历史记录
  if (history.value[history.value.length - 1] !== toPath) {
    history.value.push(toPath)
    // 保持历史记录不超过10条
    if (history.value.length > 10) {
      history.value = history.value.slice(-10)
    }
  }
  
  // 判断是否是返回操作
  const isBack = history.value.length > 1 && 
                 history.value[history.value.length - 2] === toPath
  
  // 根据路由层级判断切换方向
  const fromDepth = getRouteDepth(fromPath)
  const toDepth = getRouteDepth(toPath)
  
  if (isBack || toDepth < fromDepth) {
    return 'slide-right'
  } else {
    return 'slide-left'
  }
}

// 获取路由层级深度
const getRouteDepth = (path: string) => {
  if (path === '/') return 0
  if (path.startsWith('/search') || path.startsWith('/user')) return 1
  if (path.startsWith('/playlist/') || path.startsWith('/album/') || path.startsWith('/artist/')) return 2
  if (path.startsWith('/login')) return 3
  return 1
}

// 获取组件key，优化KeepAlive缓存
const getComponentKey = (route: any) => {
  // 对于详情页面，使用路由名称+ID作为key，避免不同详情页共享状态
  if (route.name === 'Playlist' || route.name === 'Album' || route.name === 'Artist') {
    return `${route.name}-${route.params.id}`
  }
  
  // 对于搜索页面，包含搜索参数和tab状态
  if (route.name === 'Search') {
    const query = new URLSearchParams(route.query as any).toString()
    return `Search-${query}`
  }
  
  // 其他页面使用路径
  return route.path
}

const toastRef = ref<InstanceType<typeof Toast>>()
const showPlayer = ref(false)

// 提供Toast方法给全局使用
provide('toast', {
  show: (message: string, type?: any, duration?: number) => toastRef.value?.show(message, type, duration),
  success: (message: string, duration?: number) => toastRef.value?.success(message, duration),
  error: (message: string, duration?: number) => toastRef.value?.error(message, duration),
  warning: (message: string, duration?: number) => toastRef.value?.warning(message, duration),
  info: (message: string, duration?: number) => toastRef.value?.info(message, duration),
})

// 控制显示/隐藏
const showNav = computed(() => {
  return !showPlayer.value && !route.meta.fullScreen && route.name !== 'Login'
})

const showMiniPlayer = computed(() => {
  return !showPlayer.value && !route.meta.fullScreen && playerStore.hasCurrentSong  && route.name !== 'Login'
})

// 打开播放器
const openPlayer = () => {
  showPlayer.value = true
}

// 关闭播放器
const closePlayer = () => {
  showPlayer.value = false
}

// 提供打开播放器的方法给全局使用
provide('openPlayer', openPlayer)

// 提供全局方法
provide('showSettings', () => {
  showSettings.value = true
})

onMounted(async () => {
  // 初始化用户状态
  await userStore.initFromStorage()
  // 初始化字体大小设置
  settingsStore.initFontSize()
  // 检查登录状态
  await userStore.checkLoginStatus()
  // 初始化音频
  playerStore.initAudio()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.music-app {
  width: 100%;
  max-width: $screen-width;
  min-height: 100vh;
  margin: 0 auto;
  background: $gradient-bg;
  position: relative;
  overflow-x: hidden;
}

// 页面切换动画
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(6.25rem /* 100px */);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-6.25rem /* 100px */);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-6.25rem /* 100px */);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(6.25rem /* 100px */);
}
</style>