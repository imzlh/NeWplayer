<template>
  <div class="playlist-recommend">
    <header class="header" :class="{ scrolled: headerScrolled }">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="title" :class="{ visible: headerScrolled }">歌单推荐</h1>
      <div class="placeholder"></div>
    </header>
    
    <main class="content" ref="contentRef" @scroll="handleScroll">
      <!-- 分类选择 -->
      <section class="category-section">
        <div class="category-scroll">
          <button
            v-for="cat in categories"
            :key="cat.name"
            :class="['category-item', { active: currentCategory === cat.name }]"
            @click="switchCategory(cat.name)"
          >
            {{ cat.name }}
          </button>
        </div>
      </section>
      
      <!-- 歌单网格 -->
      <section class="playlist-section">
        <div v-if="loading && playlists.length === 0" class="loading">
          <Loading :visible="true" />
        </div>
        <div v-else class="playlist-grid">
          <div
            v-for="playlist in playlists"
            :key="playlist.id"
            class="playlist-card"
            @click="goToPlaylist(playlist.id)"
          >
            <div class="cover-wrapper">
              <img :src="playlist.coverImgUrl" :alt="playlist.name" class="cover" />
              <div class="play-count">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {{ formatCount(playlist.playCount) }}
              </div>
            </div>
            <h3 class="playlist-name">{{ playlist.name }}</h3>
          </div>
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <Loading v-if="loadingMore" :visible="true" />
          <span v-else>{{ loadMoreTrigger ? '加载中...' : '上滑加载更多' }}</span>
        </div>
        
        <div v-if="!hasMore && playlists.length > 0" class="no-more">
          没有更多了
        </div>
      </section>
      
      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as api from '@/api'
import type { IPlaylistType } from '@/api/types'
import Loading from '@/components/Loading.vue'
import { showAction } from '@/stores/action'

const router = useRouter()
const route = useRoute()

// 状态
const playlists = ref<{
  id: number,
  name: string,
  coverImgUrl: string,
  playCount: number,
}[]>([])
const categories = ref<IPlaylistType[]>([])
// 从URL参数中获取当前分类
const currentCategory = ref((route.query.cat as string) || '全部')
const loading = ref(false)
const loadingMore = ref(false)
const headerScrolled = ref(false)
const contentRef = ref<HTMLElement>()
const currentPage = ref(0)
const hasMore = ref(true)
const loadMoreTrigger = ref(false)

// 默认分类
const defaultCategories = [
  { name: '全部', hot: true },
  { name: '华语', hot: true },
  { name: '流行', hot: true },
  { name: '摇滚', hot: false },
  { name: '民谣', hot: false },
  { name: '电子', hot: false },
  { name: '轻音乐', hot: false },
  { name: '古典', hot: false },
  { name: '爵士', hot: false },
]

// 格式化播放量
const formatCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  return count.toString()
}

