<template>
  <div class="modal-backdrop" v-if="isOpen">
    <div class="modal">
      <h3>{{ isEditMode ? '시간표 수정' : '시간표 등록' }}</h3>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>날짜</label>
          <input type="date" v-model="form.event_date" required />
        </div>

        <div class="form-group">
          <label>과목 선택</label>
          <select v-model="form.subject_id" required>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>시간 (시작 ~ 종료)</label>
          <div class="time-range">
            <input type="time" v-model="form.start_time" required />
            <span>~</span>
            <input type="time" v-model="form.end_time" required />
          </div>
        </div>

        <div class="form-group">
          <label>이벤트 종료</label>
          <select v-model="form.event_type" required>
            <option value="normal">정규 수업</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
          </select>
        </div>

        <div class="form-group">
          <label>장소 (교실)</label>
          <input type="text" v-model="form.room" />
        </div>

        <div class="form-group">
          <label>비고</label>
          <textarea v-model="form.description"></textarea>
        </div>

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
import { createEvent, updateEvent, deleteEvent } from "@/services/timetableApi.js";
import { getSubjectsByYear } from "@/services/subjectApi.js";
import { useAuthStore} from "@/store/authStore.js";

// Props & Emits
const props = defineProps({
  isOpen: Boolean, // 모달 열림 여부
  initialData: Object, // 수정시 전달받는 기존 데이터
  selectedDate: String, // 클릭한 날짜 (신규 등록 시 필요)
});
const emit = defineEmits(['close' , 'saved', 'deleted']);

// 상태
const authStore = useAuthStore();
const isEditMode = ref(false); // 수정모드 여부
const subjects = ref([]); // 과목 목록

// 폼 데이터
const form = ref({
  timetable_id: null,
  subject_id: '',
  event_date: '',
  start_time: '',
  end_time: '',
  event_type: 'normal',
  room: '',
  description: ''
});

// 초기 데이터 세팅 (수정 모드일 경우)
watch(() => props.initialData, (data) => {
  if (data) {
    isEditMode.value = true;
    form.value = { ...data };
  } else {
    isEditMode.value = false;
    resetForm();
  }
}, { immediate: true });

const loadSubjects = async () => {
  try {
    const res = await getSubjectsByYear(authStore.grade);
    subjects.value = res.data;
  } catch (error) {
    console.error('과목 목록 불러오기 실패:', error);
    subjects.value = [];
  }
};

// 학년별 과목 목록 조회
const restForm = async () => {
  form.value = {
    timetable_id: null,
    subject_id: '',
    event_date: props.selectedDate || '',
    start_time: '',
    end_time: '',
    event_type: 'normal',
    room: '',
    description: ''
  };
};

// 저장 버튼 클릭
const handleSubmit = async () => {
  try {
    const payload = {
      timetable_id: form.value.timetable_id,
      subject_id: form.value.subject_id,
      event_date: form.value.event_date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      event_type: form.value.event_type,
      room: form.value.room,
      description: form.value.description,
    };

    if (isEditMode.value) {
      await updateEvent(form.value.id, payload);
    } else {
      await createEvent(payload);
    }
    emit('saved'); // 저장 완료 이벤트 부모로 전달
    closeModal();
  } catch (error) {
    alert('저장실패:' + error.message);
  }
};

// 삭제 버튼 클릭
const handleDelete = async () => {
  if (!confirm('정말로 삭제하시겠습니까?')) return;

  try {
    await deleteEvent(form.value);
    emit('deleted'); // 삭제 완료 이벤트 부모로 전달
    closeModal();
  } catch (error) {
    alert('삭제 실패: ' + error.message);
  }
};

// 모달 닫기
const closeModal = () => {
  emit('close');
};

onMounted(() => {
  loadSubjects();
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