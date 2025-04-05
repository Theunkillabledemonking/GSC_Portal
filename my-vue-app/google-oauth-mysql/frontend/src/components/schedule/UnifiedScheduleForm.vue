<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? titles.edit : titles.create }}</h3>
      <form @submit.prevent="handleSubmit">
        <!-- 이벤트 유형 (이벤트 폼일 때) -->
        <div v-if="isEvent" class="form-group">
          <label>이벤트 유형</label>
          <select v-model="form.event_type" required>
            <option disabled value="">선택</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
            <option value="event">행사</option>
          </select>
        </div>

        <!-- 수업 종류 + 학년/레벨 (휴강/보강일 때) -->
        <template v-if="isCancel || isMakeup">
          <div class="form-group">
            <label>수업 종류</label>
            <select v-model="classType" required>
              <option disabled value="">선택</option>
              <option value="regular">정규</option>
              <option value="special">특강</option>
            </select>
          </div>
          <div v-if="classType === 'regular'" class="form-group">
            <label>학년</label>
            <select v-model="selectedYear" required>
              <option disabled value="">학년 선택</option>
              <option v-for="y in [1,2,3]" :key="y" :value="y">{{ y }}학년</option>
            </select>
          </div>
          <div v-else-if="classType === 'special'" class="form-group">
            <label>레벨</label>
            <select v-model="selectedLevel" required>
              <option disabled value="">레벨 선택</option>
              <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
            </select>
          </div>
        </template>

        <!-- 정규 수업 선택 (휴강일 경우) -->
        <div v-if="isCancel" class="form-group">
          <label>정규 수업</label>
          <select v-model="form.timetable_id" required>
            <option disabled value="">수업 선택</option>
            <option v-for="tt in timetableOpts" :key="tt.id" :value="tt.id">
              {{ tt.day }} / {{ tt.subject_name }} ({{ tt.start_period }}~{{ tt.end_period }}교시)
            </option>
          </select>
        </div>

        <!-- 과목 선택 -->
        <!-- 정규 폼: 부모에서 전달받은 subjects를 필터링 -->
        <div v-if="isRegular" class="form-group">
          <label>과목</label>
          <select v-model="form.subject_id" required>
            <option disabled value="">과목 선택</option>
            <option v-for="s in regularSubjectOpts" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <!-- 특강/보강/이벤트 폼: 로컬 subjectOpts 사용 (API 호출 결과 또는 fallback) -->
        <div v-else-if="isSpecial || isMakeup || isEvent" class="form-group">
          <label>과목</label>
          <select v-model="form.subject_id" required>
            <option disabled value="">과목 선택</option>
            <option v-for="s in subjectOpts" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 특강 분반 (특강 폼일 때) -->
        <div v-if="isSpecial" class="form-group">
          <label>분반</label>
          <select v-model="groupLevelProxy">
            <option value="">전체</option>
            <option>A</option>
            <option>B</option>
          </select>
        </div>

        <!-- 날짜 / 요일 -->
        <div class="form-group">
          <label>{{ isEvent ? '이벤트 날짜' : '요일' }}</label>
          <input v-if="isEvent" type="date" v-model="form.event_date" required />
          <select v-else v-model="form.day" required>
            <option disabled value="">요일 선택</option>
            <option v-for="d in days" :key="d">{{ d }}</option>
          </select>
        </div>

        <!-- 교시 -->
        <div v-if="needPeriods" class="form-group">
          <label>교시</label>
          <div class="flex gap-2">
            <select v-model="form.start_period" required>
              <option v-for="n in 9" :key="n" :value="n">{{ n }}</option>
            </select>
            ~
            <select v-model="form.end_period" required>
              <option v-for="n in 9" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- 시간 (특강/행사) -->
        <template v-if="needTime">
          <div class="form-group">
            <label>시작 시간</label>
            <input type="time" v-model="form.start_time" />
          </div>
          <div class="form-group">
            <label>종료 시간</label>
            <input type="time" v-model="form.end_time" />
          </div>
        </template>

        <!-- 학기 / 강의실 / 교수 -->
        <div v-if="isRegularOrSpecial" class="form-group">
          <label>학기</label>
          <select v-model="form.semester" required>
            <option value="spring">1학기</option>
            <option value="summer">여름학기</option>
            <option value="fall">2학기</option>
            <option value="winter">겨울학기</option>
          </select>
        </div>
        <div v-if="isRegularOrSpecial" class="form-group">
          <label>강의실</label>
          <input type="text" v-model="form.room" />
        </div>
        <div v-if="isAdminOrProfessor && isRegularOrSpecial" class="form-group">
          <label>담당 교수</label>
          <input type="text" v-model="form.professor_name" />
        </div>

        <div class="form-group">
          <label>설명</label>
          <textarea rows="2" v-model="form.description" />
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? '처리 중…' : (isEditMode ? '수정' : '등록') }}
          </button>
          <button type="button" @click="$emit('close')">닫기</button>
          <button v-if="isEditMode" class="danger" type="button" @click="handleDelete">
            삭제
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/authStore'
import {
  fetchTimetables, createTimetable, updateTimetable, deleteTimetable
} from '@/services/timetableService'
import {
  createEvent, updateEvent, deleteEvent
} from '@/services/eventService'
import {
  getSpecialLectures, getSubjectsForEvent
} from '@/services/subjectService'

