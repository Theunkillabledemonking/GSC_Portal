<template>
  <div class="timetable-view space-y-8">
    <h2>📅 시간표 및 이벤트 관리</h2>

    <!-- 🎓 학년 / 레벨 / 자동 학기 표시 -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- 학년 선택 (관리자만 가능) -->
      <div class="flex items-center gap-2">
        <label>학년:</label>
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

      <!-- 레벨 선택 (학생은 자동 지정됨) -->
      <div class="flex items-center gap-2">
        <label>레벨:</label>
        <select v-model="level" class="px-2 py-1 border rounded bg-white text-gray-800">
          <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
        </select>
      </div>

      <!-- 자동 학기 표시 -->
      <div class="flex items-center gap-2">
        <label>학기:</label>
        <span class="px-2 py-1 border rounded bg-gray-100 text-gray-800">{{ semesterLabel }}</span>
      </div>
    </div>

    <!-- ✅ 분반 필터 -->
    <div class="flex items-center gap-2">
      <label>분반:</label>
      <select v-model="groupLevel" class="px-2 py-1 border rounded bg-white text-gray-800">
        <option value="">전체</option>
        <option>A</option>
        <option>B</option>
        <option>C</option>
      </select>
    </div>

    <!-- 📅 날짜 선택 -->
    <div class="flex items-center gap-2">
      <label>기간:</label>
      <button @click="moveWeek(-1)">⬅️ 이전</button>
      <input type="date" v-model="dateRange.start" class="date-input" />
      ~
      <input type="date" v-model="dateRange.end" class="date-input" />
      <button @click="moveWeek(1)">다음 ➡️</button>
    </div>
    <div><span>기간: {{ startDate }} ~ {{ endDate }}</span></div>

    <!-- 🗓 주간 시간표 -->
    <WeeklyTimetable
        :year="year"
        :level="level"
        :start="startDate"
        :end="endDate"
        :timetables="timetableStore.getCombinedData"
    />

    <!-- 📘 정규 수업 목록 (관리자만 표시) -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>📘 정규 수업</h3>
        <button @click="openForm('regular')" class="btn-primary">+ 정규 수업 추가</button>
      </div>
      <TimetableList
          :year="year"
          :level="level"
          :canEdit="true"
          @edit="item => openEditForm(item, 'regular')"
          @delete="item => handleDelete(item, 'regular')"
      />
    </section>

    <!-- 🎯 특강 목록 (관리자만 표시) -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🟧 특강 수업</h3>
        <button @click="openForm('special')" class="btn-primary">+ 특강 추가</button>
      </div>
      <TimetableList
          :year="year"
          :level="level"
          :startDate="startDate"
          :endDate="endDate"
          type="special"
          :canEdit="true"
          @edit="item => openEditForm(item, 'special')"
          @delete="item => handleDelete(item, 'special')"
      />
    </section>

    <!-- 🎈 이벤트 목록 (관리자만 표시) -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🎈 이벤트</h3>
        <button @click="openForm('event')" class="btn-primary">+ 이벤트 추가</button>
      </div>
      <EventList
          :year="year"
          :level="level"
          :canEdit="true"
          :events="timetableStore.eventsByType.event"
          @edit="item => openEditForm(item, 'event')"
          @delete="item => handleDelete(item, 'event')"
      />
    </section>

    <!-- 🧩 통합 폼 모달 -->
    <UnifiedScheduleForm
        v-if="isUnifiedModalOpen"
        :key="formKey"
        :isOpen="isUnifiedModalOpen"
        :isEditMode="isEditMode"
        :initialData="selectedItem"
        :year="year"
        :level="level"
        :subjects="subjects"
        :formType="formType"
        @close="handleCloseForm"
        @saved="refresh"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'

import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'

import { getSubjectsByYear, getSubjectsByLevel } from '@/services/subjectService'
import { deleteTimetable } from '@/services/timetableService'
import { deleteEvent } from '@/services/eventService'

import { getSemesterRange } from '@/utils/semester'
import { normalizeLevel } from '@/utils/level'

