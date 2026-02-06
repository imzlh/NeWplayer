<template>
  <div class="tab-navigation" :class="{ sticky }">
    <button 
      v-for="tab in tabs" 
      :key="tab.value" 
      :class="['tab-item', { active: currentValue === tab.value }]"
      @click="handleTabClick(tab.value)"
    >
      {{ tab.label }}
    </button>
    
    <!-- 子标签 -->
    <div v-if="subTabs && subTabs.length > 0" class="sub-tabs">
      <button 
        v-for="subTab in subTabs" 
        :key="subTab.value" 
        :class="['sub-tab-item', { active: currentSubValue === subTab.value }]"
        @click="handleSubTabClick(subTab.value)"
      >
        {{ subTab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TabOption {
  label: string
  value: string | number
}

interface Props {
  tabs: TabOption[]
  subTabs?: TabOption[]
  modelValue: string | number
  subModelValue?: string | number
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subTabs: () => [],
  sticky: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'update:subModelValue': [value: string | number]
  tabChange: [value: string | number]
  subTabChange: [value: string | number]
}>()

const currentValue = ref(props.modelValue)
const currentSubValue = ref(props.subModelValue || '')

const handleTabClick = (value: string | number) => {
  currentValue.value = value
  emit('update:modelValue', value)
  emit('tabChange', value)
}

const handleSubTabClick = (value: string | number) => {
  currentSubValue.value = value
  emit('update:subModelValue', value)
  emit('subTabChange', value)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.tab-navigation {
  background: $bg-primary;
  border-bottom: 1px solid $border-color;
  display: flex;
  
  &.sticky {
    position: sticky;
    top: 0;
    z-index: $z-sticky;
  }

  > * {
    flex: 1 1;
  }
}

.tab-item {
  flex: 1;
  padding: $spacing-md;
  font-size: $font-sm;
  font-weight: 500;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all $transition-fast $ease-default;

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
  }
}

.sub-tabs {
  display: flex;
  border-top: 1px solid $border-color;
}

.sub-tab-item {
  flex: 1;
  padding: $spacing-sm 0;
  font-size: $font-xs;
  color: $text-secondary;
  background: transparent;
  border: none;
  position: relative;
  cursor: pointer;
  transition: color $transition-fast $ease-default;

  &.active {
    color: $primary-color;
    font-weight: 500;
  }

  &.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: $primary-color;
    border-radius: 2px 2px 0 0;
  }
}
</style>