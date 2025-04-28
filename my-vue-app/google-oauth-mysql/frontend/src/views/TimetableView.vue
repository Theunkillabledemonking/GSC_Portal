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
    <WeeklyTimetable 
      @open-modal="openModal" 
      @edit-event="handleEditEvent" 
    />

    <!-- 통합 일정 폼 모달 -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-content">
          <UnifiedScheduleForm
            :event-type="modalType"
            :initial-data="modalData"
            :timetable-data="selectedTimetable"
            :is-edit="isEditMode"
            @close="closeModal"
            @submit="handleModalSubmit"
            @cancel="closeModal"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useTimetableStore } from '@/store/modules/timetable'
import { GRADES } from '@/constants/timetable'
import WeeklyTimetable from '@/components/schedule/core/WeeklyTimetable.vue'
import UnifiedScheduleForm from '@/components/schedule/forms/UnifiedScheduleForm.vue'

const timetableStore = useTimetableStore()
const { currentWeek } = storeToRefs(timetableStore)

const selectedGrade = ref(1)
const showModal = ref(false)
const modalType = ref('regular')
const modalData = ref({})
const selectedTimetable = ref(null)
const isEditMode = ref(false)

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

// 모달 관련 함수
function openModal(type, data = {}, timetable = null, edit = false) {
  modalType.value = type
  modalData.value = data
  selectedTimetable.value = timetable
  isEditMode.value = edit
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalData.value = {}
  selectedTimetable.value = null
}

// 이벤트 수정 핸들러
function handleEditEvent(event) {
  console.log('이벤트 수정:', event);
  
  // 이벤트 타입 결정
  const eventType = event.type || event.event_type || 
    (event.is_special_lecture === 1 ? 'special' : 
     event.is_foreigner_target === 1 ? 'topik' : 'regular');
  
  // 모달 데이터 준비
  const data = {
    id: event.id,
    type: eventType,
    timetable_id: event.timetable_id || event.id,
    subject_id: event.subject_id,
    subject_name: event.subject_name || event.title,
    day: event.day,
    start_period: event.start_period,
    end_period: event.end_period,
    professor_name: event.professor_name || event.inherited_professor_name,
    room: event.room || event.inherited_room,
    grade: event.grade || event.year,
    level: event.level,
    is_special_lecture: event.is_special_lecture,
    is_foreigner_target: event.is_foreigner_target,
    semester: event.semester || timetableStore.getCurrentSemester(),
    date: event.date || event.event_date
  };
  
  // 모달 열기
  openModal(eventType, data, event, true);
}

// 모달 핸들러
async function handleModalSubmit(data) {
  try {
    console.log('모달 제출 데이터:', data);
    
    // 처리 유형에 따라 분기
    if (data.type === 'cancel') {
      await timetableStore.registerCancellation(data);
    } else if (data.type === 'makeup') {
      await timetableStore.registerMakeup(data);
    } else {
      // 정규/특강/TOPIK 등록
      await timetableStore.registerScheduleItem(data);
    }
    
    // 데이터 변경 후 시간표 갱신
    await loadTimetableData();
    closeModal();
  } catch (error) {
    console.error('일정 등록 실패:', error);
    alert(error?.message || '등록 중 오류가 발생했습니다.');
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

/* Modal styles */
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-300;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
