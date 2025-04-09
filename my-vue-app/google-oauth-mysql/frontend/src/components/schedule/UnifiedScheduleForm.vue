<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-wrapper">
      <div class="modal-content">
        <h3>{{ isEditMode ? titles.edit : titles.create }}</h3>
        <div class="form-layout">
          <!-- 수정 폼 -->
          <form @submit.prevent="handleSubmit" class="edit-form">
            <!-- 원래 정보 표시 (수정 모드일 때만) -->
            <div v-if="isEditMode && initialData?.originalInfo" class="original-info-top">
              <div class="info-box">
                <div class="info-label">📝 수정할 정보:</div>
                <div class="info-content">{{ initialData.originalInfo }}</div>
              </div>
            </div>

            <!-- 이벤트 유형 -->
            <div class="form-group">
              <label>이벤트 유형 *</label>
              <select v-model="form.event_type" class="form-control">
                <option value="">선택해주세요</option>
                <option value="regular">정규 수업</option>
                <option value="special">특강</option>
                <option value="cancel">휴강</option>
                <option value="makeup">보강</option>
                <option value="event">이벤트</option>
              </select>
            </div>

            <!-- 수업 종류 선택 (휴강/보강) -->
            <div v-if="isCancelOrMakeup" class="form-group">
              <label>수업 종류 *</label>
              <select v-model="classType" class="form-control">
                <option value="">선택해주세요</option>
                <option value="regular">정규 수업</option>
                <option value="special">특강</option>
              </select>
            </div>

            <!-- 학년 선택 (정규 수업/정규 휴강/정규 보강) -->
            <div v-if="needsYearInput" class="form-group">
              <label>학년 *</label>
              <select v-model="selectedYear" class="form-control">
                <option value="">선택해주세요</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}학년</option>
              </select>
            </div>

            <!-- 레벨 선택 (특강/특강 휴강/특강 보강) -->
            <div v-if="needsLevelInput" class="form-group">
              <label>레벨 *</label>
              <select v-model="selectedLevel" class="form-control">
                <option value="">선택해주세요</option>
                <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <!-- 분반 선택 (특강) -->
            <div v-if="needsGroupLevel" class="form-group">
              <label>분반</label>
              <select v-model="groupLevelProxy" class="form-control">
                <option value="">전체</option>
                <option v-for="g in groupLevelOptions" :key="g" :value="g">{{ g }}반</option>
              </select>
            </div>

            <!-- 요일 선택 (정규/특강/휴강) -->
            <div v-if="needsDayInput" class="form-group">
              <label>요일 *</label>
              <select v-model="form.day" class="form-control">
                <option value="">선택해주세요</option>
                <option v-for="day in days" :key="day" :value="day">{{ day }}요일</option>
              </select>
            </div>

            <!-- 날짜 선택 (휴강/보강/이벤트) -->
            <div v-if="needsDateInput" class="form-group">
              <label>날짜 *</label>
              <input 
                type="date" 
                v-model="form.event_date" 
                class="form-control"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>

            <!-- 과목 선택 -->
            <div v-if="needsSubjectSelect" class="form-group">
              <label>과목 *</label>
              <select v-model="form.subject_id" class="form-control">
                <option value="">선택해주세요</option>
                <option v-for="subj in filteredSubjects" :key="subj.id" :value="subj.id">
                  {{ subj.name }}
                </option>
              </select>
            </div>

            <!-- 수업 선택 (휴강) -->
            <div v-if="isCancel && form.day" class="form-group">
              <label>수업 *</label>
              <select v-model="form.timetable_id" class="form-control">
                <option value="">선택해주세요</option>
                <option v-for="tt in timetableOpts" :key="tt.id" :value="tt.id">
                  {{ tt.display_name }}
                </option>
              </select>
              <small v-if="timetableOpts.length === 0" class="text-muted">
                선택한 요일에 등록된 수업이 없습니다.
              </small>
            </div>

            <!-- 교시 선택 -->
            <template v-if="needsPeriodInput">
              <div class="form-group">
                <label>시작 교시 *</label>
                <select v-model="form.start_period" class="form-control">
                  <option value="">선택해주세요</option>
                  <option v-for="p in availablePeriods" :key="p" :value="p">
                    {{ p }}교시
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>종료 교시 *</label>
                <select v-model="form.end_period" class="form-control">
                  <option value="">선택해주세요</option>
                  <option v-for="p in availablePeriods" :key="p" :value="p">
                    {{ p }}교시
                  </option>
                </select>
              </div>
            </template>

            <!-- 설명 -->
            <div class="form-group">
              <label>설명</label>
              <textarea v-model="form.description" class="form-control" rows="3"></textarea>
            </div>

            <!-- 액션 버튼 -->
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? '처리 중...' : (isEditMode ? '수정' : '등록') }}
              </button>
              <button type="button" class="btn btn-secondary" @click="$emit('close')">
                취소
              </button>
              <button v-if="isEditMode" type="button" class="btn btn-danger" @click="handleDelete">
                삭제
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// =========================================================
// 1. Imports & 초기 설정
// =========================================================
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/authStore'
import {
  fetchTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable
} from '@/services/timetableService'
import {
  createEvent,
  updateEvent,
  deleteEvent
} from '@/services/eventService'
import {
  getSpecialLectures,
  getSubjectsForEvent,
  getSubjectsByYear
} from '@/services/subjectService'

