<template>
  <div class="timetable-view">
    <h2>시간표 및 이벤트 관리</h2>

    <!-- 학년 및 레벨 선택 -->
    <div class="year-level-select">
      <label>학년:</label>
      <button
          v-for="y in [1, 2, 3]"
          :key="y"
          :class="{ active: year === y }"
          @click="year = y"
          :disabled="!isAdminOrProfessor"
      >
        {{ y }}학년
      </button>

      <label>레벨:</label>
      <select v-model="level">
        <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
      </select>
    </div>

    <!-- FullCalendar -->
    <TimetableCalendar :year="year" :level="level" />

    <!-- ✅ 정규 수업 관리 -->
    <section v-if="isAdminOrProfessor">
      <h3>정규 수업 목록</h3>
      <button @click="openTimetableForm">+ 정규 수업 추가</button>
      <TimetableList
          :year="year"
          :level="level"
          @edit="handleEditTimetable"
          @delete="handleDeleteTimetable"
      />
    </section>

    <!-- ✅ 이벤트 관리 -->
    <section>
      <h3>이벤트 목록</h3>
      <button v-if="isAdminOrProfessor" @click="openEventForm">+ 이벤트 추가</button>
      <EventList
          :year="year"
          :level="level"
          @edit="isAdminOrProfessor ? handleEditEvent : null"
          @delete="isAdminOrProfessor ? handleDeleteEvent : null"
      />
    </section>

    <!-- ✅ 정규 수업 모달 -->
    <TimetableFormModal
        v-if="isTimetableModalOpen"
        :isEditMode="isEditTimetable"
        :initialData="selectedTimetable"
        :year="year"
        :subjects="subjects"
        @close="isTimetableModalOpen = false"
        @saved="refresh"
    />

    <!-- ✅ 이벤트 모달 -->
    <EventFormModal
        v-if="isEventModalOpen"
        :isEditMode="isEditEvent"
        :initialData="selectedEvent"
        :year="year"
        :level="level"
        :subjects="subjects"
        @close="isEventModalOpen = false"
        @saved="refresh"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { useTimetableStore } from '@/store/timetableStore';

import {
  getSubjectsByYear
} from '@/services/subjectService.js';

import {
  deleteTimetable,
  fetchTimetableWithEvents
} from '@/services/timetableService';

import {
  deleteEvent
} from '@/services/eventService';

import { getCurrentSemester, getSemesterRange } from '@/utils/semester'
import TimetableCalendar from '@/components/TimetableCalendar.vue';
import TimetableList from '@/components/TimetableList.vue';
import EventList from '@/components/EventList.vue';
import TimetableFormModal from '@/components/TimetableFormModal.vue';
import EventFormModal from '@/components/EventFormModal.vue';

// 🏫 사용자
const authStore = useAuthStore();
const timetableStore = useTimetableStore();

// 기본 학년/레벨
const year = ref(authStore.grade ?? 1);
const level = ref(authStore.level ?? 'N1');
const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6'];

const isAdminOrProfessor = computed(() => authStore.role <= 2);

// 과목 목록
const subjects = ref([]);

// 정규 수업 모달
const isTimetableModalOpen = ref(false);
const isEditTimetable = ref(false);
const selectedTimetable = ref(null);

// 이벤트 모달
const isEventModalOpen = ref(false);
const isEditEvent = ref(false);
const selectedEvent = ref(null);

// ✅ 과목 조회
async function loadSubjects() {
  try {
    const res = await getSubjectsByYear(year.value);
    subjects.value = res?.subjects ?? [];
    console.log("📦 과목 응답 구조", res);
  } catch (err) {
    console.error("❌ 과목 불러오기 실패", err);
  }
}

// ✅ 정규 수업 핸들러
function openTimetableForm() {
  isEditTimetable.value = false;
  selectedTimetable.value = null;
  isTimetableModalOpen.value = true;
}

function handleEditTimetable(timetable) {
  selectedTimetable.value = timetable;
  isEditTimetable.value = true;
  isTimetableModalOpen.value = true;
}

async function handleDeleteTimetable(timetable) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    await deleteTimetable(timetable.id);
    refresh();
  } catch (err) {
    console.error("❌ 시간표 삭제 실패", err);
  }
}

// ✅ 이벤트 핸들러
function openEventForm() {
  isEditEvent.value = false;
  selectedEvent.value = null;
  isEventModalOpen.value = true;
}

function handleEditEvent(event) {
  selectedEvent.value = event;
  isEditEvent.value = true;
  isEventModalOpen.value = true;
}

async function handleDeleteEvent(event) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    await deleteEvent(event.id);
    refresh();
  } catch (err) {
    console.error("❌ 이벤트 삭제 실패", err);
  }
}

// ✅ 공통 새로고침
async function refresh() {
  await loadSubjects();

  const { semester, year: semesterYear } = getCurrentSemester();
  const { start_date, end_date } = getSemesterRange(semesterYear, semester);
  console.log("📅 semester:", semester, "→", start_date, "~", end_date);

  try {
    const res = await fetchTimetableWithEvents({
      year: year.value,
      level: level.value,
      start_date,
      end_date
    });

    timetableStore.setTimetableAndEvents(res.timetables, res.events, res.holidays || []);
  } catch (err) {
    console.error("❌ 시간표 불러오기 실패", err);
  }
}

onMounted(refresh);
watch(year, refresh);
</script>

<style scoped>
.timetable-view {
  padding: 20px;
}
.year-level-select {
  margin-bottom: 20px;
}
button.active {
  background-color: #4caf50;
  color: white;
}
</style>
