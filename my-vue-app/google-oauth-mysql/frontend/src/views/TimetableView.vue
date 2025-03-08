<template>
  <div class="timetable-view">
    <h2>시간표 조회</h2>

    <!-- 학년 선택 (학생은 자신의 학년 고정, 교수/관리자는 선택 가능) -->
    <div class="year-select" v-if="isAdminOrProfessor">
      <button
        v-for="year in [1, 2, 3]"
        :key="year"
        :class="{ active: selectedYear === year }"
        @click="selectYear(year)"
      >
        {{ year }} 학년
      </button>
    </div>

    <h3>{{ selectedYear }}학년 시간표 및 이벤트</h3>

    <!-- 시간표 및 이벤트 달력 컴포넌트 (실제 달력은 별도 구성) -->
    <TimetableCalendar
      :year="selectedYear"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/store/authStore.js";
import TimetableCalendar from "@/components/TimetableCalendar.vue";

const authStore = useAuthStore();

// 학생은 본인 학년으로 고정, 관리자/교수는 선택 가능
const selectedYear = ref(authStore.role === 3 ? authStore.grade : 1);

// 관리자/교수 여부 확인
const isAdminOrProfessor = computed(() => authStore.role <= 2);

// 학년 선택 시 과목 목록 조회
const selectYear = async (year) => {
  selectedYear.value = year;
}

// 초기 데이터 로드 (학생일 경우 본인 학년 과목 바로 로드)
// onMounted(() => {
// })
</script>

<style scoped>
.timetable-view {
  padding: 20px;
}

.year-select {
  margin-bottom: 15px;
}

.year-select button {
  margin-right: 10px;
  padding: 8px 15px;
  cursor: pointer;
}

.year-select button.active {
  background-color: #4caf50;
  color: white;
}
</style>