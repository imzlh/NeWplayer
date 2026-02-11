import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { ILyric, ISong, PlayMode } from '@/api/types'
import { PlayMode as PlayModeEnum } from '@/api/types'
import * as api from '@/api'
import { parseLyric } from '@/utils/lyric'

// ============ 类型定义 ============
export interface QualityOption {
  label: string
  value: number
  description?: string
}

interface PlayerState {
  playlist: ISong[]
  currentIndex: number
  progress: number
  duration: number
  isPlaying: boolean
  lyrics: ILyric[]
  currentLyricIndex: number
}

// ============ 常量定义 ============
const DEFAULT_VOLUME = 0.8
const DEFAULT_PLAY_MODE = PlayModeEnum.Sequence
const DEFAULT_QUALITY = 320000
const QUALITY_OPTIONS: QualityOption[] = [
  { label: '标准', value: 128000, description: '128kbps' },
  { label: '较高', value: 192000, description: '192kbps' },
  { label: '极高', value: 320000, description: '320kbps' },
  { label: '无损', value: 999000, description: 'FLAC' }
]

export const usePlayerStore = defineStore('player', () => {
  // ============ State ============
  const audio = shallowRef<HTMLAudioElement | null>(null)
  const playlist = shallowRef<ISong[]>([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const progress = ref(0)
  const duration = ref(0)
  const volume = ref(parseFloat(localStorage.getItem('volume') || String(DEFAULT_VOLUME)))
  const playMode = ref<PlayMode>(getValidPlayMode())
  const isMuted = ref(false)
  const lyrics = shallowRef<ILyric[]>([])
  const currentLyricIndex = ref(-1)
  const isLoading = ref(false)
  const failedSongs = ref<Set<number>>(new Set())
  const currentQuality = ref(getValidQuality())
  const currentLyric = ref<ILyric | null>(null) // 改用 ref,手动更新

  // 私人FM相关状态（仅保留必要的）
  const fmHistory = shallowRef<ISong[]>([])
  const fmNextBatch = shallowRef<ISong[]>([]) // 预加载下一批FM歌曲

  // ============ Getters ============
  const currentSong = computed(() => playlist.value[currentIndex.value])
  const isPersonalFM = computed(() => playMode.value === PlayModeEnum.PersonalFM)
  const hasCurrentSong = computed(() => currentIndex.value >= 0 && currentSong.value !== undefined)
  const playlistCount = computed(() => playlist.value.length)
  const isEmptyPlaylist = computed(() => playlistCount.value === 0)
  const currentProgressPercent = computed(() => duration.value > 0 ? (progress.value / duration.value) * 100 : 0)
  const canPlay = computed(() => hasCurrentSong.value && !failedSongs.value.has(currentSong.value!.id))
  const qualityOptions = computed(() => QUALITY_OPTIONS)
  const currentQualityOption = computed(() =>
    QUALITY_OPTIONS.find(opt => opt.value === currentQuality.value) || QUALITY_OPTIONS[0]
  )

  // ============ 工具函数 ============
  function getValidPlayMode(): PlayMode {
    const saved = parseInt(localStorage.getItem('playMode') || String(DEFAULT_PLAY_MODE))
    return (saved >= 0 && saved <= 3) ? saved as PlayMode : DEFAULT_PLAY_MODE
  }

  function getValidQuality(): number {
    const saved = parseInt(localStorage.getItem('audioQuality') || String(DEFAULT_QUALITY))
    return QUALITY_OPTIONS.some(opt => opt.value === saved) ? saved : DEFAULT_QUALITY
  }

  function savePlayerState() {
    try {
      const state: PlayerState = {
        playlist: playlist.value,
        currentIndex: currentIndex.value,
        progress: progress.value,
        duration: duration.value,
        isPlaying: isPlaying.value,
        lyrics: lyrics.value,
        currentLyricIndex: currentLyricIndex.value
      }
      localStorage.setItem('playerState', JSON.stringify(state))
    } catch (error) {
      console.error('保存播放状态失败:', error)
    }
  }

  async function restorePlayerState() {
    try {
      const saved = localStorage.getItem('playerState')
      if (!saved) return

      const state: PlayerState = JSON.parse(saved)
      playlist.value = state.playlist || []
      currentIndex.value = state.currentIndex || -1
      progress.value = state.progress || 0
      duration.value = state.duration || 0
      isPlaying.value = false // 恢复时不自动播放
      lyrics.value = state.lyrics || []
      currentLyricIndex.value = state.currentLyricIndex || -1
      // 恢复时更新当前歌词
      if (lyrics.value.length > 0 && currentLyricIndex.value >= 0) {
        currentLyric.value = lyrics.value[currentLyricIndex.value]
      } else {
        currentLyric.value = null
      }

      if (hasCurrentSong.value) {
        await loadSong(currentSong.value!)
      }
    } catch (error) {
      console.error('恢复播放状态失败:', error)
    }
  }

  // ============ 音频核心函数 ============
  function initAudio() {
    if (audio.value) return

    audio.value = new Audio()
    audio.value.volume = volume.value
    audio.value.muted = isMuted.value

    // 事件监听
    audio.value.addEventListener('timeupdate', handleTimeUpdate)
    audio.value.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.value.addEventListener('ended', handleSongEnded)
    audio.value.addEventListener('error', handlePlayError)
    audio.value.addEventListener('waiting', () => isLoading.value = true)
    audio.value.addEventListener('canplay', () => isLoading.value = false)

    initMediaSession()
    restorePlayerState()
  }

  function handleTimeUpdate() {
    if (!audio.value) return
    progress.value = audio.value.currentTime
    updateCurrentLyric()
    savePlayerState()
    updateMediaSessionPosition()
  }

  function handleLoadedMetadata() {
    if (!audio.value) return
    duration.value = audio.value.duration

    // 恢复播放进度
    if (progress.value > 0 && progress.value < duration.value) {
      audio.value.currentTime = progress.value
    }
  }

  async function loadSong(song: ISong) {
    if (!audio.value) return

    try {
      isLoading.value = true
      const url = await getAudioUrl(song.id)

      if (!url) {
        throw new Error('无法获取播放地址')
      }

      audio.value.src = url
      await fetchLyric(song.id)
      updateMediaSessionMetadata(song)
      failedSongs.value.delete(song.id)
    } catch (error) {
      console.error('加载歌曲失败:', error)
      failedSongs.value.add(song.id)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ============ 播放控制 ============
  async function play(song: ISong, immediate = true) {
    initAudio()
    if (!audio.value) return

    try {
      // 添加到播放列表
      const index = playlist.value.findIndex(s => s.id === song.id)
      if (index === -1) {
        playlist.value.splice(currentIndex.value + 1, 0, song)
        currentIndex.value = currentIndex.value + 1
      } else {
        currentIndex.value = index
      }

      await loadSong(song)

      if (immediate) {
        await audio.value.play()
        isPlaying.value = true
        updateMediaSessionPlaybackState()
      }

      savePlayerState()
    } catch (error) {
      console.error('播放失败:', error)
      await next()
    }
  }

  async function playAtIndex(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    await play(playlist.value[index])
  }

  async function togglePlay() {
    if (!audio.value || !hasCurrentSong.value) return

    if (isPlaying.value) {
      pause()
    } else {
      try {
        await audio.value.play()
        isPlaying.value = true
        updateMediaSessionPlaybackState()
        savePlayerState()
      } catch (error) {
        console.error('播放失败:', error)
        await next()
      }
    }
  }

  function pause() {
    if (audio.value && isPlaying.value) {
      audio.value.pause()
      isPlaying.value = false
      updateMediaSessionPlaybackState()
      savePlayerState()
    }
  }

  async function handleFMNext() {
    // 检查是否还有下一首
    if (currentIndex.value < playlist.value.length - 1) {
      // 直接播放下一首
      await playAtIndex(currentIndex.value + 1)
    } else {
      // 需要获取新的FM歌曲
      await fetchFMSongs()

      // 获取成功后播放新的一首
      if (playlist.value.length > currentIndex.value + 1) {
        await playAtIndex(currentIndex.value + 1)
      } else {
        // 如果获取失败，停止FM
        console.warn('无法获取更多FM歌曲')
        stopPersonalFM()
      }
    }
  }

  async function next() {
    if (isEmptyPlaylist.value) return

    // 私人FM特殊处理
    if (isPersonalFM.value) {
      await handleFMNext()
      return
    }

    let nextIndex = getNextIndex()
    await playAtIndex(nextIndex)
  }

  async function prev() {
    if (isEmptyPlaylist.value || isPersonalFM.value) return

    let prevIndex = getPrevIndex()
    await playAtIndex(prevIndex)
  }

  function getNextIndex(): number {
    if (isEmptyPlaylist.value) return -1

    switch (playMode.value) {
      case PlayModeEnum.Random:
        return Math.floor(Math.random() * playlist.value.length)
      case PlayModeEnum.Loop:
        return currentIndex.value
      case PlayModeEnum.Sequence:
      default:
        const next = currentIndex.value + 1
        return next >= playlist.value.length ? 0 : next
    }
  }

  function getPrevIndex(): number {
    if (isEmptyPlaylist.value) return -1

    switch (playMode.value) {
      case PlayModeEnum.Random:
        return Math.floor(Math.random() * playlist.value.length)
      case PlayModeEnum.Loop:
        return currentIndex.value
      case PlayModeEnum.Sequence:
      default:
        const prev = currentIndex.value - 1
        return prev < 0 ? playlist.value.length - 1 : prev
    }
  }

  function seek(time: number) {
    if (audio.value && duration.value > 0) {
      const validTime = Math.max(0, Math.min(time, duration.value))
      audio.value.currentTime = validTime
      progress.value = validTime
      updateMediaSessionPosition()
    }
  }

  function setVolume(val: number) {
    const newVolume = Math.max(0, Math.min(1, val))
    volume.value = newVolume

    if (audio.value) {
      audio.value.volume = newVolume
    }

    localStorage.setItem('volume', String(newVolume))
  }

  function toggleMute() {
    if (!audio.value) return
    isMuted.value = !isMuted.value
    audio.value.muted = isMuted.value
  }

  function togglePlayMode() {
    // 循环切换：Sequence -> Random -> Loop -> Sequence
    // PersonalFM需要特殊处理
    if (playMode.value === PlayModeEnum.PersonalFM) {
      stopPersonalFM()
    }

    let nextMode: PlayMode
    switch (playMode.value) {
      case PlayModeEnum.Sequence:
        nextMode = PlayModeEnum.Random
        break
      case PlayModeEnum.Random:
        nextMode = PlayModeEnum.Loop
        break
      case PlayModeEnum.Loop:
      default:
        nextMode = PlayModeEnum.Sequence
    }

    playMode.value = nextMode
    localStorage.setItem('playMode', String(nextMode))
  }

  // ============ 播放列表管理 ============
  function setPlaylist(songs: ISong[], startIndex = 0) {
    if (isPersonalFM.value) {
      stopPersonalFM()
    }

    playlist.value = [...songs]
    failedSongs.value.clear()

    if (songs.length > 0 && startIndex >= 0 && startIndex < songs.length) {
      playAtIndex(startIndex)
    }

    savePlayerState()
  }

  function addToPlaylist(song: ISong) {
    if (!playlist.value.find(s => s.id === song.id)) {
      playlist.value.push(song)
      savePlayerState()
    }
  }

  function removeFromPlaylist(index: number) {
    if (index < 0 || index >= playlist.value.length) return

    const [removed] = playlist.value.splice(index, 1)
    failedSongs.value.delete(removed.id)

    if (currentIndex.value === index) {
      if (playlist.value.length > 0) {
        next()
      } else {
        clearPlayer()
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }

    savePlayerState()
  }

  function clearPlaylist() {
    if (isPersonalFM.value) {
      stopPersonalFM()
    }

    clearPlayer()
    savePlayerState()
  }

  function clearPlayer() {
    playlist.value = []
    currentIndex.value = -1
    progress.value = 0
    duration.value = 0
    isPlaying.value = false
    lyrics.value = []
    currentLyricIndex.value = -1
    currentLyric.value = null
    failedSongs.value.clear()

    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
    }
  }

  // ============ 歌词处理 ============
  async function fetchLyric(songId: number) {
    try {
      const res = await api.getLyric(songId)
      if (res.lrc?.lyric) {
        lyrics.value = parseLyric(res.lrc.lyric, res.tlyric?.lyric)
        // 加载歌词后立即更新当前歌词
        updateCurrentLyric()
      } else {
        lyrics.value = []
        currentLyricIndex.value = -1
        currentLyric.value = null
      }
    } catch (error) {
      console.error('获取歌词失败:', error)
      lyrics.value = []
      currentLyricIndex.value = -1
      currentLyric.value = null
    }
  }

  function updateCurrentLyric() {
    const lyricList = lyrics.value
    const count = lyricList.length

    // 空歌词处理
    if (count === 0) {
      currentLyricIndex.value = -1
      currentLyric.value = null
      return
    }

    const currentTime = progress.value

    // 优化: 如果时间在当前歌词范围内,直接返回
    const currentIndex = currentLyricIndex.value
    let left = 0
    let right = count - 1
    if (currentIndex >= 0 && currentIndex < count) {
      const current = lyricList[currentIndex]
      const next = lyricList[currentIndex + 1]
      if (currentTime < current.time)
        right = currentIndex;
      else if (next && currentTime > next.time)
        left = currentIndex +1;
      else
        return; // 时间范围没变,无需更新
    }

    // 使用二分查找
    let resultIndex = 0
    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (lyricList[mid].time <= currentTime) {
        resultIndex = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // 只在索引变化时更新
    if (resultIndex !== currentIndex) {
      currentLyricIndex.value = resultIndex
      currentLyric.value = lyricList[resultIndex]
    }
  }

  // ============ 歌曲播放事件处理 ============
  function handleSongEnded() {
    if (playMode.value === PlayModeEnum.Loop && audio.value) {
      audio.value.currentTime = 0
      audio.value.play()
    } else {
      next()
    }
  }

  function handlePlayError() {
    console.error('音频播放错误')
    isLoading.value = false

    if (currentSong.value) {
      failedSongs.value.add(currentSong.value.id)
    }

    setTimeout(() => next(), 1000)
  }

  // ============ 私人FM处理 ============
  async function startPersonalFM() {
    playMode.value = PlayModeEnum.PersonalFM
    fmHistory.value = []
    fmNextBatch.value = []

    // 清空当前播放列表，为FM做准备
    clearPlayer()

    // 获取第一批FM歌曲
    await fetchFMSongs()

    if (playlist.value.length > 0) {
      await playAtIndex(0)
    }
  }

  function stopPersonalFM() {
    // 切换到普通模式
    playMode.value = DEFAULT_PLAY_MODE

    // 保留FM历史记录，但清空预加载
    fmNextBatch.value = []
  }

  async function fetchFMSongs() {
    try {
      const response = await api.getPersonalFM()
      if (response.code === 200 && response.data) {
        // 添加到播放列表
        playlist.value.push(...response.data)
        // 保存到下一批预加载
        fmNextBatch.value = [...response.data]
      }
    } catch (error) {
      console.error('获取私人FM失败:', error)
    }
  }

  async function playNextFM() {
    // 如果已经到了当前批次的末尾
    if (currentIndex.value >= playlist.value.length - 1) {
      // 使用预加载的下一批
      if (fmNextBatch.value.length > 0) {
        playlist.value.push(...fmNextBatch.value)
        fmNextBatch.value = []

        // 预加载下一批
        fetchFMSongs().catch(console.error)
      } else {
        // 没有预加载，立即获取
        await fetchFMSongs()
      }
    }

    await handleFMNext()
  }

  async function skipFMSong() {
    if (!isPersonalFM.value) return
    await playNextFM()
  }

  async function trashFMSong() {
    if (!isPersonalFM.value || !currentSong.value) return

    try {
      // 通知服务器不喜欢这首歌
      await api.fmTrash(currentSong.value.id)
    } catch (error) {
      console.error('标记不喜欢失败:', error)
    }

    // 记录到历史
    fmHistory.value.push(currentSong.value)

    // 从播放列表中移除当前歌曲
    const index = playlist.value.findIndex(s => s.id === currentSong.value!.id)
    if (index !== -1) {
      removeFromPlaylist(index)
    }

    // 播放下一首
    await playNextFM()
  }

  // ============ Media Session API ============
  function initMediaSession() {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: '音乐播放器',
      artist: '正在等待播放...',
      album: '',
      artwork: [
        { src: '/favicon.ico', sizes: '96x96', type: 'image/x-icon' }
      ]
    })

    navigator.mediaSession.setActionHandler('play', () => audio.value?.play())
    navigator.mediaSession.setActionHandler('pause', () => audio.value?.pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => !isPersonalFM.value && prev())
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seek(details.seekTime)
    })
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      seek(progress.value - (details.seekOffset || 10))
    })
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      seek(progress.value + (details.seekOffset || 10))
    })
  }

  function updateMediaSessionMetadata(song: ISong) {
    if (!('mediaSession' in navigator) || !song) return

    const artwork = song.picUrl || song.album?.picUrl
      ? [{ src: song.picUrl || song.album!.picUrl, sizes: '512x512', type: 'image/jpeg' }]
      : []

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song.artists?.map(a => a.name).join(' / ') || '未知艺术家',
      album: song.album?.name || '未知专辑',
      artwork
    })
  }

  function updateMediaSessionPlaybackState() {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused'
  }

  function updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || duration.value === 0) return

    navigator.mediaSession.setPositionState({
      duration: duration.value,
      playbackRate: audio.value?.playbackRate || 1,
      position: progress.value
    })
  }

  // ============ 音质处理 ============
  function setQuality(quality: number) {
    if (!QUALITY_OPTIONS.some(opt => opt.value === quality)) return

    currentQuality.value = quality
    localStorage.setItem('audioQuality', quality.toString())

    // 重新加载当前歌曲（如果正在播放）
    if (hasCurrentSong.value && audio.value?.src) {
      loadSong(currentSong.value!).catch(console.error)
    }
  }

  function getQualityDescription(quality: number) {
    const option = QUALITY_OPTIONS.find(opt => opt.value === quality)
    return option?.description || `${Math.floor(quality / 1000)}kbps`
  }

  async function getAudioUrl(songId: number): Promise<string> {
    try {
      const urlRes = await api.getSongUrl(songId, currentQuality.value)
      return urlRes.data?.[0]?.url || ''
    } catch (error) {
      console.error('获取音频URL失败:', error)
      return ''
    }
  }

  // ============ 快捷操作 ============
  async function playPlaylist(songs: ISong[], startIndex = 0) {
    if (songs.length === 0) return
    setPlaylist(songs, startIndex)
  }

  async function playAlbum(songs: ISong[], startIndex = 0) {
    await playPlaylist(songs, startIndex)
  }

  async function playFromHistory(song: ISong) {
    await play(song)
  }

  // ============ 返回 ============
  return {
    // State
    audio,
    playlist,
    currentIndex,
    isPlaying,
    progress,
    duration,
    volume,
    playMode,
    isMuted,
    lyrics,
    currentLyricIndex,
    isLoading,
    failedSongs,
    currentQuality,
    // FM状态（简化）
    fmHistory,

    // Getters
    currentSong,
    isPersonalFM,
    hasCurrentSong,
    playlistCount,
    isEmptyPlaylist,
    currentProgressPercent,
    currentLyric,
    canPlay,
    qualityOptions,
    currentQualityOption,

    // Actions
    initAudio,
    play,
    playAtIndex,
    togglePlay,
    pause,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    togglePlayMode,
    setPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    fetchLyric,
    updateCurrentLyric,
    handleSongEnded,
    handlePlayError,
    playFromHistory,
    playPlaylist,
    playAlbum,

    // 音质相关
    setQuality,
    getQualityDescription,
    getAudioUrl,

    // 私人FM相关
    startPersonalFM,
    stopPersonalFM,
    skipFMSong,
    trashFMSong,

    // Media Session
    initMediaSession,
    updateMediaSessionMetadata,
    updateMediaSessionPlaybackState,
    updateMediaSessionPosition
  }
})