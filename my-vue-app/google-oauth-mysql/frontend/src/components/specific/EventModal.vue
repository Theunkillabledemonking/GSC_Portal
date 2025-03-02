<!-- File: EventModal.vue -->
<template>
  <div class="modal">
    <div class="modal-content">
      <!-- (1) 모달 제목: 신규 vs 수정 모드 구분 -->
      <h3>{{ isEdit ? '일정 수정' : '새 일정 추가' }}</h3>

      <!-- (2) 일정 제목 입력 -->
      <input v-model="summary" placeholder="일정 제목" />

      <!-- (3) 일정 설명 입력 -->
      <textarea v-model="description" placeholder="설명"></textarea>

      <!-- (4) 날짜 입력 (type="date") -->
      <label>날짜</label>
      <input type="date" v-model="selectedDateInput" />

      <!-- (5) 시작 시간 선택 -->
      <div class="time-select">
        <label>시작 시간</label>
        <select v-model="startTime">
          <option v-for="time in timeOptions" :key="time" :value="time">
            {{ time }}
          </option>
        </select>
      </div>

      <!-- (6) 종료 시간 선택 -->
      <div class="time-select">
        <label>종료 시간</label>
        <select v-model="endTime">
          <option v-for="time in timeOptions" :key="time" :value="time">
            {{ time }}
          </option>
        </select>
      </div>

      <!-- (7) 버튼 그룹 -->
      <div class="button-group">
        <!-- 신규 모드 -> "저장하기", 수정 모드 -> "수정하기" -->
        <button @click="saveEvent">
          {{ isEdit ? '수정하기' : '저장하기' }}
        </button>

        <!-- 수정 모드에서만 삭제 버튼 노출 -->
        <button v-if="isEdit" @click="deleteEventById">삭제하기</button>

        <!-- 닫기 버튼 -->
        <button @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { createEvent, updateEvent, deleteEvent } from '@/services/calendarApi.js';

/**
 * 부모에서 전달하는 props:
 * - isEdit: Boolean (신규(false)/수정(true) 모드)
 * - selectedDay: { date: 'YYYY-MM-DD' } (신규 등록 시 초기 날짜)
 * - selectedEvent: 기존 이벤트 정보 (수정 모드에서 사용)
 */
const props = defineProps({
  isEdit: Boolean,
  selectedDay: Object,
  selectedEvent: Object
});

/**
 * 모달 닫기 (부모가 받음)
 * - 저장/삭제 후 location.reload() 하는 간단 구현
 *   (더 나은 방법: emit('refresh')로 부모에게 재로딩 맡기기)
 */
const emit = defineEmits(['close']);

// (A) 일정 기본 정보 (제목, 설명)
const summary = ref('');
const description = ref('');

// (B) 날짜 입력값 (HTML <input type="date">)
const selectedDateInput = ref('');  // 예: "2025-03-15"

// (C) 시작/종료 시간 (드롭다운)
const startTime = ref('09:00');
const endTime = ref('10:00');

// (D) 00:00 ~ 23:30까지 30분 간격 타임 옵션
const timeOptions = computed(() => {
  const result = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    result.push(`${hh}:00`);
    result.push(`${hh}:30`);
  }
  return result;
});

/**
 * watch: modal이 열릴 때, 또는 selectedEvent가 바뀔 때
 * - isEdit & selectedEvent가 있으면 기존 이벤트 정보를 폼에 반영
 * - 아니면 (신규) 기본값 세팅
 */
watch(() => props.selectedEvent, (event) => {
  if (props.isEdit && event) {
    // 수정 모드
    summary.value = event.summary || '';
    description.value = event.description || '';
    // event.start.dateTime 예: "2025-03-15T09:30:00+09:00"
    setModalFieldsForUpdate(event);
  } else {
    // 신규 모드 -> selectedDay.date (혹은 오늘 날짜) + 기본시간
    summary.value = '';
    description.value = '';
    setModalFieldsForCreate();
  }
}, { immediate: true });

/**
 * (1) 수정 모드: 기존 이벤트에서 날짜/시간 추출
 */
