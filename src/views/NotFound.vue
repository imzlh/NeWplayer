<template>
  <div class="notfound-page">
    <div class="notfound-content">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </div>
      <h1 class="error-code">404</h1>
      <p class="error-message">页面不存在</p>
      <p class="error-tip">你可能访问了一个错误的链接</p>
      <button class="back-btn" @click="goHome">
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => router.push('/')
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.notfound-page {
  min-height: 100vh;
  @include flex-center;
  padding: $spacing-lg;
}

.notfound-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon {
  width: 100px;
  height: 100px;
  color: $text-muted;
  margin-bottom: $spacing-lg;
  
  svg {
    width: 100%;
    height: 100%;
  }
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  color: $primary-color;
  line-height: 1;
  margin-bottom: $spacing-sm;
}

.error-message {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.error-tip {
  font-size: $font-sm;
  color: $text-tertiary;
  margin-bottom: $spacing-xl;
}

.back-btn {
  padding: $spacing-md $spacing-xl;
  font-size: $font-sm;
  font-weight: 500;
  color: white;
  background: $gradient-primary;
  border-radius: $radius-full;
  transition: all $transition-fast $ease-default;
  
  &:active {
    transform: scale(0.98);
  }
}
</style>
