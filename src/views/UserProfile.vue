<template>
  <div class="user-profile-page">
    <PageHeader 
      :title="headerScrolled ? '用户主页' : ''" 
      :show-back="true"
      :scroll-threshold="200"
      @back="goBack"
      @scroll="handleHeaderScroll"
    />

    <ScrollContainer 
      ref="contentRef" 
      :load-more-threshold="300"
      @load-more="loadMoreEvents"
    >
      <!-- 用户信息 -->
      <section v-if="userDetail" class="user-header">
        <div class="header-bg" :style="{ backgroundImage: `url(${userDetail.backgroundUrl})` }"></div>
        <div class="header-content">
          <img :src="userDetail.avatarUrl" :alt="userDetail.nickname" class="user-avatar" />
          <div class="user-info">
            <h2 class="user-name">{{ userDetail.nickname }}</h2>
            <p v-if="userDetail.signature" class="user-signature">{{ userDetail.signature }}</p>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">{{ eventCount }}</span>
            <span class="stat-label">动态</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ followCount }}</span>
            <span class="stat-label">关注</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ followerCount }}</span>
            <span class="stat-label">粉丝</span>
          </div>
        </div>
      </section>

      <!-- 标签页 -->
      <TabNavigation 
        :tabs="tabs"
        v-model="currentTab"
        @tab-change="(value) => switchTab(value as 'events' | 'created' | 'collected')"
      />

      <!-- 用户动态 -->
      <section v-if="currentTab === 'events'" class="events-section">
        <div v-if="loadingEvents && events.length === 0" class="loading">
          <Loading :visible="true" />
        </div>

        <div v-else-if="events.length === 0" class="empty">
          <p>暂无动态</p>
        </div>

        <div v-else class="events-list">
          <div v-for="event in events" :key="event.id" class="event-item">
            <div class="event-header">
              <img :src="event.user.avatarUrl" :alt="event.user.nickname" class="event-avatar" />
              <div class="event-user-info">
                <span class="event-user-name">{{ event.user.nickname }}</span>
                <span class="event-time">{{ formatTime(event.eventTime) }}</span>
              </div>
            </div>
            <div class="event-content">
              <p class="event-text">{{ getEventText(event) }}</p>
              <div v-if="getEventResource(event)" class="event-resource" @click="handleEventClick(event)">
                <img v-if="getEventCover(event)" :src="getEventCover(event)!" class="resource-cover" />
                <div class="resource-info">
                  <p class="resource-name">{{ getEventResource(event)?.name }}</p>
                  <p class="resource-desc">{{ getEventResourceDesc(event) }}</p>
                </div>
              </div>
            </div>
            <div class="event-actions">
              <button class="action-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span>{{ event.likedCount || 0 }}</span>
              </button>
              <button class="action-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
                <span>{{ event.commentCount || 0 }}</span>
              </button>
              <button class="action-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span>{{ event.forwardCount || 0 }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasMoreEvents && events.length > 0" class="load-more">
          <Loading v-if="loadingMoreEvents" :visible="true" />
        </div>
      </section>

      <!-- 创建的歌单 -->
      <section v-if="currentTab === 'created'" class="playlists-section">
        <PlaylistList :user-id="userId" :show-tabs="false" :playlist-type="'created'" />
      </section>

      <!-- 收藏的歌单 -->
      <section v-if="currentTab === 'collected'" class="playlists-section">
        <PlaylistList :user-id="userId" :show-tabs="false" :playlist-type="'collected'" />
      </section>

      <div class="bottom-spacer"></div>
    </ScrollContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { IUser, IUserEvent } from '@/api/types'
import Loading from '@/components/Loading.vue'
import PlaylistList from '@/components/UserPlaylist.vue'
import { PageHeader, ScrollContainer, TabNavigation } from '@/components/common'
import { getUserDetail, getUserEvent, getUserFollower, getUserFollows } from '@/api'

const router = useRouter()
const route = useRoute()

const userId = ref(Number(route.params.id))
const userDetail = ref<IUser | null>(null)
const events = ref<IUserEvent[]>([])
const currentTab = ref<'events' | 'created' | 'collected'>('events')
const loadingEvents = ref(false)
const loadingMoreEvents = ref(false)
const headerScrolled = ref(false)
const contentRef = ref<HTMLElement>()
const lastEventTime = ref(-1)
const hasMoreEvents = ref(true)
const isFollowing = ref(false)

const eventCount = ref(0)
const followCount = ref(0)
const followerCount = ref(0)

const tabs = [
  { label: '动态', value: 'events' },
  { label: '创建的歌单', value: 'created' },
  { label: '收藏的歌单', value: 'collected' }
]

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < month) return `${Math.floor(diff / day)}天前`

  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取动态文本
const getEventText = (event: IUserEvent): string => {
  try {
    const json = JSON.parse(event.json)
    return json.msg || ''
  } catch {
    return ''
  }
}

