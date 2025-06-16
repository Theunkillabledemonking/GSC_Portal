<template>
  <section class="calendar-summary">
    <ul>
      <li
          v-for="(event, idx) in recentEvents"
          :key="idx"
          class="event-item"
          @click="goToDetail(event)"
      >
        <strong>{{ event.summary || '제목 없음' }}</strong><br />
        <small>{{ formatDate(event.start?.dateTime || event.start?.date) }}</small>
      </li>
    </ul>
    <button @click="goToCalendarPage">더보기 +</button>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { listEvents } from '@/services/calendarApi.js'

const events = ref([])
const router = useRouter()

onMounted(async () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const all = await listEvents(start, end)

  // 최신 날짜 기준 정렬 (옵션)
  all.sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date))

  events.value = all.slice(0, 5)
})

const recentEvents = computed(() => events.value)

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

function goToDetail(event) {
  // 디테일 페이지가 있다면 이동하도록 구성 가능
  alert(`일정 상세: ${event.summary || '제목 없음'}`)
}

function goToCalendarPage() {
  router.push('/calendar')
}
</script>

<style scoped>
.calendar-summary {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}
.event-item {
  background: #e3f2fd;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 5px;
  cursor: pointer;
}
.event-item:hover {
  background-color: #bbdefb;
}
</style>
