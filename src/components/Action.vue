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

          <!-- prevent: stop drag event to trigger click event -->
          <div class="action-sheet-options"
            @touchstart.stop @mousedown.stop @touchmove.stop @touchend.stop @mouseup.stop @mousemove.stop
          >
            <button v-for="(option, index) in options" :key="option.key ?? index" class="action-option"
              :class="getOptionClass(option)" @click="handleOptionClick(option)" :disabled="option.disabled">
              <span v-if="option.icon" class="option-icon" v-html="option.icon"></span>
              <span class="option-label">{{ option.label }}</span>
            </button>
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

  emit('select', option)

  if (option.callback) {
    option.callback(option.value)
  }

  if (props.closeOnClickOption) {
    handleClose()
  }
}

const getOptionClass = (option: ActionSheetOption) => ({
  destructive: option.destructive,
  disabled: option.disabled,
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
  user-select: none;
  z-index: 9999;
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

.action-sheet-options {
  background: $bg-card-inner;
  border-radius: $radius-md;
  overflow: hidden;
  margin-bottom: $spacing-sm;
  overflow-y: auto;
}

.action-option {
  width: 100%;
  padding: $spacing-md;
  font-size: $font-lg;
  color: white;
  background: $bg-card-inner;
  border: none;
  border-bottom: 0.125rem /* 1px */ solid $border-light;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  text-align: center;
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  padding-left: $spacing-xl;
  min-height: 3.5rem /* 56px */;

  &:last-child {
    border-bottom: none;
  }

  &:active:not(.disabled) {
    background: $bg-hover;
  }

  &.destructive {
    color: rgb(255, 208, 208);
  }

  &.disabled {
    color: $text-tertiary;
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.option-icon {
  font-size: 1.25rem /* 20px */;
  line-height: 1;

  svg {
    width: 1.25rem /* 20px */;
    height: 1.25rem /* 20px */;
    fill: currentColor;
  }
}

.option-label {
  line-height: 1.2;
}

.action-cancel {
  width: 100%;
  padding: $spacing-md;
  font-size: $font-lg;
  font-weight: 600;
  color: $primary-color;
  background: $bg-card-inner;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $transition-fast $ease-default;
  min-height: 3.5rem /* 56px */;

  &:active {
    background: $bg-hover;
  }
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