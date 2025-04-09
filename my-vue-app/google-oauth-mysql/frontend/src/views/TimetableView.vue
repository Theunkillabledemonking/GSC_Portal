<template>
  <div class="timetable-view space-y-8">
    <h2>📅 시간표 및 이벤트 관리</h2>

    <!-- 🎓 학년 · 레벨 · 학기 필터 -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- 학년 -->
      <div class="flex items-center gap-2">
        <label>학년:</label>
        <div class="flex gap-1">
          <button
              v-for="y in [1,2,3]"
              :key="y"
              :class="[
              'px-3 py-1 rounded border transition',
              year === y ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border-gray-300',
              isAdminOrProfessor ? 'cursor-pointer hover:bg-green-100' : 'opacity-50 cursor-not-allowed'
            ]"
              :disabled="!isAdminOrProfessor"
              @click="year = y"
          >{{ y }}학년</button>
        </div>
      </div>

      <!-- 레벨 -->
      <div class="flex items-center gap-2">
        <label>레벨:</label>
        <select v-model="level" class="px-2 py-1 border rounded bg-white text-gray-800">
          <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>

      <!-- 학기 -->
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
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
    </div>

    <!-- 📅 기간 선택 -->
    <div class="flex items-center gap-2">
      <label>기간:</label>
      <button @click="moveWeek(-1)">⬅️ 이전</button>
      <input type="date" v-model="dateRange.start" class="date-input" />
      ~
      <input type="date" v-model="dateRange.end" class="date-input" />
      <button @click="moveWeek(1)">다음 ➡️</button>
    </div>
    <div>기간: {{ startDate }} ~ {{ endDate }}</div>

    <!-- 🗓️ 주간 그리드 -->
    <WeeklyTimetable
        :start="startDate"
        :end="endDate"
        @showDetail="item => openEditForm(item)"
    />

    <!-- 📘 정규 수업 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>📘 정규 수업</h3>
        <button class="btn-primary" @click="openForm('regular')">+ 정규 수업 추가</button>
      </div>
      <TimetableList
          :items="timetableStore.regulars"
          :year="year"
          :semester="semester"
          :level="level"
          :groupLevel="groupLevel"
          :canEdit="true"
          @edit="i => openEditForm(i, 'regular')"
          @delete="i => handleDelete(i, 'regular')"
      />
    </section>

    <!-- 🟧 특강 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🟧 특강</h3>
        <button class="btn-primary" @click="openForm('special')">+ 특강 추가</button>
      </div>
      <TimetableList
          :items="timetableStore.specials"
          type="special"
          :year="year"
          :semester="semester"
          :level="level"
          :startDate="startDate"
          :endDate="endDate"
          :groupLevel="groupLevel"
          :canEdit="true"
          @edit="i => openEditForm(i, 'special')"
          @delete="i => handleDelete(i, 'special')"
      />
    </section>

    <!-- 🎈 이벤트 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🎈 이벤트</h3>
        <button class="btn-primary" @click="openForm('event')">+ 이벤트 추가</button>
      </div>
      <EventList
          :events="timetableStore.combinedData"
          :canEdit="true"
          @edit="i => openEditForm(i, 'event')"
          @delete="i => handleDelete(i, 'event')"
      />
    </section>

    <!-- 🧩 통합 폼 -->
    <UnifiedScheduleForm
        v-if="isUnifiedModalOpen"
        :key="formKey"
        :isOpen="isUnifiedModalOpen"
        :isEditMode="isEditMode"
        :initialData="selectedItem"
        :year="['regular', 'cancel', 'makeup'].includes(formType) ? year : null"
        :level="['special', 'cancel', 'makeup', 'event'].includes(formType) ? level : ''"
        :semester="semester"
        :formType="formType"
        :groupLevel="groupLevel"
        :subjects="subjects"
        @close="handleCloseForm"
        @saved="refresh"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'

// 🏪 스토어
import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'

