<template>
  <div class="artist-page">
    <header class="artist-header" :class="{ 'header-scrolled': headerScrolled }">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title" :class="{ 'title-visible': headerScrolled }">{{ artist.name }}</h1>
      <div class="header-placeholder"></div>
    </header>
    
    <main class="artist-content" ref="contentRef" @scroll="handleScroll">
      <section class="artist-info">
        <div class="info-cover">
          <img :src="getImageUrl(artist.picUrl, 300, 300)" :alt="artist.name" class="cover-image"/>
        </div>
        <h2 class="info-name">{{ artist.name }}</h2>
        <p v-if="artistDesc" class="info-desc text-ellipsis-2">{{ artistDesc }}</p>
      </section>
      
      <section class="artist-actions">
        <button class="action-btn action-follow" :class="{ 'followed': isFollowed }" @click="toggleFollow">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{{ isFollowed ? '已关注' : '关注' }}</span>
        </button>
        <button class="action-btn action-playall" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>播放热门</span>
        </button>
      </section>
      
      <section class="artist-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ 'tab-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.name }}
        </button>
      </section>
      
      <!-- 热门歌曲 -->
      <section v-if="activeTab === 'songs'" class="tab-content">
        <div v-if="loading" class="content-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="songs-list">
          <SongListItem
            v-for="(song, index) in hotSongs"
            :key="song.id"
            :song="song"
            :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
            @click="playSong(song, index)"
          />
        </div>
      </section>
      
      <!-- 专辑 -->
      <section v-else-if="activeTab === 'albums'" class="tab-content">
        <div v-if="loading" class="content-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="albums-grid">
          <div
            v-for="album in albums"
            :key="album.id"
            class="album-card"
            @click="goToAlbum(album.id)"
          >
            <img :src="getImageUrl(album.picUrl, 200, 200)" :alt="album.name" class="album-image"/>
            <span class="album-name text-ellipsis">{{ album.name }}</span>
            <span class="album-time">{{ formatDate(album.publishTime, 'YYYY-MM-DD') }}</span>
          </div>
        </div>
      </section>
      
      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IArtist as ArtistType, ISong, IAlbum } from '@/types'
import { getImageUrl, formatDate } from '@/utils/lyric'
import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const artistId = computed(() => Number(route.params.id))
const artist = ref<ArtistType>({ id: 0, name: '', picUrl: '' })
const hotSongs = ref<ISong[]>([])
const albums = ref<IAlbum[]>([])
const artistDesc = ref('')
const loading = ref(false)
const headerScrolled = ref(false)
const isFollowed = ref(false)
const activeTab = ref('songs')
const contentRef = ref<HTMLElement>()

const tabs = [
  { key: 'songs', name: '热门歌曲' },
  { key: 'albums', name: '专辑' },
]

const fetchArtist = async () => {
  loading.value = true
  try {
    // 获取歌手详情和热门歌曲
    const songsRes = await api.getArtistSongs(artistId.value, 50)
    if (songsRes.code === 200) {
      artist.value = songsRes.artist
      hotSongs.value = songsRes.hotSongs.map((song: any) => ({
        ...song,
        artists: song.ar,
        album: song.al,
        duration: song.dt,
        picUrl: song.al?.picUrl,
      }))
    }
    
    // 获取歌手描述
    const descRes = await api.getArtistDesc(artistId.value)
    if (descRes.code === 200) {
      artistDesc.value = descRes.briefDesc || ''
    }
    
    // 获取专辑
    await fetchAlbums()
  } catch (error) {
    console.error('获取歌手信息失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchAlbums = async () => {
  try {
    const res = await api.getArtistAlbums(artistId.value, 20)
    if (res.code === 200) {
      albums.value = res.hotAlbums
    }
  } catch (error) {
    console.error('获取专辑失败:', error)
  }
}

const playAll = () => {
  if (hotSongs.value.length === 0) return
  playerStore.playPlaylist(hotSongs.value, 0)
}

const playSong = async (song: ISong, index: number) => {
  await playerStore.play(song)
  if (playerStore.playlist.length === 0 || playerStore.playlist[0].id !== hotSongs.value[0].id) {
    playerStore.setPlaylist(hotSongs.value, index)
  }
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const t = isFollowed.value ? 0 : 1
    const res = await api.subscribeArtist(artistId.value, t)
    if (res.code === 200) {
      isFollowed.value = !isFollowed.value
    }
  } catch (error) {
    console.error('关注操作失败:', error)
  }
}

const handleScroll = () => {
  if (contentRef.value) {
    headerScrolled.value = contentRef.value.scrollTop > 150
  }
}

const goBack = () => router.back()
const goToAlbum = (id: number) => router.push(`/album/${id}`)

watch(activeTab, (newTab) => {
  if (newTab === 'albums' && albums.value.length === 0) {
    fetchAlbums()
  }
})

onMounted(fetchArtist)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.artist-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.artist-header {
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
    backdrop-filter: blur(20px);
  }
}

.header-back {
  width: 36px;
  height: 36px;
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.header-title {
  font-size: $font-md;
  font-weight: 500;
  color: white;
  opacity: 0;
  transition: opacity $transition-normal $ease-default;
  @include text-ellipsis;
  max-width: 200px;
  
  &.title-visible {
    opacity: 1;
  }
}

.header-placeholder {
  width: 36px;
}

.artist-content {
  padding-top: 0;
}

.artist-info {
  position: relative;
  padding: 80px $spacing-lg $spacing-lg;
  background: linear-gradient(180deg, rgba($primary-color, 0.3) 0%, $bg-primary 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.info-cover {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-lg;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-name {
  font-size: $font-xl;
  font-weight: 600;
  color: white;
  margin-bottom: $spacing-xs;
}

.info-desc {
  font-size: $font-sm;
  color: $text-tertiary;
  max-width: 280px;
}

.artist-actions {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid $border-color;
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
    width: 18px;
    height: 18px;
  }
  
  &.action-follow {
    background: $bg-card;
    color: $text-secondary;
    
    &.followed {
      color: $primary-color;
    }
  }
  
  &.action-playall {
    background: $gradient-primary;
    color: white;
  }
}

.artist-tabs {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.tab-item {
  padding: $spacing-sm 0;
  font-size: $font-sm;
  color: $text-tertiary;
  position: relative;
  transition: color $transition-fast $ease-default;
  
  &.tab-active {
    color: $primary-color;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: $primary-color;
      border-radius: $radius-full;
    }
  }
}

.tab-content {
  padding: $spacing-md $spacing-lg;
}

.content-loading {
  padding: $spacing-xl 0;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.album-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  cursor: pointer;
  @include tap-effect;
}

.album-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: $radius-md;
  object-fit: cover;
}

.album-name {
  font-size: $font-xs;
  color: $text-secondary;
}

.album-time {
  font-size: 10px;
  color: $text-muted;
}

.bottom-spacer {
  height: 80px;
}
</style>