// =========================================================
// 2. Props & Emits
// =========================================================
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

// =========================================================
// 3. State 변수 및 기본 값 설정
// =========================================================
const form = ref({
  id: null,
  event_type: props.formType === 'event' ? 'event' : '',
  timetable_id: null,
  subject_id: '',
  event_date: '',
  level: props.level || '',
  group_levels: props.groupLevel ? [props.groupLevel] : [],
  start_period: null,
  end_period: null,
  start_time: null,
  end_time: null,
  description: '',
  year: null,
  day: '',
  semester: props.semester || ''
})
const loading = ref(false)
const classType = ref('')
const selectedYear = ref(props.year || 1)
const selectedLevel = ref(props.level || '')
const timetableOpts = ref([])
const subjectOpts = ref([])
const availableTimeSlots = ref([])

const days = ['월','화','수','목','금','토']
const levels = ['N1','N2','N3','TOPIK4','TOPIK6']
const yearOptions = [1, 2, 3]
const groupLevelOptions = ['A', 'B']

const auth = useAuthStore()

// =========================================================
// 4. 컴퓨티드 프로퍼티
// =========================================================

// 권한 관련
const isAdminOrProfessor = computed(() => auth.role <= 2)

// 폼 타입 관련
const isRegular = computed(() => props.formType === 'regular')
const isSpecial = computed(() => props.formType === 'special')
const isEvent   = computed(() => props.formType === 'event')
const isCancel  = computed(() => form.value.event_type === 'cancel')
const isMakeup  = computed(() => form.value.event_type === 'makeup')
const isRegularOrSpecial = computed(() => isRegular.value || isSpecial.value)
const needPeriods = computed(() =>
    isRegularOrSpecial.value || ['cancel', 'makeup'].includes(form.value.event_type)
)
const needTime = computed(() =>
    ['special','event'].includes(form.value.event_type)
)

// 타이틀 텍스트
const titles = {
  edit: isRegularOrSpecial.value ? '수업 수정' : '이벤트 수정',
  create: isRegularOrSpecial.value ? '수업 등록' : '이벤트 등록'
}

// 그룹 레벨 프록시 (배열 처리)
const groupLevelProxy = computed({
  get: () => form.value.group_levels?.[0] ?? '',
  set: v => form.value.group_levels = v ? [v] : []
})

// 정규 수업의 경우 부모로 전달받은 subjects 필터링 (예: 연도와 특강 아님)
const regularSubjectOpts = computed(() => {
  const semester = form.value.semester
  return props.subjects?.filter(s =>
      s.year === Number(selectedYear.value) &&
      s.is_special_lecture === 0
  ) || []
})

