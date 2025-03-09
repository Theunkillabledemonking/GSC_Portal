<template>
  <div class="modal-backdrop" v-if="isOpen">
    <div class="modal">
      <h3>{{ isEditMode ? '시간표 수정' : '시간표 등록' }}</h3>

      <form @submit.prevent="handleSubmit">

        <!-- 이벤트 타입 선택 -->
        <div class="form-group">
          <label>이벤트 종류</label>
          <select v-model="form.event_type" required>
            <option value="normal">정규수업</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
          </select>
        </div>

        <!-- 정규 수업일 경우 요일/교시 선택 -->
        <template v-if="form.event_type === 'normal'">
          <div class="form-group">
            <label>요일 선택</label>
            <select v-model="form.day">
              <option value="월">월요일</option>
              <option value="화">화요일</option>
              <option value="수">수요일</option>
              <option value="목">목요일</option>
              <option value="금">금요일</option>
            </select>
          </div>

          <div class="form-group">
            <label>교시 선택</label>
            <select v-model="form.start_period"  @change="setClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
            <span>~</span>
            <select v-model="form.end_period"  @change="setClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
          </div>
        </template>

        <!-- 이벤트(휴강/보강/특강)일 경우 시작/종료 날짜 선택 -->
        <template v-else>
          <div class="form-group">
            <label>시작 날짜</label>
            <input type="date" v-model="form.start_date" required/>
          </div>
          <div class="form-group">
            <label>종료 날짜</label>
            <input type="date" v-model="form.end_date" />
          </div>
        </template>

        <!-- 과목 선택 -->
        <div class="form-group">
          <label>과목 선택</label>
          <select v-model="form.subject_id" required>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <!-- 시간 선택 -->
        <div class="form-group">
          <label>시간 (시작 ~ 종료)</label>
          <div class="time-range">
            <input type="time" v-model="form.start_time" required />
            <span>~</span>
            <input type="time" v-model="form.end_time" required />
          </div>
        </div>

        <!-- 장소 & 비고 -->
        <div class="form-group">
          <label>교실</label>
          <input type="text" v-model="form.room" />
        </div>
        <div class="form-group">
          <label>비고</label>
          <textarea v-model="form.description"></textarea>
        </div>

        <!-- 버튼 -->
        <div class="modal-actions">
          <button type="submit" class="save-btn">저장</button>
          <button type="button" class="cancel-btn" @click="closeModal">취소</button>
          <button v-if="isEditMode" type="button" class="delete-btn" @click="handleDelete">삭제</button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import {createEvent, updateEvent, deleteEvent, createTimetable} from "@/services/timetableApi.js";
import { useAuthStore} from "@/store/authStore.js";

// Props & Emits
const props = defineProps({
  isOpen: Boolean,
  initialData: Object,
  selectedDate: String,
  year: Number,
});
const emit = defineEmits(['close', 'saved', 'deleted']);

// 상태
const authStore = useAuthStore();
const isEditMode = ref(false);
const subjects = ref([]);

// 폼 데이터
const form = ref({
  timetable_id: null,
  subject_id: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  event_type: 'normal',
  room: '',
  description: '',
  day: '',
  start_period: null, // 시작 교시
  end_period: null,   // 끝나는 교시
})

// 🔹 교시별 시간표 매핑
const periodTimeMap = {
  1: { start: "09:00", end: "09:50" },
  2: { start: "10:00", end: "10:50" },
  3: { start: "11:00", end: "11:50" },
  4: { start: "12:00", end: "12:50" },
  5: { start: "13:00", end: "13:50" },
  6: { start: "14:00", end: "14:50" },
  7: { start: "15:00", end: "15:50" },
  8: { start: "16:00", end: "16:50" },
  9: { start: "17:00", end: "17:50" },
  10: { start: "18:00", end: "18:50" }
};

// 🔹 교시 선택 시 자동 시간 설정
const setClassTime = () => {
  const { start_period, end_period } = form.value;
  if (start_period && end_period && start_period <= end_period) {
    form.value.start_time = periodTimeMap[start_period].start;
    form.value.end_time = periodTimeMap[end_period].end;
  } else {
    form.value.start_time = "";
    form.value.end_time = "";
  }
};

const handleSubmit = async () => {
  try {
    const payload = {
      year: props.year ?? authStore.grade ?? 1,  // 기본값 1로 설정
      level: authStore.level ?? 1,  // 기본값 1로 설정
      subject_id: form.value.subject_id,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      room: form.value.room || "",  // 빈 값 방지
      description: form.value.description || "", // 빈 값 방지
    };

    if (form.value.event_type === "normal") {
      if (!form.value.day || !form.value.start_period || !form.value.end_period) {
        alert("요일과 교시를 선택해주세요.");
        return;
      }
      payload.day = form.value.day;
      payload.start_period = form.value.start_period;
      payload.end_period = form.value.end_period;
    }

    console.log("보낼 데이터:", JSON.stringify(payload, null, 2));

    await createTimetable(payload);
    emit('saved');
    closeModal();
  } catch (error) {
    console.error("시간표 등록 중 오류:", error);
    alert('저장 실패: ' + error.response?.data?.error || error.message);
  }
};

// 삭제 버튼 클릭
const handleDelete = async () => {
  if (!confirm('정말로 삭제하시겠습니까?')) return;
  try {
    await deleteEvent(form.value);
    emit('deleted');
    closeModal();
  } catch (error) {
    alert('삭제 실패:' + error.message);
  }
};

// 모달 닫기
const closeModal = () => {
  emit('close');
};

// 과목 목록 불러오기
const loadSubject = async () => {
  try {
    const yearToUse = props.year ?? authStore.grade ?? 1 ;
    console.log("과목 불러오기 요청 year:", yearToUse);

    if (!yearToUse) {
      console.warn('과목 요청을 보낼 학년 정보가 없습니다.');
      return;
    }

    const res = await axios.get(`/api/subjects/year/${yearToUse}`);
    subjects.value = res.data.subjects;
  } catch (error) {
    console.error('과목 불러오기 실패', error);
    subjects.value = [];
  }
};

onMounted(() => {
  loadSubject();
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.time-range {
  display: flex;
  align-items: center;
}

.time-range span {
  margin: 0 5px;
}

textarea {
  width: 100%;
  height: 60px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.save-btn, .cancel-btn, .delete-btn {
  padding: 8px 15px;
  cursor: pointer;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.cancel-btn {
  background-color: #ccc;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}
</style>