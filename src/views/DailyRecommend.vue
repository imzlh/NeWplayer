<template>
  <div class="daily-page">
    <header class="daily-header" :class="{ 'header-scrolled': headerScrolled }">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title" :class="{ 'title-visible': headerScrolled }">每日推荐</h1>
      <div class="header-placeholder"></div>
    </header>
    
    <main class="daily-content" ref="contentRef" @scroll="handleScroll">
      <section class="daily-info">
        <div class="info-calendar">
          <span class="calendar-day">{{ today.getDate() }}</span>
          <span class="calendar-month">/{{ today.getMonth() + 1 }}月</span>
        </div>
        <p class="info-tip">根据你的音乐口味生成，每天6:00更新</p>
      </section>
      
      <section class="daily-actions">
        <button class="action-btn action-playall" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>播放全部</span>
        </button>
      </section>
      
      <section class="daily-songs">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import * as api from '@/api'
import type { IDailySong, ISong } from '@/types'
import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'

const router = useRouter()
const playerStore = usePlayerStore()

const songs = ref<ISong[]>([])
const loading = ref(false)
const headerScrolled = ref(false)
const contentRef = ref<HTMLElement>()
const today = new Date()

const fetchDailySongs = async () => {
  loading.value = true
  try {
    const res = await api.getDailyRecommendSongs()
    if (res.code === 200 && res.data) {
      const data = res.data as { dailySongs: IDailySong[]; recommendReasons: any[] }
      songs.value = data.dailySongs.map((song: any) => ({
        ...song,
        artists: song.ar,
        album: song.al,
        duration: song.dt,
        picUrl: song.al?.picUrl,
        reason: song.reason,
      }))
    }
  } catch (error) {
    console.error('获取每日推荐失败:', error)
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

const handleScroll = () => {
  if (contentRef.value) {
    headerScrolled.value = contentRef.value.scrollTop > 100
  }
}

const goBack = () => router.back()

onMounted(fetchDailySongs)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.daily-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.daily-header {
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
  
  &.title-visible {
    opacity: 1;
  }
}

.header-placeholder {
  width: 36px;
}

.daily-content {
  padding-top: 0;
}

.daily-info {
  position: relative;
  padding: 80px $spacing-lg $spacing-lg;
  background: linear-gradient(180deg, rgba($primary-color, 0.3) 0%, $bg-primary 100%);
}

.info-calendar {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: $spacing-sm;
}

.calendar-day {
  font-size: 48px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.calendar-month {
  font-size: $font-lg;
  color: $text-secondary;
}

.info-tip {
  font-size: $font-sm;
  color: $text-tertiary;
}

.daily-actions {
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
  
  &.action-playall {
    background: $gradient-primary;
    color: white;
  }
}

.daily-songs {
  padding: $spacing-md $spacing-lg;
}

.songs-loading {
  padding: $spacing-xl 0;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bottom-spacer {
  height: 80px;
}
</style>