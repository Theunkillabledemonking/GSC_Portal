<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">이벤트 상세 정보</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body" v-if="event">
        <div class="event-item">
          <div class="event-header">이벤트 제목</div>
          <div class="event-title">{{ event.title }}</div>
        </div>
        
        <div class="event-item">
          <div class="event-header">유형</div>
          <div class="event-type">{{ getEventTypeText(event.type) }}</div>
        </div>
        
        <div class="event-item">
          <div class="event-header">상태</div>
          <div class="event-status" :class="eventStatusClass">
            {{ event.status === 'pending' ? '대기중' :
               event.status === 'approved' ? '승인됨' :
               event.status === 'rejected' ? '거부됨' :
               event.status === 'cancelled' ? '취소됨' : '알 수 없음' }}
          </div>
        </div>
        
        <div class="event-item">
          <div class="event-header">날짜</div>
          <div class="event-date">{{ formatDate(event.date) }}</div>
        </div>
        
        <div class="event-item">
          <div class="event-header">시간</div>
          <div class="event-time">
            {{ formatTime(event.start_period) }} - {{ formatTime(event.end_period) }}
          </div>
        </div>
        
        <div class="event-item">
          <div class="event-header">담당 교수</div>
          <div class="event-professor">
            {{ getEffectiveProfessorName(event) }}
            <span v-if="isInheritedField(event, 'professor_name')" class="inherited-tag">(상속됨)</span>
          </div>
        </div>
        
        <div class="event-item">
          <div class="event-header">강의실</div>
          <div class="event-room">
            {{ getEffectiveRoom(event) }}
            <span v-if="isInheritedField(event, 'room')" class="inherited-tag">(상속됨)</span>
          </div>
        </div>
        
        <div class="event-item" v-if="event.location">
          <div class="event-header">위치</div>
          <div class="event-location">{{ event.location }}</div>
        </div>
        
        <div class="event-item" v-if="event.description">
          <div class="event-header">설명</div>
          <div class="event-description">{{ event.description }}</div>
        </div>
        
        <div class="event-item" v-if="event.reason">
          <div class="event-header">사유</div>
          <div class="event-reason">{{ event.reason }}</div>
        </div>
        
        <div class="event-actions" v-if="canModifyEvent(event)">
          <button 
            v-if="!isEditing" 
            class="edit-button"
            @click="startEditing">
            수정
          </button>
          <button 
            v-if="isEditing" 
            class="save-button"
            @click="saveChanges">
            저장
          </button>
          <button 
            class="delete-button"
            @click="deleteEvent">
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store'
import { useTimetableStore } from '@/store/modules/timetable'
import { formatDate, formatTime } from '@/utils/dateUtils'

// 이벤트 props 정의
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

// 이벤트 emit 정의
const emit = defineEmits(['close', 'update-event', 'delete-event'])

// 스토어 사용
const authStore = useAuthStore()
const timetableStore = useTimetableStore()

// 로컬 상태 정의
const isEditing = ref(false)
const editMode = ref(false)

// 이벤트 상태에 따른 클래스
const eventStatusClass = computed(() => {
  if (!props.event) return ''
  
  const statusMap = {
    'pending': 'text-orange-500',
    'approved': 'text-green-500',
    'rejected': 'text-red-500',
    'cancelled': 'text-gray-500'
  }
  
  return statusMap[props.event.status] || 'text-gray-700'
})

// 이벤트 타입 텍스트 변환
const getEventTypeText = (type) => {
  const typeMap = {
    'regular': '정규 수업',
    'makeup': '보강',
    'cancel': '휴강',
    'special': '특강',
    'event': '이벤트',
    'holiday': '공휴일'
  }
  
  return typeMap[type] || '알 수 없음'
}

// 교수명 가져오기 (상속 적용)
const getEffectiveProfessorName = (event) => {
  if (!event) return '미지정'
  
  // 디버깅 로그 추가
  console.log(`[DetailEventModal] 교수명 상속 정보:`, {
    event_id: event.id,
    inherit_attributes: event.inherit_attributes,
    professor_name: event.professor_name,
    professor: event.professor,
    inherited_professor_name: event.inherited_professor_name,
    effective: event.inherit_attributes === 1 && event.inherited_professor_name
      ? event.inherited_professor_name
      : (event.professor_name || event.professor || '미지정')
  })
  
  // inherit_attributes가 1이고 inherited_professor_name이 있으면 상속값 사용
  if (event.inherit_attributes === 1 && event.inherited_professor_name) {
    return event.inherited_professor_name
  }
  
  // 그렇지 않으면 자체 교수명 사용
  return event.professor_name || event.professor || '미지정'
}

