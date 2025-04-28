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
        취소
      </button>
      <button
        type="submit"
        class="submit-button"
        :disabled="isSubmitting"
        @click.prevent="handleSubmit"
      >
        {{ isSubmitting ? '처리 중...' : '확인' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, toRaw } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable'
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

const props = defineProps({
  eventType: { type: String, default: 'regular' },
  showTypeSelection: { type: Boolean, default: true },
  allowCancel: { type: Boolean, default: true },
  allowMakeup: { type: Boolean, default: true },
  initialData: { type: Object, default: () => ({}) },
  timetableData: { type: Object, default: () => ({}) },
  isEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'cancel', 'error'])
const timetableStore = useTimetableStore()

const isSubmitting = ref(false)
const formData = reactive({
  ...toRaw(props.initialData),
  id: props.initialData?.id || null,
  timetable_id: props.initialData?.timetable_id || null,
  type: props.eventType || 'regular',
  grade: props.initialData?.grade || '1',
  level: props.initialData?.level || 'beginner',
  day: props.initialData?.day || '1',
  start_period: props.initialData?.start_period || 1,
  end_period: props.initialData?.end_period || 1,
  professor_name: props.initialData?.professor_name || '',
  room: props.initialData?.room || '',
  subject_id: props.initialData?.subject_id || '',
  subject_name: props.initialData?.subject_name || '',
  semester: props.initialData?.semester || getCurrentSemesterObject(),
  date: props.initialData?.date || new Date().toISOString().split('T')[0],
  reason: props.initialData?.reason || '',
  inherit_attributes: props.initialData?.inherit_attributes !== false,
  year: props.initialData?.year || new Date().getFullYear(),
  is_special_lecture: determineSpecialLectureValue(props.initialData),
  group_levels: props.initialData?.group_levels || [],
  is_foreigner_target: props.initialData?.is_foreigner_target || 0
})

// Helper function to get current semester and year
function getCurrentSemesterObject() {
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = now.getFullYear();
  
  // First half: March to August, Second half: September to February
  const half = month >= 3 && month <= 8 ? 1 : 2;
  
  return {
    year: currentYear,
    half: half
  };
}

// Helper function to determine is_special_lecture value
function determineSpecialLectureValue(data) {
  if (!data) return 0;
  
  // For TOPIK classes
  if (data.type === 'topik' || data.event_type === 'topik' || 
      (data.level && String(data.level).includes('TOPIK')) ||
      data.is_foreigner_target === 1) {
    return 2; // TOPIK is represented as is_special_lecture = 2
  }
  
  // For special lectures
  if (data.type === 'special' || data.event_type === 'special' ||
      (data.level && String(data.level).startsWith('N'))) {
    return 1; // Special lectures are represented as is_special_lecture = 1
  }
  
  // Return the original value if present, otherwise 0
  return data.is_special_lecture !== undefined ? data.is_special_lecture : 0;
}

const groupLevels = ref({ beginner: false, intermediate: false, advanced: false })

const isRegularClass = computed(() => formData.type === 'regular')
const isSpecialClass = computed(() => formData.type === 'special')
const isTopikClass = computed(() => formData.type === 'topik')
const isCancelClass = computed(() => formData.type === 'cancel')
const isMakeupClass = computed(() => formData.type === 'makeup')

const formTitle = computed(() => {
  const action = props.isEdit ? '수정' : '등록';
  return {
    regular: `정규 수업 ${action}`,
    special: `특강 ${action}`,
    topik: `TOPIK 수업 ${action}`,
    makeup: `보강 ${action}`,
    cancel: `휴강 ${action}`
  }[formData.type] || `일정 ${action}`
})

const selectedTimetable = computed(() => props.timetableData)
const subjects = ref([])
const loading = ref(false)
const error = ref(null)
const currentSemester = ref(getCurrentSemesterObject())

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
    
    // Semester is required - convert to string format
    params.append('semester', JSON.stringify(currentSemester.value))
    
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
  console.log(`타입 변경: ${formData.type}`);
  
  // 이전 유형의 값 임시 저장
  const previousData = {
    professor_name: formData.professor_name,
    room: formData.room
  };
  
  // 유형별 기본값 설정
  setupDefaultsByType();
  
  // 이전 값 중 교수명과 강의실 등 공통 정보는 보존
  if (previousData.professor_name) {
    formData.professor_name = previousData.professor_name;
  }
  
  if (previousData.room) {
    formData.room = previousData.room;
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
      // 휴강 또는 보강
      formData.date = new Date().toISOString().split('T')[0];
      
      // 선택된 시간표 데이터가 있으면 정보 상속
      if (props.timetableData) {
        formData.timetable_id = props.timetableData.id;
        formData.subject_id = props.timetableData.subject_id;
        if (props.timetableData.subject_name) {
          formData.subject_name = props.timetableData.subject_name;
        }
        
        // 휴강은 원본 정보 그대로, 보강은 날짜만 변경
        if (type === 'cancel') {
          formData.day = props.timetableData.day;
          formData.start_period = props.timetableData.start_period;
          formData.end_period = props.timetableData.end_period;
        }
        
        // 이 값들은 inherit_attributes 플래그에 따라 상속 여부 결정
        formData.grade = props.timetableData.grade;
        formData.professor_name = props.timetableData.professor_name;
        formData.room = props.timetableData.room;
        formData.is_special_lecture = props.timetableData.is_special_lecture;
        formData.is_foreigner_target = props.timetableData.is_foreigner_target;
        formData.level = props.timetableData.level;
      }
      break;
  }
  
  if (type !== 'special') {
    updateGroupLevelsUI(false);
  }
}

