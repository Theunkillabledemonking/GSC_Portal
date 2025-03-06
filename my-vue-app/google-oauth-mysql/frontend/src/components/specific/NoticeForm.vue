<template>
  <div class="notice-form">
    <h2>{{ isEdit ? '공지사항 수정' : '📢공지사항 등록' }}</h2>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
      <label for="title">제목:</label>
      <input v-model="form.title" type="text" id="title" required />

      <label for="content">내용:</label>
      <textarea v-model="form.content" id="content" cols="30" rows="10" required></textarea>

      <label for="grade">대상 학년 (선택):</label>
      <select v-model="form.grade" id="grade">
        <option value="">전체</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <label for="subject">과목 선택</label>
      <select v-model="form.subject_id" id="subject">
        <option value="">전체</option>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
          {{ subject.name }}
        </option>
      </select>
      <!-- 중요 공지 체크박스 추가 -->
      <label>
        <input type="checkbox" v-model="form.is_important"
          :true-value="1" :false-value="0" />
        중요 공지 (★)
      </label>

      <!-- 첨부파일 업로드 추가 -->
      <label>첨부파일:</label>
      <input type="file" @change="handleFileChange" />

      <button type="submit">{{ isEdit ? '수정하기' : '등록하기'}}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, defineProps, watch, onMounted } from "vue";
import axios from 'axios';
import { useNoticeStore } from "@/store/noticeStore.js";
import { useRouter } from "vue-router";

const props = defineProps({
  isEdit: Boolean,          // 작성 / 수정 모드 구분
  initialData: Object       // 수정일 경우 기존 데이터
})

const noticeStore = useNoticeStore();
const router = useRouter();

const form = ref ({
  title: "",
  subject_id: "",
  content: "",
  grade: "",
  is_important: '0',
  attachment: null  // 파일 업로드용
})

const subjects = ref([]);

// 학년별 과목 불러오기
const loadSubjectsByGrade = async () => {
  if (!form.value.grade) {
    subjects.value = [];
    return;
  }
  try {
    const res = await axios.get(`/api/subjects/year/${form.value.grade}`);
    subjects.value = res.data.subjects;
  } catch (error) {
    console.log('과목별 불러오기 실패',error);
    subjects.value = [];
  }
};

watch(() => props.initialData, (newData) => {
  if (props.isEdit && newData) {
    form.value = {
      title: newData.title || '',
      content: newData.content || '',
      grade: newData.grade ?? '',
      subject_id: newData.subject_id ?? '',
      is_important: newData.is_important === 1 ? '1' : '0',
      attachment: null
    };
    if (form.value.grade) {
      loadSubjectsByGrade(); // 수정 시에도 학년 맞는 과목 불러오기
    }
  }
}, { immediate: true });

// 새로 공지 작성 시, 학년이 변경될 때마다 과목 목록 갱신
watch(() => form.value.grade, (newGrade) => {
  if (!props.isEdit) {
    loadSubjectsByGrade();
  }
});

const handleFileChange = (e) => {
  form.value.attachment = e.target.files[0];
}

const handleSubmit = async () => {
  const data = new FormData();
  data.append('title', form.value.title);
  data.append('content', form.value.content);
  data.append('subject_id', form.value.subject_id ?? '');
  data.append('grade', form.value.grade ?? '');
  data.append('is_important', form.value.is_important);

  if (form.value.attachment) {
    data.append('attachment', form.value.attachment);
  }

  if (props.isEdit) {
    await noticeStore.editNotice(props.initialData.id, data);
    alert('공지사항이 수정되었습니다.');
  } else {
    await noticeStore.addNotice(data);
    alert('공지사항이 등록되었습니다.');
  }

  router.push("/notices");
};

//     // 카톡 알림은 추후 구편
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