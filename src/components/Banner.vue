<template>
  <div
    class="banner-carousel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div
      class="banner-track"
      :style="trackStyle"
      @transitionend="handleTransitionEnd"
    >
      <!-- 克隆最后一张放在开头 -->
      <div
        v-if="banners.length > 1"
        class="banner-item"
        @click="handleClick(banners[banners.length - 1])"
      >
        <img
          :src="banners[banners.length - 1].pic"
          :alt="banners[banners.length - 1].typeTitle"
          loading="lazy"
        />
      </div>
      
      <!-- 正常轮播项 -->
      <div
        v-for="(banner, index) in banners"
        :key="index"
        class="banner-item"
        @click="handleClick(banner)"
      >
        <img :src="banner.pic" :alt="banner.typeTitle" loading="lazy"/>
        <span
          v-if="banner.typeTitle"
          class="banner-tag"
          :style="{ backgroundColor: banner.titleColor || '#ff4757' }"
        >
          {{ banner.typeTitle }}
        </span>
      </div>
      
      <!-- 克隆第一张放在结尾 -->
      <div
        v-if="banners.length > 1"
        class="banner-item"
        @click="handleClick(banners[0])"
      >
        <img :src="banners[0].pic" :alt="banners[0].typeTitle" loading="lazy"/>
      </div>
    </div>
    
    <!-- 指示器 -->
    <div v-if="banners.length > 1" class="banner-indicators">
      <span
        v-for="(_, index) in banners"
        :key="index"
        class="indicator-dot"
        :class="{ 'dot-active': currentIndex === index }"
        @click="goToSlide(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { IBanner } from '@/types'

interface Props {
  banners: IBanner[]
  autoplay?: boolean
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  interval: 5000,
})

const emit = defineEmits<{
  click: [banner: IBanner]
}>()

const currentIndex = ref(0)
const isTransitioning = ref(false)
const autoPlayTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 触摸相关
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)

// 计算轨道样式
const trackStyle = computed(() => {
  const offset = -(currentIndex.value + 1) * 100
  return {
    transform: `translateX(${offset}%)`,
    transition: isTransitioning.value ? 'transform 0.3s ease-out' : 'none',
  }
})

// 开始自动播放
const startAutoPlay = () => {
  if (!props.autoplay || props.banners.length <= 1) return
  stopAutoPlay()
  autoPlayTimer.value = setInterval(() => {
    next()
  }, props.interval)
}

// 停止自动播放
const stopAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// 下一张
const next = () => {
  if (isTransitioning.value || props.banners.length <= 1) return
  isTransitioning.value = true
  currentIndex.value++
}

// 上一张
const prev = () => {
  if (isTransitioning.value || props.banners.length <= 1) return
  isTransitioning.value = true
  currentIndex.value--
}

// 跳转到指定幻灯片
const goToSlide = (index: number) => {
  if (isTransitioning.value || index === currentIndex.value) return
  isTransitioning.value = true
  currentIndex.value = index
}

// 处理过渡结束
const handleTransitionEnd = () => {
  isTransitioning.value = false
  const len = props.banners.length
  
  // 处理边界情况
  if (currentIndex.value >= len) {
    currentIndex.value = 0
  } else if (currentIndex.value < 0) {
    currentIndex.value = len - 1
  }
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
  stopAutoPlay()
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      next()
    } else {
      prev()
    }
  }
  
  startAutoPlay()
}

const handleClick = (banner: IBanner) => {
  emit('click', banner)
}

// 监听banners变化
watch(() => props.banners, () => {
  currentIndex.value = 0
  startAutoPlay()
}, { immediate: true })

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.banner-carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: $radius-lg;
}

.banner-track {
  display: flex;
  width: 100%;
}

.banner-item {
  flex: 0 0 100%;
  position: relative;
  aspect-ratio: 3 / 1.2;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: $radius-lg;
  }
}

.banner-tag {
  position: absolute;
  bottom: $spacing-sm;
  right: $spacing-sm;
  padding: 2px 8px;
  border-radius: $radius-sm;
  font-size: 10px;
  color: white;
  font-weight: 500;
}

.banner-indicators {
  position: absolute;
  bottom: $spacing-sm;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all $transition-fast $ease-default;
  
  &.dot-active {
    width: 16px;
    border-radius: $radius-full;
    background: $primary-color;
  }
}
</style>
