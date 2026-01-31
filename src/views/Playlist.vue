<template>
  <div class="playlist-page">
    <!-- 头部 -->
    <header class="playlist-header" :class="{ 'header-scrolled': headerScrolled }">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="header-title" :class="{ 'title-visible': headerScrolled }">
        {{ playlist.name }}
      </h1>
      <button class="header-more" @click="showMoreActions">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
    </header>

    <!-- 内容区域 -->
    <main class="playlist-content" ref="contentRef" @scroll="handleScroll">
      <!-- 歌单信息 -->
      <section class="playlist-info">
        <div class="info-cover">
          <img :src="getImageUrl(playlist.coverImgUrl, 300, 300)" :alt="playlist.name" class="cover-image" />
          <div class="cover-playcount">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{{ formatNumber(playlist?.playCount ?? 0) }}</span>
          </div>
        </div>
        <div class="info-detail">
          <h2 class="detail-name">{{ playlist.name }}</h2>
          <div class="detail-creator" v-if="playlist.creator">
            <img :src="getImageUrl(playlist.creator.avatarUrl, 40, 40)" :alt="playlist.creator.nickname"
              class="creator-avatar" />
            <span class="creator-name">{{ playlist.creator.nickname }}</span>
            <button v-if="!isCreator" class="creator-follow" :class="{ 'followed': isSubscribed }"
              @click="toggleSubscribe">
              {{ isSubscribed ? '已收藏' : '收藏' }}
            </button>
          </div>
          <p class="detail-desc text-ellipsis-2" v-if="playlist.description" @click="showDetailed">
            {{ playlist.description }}
          </p>
        </div>
      </section>

      <!-- 操作按钮 -->
      <section class="playlist-actions">
        <button class="action-btn action-subscribe" @click="toggleSubscribe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{{ formatNumber(subscribeCount) }}</span>
        </button>
        <button class="action-btn action-comment" @click="showComments = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <span>{{ formatNumber(commentCount) }}</span>
        </button>
        <button class="action-btn action-share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>分享</span>
        </button>
        <button class="action-btn action-playall" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>播放全部</span>
        </button>
      </section>

      <!-- 歌曲列表 -->
      <section class="playlist-songs">
        <div class="songs-header">
          <span class="header-count">共 {{ songs.length }} 首</span>
          <button class="header-multiple" @click="showMultipleSelect">
            多选
          </button>
        </div>
        <div v-if="loading" class="songs-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="songs-list">
          <SongListItem v-for="(song, index) in songs" :key="song.id" :song="song" :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
            :is-selected="isMultipleSelect && selectedSongs.has(song.id)" :show-checkbox="isMultipleSelect"
            @click="handleSongClick(song, index)" @more="showSongActions" @select="toggleSongSelection" />
        </div>
      </section>

      <!-- 多选工具栏 -->
      <div v-if="isMultipleSelect" class="multiple-select-toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" @click="toggleSelectAll">
            {{ selectedSongs.size === songs.length ? '取消全选' : '全选' }}
          </button>
          <span class="toolbar-info">已选择 {{ selectedSongs.size }} 首</span>
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn" @click="stopBatchAction">取消</button>
          <button class="toolbar-btn" @click="showBatchActions">操作</button>
        </div>
      </div>

      <!-- 评论入口 -->
      <div v-if="!isMultipleSelect && songs.length > 0" class="comment-entry">
        <button class="comment-btn" @click="showComments = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>评论 ({{ commentCount }})</span>
        </button>
      </div>

      <!-- 底部间距 -->
      <div class="bottom-spacer" />
    </main>

    <!-- 评论组件 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <Comment v-if="showComments" :resource-id="playlistId" resource-type="playlist" @close="showComments = false" />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IPlaylist as PlaylistType, ISong } from '@/types'
import { getImageUrl, formatNumber } from '@/utils/lyric'

import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'
import Comment from '@/components/Comment.vue'
import { showAction } from '@/stores/action'
import { showText } from '@/stores/text'
import { svg } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlistId = computed(() => Number(route.params.id))

// 数据
const playlist = ref<Partial<PlaylistType>>({
  id: 0,
  name: '',
  coverImgUrl: '',
  playCount: 0,
  trackCount: 0,
})
const songs = ref<ISong[]>([])
const loading = ref(false)
const headerScrolled = ref(false)
const isSubscribed = ref(false)
const subscribeCount = ref(0)
const commentCount = ref(0)

// 多选相关状态
const isMultipleSelect = ref(false)
const selectedSongs = ref<Set<number>>(new Set())

