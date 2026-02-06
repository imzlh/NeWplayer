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
                        <div class="content-wrapper" :style="contentStyle" @click="handleContentClick">
                            <p v-if="!isEditing" class="content-text">{{ text }}</p>
                            <textarea v-else v-model="editText" class="content-edit" ref="editTextarea" 
                                @blur="finishEdit" @keydown.enter="finishEdit" @keydown.esc="cancelEdit"
                                :placeholder="editPlaceholder" rows="4"></textarea>
                        </div>
                    </div>

                    <div class="text-display-actions">
                        <button v-if="isEditing" class="action-cancel" @click="cancelEdit">
                            取消
                        </button>
                        <button v-if="isEditing" class="action-confirm" @click="finishEdit">
                            保存
                        </button>
                        <button v-else class="action-confirm" @click="handleConfirm">
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
    editable?: boolean
    editPlaceholder?: string
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
    maxHeight: '60vh',
    editable: false,
    editPlaceholder: '请输入内容'
})

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
    (e: 'confirm'): void
    (e: 'update:text', value: string): void
}

const emit = defineEmits<Emits>()

// Refs
const dragY = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const isMouseDragging = ref(false)
const isEditing = ref(false)
const editText = ref('')
const editTextarea = ref<HTMLTextAreaElement>()

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

// Edit handlers
const handleContentClick = () => {
    if (props.editable && !isEditing.value) {
        startEdit()
    }
}

const startEdit = () => {
    isEditing.value = true
    editText.value = props.text
    nextTick(() => {
        if (editTextarea.value) {
            editTextarea.value.focus()
            // 设置光标到文本末尾
            editTextarea.value.setSelectionRange(editText.value.length, editText.value.length)
        }
    })
}

const finishEdit = () => {
    if (editText.value.trim() !== props.text) {
        emit('update:text', editText.value.trim())
    }
    isEditing.value = false
}

const cancelEdit = () => {
    editText.value = props.text
    isEditing.value = false
}

// Watch for show changes
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        dragY.value = 0
        isDragging.value = false
        isMouseDragging.value = false
        isEditing.value = false
        editText.value = props.text

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
    padding-top: 0.5rem /* 8px */ 1rem /* 16px */ 0.75rem /* 12px */;
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
    color: #f1f1f1;
    font-size: 0.875rem /* 14px */;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.content-edit {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #f1f1f1;
    font-size: 0.875rem /* 14px */;
    line-height: 1.5;
    resize: none;
    font-family: inherit;
    padding: 0;
    margin: 0;
}

.text-display-actions {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem /* 8px */ 0;
    gap: 0.5rem /* 8px */;
}

.action-confirm,
.action-cancel {
    flex: 1;
    padding: 0.75rem /* 12px */;
    border-radius: 0.5rem /* 8px */;
    font-size: 0.875rem /* 14px */;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-confirm {
    background: #007aff;
    color: white;
    border: none;
}

.action-cancel {
    background: #3a3a3c;
    color: white;
    border: none;
}

.action-confirm:hover {
    background: #0051dd;
}

.action-cancel:hover {
    background: #2a2a2c;
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
</style>