// 获取动态资源
const getEventResource = (event: IUserEvent): any => {
  try {
    const json = JSON.parse(event.json)
    return json.song || json.playlist || json.video || json.djprogram || null
  } catch {
    return null
  }
}

// 获取资源封面
const getEventCover = (event: IUserEvent): string | null => {
  const resource = getEventResource(event)
  if (!resource) return null
  return resource.coverImgUrl || resource.album?.picUrl || resource.coverUrl || null
}

// 获取资源描述
const getEventResourceDesc = (event: IUserEvent): string => {
  const resource = getEventResource(event)
  if (!resource) return ''

  if (resource.artists) {
    return resource.artists.map((a: any) => a.name).join(' / ')
  }
  if (resource.creator) {
    return resource.creator.nickname
  }
  return ''
}

// 获取用户详情
const fetchUserDetail = async () => {
  try {
    const data = await getUserDetail(userId.value)
    const follower = await getUserFollower(userId.value);
    const follow = await getUserFollows(userId.value);

    if (data.code === 200) {
      userDetail.value = data.profile
      followCount.value = follow.size || 0
      followerCount.value = follower.size || 0
      isFollowing.value = follow.followed || false
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
  }
}

// 获取用户动态
const fetchUserEvents = async (reset = false) => {
  if (reset) {
    lastEventTime.value = -1
    events.value = []
    hasMoreEvents.value = true
  }

  if (!hasMoreEvents.value) return

  const isFirstLoad = reset || events.value.length === 0
  if (isFirstLoad) loadingEvents.value = true
  else loadingMoreEvents.value = true

  try {
    const res = await getUserEvent(userId.value, 30, lastEventTime.value)

    if (res.code === 200) {
      const newEvents = res.events || []
      events.value = reset ? newEvents : [...events.value, ...newEvents]
      hasMoreEvents.value = res.more || false

      if (newEvents.length > 0) {
        lastEventTime.value = newEvents[newEvents.length - 1].eventTime
      }

      if (reset) {
        eventCount.value = res.size || 0
      }
    }
  } catch (error) {
    console.error('获取用户动态失败:', error)
  } finally {
    loadingEvents.value = false
    loadingMoreEvents.value = false
  }
}

// 切换标签
const switchTab = (tab: 'events' | 'created' | 'collected') => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理头部滚动
const handleHeaderScroll = (scrolled: boolean) => {
  headerScrolled.value = scrolled
}

// 加载更多动态
const loadMoreEvents = () => {
  if (currentTab.value === 'events' && !loadingMoreEvents.value && hasMoreEvents.value) {
    fetchUserEvents()
  }
}

// 处理动态点击
const handleEventClick = (event: IUserEvent) => {
  const resource = getEventResource(event)
  if (!resource) return

  // 根据资源类型跳转
  if (resource.id) {
    if (event.type === 18) { // 分享歌曲
      // 跳转到歌曲详情或播放
      console.log('播放歌曲:', resource.id)
    } else if (event.type === 35 || event.type === 13) { // 分享歌单
      router.push({ name: 'Playlist', params: { id: resource.id } })
    }
  }
}

const goBack = () => router.back()

onMounted(() => {
  fetchUserDetail()
  fetchUserEvents(true)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.user-profile-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: $bg-primary;
}

.user-header {
  position: relative;
  padding: $spacing-xl $spacing-lg;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  opacity: 0.3;
  z-index: -1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.user-signature {
  font-size: $font-sm;
  color: $text-tertiary;
  line-height: 1.4;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: $spacing-md 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
}

.stat-label {
  font-size: $font-sm;
  color: $text-tertiary;
}

.events-section,
.playlists-section {
  padding: $spacing-md 0;
}

.loading,
.empty,
.load-more {
  padding: $spacing-xl 0;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.event-item {
  padding: $spacing-md $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  margin: 0 $spacing-lg;
}

.event-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.event-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.event-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-user-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
}

.event-time {
  font-size: $font-xs;
  color: $text-tertiary;
}

.event-content {
  margin-bottom: $spacing-sm;
}

.event-text {
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.6;
  margin-bottom: $spacing-sm;
  white-space: pre-wrap;
}

.event-resource {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: rgba($text-primary, 0.05);
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  overflow: hidden;

  &:active {
    background: rgba($text-primary, 0.1);
  }
}

.resource-cover {
  width: 60px;
  height: 60px;
  border-radius: $radius-sm;
  object-fit: cover;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.resource-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-desc {
  font-size: $font-xs;
  color: $text-tertiary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-actions {
  display: flex;
  gap: $spacing-lg;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-color;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: $text-tertiary;
  font-size: $font-xs;

  svg {
    width: 16px;
    height: 16px;
  }
}

.bottom-spacer {
  height: 80px;
}
</style>