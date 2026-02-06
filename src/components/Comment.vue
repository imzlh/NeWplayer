<template>
  <div class="comment-list">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <!-- 评论类型切换 -->
      <section class="tab-section">
        <button v-for="tab in tabs" :key="tab.value" :class="['tab-item', { active: currentTab === tab.value }]"
          @click="switchTab(tab.value)">
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="count">({{ formatCount(tab.count) }})</span>
        </button>
      </section>
    </header>

    <main class="content" ref="contentRef" @scroll="handleScroll">
      <!-- 评论列表 -->
      <section class="comments-section">
        <div v-if="loading && comments.length === 0" class="loading">
          <Loading :visible="true" />
        </div>

        <div v-else-if="comments.length === 0" class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>暂无评论</p>
        </div>

        <div v-else class="comments-wrapper">
          <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
            <img :src="comment.user.avatarUrl" :alt="comment.user.nickname" class="avatar"
              @click="goToUser(comment.user.userId)" />

            <div class="comment-content">
              <div class="user-info">
                <span class="nickname" @click="goToUser(comment.user.userId)">
                  {{ comment.user.nickname }}
                </span>
                <span class="time">{{ formatTime(comment.time) }}</span>
              </div>

              <p class="text">{{ comment.content }}</p>

              <!-- 回复的评论 -->
              <div v-if="comment.beReplied && comment.beReplied.length > 0" class="replied">
                <div v-for="replied in comment.beReplied" :key="replied.commentId" class="replied-item">
                  <span class="replied-user">@{{ replied.user.nickname }}：</span>
                  <span class="replied-text">{{ replied.content }}</span>
                </div>
              </div>

              <div class="actions">
                <button :class="['like-btn', { liked: comment.liked }]" @click="toggleLike(comment)">
                  <svg viewBox="0 0 24 24" :fill="comment.liked ? 'currentColor' : 'none'" stroke="currentColor"
                    stroke-width="2">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span v-if="comment.likedCount > 0">{{ formatCount(comment.likedCount) }}</span>
                </button>

                <button class="reply-btn" @click="reply(comment)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore && comments.length > 0" class="load-more">
          <Loading v-if="loadingMore" :visible="true" />
          <span v-else>{{ loadMoreTrigger ? '加载中...' : '上滑加载更多' }}</span>
        </div>

        <div v-if="!hasMore && comments.length > 0" class="no-more">
          没有更多评论了
        </div>
      </section>

      <div class="bottom-spacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMusicComment,
  getAlbumComment,
  getPlaylistComment,
  getHotComment,
  likeComment,
  unlikeComment
} from '@/api'
import type { IComment } from '@/api/types'
import Loading from '@/components/Loading.vue'

// 定义 props
interface Props {
  resourceId: number
  resourceType: 'song' | 'playlist' | 'album'
}

const props = defineProps<Props>()
const router = useRouter()
const emit = defineEmits(['close'])

// 状态
const comments = ref<IComment[]>([])
const currentTab = ref<'hot' | 'latest'>('latest')
const loading = ref(false)
const loadingMore = ref(false)
const contentRef = ref<HTMLElement>()
const currentOffset = ref(0)
const hasMore = ref(true)
const loadMoreTrigger = ref(false)
const totalCount = ref(0)

// 标签配置
const tabs = computed(() => [
  { label: '最新评论', value: 'latest' as const, count: totalCount.value },
  { label: '热门评论', value: 'hot' as const }
])

// 资源类型映射到API类型
const typeMap = { song: 0, playlist: 2, album: 3 } as const

// 获取评论API函数映射
const getCommentApi = {
  song: getMusicComment,
  playlist: getPlaylistComment,
  album: getAlbumComment
}

// 格式化数字
const formatCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  return count.toString()
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < month) return `${Math.floor(diff / day)}天前`
  if (diff < year) return `${Math.floor(diff / month)}个月前`

  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取评论
