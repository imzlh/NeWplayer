<template>
  <div
    v-if="playerStore.hasCurrentSong"
    class="mini-player"
    :class="{ 'player-playing': playerStore.isPlaying }"
    @click="goToPlayer"
  >
    <!-- 歌曲封面 -->
    <div class="player-cover">
      <img v-if="playerStore.currentSong?.picUrl"
        :src="getImageUrl(playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl, 60, 60)"
        :alt="playerStore.currentSong?.name"
        class="cover-image"
        :class="{ 'cover-rotating': playerStore.isPlaying }"
      />
    </div>
    
    <!-- 歌曲信息 -->
    <div class="player-info">
      <p class="info-title text-ellipsis">
        {{ playerStore.currentSong?.name }}
      </p>
      <p class="info-artist text-ellipsis">
        {{ playerStore.currentSong?.artists?.map(a => a.name).join(' / ') }}
      </p>
    </div>
    
    <!-- 播放控制 -->
    <div class="player-controls">
      <!-- 私人FM模式的控制按钮 -->
      <template v-if="playerStore.isPersonalFM">
        <button
          class="control-btn"
          @click.stop="togglePlay"
          :disabled="playerStore.isLoading"
        >
          <Loading v-if="playerStore.isLoading" :visible="true" />
          <svg v-else-if="playerStore.isPlaying" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <button class="control-btn" @click.stop="playerStore.trashFMSong()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click.stop="playerStore.skipFMSong()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </template>
      
      <!-- 普通模式的控制按钮 -->
      <template v-else>
        <button
          class="control-btn"
          @click.stop="togglePlay"
          :disabled="playerStore.isLoading"
        >
          <Loading v-if="playerStore.isLoading" :visible="true" />
          <svg v-else-if="playerStore.isPlaying" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click.stop="playerStore.next()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </template>
    </div>
    
    <!-- 进度条 -->
    <div class="player-progress">
      <div
        class="progress-bar"
        :style="{ width: `${playerStore.currentProgressPercent}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { getImageUrl } from '@/utils/lyric'
import Loading from './Loading.vue'

const playerStore = usePlayerStore()
const openPlayer = inject<() => void>('openPlayer')

const togglePlay = async () => {
  await playerStore.togglePlay()
}

const goToPlayer = () => {
  if (openPlayer) {
    openPlayer()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.mini-player {
  position: fixed;
  bottom: 56px;
  left: #{$spacing-lg};
  right: #{$spacing-lg};
  height: 68px;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba($bg-card, 0.6);
  backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  z-index: $z-player - 1;
  cursor: pointer;
  @include tap-effect;
  overflow: hidden;
}

.player-cover {
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #5a5b7b;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform $transition-normal $ease-default;
}

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-title {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.info-artist {
  font-size: $font-xs;
  color: $text-tertiary;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.control-btn {
  width: 36px;
  height: 36px;
  @include flex-center;
  color: $text-primary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: rgba($primary-color, 0.2);
  }
  
  svg {
    width: 22px;
    height: 22px;
  }
  
  &:first-child {
    background: $gradient-primary;
    
    &:active {
      opacity: 0.8;
    }
  }
}

.player-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: $border-color;
  
  .progress-bar {
    height: 100%;
    background: $gradient-primary;
    transition: width $transition-fast linear;
  }
}
</style>