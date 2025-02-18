<template>
  <div>
    <h1>시간표</h1>
    <table>
      <tr v-for="(schedule, index) in schedules" :key="index">
        <td>{{ schedule.day }}</td>
        <td>{{ schedule.subject }}</td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref } from "vue";

const schedules = ref([
  { day: "월요일", subject: "일본어 회화"},
  { day: "화요일", subject: "프로그래밍"},
  { day: "수요일", subject: "인공지능 수학"},
  { day: "목요일", subject: "캡스톤디자인"},
  { day: "금요일", subject: "일본어 작문"},
]);
</script>
