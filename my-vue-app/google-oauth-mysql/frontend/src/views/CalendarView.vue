<template>
  <div class="calendar-view">
    <full-calendar
      :options="calendarOptions"
      @dateClick="handleDateClick"
      @eventClick="handleEventClick"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from '@fullcalendar/google-calendar'



const calendarOptions = ref({
  plugins: [dayGridPlugin, googleCalendarPlugin],
  initialView: 'DayGridMonth',

  // 구글 캘린더 API 키 설정
  googleCalendarApiKey: 'AIzaSyD47F4hbvXQRm3Fones0nfAgo4KGDxmNkQ',

  // 구글 캘린더 ID 설정
  events: {
    googleCalendarId: '06cacd945309081ecac9f65bbe42bb2d7079d61607dbd82edf6ab9c43d8d56bd@group.calendar.google.com'
  },

  eventClick: function(info) {
    // 구글 캘린더 이벤트를 클릭했을 때 동작
    alert('이벤트 클릭: ' + info.event.title)
  },

  dateClick: function(info) {
    // 달력의 날짜를 클릭했을 때 동작
    alert('날짜 클릭: ' + info.dateStr)
  }
});

onMounted(async () => {
  // 예: 백엔드 /api/calendar/events 호출하여 일정 가져오기
  const res = await fetch('http://localhost:5000/api/calendar/events');
  const googleEvents = await res.json();

  // FullCalendar가 원하는 형태로 변환
  // e.g { title, start, end }
  const fcEvnets = googleEvents.map(e => ({
    title: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    id: e.id,
  }));

  calendarOptions.value.events = fcEvnets;
});

// function handleDateClick(info) {
//
// }

function handleDateClick(info) {
  console.log('Event clicked', info.event.id);
  // 모달 열기 라우터 이동
}


</script>

<style scoped>
.calendar-view {
  max-width: 800px;
  margin: 20px auto;
}
</style>