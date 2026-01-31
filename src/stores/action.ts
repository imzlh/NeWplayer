import { ref } from 'vue'
import type { ActionSheetOption } from '@/components/Action.vue'

// 全局Action状态
const showActionSheet = ref(false)
const actionSheetOptions = ref<ActionSheetOption[]>([])
let actionCallback: ((option?: any) => void) | null = null

// 显示ActionSheet
export const showAction = (options: ActionSheetOption[], callback?: (option?: any) => void) => {
  actionSheetOptions.value = options
  showActionSheet.value = true
  actionCallback = callback || null
}

// 关闭ActionSheet
export const closeAction = () => {
  showActionSheet.value = false
  actionSheetOptions.value = []
  actionCallback = null
}

// 处理Action选择
export const handleActionSelect = (option: any) => {
  if (actionCallback) {
    actionCallback(option)
  }
  closeAction()
}

// 导出状态供组件使用
export { showActionSheet, actionSheetOptions }