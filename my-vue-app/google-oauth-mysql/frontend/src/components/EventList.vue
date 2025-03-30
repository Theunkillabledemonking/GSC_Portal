<!-- components/EventList.vue -->
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
import { ref, watch } from 'vue'
import { fetchEvents } from '@/services/eventService'
import BaseScheduleList from './BaseScheduleList.vue'

// 🧠 유틸 포맷터 (필요 시 utils/format.js로 분리해도 OK)
const eventTypeText = type => ({
  cancel: '휴강',
  makeup: '보강',
  special: '특강',
  event: '행사'
}[type] || type)

const formatPeriodOrTime = (e) => {
  if (e.start_time && e.end_time) {
    return `${e.start_time} ~ ${e.end_time}`
  } else if (e.start_period && e.end_period) {
    return `${e.start_period}교시 ~ ${e.end_period}교시`
  }
  return '-'
}

const props = defineProps({
  year: Number,
  level: String,
  canEdit: {
    type: Boolean,
    default: true
  }
})

const events = ref([])

const columns = [
  { label: '날짜', field: 'event_date' },
  { label: '유형', field: 'event_type', format: (v) => eventTypeText(v) },
  { label: '레벨', field: 'level' },
  { label: '과목', field: 'subject_name' },
  { label: '시간', field: 'start_time', format: (_, row) => formatPeriodOrTime(row) },
  { label: '설명', field: 'description' }
]

function getDateRange(year) {
  return {
    start: `${year}-03-01`,
    end: `${year + 1}-02-28`
  }
}

async function loadEvents() {
  const { start, end } = getDateRange(props.year)
  try {
    const res = await fetchEvents({ start_date: start, end_date: end, level: props.level })
    events.value = res?.events ?? []
  } catch (err) {
    console.error('❌ 이벤트 로딩 실패', err)
    events.value = []
  }
}

watch(() => [props.year, props.level], loadEvents, { immediate: true })
</script>
