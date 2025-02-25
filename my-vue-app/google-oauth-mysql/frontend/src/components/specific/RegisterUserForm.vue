<script setup>
import { ref, defineEmits } from 'vue';

// 사용자 입력 데이터
const name = ref('');
const student_id = ref('');
const phone = ref('');
const grade = ref('');
const level = ref('');

// 부모 컴포넌트로 이벤트 전달
const emit = defineEmits(['submit']);

// 정보 제출 함수
const handleSubmit = async () => {
  emit('submit', {
    name: name.value,
    student_id: student_id.value,
    phone: phone.value,
    grade: grade.value,
    level: level.value
  });
};
</script>

<template>
  <div class="register-user-form">
    <h2>사용자 정보 등록</h2>
    <input v-model="name" placeholder="이름" disabled />
    <input v-model="student_id" placeholder="학번" disabled/>
    <input v-model="phone" placeholder="전화번호" />
    <input v-model="grade" placeholder="학년 (1~3)" />
    <input v-model="level" placeholder="레벨 (TOPIK 6, N1 등)" />

    <button @click="handleSubmit">등록</button>
  </div>
</template>

<style scoped>
.register-user-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
  margin: 0 auto;
}

input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  padding: 10px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  color: white;
  background-color: #4caf50;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}
</style>