<template>
  <div class="playlists-page">
    <header class="playlists-header">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title">我的歌单</h1>
    <div class="header-placeholder"></div>
  </header>
  
  <!-- Tab切换 -->
  <div class="playlists-tabs">
    <button 
      class="tab-item" 
      :class="{ 'tab-active': currentTab === 'created' }"
      @click="switchTab('created')"
    >
      创建的歌单
    </button>
    <button 
      class="tab-item" 
      :class="{ 'tab-active': currentTab === 'collected' }"
      @click="switchTab('collected')"
    >
      收藏的歌单
    </button>
  </div>
    
    <main class="playlists-content">
      <div v-if="loading" class="playlists-loading">
        <Loading :visible="true" />
      </div>
      <div v-else-if="filteredPlaylists.length === 0" class="playlists-empty">
        <p>暂无歌单</p>
      </div>
      <div v-else class="playlists-list">
        <div
          v-for="playlist in filteredPlaylists"
          :key="playlist.id"
          class="playlist-item"
          @click="goToPlaylist(playlist.id)"
        >
          <img
            :src="getImageUrl(playlist.coverImgUrl, 120, 120)"
            :alt="playlist.name"
            class="item-cover"
          />
          <div class="item-info">
            <p class="info-name text-ellipsis">{{ playlist.name }}</p>
            <p class="info-count">{{ playlist.trackCount }}首</p>
          </div>
          <svg class="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IPlaylist } from '@/types'
import { getImageUrl } from '@/utils/lyric'
import Loading from '@/components/Loading.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const playlists = ref<IPlaylist[]>([])
const loading = ref(false)
// 从URL参数中获取当前tab状态
const currentTab = ref((route.query.tab as string) || 'created')

// 计算属性：根据当前tab过滤歌单
const filteredPlaylists = computed(() => {
  if (!playlists.value.length) return []
  
  if (currentTab.value === 'created') {
    // 创建的歌单：用户是创建者且不是收藏歌单
    return playlists.value.filter(p => 
      (p as any).userId === userStore.userId && 
      !(p as any).specialType
    )
  } else {
    // 收藏的歌单：用户不是创建者或者是收藏歌单
    return playlists.value.filter(p => 
      (p as any).userId !== userStore.userId || 
      (p as any).specialType === 5
    )
  }
})

const fetchPlaylists = async () => {
  if (!userStore.userId) return
  loading.value = true
  try {
    const res = await api.getUserPlaylist(userStore.userId, 100)
    if (res.code === 200) {
      playlists.value = res.playlist
    }
  } catch (error) {
    console.error('获取歌单失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换tab
const switchTab = (tab: string) => {
  currentTab.value = tab
  
  // 更新URL参数
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'created' ? undefined : tab
    }
  })
}

const goToPlaylist = (id: number) => router.push(`/playlist/${id}`)
const goBack = () => router.back()

// 监听路由参数变化
watch(() => route.query.tab, (newTab) => {
  const tabValue = Array.isArray(newTab) ? newTab[0] : newTab
  if (tabValue && tabValue !== currentTab.value) {
    currentTab.value = tabValue
  } else if (!tabValue && currentTab.value !== 'created') {
    currentTab.value = 'created'
  }
})

onMounted(fetchPlaylists)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlists-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.playlists-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: rgba($bg-primary, 0.95);
  backdrop-filter: blur(1.25rem /* 20px */);
}

.playlists-tabs {
  display: flex;
  border-bottom: 0.125rem /* 1px */ solid $border-light;
  background: $bg-primary;
  position: sticky;
  top: 3.75rem /* 60px */;
  z-index: $z-sticky - 1;
}

.tab-item {
  flex: 1;
  padding: $spacing-md 0;
  font-size: $font-size-md;
  color: $text-secondary;
  background: transparent;
  border: none;
  position: relative;
  transition: color 0.2s;
  
  &.tab-active {
    color: $primary-color;
    font-weight: 500;
  }
  
  &.tab-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 1.875rem /* 30px */;
    height: 0.25rem /* 3px */;
    background: $primary-color;
    border-radius: 0.25rem /* 3px */ 0.25rem /* 3px */ 0 0;
  }
}

.header-back {
  width: 2.5rem /* 40px */;
  height: 2.5rem /* 40px */;
  @include flex-center;
  color: $text-secondary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-card;
  }
  
  svg {
    width: 1.375rem /* 22px */;
    height: 1.375rem /* 22px */;
  }
}

.header-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.header-placeholder {
  width: 2.5rem /* 40px */;
}

.playlists-content {
  padding: $spacing-md $spacing-lg;
}

.playlists-loading {
  padding: $spacing-xl 0;
}

.playlists-empty {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-muted;
  font-size: $font-sm;
}

.playlists-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $bg-card;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-fast $ease-default;
  @include tap-effect;
  
  &:active {
    background: $bg-hover;
  }
}

.item-cover {
  width: 3.5rem /* 56px */;
  height: 3.5rem /* 56px */;
  border-radius: $radius-md;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.info-name {
  font-size: $font-sm;
  color: $text-primary;
  margin-bottom: 0.125rem /* 2px */;
}

.info-count {
  font-size: $font-xs;
  color: $text-tertiary;
}

.item-arrow {
  width: 1rem /* 16px */;
  height: 1rem /* 16px */;
  color: $text-muted;
}
</style>