const contentRef = ref<HTMLElement>()

// 评论相关状态
const showComments = ref(false)

// 计算属性
const isCreator = computed(() => {
  return playlist.value.creator?.userId === userStore.userId
})

// 获取歌单详情
const fetchPlaylistDetail = async () => {
  loading.value = true
  try {
    const res = await api.getPlaylistDetail(playlistId.value)
    playlist.value = res.playlist
    isSubscribed.value = res.playlist.subscribed || false
    subscribeCount.value = res.playlist.subscribedCount || 0
    commentCount.value = res.playlist.commentCount || 0

    // 获取歌曲详情
    if (res.playlist.trackIds && res.playlist.trackIds.length > 0) {
      await fetchSongs(res.playlist.trackIds.map((t: any) => t.id))
    }
  } catch (error) {
    console.error('获取歌单详情失败:', error)
  } finally {
    loading.value = false
  }
}

const showDetailed = () => {
  showText(playlist.value.description || '', playlist.value.name);
}

// 获取歌曲详情
const fetchSongs = async (ids: number[]) => {
  try {
    // 分批获取，每次最多1000首
    const batchSize = 1000
    const allSongs: ISong[] = []

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      const res = await api.getSongDetail(batch)
      if (res.code === 200 && res.songs) {
        allSongs.push(...res.songs.map((song: any) => ({
          ...song,
          artists: song.ar,
          album: song.al,
          duration: song.dt,
          picUrl: song.al?.picUrl,
          privilege: res.privileges?.find((p: any) => p.id === song.id),
        })))
      }
    }

    songs.value = allSongs
  } catch (error) {
    console.error('获取歌曲详情失败:', error)
  }
}

// 收藏/取消收藏
const toggleSubscribe = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    const t = isSubscribed.value ? 2 : 1
    const res = await api.subscribePlaylist(playlistId.value, t)
    if (res.code === 200) {
      isSubscribed.value = !isSubscribed.value
      subscribeCount.value += isSubscribed.value ? 1 : -1
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

// 播放全部
const playAll = () => {
  if (songs.value.length === 0) return
  playerStore.playPlaylist(songs.value, 0)
}

// 播放歌曲
const playSong = async (song: ISong, index: number) => {
  await playerStore.play(song)
  // 将当前歌单设置为播放列表
  if (playerStore.playlist.length === 0 || playerStore.playlist[0].id !== songs.value[0].id) {
    playerStore.setPlaylist(songs.value, index)
  }
}

// 显示更多操作
const showMoreActions = () => {
  const options = [
    {
      label: isSubscribed.value ? '取消收藏歌单' : '收藏歌单',
      value: 'subscribe',
      icon: svg.love
    },
    {
      label: '分享歌单',
      value: 'share',
      icon: svg.share
    }
  ]

  showAction(options, (option) => {
    if (!option) return

    const action = option.value
    switch (action) {
      case 'subscribe':
        toggleSubscribe()
        break
      case 'share':
        // 实现分享功能
        showText('分享功能待实现')
        break
    }
  })
}

// 显示歌曲操作
const showSongActions = (song: ISong) => {
  const options = [
    {
      label: '播放',
      value: 'play',
      icon: svg.play
    },
    {
      label: '添加到播放列表',
      value: 'add',
      icon: svg.add
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
      label: '删除',
      value: 'delete',
      icon: svg.delete,
      destructive: true
    }
  ]

  showAction(options, (option) => {
    if (!option) return

    const action = option.value
    switch (action) {
      case 'play':
        // 播放当前歌曲
        playerStore.playPlaylist([song], 0)
        break
      case 'add':
        // 添加到播放列表
        playerStore.addToPlaylist(song)
        break
      case 'favorite':
        // 收藏歌曲
        userStore.toggleLike(song.id)
        break
      case 'download':
        // 下载歌曲
        const id = song.privilege?.id
        if (id) {
          api.getSongUrl(id, 320000).then(u => u.data?.sort((a, b) => b.br - a.br)[0])
            .then(e => window.open(e?.url))
        }
        break
      case 'delete':
        // 删除歌曲（如果是自己的歌单）
        if (!isCreator.value) {
          showText('只有歌单创建者才能删除歌曲')
          return
        }

        const index = songs.value.findIndex(s => s.id === song.id)
        if (index !== -1) {
          songs.value.splice(index, 1)
        }
        break
    }
  })
}

// 显示多选
const showMultipleSelect = () => {
  // 实现多选功能
  isMultipleSelect.value = !isMultipleSelect.value
  if (!isMultipleSelect.value) {
    // 退出多选模式时清空选择
    selectedSongs.value.clear()
  }
  console.log('多选模式:', isMultipleSelect.value ? '开启' : '关闭')
}

// 处理歌曲点击
const handleSongClick = (song: ISong, index: number) => {
  if (isMultipleSelect.value) {
    // 多选模式下，切换选择状态
    toggleSongSelection(song.id)
  } else {
    // 普通模式下，播放歌曲
    playSong(song, index)
  }
}

// 切换歌曲选择状态
const toggleSongSelection = (songId: number) => {
  if (!isMultipleSelect.value) return

  if (selectedSongs.value.has(songId)) {
    selectedSongs.value.delete(songId)
  } else {
    selectedSongs.value.add(songId)
  }
  console.log('已选择歌曲数量:', selectedSongs.value.size)
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedSongs.value.size === songs.value.length) {
    // 当前是全选状态，取消全选
    selectedSongs.value.clear()
  } else {
    // 全选
    songs.value.forEach(song => selectedSongs.value.add(song.id))
  }
  console.log('已选择歌曲数量:', selectedSongs.value.size)
}

