<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? "정규 수업 수정" : "정규 수업 등록" }}</h3>

      <form @submit.prevent="handleSubmit">
        <!-- 과목 선택 -->
        <div class="form-group">
          <label>과목</label>
          <select v-model="form.subject_id" required>
            <option value="" disabled>과목 선택</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 요일 선택 -->
        <div class="form-group">
          <label>요일</label>
          <select v-model="form.day" required>
            <option v-for="d in days" :key="d">{{ d }}</option>
          </select>
        </div>

        <!-- 교시 선택 -->
        <div class="form-group">
          <label>교시</label>
          <div style="display: flex; gap: 8px;">
            <select v-model="form.start_period" required>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            ~
            <select v-model="form.end_period" required>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- 강의실 -->
        <div class="form-group">
          <label>강의실</label>
          <input type="text" v-model="form.room" />
        </div>

        <!-- 교수 입력 (관리자/교수만) -->
        <div class="form-group" v-if="isAdminOrProfessor">
          <label>담당 교수</label>
          <input type="text" v-model="form.professor_name" placeholder="교수 이름 입력" />
        </div>

        <!-- 설명 -->
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="form.description" rows="2" />
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? '처리 중...' : (isEditMode ? '수정' : '등록') }}
          </button>
          <button type="button" @click="$emit('close')">닫기</button>
          <button
              v-if="isEditMode"
              type="button"
              class="danger"
              @click="handleDelete"
              :disabled="loading"
          >삭제</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/authStore';
import {
  createTimetable,
  updateTimetable,
  deleteTimetable
} from '@/services/timetableService';
import { getSubjectsByYear } from '@/services/subjectService';

const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
});
const emit = defineEmits(['close', 'saved', 'deleted']);

const authStore = useAuthStore();
const isAdminOrProfessor = computed(() => authStore.role <= 2);

const days = ['월', '화', '수', '목', '금', '토'];

const subjects = ref([]);
const loading = ref(false);

const form = ref({
  subject_id: '',
  day: '',
  start_period: 1,
  end_period: 1,
  room: '',
  professor_name: '',
  description: ''
});

// 모달 열고 닫을 때 초기화
watch(() => props.isOpen, (open) => {
  if (!open) resetForm();
});

// 수정 모드 초기값 세팅
watch(() => props.initialData, (val) => {
  if (val && props.isEditMode) {
    form.value = { ...val };
  } else {
    resetForm();
  }
}, { immediate: true });

// 과목 불러오기
async function loadSubjects() {
  try {
    const res = await getSubjectsByYear(props.year);
    subjects.value = res.subjects || [];
  } catch (err) {
    console.error("❌ 과목 불러오기 실패", err);
  }
}

// form 초기화
function resetForm() {
  form.value = {
    subject_id: '',
    day: '',
    start_period: 1,
    end_period: 1,
    room: '',
    professor_name: '',
    description: ''
  };
}

// 저장 처리
async function handleSubmit() {
  if (!form.value.subject_id || !form.value.day) {
    return alert("과목과 요일은 필수입니다.");
  }

  if (form.value.end_period < form.value.start_period) {
    return alert("교시 범위가 잘못되었습니다. (시작 교시 ≤ 종료 교시)");
  }

  loading.value = true;

  try {
    if (props.isEditMode) {
      await updateTimetable(props.initialData.id, form.value);
    } else {
      await createTimetable({
        ...form.value,
        year: props.year,
        level: authStore.level
      });
    }

    emit('saved');
    emit('close');
  } catch (err) {
    console.error("❌ 저장 실패", err);
    alert("오류 발생: 콘솔 확인");
  } finally {
    loading.value = false;
  }
}

// 삭제 처리
async function handleDelete() {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  loading.value = true;
  try {
    await deleteTimetable(props.initialData.id);
    emit('deleted');
    emit('close');
  } catch (err) {
    console.error("❌ 삭제 실패", err);
    alert("삭제 중 오류 발생");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSubjects();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  width: 400px;
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
