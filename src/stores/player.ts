import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ISong, ILyric, PlayMode } from '@/types'
import { PlayMode as PlayModeEnum } from '@/types'
import * as api from '@/api'
import { parseLyric } from '@/utils/lyric'

export const usePlayerStore = defineStore('player', () => {
  // ============ State ============
  const audio = ref<HTMLAudioElement | null>(null)
  const currentSong = ref<ISong | null>(null)
  const playlist = ref<ISong[]>([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const progress = ref(0)
  const duration = ref(0)
  const volume = ref(parseFloat(localStorage.getItem('volume') || '0.8'))
  const playMode = ref<PlayMode>(parseInt(localStorage.getItem('playMode') || '0') as PlayMode)
  const isMuted = ref(false)
  const lyrics = ref<ILyric[]>([])
  const currentLyricIndex = ref(-1)
  const isLoading = ref(false)
  const playHistory = ref<ISong[]>(JSON.parse(localStorage.getItem('playHistory') || '[]'))
  const failedSongs = ref<Set<number>>(new Set())
  
  // 私人FM状态
  const isPersonalFM = ref(false)
  const fmPlaylist = ref<ISong[]>([])
  const fmHistory = ref<ISong[]>([])
  const fmIndex = ref(0)
  
  // 从localStorage恢复播放状态
  const restorePlayerState = async () => {
    try {
      const savedState = localStorage.getItem('playerState')
      if (savedState) {
        const state = JSON.parse(savedState)
        currentSong.value = state.currentSong || null
        playlist.value = state.playlist || []
        currentIndex.value = state.currentIndex || -1
        progress.value = state.progress || 0
        duration.value = state.duration || 0
        isPlaying.value = state.isPlaying || false
        lyrics.value = state.lyrics || []
        currentLyricIndex.value = state.currentLyricIndex || -1

        initAudio();
        isLoading.value = true;
        isPlaying.value = false;
        const urlt = await api.getSongUrl(currentSong.value!.id, 320000);
        const url = urlt.data?.[0].url;
        if (!url) {
          isLoading.value = false;
          await next();
          return;
        }
        audio.value!.src = url;

        updateMediaSessionMetadata(currentSong.value!);
      }
    } catch (error) {
      console.error('恢复播放状态失败:', error)
    }
  }
  
  // 保存播放状态到localStorage
  const savePlayerState = () => {
    try {
      const state = {
        currentSong: currentSong.value,
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

  // ============ Getters ============
  const hasCurrentSong = computed(() => !!currentSong.value)
  const playlistCount = computed(() => playlist.value.length)
  const isEmptyPlaylist = computed(() => playlist.value.length === 0)
  
  const currentProgressPercent = computed(() => {
    if (duration.value === 0) return 0
    return (progress.value / duration.value) * 100
  })

  const currentLyric = computed(() => {
    if (currentLyricIndex.value >= 0 && currentLyricIndex.value < lyrics.value.length) {
      return lyrics.value[currentLyricIndex.value]
    }
    return null
  })

  const canPlay = computed(() => {
    if (!currentSong.value) return false
    return !failedSongs.value.has(currentSong.value.id)
  })

  // ============ Actions ============
  
  // 初始化音频
  const initAudio = () => {
    if (audio.value) return
    
    audio.value = new Audio()
    audio.value.volume = volume.value
    
    // 初始化Media Session API
    initMediaSession()
    
    // 恢复播放状态
    restorePlayerState()
    
    audio.value.addEventListener('timeupdate', () => {
      if (audio.value) {
        progress.value = audio.value.currentTime
        updateCurrentLyric()
        // 保存播放进度
        savePlayerState()
        // 更新Media Session的播放位置
        updateMediaSessionPosition()
      }
    })
    
    audio.value.addEventListener('loadedmetadata', () => {
      if (audio.value) {
        duration.value = audio.value.duration
        // 如果有保存的进度，恢复到该位置
        if (progress.value > 0 && progress.value < duration.value) {
          audio.value.currentTime = progress.value
        }
      }
    })
    
    audio.value.addEventListener('ended', () => {
      handleSongEnded()
    })
    
    audio.value.addEventListener('error', () => {
      handlePlayError()
    })
    
    audio.value.addEventListener('waiting', () => {
      isLoading.value = true
    })
    
    audio.value.addEventListener('canplay', () => {
      isLoading.value = false
    })
  }

  // 播放歌曲
  const play = async (song: ISong, playNow = true) => {
    initAudio()
    
    if (!audio.value) return

    // 检查歌曲是否可用
    try {
      const checkRes = await api.checkMusic(song.id)
      if (!checkRes.success) {
        throw new Error(checkRes.message || '歌曲不可用')
      }
    } catch (error) {
      console.warn('歌曲检查失败，尝试播放:', song.name)
    }

    isLoading.value = true
    
    try {
      // 获取歌曲URL
      const urlRes = await api.getSongUrl(song.id, 320000)
      const songData = urlRes.data?.[0]
      
      if (!songData?.url) {
        throw new Error('无法获取播放地址')
      }

      // 获取封面
      if (!song.picUrl) {
        const detail = await api.getSongDetail(song.id);
        song.picUrl = detail.songs[0].al.picUrl
        song.album = detail.songs[0].al
        song.artists = detail.songs[0].ar;
      }

      // 设置音频源
      audio.value.src = songData.url
      currentSong.value = song
      
      // 更新播放列表中的索引
      const index = playlist.value.findIndex(s => s.id === song.id)
      if (index === -1) {
        // 如果歌曲不在播放列表中，添加到当前位置
        playlist.value.splice(currentIndex.value + 1, 0, song)
        currentIndex.value = currentIndex.value + 1
      } else {
        currentIndex.value = index
      }

      // 获取歌词
      await fetchLyric(song.id)

      // 更新Media Session
      updateMediaSessionMetadata(song)

      // 添加到播放历史
      addToHistory(song)

      // 播放
      if (playNow) {
        await audio.value.play()
        isPlaying.value = true
      }

      failedSongs.value.delete(song.id)
      
      // 保存播放状态
      savePlayerState()
    } catch (error) {
      console.error('播放失败:', error)
      failedSongs.value.add(song.id)
      // 自动切换到下一首
      if (playNow) {
        next()
      }
    } finally {
      isLoading.value = false
    }
  }

  // 播放指定索引的歌曲
  const playAtIndex = async (index: number) => {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    await play(playlist.value[index])
  }

  // 切换播放/暂停
  const togglePlay = async () => {
    if (!audio.value || !currentSong.value) return
    
    if (isPlaying.value) {
      audio.value.pause()
      isPlaying.value = false
    } else {
      try {
        await audio.value.play()
        isPlaying.value = true
      } catch (error) {
        console.error('播放失败:', error)
        next()
      }
    }
    
    // 更新Media Session的播放状态
    updateMediaSessionPlaybackState()
    
    // 保存播放状态
    savePlayerState()
  }

  // 暂停
  const pause = () => {
    if (audio.value) {
      audio.value.pause()
      isPlaying.value = false
      // 保存播放状态
      savePlayerState()
    }
  }

  // 下一首
  const next = async () => {
    // 如果是私人FM模式
    if (isPersonalFM.value) {
      await playNextFM()
      return
    }
    
    if (playlist.value.length === 0) return
    
    let nextIndex: number
    
    switch (playMode.value) {
      case PlayModeEnum.Random:
        nextIndex = Math.floor(Math.random() * playlist.value.length)
        break
      case PlayModeEnum.Loop:
        nextIndex = currentIndex.value
        break
      case PlayModeEnum.Sequence:
      default:
        nextIndex = currentIndex.value + 1
        if (nextIndex >= playlist.value.length) {
          nextIndex = 0
        }
        break
    }
    
    await playAtIndex(nextIndex)
  }

  // 上一首
  const prev = async () => {
    if (playlist.value.length === 0) return
    
    let prevIndex: number
    
    switch (playMode.value) {
      case PlayModeEnum.Random:
        prevIndex = Math.floor(Math.random() * playlist.value.length)
        break
      case PlayModeEnum.Loop:
        prevIndex = currentIndex.value
        break
      case PlayModeEnum.Sequence:
      default:
        prevIndex = currentIndex.value - 1
        if (prevIndex < 0) {
          prevIndex = playlist.value.length - 1
        }
        break
    }
    
    await playAtIndex(prevIndex)
  }

  // 设置播放进度
  const seek = (time: number) => {
    if (audio.value && duration.value > 0) {
      audio.value.currentTime = Math.max(0, Math.min(time, duration.value))
      progress.value = audio.value.currentTime
      
      // 更新Media Session的播放位置
      updateMediaSessionPosition()
    }
  }

  // 设置音量
  const setVolume = (val: number) => {
    volume.value = Math.max(0, Math.min(1, val))
    if (audio.value) {
      audio.value.volume = volume.value
    }
    localStorage.setItem('volume', String(volume.value))
  }

  // 切换静音
  const toggleMute = () => {
    if (!audio.value) return
    isMuted.value = !isMuted.value
    audio.value.muted = isMuted.value
  }

  // 切换播放模式
  const togglePlayMode = () => {
    // 私人FM模式下禁止切换播放模式
    if (isPersonalFM.value) return
    
    playMode.value = ((playMode.value + 1) % 3) as PlayMode
    localStorage.setItem('playMode', String(playMode.value))
  }

  // 设置播放列表
  const setPlaylist = (songs: ISong[], startIndex = 0) => {
    playlist.value = [...songs]
    failedSongs.value.clear()
    if (songs.length > 0 && startIndex >= 0 && startIndex < songs.length) {
      playAtIndex(startIndex)
    }
    // 保存播放状态
    savePlayerState()
  }

  // 添加歌曲到播放列表
  const addToPlaylist = (song: ISong) => {
    const index = playlist.value.findIndex(s => s.id === song.id)
    if (index === -1) {
      playlist.value.push(song)
      // 保存播放状态
      savePlayerState()
    }
  }

  // 从播放列表移除歌曲
  const removeFromPlaylist = (index: number) => {
    if (index < 0 || index >= playlist.value.length) return
    
    playlist.value.splice(index, 1)
    
    if (currentIndex.value === index) {
      if (playlist.value.length > 0) {
        next()
      } else {
        currentSong.value = null
        currentIndex.value = -1
        progress.value = 0
        duration.value = 0
        lyrics.value = []
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
    
    // 保存播放状态
    savePlayerState()
  }

  // 获取歌词
  const fetchLyric = async (songId: number) => {
    try {
      const res = await api.getLyric(songId)
      if (res.lrc?.lyric) {
        lyrics.value = parseLyric(res.lrc.lyric, res.tlyric?.lyric)
      } else {
        lyrics.value = []
      }
    } catch (error) {
      console.error('获取歌词失败:', error)
      lyrics.value = []
    }
  }

  // 更新当前歌词索引
  const updateCurrentLyric = () => {
    if (lyrics.value.length === 0) {
      currentLyricIndex.value = -1
      return
    }
    
    const currentTime = progress.value
    let index = lyrics.value.findIndex((lyric, i) => {
      const nextLyric = lyrics.value[i + 1]
      return lyric.time <= currentTime && (!nextLyric || nextLyric.time > currentTime)
    })
    
    if (index === -1) {
      index = 0
    }
    
    currentLyricIndex.value = index
  }

  // 处理歌曲结束
  const handleSongEnded = () => {
    if (playMode.value === PlayModeEnum.Loop) {
      if (audio.value) {
        audio.value.currentTime = 0
        audio.value.play()
      }
    } else {
      next()
    }
  }

  // 处理播放错误
  const handlePlayError = () => {
    console.error('音频播放错误')
    isLoading.value = false
    if (currentSong.value) {
      failedSongs.value.add(currentSong.value.id)
    }
    // 自动切换到下一首
    setTimeout(() => {
      next()
    }, 1000)
  }

  // 添加到播放历史
  const addToHistory = (song: ISong) => {
    const index = playHistory.value.findIndex(s => s.id === song.id)
    if (index > -1) {
      playHistory.value.splice(index, 1)
    }
    playHistory.value.unshift(song)
    if (playHistory.value.length > 100) {
      playHistory.value = playHistory.value.slice(0, 100)
    }
    localStorage.setItem('playHistory', JSON.stringify(playHistory.value))
  }

  // 从播放历史播放
  const playFromHistory = async (song: ISong) => {
    await play(song)
  }

  // ============ 私人FM相关函数 ============
  
  // 启动私人FM
  const startPersonalFM = async () => {
    isPersonalFM.value = true
    fmPlaylist.value = []
    fmHistory.value = []
    fmIndex.value = 0
    
    // 获取第一首FM歌曲
    await fetchFMSongs()
    
    if (fmPlaylist.value.length > 0) {
      await playFMSong()
    }
  }
  
  // 停止私人FM
  const stopPersonalFM = () => {
    isPersonalFM.value = false
    fmPlaylist.value = []
    fmHistory.value = []
    fmIndex.value = 0
  }
  
  // 获取FM歌曲
  const fetchFMSongs = async () => {
    try {
      const response = await api.getPersonalFM()
      if (response.code === 200 && response.data) {
        // 添加到FM播放列表
        fmPlaylist.value.push(...response.data)
      }
    } catch (error) {
      console.error('获取私人FM失败:', error)
    }
  }
  
  // 播放FM歌曲
  const playFMSong = async () => {
    if (fmPlaylist.value.length === 0) {
      await fetchFMSongs()
      if (fmPlaylist.value.length === 0) {
        console.error('没有可播放的FM歌曲')
        return
      }
    }
    
    const song = fmPlaylist.value[fmIndex.value]
    
    // 添加到普通播放列表，方便生成歌单
    if (!playlist.value.find(s => s.id === song.id)) {
      playlist.value.push(song)
    }
    
    // 添加到FM历史
    if (!fmHistory.value.find(s => s.id === song.id)) {
      fmHistory.value.push(song)
    }
    
    await play(song)
  }
  
  // 播放下一首FM歌曲
  const playNextFM = async () => {
    // 移动到下一首
    fmIndex.value++
    
    // 如果当前FM列表已经播放完，获取新的FM歌曲
    if (fmIndex.value >= fmPlaylist.value.length) {
      await fetchFMSongs()
      if (fmPlaylist.value.length === 0) {
        console.error('没有可播放的FM歌曲')
        stopPersonalFM()
        return
      }
    }
    
    await playFMSong()
  }
  
  // 跳过当前FM歌曲
  const skipFMSong = async () => {
    if (isPersonalFM.value) {
      await playNextFM()
    }
  }
  
  // 垃圾桶：不喜欢当前FM歌曲
  const trashFMSong = async () => {
    if (isPersonalFM.value && currentSong.value) {
      // 从FM播放列表和历史中移除当前歌曲
      fmPlaylist.value = fmPlaylist.value.filter(s => s.id !== currentSong.value!.id)
      fmHistory.value = fmHistory.value.filter(s => s.id !== currentSong.value!.id)
      
      // 从普通播放列表中移除
      playlist.value = playlist.value.filter(s => s.id !== currentSong.value!.id)
      
      // 播放下一首FM歌曲
      await playNextFM()
    }
  }
  
  // ============ Media Session API ============
  
  // 初始化Media Session
  const initMediaSession = () => {
    if (!('mediaSession' in navigator)) return
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: '网易云音乐',
      artist: 'NeWPlayer',
      album: '在线音乐',
      artwork: [
        { src: '/favicon.webp', sizes: '96x96', type: 'image/webp' },
        { src: '/favicon.webp', sizes: '128x128', type: 'image/webp' },
        { src: '/favicon.webp', sizes: '192x192', type: 'image/webp' },
        { src: '/favicon.webp', sizes: '256x256', type: 'image/webp' },
        { src: '/favicon.webp', sizes: '384x384', type: 'image/webp' },
        { src: '/favicon.webp', sizes: '512x512', type: 'image/webp' }
      ]
    })
    
    // 设置播放状态
    navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused'
    
    // 设置操作处理器
    navigator.mediaSession.setActionHandler('play', () => audio.value?.play())
    navigator.mediaSession.setActionHandler('pause', () => audio.value?.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (isPersonalFM.value) {
        // 私人FM模式下没有上一首
        return
      }
      prev()
    })
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime)
      }
    })
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const seekTime = Math.max(0, progress.value - (details.seekOffset || 10))
      seek(seekTime)
    })
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const seekTime = Math.min(duration.value, progress.value + (details.seekOffset || 10))
      seek(seekTime)
    })
  }
  
  // 更新Media Session的元数据
  const updateMediaSessionMetadata = (song: ISong) => {
    if (!('mediaSession' in navigator) || !song) return
    
    const imageUrl = song.picUrl || song.album?.picUrl || '/favicon.webp'
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song.artists?.map(a => a.name).join(' / ') || '未知艺术家',
      album: song.album?.name || '未知专辑',
      artwork: [
        { src: imageUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: imageUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: imageUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: imageUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: imageUrl, sizes: '384x384', type: 'image/jpeg' },
        { src: imageUrl, sizes: '512x512', type: 'image/jpeg' }
      ]
    })
  }
  
  // 更新Media Session的播放状态
  const updateMediaSessionPlaybackState = () => {
    if (!('mediaSession' in navigator)) return
    
    navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused'
  }
  
  // 更新Media Session的播放位置
  const updateMediaSessionPosition = () => {
    if (!('mediaSession' in navigator) || duration.value === 0) return
    
    navigator.mediaSession.setPositionState({
      duration: duration.value,
      playbackRate: audio.value?.playbackRate || 1,
      position: progress.value
    })
  }

  // 清空播放列表
  const clearPlaylist = () => {
    playlist.value = []
    currentIndex.value = -1
    currentSong.value = null
    progress.value = 0
    duration.value = 0
    isPlaying.value = false
    lyrics.value = []
    currentLyricIndex.value = -1
    if (isPersonalFM.value) stopPersonalFM();
    
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
    }
    
    // 保存播放状态
    savePlayerState()
  }

  // 播放歌单
  const playPlaylist = async (songs: ISong[], startIndex = 0) => {
    if (songs.length === 0) return
    if (isPersonalFM.value) stopPersonalFM()
    setPlaylist(songs, startIndex)
  }

  // 播放专辑
  const playAlbum = async (songs: ISong[], startIndex = 0) => {
    await playPlaylist(songs, startIndex)
  }

  return {
    // State
    audio,
    currentSong,
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
    playHistory,
    failedSongs,
    // 私人FM状态
    isPersonalFM,
    fmPlaylist,
    fmHistory,
    fmIndex,
    // Getters
    hasCurrentSong,
    playlistCount,
    isEmptyPlaylist,
    currentProgressPercent,
    currentLyric,
    canPlay,
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
    addToHistory,
    playFromHistory,
    playPlaylist,
    playAlbum,
    // 私人FM相关函数
    startPersonalFM,
    stopPersonalFM,
    fetchFMSongs,
    playFMSong,
    playNextFM,
    skipFMSong,
    trashFMSong,
    // Media Session API相关函数
    initMediaSession,
    updateMediaSessionMetadata,
    updateMediaSessionPlaybackState,
    updateMediaSessionPosition,
  }
})