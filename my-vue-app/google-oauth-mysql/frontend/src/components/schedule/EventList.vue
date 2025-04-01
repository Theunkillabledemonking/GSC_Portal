<template>
  <BaseScheduleList
      :items="events"
      :columns="columns"
      :canEdit="canEdit"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
  />
</template>

<script setup>
// 📦 컴포넌트 import
import BaseScheduleList from './BaseScheduleList.vue'

// ✅ Props 정의
const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  canEdit: {
    type: Boolean,
    default: true
  }
})

// 🏷️ 이벤트 유형 ➜ 한글 라벨
const eventTypeText = (type) => ({
  cancel: '휴강',
  makeup: '보강',
  special: '특강',
  event: '행사'
}[type] || '기타')

// ⏰ 시간 또는 교시 포맷
const formatPeriodOrTime = (e) => {
  if (e.start_time && e.end_time) {
    return `${e.start_time} ~ ${e.end_time}`
  } else if (e.start_period && e.end_period) {
    return `${e.start_period}교시 ~ ${e.end_period}교시`
  }
  return '-'
}

// 📋 테이블 컬럼 구성
const columns = [
  { label: '날짜', field: 'event_date' },
  { label: '유형', field: 'event_type', format: (v) => eventTypeText(v) },
  { label: '레벨', field: 'level' },
  { label: '과목', field: 'subject_name' },
  { label: '시간', field: 'start_time', format: (_, row) => formatPeriodOrTime(row) },
  { label: '설명', field: 'description' }
]
</script>
