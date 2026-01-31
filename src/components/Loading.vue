<template>
  <div v-if="visible" class="loading-overlay" :class="{ 'loading-fullscreen': fullscreen }">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  text?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '',
  fullscreen: false,
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xl;
  
  &.loading-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba($bg-primary, 0.9);
    backdrop-filter: blur(10px);
    z-index: $z-modal;
  }
}

.loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  &:nth-child(2) {
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
    border-top-color: $primary-light;
    animation-duration: 0.8s;
    animation-direction: reverse;
  }
  
  &:nth-child(3) {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border-top-color: $info-color;
    animation-duration: 0.6s;
  }
}

.loading-text {
  font-size: $font-sm;
  color: $text-secondary;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
