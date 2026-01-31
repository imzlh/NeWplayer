<template>
  <div class="search-page">
    <!-- 搜索头部 -->
    <header class="search-header">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          :placeholder="defaultKeyword"
          @keyup.enter="handleSearch"
          @input="handleInput"
          @focus="showSuggestions = true"
        />
        <button
          v-if="searchKeyword"
          class="clear-btn"
          @click="clearSearch"
        >
          <svg fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
      <button class="header-search-btn" @click="handleSearch">搜索</button>
    </header>
    
    <!-- 搜索建议 -->
    <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.keyword"
        class="suggestion-item"
        @click="searchByKeyword(suggestion.keyword)"
      >
        <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span class="suggestion-text" v-html="highlightKeyword(suggestion.keyword)"></span>
      </div>
    </div>
    
    <!-- 搜索内容 -->
    <main v-else class="search-content">
      <!-- 热搜榜 -->
      <section v-if="!hasSearched" class="section-hot">
        <h2 class="section-title">热搜榜</h2>
        <div class="hot-list">
          <div
            v-for="(item, index) in hotSearchList"
            :key="item.searchWord"
            class="hot-item"
            @click="searchByKeyword(item.searchWord)"
          >
            <span class="hot-rank" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</span>
            <div class="hot-info">
              <p class="hot-keyword">
                {{ item.searchWord }}
                <img v-if="item.iconUrl" :src="item.iconUrl" class="hot-icon" alt=""/>
              </p>
              <p v-if="item.content" class="hot-content">{{ item.content }}</p>
            </div>
            <span class="hot-score">{{ formatNumber(item.score) }}</span>
          </div>
        </div>
      </section>
      
      <!-- 搜索结果 -->
      <section v-else class="section-result">
        <!-- 搜索结果标签页 -->
        <div class="result-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.type"
            class="tab-item"
            :class="{ 'tab-active': currentTab === tab.type }"
            @click="currentTab = tab.type"
          >
            {{ tab.name }}
          </button>
        </div>
        
        <!-- 单曲结果 -->
        <div v-if="currentTab === 1" class="result-songs">
          <div v-if="loading" class="result-loading">
            <Loading :visible="true" text="搜索中..." />
          </div>
          <div v-else-if="searchResult.songs.length === 0" class="result-empty">
            <p>未找到相关歌曲</p>
          </div>
          <div v-else class="songs-list">
            <SongListItem
              v-for="(song, index) in searchResult.songs"
              :key="song.id"
              :song="song"
              :index="index"
              :is-active="playerStore.currentSong?.id === song.id"
              :is-playing="playerStore.isPlaying && playerStore.currentSong?.id === song.id"
              @click="playSong(song)"
              @more="showDefaultSongActions(song)"
            />
          </div>
          
          <!-- 加载更多 -->
          <button
            v-if="searchResult.hasMore"
            class="load-more"
            @click="loadMore"
            :disabled="loadingMore"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
        
        <!-- 歌单结果 -->
        <div v-else-if="currentTab === 1000" class="result-playlists">
          <div v-if="loading" class="result-loading">
            <Loading :visible="true" text="搜索中..." />
          </div>
          <div v-else-if="searchResult.playlists.length === 0" class="result-empty">
            <p>未找到相关歌单</p>
          </div>
          <div v-else class="playlists-grid">
            <PlaylistCard
              v-for="playlist in searchResult.playlists"
              :key="playlist.id"
              :playlist="playlist"
              @click="goToPlaylist"
            />
          </div>
        </div>
        
        <!-- 歌手结果 -->
        <div v-else-if="currentTab === 100" class="result-artists">
          <div v-if="loading" class="result-loading">
            <Loading :visible="true" text="搜索中..." />
          </div>
          <div v-else-if="searchResult.artists.length === 0" class="result-empty">
            <p>未找到相关歌手</p>
          </div>
          <div v-else class="artists-list">
            <div
              v-for="artist in searchResult.artists"
              :key="artist.id"
              class="artist-card"
              @click="goToArtist(artist.id)"
            >
              <img
                :src="getImageUrl(artist.picUrl, 120, 120)"
                :alt="artist.name"
                class="artist-image"
              />
              <span class="artist-name">{{ artist.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 专辑结果 -->
        <div v-else-if="currentTab === 10" class="result-albums">
          <div v-if="loading" class="result-loading">
            <Loading :visible="true" text="搜索中..." />
          </div>
          <div v-else-if="searchResult.albums.length === 0" class="result-empty">
            <p>未找到相关专辑</p>
          </div>
          <div v-else class="albums-grid">
            <div
              v-for="album in searchResult.albums"
              :key="album.id"
              class="album-card"
              @click="goToAlbum(album.id)"
            >
              <img
                :src="getImageUrl(album.picUrl, 200, 200)"
                :alt="album.name"
                class="album-image"
              />
              <span class="album-name text-ellipsis">{{ album.name }}</span>
              <span class="album-artist text-ellipsis">{{ album.artist?.name }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import * as api from '@/api'
import type { ISong, IPlaylist, IArtist, IAlbum } from '@/types'
import { getImageUrl, formatNumber, debounce } from '@/utils/lyric'

import SongListItem from '@/components/SongListItem.vue'
import PlaylistCard from '@/components/PlaylistCard.vue'
import Loading from '@/components/Loading.vue'
import { showDefaultSongActions } from '@/utils/action'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

// 搜索状态
const searchKeyword = ref('')
const defaultKeyword = ref('搜索音乐、歌手、歌单')
const hasSearched = ref(false)
const showSuggestions = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const currentTab = ref(1)
const offset = ref(0)
const limit = 30

// 搜索建议
const suggestions = ref<{ keyword: string }[]>([])

// 热搜列表
const hotSearchList = ref<any[]>([])

// 搜索结果
const searchResult = reactive({
  songs: [] as ISong[],
  playlists: [] as IPlaylist[],
  artists: [] as IArtist[],
  albums: [] as IAlbum[],
  hasMore: false,
})

// 标签页
const tabs = [
  { name: '单曲', type: 1 },
  { name: '歌单', type: 1000 },
  { name: '歌手', type: 100 },
  { name: '专辑', type: 10 },
]

// 获取默认搜索关键词
const fetchDefaultKeyword = async () => {
  try {
    const res = await api.getDefaultSearchKeyword()
    if (res.code === 200 && res.data) {
      const data = res.data as { realkeyword: string; showKeyword: string }
      defaultKeyword.value = data.showKeyword
    }
  } catch (error) {
    console.error('获取默认搜索关键词失败:', error)
  }
}

// 获取热搜列表
const fetchHotSearch = async () => {
  try {
    const res = await api.getHotSearchDetail()
    if (res.code === 200 && res.data) {
      const data = res.data as Array<{ searchWord: string; score: number; content: string; source: number; iconType: number; iconUrl: string; url: string; alg: string }>
      hotSearchList.value = data.slice(0, 20)
    }
  } catch (error) {
    console.error('获取热搜列表失败:', error)
  }
}

// 获取搜索建议
const fetchSuggestions = debounce(async (keyword: string) => {
  if (!keyword.trim()) {
    suggestions.value = []
    return
  }
  try {
    const res = await api.getSearchSuggest(keyword)
    if (res.code === 200 && res.result) {
      const allSuggestions: { keyword: string }[] = []
      if (res.result.songs) {
        allSuggestions.push(...res.result.songs.map((s: ISong) => ({ keyword: s.name })))
      }
      if (res.result.artists) {
        allSuggestions.push(...res.result.artists.map((a: IArtist) => ({ keyword: a.name })))
      }
      suggestions.value = allSuggestions.slice(0, 8)
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
  }
}, 300)

// 执行搜索
const performSearch = async (isLoadMore = false) => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return
  
  if (!isLoadMore) {
    loading.value = true
    offset.value = 0
    hasSearched.value = true
    showSuggestions.value = false
  } else {
    loadingMore.value = true
  }
  
  try {
    const res = await api.search(keyword, currentTab.value, limit, offset.value)
    if (res.code === 200 && res.result) {
      const result = res.result
      
      switch (currentTab.value) {
        case 1: // 单曲
          if (isLoadMore) {
            searchResult.songs.push(...(result.songs || []))
          } else {
            searchResult.songs = result.songs || []
          }
          searchResult.hasMore = result.hasMore || false
          break
        case 1000: // 歌单
          searchResult.playlists = (result.playlists || []).map((p: any) => ({
            ...p,
            coverImgUrl: p.coverImgUrl,
          }))
          searchResult.hasMore = result.hasMore || false
          break
        case 100: // 歌手
          searchResult.artists = result.artists || []
          searchResult.hasMore = result.hasMore || false
          break
        case 10: // 专辑
          searchResult.albums = result.albums || []
          searchResult.hasMore = result.hasMore || false
          break
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 处理输入
const handleInput = () => {
  fetchSuggestions(searchKeyword.value)
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    searchKeyword.value = defaultKeyword.value
  }
  
  // 更新路由
  router.push({
    name: 'SearchWithParams',
    params: {
      wd: encodeURIComponent(searchKeyword.value.trim()),
      type: currentTab.value.toString()
    }
  })
  
  performSearch()
}

// 根据关键词搜索
const searchByKeyword = (keyword: string) => {
  searchKeyword.value = keyword
  showSuggestions.value = false
  
  // 更新路由
  router.push({
    name: 'SearchWithParams',
    params: {
      wd: encodeURIComponent(keyword),
      type: currentTab.value.toString()
    }
  })
  
  performSearch()
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  suggestions.value = []
  hasSearched.value = false
  showSuggestions.value = false
}

// 高亮关键词
const highlightKeyword = (text: string) => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 加载更多
const loadMore = () => {
  offset.value += limit
  performSearch(true)
}

// 播放歌曲
const playSong = async (song: ISong) => {
  await playerStore.play(song)
}

// 跳转方法
const goBack = () => router.back()
const goToPlaylist = (playlist: IPlaylist) => router.push(`/playlist/${playlist.id}`)
const goToArtist = (id: number) => router.push(`/artist/${id}`)
const goToAlbum = (id: number) => router.push(`/album/${id}`)

// 监听标签页变化
watch(currentTab, (newTab, _oldTab) => {
  // 如果是因为路由参数变化导致的标签页变化，则不更新路由
  if (route.params.type && parseInt(route.params.type as string) === newTab) {
    if (hasSearched.value && searchKeyword.value) {
      performSearch()
    }
    return
  }
  
  if (hasSearched.value && searchKeyword.value) {
    // 更新路由
    router.push({
      name: 'SearchWithParams',
      params: {
        wd: encodeURIComponent(searchKeyword.value.trim()),
        type: newTab.toString()
      }
    })
    
    performSearch()
  }
})

// 监听路由参数变化
watch(() => [route.params.wd, route.params.type], ([wd, type]) => {
  if (wd) {
    searchKeyword.value = decodeURIComponent(wd as string)
    if (type) {
      const typeNum = parseInt(type as string)
      const tab = tabs.find(t => t.type === typeNum)
      if (tab) {
        currentTab.value = typeNum
      }
    }
    performSearch()
  }
}, { immediate: true })

onMounted(() => {
  fetchDefaultKeyword()
  fetchHotSearch()
  
  // 如果路由中有参数，则使用路由参数进行搜索
  if (route.params.wd) {
    searchKeyword.value = decodeURIComponent(route.params.wd as string)
    if (route.params.type) {
      const typeNum = parseInt(route.params.type as string)
      const tab = tabs.find(t => t.type === typeNum)
      if (tab) {
        currentTab.value = typeNum
      }
    }
    performSearch()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.search-page {
  min-height: 100vh;
  padding-bottom: 120px;
}

.search-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  background: rgba($bg-primary, 0.95);
  backdrop-filter: blur(20px);
}

.header-back {
  width: 36px;
  height: 36px;
  @include flex-center;
  color: $text-secondary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  flex-shrink: 0;
  
  &:active {
    background: $bg-card;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: $bg-card;
  border-radius: $radius-full;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: $text-muted;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
  background: none;
  border: none;
  outline: none;
  
  &::placeholder {
    color: $text-muted;
  }
}

.clear-btn {
  width: 18px;
  height: 18px;
  @include flex-center;
  color: $text-muted;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background $transition-fast $ease-default;

  &:hover {
    background-color: $bg-hover;
  }
  
  svg {
    width: 90%;
    height: 90%;
  }
}

.header-search-btn {
  padding: $spacing-sm $spacing-md;
  font-size: $font-sm;
  color: $primary-color;
  font-weight: 500;
  flex-shrink: 0;
}

.search-suggestions {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background: $bg-secondary;
  z-index: $z-dropdown;
  padding: $spacing-sm 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
  }
}

.suggestion-icon {
  width: 16px;
  height: 16px;
  color: $text-muted;
}

.suggestion-text {
  font-size: $font-sm;
  color: $text-primary;
  
  :deep(.highlight) {
    color: $primary-color;
  }
}

.search-content {
  padding: $spacing-lg;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  cursor: pointer;
  @include tap-effect;
}

.hot-rank {
  width: 24px;
  text-align: center;
  font-size: $font-md;
  font-weight: 600;
  color: $text-muted;
  
  &.rank-top {
    color: $primary-color;
  }
}

.hot-info {
  flex: 1;
  min-width: 0;
}

.hot-keyword {
  font-size: $font-sm;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.hot-icon {
  height: 12px;
  width: auto;
}

.hot-content {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: 2px;
}

.hot-score {
  font-size: $font-xs;
  color: $text-muted;
}

.result-tabs {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.tab-item {
  padding: $spacing-sm 0;
  font-size: $font-sm;
  color: $text-tertiary;
  position: relative;
  transition: color $transition-fast $ease-default;
  
  &.tab-active {
    color: $primary-color;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: $primary-color;
      border-radius: $radius-full;
    }
  }
}

.result-loading {
  padding: $spacing-xl 0;
}

.result-empty {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-muted;
  font-size: $font-sm;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.artists-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.artist-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  @include tap-effect;
}

.artist-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.artist-name {
  font-size: $font-xs;
  color: $text-secondary;
  max-width: 80px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.album-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  cursor: pointer;
  @include tap-effect;
}

.album-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: $radius-md;
  object-fit: cover;
}

.album-name {
  font-size: $font-xs;
  color: $text-secondary;
}

.album-artist {
  font-size: 10px;
  color: $text-muted;
}

.load-more {
  width: 100%;
  padding: $spacing-md;
  margin-top: $spacing-md;
  font-size: $font-sm;
  color: $text-secondary;
  background: $bg-card;
  border-radius: $radius-md;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>