<template>
  <nav class="bottom-nav" :class="{ 'nav-hidden': hidden }">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ 'nav-active': isActive(item.path) }"
      @click="handleNavClick(item)"
    >
      <div class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="item.icon === 'home'" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <path v-if="item.icon === 'home'" d="M9 22V12h6v10"/>
          
          <circle v-if="item.icon === 'discover'" cx="12" cy="12" r="10"/>
          <polygon v-if="item.icon === 'discover'" points="10 8 16 12 10 16 10 8"/>
          
          <circle v-if="item.icon === 'search'" cx="11" cy="11" r="8"/>
          <path v-if="item.icon === 'search'" d="M21 21l-4.35-4.35"/>
          
          <path v-if="item.icon === 'user'" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle v-if="item.icon === 'user'" cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

interface NavItem {
  path: string
  label: string
  icon: 'home' | 'discover' | 'search' | 'user'
  requiresAuth?: boolean
}

const navItems = computed<NavItem[]>(() => [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/search', label: '发现', icon: 'search' },
  { path: '/user', label: '我的', icon: 'user', requiresAuth: true },
])

const hidden = computed(() => {
  return route.meta.fullScreen as boolean || false
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleNavClick = (item: NavItem) => {
  if (item.requiresAuth && !userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: { redirect: item.path },
    })
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $screen-width;
  height: 3.5rem; // 3.5rem /* 56px */
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba($bg-secondary, 0.95);
  backdrop-filter: blur(1.25rem /* 20px */);
  border-top: 0.125rem /* 1px */ solid $border-color;
  z-index: $z-sticky;
  transition: transform $transition-normal $ease-default;
  
  &.nav-hidden {
    transform: translateX(-50%) translateY(100%);
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem /* 2px */;
  padding: $spacing-sm $spacing-md;
  color: $text-tertiary;
  transition: all $transition-fast $ease-default;
  @include tap-effect;
  
  &.nav-active {
    color: $primary-color;
    
    .nav-icon {
      transform: scale(1.1);
    }
  }
}

.nav-icon {
  width: 1.5rem; // 1.5rem /* 24px */
  height: 1.5rem; // 1.5rem /* 24px */
  transition: transform $transition-fast $ease-default;
}

.nav-label {
  font-size: $font-xs;
  font-weight: 500;
}
</style>