/* ----------------- Props & Emits ----------------- */
const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
  level: String,
  semester: String,
  formType: String, // "regular", "special", "event", "cancel", "makeup"
  groupLevel: String,
  subjects: Array
})
const emit = defineEmits(['close', 'saved'])

/* ----------------- State ----------------- */
const form = ref({})
const loading = ref(false)
// 정규 폼에서는 classType가 필요 없으므로 특강/보강에서만 사용 (이 부분은 상황에 맞게 조정)
const classType = ref('')
const selectedYear = ref(props.year || 1)
const selectedLevel = ref(props.level || '')
const timetableOpts = ref([])
const subjectOpts = ref([])

const days = ['월','화','수','목','금','토']
const levels = ['N1','N2','N3','TOPIK4','TOPIK6']
const auth = useAuthStore()

/* ----------------- 권한 ----------------- */
const isAdminOrProfessor = computed(() => auth.role <= 2)

/* ----------------- Form Type ----------------- */
const isRegular  = computed(() => props.formType === 'regular')
const isSpecial  = computed(() => props.formType === 'special')
const isEvent    = computed(() => props.formType === 'event')
const isCancel   = computed(() => form.value.event_type === 'cancel')
const isMakeup   = computed(() => form.value.event_type === 'makeup')
const isRegularOrSpecial = computed(() => isRegular.value || isSpecial.value)
const needPeriods = computed(() =>
    isRegularOrSpecial.value || ['cancel','makeup'].includes(form.value.event_type)
)
const needTime = computed(() =>
    ['special','event'].includes(form.value.event_type)
)

const titles = {
  edit:   isRegularOrSpecial.value ? '수업 수정' : '이벤트 수정',
  create: isRegularOrSpecial.value ? '수업 등록' : '이벤트 등록'
}

/* ----------------- Proxy for group_levels ----------------- */
const groupLevelProxy = computed({
  get: () => form.value.group_levels?.[0] ?? '',
  set: v => form.value.group_levels = v ? [v] : []
})

/* ----------------- 정규 과목 필터 (부모 subjects 사용) ----------------- */
// 정규 폼은 부모에서 전달받은 subjects를 필터링 (is_special_lecture=0, year 일치)
const regularSubjectOpts = computed(() => {
  const semester = form.value.semester
  return props.subjects?.filter(s =>
      s.year === Number(selectedYear.value) &&
      // TODO s.semester === semester && 추후 계절 구현
      s.is_special_lecture === 0
  ) || []
})

const showPeriodField = computed(() => {
  // 정규/특강 수업 등록일 때만 교시 선택
  return isRegular.value || isSpecial.value || (isMakeup.value && classType.value === 'special')
})

/* ----------------- 과목 로딩 ----------------- */
// 부모에서 전달받은 subjects를 사용할 경우, 정규 폼은 API 호출 없이 props.subjects로 처리
// 특강 폼: selectedLevel과 groupLevelProxy 변화 시 API 호출 (getSpecialLectures)
if (props.formType === 'special') {
  watch(
      [selectedLevel, groupLevelProxy],
      async ([lvl, grp]) => {
        if (!lvl) {
          subjectOpts.value = props.subjects || []
          return
        }
        try {
          const { specialLectures } = await getSpecialLectures({ level: lvl, group_level: grp })
          subjectOpts.value = specialLectures
        } catch (error) {
          console.error('특강 과목 불러오기 실패:', error)
          subjectOpts.value = props.subjects || []
        }
      },
      { immediate: true }
  )
}

