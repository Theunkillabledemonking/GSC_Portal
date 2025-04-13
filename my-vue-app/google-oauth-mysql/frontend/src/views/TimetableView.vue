<template>
  <div class="timetable-view">
    <h2 class="text-2xl font-bold mb-6">📅 시간표</h2>

    <!-- 필터 영역 -->
    <div class="filters mb-6">
      <!-- 학년 선택 -->
      <div class="filter-group">
        <label>학년</label>
        <div class="btn-group">
          <button
            v-for="grade in GRADES"
            :key="grade"
            :class="['grade-btn', { active: selectedGrade === grade }]"
            @click="updateGrade(grade)"
          >
            {{ grade }}학년
          </button>
        </div>
      </div>

      <!-- 주차 이동 -->
      <div class="week-navigation">
        <button class="nav-btn" @click="movePrevWeek">
          <span class="icon">←</span> 이전 주
        </button>
        <span class="current-week">
          {{ formatDateRange(currentWeek) }}
        </span>
        <button class="nav-btn" @click="moveNextWeek">
          다음 주 <span class="icon">→</span>
        </button>
      </div>
    </div>

    <!-- 시간표 -->
    <WeeklyTimetable />

    <!-- 모달 -->
    <UnifiedScheduleForm
      v-if="timetableStore.showModal"
      :type="timetableStore.modalType"
      :data="timetableStore.modalData"
      @close="timetableStore.closeModal"
      @submit="handleModalSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useTimetableStore } from '@/store/modules/timetable'
import { GRADES } from '@/constants/timetable'
import WeeklyTimetable from '@/components/schedule/WeeklyTimetable.vue'
import UnifiedScheduleForm from '@/components/schedule/UnifiedScheduleForm.vue'

const timetableStore = useTimetableStore()
const { currentWeek } = storeToRefs(timetableStore)

const selectedGrade = ref(1)

// 시간표 데이터 로드 함수
async function loadTimetableData() {
  try {
    // 현재 학기 계산 (3월~8월: 봄학기, 9월~2월: 가을학기)
    const currentMonth = new Date().getMonth() + 1
    const semester = currentMonth >= 3 && currentMonth <= 8 ? 'spring' : 'fall'
    
    const params = {
      grade: selectedGrade.value,
      week: currentWeek.value.toISOString().split('T')[0],
      semester: semester,
      year: new Date().getFullYear()
    }
    
    console.log('🔄 시간표 데이터 로드 요청:', params)
    await timetableStore.fetchWeeklyEvents(params)
  } catch (error) {
    console.error('❌ 시간표 데이터 로드 실패:', error)
  }
}

// 학년 업데이트
function updateGrade(grade) {
  selectedGrade.value = grade
  timetableStore.setCurrentGrade(grade)
  loadTimetableData()
}

// 날짜 관련 함수
function formatDateRange(date) {
  const start = dayjs(date).startOf('week').add(1, 'day') // 월요일
  const end = dayjs(date).startOf('week').add(5, 'day') // 금요일
  return `${start.format('M/D')} ~ ${end.format('M/D')}`
}

function movePrevWeek() {
  const newDate = dayjs(currentWeek.value).subtract(1, 'week').toDate()
  timetableStore.setCurrentWeek(newDate)
  loadTimetableData()
}

function moveNextWeek() {
  const newDate = dayjs(currentWeek.value).add(1, 'week').toDate()
  timetableStore.setCurrentWeek(newDate)
  loadTimetableData()
}

// 모달 핸들러
async function handleModalSubmit(data) {
  try {
    if (timetableStore.modalType === 'cancel') {
      await timetableStore.registerCancellation(data)
    } else if (timetableStore.modalType === 'makeup') {
      await timetableStore.registerMakeup(data)
    }
    
    // 데이터 변경 후 시간표 갱신
    loadTimetableData()
  } catch (error) {
    console.error('Failed to submit:', error)
  }
}

// 필터나 날짜 변경 시 시간표 갱신
watch([selectedGrade, currentWeek], () => {
  loadTimetableData()
}, { deep: true })

// 컴포넌트 마운트 시 초기 데이터 로드
onMounted(() => {
  loadTimetableData()
})
</script>

<style scoped>
.timetable-view {
  @apply p-6 bg-gray-50 min-h-screen;
}

.filters {
  @apply flex flex-wrap justify-between items-center gap-4;
}

.filter-group {
  @apply flex flex-col gap-2;
}

.filter-group label {
  @apply text-sm font-medium text-gray-600;
}

.btn-group {
  @apply flex gap-1;
}

.grade-btn {
  @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors;
  @apply bg-gray-100 text-gray-600 hover:bg-gray-200;
}

.grade-btn.active {
  @apply bg-idolPurple text-white;
}

.week-navigation {
  @apply flex items-center gap-4;
}

.nav-btn {
  @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors;
  @apply bg-white text-gray-600 hover:bg-gray-100 border border-gray-200;
}

.current-week {
  @apply text-lg font-medium text-gray-800;
}

.icon {
  @apply inline-block;
}
</style>
