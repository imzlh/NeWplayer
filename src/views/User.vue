<template>
  <div class="user-page">
    <!-- 头部 -->
    <header class="user-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <img
          :src="getImageUrl(userStore.avatarUrl, 120, 120)"
          :alt="userStore.nickname"
          class="user-avatar"
        />
        <div class="user-info">
          <h1 class="user-name">{{ userStore.nickname }}</h1>
          <p class="user-signature text-ellipsis">{{ userStore.user?.signature || '这个人很懒，什么都没有留下' }}</p>
        </div>
      </div>
      <div class="user-stats">
        <div class="stat-item">
          <span class="stat-value">{{ userStore.user?.eventCount || 0 }}</span>
          <span class="stat-label">动态</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userStore.user?.follows || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userStore.user?.followeds || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
      </div>
    </header>
    
    <!-- 菜单列表 -->
    <main class="user-content">
      <div class="menu-section">
        <div class="menu-item" @click="goToUserPlaylists">
          <div class="menu-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </div>
          <span class="menu-label">我的歌单</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
        
        <div class="menu-item" @click="goToDailyRecommend">
          <div class="menu-icon" style="background: linear-gradient(135deg, #4ecdc4 0%, #44a3aa 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
            </svg>
          </div>
          <span class="menu-label">每日推荐</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
        
        <div class="menu-item" @click="goToHistory">
          <div class="menu-icon" style="background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
          </div>
          <span class="menu-label">播放历史</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
        
        <div class="menu-item" @click="goToLikedSongs">
          <div class="menu-icon" style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span class="menu-label">我喜欢的音乐</span>
          <span class="menu-count">{{ likeCount }}首</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
      
      <div class="menu-section">
        <div class="menu-item" @click="showSettings">
          <div class="menu-icon" style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84a.484.484 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.27.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </div>
          <span class="menu-label">设置</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
        
        <div class="menu-item" @click="handleLogout">
          <div class="menu-icon" style="background: linear-gradient(135deg, #ff7675 0%, #d63031 100%)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span class="menu-label">退出登录</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getImageUrl } from '@/utils/lyric'
import { getLikeList } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const likeCount = ref(0)

// 获取喜欢歌曲数量
const fetchLikeCount = async () => {
  if (userStore.userId) {
    try {
      const res = await getLikeList(userStore.userId)
      if (res.code === 200) {
        likeCount.value = res.ids?.length || 0
      }
    } catch (error) {
      console.error('获取喜欢歌曲数量失败:', error)
    }
  }
}

// 跳转方法
const goToUserPlaylists = () => router.push('/user-playlists')
const goToDailyRecommend = () => router.push('/daily-recommend')
const goToHistory = () => router.push('/history')
const goToLikedSongs = () => {
  // 跳转到喜欢的音乐歌单
  // 需要获取喜欢音乐的歌单ID
}

const showSettings = () => {
  // 显示设置
}

// 退出登录
const handleLogout = async () => {
  if (confirm('确定要退出登录吗？')) {
    await userStore.logoutUser()
    router.push('/')
  }
}

onMounted(() => {
  fetchLikeCount()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.user-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.user-header {
  position: relative;
  padding: $spacing-xl $spacing-lg;
  padding-top: calc(#{$spacing-xl} + env(safe-area-inset-top));
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba($primary-color, 0.2) 0%, $bg-primary 100%);
  z-index: -1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.user-signature {
  font-size: $font-sm;
  color: $text-tertiary;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.stat-label {
  font-size: $font-xs;
  color: $text-tertiary;
}

.user-content {
  padding: 0 $spacing-lg;
}

.menu-section {
  margin-bottom: $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
  }
  
  & + .menu-item {
    border-top: 1px solid $border-color;
  }
}

.menu-icon {
  width: 36px;
  height: 36px;
  @include flex-center;
  border-radius: $radius-md;
  color: white;
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.menu-label {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
}

.menu-count {
  font-size: $font-xs;
  color: $text-tertiary;
}

.menu-arrow {
  width: 16px;
  height: 16px;
  color: $text-muted;
}
</style>