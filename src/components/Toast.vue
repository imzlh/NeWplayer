<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration: number
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

const showToast = (message: string, type: ToastItem['type'] = 'info', duration = 3000) => {
  const id = ++toastId
  const toast: ToastItem = {
    id,
    message,
    type,
    duration,
  }
  toasts.value.push(toast)
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// 暴露方法给外部使用
defineExpose({
  show: showToast,
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.toast-container {
  position: fixed;
  top: $spacing-lg;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-toast;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  pointer-events: none;
  padding: 0 $spacing-lg;
  width: 100%;
  max-width: $screen-width;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-lg;
  pointer-events: auto;
  cursor: pointer;
  @include glass-effect;
  
  &.toast-success {
    border-left: 0.25rem /* 3px */ solid $success-color;
    .toast-icon {
      color: $success-color;
    }
  }
  
  &.toast-error {
    border-left: 0.25rem /* 3px */ solid $error-color;
    .toast-icon {
      color: $error-color;
    }
  }
  
  &.toast-warning {
    border-left: 0.25rem /* 3px */ solid $warning-color;
    .toast-icon {
      color: $warning-color;
    }
  }
  
  &.toast-info {
    border-left: 0.25rem /* 3px */ solid $info-color;
    .toast-icon {
      color: $info-color;
    }
  }
}

.toast-icon {
  width: 1.125rem /* 18px */;
  height: 1.125rem /* 18px */;
  flex-shrink: 0;
}

.toast-message {
  font-size: $font-sm;
  color: $text-primary;
  line-height: 1.4;
}

// 动画
.toast-enter-active,
.toast-leave-active {
  transition: all $transition-normal $ease-default;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-1.25rem /* 20px */) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-1.25rem /* 20px */) scale(0.9);
}

.toast-leave-active {
  position: absolute;
}
</style>
