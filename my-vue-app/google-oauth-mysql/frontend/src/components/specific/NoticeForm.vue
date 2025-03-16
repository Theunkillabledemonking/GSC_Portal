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
        <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
      </select>

      <!-- ✅ 중요 공지 체크 -->
      <label>
        <input type="checkbox" v-model="form.is_important" :true-value="1" :false-value="0" />
        중요 공지 (⭐)
      </label>

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

const props = defineProps({
  isEdit: Boolean,
  initialData: Object
});

const emit = defineEmits(["submit"]);

const form = ref({
  title: "",
  content: "",
  grade: "",
  subject_id: "",
  level: "",
  is_important: 0,
  files: []
});

const uploadedFiles = ref([]);
const subjects = ref([]);
const levels = ["N3", "N2", "N1", "TOPIK4", "TOPIK6"]; // ✅ 레벨 리스트

// ✅ 학년 변경 시 과목 자동 불러오기
const loadSubjectsByGrade = async () => {
  if (!form.value.grade) {
    subjects.value = [];
    return;
  }
  try {
    const res = await axios.get(`/api/subjects/year/${form.value.grade}`);
    subjects.value = res.data.subjects;
  } catch (error) {
    console.log('과목 불러오기 실패', error);
    subjects.value = [];
  }
};

// ✅ 기존 데이터 로드 (수정 모드)
watch(() => props.initialData, (newData) => {
  if (props.isEdit && newData) {
    form.value = {
      title: newData.title || '',
      content: newData.content || '',
      grade: newData.grade ?? '',
      subject_id: newData.subject_id ?? '',
      level: newData.level ?? '',
      is_important: newData.is_important === 1 ? 1 : 0,
      files: []
    };

    // 학년이 선택되어 있으면 과목 불러오기
    if (form.value.grade) {
      loadSubjectsByGrade();
    }
  }
}, { immediate: true });

// ✅ 학년 변경 감지 후 과목 자동 로드
watch(() => form.value.grade, (newGrade) => {
  loadSubjectsByGrade();
});

// ✅ 첨부파일 추가 (최대 5개)
const handleFileChange = (e) => {
  if (uploadedFiles.value.length >= 5) {
    alert("최대 5개의 파일만 업로드할 수 있습니다.");
    return;
  }

  for (let file of e.target.files) {
    if (uploadedFiles.value.length >= 5) break;
    uploadedFiles.value.push(file);
  }
};

// ✅ 첨부파일 삭제
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

// ✅ 폼 제출
const handleSubmit = () => {
  const data = new FormData();
  data.append('title', form.value.title);
  data.append('content', form.value.content);
  data.append('subject_id', form.value.subject_id ?? '');
  data.append('grade', form.value.grade ?? '');
  data.append('level', form.value.level ?? '');
  data.append('is_important', form.value.is_important);

  // ✅ 파일 추가 (최대 5개)
  uploadedFiles.value.forEach(file => {
    data.append('attachments', file);
  });

  emit("submit", data);
};
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
