<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />

    <TimetableFormModal
      :isOpen="isModalOpen"
      :initialData="selectedEvent"
      :selectedDate="clickedDate"
      :year="year"
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
import timeGridPlugin from "@fullcalendar/timegrid";
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
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  slotMinTime: "09:00:00",
  slotMaxTime: "20:00:00",
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
  const start_date = `2025-03-01`;
  const end_date = `2025-07-31`;

  const yearToUse = props.year ?? authStore.grade ?? 1;
  const levelToUse = authStore.level ?? "N3";

  try {
    console.log("📢 요청 데이터:", { year: yearToUse, level: levelToUse, start_date, end_date });

    const response = await fetchTimetableWithEvents({
      year: yearToUse,
      level: levelToUse,
      start_date,
      end_date,
    });

    console.log("📢 응답 데이터:", response);

    // 응답 데이터가 없는 경우 기본값 설정
    const timetables = response.timetables ?? [];
    const events = response.events ?? [];

    console.log("📢 불러온 시간표:", timetables);
    console.log("📢 불러온 이벤트:", events);

    // 빈 배열이라도 `forEach()` 실행 가능
    const formattedTimetables = timetables.map((t) => ({
      title: `[${t.subject_name}] ${t.professor_name}`,
      start: getNextDayDate(t.day, t.start_period),
      end: getNextDayDate(t.day, t.end_period),
      backgroundColor: '#90caf9'
    }));

    const formattedEvents = events.map((e) => ({
      title: `${getEventTypeName(e.event_type)}: ${e.subject_name}`,
      start: e.event_date,
      backgroundColor: getEventColor(e.event_type),
    }));

    timetableStore.setTimetableAndEvents(formattedTimetables, formattedEvents);
    calendarOptions.value.events = timetableStore.calendarEvents;

  } catch (error) {
    console.error("❌ 시간표 및 이벤트 데이터 불러오기 실패:", error);
  }
}

// 🔹 교시별 시간표 매핑
const periodTimeMap = {
  1: { start: "09:00", end: "09:50" },
  2: { start: "10:00", end: "10:50" },
  3: { start: "11:00", end: "11:50" },
  4: { start: "12:00", end: "12:50" },
  5: { start: "13:00", end: "13:50" },
  6: { start: "14:00", end: "14:50" },
  7: { start: "15:00", end: "15:50" },
  8: { start: "16:00", end: "16:50" },
  9: { start: "17:00", end: "17:50" },
  10: { start: "18:00", end: "18:50" }
};

function getNextDayDate(day, period) {
  const dayMap = { "월": 1, "화": 2, "수": 3, "목": 4, "금": 5};
  const baseDate = new Date("2025-03-03");
  const targetDateStart = new Date(baseDate);
  const targetDateEnd = new Date(baseDate);

  // 요일 반영
  targetDateStart.setDate(baseDate.getDate() - dayMap[day] - 1);
  targetDateEnd.setDate(baseDate.getDate() - dayMap[day] - 1);

  // 시작 시간 설정
  if (start_period in periodTimeMap){
    const [startHour, startMinute] = periodTimeMap[start_period].start.split(":");
    targetDateStart.setHours(startHour, startMinute, 0);
  }

  // 종료 시간 설정
  if (end_period in periodTimeMap) {
    const [endHour, endMinute] = periodTimeMap[end_period].end.split(":");
    targetDateEnd.setHours(endHour, endMinute, 0);
  }

  return { start: targetDateStart.toISOString(), end: targetDateEnd.toISOString() };
}

/**
 * 날짜 클릭 시
 */
function handleDateClick(info) {
  clickedDate.value = info.dateStr;
  selectedEvent.value = null;
  isModalOpen.value = true;
}

/**
 * 이벤트 클릭시
 */
function handleEventClick(info) {
  selectedEvent.value = { ...info.event.extendedProps };
  isModalOpen.value = true;
}

// 모달 닫기
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