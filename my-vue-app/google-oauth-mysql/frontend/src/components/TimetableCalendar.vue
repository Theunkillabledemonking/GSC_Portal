<template>
  <div class="calendar-container">
    <FullCalendar
        :options="calendarOptions"
        @dateClick="handleDateClick"
        @eventClick="handleEventClick"
    />

    <TimetableFormModal
      :isOpen="isModalOpen"
      :initialData="selectedEvent"
      :isEditMode="isEditMode"
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
import { fetchTimetableWithEvents } from "@/services/timetableService.js";
import { useAuthStore } from "@/store/authStore.js";
import TimetableFormModal from "@/components/TimetableFormModal.vue";
import { getSemesterRange } from "@/utils/semester";

// 학년 ( year ) 은 상위 컴포넌트에서 전달
const props = defineProps({
  year: Number,
  semester: {
    type: String,
    default: "spring",
    validator: (value) => ["spring", "summer", "fall", "winter", "full"].includes(value)
  }
})

// Setup & Props
const authStore = useAuthStore();
const timetableStore = useTimetableStore();

// state
const isModalOpen = ref(false);
const isEditMode = ref(false);
const selectedEvent = ref(null); // 수정 모드 데이터 저장

// FullCalendar 옵선 설정
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  // 시간 범위
  slotMinTime: "09:00:00",
  slotMaxTime: "20:00:00",
  events: timetableStore.calendarEvents, // pinia에서 가져온 이벤트 표시

  // 날짜 클릭 이벤트 헨들러
  dateClick: handleDateClick,            // 날짜 클릭 시 이벤트 등록 모달 띄우기
  eventClick: handleEventClick           // 이벤트 클릭 시 수정/삭제 모달 뛰우기
})

/**
 * 이벤트 클릭시
 */
function handleEventClick(info) {
  const clickedDate = new Date(info.dateStr);
  const clickedDay = ['일', '월', '화', '수', '목', '금', '토'][clickedDate.getDay()];
  // 선택한 날짜에 해당하는 요일의 정규 과목 찾기
  const existingTimetable = timetableStore.timetables.find(t => t.day === clickedDay);

  if (!existingTimetable) {
    alert("선택한 날짜에 정규 수업이 없습니다.");
    return;
  }
  // const propsData = info.event.extendedProps;
  // 모달을 등록 모드로 열면서 해당 과목 자동 선택
  selectedEvent.value = {
    timetable_id: existingTimetable.id,
    subject_id: existingTimetable.subject_id,
    day: existingTimetable.day,
    start_period: existingTimetable.start_period,
    end_period: existingTimetable.end_period,
    room: existingTimetable.room,
    event_type: "cancel", // 기본값: 휴강
    event_date: info.dateStr, // 선택한 날짜
  };

  isEditMode.value = false;
  isModalOpen.value = true;
}

/**
 * 날짜 클릭 시
 */
function handleDateClick(info) {
  const propsData = info.event.extendedProps;

  selectedEvent.value = {
    id: propsData.id,
    timetable_id: propsData.timetable_id,
    subject_id: propsData.subject_id,
    day: propsData.day,
    start_period: propsData.start_period,
    end_period: propsData.end_period,
    room: propsData.room,
    description: propsData.description,
    event_date: propsData.event_date,
    event_type: propsData.event_type,
  };

  isEditMode.value = true;
  isModalOpen.value = true;
}

// 모달 닫기
function closeModal() {
  isModalOpen.value = false;
}

/**
 * 시간표 및 이벤트 데이터 불러오기
 */
async function loadTimetableData() {
  const yearToUse = props.year ?? authStore.grade ?? 1;
  const levelToUse = authStore.level ?? null;

  const { start_date: start, end_date: end } = getSemesterRange(yearToUse, props.semester);

  try {
    const response = await fetchTimetableWithEvents({
      year: yearToUse,
      level: levelToUse,
      start_date: start,
      end_date: end,
    });

    timetableStore.setTimetableAndEvents(response.timetables, response.events);
    calendarOptions.value.events = timetableStore.calendarEvents;
  } catch (error) {
    console.error("시간표 및 이벤트 데이터 불러오기 실패", error);
  }
}

// 마운트 시 & year 바뀔 때마다 재호출
onMounted(() => {
  loadTimetableData();
});
watch(() => props.year, async() => {
  await loadTimetableData();
}, { immediate: true });

</script>

<style scoped>
.calendar-container {
  margin-top: 15px;
}
</style>