<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />

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
import { fetchTimetableWithEvents } from "@/services/timetableApi.js";
import { useAuthStore } from "@/store/authStore.js";
import TimetableFormModal from "@/components/TimetableFormModal.vue";

// 학년 ( year ) 은 상위 컴포넌트에서 전달
const props = defineProps({
  year: Number
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
 * 날짜 클릭 시
 */
function handleDateClick(info) {
  isEditMode.value = false; // 등록모드
  selectedEvent.value = null;
  isModalOpen.value = true;
}


/**
 * 이벤트 클릭시
 */
function handleEventClick(info) {
  // extendedProps에 timetable_id, subject_id, day 등 필요한 필드를
  // pinia 스토어에서 넣어둬야 모달에서 기존 데이터 확인 가능
  const propsData = info.event.extendedProps;
  selectedEvent.value = {
    id: propsData.id,
    timetable_id: propsData.id,
    day: propsData.day ?? '',
    subject_id: propsData.subject ?? '',
    room: propsData.room ?? '',
    start_period: propsData.start_period ?? null,
    end_period: propsData.end_period ?? null,
    description: propsData.description ?? '',
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
  // 임의 범위 설정
  const start_date = "2025-03-01";
  const end_date = "2025-07-31";

  // year/level 추출
  const yearToUse = props.year ?? authStore.grade ?? 1;
  const levelToUse = null;

  try {
    console.log('요청 데이터', {year: yearToUse, level: levelToUse, start_date , end_date});

    // 1) API 호출 -> 원본 DB 데이터
    const response = await fetchTimetableWithEvents({
      year: yearToUse,
      level: levelToUse,
      start_date,
      end_date,
    });
    console.log('응답 데이터', response);

    // 2) 스토어에 넘겨 이벤트 객체로 변환
    timetableStore.setTimetableAndEvents(response.timetables, response.events);

    // 3) FullCalendar에 반영
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