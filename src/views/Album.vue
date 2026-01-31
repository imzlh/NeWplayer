<template>
  <div class="album-page">
    <header class="album-header" :class="{ 'header-scrolled': headerScrolled }">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title" :class="{ 'title-visible': headerScrolled }">{{ album.name }}</h1>
      <!-- 评论入口 -->
      <div v-if="songs.length > 0" class="comment-entry">
        <button class="comment-btn header-back" @click="showComments = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </header>
    
    <main class="album-content" ref="contentRef" @scroll="handleScroll">
      <section class="album-info">
        <div class="info-cover">
          <img :src="getImageUrl(album.picUrl, 300, 300)" :alt="album.name" class="cover-image"/>
        </div>
        <div class="info-detail">
          <h2 class="detail-name">{{ album.name }}</h2>
          <div class="detail-artist" @click="goToArtist(album.artist?.id)">
            <img :src="getImageUrl(album.artist?.picUrl, 40, 40)" :alt="album.artist?.name" class="artist-avatar"/>
            <span class="artist-name">{{ album.artist?.name }}</span>
          </div>
          <p class="detail-time">{{ formatDate(album.publishTime, 'YYYY-MM-DD') }} 发布</p>
        </div>
      </section>
      
      <section class="album-actions">
        <button class="action-btn action-playall" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>播放全部</span>
        </button>
        <button class="action-btn action-collect" :class="{ 'collected': isCollected }" @click="toggleCollect">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{{ isCollected ? '已收藏' : '收藏' }}</span>
        </button>
      </section>
      
      <section class="album-songs">
        <div class="songs-header">
          <span class="header-count">共 {{ songs.length }} 首</span>
        </div>
        <div v-if="loading" class="songs-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="songs-list">
          <SongListItem
            v-for="(song, index) in songs"
            :key="song.id"
            :song="song"
            :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
            @click="playSong(song, index)"
          />
        </div>
      </section>
      
      <div class="bottom-spacer"></div>
    </main>
    
    <!-- 评论组件 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <Comment
          v-if="showComments"
          :resource-id="albumId"
          resource-type="album"
          @close="showComments = false"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IAlbum as AlbumType, ISong } from '@/types'
import { getImageUrl, formatDate } from '@/utils/lyric'
import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'
import Comment from '@/components/Comment.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const albumId = computed(() => Number(route.params.id))
const album = ref<AlbumType>({ id: 0, name: '', picUrl: '', publishTime: 0 })
const songs = ref<ISong[]>([])
const loading = ref(false)
const headerScrolled = ref(false)
const isCollected = ref(false)

// 评论相关状态
const showComments = ref(false)
const contentRef = ref<HTMLElement>()

const fetchAlbum = async () => {
  loading.value = true
  try {
    const res = await api.getAlbum(albumId.value)
    if (res.code === 200) {
      album.value = res.album
      songs.value = res.songs.map((song: any) => ({
        ...song,
        artists: song.ar,
        album: song.al,
        duration: song.dt,
        picUrl: song.al?.picUrl,
      }))
    }
  } catch (error) {
    console.error('获取专辑失败:', error)
  } finally {
    loading.value = false
  }
}

const playAll = () => {
  if (songs.value.length === 0) return
  playerStore.playPlaylist(songs.value, 0)
}

const playSong = async (song: ISong, index: number) => {
  await playerStore.play(song)
  if (playerStore.playlist.length === 0 || playerStore.playlist[0].id !== songs.value[0].id) {
    playerStore.setPlaylist(songs.value, index)
  }
}

const toggleCollect = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const t = isCollected.value ? 0 : 1
    const res = await api.subscribeAlbum(albumId.value, t)
    if (res.code === 200) {
      isCollected.value = !isCollected.value
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

const handleScroll = () => {
  if (contentRef.value) {
    headerScrolled.value = contentRef.value.scrollTop > 150
  }
}

const goBack = () => router.back()
const goToArtist = (id?: number) => id && router.push(`/artist/${id}`)

onMounted(fetchAlbum)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.album-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.album-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $screen-width;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  z-index: $z-sticky;
  transition: all $transition-normal $ease-default;
  
  &.header-scrolled {
    background: rgba($bg-primary, 0.95);
    backdrop-filter: blur(1.25rem /* 20px */);
  }
}

.header-back {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.625rem /* 10px */);
  
  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
  }
}

.header-title {
  font-size: $font-md;
  font-weight: 500;
  color: white;
  opacity: 0;
  transition: opacity $transition-normal $ease-default;
  @include text-ellipsis;
  max-width: 12.5rem /* 200px */;
  
  &.title-visible {
    opacity: 1;
  }
}

.header-placeholder {
  width: 2.25rem /* 36px */;
}

.album-content {
  padding-top: 0;
}

.album-info {
  position: relative;
  padding: 5rem /* 80px */ $spacing-lg $spacing-lg;
  background: linear-gradient(180deg, rgba($primary-color, 0.3) 0%, $bg-primary 100%);
  display: flex;
  gap: $spacing-md;
}

.info-cover {
  width: 7.5rem /* 120px */;
  height: 7.5rem /* 120px */;
  border-radius: $radius-lg;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: $shadow-lg;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.detail-name {
  font-size: $font-lg;
  font-weight: 600;
  color: white;
  line-height: 1.3;
}

.detail-artist {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
}

.artist-avatar {
  width: 1.5rem /* 24px */;
  height: 1.5rem /* 24px */;
  border-radius: 50%;
  object-fit: cover;
}

.artist-name {
  font-size: $font-sm;
  color: $text-secondary;
}

.detail-time {
  font-size: $font-xs;
  color: $text-tertiary;
}

.album-actions {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-bottom: 0.125rem /* 1px */ solid $border-color;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  padding: $spacing-sm;
  border-radius: $radius-full;
  font-size: $font-sm;
  font-weight: 500;
  transition: all $transition-fast $ease-default;
  
  svg {
    width: 1.125rem /* 18px */;
    height: 1.125rem /* 18px */;
  }
  
  &.action-playall {
    background: $gradient-primary;
    color: white;
  }
  
  &.action-collect {
    background: $bg-card;
    color: $text-secondary;
    
    &.collected {
      color: $primary-color;
    }
  }
}

.album-songs {
  padding: $spacing-md $spacing-lg;
}

.songs-header {
  margin-bottom: $spacing-sm;
}

.header-count {
  font-size: $font-sm;
  color: $text-tertiary;
}

.songs-loading {
  padding: $spacing-xl 0;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem /* 2px */;
}

.bottom-spacer {
  height: 5rem /* 80px */;
}
</style>