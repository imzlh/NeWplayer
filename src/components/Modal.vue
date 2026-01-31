<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" :class="`modal-${size}`" @click.stop>
          <div v-if="title" class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button v-if="showClose" class="modal-close" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  showClose?: boolean
  size?: 'small' | 'medium' | 'large'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true,
  size: 'medium',
  closeOnOverlay: true,
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(0.625rem /* 10px */);
  z-index: $z-modal;
  @include flex-center;
  padding: $spacing-lg;
}

.modal-container {
  width: 100%;
  max-height: 80vh;
  background: $bg-card;
  border-radius: $radius-xl;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: scaleIn $transition-normal $ease-bounce;
  
  &.modal-small {
    max-width: 17.5rem /* 280px */;
  }
  
  &.modal-medium {
    max-width: 21.25rem /* 340px */;
  }
  
  &.modal-large {
    max-width: 23.75rem /* 380px */;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 0.125rem /* 1px */ solid $border-color;
}

.modal-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.modal-close {
  width: 1.75rem /* 28px */;
  height: 1.75rem /* 28px */;
  @include flex-center;
  color: $text-tertiary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }
  
  svg {
    width: 1.125rem /* 18px */;
    height: 1.125rem /* 18px */;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  @include scrollbar;
}

.modal-footer {
  padding: $spacing-md $spacing-lg;
  border-top: 0.125rem /* 1px */ solid $border-color;
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}

// 动画
.modal-enter-active,
.modal-leave-active {
  transition: all $transition-normal $ease-default;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal-container {
    transform: scale(0.9);
  }
}
</style>