// 교시 선택 표시 여부 (정규/특강/보강 혹은 휴강 시)
const showPeriodField = computed(() => {
  return isRegular.value || isSpecial.value || (isMakeup.value && classType.value === 'special')
})

// 입력 필드 노출 조건
const needsTimeInput = computed(() => form.value.event_type === 'event')
const needsPeriodInput = computed(() =>
    ['regular','cancel','makeup','special'].includes(form.value.event_type || '')
)
const needsSubjectSelect = computed(() =>
    ['regular','makeup','special','event'].includes(form.value.event_type || '')
)
const needsTimetableSelect = computed(() =>
    form.value.event_type === 'cancel'
)
const needsYearInput = computed(() => {
  return form.value.event_type === 'regular' ||
      (['cancel', 'makeup'].includes(form.value.event_type || '') && classType.value === 'regular')
})
const needsLevelInput = computed(() => {
  return form.value.event_type === 'special' ||
      (classType.value === 'special' && ['cancel', 'makeup'].includes(form.value.event_type || ''))
})
const needsGroupLevel = computed(() => {
  return form.value.event_type === 'special' ||
      (['cancel', 'makeup'].includes(form.value.event_type || '') && classType.value === 'special')
})
const needsDayInput = computed(() =>
    ['regular','special','cancel'].includes(form.value.event_type || '')
)
const needsDateInput = computed(() =>
    ['cancel','makeup','event'].includes(form.value.event_type || '')
)

// 필터링된 과목 목록
const filteredSubjects = computed(() => {
  if (!subjectOpts.value?.length) return []
  let filtered = []
  if (form.value.event_type === 'regular') {
    filtered = subjectOpts.value.filter(s =>
        (!s.is_special_lecture || s.is_special_lecture === 0) &&
        (!s.year || s.year === selectedYear.value)
    )
  } else if (form.value.event_type === 'special') {
    filtered = subjectOpts.value.filter(s => s.level === selectedLevel.value)
  } else if (classType.value === 'special' && ['cancel','makeup'].includes(form.value.event_type)) {
    filtered = subjectOpts.value.filter(s => (!s.level || s.level === selectedLevel.value))
  } else if (classType.value === 'regular' && ['cancel','makeup'].includes(form.value.event_type)) {
    filtered = subjectOpts.value.filter(s =>
        (!s.is_special_lecture || s.is_special_lecture === 0) &&
        (!s.year || s.year === selectedYear.value)
    )
  } else {
    filtered = subjectOpts.value
  }
  return filtered
})

// (하단의 추가 컴퓨티드들은 기존 데이터 및 외부 스토어를 참조하므로 상황에 맞게 유지)
const findExistingClasses = computed(() => {
  if (!selectedDay.value || !selectedPeriod.value) return []
  if (classType.value === 'regular') {
    return timetableStore.timetables.filter(item =>
        item.day === selectedDay.value &&
        item.start_period <= selectedPeriod.value &&
        item.end_period >= selectedPeriod.value &&
        item.academic_year === currentYear.value
    )
  }
  return timetableStore.events.filter(item => {
    if (item.date !== selectedDate.value) return false
    if (item.start_period > selectedPeriod.value || item.end_period < selectedPeriod.value) return false
    if (classType.value === 'special' && item.level === selectedLevel.value) return true
    if ((classType.value === 'cancel' || classType.value === 'makeup') &&
        item.original_class &&
        item.original_class.level === selectedLevel.value)
      return true
    return false
  })
})

const isTimeOccupied = computed(() => {
  if (holidayStore.isHoliday(selectedDate.value)) return true
  if (findExistingClasses.value.length > 0) {
    if (classType.value === 'special') {
      return findExistingClasses.value.some(item =>
          item.level === selectedLevel.value || !item.level
      )
    }
    return true
  }
  return false
})

