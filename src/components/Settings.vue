<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="show" class="settings-overlay" @click="handleOverlayClick">
        <div class="settings-panel" @click.stop>
          <header class="panel-header">
            <h3>设置</h3>
            <button class="close-btn" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>
          
          <main class="panel-content">
            <section class="setting-section">
              <h4 class="section-title">界面缩放</h4>
              <div class="setting-item">
                <div class="setting-control">
                  <button class="control-btn" @click="decreaseFontSize">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <div class="control-value">
                    <span class="value-text">{{ fontSize }}px ( {{ (fontSize / 16 * 100).toFixed(0) }}% )</span>
                  </div>
                  <button class="control-btn" @click="increaseFontSize">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="setting-desc">
                  调整界面元素大小，默认为16px
                </div>
              </div>
            </section>
            
            <section class="setting-section">
              <h4 class="section-title">预设大小</h4>
              <div class="preset-buttons">
                <button 
                  v-for="size in presetSizes" 
                  :key="size"
                  class="preset-btn"
                  :class="{ active: fontSize === size }"
                  @click="setFontSize(size)"
                >
                  {{ size }}px
                </button>
              </div>
            </section>
          </main>
          
          <footer class="panel-footer">
            <button class="reset-btn" @click="resetFontSize">
              重置为默认
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const settingsStore = useSettingsStore()

// 获取当前字体大小
const fontSize = computed(() => settingsStore.fontSize)

// 预设大小
const presetSizes = [12, 14, 16, 18, 20, 22]

// 方法
const increaseFontSize = () => settingsStore.increaseFontSize()
const decreaseFontSize = () => settingsStore.decreaseFontSize()
const setFontSize = (size: number) => settingsStore.setFontSize(size)
const resetFontSize = () => settingsStore.resetFontSize()

const close = () => emit('close')
const handleOverlayClick = () => close()
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.settings-panel {
  width: 100%;
  max-width: 500px;
  background: $bg-primary;
  border-radius: 16px 16px 0 0;
  padding: $spacing-lg;
  max-height: 70vh;
  overflow-y: auto;
  animation: slide-up 0.3s ease-out;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-lg;
  
  h3 {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }
}

.close-btn {
  width: 32px;
  height: 32px;
  @include flex-center;
  background: transparent;
  border: none;
  color: $text-secondary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:hover {
    background: rgba($text-secondary, 0.1);
    color: $text-primary;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.panel-content {
  margin-bottom: $spacing-lg;
}

.setting-section {
  margin-bottom: $spacing-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: $font-md;
  font-weight: 500;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.setting-item {
  margin-bottom: $spacing-md;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
}

.control-btn {
  width: 40px;
  height: 40px;
  @include flex-center;
  background: rgba($primary-color, 0.1);
  border: none;
  border-radius: 50%;
  color: $primary-color;
  transition: all $transition-fast $ease-default;
  
  &:hover {
    background: rgba($primary-color, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

.control-value {
  flex: 1;
  text-align: center;
}

.value-text {
  font-size: $font-lg;
  font-weight: 500;
  color: $text-primary;
  display: block;
}

.setting-desc {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.4;
}

.preset-buttons {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.preset-btn {
  padding: $spacing-sm $spacing-md;
  background: rgba($primary-color, 0.1);
  border: none;
  border-radius: 20px;
  color: $text-primary;
  font-size: $font-sm;
  transition: all $transition-fast $ease-default;
  
  &.active {
    background: $primary-color;
    color: white;
  }
  
  &:hover {
    background: rgba($primary-color, 0.2);
  }
}

.panel-footer {
  display: flex;
  justify-content: center;
}

.reset-btn {
  padding: $spacing-lg $spacing-sm;
  background: #666974;
  border-radius: .5rem;
  color: $text-secondary;
  font-size: $font-sm;
  transition: all $transition-fast $ease-default;
  width: 100%;
  display: block;
  
  &:hover {
    border-color: $primary-color;
    color: $primary-color;
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>