// 강의실 가져오기 (상속 적용)
const getEffectiveRoom = (event) => {
  if (!event) return '미지정'
  
  // 디버깅 로그 추가
  console.log(`[DetailEventModal] 강의실 상속 정보:`, {
    event_id: event.id,
    inherit_attributes: event.inherit_attributes,
    room: event.room,
    inherited_room: event.inherited_room,
    effective: event.inherit_attributes === 1 && event.inherited_room
      ? event.inherited_room
      : (event.room || '미지정')
  })
  
  // inherit_attributes가 1이고 inherited_room이 있으면 상속값 사용
  if (event.inherit_attributes === 1 && event.inherited_room) {
    return event.inherited_room
  }
  
  // 그렇지 않으면 자체 강의실 사용
  return event.room || '미지정'
}

// 필드 상속 여부 확인
const isInheritedField = (event, fieldName) => {
  if (!event || event.inherit_attributes !== 1) return false
  
  // 필드별 상속 여부 확인 결과 반환
  const result = fieldName === 'professor_name'
    ? !!event.inherited_professor_name
    : fieldName === 'room'
      ? !!event.inherited_room
      : false
      
  // 디버깅 로그
  console.log(`[DetailEventModal] 필드 상속 여부(${fieldName}):`, result)
  
  return result
}

// 이벤트 수정 가능 여부 체크
const canModifyEvent = (event) => {
  return (
    (event.type === 'CANCELLATION' && event.status !== 'APPROVED') || 
    (event.type === 'MAKEUP' && event.status !== 'APPROVED') ||
    authStore.isAdmin
  );
}

// 모달 닫기
const closeModal = () => {
  isEditing.value = false
  emit('close')
}

// 수정 모드 시작
const startEditing = () => {
  isEditing.value = true
}

// 변경사항 저장
const saveChanges = () => {
  isEditing.value = false
  emit('update-event', props.event)
}

// 이벤트 삭제
const deleteEvent = () => {
  if (confirm('이 이벤트를 삭제하시겠습니까?')) {
    emit('delete-event', props.event.id)
    closeModal()
  }
}

// 모달이 열릴 때 이벤트 정보 디버깅
const onModalOpen = () => {
  if (props.event) {
    console.log('📌 DetailEventModal - 이벤트 상세 정보:', {
      id: props.event.id,
      type: props.event.type,
      timetable_id: props.event.timetable_id,
      inherit_attributes: props.event.inherit_attributes,
      professor_name: props.event.professor_name,
      professor: props.event.professor,
      inherited_professor_name: props.event.inherited_professor_name,
      room: props.event.room,
      inherited_room: props.event.inherited_room
    })
  }
}

// 모달 표시 변경 감지
watch(() => props.isVisible, (newVal) => {
  if (newVal === true) {
    onModalOpen()
  }
})

// 첫 로드 시 실행
onMounted(() => {
  if (props.isVisible) {
    onModalOpen()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.close-button:hover {
  color: #2d3748;
}

.modal-body {
  padding: 16px;
}

.event-item {
  margin-bottom: 16px;
}

.event-header {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 4px;
}

.event-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
}

.event-type,
.event-status,
.event-date,
.event-time,
.event-location,
.event-description,
.event-reason {
  font-size: 1rem;
  color: #4a5568;
}

.event-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.edit-button,
.save-button,
.delete-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.edit-button {
  background-color: #edf2f7;
  color: #4a5568;
}

.edit-button:hover {
  background-color: #e2e8f0;
}

.save-button {
  background-color: #48bb78;
  color: white;
}

.save-button:hover {
  background-color: #38a169;
}

.delete-button {
  background-color: #f56565;
  color: white;
}

.delete-button:hover {
  background-color: #e53e3e;
}

.inherited-tag {
  font-size: 0.75rem;
  color: #718096;
  margin-left: 4px;
  font-style: italic;
}

.event-professor,
.event-room {
  font-size: 1rem;
  color: #4a5568;
  display: flex;
  align-items: center;
}
</style> 