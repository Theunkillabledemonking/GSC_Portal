<template>
  <div class="notice-card">
    <h2 class="title">📢 공지사항 등록</h2>

    <!-- 📌 기본 정보 -->
    <div class="section">
      <label for="title">📝 제목</label>
      <input v-model="form.title" id="title" placeholder="공지 제목을 입력해주세요" />
    </div>

    <div class="section">
      <label for="content">💬 내용</label>
      <textarea v-model="form.content" id="content" placeholder="공지 내용을 작성해주세요" rows="5" />
    </div>

    <!-- 🎓 대상 정보 -->
    <div class="section">
      <h3 class="section-title">🎯 대상 정보</h3>
      <div class="triple-input">
        <div>
          <label>학년</label>
          <select v-model="form.grade">
            <option value="">전체</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </div>
        <div>
          <label>과목</label>
          <select v-model="form.subject_id">
            <option value="">전체</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>
        <div>
          <label>레벨</label>
          <select v-model="form.level">
            <option value="">전체</option>
            <option v-for="level in levels" :key="level">{{ level }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 🌟 중요 및 파일 -->
    <div class="section">
      <label class="checkbox">
        <input type="checkbox" v-model="isImportant" @change="handleImportantChange" />
        중요 공지 (⭐)
      </label>

      <div v-if="isImportant" class="important-date">
        <label for="important_until">만료 날짜:</label>
        <input type="date" v-model="form.important_until" id="important_until" />
      </div>

      <div class="upload-wrap">
        <label for="file-upload" class="file-btn">📎 파일 선택</label>
        <input id="file-upload" type="file" multiple @change="handleFileChange" :disabled="uploadedFiles.length >= 5" hidden />
        <p class="file-info">선택된 파일: {{ uploadedFiles.length }}개</p>
      </div>
    </div>

    <!-- 등록 버튼 -->
    <button class="submit-btn" @click="handleSubmit">✨ 등록하기</button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from "vue";
import axios from 'axios';
import {useAuthStore} from "@/store/authStore.js";

const authStore = useAuthStore();

const props = defineProps({
  isEdit: Boolean,
  initialData: Object
});

// emits: 폼 전송 후 상위에게 알릴 수도 있음 (옵션)
const emit = defineEmits(["submitted"]);

const form = ref({
  title: "",
  content: "",
  grade: "",
  subject_id: "",
  level: "",
  important_until: null
});

const isImportant = ref(false);
// ✅ 중요 공지 체크박스 변경 감지
const handleImportantChange = () => {
  if (!isImportant.value) {
    form.value.important_until = null; // ✅ 체크 해제 시 만료일 제거
  }
};

const uploadedFiles = ref([]);
const subjects = ref([]);
const levels = ["ALL", "N3", "N2", "N1", "TOPIK4", "TOPIK6"]; // ✅ 레벨 리스트



// ✅ 학년 변경 시 과목 자동 불러오기
const loadSubjectsByGrade = async () => {
  if (!form.value.grade) {
    subjects.value = [];
    return;
  }

  if (!authStore.token) {
    console.log("토큰 없음 localStorage에서 가져옴");
    authStore.token = localStorage.getItem("token");
  }

  console.log("📌 현재 토큰:", authStore.token); // 🚨 디버깅용 로그 추가
  try {
    console.log(`학년 변경 감지: ${form.value.grade}`);
    const res = await axios.get(`/api/subjects/year/${form.value.grade}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    subjects.value = res.data.subjects;
  } catch (error) {
    console.log('과목 불러오기 실패', error);
    subjects.value = [];
  }
};

// ✅ 기존 데이터 로드 (수정 모드)
watch(
    () => props.initialData,
    (newData) => {
      if (props.isEdit && newData) {
        form.value = { ...newData };
        // 기존 파일은 다시 업로드받아야 하므로 uploadedFiles는 비움
        uploadedFiles.value = [];
        // 학년 존재 시 과목 목록 로드
        if (form.value.grade) {
          loadSubjectsByGrade();
        }
      }
    },
    { immediate: true }
);

// ✅ 학년 변경 감지 후 과목 자동 로드
watch(
    () => form.value.grade,
    () => {
      loadSubjectsByGrade();
    }
);

// ✅ 초기 데이터 로드 (onMounted)
onMounted(async () => {
  if (authStore.token) {
    console.log("✅ 토큰 확인됨.");
  } else {
    console.log("🚨 토큰이 없음. localStorage에서 가져옴.");
    authStore.token = localStorage.getItem("token");
  }

  try {
    const res = await axios.get("/api/subjects", {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    subjects.value = res.data.subjects;
  } catch (error) {
    console.error("🚨 과목 목록 불러오기 실패:", error);
    subjects.value = [];
  }
});

// ✅ 첨부파일 추가 (최대 5개)
// 파일 선택 이벤트 처리: FileList를 배열로 변환하여 uploadedFiles에 추가합니다.
const handleFileChange = (e) => {
  // 만약 업로드된 파일 수가 5개를 초과하면 경고
  if (uploadedFiles.value.length >= 5) {
    alert("최대 5개의 파일만 업로드할 수 있습니다.");
    return;
  }

  // FileList를 배열로 변환하여 추가 (최대 5개 까지)
  const filesArray = Array.from(e.target.files);
  filesArray.forEach(file => {
    if (uploadedFiles.value.length < 5) {
      uploadedFiles.value.push(file);
    }
  });
};

// ✅ 첨부파일 삭제
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};


// 폼 제출: (텍스트 필드 + 파일 배열)만 store에 전달
const handleSubmit = () => {
  const validLevels = ["ALL", "N1", "N2", "N3", "TOPIK4", "TOPIK6"];

  if (!validLevels.includes(form.value.level)) {
    form.value.level = "ALL";  // ✅ 기본값을 "ALL"로 설정
  }

  if (!validLevels.includes(form.value.level)) {
    alert("잘못된 레벨 값입니다.");
    return;
  }
  const data = {
    ...form.value,
    files: uploadedFiles.value,
    grade: form.value.grade ? Number(form.value.grade) : 0, // null이면 기본값 0
    subject_id: form.value.subject_id ? Number(form.value.subject_id) : 0, // null이면 기본값 0
    level: form.value.level,
    author_id: authStore.user?.id || null,
    is_important: form.value.isImportant ? 1 : 0,
    important_until: form.value.isImportant ? form.value.important_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null
  };
  emit("submitted", data);
};

</script>

<style scoped>.notice-card {
  background: #fff;
  padding: 40px;
  max-width: 720px;
  margin: 40px auto;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.07);
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}

.title {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #555;
}

label {
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
  color: #666;
}

input,
textarea,
select {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #f9f9fb;
  transition: border 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #f272ba;
  background: #fff;
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

.triple-input {
  display: flex;
  gap: 12px;
}

.triple-input > div {
  flex: 1;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-top: 10px;
}

.important-date {
  margin-top: 10px;
}

.file-label {
  margin-top: 18px;
  font-weight: 500;
}

.file-list {
  list-style: none;
  padding-left: 0;
  margin-top: 10px;
}

.file-list li {
  background: #f0f0f5;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-list button {
  background: #ff5e6c;
  border: none;
  color: white;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #f272ba, #ce8ef7);
  color: white;
  padding: 14px 0;
  font-size: 16px;
  font-weight: bold;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 30px;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #ec5aa9, #b17be3);
  transform: scale(1.02);
}
.triple-input select {
  height: 48px;
  font-size: 15px;
}

.upload-wrap {
  margin-top: 16px;
  text-align: left;
}

.file-btn {
  display: inline-block;
  background: linear-gradient(135deg, #f272ba, #ce8ef7);
  color: white;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.file-btn:hover {
  background: linear-gradient(135deg, #ec5aa9, #b17be3);
}

.file-info {
  font-size: 13px;
  color: #555;
  margin-top: 6px;
}


</style>
