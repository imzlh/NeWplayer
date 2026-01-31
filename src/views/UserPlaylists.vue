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
    
    <main class="playlists-content">
      <div v-if="loading" class="playlists-loading">
        <Loading :visible="true" />
      </div>
      <div v-else-if="playlists.length === 0" class="playlists-empty">
        <p>暂无歌单</p>
      </div>
      <div v-else class="playlists-list">
        <div
          v-for="playlist in playlists"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IPlaylist } from '@/types'
import { getImageUrl } from '@/utils/lyric'
import Loading from '@/components/Loading.vue'

const router = useRouter()
const userStore = useUserStore()

const playlists = ref<IPlaylist[]>([])
const loading = ref(false)

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

const goToPlaylist = (id: number) => router.push(`/playlist/${id}`)
const goBack = () => router.back()

onMounted(fetchPlaylists)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlists-page {
  min-height: 100vh;
  padding-bottom: 120px;
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
  backdrop-filter: blur(20px);
}

.header-back {
  width: 40px;
  height: 40px;
  @include flex-center;
  color: $text-secondary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-card;
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
}

.header-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.header-placeholder {
  width: 40px;
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
  width: 56px;
  height: 56px;
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
  margin-bottom: 2px;
}

.info-count {
  font-size: $font-xs;
  color: $text-tertiary;
}

.item-arrow {
  width: 16px;
  height: 16px;
  color: $text-muted;
}
</style>
