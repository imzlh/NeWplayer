<template>
  <div class="player-container" :class="{ 'player-playing': playerStore.isPlaying }" @touchstart="handleTouchStart"
    @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <!-- 背景 -->
    <div class="player-background">
      <img v-if="playerStore.currentSong?.picUrl" :src="getHighResImageUrl(playerStore.currentSong?.picUrl)"
        class="bg-image" alt="" />
      <div class="bg-overlay"></div>
    </div>

    <!-- 头部 -->
    <header class="player-header">
      <button class="header-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="header-info" @click="playerStore.currentSong && showText(playerStore.currentSong.name, '正在播放')">
        <p class="info-title text-ellipsis">
          {{ playerStore.currentSong?.name || '未在播放' }}
          <span v-if="playerStore.isPersonalFM" class="fm-badge">私人FM</span>
        </p>
        <p class="info-artist text-ellipsis">
          {{playerStore.currentSong?.artists?.map(a => a.name).join(' / ') || '选择一首歌曲开始播放'}}
        </p>
      </div>
      <div class="header-spacer"></div>
      <button class="header-btn" @click="showMore">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
          <path
            d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
        </svg>
      </button>
    </header>

    <!-- 主要内容区域 -->
    <main class="player-main" ref="mainContainer">
      <!-- 唱片区域 -->
      <div class="album-area" :class="{ 'album-lyric': showLyrics }" @click="toggleLyrics">
        <!-- 专辑卡片 -->
        <div class="album-container" :class="{ 'album-playing': playerStore.isPlaying }"
          :style="{ width: containerMax + 'px', height: containerMax + 'px' }">
          <div class="album-card">
            <img v-if="playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl"
              :src="getImageUrl(playerStore.currentSong?.picUrl || playerStore.currentSong?.album?.picUrl, 300, 300)"
              class="album-image" alt="" />
            <div v-else class="album-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
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
      <div v-show="showLyrics" class="lyrics-area" ref="lyricsRef" @click="toggleLyrics">
        <div v-if="playerStore.lyrics.length === 0" class="lyrics-empty">
          <p>暂无歌词</p>
        </div>
        <div v-else class="lyrics-list">
          <p v-for="(lyric, index) in playerStore.lyrics" :key="index" class="lyric-line"
            :class="{ 'lyric-active': index === playerStore.currentLyricIndex }">
            {{ lyric.text }}
            <span v-if="lyric.transText" class="lyric-trans">{{ lyric.transText }}</span>
          </p>
        </div>
      </div>
    </main>

    <!-- 底部控制区域 -->
    <footer class="player-footer">
      <!-- 进度条 -->
      <div class="progress-area">
        <span class="time-current">{{ formatTime(playerStore.progress) }}</span>
        <div class="progress-bar" ref="progressRef" @click="handleProgressClick" @touchstart="handleProgressTouchStart"
          @touchmove="handleProgressTouchMove" @touchend="handleProgressTouchEnd">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${playerStore.currentProgressPercent}%` }"></div>
          </div>
          <div class="progress-thumb" :style="{ left: `${playerStore.currentProgressPercent}%` }"></div>
        </div>
        <span class="time-total">{{ formatTime(playerStore.duration) }}</span>
      </div>

      <!-- 控制按钮 -->
      <div class="controls-area">
        <!-- 私人FM模式的控制按钮 -->
        <template v-if="playerStore.isPersonalFM">
          <button class="control-btn btn-trash lg" @click="playerStore.trashFMSong">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>

          <button class="control-btn btn-like" :class="{ 'liked': isLiked }" @click="toggleLike">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>

          <button class="control-btn btn-play" :class="{ 'btn-loading': playerStore.isLoading }" @click="togglePlay">
            <Loading v-if="playerStore.isLoading" :visible="true" />
            <svg v-else-if="playerStore.isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button class="control-btn btn-skip lg" @click="playerStore.skipFMSong">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </template>

        <!-- 普通模式的控制按钮 -->
        <template v-else>
          <button class="control-btn btn-like" :class="{ 'liked': isLiked }" @click="toggleLike">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>

          <button class="control-btn btn-prev" @click="playerStore.prev">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button class="control-btn btn-play" :class="{ 'btn-loading': playerStore.isLoading }" @click="togglePlay">
            <Loading v-if="playerStore.isLoading" :visible="true" />
            <svg v-else-if="playerStore.isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button class="control-btn btn-next" @click="playerStore.next">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button class="control-btn btn-list" @click="showPlaylist">
            <svg fill="currentColor" viewBox="0 0 16 16">
              <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2z" />
              <path fill-rule="evenodd" d="M12 3v10h-1V3h1z" />
              <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1V2.82z" />
              <path fill-rule="evenodd"
                d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5z" />
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
            <div class="panel-actions">
              <button class="control-btn btn-mode" @click="playerStore.togglePlayMode">
                <svg v-if="playerStore.playMode === PlayMode.Random" fill="currentColor" viewBox="0 0 16 16">
                  <path fill-rule="evenodd"
                    d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z" />
                  <path
                    d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z" />
                </svg>
                <svg v-else-if="playerStore.playMode === PlayMode.Sequence" fill="currentColor" viewBox="0 0 16 16">
                  <path fill-rule="evenodd"
                    d="M4.5 11.5A.5.5 0 0 1 5 11h10a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 3 7h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm-2-4A.5.5 0 0 1 1 3h10a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5z" />
                </svg>
                <svg v-else fill="currentColor" viewBox="0 0 16 16">
                  <path
                    d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
                  <path fill-rule="evenodd"
                    d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
                </svg>
              </button>
              <button class="control-btn btn-clear" @click="playerStore.clearPlaylist">
                <svg fill="currentColor" viewBox="0 0 16 16">
                  <path
                    d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path fill-rule="evenodd"
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                </svg>
              </button>
            </div>
          </div>
          <div class="panel-list">
            <div v-for="(song, index) in playerStore.playlist" :key="song.id" class="panel-item"
              :class="{ 'item-active': playerStore.currentSong?.id === song.id }" @click="playAtIndex(index)">
              <div class="item-info">
                <p class="item-name text-ellipsis">{{ song.name }}</p>
                <p class="item-artist text-ellipsis">{{song.artists?.map(a => a.name).join(' / ')}}</p>
              </div>
              <button class="item-remove" @click.stop="removeSong(index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
        <Comment v-if="showComments && playerStore.currentSong" :resource-id="playerStore.currentSong.id"
          resource-type="song" @close="showComments = false" />
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
import { PlayMode } from '@/api/types'
import { showText } from '@/stores/text'

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

// 显示音质选择器
const showQualitySelector = () => nextTick(() => {
  const qualityOptions = playerStore.qualityOptions.map(option => ({
    key: option.value,
    label: option.label,
    value: option.value,
    description: option.description,
    icon: playerStore.currentQuality === option.value ? svg.check : undefined
  }))

  showAction(qualityOptions, q => {
    if (!q) return

    playerStore.setQuality(q.value as number)
    console.log('切换音质:', q)

    // 如果当前正在播放，重新加载音频
    if (playerStore.currentSong && playerStore.isPlaying) {
      const currentTime = playerStore.progress // 保存当前播放位置
      playerStore.isLoading = true

      // 重新获取音频URL并加载
      playerStore.getAudioUrl(playerStore.currentSong.id).then(url => {
        if (url && playerStore.audio) {
          playerStore.audio.src = url
          playerStore.audio.load()
          playerStore.audio.currentTime = currentTime // 恢复播放位置
          playerStore.audio.play().then(() => {
            playerStore.isPlaying = true
          }).catch(error => {
            console.error('重新播放失败:', error)
          })
        }
        playerStore.isLoading = false
      })
    }
  })
});

// 显示更多选项
const showMore = () => {
  if (!playerStore.currentSong) return

  showAction([
    {
      label: '查看评论',
      icon: svg.comment,
      callback: () => {
        showComments.value = true
      }
    },
    {
      label: '音质设置',
      icon: svg.control,
      value: 'noop.quality',
      callback: showQualitySelector
    },
    ...playerStore.currentSong.artists.map(artist => ({
      label: '歌手: ' + artist.name,
      icon: artist.picUrl
        ? `<img src="${artist.picUrl}" alt="${artist.name}" width="24" height="24">`
        : svg.people,
      callback: () => {
        router.push({
          name: 'Artist',
          params: {
            id: artist.id
          }
        });
        emit('close')
      }
    })),
    {
      label: '专辑: ' + playerStore.currentSong.album.name,
      icon: playerStore.currentSong.album.picUrl
        ? `<img src="${playerStore.currentSong.album.picUrl}" alt="${playerStore.currentSong.album.name}" width="24" height="24">`
        : svg.album,
      callback: () => {
        if (!playerStore.currentSong) return
        router.push({
          name: 'Album',
          params: {
            id: playerStore.currentSong.album.id
          }
        });
        emit('close')
      }
    },
    {
      label: isLiked.value ? '取消收藏' : '收藏',
      icon: svg.love,
      callback: toggleLike
    },
    {
      label: '下载',
      icon: svg.download,
      callback: () => {
        // 下载歌曲
        if (playerStore.currentSong?.privilege?.id) {
          getSongUrl(playerStore.currentSong.privilege.id, 320000)
            .then(u => u.data?.sort((a, b) => b.br - a.br)[0])
            .then(e => window.open(e?.url))
        }
      }
    },
    {
      label: '分享',
      icon: svg.share,
      callback: () => {
        // TODO: 实现分享功能
        console.log('分享功能待实现')
      }
    }
  ])
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
    filter: blur(3.75rem
        /* 60px */
      ) brightness(0.4);
    transform: scale(1.2);
  }

  .bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
  }
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  padding-top: calc(#{$spacing-md} + env(safe-area-inset-top));
}

.header-spacer {
  flex: 1;
}

.header-btn {
  flex-shrink: 0;
  width: 2.5rem; // 2.5rem /* 40px */
  height: 2.5rem; // 2.5rem /* 40px */
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(0.625rem
      /* 10px */
    );
  transition: all $transition-fast $ease-default;

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 1.25rem; // 1.25rem /* 20px */
    height: 1.25rem; // 1.25rem /* 20px */
  }
}

.header-info {
  flex-grow: 1;
  overflow: hidden;
  text-align: center;
  padding: 0 $spacing-md;
}

.info-title {
  font-size: $font-md;
  font-weight: 500;
  color: white;
  margin-bottom: 0.125rem; // 0.125rem /* 2px */
}

.fm-badge {
  font-size: $font-xs;
  padding: 0.125rem 0.5rem; // 0.125rem /* 2px */ 0.5rem /* 8px */
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

  >* {
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
  max-width: 20rem; // 20rem /* 320px */
  max-height: 20rem; // 20rem /* 320px */
}

.album-card {
  width: 100%;
  height: 100%;
  border-radius: 1.25rem; // 1.25rem /* 20px */
  overflow: hidden;
  box-shadow: 0 1.25rem 2.5rem rgba(0, 0, 0, 0.3); // 0 1.25rem /* 20px */ 2.5rem /* 40px */
  background: $bg-card;
  transition: all $transition-normal $ease-default;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-0.3125rem); // -0.25rem /* 5px */
    box-shadow: 0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4); // 0 1.5rem /* 25px */ 3.125rem /* 50px */
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
    width: 3.75rem; // 3.75rem /* 60px */
    height: 3.75rem; // 3.75rem /* 60px */
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
  display: flex;
  flex-direction: column;
}

.lyrics-empty {
  height: 100%;
  @include flex-center;
  color: rgba(255, 255, 255, 0.4);
  font-size: $font-sm;
}

.lyrics-list {
  flex: 1;
  overflow-y: auto;
  @include scrollbar;
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
  margin-top: 0.125rem; // 0.125rem /* 2px */
}

.player-footer {
  padding: $spacing-lg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

.info-title {
  font-size: $font-lg;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 0.25rem; // 0.25rem /* 4px */
}

.song-name {
  font-size: $font-xl;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem; // 0.25rem /* 4px */
}

.song-artist {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.6);
}

.like-btn {
  width: 2.5rem
    /* 40px */
  ;
  height: 2.5rem
    /* 40px */
  ;
  @include flex-center;
  color: rgba(255, 255, 255, 0.6);
  transition: all $transition-fast $ease-default;

  &.liked {
    color: $primary-color;
  }

  &.header-like-btn {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    margin-right: $spacing-sm;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &.liked {
      background: rgba($primary-color, 0.2);

      &:hover {
        background: rgba($primary-color, 0.3);
      }
    }
  }

  svg {
    width: 1.5rem; // 1.5rem /* 24px */
    height: 1.5rem; // 1.5rem /* 24px */
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
  font-size: 0.625rem; // 0.625rem /* 10px */
  color: rgba(255, 255, 255, 0.6);
  min-width: 2.25rem; // 2.25rem /* 36px */
}

.time-current {
  text-align: left;
}

.time-total {
  text-align: right;
}

.progress-bar {
  flex: 1;
  height: 1.25rem; // 1.25rem /* 20px */
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 0.1875rem; // 0.25rem /* 3px */
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
  width: 0.75rem; // 0.75rem /* 12px */
  height: 0.75rem; // 0.75rem /* 12px */
  background: white;
  border-radius: 50%;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3); // 0 0.125rem /* 2px */ 0.25rem /* 4px */
  transition: left $transition-fast linear;
}

.controls-area {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.control-btn {
  color: white;
  transition: all $transition-fast $ease-default;

  &:active {
    transform: scale(0.9);
  }

  svg {
    width: 1.5rem; // 1.5rem /* 24px */
    height: 1.5rem; // 1.5rem /* 24px */
  }

  &.lg svg {
    width: 2rem; // 2rem /* 32px */
    height: 2rem; // 2rem /* 32px */
  }

  &.btn-trash {
    color: #ff4757;
  }

  &.btn-skip {
    color: $primary-color;
  }

  &.btn-like {
    width: 2.5rem; // 2.5rem /* 40px */
    height: 2.5rem; // 2.5rem /* 40px */
    color: rgba(255, 255, 255, 0.6);
    transition: all $transition-fast $ease-default;

    &.liked {
      color: $primary-color;
    }

    svg {
      width: 1.5rem; // 1.5rem /* 24px */
      height: 1.5rem; // 1.5rem /* 24px */
    }
  }

  &.btn-list {
    width: 2.5rem; // 2.5rem /* 40px */
    height: 2.5rem; // 2.5rem /* 40px */
    opacity: 0.7;
  }

  &.btn-prev,
  &.btn-next {
    width: 3.125rem; // 3.125rem /* 50px */
    height: 3.125rem; // 3.125rem /* 50px */

    svg {
      width: 2rem; // 2rem /* 32px */
      height: 2rem; // 2rem /* 32px */
    }
  }

  &.btn-play {
    width: 4rem
      /* 64px */
    ;
    height: 4rem
      /* 64px */
    ;
    background: $gradient-primary;
    border-radius: 50%;
    box-shadow: 0 0.25rem
      /* 4px */
      1rem
      /* 15px */
      rgba($primary-color, 0.4);

    svg {
      width: 1.75rem
        /* 28px */
      ;
      height: 1.75rem
        /* 28px */
      ;
    }

    &.btn-loading {
      background: $bg-hover;
    }
  }

  &.btn-mode,
  &.btn-clear {
    padding: .35rem;

    >svg {
      width: 1.25rem;
      height: 1.25rem;
      opacity: .8;
      display: block;
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
  backdrop-filter: blur(0.625rem
      /* 10px */
    );
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
}

.playlist-panel {
  width: 100%;
  max-height: 85vh;
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
  border-bottom: 0.0625rem
    /* 1px */
    solid $border-color;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

h3 {
  font-size: $font-md;
  font-weight: 500;
  color: $text-primary;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-sm;
  color: $text-tertiary;

  svg {
    width: 1rem
      /* 16px */
    ;
    height: 1rem
      /* 16px */
    ;
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
  margin-bottom: 0.125rem
    /* 2px */
  ;
}

.item-artist {
  font-size: $font-xs;
  color: $text-tertiary;
}

.item-remove {
  width: 2rem
    /* 32px */
  ;
  height: 2rem
    /* 32px */
  ;
  @include flex-center;
  color: $text-muted;

  svg {
    width: 1rem
      /* 16px */
    ;
    height: 1rem
      /* 16px */
    ;
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