import type { ILyric } from '@/api/types'
// import I_DEFAULT from 'public/'

// 解析歌词
export const parseLyric = (lrc: string, tlyric?: string, rlyric?: string): ILyric[] => {
  const lyrics: ILyric[] = []
  const maps = {
    text: new Map<number, string>(),
    transText: new Map<number, string>(),
    romaji: new Map<number, string>(),
  }

  function parse(lrc: string, to: keyof typeof maps) {
    const lines = lrc.split('\n')
    lines.forEach((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
      if (match) {
        const min = parseInt(match[1])
        const sec = parseInt(match[2])
        const ms = parseInt(match[3].padEnd(3, '0'))
        const time = min * 60 + sec + ms / 1000
        const text = match[4].trim()
        if (text) {
          maps[to].set(time, text)
        }
      }
    })
  }

  // 解析原歌词
  if (lrc) parse(lrc, 'text')

  // 解析翻译歌词
  if (tlyric) parse(tlyric, 'transText')

  // 解析罗马字歌词
  if (rlyric) parse(rlyric, 'romaji')

  // 合并歌词
  maps.text.forEach((text, time) => {
    lyrics.push({
      time,
      text,
      transText: maps.transText.get(time),
      romaji: maps.romaji.get(time)
    })
  })

  // 按时间排序
  lyrics.sort((a, b) => a.time - b.time)

  return lyrics
}

// 格式化时间
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化数字
export const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return String(num)
}

// 格式化日期
export const formatDate = (timestamp: number, format = 'YYYY-MM-DD'): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }
}

// 随机数组
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// 获取图片URL（带尺寸参数）
export const getImageUrl = (url: string | undefined, width = 200, height = 200): string => {
  if (!url) return '' // fixme
  // 处理网易云图片URL
  if (url.includes('music.126.net')) {
    return url.replace(/\?param=.*/, '') + `?param=${width}y${height}`
  }
  return url
}

// 获取高分辨率图片URL
export const getHighResImageUrl = (url: string | undefined): string => {
  return getImageUrl(url, 800, 800)
}

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 生成随机颜色
export const getRandomColor = (): string => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 获取主色调（从图片URL）
export const getDominantColor = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('#1a1a2e')
        return
      }
      canvas.width = 1
      canvas.height = 1
      ctx.drawImage(img, 0, 0, 1, 1)
      const pixel = ctx.getImageData(0, 0, 1, 1).data
      const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
      resolve(color)
    }
    img.onerror = () => {
      resolve('#1a1a2e')
    }
    img.src = imageUrl
  })
}

// 平滑滚动到元素
export const scrollToElement = (element: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
  element.scrollIntoView({ behavior, block: 'center' })
}

// 检测触摸设备
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 获取滑动方向
export const getSwipeDirection = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): 'left' | 'right' | 'up' | 'down' | null => {
  const diffX = endX - startX
  const diffY = endY - startY
  const absX = Math.abs(diffX)
  const absY = Math.abs(diffY)

  if (Math.max(absX, absY) < 30) return null

  if (absX > absY) {
    return diffX > 0 ? 'right' : 'left'
  } else {
    return diffY > 0 ? 'down' : 'up'
  }
}