const fetchComments = async (reset = false) => {
  if (reset) {
    currentOffset.value = 0
    comments.value = []
    hasMore.value = true
  }

  if (!hasMore.value) return

  const isFirstLoad = reset || comments.value.length === 0
  if (isFirstLoad) loading.value = true
  else loadingMore.value = true

  try {
    let res

    if (currentTab.value === 'hot') {
      // 热门评论使用专门的接口
      res = await getHotComment(props.resourceId, typeMap[props.resourceType], 20, currentOffset.value)

      if (res.code === 200) {
        const newComments = res.hotComments || []
        comments.value = reset ? newComments : [...comments.value, ...newComments]
        hasMore.value = res.more ?? (newComments.length === 20)
        currentOffset.value += newComments.length
      }
    } else {
      // 最新评论使用对应资源类型的接口
      const apiFunc = getCommentApi[props.resourceType]
      res = await apiFunc(props.resourceId, 20, currentOffset.value)

      if (res.total) {
        const newComments = res.comments || []
        comments.value = reset ? newComments : [...comments.value, ...newComments]
        hasMore.value = res.more ?? (newComments.length === 20)
        currentOffset.value += newComments.length

        if (reset) totalCount.value = res.total || 0
      }
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    loadMoreTrigger.value = false
  }
}

// 切换标签
const switchTab = (tab: 'hot' | 'latest') => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  fetchComments(true)
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 滚动处理
const handleScroll = () => {
  if (!contentRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = contentRef.value
  if (scrollHeight - scrollTop - clientHeight < 300 && !loadingMore.value && hasMore.value) {
    loadMoreTrigger.value = true
    fetchComments()
  }
}

// 点赞
const toggleLike = async (comment: IComment) => {
  try {
    if (comment.liked) {
      await unlikeComment(props.resourceId, comment.commentId, typeMap[props.resourceType])
      comment.liked = false
      comment.likedCount = Math.max(0, comment.likedCount - 1)
    } else {
      await likeComment(props.resourceId, comment.commentId, typeMap[props.resourceType])
      comment.liked = true
      comment.likedCount++
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 回复评论
const reply = (comment: IComment) => {
  // TODO: 实现回复功能
  console.log('回复评论:', comment)
}

// 跳转到用户主页
const goToUser = (userId: number) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const goBack = () => emit('close')

onMounted(() => fetchComments(true))
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.comment-list {
  min-height: 100vh;
  padding-bottom: 7.5rem /* 120px */;
  background: $bg-primary;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-fixed;
  overflow-y: auto;
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
  background: rgba($bg-primary, 0.95);
  backdrop-filter: blur(1.25rem /* 20px */);
  box-shadow: 0 0.125rem /* 2px */ 0.5rem /* 8px */ rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 2.25rem /* 36px */;
  height: 2.25rem /* 36px */;
  @include flex-center;
  color: $text-primary;
  border-radius: 50%;
  background: rgba($text-primary, 0.1);
  flex-shrink: 0;

  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
  }
}

.content {
  height: 100vh;
  overflow-y: auto;
  padding-top: 3.75rem /* 60px */;
}

.tab-section {
  display: flex;
  gap: $spacing-md;
  border-bottom: 0.125rem /* 1px */ solid $border-color;
  flex-shrink: 1;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  width: 10rem /* 160px */;
  padding: $spacing-sm;
  font-size: $font-sm;
  font-weight: 500;
  color: $text-secondary;
  border-bottom: 0.125rem /* 2px */ solid transparent;
  transition: all $transition-fast $ease-default;

  .count {
    font-size: $font-xs;
    color: $text-tertiary;
    margin-left: 0.25rem /* 4px */;
  }

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
  }
}

.comments-section {
  padding: $spacing-md $spacing-lg;
}

.loading,
.load-more,
.no-more {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
}

.empty {
  padding: $spacing-xl * 2 0;
  text-align: center;
  color: $text-tertiary;

  svg {
    width: 4rem /* 64px */;
    height: 4rem /* 64px */;
    margin-bottom: $spacing-md;
    opacity: 0.3;
  }

  p {
    font-size: $font-sm;
  }
}

.comments-wrapper {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-top: 1rem;
}

.comment-item {
  display: flex;
  gap: $spacing-md;
}

.avatar {
  width: 2.5rem /* 40px */;
  height: 2.5rem /* 40px */;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.nickname {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;

  &:hover {
    color: $primary-color;
  }
}

.time {
  font-size: $font-xs;
  color: $text-tertiary;
}

.text {
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: $spacing-sm;
}

.replied {
  background: rgba($text-primary, 0.05);
  border-radius: $radius-md;
  padding: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.replied-item {
  font-size: $font-xs;
  line-height: 1.6;
  color: $text-secondary;

  .replied-user {
    color: $primary-color;
  }
}

.actions {
  display: flex;
  gap: $spacing-md;
}

.like-btn,
.reply-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem /* 4px */;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-xs;
  color: $text-tertiary;
  border-radius: $radius-sm;
  transition: all $transition-fast $ease-default;

  svg {
    width: 1rem /* 16px */;
    height: 1rem /* 16px */;
  }

  &:hover {
    background: rgba($text-primary, 0.05);
  }
}

.like-btn.liked {
  color: $primary-color;
}

.bottom-spacer {
  height: 5rem /* 80px */;
}

// slide-up动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>