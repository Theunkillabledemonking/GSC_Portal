<template>
  <BaseScheduleList
      :items="filteredEvents"
      :columns="columns"
      :canEdit="canEdit"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
  />
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs'
import BaseScheduleList from './BaseScheduleList.vue'

// ✅ Props
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

// ✅ 이벤트 유형 한글 라벨
const eventTypeLabel = {
  cancel: '휴강',
  makeup: '보강',
  special: '특강',
  event: '행사'
}

// 이벤트 타입만 추출
const filteredEvents = computed(() => {
  const valid = props.events.filter(e =>
      ['cancel', 'makeup', 'event'].includes(e.event_type)
  )
  console.log('✅ 필터링된 이벤트:', valid)
  console.log('✅ 필터링된 이벤트:', filteredEvents.value)
  return valid
})

const formatDateWithDay = (dateStr) => {
  if (!dateStr) return '-'
  const d = dayjs(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.format('YYYY-MM-DD')} (${days[d.day()]})`
}

// ✅ 시간 또는 교시 포맷
function formatPeriodOrTime(e) {
  if (e.start_time && e.end_time) {
    return `${e.start_time} ~ ${e.end_time}`
  } else if (e.start_period && e.end_period) {
    return `${e.start_period}교시 ~ ${e.end_period}교시`
  }
  return '-'
}

// ✅ 컬럼 정의
const columns = [
  {
    label: '📅 날짜',
    field: 'date',
    format: (_, row) => {
      return formatDateWithDay(row.event_date || row.date || null)
    }
  },
  {
    label: '🎯 유형',
    field: 'event_type',
    format: v => eventTypeLabel[v] || '기타'
  },
  {
    label: '📘 레벨',
    field: 'level'
  },
  {
    label: '📚 과목',
    field: 'subject_name'
  },
  {
    label: '⏱ 시간',
    field: 'start_time',
    format: (_, row) => formatPeriodOrTime(row)
  },
  {
    label: '📝 설명',
    field: 'description'
  }
]
</script>
