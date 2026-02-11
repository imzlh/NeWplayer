<template>
  <div class="daily-page">
    <PageHeader title="每日推荐" :default-action="true" />
    
    <main class="daily-content" ref="contentRef">
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
        <button class="action-btn action-random" @click="playRandom">
          <svg fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.5 2A2.5 2.5 0 0 0 10 4.5a.5.5 0 0 1-1 0A3.5 3.5 0 1 1 12.5 8H.5a.5.5 0 0 1 0-1h12a2.5 2.5 0 0 0 0-5zm-7 1a1 1 0 0 0-1 1 .5.5 0 0 1-1 0 2 2 0 1 1 2 2h-5a.5.5 0 0 1 0-1h5a1 1 0 0 0 0-2zM0 9.5A.5.5 0 0 1 .5 9h10.042a3 3 0 1 1-3 3 .5.5 0 0 1 1 0 2 2 0 1 0 2-2H.5a.5.5 0 0 1-.5-.5z"/>
          </svg>
          <span>随机播放</span>
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
            @more="showMoreOptions(song)"
          />
        </div>
      </section>
      
      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import * as api from '@/api'
import type { ISong, ISong2Recommend } from '@/api/types'
import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'
import { showDefaultSongActions } from '@/utils/action'
import { svg } from '@/utils/svg'
import PageHeader from '@/components/common/PageHeader.vue'

const playerStore = usePlayerStore()

const songs = ref<ISong[]>([])
const loading = ref(false)
const today = new Date()

const fetchDailySongs = async () => {
  loading.value = true
  try {
    const res = await api.getDailyRecommendSongs()
    if (res.code === 200 && res.data) {
      const data = res.data;
      songs.value = data.dailySongs.map(song => ({
        ...song,
        artists: song.ar,
        album: song.al,
        duration: song.dt,
        picUrl: song.al?.picUrl,
        reason: data.recommendReasons.find(reason => reason.songId === song.id)?.reason || '',
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

const playRandom = () => {
  if (songs.value.length === 0) return
  const randomIndex = Math.floor(Math.random() * songs.value.length)
  playerStore.playPlaylist(songs.value, randomIndex)
}

const playSong = async (song: ISong, index: number) => {
  await playerStore.play(song)
  if (playerStore.playlist.length === 0 || playerStore.playlist[0].id !== songs.value[0].id) {
    playerStore.setPlaylist(songs.value, index)
  }
}
const showMoreOptions = (song: ISong) => {
  showDefaultSongActions(song, [
    {
      label: (song as ISong2Recommend).recommendReason,
      icon: svg.love,
      callback: () => void 0
    }
  ]);
}

onMounted(fetchDailySongs)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.daily-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.daily-content {
  padding-top: 0;
}

.daily-info {
  position: relative;
  padding: 5rem /* 80px */ $spacing-lg $spacing-lg;
  background: linear-gradient(180deg, rgba($primary-color, 0.3) 0%, $bg-primary 100%);
}

.info-calendar {
  display: flex;
  align-items: baseline;
  gap: 0.25rem /* 4px */;
  margin-bottom: $spacing-sm;
}

.calendar-day {
  font-size: 3rem /* 48px */;
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
  
  &.action-random {
    background: $bg-tertiary;
    color: $text-primary;
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
  gap: 0.125rem /* 2px */;
}

.bottom-spacer {
  height: 5rem /* 80px */;
}
</style>