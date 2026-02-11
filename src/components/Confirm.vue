<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmStore.showConfirmDialog.value" class="confirm-overlay" @click="handleOverlayClick">
        <div class="confirm-dialog" @click.stop>
          <header class="dialog-header" v-if="confirmStore.confirmTitle.value">
            <h3>{{ confirmStore.confirmTitle.value }}</h3>
          </header>
          
          <main class="dialog-content">
            <p>{{ confirmStore.confirmMessage.value }}</p>
          </main>
          
          <footer class="dialog-actions">
            <button class="action-btn btn-cancel" @click="cancelAction">
              取消
            </button>
            <button class="action-btn btn-confirm" @click="confirmAction">
              确定
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { confirmStore, confirmAction, cancelAction } from '@/stores/confirm'

const handleOverlayClick = () => {
  cancelAction()
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-fixed + 100;
  @include flex-center;
}

.confirm-dialog {
  width: 85%;
  max-width: 300px;
  background: $bg-primary;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: $spacing-lg $spacing-lg $spacing-md;
  border-bottom: 1px solid $border-light;
  
  h3 {
    margin: 0;
    font-size: $font-lg;
    font-weight: 600;
    color: $text-primary;
  }
}

.dialog-content {
  padding: $spacing-lg;
  
  p {
    margin: 0;
    font-size: $font-md;
    color: $text-primary;
    line-height: 1.5;
    text-align: center;
  }
}

.dialog-actions {
  display: flex;
  border-top: 1px solid $border-light;
}

.action-btn {
  flex: 1;
  padding: $spacing-md 0;
  background: transparent;
  border: none;
  font-size: $font-md;
  font-weight: 500;
  transition: all $transition-fast $ease-default;
  
  &.btn-cancel {
    color: $text-secondary;
    
    &:hover {
      background: rgba($text-secondary, 0.1);
      color: $text-primary;
    }
  }
  
  &.btn-confirm {
    color: $primary-color;
    font-weight: 600;
    
    &:hover {
      background: rgba($primary-color, 0.1);
    }
    
    &:active {
      background: rgba($primary-color, 0.2);
    }
  }
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .confirm-dialog,
.fade-leave-active .confirm-dialog {
  transition: all 0.3s ease;
}

.fade-enter-from .confirm-dialog,
.fade-leave-to .confirm-dialog {
  transform: scale(0.9);
  opacity: 0;
}
</style>