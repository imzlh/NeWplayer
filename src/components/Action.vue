<template>
  <Transition name="fade">
    <div v-if="modelValue" class="action-sheet-overlay" @click="handleOverlayClick" @mousedown="handleMouseDown">
      <Transition name="slide">
        <div v-if="modelValue" ref="sheetRef" class="action-sheet" :class="{ dragging: isDragging }" @click.stop
          @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @mousedown.stop="onMouseDown"
          @mousemove="onMouseMove" @mouseup="onMouseUp" :style="sheetStyle">
          <div class="drag-indicator" v-if="showDragIndicator"></div>

          <div v-if="title" class="action-sheet-title">{{ title }}</div>
          <div v-if="description" class="action-sheet-description">{{ description }}</div>

          <!-- 表格式选项 -->
          <div class="action-sheet-table">
            <table>
              <tbody>
                <tr v-for="(option, index) in options" :key="option.key ?? index" class="action-row"
                  :class="getRowClass(option)" @click="handleOptionClick(option)">
                  <td class="action-icon-cell">
                    <div v-if="option.icon" class="option-icon-container">
                      <div v-if="option.icon.startsWith('<')" class="option-icon-html" v-html="option.icon"></div>
                      <div v-else class="option-icon-text">{{ option.icon }}</div>
                    </div>
                  </td>
                  <td class="action-label-cell">
                    <span class="option-label">{{ option.label }}</span>
                    <div v-if="option.description" class="option-description">{{ option.description }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

export interface ActionSheetOption {
  label: string
  value?: any
  key?: string | number
  icon?: string
  destructive?: boolean
  disabled?: boolean
  callback?: (value?: any) => void
  description?: string
}

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  options: ActionSheetOption[]
  closeOnClickOption?: boolean
  closeOnClickOverlay?: boolean
  showDragIndicator?: boolean
  dragThreshold?: number
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  description: '',
  options: () => [],
  closeOnClickOption: true,
  closeOnClickOverlay: true,
  showDragIndicator: true,
  dragThreshold: 100,
  zIndex: 9999
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'select', option: ActionSheetOption): void
}

const emit = defineEmits<Emits>()

// Refs
const dragY = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const isMouseDragging = ref(false)

// Computed
const sheetStyle = computed(() => ({
  transform: `translateY(${dragY.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s ease-out',
  zIndex: props.zIndex
}))

// Touch handlers
const onTouchStart = (e: TouchEvent) => {
  startDrag(e.touches[0].clientY)
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  moveDrag(e.touches[0].clientY)
}

const onTouchEnd = () => {
  endDrag()
}

// Mouse handlers
const onMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  isMouseDragging.value = true
  startDrag(e.clientY)
}

const onMouseMove = (e: MouseEvent) => {
  if (!isMouseDragging.value || !isDragging.value) return
  e.preventDefault()
  moveDrag(e.clientY)
}

const onMouseUp = () => {
  if (!isMouseDragging.value) return
  isMouseDragging.value = false
  endDrag()
}

// Global mouse handlers
const handleGlobalMouseMove = (e: MouseEvent) => {
  if (isMouseDragging.value) {
    onMouseMove(e)
  }
}

const handleGlobalMouseUp = () => {
  if (isMouseDragging.value) {
    onMouseUp()
  }
}

// Drag logic
const startDrag = (clientY: number) => {
  startY.value = clientY
  isDragging.value = true
}

const moveDrag = (clientY: number) => {
  const diff = clientY - startY.value
  // Only allow downward drag
  dragY.value = Math.max(0, diff)
}

const endDrag = () => {
  if (!isDragging.value) return

  isDragging.value = false

  // Close if drag threshold exceeded
  if (dragY.value > props.dragThreshold) {
    handleClose()
  }

  // Reset drag position
  dragY.value = 0
}

// Event handlers
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}

const handleMouseDown = (e: MouseEvent) => {
  // Prevent text selection during drag
  if (isDragging.value) {
    e.preventDefault()
  }
}

const handleOptionClick = (option: ActionSheetOption) => {
  if (option.disabled) return

  if (option.callback) {
    option.callback(option.value)
  }

  emit('select', option)

  if (props.closeOnClickOption) {
    handleClose()
  }
}

const getRowClass = (option: ActionSheetOption) => ({
  'destructive': option.destructive,
  'disabled': option.disabled,
  'has-icon': !!option.icon
})

// Watch for show changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    dragY.value = 0
    isDragging.value = false
    isMouseDragging.value = false

    nextTick(() => {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    })
  } else {
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
  }
})

// Cleanup
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$bg-card-inner: #575d6c;

.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  user-select: none;
  z-index: $z-fixed + 1;
}

.action-sheet {
  width: 100%;
  max-width: $screen-width;
  background: $bg-card;
  border-radius: $radius-lg $radius-lg 0 0;
  padding: 0.5rem /* 8px */ 0.5rem /* 8px */ calc(env(safe-area-inset-bottom) + 0.5rem /* 8px */);
  max-height: 80vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &.dragging {
    transition: none !important;
  }
}

.drag-indicator {
  width: 2.25rem /* 36px */;
  height: 0.25rem /* 5px */;
  background: rgb(198, 198, 198);
  border-radius: $radius-sm;
  margin: 0.5rem /* 8px */ auto 0.75rem /* 12px */;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

.action-sheet-title {
  font-size: $font-sm;
  color: $text-primary;
  text-align: center;
  padding: $spacing-xs $spacing-md $spacing-xs;
  font-weight: 600;
}

.action-sheet-description {
  font-size: $font-sm;
  color: $text-secondary;
  text-align: center;
  padding: $spacing-xs $spacing-md $spacing-sm;
  line-height: 1.4;
}

.action-sheet-table {
  background: $bg-card-inner;
  border-radius: $radius-md;
  overflow: hidden;
  margin-bottom: $spacing-sm;
  width: 100%;
  
  table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
  }
}

.action-row {
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  
  &:active:not(.disabled) {
    background: $bg-hover;
  }
  
  &.destructive {
    .option-label {
      color: rgb(255, 208, 208);
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    .option-label {
      color: $text-tertiary;
    }
  }
}

.action-icon-cell {
  width: 3.5rem; /* 56px */
  padding: $spacing-md;
  vertical-align: middle;
  text-align: center;
}

.action-label-cell {
  padding: $spacing-md $spacing-md $spacing-md $spacing-sm;
  vertical-align: middle;
}

.option-icon-container {
  width: 2rem; /* 32px */
  height: 2rem; /* 32px */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.option-icon-html {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  :deep(svg), :deep(img) {
    width: 1.5rem; /* 24px */
    height: 1.5rem; /* 24px */
  }
}

.option-icon-text {
  font-size: 1.25rem; /* 20px */
  color: $text-primary;
}

.option-label {
  font-size: $font-lg;
  color: $text-primary;
  line-height: 1.2;
}

.option-description {
  font-size: $font-xs;
  color: $text-tertiary;
  margin-top: 2px;
  line-height: 1.2;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-normal $ease-default;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform $transition-normal cubic-bezier(0.36, 0.66, 0.04, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}

/* Scrollbar styling */
.action-sheet::-webkit-scrollbar {
  width: 0;
  background: transparent;
}
</style>