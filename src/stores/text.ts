import { ref } from 'vue'

// 文本显示状态
const showTextDisplay = ref(false)
const displayText = ref('')
const displayTitle = ref('')

// 显示文本内容
export const showText = (text: string, title?: string) => {
  displayText.value = text
  displayTitle.value = title || ''
  showTextDisplay.value = true
}

// 关闭文本显示
export const hideText = () => {
  showTextDisplay.value = false
}

// factory
export const textStore = {
  showTextDisplay,
  displayText,
  displayTitle
}