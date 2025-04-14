<template>
  <div class="schedule-form">
    <h3 class="form-title">{{ formTitle }}</h3>
    
    <!-- 이벤트 유형 선택 -->
    <div class="form-group" v-if="showTypeSelection">
      <label>등록 유형:</label>
      <select v-model="formData.type" class="form-control" @change="handleTypeChange">
        <option value="regular">정규 수업</option>
        <option value="topik">TOPIK 수업 (레벨 기반)</option>
        <option value="special">특강</option>
        <option value="makeup" v-if="allowMakeup">보강</option>
        <option value="cancel" v-if="allowCancel">휴강</option>
      </select>
    </div>
    
    <!-- 일반 정규 수업 입력 필드 (정규 수업 & TOPIK 공통) -->
    <template v-if="isRegularClass || isTopikClass">
      <div class="form-group" v-if="isRegularClass">
        <label>학년:</label>
        <select v-model="formData.grade" class="form-control">
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>
      </div>
      
      <!-- TOPIK 수업은 레벨 선택 필요 -->
      <div class="form-group" v-if="isTopikClass">
        <label>레벨:</label>
        <select v-model="formData.level" class="form-control">
          <option value="TOPIK4">TOPIK4</option>
          <option value="TOPIK6">TOPIK6</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>과목:</label>
        <select v-model="formData.subject_id" class="form-control">
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>요일:</label>
        <select v-model="formData.day" class="form-control">
          <option value="1">월요일</option>
          <option value="2">화요일</option>
          <option value="3">수요일</option>
          <option value="4">목요일</option>
          <option value="5">금요일</option>
        </select>
      </div>
      
      <div class="form-row">
        <div class="form-group half">
          <label>시작 교시:</label>
          <select v-model="formData.start_period" class="form-control">
            <option v-for="period in 9" :key="`start-${period}`" :value="period">{{ period }}교시</option>
          </select>
        </div>
        
        <div class="form-group half">
          <label>종료 교시:</label>
          <select v-model="formData.end_period" class="form-control">
            <option v-for="period in 9" :key="`end-${period}`" :value="period" 
                    :disabled="period < formData.start_period">
              {{ period }}교시
            </option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>교수명:</label>
        <input type="text" v-model="formData.professor_name" class="form-control" placeholder="교수명 입력">
      </div>
      
      <div class="form-group">
        <label>강의실:</label>
        <input type="text" v-model="formData.room" class="form-control" placeholder="강의실 입력">
      </div>
      
      <div class="form-group">
        <label>학기:</label>
        <select v-model="formData.semester" class="form-control">
          <option value="spring">봄학기</option>
          <option value="summer">여름학기</option>
          <option value="fall">가을학기</option>
          <option value="winter">겨울학기</option>
        </select>
      </div>
    </template>
    
    <!-- 특강 입력 필드 -->
    <template v-if="isSpecialClass">
      <div class="form-group">
        <label>레벨:</label>
        <select v-model="formData.level" class="form-control">
          <option value="N1">JLPT N1</option>
          <option value="N2">JLPT N2</option>
          <option value="N3">JLPT N3</option>
        </select>
      </div>
      
      <!-- 분반 선택 UI 추가 -->
      <div class="form-group">
        <label>분반:</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="groupLevels.beginner">
            A반
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="groupLevels.intermediate">
            B반
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="groupLevels.advanced">
            C반
          </label>
        </div>
        <small class="form-text text-muted">아무것도 선택하지 않으면 모든 분반에 표시됩니다.</small>
      </div>
      
      <div class="form-group">
        <label>과목:</label>
        <select v-model="formData.subject_id" class="form-control">
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>요일:</label>
        <select v-model="formData.day" class="form-control">
          <option value="1">월요일</option>
          <option value="2">화요일</option>
          <option value="3">수요일</option>
          <option value="4">목요일</option>
          <option value="5">금요일</option>
        </select>
      </div>
      
      <div class="form-row">
        <div class="form-group half">
          <label>시작 교시:</label>
          <select v-model="formData.start_period" class="form-control">
            <option v-for="period in 9" :key="`start-${period}`" :value="period">{{ period }}교시</option>
          </select>
        </div>
        
        <div class="form-group half">
          <label>종료 교시:</label>
          <select v-model="formData.end_period" class="form-control">
            <option v-for="period in 9" :key="`end-${period}`" :value="period" 
                    :disabled="period < formData.start_period">
              {{ period }}교시
            </option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>교수명:</label>
        <input type="text" v-model="formData.professor_name" class="form-control" placeholder="교수명 입력">
      </div>
      
      <div class="form-group">
        <label>강의실:</label>
        <input type="text" v-model="formData.room" class="form-control" placeholder="강의실 입력">
      </div>
      
      <div class="form-group">
        <label>학기:</label>
        <select v-model="formData.semester" class="form-control">
          <option value="spring">봄학기</option>
          <option value="summer">여름학기</option>
          <option value="fall">가을학기</option>
          <option value="winter">겨울학기</option>
        </select>
      </div>
    </template>
    
    <!-- 휴강 입력 필드 -->
    <template v-if="isCancelClass">
      <div class="form-group">
        <label>휴강 날짜:</label>
        <input type="date" v-model="formData.date" class="form-control">
      </div>
      
      <template v-if="selectedTimetable">
        <div class="timetable-info">
          <p><strong>과목:</strong> {{ selectedTimetable.subject_name }}</p>
          <p><strong>교시:</strong> {{ selectedTimetable.start_period }}~{{ selectedTimetable.end_period }}교시</p>
          <p><strong>교수명:</strong> {{ selectedTimetable.professor_name }}</p>
          <p><strong>강의실:</strong> {{ selectedTimetable.room }}</p>
        </div>
      </template>
      
      <div class="form-group">
        <label>휴강 사유:</label>
        <textarea v-model="formData.reason" class="form-control" placeholder="휴강 사유를 입력하세요"></textarea>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.inherit_attributes">
          기존 수업 정보 상속
        </label>
      </div>
    </template>
    
    <!-- 보강 입력 필드 -->
    <template v-if="isMakeupClass">
      <div class="form-group">
        <label>보강 날짜:</label>
        <input type="date" v-model="formData.date" class="form-control">
      </div>
      
      <div class="form-group" v-if="!selectedTimetable">
        <label>과목:</label>
        <select v-model="formData.subject_id" class="form-control">
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>
      
      <template v-if="selectedTimetable">
        <div class="timetable-info">
          <p><strong>과목:</strong> {{ selectedTimetable.subject_name }}</p>
          <p><strong>원래 교시:</strong> {{ selectedTimetable.start_period }}~{{ selectedTimetable.end_period }}교시</p>
        </div>
      </template>
      
      <div class="form-row">
        <div class="form-group half">
          <label>시작 교시:</label>
          <select v-model="formData.start_period" class="form-control">
            <option v-for="period in 9" :key="`start-${period}`" :value="period">{{ period }}교시</option>
          </select>
        </div>
        
        <div class="form-group half">
          <label>종료 교시:</label>
          <select v-model="formData.end_period" class="form-control">
            <option v-for="period in 9" :key="`end-${period}`" :value="period" 
                    :disabled="period < formData.start_period">
              {{ period }}교시
            </option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>교수명:</label>
        <input type="text" v-model="formData.professor_name" class="form-control" placeholder="교수명 입력">
      </div>
      
      <div class="form-group">
        <label>강의실:</label>
        <input type="text" v-model="formData.room" class="form-control" placeholder="강의실 입력">
      </div>
      
      <div class="form-group">
        <label>보강 사유:</label>
        <textarea v-model="formData.reason" class="form-control" placeholder="보강 사유를 입력하세요"></textarea>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.inherit_attributes">
          기존 수업 정보 상속
        </label>
      </div>
    </template>
    
    <div class="form-buttons">
      <button
        type="button"
        class="cancel-button"
        @click="handleCancel"
      >
        {{ i18n.t('common.cancel') }}
      </button>
      <button
        type="submit"
        class="submit-button"
        :disabled="isSubmitting"
        @click.prevent="handleSubmit"
      >
        {{ isSubmitting ? i18n.t('common.submitting') : i18n.t('common.submit') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
// import { useSubjectStore } from '@/store/modules/subject'
// import { useTimetableStore } from '@/store/modules/timetable'
// import { useI18n } from 'vue-i18n'
// import { useStore } from 'vuex'
import DetailEventModal from '../../modals/DetailEventModal.vue'
import { getSemesterRange } from '@/utils/semester.js'

// Simple toast replacement
const simpleToast = {
  success: (message) => {
    console.log('Success:', message)
    alert(message)
  },
  error: (message) => {
    console.error('Error:', message)
    alert('Error: ' + message)
  }
}

// Mock timetableStore until the proper store is available
const timetableStore = {
  getCurrentSemester: () => 'spring',
  // Add other needed methods
}

// Props
const props = defineProps({
  eventType: {
    type: String,
    default: 'regular' // 'regular', 'topik', 'special', 'makeup', 'cancel'
  },
  showTypeSelection: {
    type: Boolean,
    default: true
  },
  allowCancel: {
    type: Boolean,
    default: true
  },
  allowMakeup: {
    type: Boolean,
    default: true
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  timetableData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

// Emit events
const emit = defineEmits(['close', 'submit', 'cancel', 'error'])

// Mock stores for missing imports
const subjectStore = {
  filteredSubjects: ref([]),
  fetchSubjects() {
    console.log('Mock: Fetching subjects');
    return Promise.resolve([]);
  }
}

// Mock i18n implementation
const i18n = {
  t: (key) => key // Simply return the key as the translation
}

// Mock store implementation
const store = {
  state: {
    user: {
      role: 'student',
      grade: '1'
    }
  },
  dispatch: (action, payload) => {
    console.log(`Mock dispatch: ${action}`, payload);
    return Promise.resolve({});
  }
}

// Form state
const isSubmitting = ref(false)
const formData = reactive({
  type: props.eventType || 'regular',
  grade: '1',
  level: 'beginner',
  day: '1',
  start_period: 1,
  end_period: 1,
  professor_name: '',
  room: '',
  subject_id: '',
  semester: timetableStore.getCurrentSemester(),
  date: new Date().toISOString().split('T')[0],
  reason: '',
  inherit_attributes: true,
  year: new Date().getFullYear(),
  timetable_id: null,
  is_special_lecture: 0,
  group_levels: [],
  is_foreigner_target: 0 // 추가: 외국인 대상 여부 (TOPIK 수업용)
})

// For special lectures group levels UI
const groupLevels = ref({
  beginner: false,
  intermediate: false,
  advanced: false
})

// Type-based computed properties
const isRegularClass = computed(() => formData.type === 'regular')
const isSpecialClass = computed(() => formData.type === 'special')
const isTopikClass = computed(() => formData.type === 'topik')
const isCancelClass = computed(() => formData.type === 'cancel')
const isMakeupClass = computed(() => formData.type === 'makeup')

// Form title based on type
const formTitle = computed(() => {
  switch (formData.type) {
    case 'regular': return '정규 수업 등록'
    case 'topik': return 'TOPIK 수업 등록'
    case 'special': return '특강 등록'
    case 'makeup': return '보강 등록'
    case 'cancel': return '휴강 등록'
    default: return '수업 등록'
  }
})

// Convenience accessor for selected timetable
const selectedTimetable = computed(() => props.timetableData)

// Filtered subjects based on class type
const subjects = ref([])
const loading = ref(false)
const error = ref(null)

// Current semester
const currentSemester = ref(timetableStore.getCurrentSemester() || 'spring')

// For debug purposes
watch(() => formData.type, (newType) => {
  console.log(`Form type changed to: ${newType}`)
})

watch(() => formData.level, (newLevel) => {
  if (formData.type === 'special' || formData.type === 'topik') {
    console.log(`Level changed to: ${newLevel}, will refresh subjects`)
    fetchSubjects()
  }
})

watch(() => formData.grade, (newGrade) => {
  if (formData.type === 'regular') {
    console.log(`Grade changed to: ${newGrade}, will refresh subjects`)
    fetchSubjects()
  }
})

// Fetch subjects
const fetchSubjects = async () => {
  loading.value = true
  error.value = null
  
  try {
    let url = '/api/subjects/filter?'
    const params = new URLSearchParams()
    
    // Semester is required
    params.append('semester', currentSemester.value)
    
    if (formData.type === 'regular') {
      // Regular class: subjects by grade
      params.append('isSpecial', 'false')
      params.append('year', formData.grade)
      params.append('isForeigner', 'false')
      console.log(`Fetching regular subjects for grade ${formData.grade}`)
    } 
    else if (formData.type === 'topik') {
      // TOPIK class: subjects by TOPIK4/TOPIK6 level
      params.append('isSpecial', 'false')
      params.append('isForeigner', 'true')
      
      // TOPIK 레벨 직접 사용
      params.append('level', formData.level) // TOPIK4 또는 TOPIK6 그대로 사용
      console.log(`Fetching TOPIK subjects for level ${formData.level}`)
    }
    else if (formData.type === 'special') {
      // Special class: subjects by JLPT N1/N2/N3 level
      params.append('isSpecial', 'true')
      params.append('isForeigner', 'false')
      
      // 특강 레벨 처리 - 디버깅을 위해 로그 추가
      const specialLevel = formData.level  // 직접 N1, N2, N3 값 사용
      params.append('level', specialLevel)
      console.log(`🔍 Fetching special subjects (디버깅):`)
      console.log(`  - 레벨: ${specialLevel}`)
      console.log(`  - 학기: ${currentSemester.value}`)
      console.log(`  - isSpecial: true`)
      console.log(`  - isForeigner: false`)
    }
    
    console.log('🔍 Subjects lookup URL:', `${url}${params.toString()}`)
    
    // API call
    const response = await fetch(`${url}${params.toString()}`)
    const responseText = await response.text()  // 먼저 텍스트로 받아서 디버깅
    
    console.log('🔍 API 응답 원본:', responseText)
    
    // 텍스트를 JSON으로 변환
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseErr) {
      console.error('JSON 파싱 오류:', parseErr)
      throw new Error('응답을 파싱할 수 없습니다: ' + responseText)
    }
    
    if (data.success) {
      subjects.value = data.data || []
      console.log(`${formData.type} subjects loaded: ${subjects.value.length}`, subjects.value)
      
      // 특강인 경우 추가 로깅
      if (formData.type === 'special') {
        console.log('🔍 특강 과목 조회 결과:')
        if (subjects.value.length === 0) {
          console.log('  - 조회된 특강 과목이 없습니다!')
          console.log('  - 백엔드 API에 전달된 파라미터:', params.toString())
          console.log('  - DB에 해당 조건의 과목이 존재하는지 확인 필요')
        } else {
          console.log('  - 조회된 특강 과목:', subjects.value.map(s => ({
            id: s.id,
            name: s.name,
            level: s.level
          })))
        }
      }
    } else {
      throw new Error(data.message || 'Failed to load subjects')
    }
  } catch (err) {
    console.error('🚨 Subjects lookup error:', err)
    error.value = err.message || 'An error occurred while loading subjects'
    simpleToast.error(error.value)
  } finally {
    loading.value = false
  }
}

// Filtered subjects
const filteredSubjects = computed(() => {
  return subjects.value
})

// Handle form type change
const handleTypeChange = () => {
  // Reset form fields based on type
  if (isSpecialClass.value) {
    formData.is_special_lecture = 1
    formData.grade = null
    formData.level = 'N3' // 기본값 N3으로 설정
    formData.year = null  // 특강은 year 필드를 null로 설정
    formData.is_foreigner_target = 0 // 특강은 외국인 대상 아님
    // 분반값 기본 설정
    formData.group_levels = ["A", "B", "C"]
  } else if (isRegularClass.value) {
    formData.is_special_lecture = 0
    formData.level = null
    formData.year = new Date().getFullYear() // 정규 수업은 year 필드 설정
    formData.group_levels = [] // 정규 수업은 그룹 레벨 초기화
    formData.is_foreigner_target = 0 // 정규 수업은 외국인 대상 아님
  } else if (isTopikClass.value) {
    formData.is_special_lecture = 0
    formData.grade = null
    formData.level = 'TOPIK4' // 기본값 TOPIK4로 설정
    formData.year = null // TOPIK 수업은 year 필드를 null로 설정
    formData.group_levels = [] // TOPIK 수업은 그룹 레벨 초기화
    formData.is_foreigner_target = 1 // TOPIK 수업은 외국인 대상임
  }
  
  // 그룹 레벨 UI 업데이트
  updateGroupLevelsUI()
}

// 그룹 레벨 UI 업데이트 함수
const updateGroupLevelsUI = () => {
  if (isSpecialClass.value) {
    // 기본적으로 모든 그룹 레벨 활성화
    groupLevels.value = {
      beginner: true,
      intermediate: true,
      advanced: true
    }
  } else {
    // 특강이 아닌 경우 초기화
    groupLevels.value = {
      beginner: false,
      intermediate: false,
      advanced: false
    }
  }
}

// 초기화 - Props에서 초기 데이터 적용
onMounted(() => {
  loadInitialData()
  
  // 과목 목록 로드
  fetchSubjects()
  
  // 타입별 기본값 채우기
  setupDefaultsByType()
})

// 초기 데이터 로드
function loadInitialData() {
  // Initialize from props.initialData if provided
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    console.log('Loading initial data:', props.initialData)
    
    // Copy properties from initialData to formData
    Object.keys(props.initialData).forEach(key => {
      if (key in formData) {
        formData[key] = props.initialData[key]
      }
    })
    
    // Handle special lecture group levels
    if (formData.group_levels && Array.isArray(formData.group_levels)) {
      groupLevels.value.beginner = formData.group_levels.includes('beginner')
      groupLevels.value.intermediate = formData.group_levels.includes('intermediate')
      groupLevels.value.advanced = formData.group_levels.includes('advanced')
    }
  }
  
  // Initialize from timetableData for cancellation/makeup
  if (props.timetableData && (isCancelClass.value || isMakeupClass.value)) {
    console.log('Loading from timetable data:', props.timetableData)
    
    // Set timetable_id for reference
    formData.timetable_id = props.timetableData.id
    
    // Inherit attributes if enabled
    if (formData.inherit_attributes) {
      formData.professor_name = props.timetableData.professor_name || ''
      formData.room = props.timetableData.room || ''
      formData.subject_id = props.timetableData.subject_id || ''
      
      if (isMakeupClass.value) {
        // For makeup, copy the periods
        formData.start_period = props.timetableData.start_period || 1
        formData.end_period = props.timetableData.end_period || 1
      }
    }
  }
}

// 타입별 기본값 설정
function setupDefaultsByType() {
  const type = formData.type;
  
  // 타입별 기본값 설정
  switch(type) {
    case 'regular':
      formData.level = null;
      formData.is_foreigner_target = 0;
      formData.year = new Date().getFullYear();
      break;
      
    case 'topik':
      formData.grade = null; // TOPIK class is grade-independent
      formData.level = 'TOPIK4'; // 기본값 TOPIK4
      formData.is_special_lecture = 0;
      formData.is_foreigner_target = 1; // 외국인 대상
      formData.year = null; // year 필드 사용 안함
      break;
      
    case 'special':
      formData.grade = null; // Special class is grade-independent
      formData.level = 'N3'; // 기본값 N3
      formData.is_special_lecture = 1;
      formData.is_foreigner_target = 0; // 외국인 대상 아님
      formData.year = null; // year 필드 사용 안함
      // 분반값 기본 설정
      formData.group_levels = ["A", "B", "C"];
      break;
      
    case 'cancel':
    case 'makeup':
      // Default date is today
      formData.date = new Date().toISOString().split('T')[0];
      break;
  }
  
  // 그룹 레벨 UI 업데이트
  updateGroupLevelsUI();
}

// Watch for selected type changes
watch(() => formData.type, (newType) => {
  console.log(`Type changed: ${newType}`);
  setupDefaultsByType();
  fetchSubjects();
});

// Watch for grade or level changes
watch([() => formData.grade, () => formData.level], () => {
  fetchSubjects();
});

// Handle form submission
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    // Prepare form data for submission
    const payload = { ...formData }
    
    // Set fields based on class type before submitting
    if (isRegularClass.value) {
      // Regular class: set level to null and ensure year is set
      payload.level = null
      payload.group_levels = []
      payload.year = payload.year || new Date().getFullYear()
      payload.is_foreigner_target = 0
    } else if (isSpecialClass.value) {
      // Special class: set year to null and ensure level is set
      payload.year = null
      payload.grade = null
      payload.level = payload.level || 'N3'
      payload.group_levels = payload.group_levels || ["A", "B", "C"]
      payload.is_foreigner_target = 0
    } else if (isTopikClass.value) {
      // TOPIK class: set year to null and ensure level is set
      payload.year = null
      payload.grade = null
      payload.level = payload.level || 'TOPIK4'
      payload.group_levels = []
      payload.is_foreigner_target = 1
      payload.is_special_lecture = 0
    }
    
    // For debugging - log what we're about to submit
    console.log('Submitting form data:', payload)
    
    // 요일 변환 (숫자 → 한글)
    const dayMap = {
      '1': '월',
      '2': '화',
      '3': '수',
      '4': '목',
      '5': '금'
    }
    
    // 요일 필드가 숫자인 경우 한글로 변환
    if (payload.day && dayMap[payload.day]) {
      payload.day = dayMap[payload.day]
    }
    
    // API 호출 및 서버 응답 확인
    const response = await fetch('/api/timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    console.log('🔍 서버 응답 원본 텍스트:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
      console.log('🔍 서버 응답 파싱 결과:', data)
    } catch (parseErr) {
      console.error('서버 응답 파싱 오류:', parseErr)
      throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText)
    }
    
    if (response.ok) {
      console.log('✅ 이벤트 등록 성공:', data)
      simpleToast.success('Event registered successfully')
      emit('submit', payload)
    } else {
      console.error('❌ 이벤트 등록 실패:', data)
      throw new Error(data.message || 'Failed to register event')
    }
  } catch (err) {
    console.error('🚨 Submit error:', err)
    emit('error', err.message || 'An error occurred')
    simpleToast.error(err.message || 'An error occurred')
  } finally {
    isSubmitting.value = false
  }
}

// Cancel form
const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<style scoped>
.schedule-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.form-title {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-size: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  margin: 0 -8px;
}

.half {
  flex: 1;
  padding: 0 8px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

select.form-control {
  height: 38px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  margin-right: 6px;
}

.timetable-info {
  background-color: #f5f5f5;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.timetable-info p {
  margin: 8px 0;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
}

.cancel-button {
  background-color: #e5e7eb;
  color: #374151;
}

.cancel-button:hover {
  background-color: #d1d5db;
}

.submit-button {
  background-color: #4f46e5;
  color: white;
}

.submit-button:hover {
  background-color: #4338ca;
}

.submit-button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}
</style>