const occupiedMessage = computed(() => {
  if (holidayStore.isHoliday(selectedDate.value))
    return '공휴일에는 수업을 등록할 수 없습니다.'
  if (findExistingClasses.value.length > 0) {
    const classes = findExistingClasses.value
    if (classType.value === 'special' && !classes.some(item => item.level === selectedLevel.value))
      return null
    return `이미 ${classes.length}개의 수업이 등록되어 있습니다.`
  }
  return null
})

// =========================================================
// 5. Watchers
// =========================================================

// [특강/이벤트 과목 로딩]
if (props.formType === 'special') {
  watch(
      [selectedLevel, groupLevelProxy],
      async ([lvl, grp]) => {
        if (!lvl) {
          subjectOpts.value = props.subjects || []
          return
        }
        try {
          const { specialLectures } = await getSpecialLectures({
            level: lvl,
            group_level: grp,
            semester: props.semester
          })
          subjectOpts.value = specialLectures
        } catch (error) {
          console.error('특강 과목 불러오기 실패:', error)
          subjectOpts.value = props.subjects || []
        }
      },
      { immediate: true }
  )
}

if (props.formType === 'event') {
  // 이벤트 폼: 기본 event_type 설정 및 과목 로딩
  if (!form.value.event_type) {
    form.value.event_type = 'event'
  }
  watch(
      () => form.value.event_type,
      async (type) => {
        if (type === 'event') {
          const { subjects } = await getSubjectsForEvent({
            year: props.year,
            level: props.level,
            group_level: props.groupLevel || ''
          })
          subjectOpts.value = subjects
        }
      },
      { immediate: true }
  )
}

