<template>
  <div
    class="player-container"
    :class="{ 'player-playing': playerStore.isPlaying }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 背景 -->
    <div class="player-background">
      <img
        v-if="playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl"
        :src="getHighResImageUrl(playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl)"
        class="bg-image"
        alt=""
      />
      <div class="bg-overlay"></div>
    </div>
    
    <!-- 头部 -->
    <header class="player-header">
      <button class="header-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-info">
        <p class="info-title text-ellipsis">
          {{ playerStore.currentSong?.name || '未在播放' }}
          <span v-if="playerStore.isPersonalFM" class="fm-badge">私人FM</span>
        </p>
        <p class="info-artist text-ellipsis">
          {{ playerStore.currentSong?.artists?.map(a => a.name).join(' / ') || '选择一首歌曲开始播放' }}
        </p>
      </div>
      <button class="header-btn" @click="showMore">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        </svg>
      </button>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="player-main" ref="mainContainer">
      <!-- 唱片区域 -->
      <div
        class="album-area"
        :class="{ 'album-lyric': showLyrics }"
        @click="toggleLyrics"
      >
        <!-- 专辑卡片 -->
        <div class="album-container" :class="{ 'album-playing': playerStore.isPlaying }"
          :style="{ width: containerMax + 'px', height: containerMax + 'px' }"
        >
          <div class="album-card">
            <img
              v-if="playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl"
              :src="getImageUrl(playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl, 300, 300)"
              class="album-image"
              alt=""
            />
            <div v-else class="album-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
        </div>
        <!-- 歌词提示 -->
        <div class="lyric-hint">
          <span>点击显示歌词</span>
        </div>
      </div>
      
      <!-- 歌词区域 -->
      <div
        v-show="showLyrics"
        class="lyrics-area"
        ref="lyricsRef"
        @click="toggleLyrics"
      >
        <div v-if="playerStore.lyrics.length === 0" class="lyrics-empty">
          <p>暂无歌词</p>
        </div>
        <div v-else class="lyrics-list">
          <p
            v-for="(lyric, index) in playerStore.lyrics"
            :key="index"
            class="lyric-line"
            :class="{ 'lyric-active': index === playerStore.currentLyricIndex }"
          >
            {{ lyric.text }}
            <span v-if="lyric.transText" class="lyric-trans">{{ lyric.transText }}</span>
          </p>
        </div>
      </div>
    </main>
    
    <!-- 底部控制区域 -->
    <footer class="player-footer">
      <!-- 歌曲信息 -->
      <div class="song-info">
        <div class="info-left">
          <h3 class="song-name text-ellipsis">{{ playerStore.currentSong?.name || '未在播放' }}</h3>
          <p class="song-artist text-ellipsis">
            {{ playerStore.currentSong?.artists?.map(a => a.name).join(' / ') || '-' }}
          </p>
        </div>
        <button
          class="like-btn"
          :class="{ 'liked': isLiked }"
          @click="toggleLike"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-area">
        <span class="time-current">{{ formatTime(playerStore.progress) }}</span>
        <div
          class="progress-bar"
          ref="progressRef"
          @click="handleProgressClick"
          @touchstart="handleProgressTouchStart"
          @touchmove="handleProgressTouchMove"
          @touchend="handleProgressTouchEnd"
        >
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${playerStore.currentProgressPercent}%` }"
            ></div>
          </div>
          <div
            class="progress-thumb"
            :style="{ left: `${playerStore.currentProgressPercent}%` }"
          ></div>
        </div>
        <span class="time-total">{{ formatTime(playerStore.duration) }}</span>
      </div>
      
      <!-- 控制按钮 -->
      <div class="controls-area">
        <!-- 私人FM模式的控制按钮 -->
        <template v-if="playerStore.isPersonalFM">
          <button class="control-btn btn-trash lg" @click="playerStore.trashFMSong">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          
          <button
            class="control-btn btn-play"
            :class="{ 'btn-loading': playerStore.isLoading }"
            @click="togglePlay"
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
          
          <button class="control-btn btn-skip lg" @click="playerStore.skipFMSong">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </template>
        
        <!-- 普通模式的控制按钮 -->
        <template v-else>
          <button class="control-btn btn-mode" @click="playerStore.togglePlayMode">
            <svg v-if="playerStore.playMode === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h16M4 12l4-4m-4 4l4 4"/>
            </svg>
            <svg v-else-if="playerStore.playMode === 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 3h3v3h-3zM8 3h3v3H8zM5 8h14v12H5z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 2.1l4 4-4 4M3 12.2v-2l11 .1M7 21.9l-4-4 4-4"/>
            </svg>
          </button>
          
          <button class="control-btn btn-prev" @click="playerStore.prev">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button
            class="control-btn btn-play"
            :class="{ 'btn-loading': playerStore.isLoading }"
            @click="togglePlay"
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
          
          <button class="control-btn btn-next" @click="playerStore.next">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          
          <button class="control-btn btn-list" @click="showPlaylist">
            <svg fill="currentColor" viewBox="0 0 16 16">
              <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2z"/>
              <path fill-rule="evenodd" d="M12 3v10h-1V3h1z"/>
              <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1V2.82z"/>
              <path fill-rule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
        </template>
      </div>
      </footer>
      
      <!-- 播放列表弹窗 -->
      <Transition name="slide-up">
        <div v-if="showPlaylistModal" class="playlist-modal" @click="showPlaylistModal = false">
        <div class="playlist-panel" @click.stop>
          <div class="panel-header">
            <h3>播放列表 ({{ playerStore.playlist.length }})</h3>
            <button class="clear-btn" @click="playerStore.clearPlaylist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              清空
            </button>
          </div>
          <div class="panel-list">
            <div
              v-for="(song, index) in playerStore.playlist"
              :key="song.id"
              class="panel-item"
              :class="{ 'item-active': playerStore.currentSong?.id === song.id }"
              @click="playAtIndex(index)"
            >
              <div class="item-info">
                <p class="item-name text-ellipsis">{{ song.name }}</p>
                <p class="item-artist text-ellipsis">{{ song.artists?.map(a => a.name).join(' / ') }}</p>
              </div>
              <button class="item-remove" @click.stop="removeSong(index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- 评论组件 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <Comment
          v-if="showComments && playerStore.currentSong"
          :resource-id="playerStore.currentSong.id"
          resource-type="song"
          @close="showComments = false"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import { formatTime, getImageUrl, getHighResImageUrl, getSwipeDirection } from '@/utils/lyric'
import Loading from '@/components/Loading.vue'
import Comment from '@/components/Comment.vue'
import { showAction } from '@/stores/action'
import { getSongUrl } from '@/api'
import { svg } from '@/utils/svg'
import router from '@/router'

const emit = defineEmits<{
  close: []
}>()

const playerStore = usePlayerStore()
const userStore = useUserStore()

// 状态
const showLyrics = ref(false)
const showPlaylistModal = ref(false)
const showComments = ref(false)
const lyricsRef = ref<HTMLElement>()
const progressRef = ref<HTMLElement>()
const isDragging = ref(false)

// 触摸相关
const touchStartX = ref(0)
const touchStartY = ref(0)

// 主容器引用
const mainContainer = ref<HTMLElement>()

// 容器最大尺寸
const containerMax = ref(320)

// 处理窗口大小变化
const handleResize = () => {
  if (mainContainer.value) {
    const size = mainContainer.value.getBoundingClientRect()
    containerMax.value = Math.min(size.width, size.height)
  }
}

// 监听窗口大小变化
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

// 计算属性
const isLiked = computed(() => {
  if (!playerStore.currentSong) return false
  return userStore.isLiked(playerStore.currentSong.id)
})

// 切换播放/暂停
const togglePlay = async () => {
  await playerStore.togglePlay()
}

// 切换歌词显示
const toggleLyrics = () => {
  showLyrics.value = !showLyrics.value
  if (showLyrics.value) {
    nextTick(() => {
      scrollToCurrentLyric()
    })
  }
}

// 滚动到当前歌词
const scrollToCurrentLyric = () => {
  if (!lyricsRef.value) return
  const activeLyric = lyricsRef.value.querySelector('.lyric-active')
  if (activeLyric) {
    activeLyric.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 监听歌词变化
watch(() => playerStore.currentLyricIndex, () => {
  if (showLyrics.value) {
    scrollToCurrentLyric()
  }
})

// 进度条点击
const handleProgressClick = (e: MouseEvent) => {
  if (!progressRef.value || !playerStore.duration) return
  const rect = progressRef.value.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const time = percent * playerStore.duration
  playerStore.seek(time)
}

// 进度条触摸
const handleProgressTouchStart = (_e: TouchEvent) => {
  isDragging.value = true
}

const handleProgressTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || !progressRef.value || !playerStore.duration) return
  const rect = progressRef.value.getBoundingClientRect()
  const clientX = e.touches[0].clientX
  const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const time = percent * playerStore.duration
  playerStore.seek(time)
}

const handleProgressTouchEnd = () => {
  isDragging.value = false
}

// 显示播放列表
const showPlaylist = () => {
  showPlaylistModal.value = true
}

// 播放指定索引
const playAtIndex = (index: number) => {
  playerStore.playAtIndex(index)
}

// 移除歌曲
const removeSong = (index: number) => {
  playerStore.removeFromPlaylist(index)
}

// 显示分享
const showMore = () => {
  if (!playerStore.currentSong) return
  
  showAction([
    {
      label: '查看评论',
      value: 'comments',
      icon: svg.comment
    },
    ...playerStore.currentSong.artists.map(artist => ({
      value: 'artist.' + artist.id,
      label: '歌手: ' + artist.name,
      icon: artist.picUrl
        ? `<img src="${artist.picUrl}" alt="${artist.name}" width="24" height="24">`
        : svg.people
    })),
    {
      value: 'album',
      label: '专辑: ' + playerStore.currentSong.album.name,
      icon: playerStore.currentSong.album.picUrl
        ? `<img src="${playerStore.currentSong.album.picUrl}" alt="${playerStore.currentSong.album.name}" width="24" height="24">`
        : svg.album
    },
    {
      label: '收藏',
      value: 'favorite',
      icon: svg.love
    },
    {
      label: '下载',
      value: 'download',
      icon: svg.download
    },
    {
      label: '分享',
      value: 'share',
      icon: svg.share
    }
  ], (option) => {
    if (!option) return
    
    switch (option.value) {
      case 'comments':
        showComments.value = true
        break
      case 'favorite':
        toggleLike()
        break
      case 'download':
        // 下载歌曲
        if (playerStore.currentSong?.privilege?.id) {
          getSongUrl(playerStore.currentSong.privilege.id, 320000)
            .then(u => u.data?.sort((a, b) => b.br - a.br)[0])
            .then(e => window.open(e?.url))
        }
        break
      case 'share':
        // TODO: 实现分享功能
        console.log('分享功能待实现')
        break
      case 'album':
        if (playerStore.currentSong)
          router.push({
            name: 'Album',
            params: {
              id: playerStore.currentSong.album.id
            }
          });
        emit('close')
        break
      default:
        const id = option.value.split('.').pop()
        if (id) {
          router.push({
            name: 'Artist',
            params: {
              id
            }
          });
        }
        emit('close')
        break
    }
  })
}

// 切换喜欢
const toggleLike = async () => {
  if (!playerStore.currentSong) return
  await userStore.toggleLike(playerStore.currentSong.id)
}

// 页面触摸事件（切歌）
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (_e: TouchEvent) => {
  // 防止默认行为
}

const handleTouchEnd = (e: TouchEvent) => {
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  
  const direction = getSwipeDirection(touchStartX.value, touchStartY.value, endX, endY)
  
  if (direction === 'left') {
    playerStore.next()
  } else if (direction === 'right') {
    playerStore.prev()
  }
}

// 返回
const goBack = () => {
  emit('close')
}

onMounted(() => {
  playerStore.initAudio()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.player-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  max-width: $screen-width;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: $z-modal;
  background: $bg-primary;
}

.player-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  
  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(60px) brightness(0.4);
    transform: scale(1.2);
  }
  
  .bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
  }
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  padding-top: calc(#{$spacing-md} + env(safe-area-inset-top));
}

.header-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.header-info {
  flex: 1;
  text-align: center;
  padding: 0 $spacing-md;
}

.info-title {
  font-size: $font-md;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
}

.fm-badge {
  font-size: $font-xs;
  padding: 2px 8px;
  background: $gradient-primary;
  color: white;
  border-radius: $radius-full;
  font-weight: 400;
}

.info-artist {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.6);
}

.player-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.album-area {
  flex: 1;
  position: relative;
  transition: all $transition-normal $ease-default;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  padding: 0 $spacing-lg;

  > *{
    margin: auto;
    max-width: 94vw;
    max-height: 100%;
  }
  
  &.album-lyric {
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
  }
}

.album-container {
  position: relative;
  width: 80vw;
  height: 80vw;
  max-width: 320px;
  max-height: 320px;
}

.album-card {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  background: $bg-card;
  transition: all $transition-normal $ease-default;
  box-sizing: border-box;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  }
}

.album-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-placeholder {
  width: 100%;
  height: 100%;
  @include flex-center;
  color: $text-muted;
  background: $bg-card;
  
  svg {
    width: 60px;
    height: 60px;
  }
}

.lyric-hint {
  margin-top: $spacing-xl;
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.4);
}

.lyrics-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $spacing-lg;
  overflow-y: auto;
  @include scrollbar;
}

.lyrics-empty {
  height: 100%;
  @include flex-center;
  color: rgba(255, 255, 255, 0.4);
  font-size: $font-sm;
}

.lyrics-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: 50% 0;
}

.lyric-line {
  text-align: center;
  font-size: $font-md;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  transition: all $transition-fast $ease-default;
  
  &.lyric-active {
    font-size: $font-lg;
    color: white;
    font-weight: 500;
  }
}

.lyric-trans {
  display: block;
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.player-footer {
  padding: $spacing-lg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.info-left {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: $font-xl;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.song-artist {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.6);
}

.like-btn {
  width: 40px;
  height: 40px;
  @include flex-center;
  color: rgba(255, 255, 255, 0.6);
  transition: all $transition-fast $ease-default;
  
  &.liked {
    color: $primary-color;
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
}

.progress-area {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.time-current,
.time-total {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 36px;
}

.time-current {
  text-align: left;
}

.time-total {
  text-align: right;
}

.progress-bar {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $primary-color;
  border-radius: $radius-full;
  transition: width $transition-fast linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: left $transition-fast linear;
}

.controls-area {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.control-btn {
  @include flex-center;
  color: white;
  transition: all $transition-fast $ease-default;
  
  &:active {
    transform: scale(0.9);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }

  &.lg svg {
    width: 32px;
    height: 32px;
  }
  
  &.btn-trash {
    color: #ff4757;
  }
  
  &.btn-skip {
    color: $primary-color;
  }
  
  &.btn-mode,
  &.btn-list {
    width: 40px;
    height: 40px;
    opacity: 0.7;
  }
  
  &.btn-prev,
  &.btn-next {
    width: 50px;
    height: 50px;
    
    svg {
      width: 32px;
      height: 32px;
    }
  }
  
  &.btn-play {
    width: 64px;
    height: 64px;
    background: $gradient-primary;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba($primary-color, 0.4);
    
    svg {
      width: 28px;
      height: 28px;
    }
    
    &.btn-loading {
      background: $bg-hover;
    }
  }
}

// 播放列表弹窗
.playlist-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
}

.playlist-panel {
  width: 100%;
  max-height: 60vh;
  background: $bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid $border-color;
  
  h3 {
    font-size: $font-md;
    font-weight: 500;
    color: $text-primary;
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-sm;
  color: $text-tertiary;
  
  svg {
    width: 16px;
    height: 16px;
  }
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-sm 0;
  @include scrollbar;
}

.panel-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
  }
  
  &.item-active {
    .item-name {
      color: $primary-color;
    }
  }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: $font-sm;
  color: $text-primary;
  margin-bottom: 2px;
}

.item-artist {
  font-size: $font-xs;
  color: $text-tertiary;
}

.item-remove {
  width: 32px;
  height: 32px;
  @include flex-center;
  color: $text-muted;
  
  svg {
    width: 16px;
    height: 16px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all $transition-normal $ease-default;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  
  .playlist-panel {
    transform: translateY(100%);
  }
}
</style>