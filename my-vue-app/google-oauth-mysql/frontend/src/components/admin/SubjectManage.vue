<script setup>
import { ref, onMounted } from "vue";
import { useSubjectStore } from "@/store/subjectStore.js";
import { storeToRefs } from "pinia";

const subjectStore = useSubjectStore();
const { subjects } = storeToRefs(subjectStore);

const newSubject = ref({
  name: "",
  year: "",
  level: ""
});

onMounted(() => {
  subjectStore.loadSubjects();
})

const addSubject = async () => {
  if (!newSubject.value.name || !newSubject.value.year) {
    alert('과목명과 학년은 필수입니다.');
    return;
  }
  await subjectStore.addSubject({ ...newSubject.value });
  // 초기화
  newSubject.value = { name: "", year: "", level: ""};
};

const updateSubject = async (subject) => {
  await subjectStore.updateSubject(subject);
};

const deleteSubject = async (id) => {
  if (confirm("정말 삭제하시겠습니까?")) {
    await subjectStore.deleteSubject(id);
  }
};
</script>

<template>
  <div class="subject-manage">
    <h2>과목 관리</h2>

    <!-- 신규 과목 추가 폼 -->
    <div class="add-form">
      <input v-model="newSubject.name" placeholder="과목명" />
      <select v-model="newSubject.year">
        <option value="">학년 선택</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>
      <select v-model="newSubject.level">
        <option value="">레벨 선택 (선택)</option>
        <option value="N1">N1</option>
        <option value="N2">N2</option>
        <option value="N3">N3</option>
        <option value="TOPIK4">TOPIK4</option>
        <option value="TOPIK6">TOPIK6</option>
      </select>
      <button @click="addSubject">과목 추가</button>
    </div>

    <!-- 과목 목록 -->
    <table>
      <thead>
        <tr>
          <th>번호</th>
          <th>과목명</th>
          <th>학년</th>
          <th>레벨</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(subject, index) in subjects" :key="subject.id">
          <td>{{ index + 1 }}</td>
          <td>
            <input v-model="subject.name" />
          </td>
          <td>
            <select v-model="subject.year">
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
          </td>
          <td>
            <select v-model="subject.level">
              <option value="">없음</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="TOPIK4">TOPIK4</option>
              <option value="TOPIK6">TOPIK6</option>
            </select>
          </td>
          <td>
            <button @click="updateSubject(subject)">수정</button>
            <button @click="deleteSubject(subject.id)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.subject-manage {
  padding: 20px;
}

.add-form input, .add-form select {
  margin-right: 10px;
  padding: 5px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

button {
  margin: 3px;
  padding: 5px 10px;
  cursor: pointer;
}
</style>