function setModalFieldsForUpdate(event) {
  // 날짜 추출
  // event.start.dateTime이 있으면 파싱, 없으면 event.start.date로 대체
  const startDt = event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(`${event.start.date}T09:00`);
  const endDt = event.end.dateTime
      ? new Date(event.end.dateTime)
      : new Date(`${event.end.date}T10:00`);

  // "YYYY-MM-DD" 형태로 변환
  selectedDateInput.value = formatDateForInput(startDt);

  // 시간 파싱 -> "HH:MM"
  startTime.value = formatTime(startDt);
  endTime.value = formatTime(endDt);
}

/**
 * (2) 신규 모드: selectedDay에 date가 있다면 그 날짜, 없으면 오늘
 */
function setModalFieldsForCreate() {
  const today = new Date();
  const defaultDate = props.selectedDay?.date || formatDateForInput(today);
  selectedDateInput.value = defaultDate;

  startTime.value = '09:00';
  endTime.value = '10:00';
}

/**
 * 날짜 -> "YYYY-MM-DD"
 */
function formatDateForInput(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2,'0');
  const dd = String(dateObj.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 시간 -> "HH:MM"
 */
function formatTime(dateObj) {
  const hh = String(dateObj.getHours()).padStart(2,'0');
  const mm = dateObj.getMinutes() === 30 ? '30' : '00';
  return `${hh}:${mm}`;
}

/**
 * (E) "저장하기"/"수정하기" 버튼 클릭
 *  - 날짜( selectedDateInput.value ), 시간(startTime/endTime) 조합하여
 *    YYYY-MM-DDTHH:MM:00+09:00 형태로 startDate/endDate 구성
 *  - createEvent / updateEvent 호출
 */
async function saveEvent() {
  // (1) dateStr: "YYYY-MM-DD"
  const dateStr = selectedDateInput.value;
  if (!dateStr) {
    alert('날짜가 선택되지 않았습니다.');
    return;
  }

  // 시작이 종료보다 늦으면 에러처리 (선택)
  if(startTime.value >= endTime.value){
    alert('시작 시간이 종료 시간보다 같거나 늦을 수 없습니다.');
    return;
  }

  // (2) ISO 형태로 만들기
  const startDateTime = `${dateStr}T${startTime.value}:00+09:00`;
  const endDateTime = `${dateStr}T${endTime.value}:00+09:00`;

  // (3) API에 전달할 데이터
  const eventData = {
    summary: summary.value,
    description: description.value,
    startDate: startDateTime,
    endDate: endDateTime
  };

  // (4) 수정 vs 신규
  try {
    if (props.isEdit && props.selectedEvent) {
      // 기존 일정 수정
      await updateEvent(props.selectedEvent.id, eventData);
      alert('일정이 수정되었습니다.');
    } else {
      // 신규 일정 추가
      await createEvent(eventData);
      alert('새 일정이 등록되었습니다.');
    }

    location.reload();  // 간단 구현용. 새로고침
    // emit('close');    // 혹은 모달만 닫고, 상위에서 refreshEvents() 호출
  } catch (error) {
    console.error(error);
    alert('오류 발생');
  }
}

/**
 * (F) "삭제하기" 버튼 (수정 모드에서만 노출)
 */
async function deleteEventById() {
  if (!props.selectedEvent?.id) return;
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await deleteEvent(props.selectedEvent.id);
    alert('일정이 삭제되었습니다.');
    location.reload();
  } catch (error) {
    console.error(error);
    alert('오류 발생');
  }
}
</script>

<style scoped>
/* 모달 배경 & 위치 */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border: 1px solid #ddd;
  padding: 20px;
  z-index: 1000;
  width: 320px;
}

/* 모달 내부 구조 */
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 시간 선택 영역 */
.time-select {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
}

/* 버튼 그룹 */
.button-group {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-top: 10px;
}

/* 버튼 스타일 */
button {
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  background: #4caf50;
  color: #fff;
  border-radius: 4px;
  transition: background 0.2s;
}
button:hover {
  background: #45a049;
}
</style>
