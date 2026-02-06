import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUser, IUserState } from '@/api/types'
import * as api from '@/api'
import { Cookie, KV } from '@/api/request'
import { usePlayerStore } from './player'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<(IUser & IUserState) | null>(null)
  const isLoggedIn = ref(false)
  const likeList = ref<number[]>([])
  const loading = ref(false)
  const cookie = ref('')

  // Getters
  const userId = computed(() => user.value?.userId || 0)
  const nickname = computed(() => user.value?.nickname || '')
  const avatarUrl = computed(() => user.value?.avatarUrl || '')

  // Actions
  const setUser = async (userData: (IUser & IUserState) | null) => {
    user.value = userData
    isLoggedIn.value = !!userData
  }

  const setCookie = async (cookieStr: string) => {
    cookie.value = cookieStr
    // 用户成功登录，两侧都同步
    localStorage.setItem('cookie', cookieStr)
    await KV.put('new.user.cookie', cookieStr);
  }

  const initFromStorage = async () => {
    // 先检查localStorage中的cookie
    const storedCookie = localStorage.getItem('cookie')
    
    if (storedCookie) {
      cookie.value = storedCookie
      // 有cookie，检查登录状态
      const loginStatus = await checkLoginStatus()
      if (!loginStatus) {
        // 检查失败，尝试从KV同步cookie
        try {
          const kvCookie = await KV.get('new.user.cookie')
          if (kvCookie) {
            cookie.value = kvCookie
            localStorage.setItem('cookie', kvCookie)
            await Cookie.set(kvCookie)
            await checkLoginStatus()
          }
        } catch (error) {
          console.error('Error loading cookie from KV:', error)
        }
      }
    } else {
      // 没有localStorage cookie，尝试从KV获取
      try {
        const kvCookie = await KV.get('new.user.cookie')
        if (kvCookie) {
          cookie.value = kvCookie
          localStorage.setItem('cookie', kvCookie)
          await Cookie.set(kvCookie)
          await checkLoginStatus()
        }
      } catch (error) {
        console.error('Error loading cookie from KV:', error)
      }
    }
  }

  const loginByPhone = async (phone: string, password: string, countrycode?: string) => {
    loading.value = true
    try {
      const res = await api.loginByPhone(phone, password, countrycode)
      if (res.code === 200) {
        if (res.cookie) {
          await setCookie(res.cookie)
        }
        await checkLoginStatus();
        return { success: true, message: '登录成功' }
      }
      return { success: false, message: res.message || '登录失败' }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  const loginByEmail = async (email: string, password: string) => {
    loading.value = true
    try {
      const res = await api.loginByEmail(email, password)
      if (res.code === 200) {
        if (res.cookie) {
          await setCookie(res.cookie)
        }
        await checkLoginStatus();
        return { success: true, message: '登录成功' }
      }
      return { success: false, message: res.message || '登录失败' }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  const checkLoginStatus = async () => {
    try {
      const res = await api.getLoginStatus()
      if (res.data?.profile) {
        setUser({ ...res.data.account, ...res.data.profile })
        await fetchLikeList(res.data.profile.userId)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const verifyCaptcha = async (phone: string, captcha: string) => {
    loading.value = true
    try {
      const res = await api.verifyCaptcha(phone, captcha)
      if (res.code === 200) {
        await api.refreshLogin();
        // refresh user
        if (await checkLoginStatus())
          return { success: true, message: '验证码验证成功' }
      }
      return { success: false, message: '验证码验证失败' }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '验证码验证失败' }
    } finally {
      loading.value = false
    }
  }

  const logoutUser = async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      cookie.value = ''
      likeList.value = []
      // 退出时两侧都清除
      localStorage.removeItem('cookie')
      await KV.del('new.user.cookie')
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

  window.addEventListener('beforeunload', e => {
    if (usePlayerStore().isPlaying) e.preventDefault();
    // 页面卸载时，将cookie保存到KV
    if (isLoggedIn.value) { // 每次请求会更新CSRF等
      KV.putUnload('new.user.cookie', cookie.value)
    }
  });

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
    verifyCaptcha,
    logoutUser,
    fetchLikeList,
    isLiked,
    toggleLike,
  }
})