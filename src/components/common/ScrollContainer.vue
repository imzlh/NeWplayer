<template>
  <div class="scroll-container" ref="containerRef" @scroll="handleScroll">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  loadMoreThreshold?: number
  enableLoadMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loadMoreThreshold: 300,
  enableLoadMore: true
})

const emit = defineEmits<{
  scroll: [scrollTop: number, scrollHeight: number, clientHeight: number]
  loadMore: []
}>()

const containerRef = ref<HTMLElement>()

const handleScroll = () => {
  if (!containerRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  
  emit('scroll', scrollTop, scrollHeight, clientHeight)
  
  // 检查是否需要加载更多
  if (props.enableLoadMore && scrollHeight - scrollTop - clientHeight < props.loadMoreThreshold) {
    emit('loadMore')
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.scroll-container {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>