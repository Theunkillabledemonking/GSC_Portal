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
      <input type="date" v-model="dateRange.end"   class="date-input" />
      <button @click="moveWeek(1)">다음 ➡️</button>
    </div>
    <div>기간: {{ startDate }} ~ {{ endDate }}</div>

    <!-- 🗓️ 주간 그리드 -->
    <WeeklyTimetable
        :start="startDate"
        :end="endDate"
        :timetables="timetableStore.combinedData"
        :year="year"
        :grade="year"
        :level="level"
        :groupLevel="groupLevel"
    />

    <!-- 📘 정규 수업 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>📘 정규 수업</h3>
        <button class="btn-primary" @click="openForm('regular')">+ 정규 수업 추가</button>
      </div>
      <TimetableList
          :year="year"
          :semester="semester"
          :level="level"
          :groupLevel="groupLevel"
          :canEdit="true"
          @edit="i=>openEditForm(i,'regular')"
          @delete="i=>handleDelete(i,'regular')"
      />
    </section>

    <!-- 🟧 특강 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🟧 특강</h3>
        <button class="btn-primary" @click="openForm('special')">+ 특강 추가</button>
      </div>
      <TimetableList
          type="special"
          :year="year"
          :semester="semester"
          :level="level"
          :startDate="startDate"
          :endDate="endDate"
          :groupLevel="groupLevel"
          :canEdit="true"
          @edit="i=>openEditForm(i,'special')"
          @delete="i=>handleDelete(i,'special')"
      />
    </section>

    <!-- 🎈 이벤트 목록 -->
    <section v-if="isAdminOrProfessor" class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🎈 이벤트</h3>
        <button class="btn-primary" @click="openForm('event')">+ 이벤트 추가</button>
      </div>
      <EventList
          :events="timetableStore.events"
          :canEdit="true"
          @edit="i=>openEditForm(i,'event')"
          @delete="i=>handleDelete(i,'event')"
      />
    </section>

    <!-- 🧩 통합 폼 -->
    <UnifiedScheduleForm
        v-if="isUnifiedModalOpen"
        :key="formKey"
        :isOpen="isUnifiedModalOpen"
        :isEditMode="isEditMode"
        :initialData="selectedItem"
        :year="year"
        :level="level"
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
import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'
import {
  getSubjectsByYear,
  getSubjectsByLevel,
  getSubjectsForEvent,
  getSpecialLectures
} from '@/services/subjectService'  // getSpecialLectures 임포트 추가
import { deleteTimetable } from '@/services/timetableService'
import { deleteEvent } from '@/services/eventService'
import { normalizeLevel } from '@/utils/level'

import WeeklyTimetable   from '@/components/schedule/WeeklyTimetable.vue'
import TimetableList     from '@/components/schedule/TimetableList.vue'
import EventList         from '@/components/schedule/EventList.vue'
import UnifiedScheduleForm from '@/components/schedule/UnifiedScheduleForm.vue'

// ------------------------------------------------------------------ 스토어 & 상수
const authStore      = useAuthStore()
const timetableStore = useTimetableStore()
const isAdminOrProfessor = computed(() => authStore.role <= 2)

const levels = ['N1','N2','N3','TOPIK4','TOPIK6']

// ------------------------------------------------------------------ 필터 상태
const year       = ref(isAdminOrProfessor.value ? 1 : authStore.year)   // 학년
const level      = ref(isAdminOrProfessor.value ? levels[0] : authStore.level)
const groupLevel = ref('')

// 학기 초기값을 현재 날짜로 계산
function currentSemester() {
  const m = dayjs().month()+1
  if (m>=3 && m<=6)  return 'spring'
  if (m>=7 && m<=8)  return 'summer'
  if (m>=9)          return 'fall'
  return 'winter'
}
const semester = ref(currentSemester())

