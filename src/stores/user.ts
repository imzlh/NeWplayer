import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUser } from '@/types'
import * as api from '@/api'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<IUser | null>(null)
  const isLoggedIn = ref(false)
  const likeList = ref<number[]>([])
  const loading = ref(false)
  const cookie = ref('')

  // Getters
  const userId = computed(() => user.value?.userId || 0)
  const nickname = computed(() => user.value?.nickname || '')
  const avatarUrl = computed(() => user.value?.avatarUrl || '')

  // Actions
  const setUser = (userData: IUser | null) => {
    user.value = userData
    isLoggedIn.value = !!userData
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const setCookie = (cookieStr: string) => {
    cookie.value = cookieStr
    localStorage.setItem('cookie', cookieStr)
  }

  const initFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    const storedCookie = localStorage.getItem('cookie')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
        isLoggedIn.value = true
      } catch {
        localStorage.removeItem('user')
      }
    }
    if (storedCookie) {
      cookie.value = storedCookie
    }
  }

  const loginByPhone = async (phone: string, password: string, countrycode?: string) => {
    loading.value = true
    try {
      const res = await api.loginByPhone(phone, password, countrycode)
      if (res.code === 200 && res.profile) {
        setUser(res.profile)
        if (res.cookie) {
          setCookie(res.cookie)
        }
        await fetchLikeList(res.profile.userId)
        return { success: true, message: '登录成功' }
      }
      return { success: false, message: '登录失败' }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  const loginByEmail = async (email: string, password: string) => {
    loading.value = true
    try {
      const res = await api.loginByEmail(email, password)
      if (res.code === 200 && res.profile) {
        setUser(res.profile)
        if (res.cookie) {
          setCookie(res.cookie)
        }
        await fetchLikeList(res.profile.userId)
        return { success: true, message: '登录成功' }
      }
      return { success: false, message: '登录失败' }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  const checkLoginStatus = async () => {
    try {
      const res = await api.getLoginStatus()
      if (res.data?.profile) {
        setUser(res.data.profile)
        await fetchLikeList(res.data.profile.userId)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logoutUser = async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      cookie.value = ''
      likeList.value = []
      localStorage.removeItem('cookie')
    }
  }

  const fetchLikeList = async (uid: number) => {
    try {
      const res = await api.getLikeList(uid)
      if (res.code === 200) {
        likeList.value = res.ids || []
      }
    } catch (error) {
      console.error('获取喜欢列表失败:', error)
    }
  }

  const isLiked = (songId: number) => {
    return likeList.value.includes(songId)
  }

  const toggleLike = async (songId: number) => {
    if (!isLoggedIn.value) {
      return { success: false, message: '请先登录' }
    }
    try {
      const like = !isLiked(songId)
      const res = await api.likeSong(songId, like)
      if (res.code === 200) {
        if (like) {
          likeList.value.push(songId)
        } else {
          const index = likeList.value.indexOf(songId)
          if (index > -1) {
            likeList.value.splice(index, 1)
          }
        }
        return { success: true, message: like ? '已添加到喜欢' : '已取消喜欢' }
      }
      return { success: false, message: '操作失败' }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '操作失败' }
    }
  }

  return {
    user,
    isLoggedIn,
    likeList,
    loading,
    cookie,
    userId,
    nickname,
    avatarUrl,
    setUser,
    setCookie,
    initFromStorage,
    loginByPhone,
    loginByEmail,
    checkLoginStatus,
    logoutUser,
    fetchLikeList,
    isLiked,
    toggleLike,
  }
})
