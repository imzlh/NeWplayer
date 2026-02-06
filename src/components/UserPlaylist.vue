<template>
  <div class="playlist-list">
    <!-- 歌单列表 -->
    <div class="content">
      <div v-if="loading" class="loading">
        <Loading :visible="true" />
      </div>

      <div v-else-if="displayPlaylists.length === 0" class="empty">
        <p>暂无歌单</p>
      </div>

      <div v-else class="list">
        <div v-for="playlist in displayPlaylists" :key="playlist.id" class="playlist-item"
          @click="handleClick(playlist.id)">
          <img :src="getImageUrl(playlist.coverImgUrl)" :alt="playlist.name" class="cover" />
          <div class="info">
            <p class="name">{{ playlist.name }}</p>
            <p class="count">{{ playlist.trackCount }}首</p>
          </div>
          <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { IPlaylist } from '@/api/types'
import Loading from '@/components/Loading.vue'
import { getUserPlaylist } from '@/api'

interface Props {
  userId: number
  showTabs?: boolean
  autoFetch?: boolean
  playlistType?: 'created' | 'collected'
}

const props = withDefaults(defineProps<Props>(), {
  showTabs: true,
  autoFetch: true,
  playlistType: 'created'
})

const router = useRouter()
const playlists = ref<IPlaylist[]>([])
const loading = ref(false)
const currentTab = ref<'created' | 'collected'>('created')

// 计算显示的歌单
const displayPlaylists = computed(() => {
  if (!playlists.value.length) return []

  if (!props.showTabs) {
    // 如果不显示tab，则根据playlistType过滤
    if (props.playlistType === 'created') {
      return playlists.value.filter(p =>
        p.userId === props.userId && !p.specialType
      )
    } else {
      return playlists.value.filter(p =>
        p.userId !== props.userId || p.specialType === 5
      )
    }
  }

  // 如果显示tab，则根据currentTab过滤
  if (currentTab.value === 'created') {
    return playlists.value.filter(p =>
      p.userId === props.userId && !p.specialType
    )
  } else {
    return playlists.value.filter(p =>
      p.userId !== props.userId || p.specialType === 5
    )
  }
})

// 获取图片URL
const getImageUrl = (url: string): string => {
  return `${url}?param=120y120`
}

// 获取用户歌单
const fetchPlaylists = async () => {
  loading.value = true
  try {
    const res = await getUserPlaylist(props.userId);
    if (res.code === 200) {
      playlists.value = res.playlist || []
    }
  } catch (error) {
    console.error('获取歌单失败:', error)
  } finally {
    loading.value = false
  }
}

// 点击歌单
const handleClick = (id: number) => {
  router.push({ name: 'Playlist', params: { id } })
}

// 暴露方法供外部调用
defineExpose({
  fetchPlaylists
})

onMounted(() => {
  if (props.autoFetch) {
    fetchPlaylists()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playlist-list {
  width: 100%;
}

.content {
  padding: $spacing-md 0;
}

.loading,
.empty {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $bg-card;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-fast $ease-default;

  &:active {
    background: $bg-hover;
    transform: scale(0.98);
  }
}

.cover {
  width: 56px;
  height: 56px;
  border-radius: $radius-md;
  object-fit: cover;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: $font-sm;
  color: $text-primary;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count {
  font-size: $font-xs;
  color: $text-tertiary;
}

.arrow {
  width: 16px;
  height: 16px;
  color: $text-muted;
  flex-shrink: 0;
}
</style>