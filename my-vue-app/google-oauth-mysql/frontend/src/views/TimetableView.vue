<template>
  <div class="timetable-view space-y-8">
    <h2 class="text-2xl font-bold">📅 시간표 및 이벤트 관리</h2>

    <!-- 🎓 학년 / 레벨 선택 -->
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="font-semibold">학년:</label>
        <div class="flex gap-1">
          <button
              v-for="y in [1, 2, 3]"
              :key="y"
              :class="[
              'px-3 py-1 rounded border transition',
              year === y ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border-gray-300',
              isAdminOrProfessor ? 'cursor-pointer hover:bg-green-100' : 'opacity-50 cursor-not-allowed'
            ]"
              :disabled="!isAdminOrProfessor"
              @click="year = y"
          >
            {{ y }}학년
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <label class="font-semibold">레벨:</label>
        <select v-model="level" class="px-2 py-1 border rounded bg-white border-gray-300 text-gray-800">
          <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
        </select>
      </div>
    </div>

    <!-- 📅 날짜 선택 -->
    <div class="flex items-center gap-2">
      <label class="font-semibold">기간:</label>
      <button @click="moveWeek(-1)">⬅️ 이전</button>
      <input type="date" v-model="dateRange.start" class="date-input" />
      ~
      <input type="date" v-model="dateRange.end" class="date-input" />
      <button @click="moveWeek(1)">다음 ➡️</button>
    </div>
    <div class="flex items-center gap-2">
      <span class="font-semibold">기간: {{ startDate }} ~ {{ endDate }}</span>
    </div>

    <!-- 🗓 주간 시간표 -->
    <WeeklyTimetable
        :year="year"
        :level="level"
        :start="startDate"
        :end="endDate"
    />

    <!-- 📘 정규 수업 목록 -->
    <section class="space-y-2">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">📘 정규 수업</h3>
        <button
            v-if="isAdminOrProfessor"
            @click="openForm('regular')"
            class="btn-primary"
        >+ 정규 수업 추가</button>
      </div>
      <TimetableList
          :year="year"
          :level="level"
          :canEdit="isAdminOrProfessor"
          @edit="item => openEditForm(item, 'regular')"
          @delete="item => handleDelete(item, 'regular')"
      />
    </section>

    <!-- 🎈 이벤트 목록 -->
    <section class="space-y-2">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">🎈 이벤트</h3>
        <button
            v-if="isAdminOrProfessor"
            @click="openForm('event')"
            class="btn-primary"
        >+ 이벤트 추가</button>
      </div>
      <EventList
          :year="year"
          :level="level"
          :canEdit="isAdminOrProfessor"
          @edit="item => openEditForm(item, 'event')"
          @delete="item => handleDelete(item, 'event')"
      />
    </section>

     🧩 통합 폼 모달
    <UnifiedScheduleForm
        v-if="isUnifiedModalOpen"
        :isOpen="isUnifiedModalOpen"
        :isEditMode="isEditMode"
        :initialData="selectedItem"
        :year="year"
        :level="level"
        :subjects="subjects"
        :formType="formType"
        @close="isUnifiedModalOpen = false"
        @saved="refresh"
    />


  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'

import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'
import { getSubjectsByYear } from '@/services/subjectService'
import { deleteTimetable, fetchTimetableWithEvents } from '@/services/timetableService'
import { deleteEvent } from '@/services/eventService'
import { getCurrentSemester, getSemesterRange } from '@/utils/semester'

import WeeklyTimetable from '@/components/WeeklyTimetable.vue'
import TimetableList from '@/components/TimetableList.vue'
import EventList from '@/components/EventList.vue'
import UnifiedScheduleForm from '@/components/UnifiedScheduleForm.vue'

// 🧠 상태
const authStore = useAuthStore()
const timetableStore = useTimetableStore()

const year = ref(authStore.grade ?? 1)
const level = ref(authStore.level ?? 'N1')
const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const isAdminOrProfessor = computed(() => authStore.role <= 2)

const subjects = ref([])

const isUnifiedModalOpen = ref(false)
const isEditMode = ref(false)
const formType = ref('regular')
const selectedItem = ref(null)

const dateRange = ref({
  start: dayjs().startOf('week').format('YYYY-MM-DD'),
  end: dayjs().endOf('week').format('YYYY-MM-DD')
})

const startDate = computed(() => dateRange.value.start)
const endDate = computed(() => dateRange.value.end)

// 📌 주간 이동
function moveWeek(direction) {
  const newStart = dayjs(dateRange.value.start).add(direction, 'week')
  const newEnd = newStart.endOf('week')
  dateRange.value.start = newStart.format('YYYY-MM-DD')
  dateRange.value.end = newEnd.format('YYYY-MM-DD')
  refresh()
}

// 📦 과목 불러오기
async function loadSubjects() {
  try {
    const res = await getSubjectsByYear(year.value)
    subjects.value = res.subjects ?? []
  } catch (err) {
    console.error('❌ 과목 불러오기 실패', err)
  }
}

// 📦 시간표/이벤트 불러오기
async function refresh() {
  await loadSubjects()
  try {
    const res = await fetchTimetableWithEvents({
      year: year.value,
      level: level.value,
      start_date: startDate.value,
      end_date: endDate.value
    })

    timetableStore.setTimetableAndEvents(
        res.timetables,
        res.events,
        res.holidays || []
    )
  } catch (err) {
    console.error('❌ 시간표 불러오기 실패', err)
  }
}

// 📦 모달 핸들러
function openForm(type = 'regular') {
  isEditMode.value = false
  formType.value = type
  selectedItem.value = null
  isUnifiedModalOpen.value = true
}

function openEditForm(item, type = 'regular') {
  isEditMode.value = true
  formType.value = type
  selectedItem.value = item
  isUnifiedModalOpen.value = true
}

async function handleDelete(item, type = 'regular') {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    if (type === 'regular') {
      await deleteTimetable(item.id)
    } else {
      await deleteEvent(item.id)
    }
    await refresh()
  } catch (err) {
    console.error('❌ 삭제 실패', err)
  }
}

onMounted(refresh)
watch(() => [year.value, level.value, dateRange.value.start, dateRange.value.end], refresh)
</script>

<style scoped>
.timetable-view {
  @apply bg-idolGray p-8 rounded-xl shadow-inner space-y-10;
}
h2 {
  @apply text-2xl font-bold text-idolPurple flex items-center gap-2;
}
h3 {
  @apply text-lg font-bold text-idolPurple mb-2;
}
.btn-primary {
  @apply btn-idol;
}
select {
  @apply px-3 py-2 rounded-lg border border-idolPurple text-idolPurple bg-white;
}
button {
  @apply transition duration-150 ease-in-out;
}
button[disabled] {
  @apply opacity-50 cursor-not-allowed;
}
.date-input {
  @apply px-2 py-1 border border-gray-300 rounded;
}
</style>
