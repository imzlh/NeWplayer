import { ref } from 'vue'

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmTitle = ref('')
const confirmCallback = ref<((confirm: boolean) => void) | null>(null)

// 显示确认对话框
export const showConfirm = (message: string, callback: (confirm: boolean) => void, title?: string) => {
  confirmMessage.value = message
  confirmTitle.value = title || '提示'
  confirmCallback.value = callback
  showConfirmDialog.value = true
}

// 关闭确认对话框
export const hideConfirm = () => {
  showConfirmDialog.value = false
  confirmCallback.value = null
}

// 确认操作
export const confirmAction = () => {
  if (confirmCallback.value) {
    confirmCallback.value(true)
    hideConfirm()
  }
}

// 取消操作
export const cancelAction = () => {
  if (confirmCallback.value) {
    confirmCallback.value(false)
    hideConfirm()
  }
}

// factory
export const confirmStore = {
  showConfirmDialog,
  confirmMessage,
  confirmTitle
}