// 📡 API
import {
  getSubjectsByYear,
  getSpecialLectures,
  getSubjectsForEvent
} from '@/services/subjectService'
import { deleteTimetable } from '@/services/timetableService'
import { deleteEvent } from '@/services/eventService'

// 🛠 유틸
import { normalizeLevel } from '@/utils/level'

// 🧩 컴포넌트
import WeeklyTimetable from '@/components/schedule/WeeklyTimetable.vue'
import TimetableList from '@/components/schedule/TimetableList.vue'
import EventList from '@/components/schedule/EventList.vue'
import UnifiedScheduleForm from '@/components/schedule/UnifiedScheduleForm.vue'

/* -------------------- 상태 초기화 -------------------- */
const authStore = useAuthStore()
const timetableStore = useTimetableStore()

const isAdminOrProfessor = computed(() => authStore.role <= 2)

const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const subjects = ref([])

const isUnifiedModalOpen = ref(false)
const isEditMode = ref(false)
const formType = ref('regular')
const selectedItem = ref(null)
const formKey = ref(0)

/* -------------------- 필터 (year / level / groupLevel) -------------------- */
const year = computed({
  get: () => timetableStore.filters.year,
  set: val => timetableStore.setFilters({ year: val })
})

const level = computed({
  get: () => timetableStore.filters.level,
  set: val => timetableStore.setFilters({ level: val })
})

const groupLevel = computed({
  get: () => timetableStore.filters.groupLevel,
  set: val => timetableStore.setFilters({ groupLevel: val })
})

/* -------------------- 날짜 관련 -------------------- */
const dateRange = computed({
  get: () => timetableStore.dateRange,
  set: val => timetableStore.setDateRange(val)
})

const startDate = computed(() => dateRange.value.start)
const endDate = computed(() => dateRange.value.end)

const semester = computed(() => {
  const m = dayjs(dateRange.value.start).month() + 1
  if (m >= 3 && m <= 6) return 'spring'
  if (m >= 7 && m <= 8) return 'summer'
  if (m >= 9 && m <= 12) return 'fall'
  return 'winter'
})

const semesterLabel = computed(() => ({
  spring: '1학기',
  summer: '여름학기',
  fall: '2학기',
  winter: '겨울학기'
})[semester.value])

/* -------------------- 폼 모달 핸들러 -------------------- */
function openForm(t = 'regular') {
  formType.value = t
  isEditMode.value = false
  selectedItem.value = null
  formKey.value++
  isUnifiedModalOpen.value = true
}

function openEditForm(item, t = 'regular') {
  selectedItem.value = {
    ...item,
    originalInfo: formatOriginalInfo(item)
  }
  formType.value = t
  isEditMode.value = true
  formKey.value++
  isUnifiedModalOpen.value = true
}

function handleCloseForm() {
  isUnifiedModalOpen.value = false
  isEditMode.value = false
  selectedItem.value = null
}

/* -------------------- 원본 정보 포맷팅 -------------------- */
function formatOriginalInfo(item) {
  const parts = [`[${item.is_special_lecture ? '특강' : '정규'}]`]

  if (item.level) {
    let levelInfo = `[${item.level}]`
    if (item.group_levels?.length) {
      const levels = item.group_levels.filter(Boolean)
      const isAll = ['A', 'B', 'C'].every(l => levels.includes(l)) || levels.includes('ALL')
      levelInfo += isAll ? ' (전체)' : ` (${levels.join('/')}분반)`
    }
    parts.push(levelInfo)
  }

  if (item.subject_name) parts.push(item.subject_name)
  if (item.day && item.start_period) {
    const time = `${item.day}요일 ${item.start_period}~${item.end_period}교시`
    parts.push(`${time} (${getPeriodTime(item.start_period)}~${getPeriodTime(item.end_period)})`)
  }
  if (item.room) parts.push(`강의실: ${item.room}`)
  if (item.professor_name) parts.push(`교수: ${item.professor_name}`)

  return parts.join(' | ')
}

