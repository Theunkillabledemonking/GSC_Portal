<template>
  <BaseScheduleList
      :items="timetables"
      :columns="columns"
      :canEdit="canEdit"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
  >
    <template #actions="{ item }">
      <button @click="$emit('edit', item)">🛠 수정</button>
      <button @click="$emit('delete', item)">🗑 삭제</button>
    </template>
  </BaseScheduleList>
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchTimetables, fetchSpecialLectures } from '@/services/timetableService.js'
import BaseScheduleList from './BaseScheduleList.vue'

const props = defineProps({
  year: Number,
  level: String,
  type: {
    type: String,
    default: 'regular' // or 'special'
  },
  startDate: String,
  endDate: String,
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
  { label: '교수', field: 'professor_name' },
]

/**
 * 📦 정규 or 특강 시간표 로딩
 */
async function loadTimetables() {
  if (!props.level) return

  try {
    if (props.type === 'special') {
      if (!props.startDate || !props.endDate) return
      timetables.value = await fetchSpecialLectures(
          props.level,
          props.startDate,
          props.endDate
      )
    } else {
      if (!props.year) return
      timetables.value = await fetchTimetables(props.year, props.level)
    }
  } catch (err) {
    console.error('❌ 시간표 불러오기 실패', err)
    timetables.value = []
  }
}

// 감지해서 자동 reload
watch(
    () => [props.year, props.level, props.startDate, props.endDate],
    loadTimetables,
    { immediate: true }
)
</script>
