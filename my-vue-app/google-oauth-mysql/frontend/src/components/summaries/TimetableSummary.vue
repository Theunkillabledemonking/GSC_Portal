<template>
  <section class="timetable-summary">
    <ul>
      <li
          v-for="(item, idx) in limitedTimetables"
          :key="idx"
          class="timetable-item"
      >
        <strong>{{ item.subject_name }}</strong> <small>({{ item.day }}요일)</small><br />
        {{ item.start_period }}교시 ~ {{ item.end_period }}교시 / {{ item.room }}
      </li>
    </ul>
    <button @click="goToTimetablePage">더보기 +</button>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTimetableWithEvents } from '@/services/timetableService.js'
import { useAuthStore } from '@/store/authStore.js'

const router = useRouter()
const authStore = useAuthStore()
const timetables = ref([])

onMounted(async () => {
  const start_date = '2025-03-01'
  const end_date = '2025-07-31'

  const year = authStore.grade ?? 1
  const level = authStore.level ?? 1

  const response = await fetchTimetableWithEvents({ year, level, start_date, end_date })
  timetables.value = response.timetables.slice(0, 5)
})

const limitedTimetables = computed(() => timetables.value)

function goToTimetablePage() {
  router.push('/timetable')
}
</script>

<style scoped>
.timetable-summary {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}
.timetable-item {
  background: #e8f5e9;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 5px;
}
</style>
