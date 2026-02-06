<template>
  <header class="page-header" :class="{ scrolled: isScrolled, transparent: transparent }">
    <button v-if="showBack" class="header-btn back-btn" @click="handleBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
    
    <div v-else class="header-placeholder"></div>
    
    <h1 class="header-title" :class="{ visible: isScrolled || alwaysShowTitle }">
      {{ title }}
    </h1>
    
    <div class="header-actions">
      <slot name="actions"></slot>
      <button v-if="!$slots.actions" class="header-btn placeholder-btn">
        <div></div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  title?: string
  showBack?: boolean
  transparent?: boolean
  alwaysShowTitle?: boolean
  scrollThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  transparent: false,
  alwaysShowTitle: false,
  scrollThreshold: 200
})

const emit = defineEmits<{
  back: []
  scroll: [isScrolled: boolean]
}>()

const isScrolled = ref(false)

const handleBack = () => {
  emit('back')
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  isScrolled.value = scrollTop > props.scrollThreshold
  emit('scroll', isScrolled.value)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.page-header {
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
  padding-top: calc(#{$spacing-md} + env(safe-area-inset-top));
  z-index: $z-sticky;
  transition: all $transition-normal $ease-default;

  &.transparent {
    background: transparent;
  }

  &.scrolled {
    background: rgba($bg-primary, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.header-btn {
  width: 36px;
  height: 36px;
  @include flex-center;
  color: $text-primary;
  border-radius: 50%;
  background: rgba($text-primary, 0.1);
  border: none;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }
}

.placeholder-btn {
  opacity: 0;
  pointer-events: none;
}

.header-placeholder {
  width: 36px;
}

.header-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  opacity: 0;
  transition: opacity $transition-normal $ease-default;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;

  &.visible {
    opacity: 1;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}
</style>