<template>
  <div
      v-if="visible"
      class="detail-popup"
      :style="popupStyle"
      @mouseenter="hovering = true"
      @mouseleave="hideWithDelay"
  >
    <div
        v-for="(item, index) in items"
        :key="index"
        class="detail-item"
    >
      <p class="type-tag">{{ getTypeLabel(item.event_type) }}</p>
      <p class="title">{{ item.subject_name || '수업' }}</p>
      <p v-if="item.professor_name">👩‍🏫 {{ item.professor_name }}</p>
      <p v-if="item.room">🏫 {{ item.room }}</p>
      <p v-if="item.description">📝 {{ item.description }}</p>
      <hr v-if="index !== items.length - 1" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  items: Array,
  targetEl: HTMLElement, // 셀 엘리먼트
  visible: Boolean
})

const emit = defineEmits(['close'])

const hovering = ref(false)
const popupStyle = ref({ top: '0px', left: '0px' })

watch(() => props.visible, (v) => {
  if (v && props.targetEl) {
    const rect = props.targetEl.getBoundingClientRect()
    popupStyle.value = {
      top: `${rect.top + rect.height + 6 + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`
    }
  }
})


function hideWithDelay() {
  hovering.value = false
  setTimeout(() => {
    if (!hovering.value) emit('close')
  }, 250)
}

function getTypeLabel(type) {
  const map = {
    regular: '정규 수업',
    special: '특강',
    makeup: '보강',
    cancel: '휴강',
    event: '행사',
    holiday: '공휴일'
  }
  return map[type] || '수업'
}
</script>

<style scoped>
.detail-popup {
  position: absolute;
  z-index: 9999;
  width: 240px;
  background: white;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px;
  font-size: 0.8rem;
  line-height: 1.4;
  animation: fadeIn 0.15s ease-out;
}

.detail-item + .detail-item {
  margin-top: 8px;
}

.type-tag {
  font-size: 0.7rem;
  color: #666;
  font-weight: bold;
}

.title {
  font-weight: bold;
  color: #111;
}

hr {
  margin: 6px 0;
  border: none;
  border-top: 1px solid #eee;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