// 특강 분반 UI 업데이트
function updateGroupLevelsUI(isSpecial = false) {
  if (isSpecial) {
    groupLevels.value = { beginner: true, intermediate: true, advanced: true };
  } else {
    groupLevels.value = { beginner: false, intermediate: false, advanced: false };
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  console.log('폼 제출:', formData.type, formData);
  
  try {
    isSubmitting.value = true
    
    // 1. 폼 유효성 검사 - 필수 필드 확인
    const requiredFields = {
      regular: ['grade', 'subject_id', 'day', 'start_period', 'end_period'],
      special: ['level', 'subject_id', 'day', 'start_period', 'end_period'],
      topik: ['level', 'subject_id', 'day', 'start_period', 'end_period'],
      cancel: ['date', 'timetable_id'],
      makeup: ['date', 'day', 'start_period', 'end_period']
    };
    
    const missingFields = (requiredFields[formData.type] || []).filter(field => 
      !formData[field] && formData[field] !== 0
    );
    
    if (missingFields.length > 0) {
      const fieldNames = {
        grade: '학년',
        level: '레벨',
        subject_id: '과목',
        day: '요일',
        start_period: '시작 교시',
        end_period: '종료 교시',
        date: '날짜',
        timetable_id: '수업 정보'
      };
      
      const missingFieldNames = missingFields.map(field => fieldNames[field] || field).join(', ');
      simpleToast.error(`필수 입력 필드를 확인해주세요: ${missingFieldNames}`);
      return;
    }
    
    // 2. 특수 필드 처리 - 타입별 플래그 설정
    if (formData.type === 'topik') {
      formData.is_special_lecture = 2;
      formData.is_foreigner_target = 1;
    } else if (formData.type === 'special') {
      formData.is_special_lecture = 1;
      formData.is_foreigner_target = 0;
    } else {
      formData.is_special_lecture = 0;
      formData.is_foreigner_target = 0;
    }
    
    // 3. 분반 데이터 변환 (특강인 경우)
    if (isSpecialClass.value) {
      formData.group_levels = [];
      if (groupLevels.value.beginner) formData.group_levels.push('A');
      if (groupLevels.value.intermediate) formData.group_levels.push('B');
      if (groupLevels.value.advanced) formData.group_levels.push('C');
    }
    
    // 요일 변환 (숫자 → 한글)
    const dayMap = {
      '1': '월',
      '2': '화',
      '3': '수',
      '4': '목',
      '5': '금'
    }
    
    // 요일 필드가 숫자인 경우 한글로 변환
    if (formData.day && dayMap[formData.day]) {
      formData.day = dayMap[formData.day]
    }
    
    // 4. API 호출 - 타입별로 분기 처리
    let result;
    
    if (isCancelClass.value) {
      // 휴강 처리
      result = await timetableStore.registerCancellation({
        ...formData,
        timetable_id: formData.timetable_id || (props.timetableData ? props.timetableData.id : null),
        event_type: 'cancel',
        event_date: formData.date,
        inherit_attributes: formData.inherit_attributes ? 1 : 0
      });
    } else if (isMakeupClass.value) {
      // 보강 처리
      result = await timetableStore.registerMakeup({
        ...formData,
        timetable_id: formData.timetable_id || (props.timetableData ? props.timetableData.id : null),
        event_type: 'makeup',
        event_date: formData.date,
        inherit_attributes: formData.inherit_attributes ? 1 : 0
      });
    } else {
      // 정규 수업, 특강, TOPIK 수업 등록/수정
      const payload = {
        ...formData,
        type: formData.type,
        event_type: formData.type,
        is_special_lecture: formData.is_special_lecture,
        is_foreigner_target: formData.is_foreigner_target
      };
      
      if (props.isEdit && formData.id) {
        // 수정 - use registerScheduleItem for both create and update
        result = await timetableStore.registerScheduleItem(payload);
      } else {
        // 신규 등록
        result = await timetableStore.registerScheduleItem(payload);
      }
    }
    
    // 결과 처리
    console.log('API 응답:', result);
    simpleToast.success(props.isEdit ? '수업이 수정되었습니다.' : '수업이 등록되었습니다.');
    emit('submit', result);
    emit('close');
  } catch (err) {
    console.error('🚨 Submit error:', err);
    emit('error', err?.response?.data?.message || err.message || 'An error occurred');
    simpleToast.error(err?.response?.data?.message || err.message || 'An error occurred');
  } finally {
    isSubmitting.value = false;
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
