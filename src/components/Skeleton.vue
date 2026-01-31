<template>
  <div class="skeleton" :class="{ 'skeleton-animated': animated }" :style="skeletonStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  width?: string | number
  height?: string | number
  circle?: boolean
  animated?: boolean
  radius?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  animated: true,
  circle: false,
})

const skeletonStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.circle) {
    style.borderRadius = '50%'
  } else if (props.radius) {
    style.borderRadius = typeof props.radius === 'number' ? `${props.radius}px` : props.radius
  }
  
  return style
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.skeleton {
  background: $bg-card;
  border-radius: $radius-sm;
  
  &.skeleton-animated {
    background: linear-gradient(
      90deg,
      $bg-card 25%,
      $bg-hover 50%,
      $bg-card 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