// ✅ 컴포넌트
import WeeklyTimetable from '@/components/schedule/WeeklyTimetable.vue'
import TimetableList from '@/components/schedule/TimetableList.vue'
import EventList from '@/components/schedule/EventList.vue'
import UnifiedScheduleForm from '@/components/schedule/UnifiedScheduleForm.vue'

// 🧠 상태 초기화
const authStore = useAuthStore()
const timetableStore = useTimetableStore()

const isAdminOrProfessor = computed(() => authStore.role <= 2)

const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const year = ref(isAdminOrProfessor.value ? 1 : authStore.year)
const level = ref(isAdminOrProfessor.value ? levels[0] : authStore.level)
const semester = ref('spring')
const groupLevel = ref('')

const calendarYear = new Date().getFullYear()

// 📅 날짜 관리
const dateRange = ref({
  start: dayjs().startOf('week').format('YYYY-MM-DD'),
  end: dayjs().startOf('week').add(6, 'day').format('YYYY-MM-DD')
})
const startDate = computed(() => dateRange.value.start)
const endDate = computed(() => dateRange.value.end)

// ✅ 모달 관련
const isUnifiedModalOpen = ref(false)
const isEditMode = ref(false)
const formType = ref('regular')
const selectedItem = ref(null)
const formKey = ref(0)

// 📘 과목 목록
const subjects = ref([])

// 🗓️ 학기 라벨
const semesterLabel = computed(() => {
  const month = dayjs(dateRange.value.start).month() + 1
  if (month >= 3 && month <= 6) return '1학기'
  if (month >= 7 && month <= 8) return '여름학기'
  if (month >= 9 && month <= 12) return '2학기'
  return '겨울학기'
})

// 📆 날짜 기반 학기 자동 설정
watch(() => dateRange.value.start, (start) => {
  const month = dayjs(start).month() + 1
  if (month >= 3 && month <= 6) semester.value = 'spring'
  else if (month >= 7 && month <= 8) semester.value = 'summer'
  else if (month >= 9 && month <= 12) semester.value = 'fall'
  else semester.value = 'winter'
})

// 📚 과목 목록 동기화 (정규/특강 구분)
watch(() => [year.value, formType.value], loadSubjects, { immediate: true })

async function loadSubjects() {
  try {
    const isSpecial = formType.value === 'special'
    const res = isSpecial
        ? await getSubjectsByLevel(level.value)
        : await getSubjectsByYear(year.value)

    subjects.value = res?.subjects ?? []
  } catch (err) {
    console.error('❌ 과목 불러오기 실패', err)
    subjects.value = []
  }
}

// 🌀 시간표 로딩
async function refresh() {
  const filters = {
    year: calendarYear,
    semester: semester.value,
    level: normalizeLevel(level.value),
    group_level: groupLevel.value
  }

  timetableStore.setFilters(filters)
  await timetableStore.loadAllDataBySemester()
}

onMounted(refresh)
watch(() => [level.value, semester.value], refresh)

// 📅 주간 변경
function moveWeek(dir) {
  const newStart = dayjs(dateRange.value.start).add(dir * 7, 'day')
  dateRange.value.start = newStart.format('YYYY-MM-DD')
  dateRange.value.end = newStart.add(6, 'day').format('YYYY-MM-DD')
}

// ✨ 폼 열기 / 수정
function openForm(type = 'regular') {
  formType.value = type
  isEditMode.value = false
  selectedItem.value = null
  formKey.value++
  isUnifiedModalOpen.value = true
}

function openEditForm(item, type = 'regular') {
  formType.value = type
  isEditMode.value = true
  selectedItem.value = item
  formKey.value++
  isUnifiedModalOpen.value = true
}

// ❌ 삭제
async function handleDelete(item, type = 'regular') {
  if (!confirm('정말 삭제하시겠습니까?')) return
  const fn = type === 'regular' ? deleteTimetable : deleteEvent
  await fn(item.id)
  await refresh()
}

// 🧹 닫기
function handleCloseForm() {
  isUnifiedModalOpen.value = false
  isEditMode.value = false
  selectedItem.value = null
}
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
.date-input {
  @apply px-2 py-1 border border-gray-300 rounded;
}
</style>