// 取消批量操作
const stopBatchAction = () => {
  isMultipleSelect.value = false
  selectedSongs.value.clear()
}

// 显示批量操作菜单
const showBatchActions = () => {
  if (selectedSongs.value.size === 0) {
    return
  }

  const options = [
    {
      label: '播放选中',
      value: 'play',
      icon: svg.play
    },
    {
      label: '添加到播放列表',
      value: 'add',
      icon: svg.add
    },
    {
      label: '收藏选中',
      value: 'favorite',
      icon: svg.love
    },
    {
      label: '删除选中',
      value: 'delete',
      icon: svg.delete,
      destructive: true
    }
  ]

  showAction(options, batchOperate)
}

// 批量操作
const batchOperate = (option?: any) => {
  const action = option?.value
  if (!action) return

  if (selectedSongs.value.size === 0) {
    showText('请先选择歌曲')
    return
  }

  console.log(`批量${action}选中的${selectedSongs.value.size}首歌曲`)

  // 根据操作类型执行相应功能
  switch (action) {
    case 'play':
      // 播放选中的歌曲
      const selectedSongsList = songs.value.filter(song => selectedSongs.value.has(song.id))
      playerStore.playPlaylist(selectedSongsList, 0)
      // 退出多选模式
      isMultipleSelect.value = false
      selectedSongs.value.clear()
      break
    case 'add':
      // 添加到播放列表
      const songsToAdd = songs.value.filter(song => selectedSongs.value.has(song.id))
      songsToAdd.forEach(song => playerStore.addToPlaylist(song))
      break
    case 'favorite':
      // 收藏选中的歌曲
      selectedSongs.value.forEach(async (songId) => {
        await userStore.toggleLike(songId)
      })
      break
    case 'download':
      // 下载选中的歌曲
      selectedSongs.value.forEach(song => {
        const id = songs.value.find(s => s.id === song)?.privilege?.id;
        if (id) api.getSongUrl(id, 320000).then(u => u.data?.sort((a, b) => b.br - a.br)[0])
          .then(e => window.open(e?.url));
      })
      break
    case 'delete':
      // 删除选中的歌曲（如果是自己的歌单）
      if (!isCreator.value) {
        showText('只有歌单创建者才能删除歌曲')
        return
      }

      // 按索引从大到小排序，避免删除时索引变化
      const indicesToDelete = Array.from(selectedSongs.value)
        .map(songId => songs.value.findIndex(song => song.id === songId))
        .filter(index => index !== -1)
        .sort((a, b) => b - a)

      indicesToDelete.forEach(index => {
        songs.value.splice(index, 1)
      })

      // 清空选择
      selectedSongs.value.clear()
      break
  }
}

// 滚动处理
const handleScroll = () => {
  if (contentRef.value) {
    headerScrolled.value = contentRef.value.scrollTop > 200
  }
}

// 返回
const goBack = () => router.back()

onMounted(() => {
  fetchPlaylistDetail()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlist-page {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
}

.playlist-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $screen-width;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  z-index: $z-sticky;
  transition: all $transition-normal $ease-default;

  &.header-scrolled {
    background: rgba($bg-primary, 0.95);
    backdrop-filter: blur(1.25rem /* 20px */);
  }
}

.header-back,
.header-more {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.625rem /* 10px */);
  transition: all $transition-fast $ease-default;

  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
  }
}

