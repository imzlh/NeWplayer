<template>
  <div class="login-page">
    <!-- 头部 -->
    <header class="login-header">
      <button class="header-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="header-title">登录</h1>
      <div class="header-placeholder"></div>
    </header>
    
    <!-- 登录方式切换 -->
    <div class="login-tabs">
      <button
        class="tab-item"
        :class="{ 'tab-active': loginType === 'phone' }"
        @click="loginType = 'phone'"
      >
        手机号或邮箱
      </button>
      <button
        class="tab-item"
        :class="{ 'tab-active': loginType === 'qr' }"
        @click="loginType = 'qr'"
      >
        扫码登录
      </button>
    </div>
    
    <!-- 手机号或邮箱登录 -->
    <div v-if="loginType === 'phone'" class="login-form">
      <div class="form-group">
        <div class="input-wrapper">
          <input
            v-model="phone"
            type="text"
            class="form-input"
            :placeholder="useCaptcha ? '请输入手机号' : '请输入手机号或邮箱'"
            maxlength="11"
          />
          <button class="captcha-send" @click="sending ? noCaptcha() : sendCode()">
            {{ sending ? '返回账密' : '发送验证码' }}
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <div class="input-wrapper">
          <input v-if="useCaptcha"
            v-model="password"
            type="text"
            class="form-input"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <input v-else
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入密码"
          />
          <button class="input-suffix" @click="showPassword = !showPassword">
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
      </div>
      
      <button
        class="login-btn"
        :disabled="!canLogin || loading"
        @click="handleLogin"
      >
        <Loading v-if="loading" :visible="true" />
        <span v-else>登录</span>
      </button>
      
      <p class="login-tips">
        登录即代表您同意
        <a href="#" @click.prevent="showTerms">用户协议</a>
        和
        <a href="#" @click.prevent="showPrivacy">隐私政策</a>
      </p>
    </div>
    
    <!-- 扫码登录 -->
    <div v-else class="login-qr">
      <div v-if="qrLoading" class="qr-loading">
        <Loading :visible="true" text="加载中..." />
      </div>
      <div v-else-if="qrCode" class="qr-code">
        <img :src="qrCode" alt="扫码登录" />
        <p class="qr-status">{{ qrStatusText }}</p>
        <button v-if="qrExpired" class="qr-refresh" @click="refreshQR">
          刷新二维码
        </button>
      </div>
    </div>
    
    <!-- 游客入口 -->
    <div class="guest-entry">
      <button class="guest-btn" @click="goBack">
        暂不登录，随便看看
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as api from '@/api'
import Loading from '@/components/Loading.vue'
import { showText } from '@/stores/text'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const useCaptcha = ref(false)
const sending = ref(false)

// 状态
const loginType = ref<'phone' | 'qr'>('phone')
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

// 二维码相关
const qrCode = ref('')
const qrKey = ref('')
const qrStatus = ref(0) // 0:等待扫描 1:等待确认 2:授权成功 3:二维码过期
const qrLoading = ref(false)
const qrExpired = ref(false)
const qrCheckTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 监听登录变化
watch(() => userStore.isLoggedIn, b => {
  if (b) {
    // 登录成功后，跳转到上一页或首页
    router.push(route.query.from as string || '/')
  }
})

const qrStatusText = computed(() => {
  switch (qrStatus.value) {
    case 0:
      return '请使用网易云音乐APP扫码登录'
    case 1:
      return '请在手机上确认登录'
    case 2:
      return '登录成功'
    case 3:
      return '二维码已过期'
    default:
      return '请使用网易云音乐APP扫码登录'
  }
})

// 计算属性
const canLogin = computed(() => {
  return useCaptcha.value
    ? password.value.length >= 4    // 验证码4位
    : phone.value.length === 11 && password.value.length >= 6
})

// 发送验证码
let sendTimer: ReturnType<typeof setTimeout> | null = null;
const sendCode = async () => {
  if (sending.value) return console.log('发送中')
  if (!phone.value) {
    showText('请输入手机号')
    return
  }
  sending.value = true
  try {
    const res = await api.sendCaptcha(phone.value)
    if (res.code === 200) {
      useCaptcha.value = true
      showText('验证码已发送。如需重新发送，请60秒后重试')
      sendTimer = setTimeout(() => {
        sending.value = false,
        sendTimer = null;
      }, 60000);
    } else {
      showText(res.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    showText('验证码发送失败')
  }
}

const noCaptcha = () => {
  useCaptcha.value = false
  sending.value = false
  if (sendTimer !== null) {
    clearTimeout(sendTimer);
    sendTimer = null;
  }
}

// 手机号或邮箱登录
const handleLogin = async () => {
  if (!canLogin.value) return

  const name = phone.value;
  loading.value = true;
  let result
  if (/^[0-9]+$/.test(name)) {
    if (useCaptcha.value) {
      result = await userStore.verifyCaptcha(name, password.value);
    } else {
      result = await userStore.loginByPhone(name, password.value)
    }
  } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,8}$/.test(name)) {
    result = await userStore.loginByEmail(name, password.value)
  } else {
    showText('请输入有效的手机号或邮箱')
    loading.value = false
    return
  }
  loading.value = false
  
  if (result.success) {
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } else {
    showText(result.message)
  }
}

