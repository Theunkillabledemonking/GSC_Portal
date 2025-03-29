<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? "이벤트 수정" : "이벤트 등록" }}</h3>

      <form @submit.prevent="handleSubmit">
        <!-- 이벤트 유형 -->
        <div class="form-group">
          <label>이벤트 유형</label>
          <select v-model="form.event_type" required>
            <option disabled value="">선택</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
            <option value="event">행사</option>
          </select>
        </div>

        <!-- 날짜 -->
        <div class="form-group">
          <label>이벤트 날짜</label>
          <input type="date" v-model="form.event_date" required />
        </div>

        <!-- 레벨 -->
        <div class="form-group">
          <label>레벨</label>
          <select v-model="form.level">
            <option disabled value="">선택</option>
            <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
          </select>
        </div>

        <!-- 과목 선택 -->
        <div class="form-group" v-if="requiresSubject">
          <label>과목</label>
          <select v-model="form.subject_id" required>
            <option value="" disabled>과목 선택</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 교시 -->
        <div class="form-group" v-if="requiresPeriods">
          <label>교시</label>
          <div style="display: flex; gap: 8px;">
            <select v-model="form.start_period">
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            ~
            <select v-model="form.end_period">
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- 시간 -->
        <div class="form-group" v-if="requiresTime">
          <label>시작 시간</label>
          <input type="time" v-model="form.start_time" />
        </div>
        <div class="form-group" v-if="requiresTime">
          <label>종료 시간</label>
          <input type="time" v-model="form.end_time" />
        </div>

        <!-- 설명 -->
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="form.description" rows="2" />
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? "처리 중..." : (isEditMode ? "수정" : "등록") }}
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
import { ref, computed, watch } from "vue";
import {
  createEvent,
  updateEvent,
  deleteEvent
} from "@/services/eventService";

const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
  level: String,
  subjects: Array
});
const emit = defineEmits(["close", "saved"]);

const levels = ["N1", "N2", "N3", "TOPIK4", "TOPIK6"];
const loading = ref(false);

const form = ref({
  event_type: "",
  event_date: "",
  level: props.level || "",
  subject_id: "",
  start_period: null,
  end_period: null,
  start_time: "",
  end_time: "",
  description: ""
});

// 계산된 조건
const requiresSubject = computed(() =>
    ["cancel", "makeup", "special"].includes(form.value.event_type)
);
const requiresPeriods = computed(() =>
    ["cancel", "makeup", "special"].includes(form.value.event_type)
);
const requiresTime = computed(() =>
    ["makeup", "special", "event"].includes(form.value.event_type)
);

// 폼 리셋
function resetForm() {
  form.value = {
    event_type: "",
    event_date: "",
    level: props.level || "",
    subject_id: "",
    start_period: null,
    end_period: null,
    start_time: "",
    end_time: "",
    description: ""
  };
}

// 모달 닫힐 때 리셋
watch(() => props.isOpen, (val) => {
  if (!val) resetForm();
});

// 수정 모드일 때 초기값 주입
watch(
    () => props.initialData,
    (val) => {
      if (props.isEditMode && val) {
        form.value = { ...val };
      } else {
        resetForm();
      }
    },
    { immediate: true }
);

// 저장
async function handleSubmit() {
  if (!form.value.event_type || !form.value.event_date) {
    return alert("이벤트 유형과 날짜는 필수입니다.");
  }

  if (
      form.value.start_period &&
      form.value.end_period &&
      form.value.start_period > form.value.end_period
  ) {
    return alert("교시 범위를 확인해주세요.");
  }

  loading.value = true;
  try {
    const payload = {
      ...form.value,
      year: props.year
    };

    if (props.isEditMode) {
      await updateEvent(form.value.id, payload);
    } else {
      await createEvent(payload);
    }

    emit("saved");
    emit("close");
  } catch (err) {
    console.error("❌ 이벤트 저장 실패", err);
    alert("저장 실패 - 콘솔 확인");
  } finally {
    loading.value = false;
  }
}

// 삭제
async function handleDelete() {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  loading.value = true;
  try {
    await deleteEvent(form.value.id);
    emit("saved");
    emit("close");
  } catch (err) {
    console.error("❌ 이벤트 삭제 실패", err);
    alert("삭제 실패 - 콘솔 확인");
  } finally {
    loading.value = false;
  }
}
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
  width: 420px;
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
