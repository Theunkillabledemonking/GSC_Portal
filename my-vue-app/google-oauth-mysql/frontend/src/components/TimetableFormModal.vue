<template>
  <div class="modal-backdrop" v-if="isOpen">
    <div class="modal">
      <h3>{{ isEditMode ? '시간표 수정' : '시간표 등록' }}</h3>
      <!-- 관리자/교수(role <= 2)만 등록 가능 -->
      <template v-if="authStore.role <= 2">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>날짜</label>
          <input type="date" v-model="form.event_date" required />
        </div>

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
            <select v-model="form.start_period"  @change="getClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
            <span>~</span>
            <select v-model="form.end_period"  @change="getClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
          </div>

          <div class="form-group">
            <label>교시 선택</label>
            <select v-model="form.start_period" @change="getClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
            <span>~</span>
            <select v-model="form.end_period" @change="getClassTime" required>
              <option v-for="p in 10" :key="p" :value="p">{{p}}교시</option>
            </select>
          </div>
        </template>

        <!-- 이벤트(특강)일 경우 시작/종료 날짜 선택 -->
        <template v-else-if="form.event_type === 'special'">
          <div class="form-group">
            <label>시작 날짜</label>
            <input type="date" v-model="form.start_date" required/>
          </div>
          <div class="form-group">
            <label>종료 날짜</label>
            <input type="date" v-model="form.end_date" />
          </div>
          <div class="form-group">
            <label>시간 선택</label>
            <div class="time-range">
              <input type="time" v-model="form.start_time" required />
              <span>~</span>
              <input type="time" v-model="form.end_time" required />
            </div>
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

        <!-- 시간 선택 (정규/휴강/보강 등에서도 활용 가능) -->
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
          <button type="submit" class="save-btn">
            {{ isEditMode ? "수정" : "저장"}}
          </button>
          <button type="button" class="cancel-btn" @click="closeModal">취소</button>
          <button
              v-if="isEditMode"
              type="button"
              class="delete-btn"
              @click="handleDelete"
            >
            삭제
            </button>
        </div>
      </form>
      </template>

      <!-- 학생(role=3)은 권한 없음 -->
      <template v-else>
        <p>학생은 시간표 등록 권한이 없습니다.</p>
        <button type="button" class="cancel-btn" @click="closeModal">닫기</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { createTimetable, updateTimetable, deleteTimetable} from "@/services/timetableService.js";
// import { createEvent, updateEvent, deleteEvent } from "@/services/eventService.js";
import { useAuthStore} from "@/store/authStore.js";

// Props & Emits
const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
});
const emit = defineEmits(['close', 'saved', 'deleted']);

// 상태
const authStore = useAuthStore();
const canEdit = computed(() => authStore.role <= 2);
const subjects = ref([]);

// 폼 데이터
const form = ref({
  // (등록/수정 시 필요한 필드들)
  id: null,
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
  start_period: null,
  end_period: null,
  level: null, // 이벤트일 경우 level이 들어올 수도 있음
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
function getClassTime () {
  const { start_period, end_period } = form.value;
  if (start_period && end_period && start_period <= end_period) {
    form.value.start_time = periodTimeMap[start_period].start || "";
    form.value.end_time = periodTimeMap[end_period].end || "";
  } else {
    form.value.start_time = "";
    form.value.end_time = "";
  }
}

// 모달 열릴 때 폼 초기화 or 기존데이터 채우기
function initForm() {
  if (props.isEditMode && props.initialData) {
    // 수정 모드 -> 기존값 채우기
    form.value.id = props.initialData.id ?? null;
    form.value.timetable_id = props.initialData.id ?? null;
    form.value.event_date = props.initialData.event_date ?? '';
    form.value.event_type = "normal"; // 기본적으로 '정규수업'으로 둠
    form.value.subject_id = props.initialData.subject_id ?? '';
    form.value.day = props.initialData.day ?? '';
    form.value.room = props.initialData.room ?? '';
    form.value.description = props.initialData.description ?? '';
    form.value.start_period = props.initialData.start_period ?? null;
    form.value.end_period = props.initialData.end_period ?? null;
    // 필요하다면 start_date/end_date도 props.initialData에서 세팅
    getClassTime();
  } else {
    // 등록 모드 -> 폼 리셋
    resetForm();
  }
}

// 폼 리셋
function resetForm() {
  form.value = {
    id: null,
    timetable_id: null,
    event_type: "normal",
    subject_id: '',
    day: '',
    start_period: null,
    end_period: null,
    start_time: '',
    end_time: '',
    room: '',
    description: '',
    start_date: '',
    end_date: '',
    level: null,
  }
}

async function handleSubmit() {
  try {
    // 권한 체크
    if (!canEdit.value) {
      alert('시간표 등록 권한이 없습니다.');
      return;
    }

    // level 값 보존
    let existingLevel = props.initialData?.level ?? authStore.level ?? 1;

    // 실제 등록할 payload
    const payload = {
      year: props.year ?? authStore.grade ?? 1,
      level: (form.value.event_type === "normal") ? null : (form.value.level ?? existingLevel),
      subject_id: form.value.subject_id,
      day: form.value.day,
      start_period: form.value.start_period,
      end_period: form.value.end_period,
      room: form.value.room || "",
      description: form.value.description || "",
      event_type: form.value.event_type,
      timetable_id: form.value.timetable_id || null,

      // cancel/makeup/special일 경우 사용자가 입력한 날짜
      event_date: form.value.start_date || new Date().toISOString().split("T")[0],
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
    };

    // 수정 모드 일 경우 ID를 정확히 입력
    // if (form.value.event_type === "cancel" || form.value.event_type === "makeup") {
    //   payload.timetable_id = props.initialData?.id ?? null;
    // }

    console.log("보낼 데이터", JSON.stringify(payload, null, 2));

    if (props.isEditMode && form.value.id) {
      // 수정 모드: 기존 데이터로부터 timetable_id 할당
      console.log("수정 payload", payload);
      await updateTimetable(form.value.id, payload);
    } else {
      // 등록 모드
      console.log("등록 payload:", payload);
      await createTimetable(payload);
    }

    // 등록 완료 후 상위에 알림
    emit('saved');
    closeModal();
  } catch (error) {
    console.error("시간표 등록 중 오류:", error);
    alert('저장 실패: ' + (error.response?.data?.error || error.message));
  }
}

// 삭제 버튼 클릭
async function handleDelete() {
  if (!confirm('정말로 삭제하시겠습니까?')) return;
  try {
    if (!form.value.id) {
      alert('유효하지않는 ID');
      return;
    }
    await deleteTimetable(form.value.id);
    emit('deleted');
    closeModal();
  } catch (error) {
    console.error('삭제 오류', error);
    alert('삭제 실패:' + error.message);
  }
}

// 모달 닫기
function closeModal() {
  resetForm();
  emit('close');
}

// 과목 목록 불러오기
async function loadSubject() {
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

// 모달 컴포넌트가 마운트되면 과목 목록 1회 불러오기
onMounted(() => {
  if (props.isEditMode && props.initialData) {
    initForm();
  }
});

// year가 바뀔 때마다 재호출 (교수/관리자가 다른 학년 클릭 시)
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initForm();
    loadSubject();
  } else {
    loadSubject();
  }

});
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