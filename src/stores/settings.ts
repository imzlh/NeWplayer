import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 缩放比例，默认为16px (1rem = 16px)
  const fontSize = ref(parseInt(localStorage.getItem('fontSize') || '16'))
  
  // 设置字体大小
  const setFontSize = (size: number) => {
    // 限制范围：10px - 24px
    if (size < 10) size = 10
    if (size > 24) size = 24
    
    fontSize.value = size
    localStorage.setItem('fontSize', size.toString())
    
    // 更新根元素的字体大小
    document.documentElement.style.fontSize = `${size}px`
  }
  
  // 增加字体大小
  const increaseFontSize = () => {
    setFontSize(fontSize.value + 1)
  }
  
  // 减少字体大小
  const decreaseFontSize = () => {
    setFontSize(fontSize.value - 1)
  }
  
  // 重置字体大小
  const resetFontSize = () => {
    setFontSize(16)
  }
  
  // 初始化时设置字体大小
  const initFontSize = () => {
    document.documentElement.style.fontSize = `${fontSize.value}px`
  }
  
  return {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    initFontSize
  }
})