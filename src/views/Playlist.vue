<template>
  <div class="playlist-page">
    <PageHeader :title="playlist.name" :default-action="true">
      <template v-slot:actions >
        <button class="header-more" @click="showMoreActions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </template>
    </PageHeader>

    <!-- 内容区域 -->
    <main class="playlist-content">
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
          <div class="detail-creator" v-if="playlist.creator" @click="goUser(playlist.creator)">
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
        <button class="action-btn action-share" @click="showRelatedPlaylists">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>推荐</span>
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
          <span class="header-count">共 {{ totalSongCount }} 首</span>
          <button class="header-multiple" @click="showMultipleSelect">
            多选
          </button>
        </div>
        <div v-if="loading && songs.length === 0" class="songs-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="songs-list">
          <SongListItem v-for="(song, index) in songs" :key="song.id" :song="song" :index="index"
            :is-active="playerStore.currentSong?.id === song.id"
            :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
            :is-selected="isMultipleSelect && selectedSongs.has(song.id)" :show-checkbox="isMultipleSelect"
            @click="handleSongClick(song, index)" @more="showSongActions" @select="toggleSongSelection" />
        </div>
        
        <!-- 手动加载更多按钮 -->
        <div v-if="showLoadMore && !loadingMore" class="load-more-section">
          <button class="load-more-btn" @click="loadMoreSongs()">
            加载更多
          </button>
        </div>
        
        <!-- 加载中提示 -->
        <div v-if="loadingMore" class="loading-more">
          <Loading :visible="true" />
        </div>
      </section>

      <!-- 相关歌单推荐 -->
      <section v-if="showRelatedSection" class="related-playlists">
        <div class="related-header">
          <h4 class="rheader-title">相关歌单推荐</h4>
        </div>
        <div v-if="loadingRelated" class="related-loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="related-list">
          <PlaylistCard v-for="item in relatedPlaylists" :key="item.id" :playlist="item" />
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
import { ref, computed, onMounted, shallowRef, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import type { IPlaylist as PlaylistType, ISong, IPlaylist2 } from '@/api/types'
import { getImageUrl, formatNumber } from '@/utils/lyric'

import SongListItem from '@/components/SongListItem.vue'
import Loading from '@/components/Loading.vue'
import Comment from '@/components/Comment.vue'
import { showAction } from '@/stores/action'
import { showText } from '@/stores/text'
import { svg } from '@/utils/svg'
import PlaylistCard from '@/components/PlaylistCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlistId = computed(() => Number(route.params.id))
const relatedPlaylists = shallowRef<IPlaylist2[]>([])

// 数据
const playlist = shallowRef<Partial<PlaylistType>>({
  id: 0,
  name: '',
  coverImgUrl: '',
  playCount: 0,
  trackCount: 0,
})
const songs = ref<ISong[]>([])
const allSongIds = ref<number[]>([])
const loading = ref(false)
const isSubscribed = ref(false)
const subscribeCount = ref(0)
const commentCount = ref(0)

// 按需加载相关
const loadingMore = ref(false)
const currentLoadedCount = ref(0)
const showLoadMore = ref(false)
const isManualLoadMore = ref(false)
const showRelatedSection = ref(false)
const loadingRelated = ref(false)

const BATCH_SIZE = 30

// 多选相关状态
const isMultipleSelect = ref(false)
const selectedSongs = ref<Set<number>>(new Set())

// 评论相关状态
const showComments = ref(false)

// 计算属性
const isCreator = computed(() => {
  return playlist.value.creator?.userId === userStore.userId
})

const totalSongCount = computed(() => {
  return playlist.value.trackCount || allSongIds.value.length || songs.value.length
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

    // 保存所有歌曲ID，用于按需加载
    if (res.playlist.trackIds && res.playlist.trackIds.length > 0) {
      allSongIds.value = res.playlist.trackIds.map((t: any) => t.id)
      
      // 初始加载第一批歌曲
      await loadMoreSongs(true)
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

// 按需加载更多歌曲
const loadMoreSongs = async (isInitial = false) => {
  if (loadingMore.value) return
  
  const startIndex = isInitial ? 0 : currentLoadedCount.value
  const endIndex = Math.min(startIndex + BATCH_SIZE, allSongIds.value.length)
  
  if (startIndex >= allSongIds.value.length) {
    showLoadMore.value = false
    return
  }
  
  const idsToLoad = allSongIds.value.slice(startIndex, endIndex)
  
  if (isInitial) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const newSongs = await fetchSongsBatch(idsToLoad)
    songs.value = [...songs.value, ...newSongs]
    currentLoadedCount.value = endIndex
    
    // 判断是否还有更多歌曲需要加载
    if (endIndex < allSongIds.value.length) {
      showLoadMore.value = true
    } else {
      showLoadMore.value = false
    }
  } catch (error) {
    console.error('加载歌曲详情失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 批量获取歌曲详情
const fetchSongsBatch = async (ids: number[]): Promise<ISong[]> => {
  if (ids.length === 0) return []
  
  try {
    const res = await api.getSongDetail(ids)
    if (res.code === 200 && res.songs) {
      return res.songs.map((song: any) => ({
        ...song,
        artists: song.ar,
        album: song.al,
        duration: song.dt,
        picUrl: song.al?.picUrl,
        privilege: res.privileges?.find((p: any) => p.id === song.id),
      }))
    }
    return []
  } catch (error) {
    console.error('获取歌曲详情失败:', error)
    return []
  }
}

const showRelatedPlaylists = () => {
  showRelatedSection.value = true
  isManualLoadMore.value = true
  showLoadMore.value = true
  
  setTimeout(() => {
    const relatedSection = document.querySelector('.related-playlists')
    if (relatedSection) {
      relatedSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
  
  if (relatedPlaylists.value.length === 0) {
    fetchRecommend()
  }
}

const fetchRecommend = async () => {
  loadingRelated.value = true
  try {
    const res = await api.getRelatedPlaylists(playlistId.value)
    if (res.code === 200) {
      relatedPlaylists.value = res.data.recPlaylist.map((e: any) => e.playlist);
    }
  } catch (error) {
    console.error('获取相关歌单失败:', error)
  } finally {
    loadingRelated.value = false
  }
}

// 跳转用户详情页
const goUser = (user: any) => {
  router.push({
    name: 'UserProfile',
    params: { id: user.userId }
  })
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
      icon: svg.love,
      callback: toggleSubscribe
    },
    {
      label: '分享歌单',
      icon: svg.share,
      callback: () => {
        showText('分享功能待实现')
      }
    }
  ]

  showAction(options)
}

// 显示歌曲操作
const showSongActions = (song: ISong) => {
  const options = [
    {
      label: '播放',
      icon: svg.play,
      callback: () => {
        playerStore.playPlaylist([song], 0)
      }
    },
    {
      label: '添加到播放列表',
      icon: svg.add,
      callback: () => {
        playerStore.addToPlaylist(song)
      }
    },
    {
      label: '收藏',
      icon: svg.love,
      callback: () => {
        userStore.toggleLike(song.id)
      }
    },
    {
      label: '下载',
      icon: svg.download,
      callback: () => {
        const id = song.privilege?.id
        if (id) {
          api.getSongUrl(id, 320000).then(u => u.data?.sort((a, b) => b.br - a.br)[0])
            .then(e => window.open(e?.url))
        }
      }
    },
    {
      label: '删除',
      icon: svg.delete,
      destructive: true,
      callback: () => {
        if (!isCreator.value) {
          showText('只有歌单创建者才能删除歌曲')
          return
        }

        const index = songs.value.findIndex(s => s.id === song.id)
        if (index !== -1) {
          songs.value.splice(index, 1)
        }
      }
    }
  ]

  showAction(options)
}

// 显示多选
const showMultipleSelect = () => {
  isMultipleSelect.value = !isMultipleSelect.value
  if (!isMultipleSelect.value) {
    selectedSongs.value.clear()
  }
  console.log('多选模式:', isMultipleSelect.value ? '开启' : '关闭')
}

// 处理歌曲点击
const handleSongClick = (song: ISong, index: number) => {
  if (isMultipleSelect.value) {
    toggleSongSelection(song.id)
  } else {
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
    selectedSongs.value.clear()
  } else {
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
      icon: svg.play,
      callback: () => {
        const selectedSongsList = songs.value.filter(song => selectedSongs.value.has(song.id))
        playerStore.playPlaylist(selectedSongsList, 0)
        stopBatchAction()
      }
    },
    {
      label: '添加到播放列表',
      icon: svg.add,
      callback: () => {
        const selectedSongsList = songs.value.filter(song => selectedSongs.value.has(song.id))
        selectedSongsList.forEach(song => playerStore.addToPlaylist(song))
        stopBatchAction()
      }
    },
    {
      label: '收藏选中',
      icon: svg.love,
      callback: () => {
        const selectedSongsList = songs.value.filter(song => selectedSongs.value.has(song.id))
        selectedSongsList.forEach(song => userStore.toggleLike(song.id))
        stopBatchAction()
      }
    },
    {
      label: '删除选中',
      icon: svg.delete,
      destructive: true,
      callback: () => {
        if (!isCreator.value) {
          showText('只能删除自己创建的歌单中的歌曲')
          return
        }
        
        const selectedIds = Array.from(selectedSongs.value)
        deleteSongs(selectedIds)
        stopBatchAction()
      }
    }
  ]

  showAction(options)
}

// 批量删除歌曲
const deleteSongs = async (songIds: number[]) => {
  try {
    await api.manipulatePlaylistTracks('del', playlistId.value, songIds)
    
    const indicesToDelete = songIds
      .map(songId => songs.value.findIndex(song => song.id === songId))
      .filter(index => index !== -1)
      .sort((a, b) => b - a)

    indicesToDelete.forEach(index => {
      songs.value.splice(index, 1)
    })
    
    selectedSongs.value.clear()
    showText('删除成功')
  } catch (error) {
    console.error('批量删除歌曲失败:', error)
    showText('删除失败')
  }
}

onMounted(() => {
  fetchPlaylistDetail()
})

onUnmounted(() => {
  songs.value = []
  allSongIds.value = []
  currentLoadedCount.value = 0
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlist-page {
  height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
  overflow-y: auto;
}

.header-more {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: white;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.625rem /* 10px */);
  transition: all $transition-fast $ease-default;
  flex-shrink: 0;

  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
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
    font-size: $font-sm;
    flex-direction: row;
    flex-wrap: wrap;
    flex-shrink: 1;
    
    svg {
      width: 1.125rem /* 18px */;
      height: 1.125rem /* 18px */;
    }
  }
}

.playlist-songs {
  padding-bottom: $spacing-lg;
}

.songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
}

.header-count {
  font-size: $font-sm;
  color: $text-tertiary;
}

.header-multiple {
  padding: $spacing-xs $spacing-md;
  font-size: $font-xs;
  color: $text-secondary;
  background: $bg-secondary;
  border-radius: $radius-full;
}

.songs-list {
  padding: 0 $spacing-lg;
}

.load-more-section {
  padding: $spacing-lg;
  text-align: center;
}

.load-more-btn {
  padding: $spacing-sm $spacing-xl;
  background: $bg-secondary;
  color: $text-primary;
  border-radius: $radius-full;
  font-size: $font-sm;
  @include tap-effect;
}

.loading-more {
  padding: $spacing-lg;
  text-align: center;
}

.related-playlists {
  padding: $spacing-lg;
  border-top: 0.125rem /* 1px */ solid $border-color;
}

.related-header {
  margin-bottom: $spacing-md;
}

.rheader-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.related-loading {
  padding: $spacing-xl;
  text-align: center;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.multiple-select-toolbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $screen-width;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: $bg-secondary;
  border-top: 0.125rem /* 1px */ solid $border-color;
  z-index: $z-modal;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.toolbar-btn {
  padding: $spacing-xs $spacing-md;
  font-size: $font-sm;
  color: $text-primary;
  background: $bg-card;
  border-radius: $radius-md;
}

.toolbar-info {
  font-size: $font-sm;
  color: $text-tertiary;
}

.bottom-spacer {
  height: 6.25rem /* 100px */;
}
</style>