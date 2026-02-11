<template>
  <div class="home-page">
    <!-- 头部 -->
    <header class="home-header">
      <div class="header-logo" @click="showOptions">
        <span>NeWplayer</span>
      </div>
      <button class="header-search" @click="goToSearch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    </header>

    <!-- 内容区域 -->
    <main class="home-content" ref="contentRef" @scroll="handleScroll">
      <!-- Banner轮播 -->
      <section class="section-banner" v-if="banners.length > 0">
        <Banner :banners="banners" @click="handleBannerClick" />
      </section>
      <section class="section-banner skeleton-banner" v-else>
        <Skeleton width="100%" height="8.75rem /* 140px */" radius="0.75rem /* 12px */" />
      </section>

      <!-- 快捷入口 -->
      <section class="section-shortcuts">
        <div v-for="item in shortcuts" :key="item.name" class="shortcut-item" @click="handleShortcutClick(item)">
          <div class="shortcut-icon" :style="{ background: item.gradient }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path v-if="item.icon === 'calendar'"
                d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              <path v-if="item.icon === 'fm'"
                d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
              <path v-if="item.icon === 'rank'"
                d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
              <path v-if="item.icon === 'playlist'"
                d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </div>
          <span class="shortcut-name">{{ item.name }}</span>
        </div>
      </section>

      <!-- 推荐歌单 -->
      <section class="section-playlists">
        <div class="section-header">
          <h2 class="section-title">推荐歌单</h2>
          <button class="section-more" @click="goToMorePlaylists">
            更多
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div v-if="loading.recommend" class="playlists-grid">
          <Skeleton v-for="i in 6" :key="i" width="100%" aspect-ratio="1" radius="0.75rem /* 12px */" />
        </div>
        <div v-else class="playlists-grid">
          <PlaylistCard v-for="playlist in recommendPlaylists" :key="playlist.id" :playlist="playlist"
            @click="goToPlaylist($event as IPlaylist)" />
        </div>
      </section>

      <!-- 新歌速递 -->
      <section class="section-songs">
        <div class="section-header">
          <h2 class="section-title">新歌速递</h2>
          <button class="section-more" @click="goToMoreSongs">
            更多
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div v-if="loading.newSongs" class="songs-list">
          <div v-for="i in 5" :key="i" class="song-skeleton">
            <Skeleton width="3rem /* 48px */" height="3rem /* 48px */" radius="0.5rem /* 8px */" />
            <div class="skeleton-info">
              <Skeleton width="60%" height="1rem /* 16px */" />
              <Skeleton width="40%" height="0.75rem /* 12px */" />
            </div>
          </div>
        </div>
        <div v-else class="songs-list">
          <SongListItem v-for="(song, index) in newSongs" :key="song.id" :song="song" :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id" :show-more="false"
            @click="playSong(song)" />
        </div>
      </section>

      <!-- 热门歌手 -->
      <section class="section-artists">
        <div class="section-header">
          <h2 class="section-title">热门歌手</h2>
          <button class="section-more" @click="goToMoreArtists">
            更多
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div v-if="loading.artists" class="artists-scroll">
          <Skeleton v-for="i in 8" :key="i" width="4rem /* 64px */" height="4rem /* 64px */" circle />
        </div>
        <div v-else class="artists-scroll">
          <div v-for="artist in hotArtists" :key="artist.id" class="artist-item" @click="goToArtist(artist.id)">
            <img :src="getImageUrl(artist.picUrl, 120, 120)" :alt="artist.name" class="artist-avatar" loading="lazy" />
            <span class="artist-name text-ellipsis">{{ artist.name }}</span>
          </div>
        </div>
      </section>

      <!-- 底部间距 -->
      <div class="bottom-spacer" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import * as api from '@/api'
import type { IBanner, IPlaylist, IArtist, ISong } from '@/api/types'
import { getImageUrl } from '@/utils/lyric'

import Banner from '@/components/Banner.vue'
import PlaylistCard from '@/components/PlaylistCard.vue'
import SongListItem from '@/components/SongListItem.vue'
import Skeleton from '@/components/Skeleton.vue'
import { showAction } from '@/stores/action'
import { svg } from '@/utils/svg'

const router = useRouter()
const playerStore = usePlayerStore()
const openPlayer = inject<() => void>('openPlayer')

// 数据
const banners = ref<IBanner[]>([])
const recommendPlaylists = ref<IPlaylist[]>([])
const newSongs = ref<ISong[]>([])
const hotArtists = ref<IArtist[]>([])

const loading = reactive({
  recommend: false,
  newSongs: false,
  artists: false,
})

