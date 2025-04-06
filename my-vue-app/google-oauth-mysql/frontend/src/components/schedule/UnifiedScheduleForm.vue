<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? titles.edit : titles.create }}</h3>
      <form @submit.prevent="handleSubmit">
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
  getSpecialLectures, getSubjectsForEvent, getSubjectsByYear
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
const form = ref({
  id: null,
  event_type: props.formType || '',
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
const availableTimeSlots = ref([]) // 사용 가능한 시간대

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
          const { specialLectures } = await getSpecialLectures({ level: lvl, group_level: grp, semester: props.semester })
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

/* ----------------- Watch 과목 및 시간표 로딩 ----------------- */
watch(
    [() => form.value?.event_type, classType, selectedYear, selectedLevel],
    async ([eventType, type, yr, lvl]) => {
      if (!eventType) return

      try {
        console.log('과목 로딩 시작:', { eventType, type, yr, lvl })
        
        // 이벤트 타입이 변경될 때마다 초기화
        subjectOpts.value = []
        timetableOpts.value = []
        
        // 정규 수업
        if (eventType === 'regular') {
          if (yr) {
            console.log('정규 수업 로딩 시작:', { year: yr })
            const { subjects } = await getSubjectsByYear(yr)
            subjectOpts.value = subjects || []
            console.log('정규 수업 로드 결과:', { 
                total: subjects?.length,
                filtered: subjectOpts.value?.length,
                subjects: subjectOpts.value 
            })
          }
        }
        // 특강
        else if (eventType === 'special') {
          if (lvl) {
            const { specialLectures } = await getSpecialLectures({ 
              level: lvl,
              group_level: groupLevelProxy.value,
              semester: props.semester
            })
            subjectOpts.value = specialLectures
            console.log('특강 과목 로드:', { level: lvl, subjects: subjectOpts.value })
          }
        }
        // 휴강
        else if (eventType === 'cancel') {
          if (type === 'regular' && yr) {
            const { subjects } = await getSubjectsByYear({ year: yr })
            subjectOpts.value = subjects.filter(s => !s.is_special_lecture)
            console.log('휴강-정규 과목 로드:', { year: yr, subjects: subjectOpts.value })
          } else if (type === 'special' && lvl) {
            const { specialLectures } = await getSpecialLectures({ 
              level: lvl,
              group_level: groupLevelProxy.value,
              semester: props.semester
            })
            subjectOpts.value = specialLectures
            console.log('휴강-특강 과목 로드:', { level: lvl, subjects: subjectOpts.value })
          }
        }
        // 보강
        else if (eventType === 'makeup') {
          if (type === 'regular' && yr) {
            const { subjects } = await getSubjectsByYear({ year: yr })
            subjectOpts.value = subjects.filter(s => !s.is_special_lecture)
            console.log('보강-정규 과목 로드:', { year: yr, subjects: subjectOpts.value })
          } else if (type === 'special' && lvl) {
            const { specialLectures } = await getSpecialLectures({ 
              level: lvl,
              group_level: groupLevelProxy.value,
              semester: props.semester
            })
            subjectOpts.value = specialLectures
            console.log('보강-특강 과목 로드:', { level: lvl, subjects: subjectOpts.value })
          }
        }

        // 휴강인 경우 시간표도 로드
        if (eventType === 'cancel' && form.value?.day) {
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

// 시간표 로딩 함수
async function loadTimetables() {
  try {
    console.log('시간표 로딩 시작:', { 
      semester: props.semester,
      day: form.value.day,
      classType: classType.value,
      year: selectedYear.value,
      level: selectedLevel.value
    })

    const params = { 
      semester: props.semester,
      day: form.value.day
    }

    // 정규 수업인 경우 학년 필터 추가
    if (classType.value === 'regular' && selectedYear.value) {
      params.year = selectedYear.value
      params.is_special_lecture = 0  // 정규 수업만 조회
    }
    // 특강인 경우 레벨 필터 추가
    else if (classType.value === 'special' && selectedLevel.value) {
      params.level = selectedLevel.value
      params.is_special_lecture = 1  // 특강만 조회
    }

    console.log('시간표 로딩 파라미터:', params)
    const timetables = await fetchTimetables(params)
    console.log('로딩된 시간표:', timetables)

    // 수업 정보 가공
    timetableOpts.value = timetables
      .filter(tt => {
        if (classType.value === 'regular') {
          // 정규 수업: year가 있고 is_special_lecture가 0인 경우
          return tt.year && tt.is_special_lecture === 0
        } else if (classType.value === 'special') {
          // 특강: level이 있고 is_special_lecture가 1인 경우
          return tt.level && tt.is_special_lecture === 1
        }
        return false
      })
      .map(tt => ({
        ...tt,
        display_name: `[${tt.level || (tt.year + '학년')}] ${tt.subject_name} ${tt.group_level ? `(${tt.group_level}분반)` : ''} - ${tt.start_period}~${tt.end_period}교시`
      }))

    console.log('가공된 시간표:', {
      type: classType.value,
      filtered: timetableOpts.value,
      count: timetableOpts.value.length
    })
  } catch (error) {
    console.error('시간표 로딩 실패:', error)
    timetableOpts.value = []
  }
}

// 요일 변경 시 시간표 로드
watch(() => form.value.day, async (newDay) => {
  if (form.value.event_type === 'cancel' && newDay) {
    await loadTimetables()
  }
})

// 수업 선택 시 자동 필드 설정
watch(() => form.value.timetable_id, async (newId) => {
  if (!newId) return
  
  const selected = timetableOpts.value.find(t => t.id === newId)
  if (!selected) return

  // 공통 필드 설정
  form.value.subject_id = selected.subject_id
  form.value.year = selected.year
  form.value.level = selected.level
  form.value.group_levels = selected.group_level ? [selected.group_level] : []

  // 휴강인 경우 시간 정보도 복사
  if (form.value.event_type === 'cancel') {
    form.value.start_period = selected.start_period
    form.value.end_period = selected.end_period
  }
  // 보강인 경우 시간대 제한 계산
  else if (form.value.event_type === 'makeup') {
    await updateAvailableTimeSlots(selected)
  }
})

// 이벤트 타입 변경 시 초기화 및 기본값 설정
watch(() => form.value.event_type, (newType) => {
  // 공통 필드 초기화
  form.value.subject_id = ''
  form.value.timetable_id = null
  form.value.start_period = null
  form.value.end_period = null
  form.value.start_time = null
  form.value.end_time = null
  form.value.day = ''
  
  // 타입별 기본값 설정
  if (newType === 'regular') {
    form.value.year = selectedYear.value
    classType.value = 'regular'
  } else if (newType === 'special') {
    form.value.start_period = 1
    form.value.end_period = 1
    classType.value = 'special'
  } else if (newType === 'cancel') {
    // 휴강은 수업 선택 시 자동으로 채워짐
    classType.value = 'regular'  // 기본값은 정규 수업
  } else if (newType === 'makeup') {
    form.value.start_period = 1
    form.value.end_period = 1
    classType.value = 'regular'  // 기본값은 정규 수업
  } else if (newType === 'event') {
    form.value.start_time = '09:00'
    form.value.end_time = '18:00'
  }
})

/* ----------------- 사용 가능한 시간대 계산 ----------------- */
async function updateAvailableTimeSlots(originalClass) {
  try {
    // 원본 수업의 시간대만 제한
    const restrictedPeriods = new Set()
    for (let i = originalClass.start_period; i <= originalClass.end_period; i++) {
      restrictedPeriods.add(i)
    }
    
    // 모든 교시 중에서 원본 수업 시간대만 제외
    const allPeriods = Array.from({length: 9}, (_, i) => i + 1)
    availableTimeSlots.value = allPeriods.filter(p => !restrictedPeriods.has(p))
  } catch (error) {
    console.error('시간대 계산 실패:', error)
    availableTimeSlots.value = []
  }
}

/* ----------------- Computed properties for form validation and display logic ----------------- */
const needsTimeInput = computed(() => {
  return form.value?.event_type === 'event'  // 일반 이벤트만 시간 입력
})

const needsPeriodInput = computed(() => {
  return ['regular', 'cancel', 'makeup', 'special'].includes(form.value?.event_type || '')
})

const needsSubjectSelect = computed(() => {
  return ['regular', 'makeup', 'special', 'event'].includes(form.value?.event_type || '')
})

const needsTimetableSelect = computed(() => {
  return form.value?.event_type === 'cancel'
})

const needsYearInput = computed(() => {
  // 정규 수업과 정규 수업 관련 휴강/보강에서만 학년 선택 필요
  return form.value?.event_type === 'regular' || 
         (['cancel', 'makeup'].includes(form.value?.event_type || '') && classType.value === 'regular')
})

const needsGroupLevel = computed(() => {
  // 특강과 특강 관련 휴강/보강에서만 분반 선택 필요
  return form.value?.event_type === 'special' || 
         (['cancel', 'makeup'].includes(form.value?.event_type || '') && classType.value === 'special')
})

const showGroupLevel = computed(() => {
  return ['special', 'makeup'].includes(form.value?.event_type || '')
})

const groupLevelOptions = ['A', 'B']
const yearOptions = [1, 2, 3]
const dayOptions = ['월', '화', '수', '목', '금']
const availablePeriods = Array.from({length: 9}, (_, i) => i + 1)

/* ----------------- Form validation ----------------- */
const validateForm = () => {
  // 공통 필수 필드
  const requiredFields = {
    event_type: '이벤트 유형',
    event_date: '날짜'
  }

  // 이벤트 타입별 필수 필드
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

  // 필수 필드 검증
  for (const [field, label] of Object.entries(requiredFields)) {
    if (!form.value[field]) {
      alert(`${label}을(를) 입력해주세요.`)
      return false
    }
  }

  // 시간 범위 검증
  if (needsTimeInput.value) {
    if (form.value.start_time >= form.value.end_time) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.')
      return false
    }
  }

  if (needsPeriodInput.value) {
    if (form.value.start_period >= form.value.end_period) {
      alert('종료 교시는 시작 교시보다 커야 합니다.')
      return false
    }
  }

  return true
}

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

/* ----------------- 저장 함수 수정 ----------------- */
const handleSubmit = async () => {
  if (!validateForm()) return

  const formData = {
    ...form.value,
    year: selectedYear.value,
    level: selectedLevel.value
  }

  // null 처리
  if (!needsTimeInput.value) {
    formData.start_time = null
    formData.end_time = null
  }
  if (!needsPeriodInput.value) {
    formData.start_period = null
    formData.end_period = null
  }

  // 휴강인 경우 timetable에서 정보 복사
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

  console.log('📝 등록할 데이터:', formData)

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

// Computed properties for conditional rendering
const needsLevelInput = computed(() => {
  return form.value?.event_type === 'special' || 
         (classType.value === 'special' && ['cancel', 'makeup'].includes(form.value?.event_type || ''))
})

const needsDayInput = computed(() => {
  return ['regular', 'special', 'cancel'].includes(form.value?.event_type || '')
})

const needsDateInput = computed(() => {
  return ['cancel', 'makeup', 'event'].includes(form.value?.event_type || '')
})

// Filtered subjects based on type and year/level
const filteredSubjects = computed(() => {
    if (!subjectOpts.value?.length) return []
    
    console.log('필터링 전 과목:', {
        type: form.value?.event_type,
        classType: classType.value,
        year: selectedYear.value,
        level: selectedLevel.value,
        subjects: subjectOpts.value
    })
    
    let filtered = []
    if (form.value?.event_type === 'regular') {
        // 정규 수업인 경우
        filtered = subjectOpts.value.filter(s => 
            (!s.is_special_lecture || s.is_special_lecture === 0) && 
            (!s.year || s.year === selectedYear.value)
        )
    } else if (form.value?.event_type === 'special') {
        // 특강인 경우 - level만 확인 (이미 getSpecialLectures API에서 특강만 가져옴)
        filtered = subjectOpts.value.filter(s => 
            (!s.level || s.level === selectedLevel.value)
        )
    } else if (classType.value === 'special' && ['cancel', 'makeup'].includes(form.value?.event_type)) {
        // 특강 휴강/보강인 경우
        filtered = subjectOpts.value.filter(s => 
            (!s.level || s.level === selectedLevel.value)
        )
    } else if (classType.value === 'regular' && ['cancel', 'makeup'].includes(form.value?.event_type)) {
        // 정규 수업 휴강/보강인 경우
        filtered = subjectOpts.value.filter(s => 
            (!s.is_special_lecture || s.is_special_lecture === 0) && 
            (!s.year || s.year === selectedYear.value)
        )
    } else {
        filtered = subjectOpts.value
    }
    
    console.log('필터링 후 과목:', {
        filtered,
        count: filtered.length,
        criteria: {
            type: form.value?.event_type,
            classType: classType.value,
            year: selectedYear.value,
            level: selectedLevel.value
        }
    })
    return filtered
})

/* ----------------- Computed properties for template ----------------- */
const isCancelOrMakeup = computed(() => isCancel.value || isMakeup.value)
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
