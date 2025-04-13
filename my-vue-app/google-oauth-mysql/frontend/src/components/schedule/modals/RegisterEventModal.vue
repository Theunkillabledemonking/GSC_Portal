<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">{{ isEditing ? '수업 수정' : '수업 등록' }}</h3>
        <button class="close-button" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="title">수업 제목</label>
            <input 
              type="text" 
              id="title" 
              v-model="formData.title" 
              class="form-control" 
              required
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="classType">수업 유형</label>
              <select 
                id="classType" 
                v-model="formData.classType" 
                class="form-control" 
                required
              >
                <option 
                  v-for="(type, index) in classTypes" 
                  :key="index" 
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="studentType">학생 구분</label>
              <select 
                id="studentType" 
                v-model="formData.studentType" 
                class="form-control" 
                required
              >
                <option 
                  v-for="(type, index) in studentTypes" 
                  :key="index" 
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="day">요일</label>
              <select 
                id="day" 
                v-model="formData.day" 
                class="form-control" 
                required
              >
                <option 
                  v-for="(day, index) in weekDays" 
                  :key="index" 
                  :value="day.value"
                >
                  {{ day.label }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="room">강의실</label>
              <input 
                type="text" 
                id="room" 
                v-model="formData.room" 
                class="form-control"
                :disabled="formData.inherit_attributes && formData.timetable_id"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="startPeriod">시작 교시</label>
              <select 
                id="startPeriod" 
                v-model="formData.startPeriod" 
                class="form-control" 
                required
                @change="validatePeriods"
              >
                <option v-for="period in 9" :key="period" :value="period">
                  {{ period }}교시
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="endPeriod">종료 교시</label>
              <select 
                id="endPeriod" 
                v-model="formData.endPeriod" 
                class="form-control" 
                required
                @change="validatePeriods"
                :disabled="!formData.startPeriod"
              >
                <option 
                  v-for="period in remainingPeriods" 
                  :key="period" 
                  :value="period"
                >
                  {{ period }}교시
                </option>
              </select>
              <div v-if="periodError" class="error-message">{{ periodError }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="professor">담당 교수</label>
            <input 
              type="text" 
              id="professor" 
              v-model="formData.professor" 
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="grade">학년</label>
            <select 
              id="grade" 
              v-model="formData.grade" 
              class="form-control" 
              required
            >
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
              <option value="4">4학년</option>
              <option value="all">전체 학년</option>
            </select>
          </div>
          
          <!-- 교수명 -->
          <div class="form-group">
            <label>교수명</label>
            <input 
              v-model="formData.professor_name"
              type="text"
              placeholder="교수명을 입력하세요"
              :disabled="formData.inherit_attributes && formData.timetable_id"
            />
          </div>

          <!-- 정보 상속 옵션 -->
          <div class="form-group" v-if="formData.timetable_id">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="inherit_attributes" 
                v-model="formData.inherit_attributes"
                class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label for="inherit_attributes" class="text-sm">
                원본 수업의 교수명과 강의실 정보 사용
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="cancel-button" 
              @click="emit('close')"
            >
              취소
            </button>
            <button 
              type="submit" 
              class="submit-button"
              :disabled="!!periodError || isSubmitting"
            >
              {{ isSubmitting ? '저장 중...' : (isEditing ? '수정' : '등록') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable'

// Props 정의
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  event: {
    type: Object,
    default: null
  }
})

// Emits 정의
const emit = defineEmits(['close', 'submit'])

// Constants
const DAYS_OF_WEEK = [
  { value: 'mon', label: '월요일' },
  { value: 'tue', label: '화요일' },
  { value: 'wed', label: '수요일' },
  { value: 'thu', label: '목요일' },
  { value: 'fri', label: '금요일' }
]

const CLASS_TYPES = [
  { value: 'regular', label: '정규 수업' },
  { value: 'special', label: '특강' },
  { value: 'makeup', label: '보강' }
]

const STUDENT_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'foreigner', label: '유학생' },
  { value: 'korean', label: '한국인' }
]

// Store 사용
const timetableStore = useTimetableStore()

