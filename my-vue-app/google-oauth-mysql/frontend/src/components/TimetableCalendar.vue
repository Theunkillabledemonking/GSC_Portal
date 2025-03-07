<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />

    <TimetableFormModal
      :isOpen="isModalOpen"
      :initialData="selectedEvent"
      :selectedDate="clickedDate"
      @close="closeModal"
      @saved="loadTimetableData"
      @deleted="loadTimetableData"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTimetableStore } from "@/store/timetableStore.js";
import { fetchTimetableWithEvents } from "@/services/timetableApi.js";
import { useAuthStore } from "@/store/authStore.js";
import TimetableFormModal from "@/components/TimetableFormModal.vue";

const authStore = useAuthStore();
// 시간표 및 이벤트 저장하는 Pinia 스토어
const timetableStore = useTimetableStore();

// props: 부모 컴포넌트(TimetableView)에서 전달받는 데이터
const props = defineProps({
  year: Number,
  selectedSubject: [String, Number] // 선택한 과목
})

// FullCalendar 옵선 설정
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  events: timetableStore.calendarEvents, // pinia에서 가져온 이벤트 표시
  dateClick: handleDateClick,            // 날짜 클릭 시 이벤트 등록 모달 띄우기
  eventClick: handleEventClick           // 이벤트 클릭 시 수정/삭제 모달 뛰우기
})

const isModalOpen = ref(false);
const selectedEvent = ref(null); // 수정 모드 데이터 저장
const clickedDate = ref(''); // 신규 등록 시 날짜 지정


/**
 * 시간표 및 이벤트 데이터 불러오기
 */
async function loadTimetableData() {
  const start_date = `${new Date().getFullYear()}-03-01`;
  const end_date = `${new Date().getFullYear()}-07-31`;

  try {
    const { timetables, events } = await fetchTimetableWithEvents({
      year: props.year,
      level: authStore.level, // 현재 로그인한 사용자 레벨
      start_date,
      end_date,
    });

    timetableStore.setTimetableAndEvents(timetables, events);
    calendarOptions.value.events = timetableStore.calendarEvents; // 달력에 반영
  } catch (error) {
    console.log("시간표 및 이벤트 데이터 불러오기 실패:", error);
  }
}

/**
 * 날짜 클릭 시 (현재는 기능 없음)
 */
function handleDateClick(info) {
  openModalForCreate(info.dateStr);
}

/**
 * 이벤트 클릭시 (현재는 기능 없음)
 */
function handleEventClick(info) {
  openModalForEdit(info.event.extendedProps);
}

function openModalForCreate(date) {
  clickedDate.value = date;
  selectedEvent.value = null;
  isModalOpen.value = true;
};

function openModalForEdit(eventData) {
  selectedEvent.value = { ...eventData };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

// 컴포넌트 마운트 시 최초 로드
onMounted(() => {
  loadTimetableData();
});

/**
 * 학년이 바뀔 때마다 시간표 데이터 다시 불러오기
 */
watch(() => props.year, async() => {
  await loadTimetableData();
}, { immediate: true });

</script>

<style scoped>
.calendar-container {
  margin-top: 15px;
}
</style>