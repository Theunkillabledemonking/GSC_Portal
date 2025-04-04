<template>
  <BaseScheduleList
      :items="timetables"
      :columns="columns"
      :canEdit="canEdit"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchTimetables, fetchSpecialLectures } from '@/services/timetableService.js'
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

const columns = [
  { label: '유형', field: 'is_special_lecture', format: val => val ? '특강' : '정규' },
  { label: '요일', field: 'day' },
  {
    label: '교시',
    field: 'start_period',
    format: (_, row) => `${row.start_period}교시 ~ ${row.end_period}교시`
  },
  { label: '과목', field: 'subject_name' },
  { label: '강의실', field: 'room' },
  { label: '교수', field: 'professor_name' }
]

/**
 * 📦 정규 또는 특강 시간표 로딩
 */
async function loadTimetables() {
  try {
    if (props.type === 'special') {
      if (!props.startDate || !props.endDate) {
        console.warn('⛔ 특강 조회: 필수 값 누락', props)
        return
      }
      // 특강 조회 시 학년, 학기, 레벨, 날짜 범위를 모두 전달
      timetables.value = await fetchSpecialLectures(
          props.year,
          props.semester,
          props.level,
          props.startDate,
          props.endDate
      )
    } else {
      if (!props.year) return
      timetables.value = await fetchTimetables(props.year, props.semester, props.level)
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