// 폼 데이터 초기화
const formData = ref({
  title: props.initialData?.title || '',
  day: props.initialData?.day || DAYS_OF_WEEK[0].value,
  startPeriod: props.initialData?.startPeriod || 1,
  endPeriod: props.initialData?.endPeriod || 1,
  room: props.initialData?.room || '',
  professor: '',
  classType: props.initialData?.type || 'regular',
  studentType: props.initialData?.student_type || 'all',
  grade: props.initialData?.grade?.toString() || '1',
  professor_name: props.initialData?.professor_name || '',
  timetable_id: props.initialData?.timetable_id || null,
  inherit_attributes: props.initialData?.inherit_attributes || false
})

const periodError = ref('')
const isSubmitting = ref(false)

// Computed properties
const isEditing = computed(() => !!props.event)
const weekDays = computed(() => DAYS_OF_WEEK)
const classTypes = computed(() => CLASS_TYPES)
const studentTypes = computed(() => STUDENT_TYPES)

// 시작 교시 이후의 가능한 교시들 계산
const remainingPeriods = computed(() => {
  if (!formData.value.startPeriod) return []
  return Array.from(
    { length: 9 - formData.value.startPeriod + 1 },
    (_, i) => formData.value.startPeriod + i
  )
})

// 이벤트 객체가 있으면 폼 데이터 초기화
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    formData.value = {
      id: newEvent.id,
      title: newEvent.title,
      day: newEvent.day,
      startPeriod: newEvent.start_period,
      endPeriod: newEvent.end_period,
      room: newEvent.room || '',
      professor: newEvent.professor || '',
      classType: newEvent.type || 'regular',
      studentType: newEvent.student_type || 'all',
      grade: newEvent.grade?.toString() || '1',
      isCancelled: newEvent.status === 'cancelled',
      isMakeup: newEvent.type === 'makeup',
      professor_name: newEvent.professor_name || '',
      timetable_id: newEvent.timetable_id || null,
      inherit_attributes: newEvent.inherit_attributes || false
    }
  }
}, { immediate: true })

// initialData가 변경되면 적용 (새 이벤트 추가 시)
watch(() => props.initialData, (newData) => {
  if (newData && !isEditing.value && Object.keys(newData).length > 0) {
    formData.value.day = newData.day || DAYS_OF_WEEK[0].value
    formData.value.startPeriod = newData.startPeriod || 1
    formData.value.endPeriod = newData.endPeriod || 1
    formData.value.classType = newData.type || 'regular'
    formData.value.studentType = newData.student_type || 'all'
    formData.value.grade = newData.grade?.toString() || '1'
    formData.value.professor_name = newData.professor_name || ''
    formData.value.room = newData.room || ''
    formData.value.timetable_id = newData.timetable_id || null
    formData.value.inherit_attributes = newData.inherit_attributes || false
    
    validatePeriods()
  }
}, { immediate: true })

// 교시 유효성 검사
const validatePeriods = () => {
  periodError.value = ''
  
  if (!formData.value.startPeriod || !formData.value.endPeriod) return
  
  if (formData.value.endPeriod < formData.value.startPeriod) {
    periodError.value = '종료 교시는 시작 교시보다 커야 합니다'
    formData.value.endPeriod = formData.value.startPeriod
  }
}

// 폼 제출 처리
const handleSubmit = async () => {
  validatePeriods()
  if (periodError.value) return
  
  isSubmitting.value = true
  
  try {
    // API에 전송할 데이터 형식으로 변환
    const eventData = {
      ...formData.value,
      grade: parseInt(formData.value.grade),
      type: formData.value.classType,
      start_period: formData.value.startPeriod,
      end_period: formData.value.endPeriod,
      student_type: formData.value.studentType,
      professor_name: formData.value.professor_name,
      room: formData.value.room,
      timetable_id: formData.value.timetable_id,
      inherit_attributes: formData.value.inherit_attributes
    }
    
    if (isEditing.value) {
      await timetableStore.updateEvent(eventData)
    } else {
      await timetableStore.registerEvent(eventData)
    }
    
    emit('submit', eventData)
  } catch (error) {
    console.error('이벤트 저장 오류:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #4b5563;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button, .submit-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  background-color: #e5e7eb;
  color: #4b5563;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
}

.submit-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.cancel-button:hover {
  background-color: #d1d5db;
}

.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}
</style> 