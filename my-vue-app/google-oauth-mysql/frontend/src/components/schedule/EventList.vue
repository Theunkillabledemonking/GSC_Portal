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
  
  // 날짜와 시간으로 정렬
  return valid.sort((a, b) => {
    // 먼저 날짜로 정렬
    const dateA = dayjs(a.event_date || a.date)
    const dateB = dayjs(b.event_date || b.date)
    const dateDiff = dateA.diff(dateB)
    if (dateDiff !== 0) return dateDiff
    
    // 같은 날짜면 시작 시간/교시로 정렬
    const timeA = a.start_time || (a.start_period ? `${a.start_period}:00` : '00:00')
    const timeB = b.start_time || (b.start_period ? `${b.start_period}:00` : '00:00')
    return timeA.localeCompare(timeB)
  })
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
    const startTime = getPeriodTime(e.start_period)
    const endTime = getPeriodTime(e.end_period)
    return `${e.start_period}~${e.end_period}교시 (${startTime}~${endTime})`
  }
  return '-'
}

// 교시별 시간 매핑
function getPeriodTime(period) {
  const timeMap = {
    1: '09:00',
    2: '10:00',
    3: '11:00',
    4: '12:00',
    5: '13:00',
    6: '14:00',
    7: '15:00',
    8: '16:00',
    9: '17:00'
  }
  return timeMap[period] || `${period}:00`
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
    label: '학년',
    field: 'year',
    format: val => val ? `${val}학년` : '-'
  },
  {
    label: '📘 레벨/분반',
    field: 'level',
    format: (_, row) => {
      const parts = []
      if (row.level) parts.push(row.level)
      if (row.group_levels?.length) {
        const levels = row.group_levels.filter(l => l)
        const hasAllSections = ['A', 'B', 'C'].every(section => levels.includes(section))
        if (levels.length === 0 || levels.includes('ALL') || hasAllSections) {
          parts.push('(전체)')
        } else {
          parts.push(`(${levels.join('/')}분반)`)
        }
      }
      return parts.length ? parts.join(' ') : '-'
    }
  },
  {
    label: '📚 과목',
    field: 'subject_name',
    format: (name, row) => {
      if (!name) return '-'
      if (row.original_class) {
        return `${name} (원래 수업: ${row.original_class})`
      }
      return name
    }
  },
  {
    label: '⏱ 시간',
    field: 'start_time',
    format: (_, row) => formatPeriodOrTime(row)
  },
  {
    label: '🏫 강의실',
    field: 'room',
    format: val => val || '-'
  },
  {
    label: '👨‍🏫 교수',
    field: 'professor_name',
    format: val => val ? `${val} 교수` : '-'
  },
  {
    label: '📝 설명',
    field: 'description',
    format: val => val || '-'
  }
]
</script>
