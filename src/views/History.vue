<template>
  <div class="history-page">
    <header class="history-header">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title">播放历史</h1>
    </header>
    
    <main class="history-content">
      <div v-if="playHistory.length === 0" class="history-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <p>暂无播放记录</p>
        <span>去听几首歌吧~</span>
      </div>
      <div v-else class="songs-list">
        <SongListItem
          v-for="(song, index) in playHistory"
          :key="`${song.id}-${index}`"
          :song="songDetail2Song(song)"
          :index="index"
          :is-active="playerStore.currentSong?.id === song.id"
          :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
          @click="playSong(songDetail2Song(song))"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import type { ISong, ISongDetail } from '@/api/types'
import SongListItem from '@/components/SongListItem.vue'
import { shallowRef } from 'vue'
import { getUserRecord } from '@/api'
import { useUserStore } from '@/stores/user'
import { songDetail2Song } from '@/api/helper'

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore();
const playHistory = shallowRef<ISongDetail[]>([]);

const playSong = async (song: ISong) => {
  await playerStore.playFromHistory(song)
}

getUserRecord(userStore.userId, 0).then(res => {
  playHistory.value = res.allData?.map(e => e.song) || [];
});

const goBack = () => router.back()
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.history-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.history-header {
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

.header-back{
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

.history-content {
  padding: $spacing-md $spacing-lg;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl 0;
  color: $text-muted;
  
  svg {
    width: 4rem /* 64px */;
    height: 4rem /* 64px */;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }
  
  p {
    font-size: $font-md;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
  }
  
  span {
    font-size: $font-sm;
  }
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem /* 2px */;
}
</style>
