import { ref } from 'vue'

// 文本显示状态
const showTextDisplay = ref(false)
const displayText = ref('')
const displayTitle = ref('')

// 编辑相关状态
const isEditable = ref(false)
const editPlaceholder = ref('请输入内容')
const onTextUpdate = ref<(text: string) => void>()

// 显示文本内容
export const showText = (text: string, title?: string) => {
  displayText.value = text
  displayTitle.value = title || ''
  isEditable.value = false
  showTextDisplay.value = true
}

// 显示可编辑文本内容
export const showEditableText = (
  text: string, 
  title?: string, 
  placeholder?: string,
  onUpdate?: (text: string) => void
) => {
  displayText.value = text
  displayTitle.value = title || ''
  isEditable.value = true
  editPlaceholder.value = placeholder || '请输入内容'
  onTextUpdate.value = onUpdate
  showTextDisplay.value = true
}

// 关闭文本显示
export const hideText = () => {
  showTextDisplay.value = false
}

// 更新文本内容
export const updateText = (text: string) => {
  displayText.value = text
  if (onTextUpdate.value) {
    onTextUpdate.value(text)
  }
}

// factory
export const textStore = {
  showTextDisplay,
  displayText,
  displayTitle,
  isEditable,
  editPlaceholder,
  updateText
}