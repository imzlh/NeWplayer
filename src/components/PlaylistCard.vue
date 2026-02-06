<template>
  <div class="playlist-card" @click="handleClick">
    <div class="card-cover">
      <img
        :src="getImageUrl(playlist.coverImgUrl, 200, 200)"
        :alt="playlist.name"
        class="cover-image"
        loading="lazy"
      />
      <div class="cover-overlay">
        <div class="play-count">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>{{ formatNumber(playlist.playCount || 0) }}</span>
        </div>
      </div>
    </div>
    <p class="card-name text-ellipsis-2">{{ playlist.name }}</p>
  </div>
</template>

<script setup lang="ts">
import type { IPlaylist } from '@/api/types'
import { getImageUrl, formatNumber } from '@/utils/lyric'

interface Props {
  playlist: IPlaylist
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [playlist: IPlaylist]
}>()

const handleClick = () => {
  emit('click', props.playlist)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlist-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  cursor: pointer;
  @include tap-effect;
}

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: $radius-lg;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.5) 100%);
    pointer-events: none;
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform $transition-normal $ease-default;
  
  .playlist-card:hover & {
    transform: scale(1.05);
  }
}

.cover-overlay {
  position: absolute;
  top: $spacing-xs;
  right: $spacing-xs;
  z-index: 1;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 0.125rem /* 2px */;
  padding: 0.125rem /* 2px */ 0.375rem /* 6px */;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.25rem /* 4px */);
  border-radius: $radius-full;
  font-size: 0.625rem /* 10px */;
  color: $text-primary;
  
  svg {
    width: 0.625rem /* 10px */;
    height: 0.625rem /* 10px */;
  }
}

.card-name {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.4;
  min-height: 2.8em;
}
</style>