// [과목 및 시간표 로딩 관련]
watch(
    [() => form.value.event_type, classType, selectedYear, selectedLevel],
    async ([eventType, type, yr, lvl]) => {
      if (!eventType) return
      try {
        // 초기화
        subjectOpts.value = []
        timetableOpts.value = []

        if (eventType === 'regular' && yr) {
          const { subjects } = await getSubjectsByYear(yr)
          subjectOpts.value = subjects || []
        }
        else if (eventType === 'special' && lvl) {
          const { specialLectures } = await getSpecialLectures({
            level: lvl,
            group_level: groupLevelProxy.value,
            semester: props.semester
          })
          subjectOpts.value = specialLectures
        }
        else if (eventType === 'cancel') {
          if (type === 'regular' && yr) {
            const { subjects } = await getSubjectsByYear({ year: yr })
            subjectOpts.value = subjects.filter(s => !s.is_special_lecture)
          } else if (type === 'special' && lvl) {
            const { specialLectures } = await getSpecialLectures({
              level: lvl,
              group_level: groupLevelProxy.value,
              semester: props.semester
            })
            subjectOpts.value = specialLectures
          }
        }
        else if (eventType === 'makeup') {
          if (type === 'regular' && yr) {
            const { subjects } = await getSubjectsByYear({ year: yr })
            subjectOpts.value = subjects.filter(s => !s.is_special_lecture)
          } else if (type === 'special' && lvl) {
            const { specialLectures } = await getSpecialLectures({
              level: lvl,
              group_level: groupLevelProxy.value,
              semester: props.semester
            })
            subjectOpts.value = specialLectures
          }
        }

        // 휴강일 경우 시간표 로드
        if (eventType === 'cancel' && form.value.day) {
          await loadTimetables()
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
        subjectOpts.value = []
        timetableOpts.value = []
      }
    },
    { immediate: true }
)

// 학년 또는 레벨이 변경될 때 (요일 선택이 되어 있다면 시간표 재로드)
watch([selectedYear, selectedLevel], async () => {
  if (form.value.event_type === 'cancel' && form.value.day) {
    await loadTimetables()
  }
})

// 요일 변경 시 시간표 로드 (휴강일 경우)
watch(() => form.value.day, async (newDay) => {
  if (form.value.event_type === 'cancel' && newDay) {
    await loadTimetables()
  }
})

// 수업 선택 시 자동 필드 설정 및 (보강일 경우) 시간대 제한 업데이트
watch(() => form.value.timetable_id, async (newId) => {
  if (!newId) return
  const selected = timetableOpts.value.find(t => t.id === newId)
  if (!selected) return

  form.value.subject_id = selected.subject_id
  form.value.year = selected.year
  form.value.level = selected.level
  form.value.group_levels = selected.group_level ? [selected.group_level] : []

  if (form.value.event_type === 'cancel') {
    form.value.start_period = selected.start_period
    form.value.end_period = selected.end_period
  } else if (form.value.event_type === 'makeup') {
    await updateAvailableTimeSlots(selected)
  }
})

// 이벤트 타입 변경 시 공통 필드 리셋 및 기본값 설정 (중복 워처 통합)
watch(() => form.value.event_type, (newType) => {
  // 'special'와 'event'에서 학년 초기화
  if (['special', 'event'].includes(newType)) {
    form.value.year = null
  }
  // 공통 필드 초기화
  form.value.subject_id = ''
  form.value.timetable_id = null
  form.value.start_period = null
  form.value.end_period = null
  form.value.start_time = null
  form.value.end_time = null
  form.value.day = ''

  // 타입별 기본 설정
  if (newType === 'regular') {
    form.value.year = selectedYear.value
    classType.value = 'regular'
  }
  else if (newType === 'special') {
    form.value.start_period = 1
    form.value.end_period = 1
    classType.value = 'special'
  }
  else if (newType === 'cancel') {
    classType.value = 'regular'
  }
  else if (newType === 'makeup') {
    form.value.start_period = 1
    form.value.end_period = 1
    classType.value = 'regular'
  }
  else if (newType === 'event') {
    form.value.start_time = '09:00'
    form.value.end_time = '18:00'
  }
})

// =========================================================
// 6. 함수 정의
// =========================================================

// [시간표 로드 함수]
async function loadTimetables() {
  try {
    const semester = props.semester
    if (classType.value === 'special') {
      const { specialLectures } = await getSpecialLectures({
        level: selectedLevel.value || props.level || 'ALL',
        group_level: groupLevelProxy.value || 'ALL',
        semester,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6))
            .toISOString().split('T')[0]
      })
      // 선택한 요일에 해당하는 특강만 필터링
      const matching = specialLectures.filter(tt => tt.day === form.value.day)
      timetableOpts.value = matching.map(tt => ({
        ...tt,
        display_name: `[${tt.level}] ${tt.subject_name} (${tt.group_level || '전체'}반) - ${tt.start_period}~${tt.end_period}교시`
      }))
      return
    }
    // 정규 수업의 경우: 학년 기준 조회
    const params = {
      semester,
      day: form.value.day,
      year: selectedYear.value,
      is_special_lecture: 0
    }
    const timetables = await fetchTimetables(params)
    timetableOpts.value = timetables.map(tt => ({
      ...tt,
      display_name: `[${tt.year}학년] ${tt.subject_name} - ${tt.start_period}~${tt.end_period}교시`
    }))
  } catch (err) {
    console.error('시간표 로딩 실패:', err)
    timetableOpts.value = []
  }
}

// [보강 시간대 제한 업데이트 함수]
async function updateAvailableTimeSlots(originalClass) {
  try {
    const restrictedPeriods = new Set()
    for (let i = originalClass.start_period; i <= originalClass.end_period; i++) {
      restrictedPeriods.add(i)
    }
    const allPeriods = Array.from({ length: 9 }, (_, i) => i + 1)
    availableTimeSlots.value = allPeriods.filter(p => !restrictedPeriods.has(p))
  } catch (error) {
    console.error('시간대 계산 실패:', error)
    availableTimeSlots.value = []
  }
}

