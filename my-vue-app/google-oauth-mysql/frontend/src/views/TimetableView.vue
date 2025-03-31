<!-- views/ScheduleManagement.vue -->
<template>
  <div class="timetable-view space-y-8">
    <h2>📅 시간표 및 이벤트 관리</h2>

    <!-- 🎓 학년 / 레벨 선택 -->
    <div class="flex flex-wrap items-center gap-4">
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

      <div class="flex items-center gap-2">
        <label>레벨:</label>
        <select v-model="level" class="px-2 py-1 border rounded bg-white text-gray-800">
          <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
        </select>
      </div>
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
    <!-- 📘 정규 수업 목록 -->
    <section class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>📘 정규 수업</h3>
        <button v-if="isAdminOrProfessor" @click="openForm('regular')" class="btn-primary">
          + 정규 수업 추가
        </button>
      </div>
      <TimetableList
          :year="year"
          :level="level"
          :canEdit="isAdminOrProfessor"
          @edit="item => openEditForm(item, 'regular')"
          @delete="item => handleDelete(item, 'regular')"
      />
    </section>

    <!-- 🎯 특강 목록 -->
    <section class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🟧 특강 수업</h3>
        <button v-if="isAdminOrProfessor" @click="openForm('special')" class="btn-primary">
          + 특강 추가
        </button>
      </div>
      <TimetableList
          :year="year"
          :level="level"
          :canEdit="isAdminOrProfessor"
          type="special"
          @edit="item => openEditForm(item, 'special')"
          @delete="item => handleDelete(item, 'regular')"
      />
    </section>

    <!-- 🎈 이벤트 목록 -->
    <section class="space-y-2">
      <div class="flex justify-between items-center">
        <h3>🎈 이벤트</h3>
        <button v-if="isAdminOrProfessor" @click="openForm('event')" class="btn-primary">
          + 이벤트 추가
        </button>
      </div>
      <EventList
          :year="year"
          :level="level"
          :canEdit="isAdminOrProfessor"
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
import { deleteTimetable, fetchTimetableWithEvents, fetchSpecialLectures } from '@/services/timetableService'
import { deleteEvent } from '@/services/eventService'

import WeeklyTimetable from '@/components/schedule/WeeklyTimetable.vue'
import TimetableList from '@/components/schedule/TimetableList.vue'
import EventList from '@/components/EventList.vue'
import UnifiedScheduleForm from '@/components/schedule/UnifiedScheduleForm.vue'

// 📌 기본 상태
const authStore = useAuthStore()
const timetableStore = useTimetableStore()

const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const year = ref(authStore.grade ?? 1)
const level = ref(authStore.level ?? levels[0])
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

const formKey = ref(0)

// 📦 과목 불러오기 (학년이 바뀔 때만)
watch(
    () => [year.value, formType.value],
    async ([newYear, newType]) => {
      try {
        if (newType === 'special') {
          const res = await getSubjectsByLevel(level.value)
          subjects.value = res.subjects ?? []
        } else {
          const res = await getSubjectsByYear(newYear)
          subjects.value = res.subjects ?? []
        }
      } catch (err) {
        console.error('❌ 과목 불러오기 실패', err)
      }
    },
    { immediate: true }
)

// 📦 시간표 및 이벤트 불러오기
async function refresh() {
  try {
    const [mainRes, specials] = await Promise.all([
      fetchTimetableWithEvents({
        year: year.value,
        level: level.value,
        start_date: startDate.value,
        end_date: endDate.value
      }),
      fetchSpecialLectures(level.value, startDate.value, endDate.value) // 🔥 레벨만 넘김
    ]);

    timetableStore.setTimetableAndEvents(
        mainRes.timetables,
        mainRes.events,
        mainRes.holidays || []
    );
    timetableStore.setSpecialLectures(specials); // 🎯 이제 드디어 사용됨!
  } catch (err) {
    console.error('❌ 시간표/이벤트/특강 불러오기 실패', err);
  }
}

// 📌 주 단위 이동
function moveWeek(direction) {
  const newStart = dayjs(dateRange.value.start).add(direction, 'week')
  dateRange.value.start = newStart.format('YYYY-MM-DD')
  dateRange.value.end = newStart.endOf('week').format('YYYY-MM-DD')
}

// 🔧 모달 핸들러
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

function handleCloseForm() {
  isUnifiedModalOpen.value = false
  isEditMode.value = false
  selectedItem.value = null
}

// 🗑 삭제
async function handleDelete(item, type = 'regular') {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    const deleteFn = type === 'regular' ? deleteTimetable : deleteEvent
    await deleteFn(item.id)
    await refresh()
  } catch (err) {
    console.error('❌ 삭제 실패', err)
  }
}

// 초기 로딩 및 감시
onMounted(refresh)
watch(() => [level.value, dateRange.value.start, dateRange.value.end], refresh)
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
