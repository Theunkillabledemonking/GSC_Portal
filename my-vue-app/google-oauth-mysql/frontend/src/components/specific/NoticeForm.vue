<template>
  <div class="notice-form">
    <h2>{{ isEdit ? '📌 공지사항 수정' : '📢 공지사항 등록' }}</h2>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
      <label for="title">제목:</label>
      <input v-model="form.title" type="text" id="title" required />

      <label for="content">내용:</label>
      <textarea v-model="form.content" id="content" cols="30" rows="10" required></textarea>

      <!-- ✅ 학년 선택 (선택 시 과목 자동 변경) -->
      <label for="grade">대상 학년:</label>
      <select v-model="form.grade" id="grade">
        <option value="">전체</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <!-- ✅ 과목 선택 (학년 변경 시 동적으로 변경됨) -->
      <label for="subject">과목 선택:</label>
      <select v-model="form.subject_id" id="subject">
        <option value="">전체</option>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
          {{ subject.name }}
        </option>
      </select>

      <!-- ✅ 레벨 선택 -->
      <label for="level">레벨 선택:</label>
      <select v-model="form.level" id="level">
        <option value="">전체</option>
        <option v-for="level in levels" :key="level" :value="level">{{ level === "ALL" ? "전체" : level }}</option>
      </select>

      <!-- ✅ 중요 공지 체크 -->
      <label>
        <input type="checkbox" v-model="isImportant" @change="handleImportantChange" />
        중요 공지 (⭐)
      </label>

      <!-- ✅ 중요 공지 체크된 경우에만 만료 날짜 설정 -->
      <div v-if="isImportant">
        <label for="important_until">공지 만료 날짜:</label>
        <input type="date" v-model="form.important_until" id="important_until" />
      </div>

      <!-- ✅ 첨부파일 업로드 (최대 5개) -->
      <label>첨부파일 (최대 5개):</label>
      <input type="file" multiple @change="handleFileChange" :disabled="uploadedFiles.length >= 5" />

      <!-- ✅ 첨부된 파일 리스트 & 삭제 가능 -->
      <ul class="file-list">
        <li v-for="(file, index) in uploadedFiles" :key="index">
          <span>{{ file.name }}</span>
          <button type="button" @click="removeFile(index)">❌</button>
        </li>
      </ul>

      <button type="submit">{{ isEdit ? '수정하기' : '등록하기' }}</button>
    </form>
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

// onMounted(() => {
//   // 수정 모드라면 initialData에서 값 불러오기
//   if (props.isEdit && props.initialData) {
//     form.value = {
//       title: props.initialData.title || "",
//       content: props.initialData.content || "",
//       grade: props.initialData.grade || "",
//       level: props.initialData.level || "",
//       is_important: props.initialData.is_important || 0
//     };
//   }
// });
</script>

<style scoped>
.notice-form {
  padding: 20px;
}

input, textarea, select {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}

.file-list {
  list-style: none;
  padding: 0;
}

.file-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f1f1;
  margin-top: 5px;
  padding: 5px;
  border-radius: 5px;
}

.file-list button {
  background: red;
  color: white;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 3px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
