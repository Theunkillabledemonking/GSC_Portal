<script setup>
import { ref, onMounted } from "vue";
import { useSubjectStore } from "@/store/subjectStore.js";
import { storeToRefs } from "pinia";

const subjectStore = useSubjectStore();
const { subjects } = storeToRefs(subjectStore);

const newSubject = ref({
  name: "",
  year: "",
  level: "",
  is_special_lecture: false
});

const onSpecialLectureToggle = (subject) => {
  if (subject.is_special_lecture) {
    subject.year = null;
  }
};

onMounted(() => {
  subjectStore.loadSubjects();
})

const addSubject = async () => {
  if (!newSubject.value.name) {
    alert('과목명과 학년은 필수입니다.');
    return;
  }
  if (!newSubject.value.is_special_lecture && !newSubject.value.year) {
    alert('정규 과목은 학년을 선택해야 합니다.');
  }

  await subjectStore.addSubject({
    ...newSubject.value,
    year: newSubject.value.is_special_lecture ? null : newSubject.value.year,
    is_special_lecture: newSubject.value.is_special_lecture ? 1 : 0,
  });

  // 초기화
  newSubject.value = { name: "", year: "", level: "", is_special_lecture: false };
};

const updateSubject = async (subject) => {
  const payload = {
    ...subject,
    is_special_lecture: subject.is_special_lecture ? 1 : 0,
    year: subject.is_special_lecture ? null : subject.year,
    level: subject.level || null,
  };

  await subjectStore.updateSubject(payload);
};

const getSubjectType = (isSpecial) => {
  return isSpecial ? '특강' : '정규';
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
      <select v-model="newSubject.year" :disabled="newSubject.is_special_lecture">
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
      <label>
        <input type="checkbox" v-model="newSubject.is_special_lecture" />
        특강 여부
      </label>
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
          <th>유형</th>
          <th>관리</th>
          <th>정규 / 특강</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(subject, index) in subjects" :key="subject.id">
          <td>{{ index + 1 }}</td>
          <td>
            <input v-model="subject.name" />
          </td>
          <td>
            <select v-model="subject.year" :disabled="subject.is_special_lecture">
              <option value="">전체</option>
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
            <span :class="subject.is_special_lecture ? 'badge special' : 'badge normal'">
              {{ getSubjectType(subject.is_special_lecture) }}
            </span>
          </td>
          <td>
            <button @click="updateSubject(subject)">수정</button>
            <button @click="deleteSubject(subject.id)">삭제</button>
          </td>
          <td>
            <label
                :class="['lecture-checkbox', subject.is_special_lecture ? 'special' : '']"
            >
              <input
                  type="checkbox"
                  v-model="subject.is_special_lecture"
                  @change="() => {
                  if (subject.is_special_lecture) subject.year = null;
               }"
              />
              특강 여부
            </label>
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

.add-form input,
.add-form select {
  margin-right: 10px;
  padding: 5px;
}

.global-level {
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

button {
  margin: 3px;
  padding: 5px 10px;
  cursor: pointer;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
}

.badge.special {
  background-color: #007BFF;
  color: white;
}

.badge.normal {
  background-color: #28A745;
  color: white;
}

.lecture-checkbox {
  display: inline-block;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: 0.2s all;
}

.lecture-checkbox.special {
  background-color: #e6f0ff;
  border: 1px solid #3399ff;
  font-weight: bold;
  color: #0056b3;
}

</style>