<template>
  <div class="toplist-page">
    <header class="header" :class="{ scrolled: headerScrolled }">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="title" :class="{ visible: headerScrolled }">排行榜</h1>
      <div class="placeholder"></div>
    </header>

    <main class="content" ref="contentRef" @scroll="handleScroll">
      <!-- 榜单列表 -->
      <section class="toplist-section">
        <div v-if="loading" class="loading">
          <Loading :visible="true" />
        </div>

        <div v-else-if="toplistData.length === 0" class="empty">
          <p>暂无榜单</p>
        </div>

        <div v-else class="toplist-grid">
          <div v-for="toplist in toplistData" :key="toplist.id" class="toplist-item" @click="goToPlaylist(toplist.id)">
            <div class="toplist-cover">
              <img :src="toplist.coverImgUrl" :alt="toplist.name" class="cover" />
              <div class="play-count">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {{ formatCount(toplist.playCount) }}
              </div>
            </div>
            <div class="toplist-info">
              <h3 class="toplist-name">{{ toplist.name }}</h3>
              <p class="update-time">{{ toplist.updateTime }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { IToplist } from '@/api/types'
import Loading from '@/components/Loading.vue'
import { getAllTopLists } from '@/api'

const router = useRouter()

// 状态
const toplistData = ref<IToplist[]>([])
const loading = ref(false)
const headerScrolled = ref(false)
const contentRef = ref<HTMLElement>()

// 格式化播放量
const formatCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  return count.toString()
}

// 获取排行榜列表
const fetchToplists = async () => {
  loading.value = true
  try {
    const data = await getAllTopLists()
    toplistData.value = data.list
  } catch (error) {
    console.error('获取排行榜失败:', error)
  } finally {
    loading.value = false
  }
}

// 滚动处理
const handleScroll = () => {
  if (!contentRef.value) return
  headerScrolled.value = contentRef.value.scrollTop > 200
}

// 跳转到歌单详情页
const goToPlaylist = (id: number) => {
  router.push(`/playlist/${id}`)
}

const goBack = () => router.back()

// 初始化数据
fetchToplists()
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.toplist-page {
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
  top: 3.75rem /* 60px */;
  background: $bg-primary;
  z-index: $z-fixed;
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

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.toplist-section {
  padding: $spacing-md $spacing-lg;
}

.loading,
.empty {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
}

.toplist-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.toplist-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  cursor: pointer;
  transition: transform $transition-fast $ease-default;
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
  }
}

.toplist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: $radius-md;
  overflow: hidden;
  
  .cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .play-count {
    position: absolute;
    top: $spacing-xs;
    right: $spacing-xs;
    display: flex;
    align-items: center;
    gap: 0.25rem /* 4px */;
    padding: 0.25rem /* 4px */ $spacing-xs;
    background: rgba(0, 0, 0, 0.6);
    border-radius: $radius-full;
    font-size: $font-xs;
    color: white;
    
    svg {
      width: 0.75rem /* 12px */;
      height: 0.75rem /* 12px */;
    }
  }
}

.toplist-info {
  padding: 0 $spacing-xs;
  
  .toplist-name {
    font-size: $font-sm;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 0.25rem /* 4px */;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .update-time {
    font-size: $font-xs;
    color: $text-tertiary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.bottom-spacer {
  height: 5rem /* 80px */;
}
</style>