function getPeriodTime(p) {
  return {
    1: '09:00', 2: '10:00', 3: '11:00', 4: '12:00',
    5: '13:00', 6: '14:00', 7: '15:00', 8: '16:00', 9: '17:00'
  }[p] || `${p}:00`
}

/* -------------------- 삭제 핸들러 -------------------- */
async function handleDelete(item, type = 'regular') {
  if (!confirm('정말 삭제하시겠습니까?')) return
  const fn = type === 'regular' ? deleteTimetable : deleteEvent
  await fn(item.id)
  await refresh()
}

/* -------------------- 주 이동 함수 -------------------- */
function moveWeek(offset) {
  const current = dayjs(startDate.value)
  let start = current.day() === 0 ? current.add(1, 'day') : current.subtract(current.day() - 1, 'day')
  start = start.add(offset, 'week')
  dateRange.value = {
    start: start.format('YYYY-MM-DD'),
    end: start.add(4, 'day').format('YYYY-MM-DD')
  }
}

/* -------------------- 과목 동기화 -------------------- */
async function loadSubjects() {
  try {
    console.log('🔥 loadSubjects() triggered -> formType:', formType.value)
    let res
    if (formType.value === 'special') {
      res = await getSpecialLectures({
        level: level.value,
        group_level: groupLevel.value || 'ALL'
      })
      subjects.value = res?.specialLectures ?? []
    } else if (formType.value === 'regular') {
      res = await getSubjectsByYear(year.value)
      subjects.value = res?.subjects ?? []
    } else if (formType.value === 'event') {
      res = await getSubjectsForEvent({
        year: year.value,
        level: level.value,
        group_level: groupLevel.value || 'ALL'
      })
      subjects.value = res?.subjects ?? []
    } else {
      subjects.value = []
    }
    console.log('🎓 과목 데이터:', subjects.value)
  } catch (e) {
    console.error('❌ 과목 불러오기 실패', e)
    subjects.value = []
  }
}

/* -------------------- 스토어 리프레시 -------------------- */
async function refresh() {
  timetableStore.setFilters({
    year: year.value,
    level: normalizeLevel(level.value),
    group_level: groupLevel.value,
    semester: semester.value
  })
  await timetableStore.loadAllDataBySemester()
}

/* -------------------- 날짜 → 학기 계산 -------------------- */
function getSemesterFromDate(date) {
  if (!date) return null
  const m = dayjs(date).month() + 1
  if (m >= 3 && m <= 6) return 'spring'
  if (m >= 7 && m <= 8) return 'summer'
  if (m >= 9) return 'fall'
  return 'winter'
}

/* -------------------- 라이프사이클 -------------------- */
onMounted(async () => {
  if (!isAdminOrProfessor.value) {
    timetableStore.setFilters({ year: authStore.year, level: authStore.level })
  }

  timetableStore.setDateRange({
    start: startDate.value,
    end: endDate.value
  })

  await timetableStore.loadAllDataBySemester()
  await loadSubjects()

  console.log('🎯 초기 데이터 로드 완료')
})

/* -------------------- Watchers -------------------- */
watch([year, level, groupLevel], async ([y, l, g]) => {
  console.log("📡 필터 변경 감지:", { y, l, g })
  await timetableStore.loadAllDataBySemester({
    year: y,
    level: l,
    group_level: g,
    semester: semester.value,
    ...dateRange.value
  })
  await loadSubjects()
})

watch(formType, async (newType) => {
  console.log("🧩 formType 변경:", newType)
  await loadSubjects()
})

watch(dateRange, (newVal, oldVal) => {
  const newSem = getSemesterFromDate(newVal.start)
  const oldSem = getSemesterFromDate(oldVal?.start)
  if (newSem !== oldSem) {
    timetableStore.setFilters({ semester: newSem })
  }
  timetableStore.loadAllDataBySemester()
}, { deep: true })
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
