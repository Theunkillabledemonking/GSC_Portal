<template>
  <section class="notice-form-container bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl max-w-3xl mx-auto p-8 mt-16">
    <h2 class="text-2xl font-bold text-idolPink mb-6 text-center">
      {{ isEdit ? '공지사항 수정' : '공지사항 등록' }}
    </h2>

    <!-- 제목 -->
    <div class="mb-5">
      <label class="form-label">제목</label>
      <input v-model="form.title" type="text" class="form-input" placeholder="공지 제목을 입력해주세요" />
    </div>

    <!-- 내용 -->
    <div class="mb-5">
      <label class="form-label">내용</label>
      <textarea v-model="form.content" class="form-textarea" rows="6" placeholder="공지 내용을 입력해주세요"></textarea>
    </div>

    <!-- 학년 / 과목 / 레벨 -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1">
        <label class="form-label">학년</label>
        <select v-model="form.grade" class="form-select">
          <option value="">전체</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>
      </div>

      <div class="flex-1">
        <label class="form-label">과목</label>
        <select v-model="form.subject_id" class="form-select">
          <option value="">전체</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>

      <div class="flex-1">
        <label class="form-label">레벨</label>
        <select v-model="form.level" class="form-select">
          <option value="">전체</option>
          <option v-for="level in levels" :key="level">{{ level }}</option>
        </select>
      </div>
    </div>

    <!-- 중요 공지 -->
    <div class="mb-4">
      <label class="inline-flex items-center space-x-2 text-sm font-medium">
        <input type="checkbox" v-model="isImportant" @change="handleImportantChange" />
        <span>중요 공지</span>
      </label>
      <div v-if="isImportant" class="mt-2">
        <label class="form-label">만료일</label>
        <input type="date" v-model="form.important_until" class="form-input" />
      </div>
    </div>
    <div class="mb-4">
      <label class="inline-flex items-center space-x-2 text-sm font-medium">
        <input type="checkbox" v-model="form.notify_line" />
        <span>LINE 알림 전송</span>
      </label>
    </div>

    <!-- 파일 업로드 -->
    <div class="mb-6">
      <label class="form-label block mb-2">파일 업로드 (최대 5개)</label>
      <input id="file-upload" type="file" multiple hidden @change="handleFileChange" />
      <label for="file-upload" class="file-upload-button">파일 선택</label>
      <p class="text-sm text-gray-500 mt-1">선택된 파일: {{ uploadedFiles.length }}개</p>
    </div>

    <!-- 🔽 등록/취소 버튼 영역 -->
    <div class="mt-8 flex justify-center gap-4">
      <button @click="$router.back()" class="btn-cancel">
        ← 돌아가기
      </button>
      <button @click="handleSubmit" class="btn-idol px-6">
        {{ isEdit ? '수정하기' : '등록하기' }}
      </button>
    </div>
  </section>
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
  important_until: null,
  notify_line: false
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
        form.value = {
          title: newData.title || "",
          content: newData.content || "",
          grade: newData.grade || "",
          subject_id: newData.subject_id || "",
          level: newData.level || "",
          important_until: newData.important_until || null
        };

        // 🟣 중요 공지값도 반영!
        isImportant.value = !!newData.is_important;

        uploadedFiles.value = []; // 기존 파일은 따로 처리 필요
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

  if (props.isEdit && props.initialData?.is_important) {
    isImportant.value = true;
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
    form.value.level = "ALL";
  }

  if (!validLevels.includes(form.value.level)) {
    alert("잘못된 레벨 값입니다.");
    return;
  }

  const data = {
    ...form.value,
    files: uploadedFiles.value,
    grade: form.value.grade ? Number(form.value.grade) : 0,
    subject_id: form.value.subject_id && form.value.subject_id !== "0"
        ? Number(form.value.subject_id)
        : null,
    level: form.value.level,
    author_id: authStore.user?.id || null,
    is_important: isImportant.value ? 1 : 0,
    important_until: isImportant.value
        ? form.value.important_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null
  };

  if (props.isEdit) {
    emit("updated", data); // ✨ 수정 모드
  } else {
    emit("submitted", data); // ✨ 생성 모드
  }
};

</script>

<style scoped>
.notice-form-container {
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}

/* 공통 라벨 */
.form-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: #444;
}

/* 인풋/셀렉트/텍스트에어리어 */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background-color: #f9f9fb;
  transition: border-color 0.2s ease;
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #f272ba;
  background-color: #fff;
}

.btn-cancel {
  background-color: #e5e5e5;
  color: #333;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  transition: background 0.2s ease;
}
.btn-cancel:hover {
  background-color: #d4d4d4;
}

/* 파일 업로드 버튼 */
.file-upload-button {
  display: inline-block;
  padding: 10px 18px;
  background: linear-gradient(135deg, #f272ba, #ce8ef7);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.file-upload-button:hover {
  background: linear-gradient(135deg, #ec5aa9, #b17be3);
}
</style>
