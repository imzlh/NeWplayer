<template>
  <div
    class="song-item"
    :class="{
      'song-active': isActive,
      'song-playing': isPlaying,
      'song-disabled': !canPlay,
    }"
    @click="handleClick"
  >
    <!-- 序号/播放图标 -->
    <div class="song-index">
      <div v-if="showCheckbox" class="song-checkbox" :class="{ checked: isSelected }" @click.stop="handleSelect">
        <svg v-if="isSelected" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7.59 17.59 9 16.17z"/>
        </svg>
      </div>
      <span v-else-if="!isPlaying" class="index-number">{{ index + 1 }}</span>
      <div v-else class="playing-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    
    <!-- 歌曲信息 -->
    <div class="song-info">
      <p class="info-name text-ellipsis" :class="{ 'name-vip': isVip }">
        {{ props.song.name }}
        <span v-if="props.song.fee === 1" class="vip-tag">VIP</span>
      </p>
      <p class="info-artist text-ellipsis">
        <span v-if="!canPlay" class="no-copyright">试听</span>
        {{ props.song.artists?.map(a => a.name).join(' / ') }}
        <span class="artist-split">-</span>
        {{ props.song.album?.name }}
      </p>
    </div>
    
    <!-- 更多操作 -->
    <button
      v-if="showMore"
      class="song-more"
      @click.stop="handleMoreClick"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="5" r="1"/>
        <circle cx="12" cy="12" r="1"/>
        <circle cx="12" cy="19" r="1"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ISong } from '@/types'

interface Props {
  song: ISong
  index: number
  isActive?: boolean
  isPlaying?: boolean
  showMore?: boolean
  isSelected?: boolean
  showCheckbox?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isPlaying: false,
  showMore: true,
  isSelected: false,
  showCheckbox: false,
})

const emit = defineEmits<{
  click: [song: ISong]
  more: [song: ISong, event: MouseEvent]
  select: [songId: number]
}>()

const isVip = computed(() => props.song.fee === 1)
const canPlay = computed(() => (props.song.privilege?.pl && props.song.privilege?.pl > 0) || props.song.fee !== 1)

const handleClick = () => {
  emit('click', props.song)
}

const handleSelect = () => {
  emit('select', props.song.id)
}

const handleMoreClick = (event: MouseEvent) => {
  emit('more', props.song, event)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.song-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  transition: all $transition-fast $ease-default;
  cursor: pointer;
  @include tap-effect;
  
  &:hover {
    background: $bg-hover;
  }
  
  &.song-active {
    background: rgba($primary-color, 0.1);
    
    .info-name {
      color: $primary-color;
    }
  }
  
  &.song-disabled {
    opacity: 0.5;
    
    .info-name {
      color: $text-muted;
    }
  }
}

.song-index {
  width: 28px;
  height: 28px;
  @include flex-center;
  flex-shrink: 0;
}

.song-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $border-color;
  border-radius: $radius-sm;
  @include flex-center;
  transition: all $transition-fast $ease-default;
  
  &.checked {
    background: $primary-color;
    border-color: $primary-color;
    
    svg {
      width: 14px;
      height: 14px;
      color: white;
    }
  }
}

.index-number {
  font-size: $font-sm;
  color: $text-tertiary;
}

.playing-icon {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 16px;
  
  span {
    width: 3px;
    background: $primary-color;
    border-radius: $radius-sm;
    animation: sound-wave 0.8s ease-in-out infinite;
    
    &:nth-child(1) {
      height: 8px;
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      height: 14px;
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      height: 10px;
      animation-delay: 0.4s;
    }
  }
}

@keyframes sound-wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.5);
  }
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.vip-tag {
  font-size: 9px;
  padding: 1px 4px;
  background: $warning-color;
  color: $bg-primary;
  border-radius: $radius-sm;
  font-weight: 600;
}

.info-artist {
  font-size: $font-xs;
  color: $text-tertiary;
}

.no-copyright {
  color: $error-color;
  margin-right: $spacing-xs;
}

.artist-split {
  margin: 0 4px;
  color: $text-muted;
}

.song-more {
  width: 32px;
  height: 32px;
  @include flex-center;
  color: $text-tertiary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
    color: $text-primary;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
}
</style>