// ------------------------------------------------------------------ 날짜 범위
const dateRange = ref({
  start: dayjs().startOf('week').format('YYYY-MM-DD'),
  end:   dayjs().startOf('week').add(6,'day').format('YYYY-MM-DD')
})
const startDate = computed(()=>dateRange.value.start)
const endDate   = computed(()=>dateRange.value.end)

// ------------------------------------------------------------------ 과목 목록
const subjects = ref([])

// 학기 라벨
const semesterLabel = computed(()=>{
  const m = dayjs(dateRange.value.start).month()+1
  if (m>=3 && m<=6)  return '1학기'
  if (m>=7 && m<=8)  return '여름학기'
  if (m>=9)          return '2학기'
  return '겨울학기'
})

// ------------------------------------------------------------------ 모달
const isUnifiedModalOpen = ref(false)
const isEditMode         = ref(false)
const formType           = ref('regular')
const selectedItem       = ref(null)
const formKey            = ref(0)


// 날짜 변경 → 학기 재계산
watch(()=>dateRange.value.start, s=>{
  semester.value = currentSemester()
})

// 과목 동기화
watch([year, level, groupLevel, formType], loadSubjects, { immediate: true })

async function loadSubjects() {
  console.log('🔥 loadSubjects() triggered -> formType:', formType.value)

  try {
    if (formType.value === 'special') {
      const res = await getSpecialLectures({
        level: level.value,
        group_level: groupLevel.value
      })
      subjects.value = res?.specialLectures ?? []
    }
    else if (formType.value === 'regular') {
      const res = await getSubjectsByYear(year.value)
      subjects.value = res?.subjects ?? []
    }
    else if (formType.value === 'event') {
      // ✅ 이벤트용 과목 조회는 학년, 레벨 기준으로
      const res = await getSubjectsForEvent({
        year: year.value,
        level: level.value,
        group_level: groupLevel.value
      })
      subjects.value = res?.subjects ?? []
    }
    else {
      subjects.value = []
    }

    console.log('🎓 과목 데이터:', subjects.value)
  } catch (e) {
    console.error('❌ 과목 불러오기 실패', e)
    subjects.value = []
  }
}



// ------------------------------------------------------------------ 스토어 리프레시
async function refresh(){
  await timetableStore.setFilters({
    year: year.value,             // 학년 → 정규/휴강 필터
    semester: semester.value,
    level: normalizeLevel(level.value),
    group_level: groupLevel.value
  })
  await timetableStore.loadAllDataBySemester()
}

onMounted(refresh)
watch([year,level,semester,groupLevel], refresh)

// ------------------------------------------------------------------ 주간 이동
function moveWeek(dir){
  const n = dayjs(dateRange.value.start).add(dir*7,'day')
  dateRange.value.start = n.format('YYYY-MM-DD')
  dateRange.value.end   = n.add(6,'day').format('YYYY-MM-DD')
}

function openForm(t='regular'){
  formType.value = t
  isEditMode.value = false
  selectedItem.value = null
  formKey.value++
  isUnifiedModalOpen.value = true
}
function openEditForm(item,t='regular'){
  formType.value = t
  isEditMode.value = true
  selectedItem.value = item
  formKey.value++
  isUnifiedModalOpen.value = true
}
async function handleDelete(item,t='regular'){
  if(!confirm('정말 삭제하시겠습니까?')) return
  const fn = t==='regular' ? deleteTimetable : deleteEvent
  await fn(item.id)
  await refresh()
}
function handleCloseForm(){
  isUnifiedModalOpen.value=false
  isEditMode.value=false
  selectedItem.value=null
}
</script>

<style scoped>
.timetable-view{ @apply bg-idolGray p-8 rounded-xl shadow-inner space-y-10; }
h2{ @apply text-2xl font-bold text-idolPurple flex items-center gap-2; }
h3{ @apply text-lg font-bold text-idolPurple mb-2; }
.btn-primary{ @apply btn-idol; }
.date-input{ @apply px-2 py-1 border border-gray-300 rounded; }
</style>
