<template>
  <div class="favorite-page">
    <header class="favorite-header" :class="{ 'header-scrolled': headerScrolled }">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="header-title" :class="{ 'title-visible': headerScrolled }">我喜欢的音乐</h1>
      <div class="header-placeholder"></div>
    </header>

    <main class="favorite-content" ref="contentRef" @scroll="handleScroll">
      <section class="favorite-info">
        <div class="info-count">
          <span class="count-number">{{ likeCount }}</span>
          <span class="count-text">首喜欢的音乐</span>
        </div>
        <p class="info-tip">点击播放你喜欢的音乐</p>
      </section>

      <section class="favorite-actions">
        <button class="action-btn action-playall" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>播放全部</span>
        </button>
        <button class="action-btn action-shuffle" @click="playShuffle">
          <svg fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path
              d="M10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 4a4 4 0 0 0-4 4 .5.5 0 0 1-1 0 5 5 0 0 1 5-5 .5.5 0 0 1 0 1zm4.5 3.5a.5.5 0 0 1 .5.5 5 5 0 0 1-5 5 .5.5 0 0 1 0-1 4 4 0 0 0 4-4 .5.5 0 0 1 .5-.5z" />
          </svg>
          <span>随机播放</span>
        </button>
      </section>

      <section class="favorite-songs">
        <div v-if="loading" class="songs-loading">
          <Loading :visible="true" />
        </div>
        <div v-else-if="songs.length === 0" class="songs-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 7.22l7.78 7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            <path d="M12 8.5v4l1.5 1.5" />
          </svg>
          <p>还没有喜欢的音乐</p>
          <span>去发现页面找些喜欢的音乐吧</span>
        </div>
        <div v-else class="songs-list">
          <SongListItem v-for="(song, index) in songs" :key="song.id" :song="song" :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id" @click="playSong(song)" />
        </div>
      </section>

      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { ISong } from '@/api/types'
import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const songs = ref<ISong[]>([])
const loading = ref(false)
const headerScrolled = ref(false)
const contentRef = ref<HTMLElement>()

// 喜欢的音乐数量
const likeCount = computed(() => songs.value.length)

// 获取喜欢音乐列表
const fetchFavoriteSongs = async () => {
  if (!userStore.userId) return

  loading.value = true
  try {
    // 获取喜欢音乐ID列表
    const likeRes = await api.getLikeList(userStore.userId)
    if (likeRes.code === 200 && likeRes.ids && likeRes.ids.length > 0) {
      // 获取音乐详情
      const songRes = await api.getSongDetail2(likeRes.ids)
      if (songRes.code === 200 && songRes.songs) {
        songs.value = songRes.songs
      }
    }
  } catch (error) {
    console.error('获取喜欢音乐列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 播放全部
const playAll = async () => {
  if (songs.value.length === 0) return

  playerStore.setPlaylist(songs.value)
  await playerStore.play(songs.value[0])
}

// 随机播放
const playShuffle = async () => {
  if (songs.value.length === 0) return

  // 随机打乱数组
  const shuffled = [...songs.value].sort(() => Math.random() - 0.5)
  playerStore.setPlaylist(shuffled)
  await playerStore.play(shuffled[0])
}

// 播放歌曲
const playSong = async (song: ISong) => {
  // 如果点击的歌曲已经在播放列表中，直接播放
  if (playerStore.playlist.some(s => s.id === song.id)) {
    await playerStore.play(song)
  } else {
    // 否则，将当前喜欢的音乐列表设置为播放列表
    playerStore.setPlaylist(songs.value)
    await playerStore.play(song)
  }
}

// 滚动处理
const handleScroll = () => {
  if (!contentRef.value) return

  const { scrollTop } = contentRef.value
  headerScrolled.value = scrollTop > 100
}

const goBack = () => router.back()

onMounted(fetchFavoriteSongs)
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.favorite-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.favorite-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: rgba($bg-primary, 0.95);
  backdrop-filter: blur(20px);
  transition: all $transition-fast $ease-default;
}

.header-back {
  width: 40px;
  height: 40px;
  @include flex-center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: $text-primary;
  transition: all $transition-fast $ease-default;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.header-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  opacity: 0;
  transition: opacity $transition-fast $ease-default;

  &.title-visible {
    opacity: 1;
  }
}

.header-placeholder {
  width: 40px;
}

.favorite-content {
  padding: $spacing-lg;
}

.favorite-info {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.info-count {
  margin-bottom: $spacing-md;
}

.count-number {
  font-size: 36px;
  font-weight: 700;
  color: $primary-color;
  display: block;
}

.count-text {
  font-size: $font-md;
  color: $text-secondary;
  margin-left: $spacing-sm;
}

.info-tip {
  font-size: $font-sm;
  color: $text-secondary;
  margin: 0;
}

.favorite-actions {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  background: rgba($primary-color, 0.1);
  border: none;
  border-radius: 24px;
  color: $primary-color;
  font-size: $font-sm;
  font-weight: 500;
  transition: all $transition-fast $ease-default;

  &:hover {
    background: rgba($primary-color, 0.2);
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.favorite-songs {
  margin-bottom: $spacing-xl;
}

.songs-loading,
.songs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl 0;
}

.songs-empty {
  color: $text-secondary;

  svg {
    width: 64px;
    height: 64px;
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }

  p {
    font-size: $font-md;
    margin: 0 0 $spacing-sm 0;
  }

  span {
    font-size: $font-sm;
    opacity: 0.8;
  }
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.bottom-spacer {
  height: 60px;
}
</style>