// 获取歌单分类
const fetchCategories = async () => {
  try {
    const res = await api.getPlaylistCatlist()
    if (res.code === 200 && res.sub) {
      categories.value = [
        { name: '全部', hot: true } as IPlaylistType,
        ...res.sub.filter((cat: IPlaylistType) => cat.hot).slice(0, 10)
      ]
    } else {
      categories.value = defaultCategories as IPlaylistType[]
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    categories.value = defaultCategories as IPlaylistType[]
  }
}

// 获取歌单列表
const fetchPlaylists = async (reset = false) => {
  if (reset) {
    currentPage.value = 0
    playlists.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value) return
  
  const isFirstLoad = reset || playlists.value.length === 0
  if (isFirstLoad) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const cat = currentCategory.value === '全部' ? '' : currentCategory.value
    const offset = currentPage.value * 30
    const res = await api.getTopPlaylists(undefined, cat, 30, offset)
    
    if (res.code === 200 && res.playlists) {
      const newPlaylists = res.playlists.map((item: any) => ({
        id: item.id,
        name: item.name,
        coverImgUrl: item.coverImgUrl,
        playCount: item.playCount,
        trackCount: item.trackCount,
        description: item.description
      }))
      
      playlists.value = reset ? newPlaylists : [...playlists.value, ...newPlaylists]
      hasMore.value = newPlaylists.length === 30
      currentPage.value++
    }
  } catch (error) {
    console.error('获取歌单失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    loadMoreTrigger.value = false
  }
}

// 切换分类
const switchCategory = (cat: string) => {
  if (currentCategory.value === cat) {
    if (cat == '全部') { // use action
      showAction(categories.value.map((cat: IPlaylistType) => ({
        key: cat.type,
        label: cat.name,
        callback: () => {
          currentCategory.value = cat.type.toString()
          updateURL()
          fetchPlaylists(true)
        }
      })));
    }
    return;
  }
  currentCategory.value = cat
  updateURL()
  fetchPlaylists(true)
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 更新URL参数
const updateURL = () => {
  router.replace({
    query: {
      ...route.query,
      cat: currentCategory.value === '全部' ? undefined : currentCategory.value
    }
  })
}

// 滚动处理
const handleScroll = () => {
  if (!contentRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = contentRef.value
  headerScrolled.value = scrollTop > 100
  
  // 距离底部 12.5rem /* 200px */ 时触发加载
  if (scrollHeight - scrollTop - clientHeight < 200 && !loadingMore.value && hasMore.value) {
    loadMoreTrigger.value = true
    fetchPlaylists()
  }
}

// 跳转到歌单详情
const goToPlaylist = (id: number) => {
  router.push({ name: 'Playlist', params: { id } })
}

const goBack = () => router.back()

// 监听路由参数变化
watch(() => route.query.cat, (newCat) => {
  const catValue = Array.isArray(newCat) ? newCat[0] : newCat
  if (catValue && catValue !== currentCategory.value) {
    currentCategory.value = catValue
    fetchPlaylists(true)
  } else if (!catValue && currentCategory.value !== '全部') {
    currentCategory.value = '全部'
    fetchPlaylists(true)
  }
})

onMounted(async () => {
  await fetchCategories()
  await fetchPlaylists(true)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlist-recommend {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
  background: $bg-primary;
}

.header {
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
  
  &.scrolled {
    background: rgba($bg-primary, 0.95);
    backdrop-filter: blur(1.25rem /* 20px */);
    box-shadow: 0 0.125rem /* 2px */ 0.5rem /* 8px */ rgba(0, 0, 0, 0.1);
  }
}

.back-btn {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: $text-primary;
  border-radius: 50%;
  background: rgba($text-primary, 0.1);
  
  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
  }
}

.title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  opacity: 0;
  transition: opacity $transition-normal $ease-default;
  
  &.visible {
    opacity: 1;
  }
}

.placeholder {
  width: 2.25rem /* 36px */;
}

.content {
  height: 100vh;
  overflow-y: auto;
  padding-top: 3.75rem /* 60px */;
}

.category-section {
  position: sticky;
  top: 0;
  background: $bg-primary;
  z-index: 100;
  padding: $spacing-sm 0;
  border-bottom: 0.125rem /* 1px */ solid $border-color;
}

.category-scroll {
  display: flex;
  gap: $spacing-xs;
  padding: 0 $spacing-lg;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.category-item {
  flex-shrink: 0;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-full;
  font-size: $font-sm;
  color: $text-secondary;
  background: transparent;
  transition: all $transition-fast $ease-default;
  white-space: nowrap;
  
  &.active {
    background: $gradient-primary;
    color: white;
    font-weight: 500;
  }
}

.playlist-section {
  padding: $spacing-lg $spacing-lg;
}

.loading, .load-more, .no-more {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.playlist-card {
  cursor: pointer;
  transition: transform $transition-fast $ease-default;
  
  &:active {
    transform: scale(0.98);
  }
}

.cover-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-bottom: $spacing-sm;
}

.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-count {
  position: absolute;
  top: 0.25rem /* 4px */;
  right: 0.25rem /* 4px */;
  display: flex;
  align-items: center;
  gap: 0.125rem /* 2px */;
  padding: 0.125rem /* 2px */ 0.375rem /* 6px */;
  background: rgba(0, 0, 0, 0.6);
  border-radius: $radius-sm;
  color: white;
  font-size: 0.75rem /* 11px */;
  
  svg {
    width: 0.75rem /* 12px */;
    height: 0.75rem /* 12px */;
  }
}

.playlist-name {
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bottom-spacer {
  height: 5rem /* 80px */;
}
</style>