.header-title {
  font-size: $font-md;
  font-weight: 500;
  color: white;
  opacity: 0;
  transition: opacity $transition-normal $ease-default;
  @include text-ellipsis;
  max-width: 12.5rem /* 200px */;

  &.title-visible {
    opacity: 1;
  }
}

.playlist-content {
  padding-top: 0;
}

.playlist-info {
  position: relative;
  padding: 5rem /* 80px */ $spacing-lg $spacing-lg;
  background: linear-gradient(180deg, rgba($primary-color, 0.3) 0%, $bg-primary 100%);
  display: flex;
  gap: $spacing-md;
}

.info-cover {
  position: relative;
  width: 7.5rem /* 120px */;
  height: 7.5rem /* 120px */;
  border-radius: $radius-lg;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: $shadow-lg;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-playcount {
  position: absolute;
  top: $spacing-xs;
  right: $spacing-xs;
  display: flex;
  align-items: center;
  gap: 0.125rem /* 2px */;
  padding: 0.125rem /* 2px */ 0.375rem /* 6px */;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.25rem /* 4px */);
  border-radius: $radius-full;
  font-size: 0.625rem /* 10px */;
  color: white;

  svg {
    width: 0.625rem /* 10px */;
    height: 0.625rem /* 10px */;
  }
}

.info-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.detail-name {
  font-size: $font-lg;
  font-weight: 600;
  color: white;
  line-height: 1.3;
}

.detail-creator {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.creator-avatar {
  width: 1.5rem /* 24px */;
  height: 1.5rem /* 24px */;
  border-radius: 50%;
  object-fit: cover;
}

.creator-name {
  font-size: $font-sm;
  color: $text-secondary;
}

.creator-follow {
  padding: 0.125rem /* 2px */ 0.5rem /* 8px */;
  font-size: 0.625rem /* 10px */;
  color: white;
  background: $primary-color;
  border-radius: $radius-full;

  &.followed {
    background: $bg-hover;
    color: $text-tertiary;
  }
}

.detail-desc {
  font-size: $font-xs;
  color: $text-tertiary;
  line-height: 1.4;
}

.playlist-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md $spacing-lg;
  border-bottom: 0.125rem /* 1px */ solid $border-color;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  color: $text-secondary;
  transition: all $transition-fast $ease-default;
  @include tap-effect;

  svg {
    width: 1.375rem /* 22px */;
    height: 1.375rem /* 22px */;
  }

  span {
    font-size: 0.625rem /* 10px */;
  }

  &.action-playall {
    padding: $spacing-sm $spacing-lg;
    background: $gradient-primary;
    color: white;
    border-radius: $radius-full;
    flex-direction: row;

    svg {
      width: 1rem /* 16px */;
      height: 1rem /* 16px */;
    }

    span {
      font-size: $font-sm;
      font-weight: 500;
    }
  }
}

.playlist-songs {
  padding: $spacing-md $spacing-lg;
}

.songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.header-count {
  font-size: $font-sm;
  color: $text-tertiary;
}

.header-multiple {
  font-size: $font-sm;
  color: $primary-color;
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

// 多选工具栏样式
.multiple-select-toolbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $screen-width;
  height: 3.75rem /* 60px */;
  background: rgba($bg-card, 0.95);
  backdrop-filter: blur(1.25rem /* 20px */);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-lg;
  z-index: $z-player - 1;
  border-top: 0.125rem /* 1px */ solid $border-light;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.toolbar-btn {
  padding: $spacing-xs $spacing-lg;
  font-size: $font-sm;
  color: $primary-color;
  background: transparent;
  border: 0.125rem /* 1px */ solid $primary-color;
  border-radius: $radius-full;
  cursor: pointer;
  transition: all $transition-fast $ease-default;

  &:active {
    background: rgba($primary-color, 0.1);
  }
}

.toolbar-info {
  font-size: $font-sm;
  color: $text-secondary;
}

// 评论入口样式
.comment-entry {
  margin: $spacing-lg 0;
  padding: 0 $spacing-lg;
}

.comment-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $bg-card;
  border: 0.125rem /* 1px */ solid $border-light;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: $font-sm;
  cursor: pointer;
  transition: all $transition-fast $ease-default;

  svg {
    width: 1.125rem /* 18px */;
    height: 1.125rem /* 18px */;
  }

  &:active {
    background: $bg-hover;
    transform: scale(0.98);
  }
}
</style>