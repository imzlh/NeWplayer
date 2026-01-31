<template>
    <Transition name="fade">
        <div v-if="modelValue" class="text-display-overlay" @click="handleOverlayClick" @mousedown="handleMouseDown">
            <Transition name="slide">
                <div v-if="modelValue" class="text-display-sheet" :class="{ dragging: isDragging }"
                    @click.stop @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
                    @mousedown.stop="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" :style="sheetStyle">
                    <div class="drag-indicator" v-if="showDragIndicator"></div>

                    <div v-if="title" class="text-display-title">{{ title }}</div>

                    <div class="text-display-content">
                        <div class="content-wrapper" :style="contentStyle">
                            <p class="content-text">{{ text }}</p>
                        </div>
                    </div>

                    <div class="text-display-actions">
                        <button class="action-confirm" @click="handleConfirm">
                            {{ confirmText }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

interface Props {
    modelValue: boolean
    title?: string
    text: string
    confirmText?: string
    closeOnClickOverlay?: boolean
    closeOnConfirm?: boolean
    showDragIndicator?: boolean
    dragThreshold?: number
    zIndex?: number
    maxHeight?: string
}

const props = withDefaults(defineProps<Partial<Props>>(), {
    modelValue: false,
    title: '',
    text: '',
    confirmText: '确定',
    closeOnClickOverlay: true,
    closeOnConfirm: true,
    showDragIndicator: true,
    dragThreshold: 100,
    zIndex: 9999,
    maxHeight: '60vh'
})

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
    (e: 'confirm'): void
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

const contentStyle = computed(() => ({
    maxHeight: props.maxHeight
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
    if (isMouseDragging.value) onMouseMove(e)
}

const handleGlobalMouseUp = () => {
    if (isMouseDragging.value) onMouseUp()
}

// Drag logic
const startDrag = (clientY: number) => {
    startY.value = clientY
    isDragging.value = true
}

const moveDrag = (clientY: number) => {
    const diff = clientY - startY.value
    dragY.value = Math.max(0, diff)
}

const endDrag = () => {
    if (!isDragging.value) return
    isDragging.value = false

    if (dragY.value > props.dragThreshold) {
        handleClose()
    }

    dragY.value = 0
}

// Event handlers
const handleClose = () => {
    emit('update:modelValue', false)
    emit('close')
}

const handleOverlayClick = () => {
    if (props.closeOnClickOverlay) handleClose()
}

const handleMouseDown = (e: MouseEvent) => {
    if (isDragging.value) e.preventDefault()
}

const handleConfirm = () => {
    emit('confirm')
    if (props.closeOnConfirm) handleClose()
}

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

<style scoped>
.text-display-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-end;
    user-select: none;
    z-index: 9999;
}

.text-display-sheet {
    width: 100%;
    background: #53535a;
    border-radius: 0.875rem /* 14px */ 0.875rem /* 14px */ 0 0;
    padding: 0.5rem /* 8px */ 0.5rem /* 8px */ calc(env(safe-area-inset-bottom) + 0.5rem /* 8px */);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
}

.text-display-sheet.dragging {
    transition: none !important;
}

.drag-indicator {
    width: 2.25rem /* 36px */;
    height: 0.25rem /* 5px */;
    background: #c7c7cc;
    border-radius: 0.25rem /* 3px */;
    margin: 0.5rem /* 8px */ auto 0.75rem /* 12px */;
    flex-shrink: 0;
}

.text-display-title {
    font-size: 0.75rem /* 13px */;
    color: #f1f1f1;
    text-align: center;
    padding: 0.5rem /* 8px */ 1rem /* 16px */ 0.75rem /* 12px */;
    font-weight: 600;
    flex-shrink: 0;
}

.text-display-content {
    flex: 1;
    min-height: 0;
    margin-bottom: 0.5rem /* 8px */;
}

.content-wrapper {
    border-radius: 0.875rem /* 14px */;
    padding: 1rem /* 16px */;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: 100%;
    min-height: 40vh;
}

.content-text {
    font-size: 1rem /* 15px */;
    color: #f1f1f1;
    line-height: 1.6;
    word-wrap: break-word;
    word-break: break-word;
    white-space: pre-wrap;
    margin: 0;
    user-select: text;
    -webkit-user-select: text;
}

.text-display-actions {
    flex-shrink: 0;
}

.action-confirm {
    width: 100%;
    padding: 1rem /* 16px */;
    font-size: 1rem /* 17px */;
    font-weight: 600;
    color: #9acbff;
    background: rgb(65, 65, 65);
    border: none;
    border-radius: 0.875rem /* 14px */;
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
    min-height: 3.5rem /* 56px */;
}

.action-confirm:active {
    background: #353535;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateY(100%);
}

/* Scrollbar styling */
.content-wrapper::-webkit-scrollbar {
    width: 0.25rem /* 4px */;
}

.content-wrapper::-webkit-scrollbar-track {
    background: transparent;
}

.content-wrapper::-webkit-scrollbar-thumb {
    background: #8e8e93;
    border-radius: 0.125rem /* 2px */;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a0a0a5;
}
</style>