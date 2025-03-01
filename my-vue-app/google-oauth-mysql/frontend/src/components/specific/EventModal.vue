<template>
  <div class="modal">
    <div class="modal-content">
      <h3>{{ isEdit ? '일정 수정' : '새 일정 추가' }}</h3>

      <!-- 일정 제목 입력 -->
      <input v-model="summary" placeholder="일정 제목" />

      <!-- 일정 설명 입력 -->
      <textarea v-model="description" placeholder="설명"></textarea>

      <!-- 시작 시간 선택 -->
      <div class="time-select">
        <label>시작 시간</label>
        <select v-model="startTime">
          <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
        </select>
      </div>

      <!-- 종료 시간 선택 -->
      <div class="time-select">
        <label>종료 시간</label>
        <select v-model="endTime">
          <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
        </select>
      </div>

      <!-- 저장/수정 버튼 -->
      <div class="button-group">
      <button @click="saveEvent">{{ isEdit ? '수정하기' : '저장하기' }}</button>
      <button v-if="isEdit" @click="deleteEventById">삭제하기</button>
      <!-- 닫기 버튼 -->
      <button @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { createEvent, updateEvent, deleteEvent } from "@/services/calendarApi.js";

// 부모로부터 선택한 날짜 및 기존 이벤트 정보 받음
const props = defineProps({
  selectedDay: Object,          // 날짜 정보 (신규 등록 시)
  selectedEvent: Object,        // 기존 이벤트 정보 (수정 시)
  isEdit: Boolean                // 수정 모드 여부
});

// 일정 제목과 설명
const summary = ref("");
const description = ref("");

// 시간 선택 옵션 (00:00 ~ 23:30까지 30분 단위로 구성)
const timeOptions = computed(() => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, "0");
    times.push(`${hour}:00`);
    times.push(`${hour}:30`);
  }
  return times;
});

// 시작/종료 시간 기본값 (수정 시에는 기존 시간 반영)
const startTime = ref("09:00");
const endTime = ref("10:00");

// 신규/수정 모드에 따른 데이터 세팅
watch(() => props.selectedEvent, (event) => {
  if (props.isEdit && event) {
    summary.value = event.summary;
    description.value = event.description;
    setEventTime(event);
  } else {
    summary.value = "";
    description.value = "";
    setDefaultTime();
  }
}, { immediate: true });

// 📌 신규 일정 등록 시 기본 시간 설정
const setDefaultTime = () => {
  startTime.value = "09:00";
  endTime.value = "10:00";
};

// 📌 기존 이벤트 수정 시 기존 시간 반영
const setEventTime = (event) => {
  const start = new Date(event.start.dateTime || `${event.start.date}T09:00`);
  const end = new Date(event.end.dateTime || `${event.end.date}T10:00`);

  startTime.value = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes() === 0 ? '00' : '30'}`;
  endTime.value = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes() === 0 ? '00' : '30'}`;
};

// 📌 저장 (신규 생성 또는 수정 요청 전송)
const saveEvent = async () => {
  const startDateTime = `${props.selectedDay.date}T${startTime.value}:00+09:00`;
  const endDateTime = `${props.selectedDay.date}T${endTime.value}:00+09:00`;

  const eventData = {
    summary: summary.value,
    description: description.value,
    startDate: startDateTime,
    endDate: endDateTime,
  };

  if (props.isEdit && props.selectedEvent) {
    // 수정 모드일 경우 updateEvent 호출
    await updateEvent(props.selectedEvent.id, eventData);
    alert('일정이 수정되었습니다.');
  } else {
    // 신규 모드일 경우 createEvent 호출
    await createEvent(eventData);
    alert('일정이 저장되었습니다.');
  }

  location.reload();  // 새로고침으로 캘린더 리프레시
};

const deleteEventById = async () => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await deleteEvent(props.selectedEvent.id);
    alert('일정이 삭제되었습니다.');
    location.reload();
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ddd;
  padding: 20px;
  z-index: 1000;
  width: 320px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-select {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

button {
  margin-top: 10px;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