// 快捷入口
const shortcuts = [
  { name: '每日推荐', icon: 'calendar', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', action: 'daily' },
  { name: '私人FM', icon: 'fm', gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a3aa 100%)', action: 'fm' },
  { name: '排行榜', icon: 'rank', gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)', action: 'rank' },
  { name: '歌单', icon: 'playlist', gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', action: 'playlist' },
]

// 获取Banner
const fetchBanners = async () => {
  try {
    const res = await api.getBanners()
    if (res.code === 200) {
      banners.value = res.banners
    }
  } catch (error) {
    console.error('获取Banner失败:', error)
  }
}

// 获取推荐歌单
const fetchRecommendPlaylists = async () => {
  loading.recommend = true
  try {
    const res = await api.getRecommendPlaylists(6)
    if (res.code === 200) {
      recommendPlaylists.value = res.result.map((item: any) => ({
        id: item.id,
        name: item.name,
        coverImgUrl: item.picUrl,
        playCount: item.playcount,
        trackCount: 0,
      }))
    }
  } catch (error) {
    console.error('获取推荐歌单失败:', error)
  } finally {
    loading.recommend = false
  }
}

// 获取新歌
const fetchNewSongs = async () => {
  loading.newSongs = true
  try {
    const res = await api.getNewSongs(10)
    if (res.code === 200) {
      newSongs.value = res.result.map((item: any) => ({
        id: item.id,
        name: item.name,
        artists: item.song.artists,
        album: item.song.album,
        duration: item.song.duration,
        picUrl: item.picUrl,
      }))
    }
  } catch (error) {
    console.error('获取新歌失败:', error)
  } finally {
    loading.newSongs = false
  }
}

// 获取热门歌手
const fetchHotArtists = async () => {
  loading.artists = true
  try {
    const res = await api.getHotArtists(10)
    if (res.code === 200) {
      hotArtists.value = res.artists
    }
  } catch (error) {
    console.error('获取热门歌手失败:', error)
  } finally {
    loading.artists = false
  }
}

// 处理Banner点击
const handleBannerClick = (banner: IBanner) => {
  if (banner.targetType === 1) {
    // 单曲
    if (openPlayer) {
      openPlayer()
    }
  } else if (banner.targetType === 10) {
    // 专辑
    router.push(`/album/${banner.targetId}`)
  } else if (banner.targetType === 1000) {
    // 歌单
    router.push(`/playlist/${banner.targetId}`)
  } else if (banner.url) {
    window.open(banner.url, '_blank')
  }
}

// 处理快捷入口点击
const handleShortcutClick = (item: typeof shortcuts[0]) => {
  switch (item.action) {
    case 'daily':
      router.push({
        name: 'DailyRecommend'
      })
      break
    case 'fm':
      // 私人FM
      playerStore.startPersonalFM()
      break
    case 'rank':
      router.push({
        name: 'TopList'
      })
      break
    case 'playlist':
      router.push({
        name: 'Recommend'
      })
      break
  }
}

// 播放歌曲
const playSong = async (song: ISong) => {
  await playerStore.play(song)
}

// 更多操作
const showSettings = inject<() => void>('showSettings')
const showOptions = (_e: MouseEvent) => {
  showAction([
    {
      label: document.fullscreenElement ? '退出全屏' : '全屏',
      icon: document.fullscreenElement ? svg['exit-fullscreen'] : svg.fullscreen,
      callback: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
      }
    },
    {
      label: 'UI设置',
      icon: svg.setting,
      callback: () => {
        showSettings?.();
      }
    }
  ]);
}

// 跳转方法
const goToSearch = () => router.push('/search')
const goToPlaylist = (playlist: IPlaylist) => router.push(`/playlist/${playlist.id}`)
const goToArtist = (id: number) => router.push(`/artist/${id}`)
const goToMorePlaylists = () => router.push('/search')
const goToMoreSongs = () => router.push('/search')
const goToMoreArtists = () => router.push('/search')

// 滚动处理
const handleScroll = () => {
  // 可以在这里实现滚动加载更多
}

onMounted(() => {
  fetchBanners()
  fetchRecommendPlaylists()
  fetchNewSongs()
  fetchHotArtists()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.home-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.home-header {
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

.header-logo {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-xl;
  font-weight: 600;
  color: $primary-color;

  svg {
    width: 1.75rem /* 28px */;
    height: 1.75rem /* 28px */;
  }
}

.header-search {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: $text-secondary;
  border-radius: 50%;
  background: $bg-card;
  transition: all $transition-fast $ease-default;

  &:active {
    background: $bg-hover;
  }

  svg {
    width: 1.125rem /* 18px */;
    height: 1.125rem /* 18px */;
  }
}

.home-content {
  padding: $spacing-xs $spacing-md;
}

.section-banner {
  margin-bottom: $spacing-lg;
}

.skeleton-banner {
  :deep(.skeleton) {
    aspect-ratio: 3 / 1.2;
  }
}

.section-shortcuts {
  display: flex;
  justify-content: space-around;
  margin-bottom: $spacing-xl;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  @include tap-effect;
}

.shortcut-icon {
  width: 4rem /* 64px */;
  height: 4rem /* 64px */;
  @include flex-center;
  border-radius: 50%;
  color: white;

  svg {
    width: 2.625rem /* 42px */;
    height: 2.625rem /* 42px */;
  }
}

.shortcut-name {
  font-size: $font-xs;
  color: $text-secondary;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 0.125rem /* 2px */;
  font-size: $font-sm;
  color: $text-tertiary;
  transition: color $transition-fast $ease-default;

  &:active {
    color: $primary-color;
  }

  svg {
    width: 0.875rem /* 14px */;
    height: 0.875rem /* 14px */;
  }
}

.section-playlists {
  margin-bottom: $spacing-xl;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.section-songs {
  margin-bottom: $spacing-xl;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem /* 2px */;
}

.song-skeleton {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.section-artists {
  margin-bottom: $spacing-xl;
}

.artists-scroll {
  display: flex;
  gap: $spacing-md;
  overflow-x: auto;
  padding-bottom: $spacing-sm;
  @include scrollbar;

  &::-webkit-scrollbar {
    display: none;
  }
}

.artist-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  flex-shrink: 0;
  cursor: pointer;
  @include tap-effect;
}

.artist-avatar {
  width: 4rem /* 64px */;
  height: 4rem /* 64px */;
  border-radius: 50%;
  object-fit: cover;
}

.artist-name {
  font-size: $font-xs;
  color: $text-secondary;
  max-width: 4rem /* 64px */;
}

.bottom-spacer {
  height: 5rem /* 80px */;
}
</style>