// 获取二维码
const fetchQRCode = async () => {
  qrLoading.value = true
  try {
    // 获取key
    const keyRes = await api.getQRKey()
    if (keyRes.code === 200 && keyRes.data?.unikey) {
      qrKey.value = keyRes.data.unikey
      
      // 生成二维码
      const qrRes = await api.createQR(qrKey.value, true)
      if (qrRes.code === 200 && qrRes.data?.qrimg) {
        qrCode.value = qrRes.data.qrimg
        qrStatus.value = 0
        qrExpired.value = false
        
        // 开始检查状态
        startQRCheck()
      } else {
        console.error('生成二维码失败:', qrRes)
      }
    } else {
      console.error('获取二维码key失败:', keyRes)
    }
  } catch (error) {
    console.error('获取二维码失败:', error)
  } finally {
    qrLoading.value = false
  }
}

// 检查二维码状态
const checkQRStatus = async () => {
  if (!qrKey.value) return
  
  try {
    const res = await api.checkQR(qrKey.value)
    qrStatus.value = res.code
    
    if (res.code === 800) {
      // 二维码过期
      qrExpired.value = true
      stopQRCheck()
    } else if (res.code === 803) {
      // 登录成功
      stopQRCheck()
      if (res.cookie) {
        userStore.setCookie(res.cookie)
        // 获取登录状态
        const statusRes = await api.getLoginStatus()
        if (statusRes.data?.profile) {
          userStore.setUser(statusRes.data.profile)
          const redirect = route.query.redirect as string
          router.push(redirect || '/')
        }
      }
    }
  } catch (error) {
    console.error('检查二维码状态失败:', error)
  }
}

// 开始检查二维码
const startQRCheck = () => {
  stopQRCheck()
  qrCheckTimer.value = setInterval(checkQRStatus, 2000)
}

// 停止检查二维码
const stopQRCheck = () => {
  if (qrCheckTimer.value) {
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value = null
  }
}

// 刷新二维码
const refreshQR = () => {
  fetchQRCode()
}

// 显示用户协议
const showTerms = () => {
  // 实现显示用户协议
}

// 显示隐私政策
const showPrivacy = () => {
  // 实现显示隐私政策
}

// 返回
const goBack = () => {
  router.back()
}

// 监听登录方式变化
watch(loginType, (newType: 'phone' | 'qr') => {
  if (newType === 'qr') {
    fetchQRCode()
  } else {
    stopQRCheck()
  }
})

onMounted(() => {
  if (loginType.value === 'qr') {
    fetchQRCode()
  }
})

onUnmounted(() => {
  stopQRCheck()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  padding-top: calc(#{$spacing-md} + env(safe-area-inset-top));
}

.header-back {
  width: 2.5rem /* 40px */;
  height: 2.5rem /* 40px */;
  @include flex-center;
  color: $text-primary;
  border-radius: 50%;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-card;
  }
  
  svg {
    width: 1.375rem /* 22px */;
    height: 1.375rem /* 22px */;
  }
}

.header-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.header-placeholder {
  width: 2.5rem /* 40px */;
}

.login-tabs {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin: $spacing-lg 0;
}

.tab-item {
  padding: $spacing-sm $spacing-lg;
  font-size: $font-md;
  color: $text-tertiary;
  position: relative;
  transition: color $transition-fast $ease-default;
  
  &.tab-active {
    color: $primary-color;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -0.25rem /* 4px */;
      left: 50%;
      transform: translateX(-50%);
      width: 1.25rem /* 20px */;
      height: 0.25rem /* 3px */;
      background: $primary-color;
      border-radius: $radius-full;
    }
  }
}

.login-form {
  flex: 1;
  padding: $spacing-xl $spacing-lg;
}

.form-group {
  margin-bottom: $spacing-lg;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 0.125rem /* 1px */ solid $border-color;
  transition: border-color $transition-fast $ease-default;
  
  &:focus-within {
    border-color: $primary-color;
  }
}

.captcha-send {
  font-size: $font-sm;
  color: $text-secondary;
  font-weight: 500;
  border-left: 0.125rem /* 1px */ solid $border-color;
  padding-left: $spacing-sm;
}

.form-input {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
  background: none;
  border: none;
  outline: none;
  
  &::placeholder {
    color: $text-muted;
  }
}

.input-suffix {
  width: 1.5rem /* 24px */;
  height: 1.5rem /* 24px */;
  @include flex-center;
  color: $text-tertiary;
  
  svg {
    width: 1.125rem /* 18px */;
    height: 1.125rem /* 18px */;
  }
}

.login-btn {
  width: 100%;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  font-size: $font-md;
  font-weight: 500;
  color: white;
  background: $gradient-primary;
  border-radius: $radius-lg;
  transition: all $transition-fast $ease-default;
  @include flex-center;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

.login-tips {
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-xs;
  color: $text-tertiary;
  
  a {
    color: $primary-color;
  }
}

.login-qr {
  flex: 1;
  @include flex-center;
  padding: $spacing-xl;
}

.qr-loading {
  padding: $spacing-xl;
}

.qr-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  
  img {
    width: 12.5rem /* 200px */;
    height: 12.5rem /* 200px */;
    border-radius: $radius-md;
  }
}

.qr-status {
  font-size: $font-sm;
  color: $text-secondary;
}

.qr-refresh {
  padding: $spacing-sm $spacing-lg;
  font-size: $font-sm;
  color: $primary-color;
  background: $bg-card;
  border-radius: $radius-md;
  transition: all $transition-fast $ease-default;
  
  &:active {
    background: $bg-hover;
  }
}

.guest-entry {
  padding: $spacing-lg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

.guest-btn {
  width: 100%;
  padding: $spacing-md;
  font-size: $font-sm;
  color: $text-tertiary;
  text-align: center;
  transition: color $transition-fast $ease-default;
  
  &:active {
    color: $text-secondary;
  }
}
</style>