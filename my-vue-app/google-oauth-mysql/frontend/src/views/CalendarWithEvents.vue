<!--<script setup>-->
<!--import { ref } from "vue";-->
<!--import CalendarWithEvents from "@/components/specific/CalendarWithEvents.vue";-->
<!--import CalendarView from "@/components/specific/CalendarView.vue";-->

<!--// 선택된 날짜와 해당 날짜의 이벤트 목록-->
<!--const selectedDate = ref('');-->
<!--const selectedEvents = ref([]);-->

<!--// 달력에서 날짜 클릭 시 호출되는 함수-->
<!--const handleDateSelected = (date, events) => {-->
<!--  selectedDate.value = date;-->
<!--  selectedEvents.value = events;-->
<!--};-->
<!--</script>-->

<!--<template>-->
<!-- <div class="calendar-container">-->
<!--   &lt;!&ndash; 왼쪽: 날짜별 일정 목록 &ndash;&gt;-->
<!--   <div class="events-panel">-->
<!--     <CalendarWithEvents-->
<!--         :selectedDate="selectedDate"-->
<!--         :events="selectedEvents"-->
<!--     />-->
<!--   </div>-->

<!--   &lt;!&ndash; 오른쪽 달력 &ndash;&gt;-->
<!--   <div class="calendar-panel">-->
<!--     <CalendarView @dateSelected="handleDateSelected" />-->
<!--   </div>-->
<!-- </div>-->
<!--</template>-->

<!--<style scoped>-->
<!--.calendar-container {-->
<!--  display: flex;-->
<!--  gap: 10px;-->
<!--}-->

<!--.events-panel {-->
<!--  width: 40%;-->
<!--  border: 1px solid #ddd;-->
<!--  padding: 10px;-->
<!--}-->

<!--.calendar-panel {-->
<!--  width: 60%;-->
<!--}-->
<!--</style>-->