// =========================================================
// 7. 초기화 및 props 반영
// =========================================================
watch(() => props.initialData, (val) => {
  if (props.isEditMode && val) {
    form.value = {
      ...val,
      group_levels: Array.isArray(val.group_levels) ? val.group_levels : []
    }
    selectedYear.value = val.year || props.year || 1
    selectedLevel.value = val.level || props.level || ''
    classType.value = val.is_special_lecture ? 'special' : 'regular'
    if (val.event_type === 'cancel' && val.day) {
      loadTimetables()
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.isOpen, (v) => {
  if (!v) resetForm()
})

// [폼 초기화 함수]
function resetForm() {
  form.value = {
    id: null,
    event_type: props.formType === 'event' ? 'event' : '',
    timetable_id: null,
    subject_id: '',
    event_date: '',
    level: props.level || '',
    group_levels: props.groupLevel ? [props.groupLevel] : [],
    start_period: null,
    end_period: null,
    start_time: null,
    end_time: null,
    description: '',
    year: null,
    day: '',
    semester: props.semester || ''
  }
  selectedYear.value = props.year || 1
  selectedLevel.value = props.level || ''
  timetableOpts.value = []
  availableTimeSlots.value = []
}

// =========================================================
// 8. 저장 및 삭제 함수
// =========================================================
const handleSubmit = async () => {
  if (!validateForm()) return

  const formData = {
    ...form.value,
    year: selectedYear.value,
    level: selectedLevel.value
  }

  if (!needsTimeInput.value) {
    formData.start_time = null
    formData.end_time = null
  }
  if (!needsPeriodInput.value) {
    formData.start_period = null
    formData.end_period = null
  }

  if (formData.event_type === 'cancel' && formData.timetable_id) {
    const selected = timetableOpts.value.find(t => t.id === formData.timetable_id)
    if (selected) {
      formData.subject_id = selected.subject_id
      formData.year = selected.year
      formData.level = selected.level
      formData.start_period = selected.start_period
      formData.end_period = selected.end_period
    }
  }

  try {
    loading.value = true
    if (props.isEditMode) {
      await updateEvent(formData.id, formData)
    } else {
      await createEvent(formData)
    }
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('저장 실패:', error)
    alert('저장 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

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
    console.error('삭제 실패:', e)
    alert('삭제 중 오류')
  } finally {
    loading.value = false
  }
}

// =========================================================
// 9. 폼 검증 함수
// =========================================================
const validateForm = () => {
  const requiredFields = {
    event_type: '이벤트 유형',
    event_date: '날짜'
  }

  if (form.value.event_type === 'cancel') {
    requiredFields.timetable_id = '수업'
  } else if (['makeup', 'special'].includes(form.value.event_type)) {
    requiredFields.subject_id = '과목'
    requiredFields.start_period = '시작 교시'
    requiredFields.end_period = '종료 교시'
    requiredFields.year = '학년'
  } else if (form.value.event_type === 'event') {
    requiredFields.subject_id = '과목'
    requiredFields.start_time = '시작 시간'
    requiredFields.end_time = '종료 시간'
  }

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!form.value[field]) {
      alert(`${label}을(를) 입력해주세요.`)
      return false
    }
  }

  if (needsTimeInput.value && form.value.start_time >= form.value.end_time) {
    alert('종료 시간은 시작 시간보다 늦어야 합니다.')
    return false
  }

  if (needsPeriodInput.value && form.value.start_period >= form.value.end_period) {
    alert('종료 교시는 시작 교시보다 커야 합니다.')
    return false
  }

  return true
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

.modal-wrapper {
  max-height: 85vh;
  overflow: auto;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
}

.form-layout {
  display: block;
}

.edit-form {
  width: 100%;
}

.original-info-top {
  margin-bottom: 20px;
  background: #fff3bf;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ffd43b;
  font-size: 0.95em;
}

.original-info-top .info-box {
  margin: 0;
}

.original-info-top .info-label {
  font-weight: 600;
  color: #e67700;
  margin-bottom: 6px;
  font-size: 0.9em;
}

.original-info-top .info-content {
  color: #495057;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9em;
  color: #495057;
}

input, select, textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95em;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-primary {
  background: #4263eb;
  color: white;
}

.btn-secondary {
  background: #868e96;
  color: white;
}

.btn-danger {
  background: #fa5252;
  color: white;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
