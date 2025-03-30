<!-- components/TimetableList.vue -->
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
import { fetchTimetables } from '@/services/timetableService'
import BaseScheduleList from './BaseScheduleList.vue'

const props = defineProps({
  year: Number,
  level: String,
  canEdit: {
    type: Boolean,
    default: true
  }
})

const timetables = ref([])

const columns = [
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

async function loadTimetables() {
  if (!props.year || !props.level) return
  try {
    const res = await fetchTimetables(props.year, props.level)
    timetables.value = res?.timetables ?? []
  } catch (err) {
    console.error('❌ 시간표 불러오기 실패', err)
    timetables.value = []
  }
}

watch(() => [props.year, props.level], loadTimetables, { immediate: true })
</script>
