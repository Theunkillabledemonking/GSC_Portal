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

      <!-- (4) 시작일 / 종료일 (type="date") -->
      <div class="date-range">
        <label>시작</label>
        <input type="date" v-model="startDateInput" />
        <label>종료</label>
        <input type="date" v-model="endDateInput" />
      </div>

      <!-- 종일 여부 체크 -->
      <label class="all-day-check">
        <input type="checkbox" v-model="allDay" />
        종일
      </label>

      <!-- (5) 종일이 아닌 경우에만 시작 시간 선택 -->
      <div v-if="!allDay" class="time-range">
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
      </div>

      <!-- 반복 주기 -->
      <div class="repeat-section">
        <label>반복</label>
        <select v-model="repeatRule">
          <option value="none">반복 안 함</option>
          <option value="daily">매일</option>
          <option value="weekly">매주</option>
          <option value="monthly">매월</option>
          <option value="yearly">매년</option>
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
const startDateInput = ref('');  // 예: "2025-03-15"
const endDateInput = ref('');

// 종일 여부
const allDay = ref(false);

// (C) 시작/종료 시간 (드롭다운)
const startTime = ref('09:00');
const endTime = ref('10:00');

// 반복 주기
const repeatRule = ref('none'); // none, daily, weekly, monthly, yearly

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
    loadEventDates(event);
  } else {
    // 신규 모드
    resetNewEvent();
  }
}, { immediate: true });

/**
 * (1) 수정 모드: 기존 이벤트에서 날짜/시간 추출
 */
function loadEventDates(event) {
  // 종일 여부 체크 (event.allDay 등 추가 구현)
  if (event.start.date) {
    // 종일 일정
    allDay.value = true;
    startDateInput.value = event.start.date;
    endDateInput.value = event.end.date || event.start.date;
  } else {
    // 시간대 일정
    allDay.value= false;
    const startDt = new Date(event.start.dateTime);
    const endDt = new Date(event.end.dateTime);
    startDateInput.value = formatDate(startDt);
    endDateInput.value = formatDate(endDt);
    startTime.value = formatTime(startDt);
    endTime.value = formatTime(endDt);
  }
  // 반복주기
  // (실제로는 event.recurrence // RRULE 파싱 필요)
  repeatRule.value = 'none';
}

function resetNewEvent() {
  summary.value = '';
  description.value = '';
  const dateStr = props.selectedDay?.date || formatDate(new Date());
  startDateInput.value = dateStr;
  endDateInput.value = dateStr;
  allDay.value = false;
  startTime.value = '09:00';
  endTime.value = '10:00';
  repeatRule.value = 'none';
}

/**
 * 날짜 -> "YYYY-MM-DD"
 */
function formatDate(dateObj) {
  const yy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
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
 *  하루 뒤 날짜 (종일 일정시, end가 start와 같다면 +1)
 */
function addOneDay(yyyyMmDd) {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(year, month, day);
  dt.setDate(dt.getDate() + 1);
  return formatDate(dt);
}

/**
 * (E) "저장하기"/"수정하기" 버튼 클릭
 *  - 날짜( selectedDateInput.value ), 시간(startTime/endTime) 조합하여
 *    YYYY-MM-DDTHH:MM:00+09:00 형태로 startDate/endDate 구성
 *  - createEvent / updateEvent 호출
 */
async function saveEvent() {
  if(!startDateInput.value) {
    alert('시작 날짜를 입력하세요');
    return;
  }
  if(!endDateInput.value) {
    alert('종료 날짜를 입력하세요');
    return;
  }

  // 2) 종일 vs 시간대 => startVal, endVal
  let startVal, endVal;

  // 종일인지 여부에 따라 date / dateTime 결정
  if (allDay.value) {
    // 종일 일정 (date만)
    startVal = startDateInput.value;
    endVal   = endDateInput.value;
    // 만약 사용자가 동일 날짜(또는 end < start)를 지정했으면 +1일 처리
    if (endVal <= startVal) {
      endVal = addOneDay(startVal);
    }
  } else {
    // 시간대 일정 (dateTime)
    startVal = `${startDateInput.value}T${startTime.value}:00+09:00`;
    endVal   = `${endDateInput.value}T${endTime.value}:00+09:00`;
    if (startVal > endVal) {
      alert('시작 시점이 종료 시점보다 늦을 수 없습니다.');
      return;
    }
  }
  // 반복 주기 -> repeatRule ("none"/"daily"/"weekly"/"monthly"/"yearly")
  let recurrenceRule = (repeatRule.value !== 'none') ? repeatRule.value : null;

  const eventData = {
    summary: summary.value,
    description: description.value,
    allDay: allDay.value,
    startDate: startVal,
    endDate: endVal,
    repeatRule: recurrenceRule
  }

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
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 380px;
  background: #fff;
  border: 1px solid #ddd;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 날짜 범위 */
.date-range {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 종일 체크 */
.all-day-check {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 시간 범위 */
.time-range {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
}

/* 반복 주기 */
.repeat-section {
  margin-top: 8px;
}

/* 버튼 그룹 */
.button-group {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  justify-content: flex-end;
}

/* 버튼 스타일 */
button {
  cursor: pointer;
  border: none;
  padding: 8px 12px;
  background: #4caf50;
  color: #fff;
  border-radius: 4px;
  transition: background 0.2s;
}
button:hover {
  background: #45a049;
}
</style>