// 이벤트 폼: 폼 초기화 시 event_type을 'event'로 설정하고, 해당 watcher로 API 호출
if (props.formType === 'event') {
  // 폼 초기화 시 자동으로 이벤트 타입 설정
  if (!form.value.event_type) {
    form.value.event_type = 'event'
  }
  watch(
      () => form.value.event_type,
      async (type) => {
        if (type === 'event') {
          // ✅ 최소한 year, level은 넘기자
          const { subjects } = await getSubjectsForEvent({
            year: props.year,
            level: props.level,
            group_level: props.groupLevel || ''
          });
          subjectOpts.value = subjects;
        }
      },
      { immediate: true }
  )
}

/* ----------------- 정규 수업 로딩 (휴강 관련) ----------------- */
// 휴강일 때 정규 수업 목록 API 호출 (classType, selectedYear, form.semester)
watch(
    [classType, selectedYear, () => form.value.semester],
    async ([type, yr, sem]) => {
      if (type !== 'regular') return
      if (!isCancel.value) return
      if (!yr || !sem) return
      try {
        timetableOpts.value = await fetchTimetables({ year: yr, semester: sem })
      } catch (error) {
        console.error('정규 수업 로딩 실패:', error)
        timetableOpts.value = []
      }
    }
)

/* ----------------- 정규 수업 선택 시 자동 채움 ----------------- */
watch(() => form.value.timetable_id, (id) => {
  const sel = timetableOpts.value.find(t => t.id === id)
  if (sel) {
    Object.assign(form.value, {
      subject_id: sel.subject_id,
      level: sel.level,
      semester: sel.semester,
      start_period: sel.start_period,
      end_period: sel.end_period,
      day: sel.day
    })
  }
})

/* ----------------- initialData 반영 ----------------- */
watch(() => props.initialData, (val) => {
  if (props.isEditMode && val) {
    form.value = {
      ...val,
      group_levels: Array.isArray(val.group_levels) ? val.group_levels : []
    }
    selectedYear.value = val.year || props.year || 1
    selectedLevel.value = val.level || props.level || ''
  } else {
    resetForm()
  }
})

watch(() => props.isOpen, (v) => {
  if (!v) resetForm()
})

/* ----------------- 초기화 함수 ----------------- */
function resetForm() {
  form.value = {
    id: null,
    event_type: props.formType === 'event' ? 'event' : '',
    day: '',
    event_date: '',
    subject_id: '',
    timetable_id: '',
    start_period: 1,
    end_period: 1,
    semester: props.semester || 'spring',
    room: '',
    professor_name: '',
    level: props.level || '',
    group_levels: props.groupLevel ? [props.groupLevel] : [],
    description: ''
  }
  selectedYear.value = props.year || 1
  selectedLevel.value = props.level || ''
}

/* ----------------- 저장 함수 ----------------- */
async function handleSubmit() {
  if (isCancel.value && !form.value.timetable_id) {
    return alert('정규 수업을 선택하세요')
  }

  // 🔧 누락 필드 보정
  form.value.year  = selectedYear.value
  form.value.level = selectedLevel.value
  form.value.is_special_lecture = isSpecial.value ? 1 : 0

  console.log('🚨 등록 전 데이터:', JSON.stringify(form.value, null, 2))

  loading.value = true
  try {
    if (isRegular.value || isSpecial.value) {
      props.isEditMode
          ? await updateTimetable(form.value.id, form.value)
          : await createTimetable(form.value) // ← form.value에 모든 필수 값 포함됨
    } else {
      props.isEditMode
          ? await updateEvent(form.value.id, form.value)
          : await createEvent(form.value)
    }

    emit('saved')
    emit('close')
  } catch (e) {
    console.error('❌ 저장 실패:', e)
    alert('저장 중 오류')
  } finally {
    loading.value = false
  }
}

/* ----------------- 삭제 함수 ----------------- */
async function handleDelete() {
  if (!confirm('삭제하시겠습니까?')) return
  loading.value = true
  try {
    props.formType === 'event'
        ? await deleteEvent(form.value.id)
        : await deleteTimetable(form.value.id)
    emit('saved')
    emit('close')
  } catch (e) {
    console.error('❌ 삭제 실패:', e)
    alert('삭제 중 오류')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  width: 420px;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
}
input, select, textarea {
  width: 100%;
  padding: 6px;
}
.form-actions {
  display: flex;
  justify-content: space-between;
}
.danger {
  background-color: crimson;
  color: white;
}
</style>
