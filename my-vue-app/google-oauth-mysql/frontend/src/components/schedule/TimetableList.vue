<template>
  <BaseScheduleList
      :items="sortedTimetables"
      :columns="columns"
      :canEdit="canEdit"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { fetchTimetables, fetchSpecialLectures } from '@/services/timetableService.js'
import { normalizeLevel } from '@/utils/level'            // ⬅︎ 레벨 정규화용
import BaseScheduleList from './BaseScheduleList.vue'

const props = defineProps({
  year: Number,        // 학년 (예: 1, 2, 3)
  semester: {          // 학기 정보가 필요 (예: 'spring')
    type: String,
    default: 'spring'
  },
  level: String,
  type: {
    type: String,
    default: 'regular' // 또는 'special'
  },
  startDate: String,   // 특강 조회용 직접 지정 날짜
  endDate: String,     // 특강 조회용 직접 지정 날짜
  canEdit: {
    type: Boolean,
    default: true
  }
})

const timetables = ref([])

// 요일 순서 정의
const dayOrder = {
  '월': 1,
  '화': 2,
  '수': 3,
  '목': 4,
  '금': 5
}

// 정렬된 시간표
const sortedTimetables = computed(() => {
  return [...timetables.value].sort((a, b) => {
    // 먼저 요일로 정렬
    const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0)
    if (dayDiff !== 0) return dayDiff
    
    // 같은 요일이면 시작 교시로 정렬
    return (Number(a.start_period) || 0) - (Number(b.start_period) || 0)
  })
})

const columns = [
  { 
    label: '학년',
    field: 'year',
    format: val => `${val}학년`
  },
  { 
    label: '유형', 
    field: 'is_special_lecture', 
    format: val => val ? '특강' : '정규' 
  },
  { 
    label: '요일', 
    field: 'day',
    format: day => `${day}요일`
  },
  {
    label: '교시',
    field: 'start_period',
    format: (_, row) => {
      const start = Number(row.start_period)
      const end = Number(row.end_period)
      const startTime = getPeriodTime(start)
      const endTime = getPeriodTime(end)
      return `${start}~${end}교시 (${startTime}~${endTime})`
    }
  },
  { 
    label: '레벨/분반', 
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
    label: '과목', 
    field: 'subject_name',
    format: name => name || '-'
  },
  { 
    label: '강의실', 
    field: 'room',
    format: val => val || '-'
  },
  { 
    label: '교수', 
    field: 'professor_name',
    format: val => val ? `${val} 교수` : '-'
  }
]

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

/**
 * 📦 정규 또는 특강 시간표 로딩
 */
async function loadTimetables() {
  try {
    if (props.type === 'special') {

      if (!props.semester || !props.startDate || !props.endDate) return

      // 특강 조회 시 학년, 학기, 레벨, 날짜 범위를 모두 전달
      timetables.value = await fetchSpecialLectures({
        year: new Date().getFullYear(),
        semester: props.semester,
        level: normalizeLevel(props.level),
        group_level: props.group_level || '',
        start_date: props.startDate,
        end_date: props.endDate
    })
    } else {
      if (!props.year || !props.semester ) return
      timetables.value = await fetchTimetables({
        year: props.year,
        semester: props.semester
      })
    }
  } catch (err) {
    console.error('❌ 시간표 불러오기 실패', err)
    timetables.value = []
  }
}

// props 변경 감지하여 자동 reload
watch(
    () => [props.year, props.semester, props.level, props.startDate, props.endDate],
    loadTimetables,
    { immediate: true }
)
</script>
