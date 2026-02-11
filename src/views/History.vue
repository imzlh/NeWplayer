<template>
  <div class="history-page">
    <PageHeader title="播放历史" :default-action="true" />
    
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
import { usePlayerStore } from '@/stores/player'
import type { ISong, ISongDetail } from '@/api/types'
import SongListItem from '@/components/SongListItem.vue'
import { shallowRef } from 'vue'
import { getUserRecord } from '@/api'
import { useUserStore } from '@/stores/user'
import { songDetail2Song } from '@/api/helper'
import PageHeader from '@/components/common/PageHeader.vue'

const playerStore = usePlayerStore()
const userStore = useUserStore();
const playHistory = shallowRef<ISongDetail[]>([]);

const playSong = async (song: ISong) => {
  await playerStore.playFromHistory(song)
}

getUserRecord(userStore.userId, 0).then(res => {
  playHistory.value = res.allData?.map(e => e.song) || [];
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.history-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
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
