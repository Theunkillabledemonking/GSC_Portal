<template>
  <div>
    <h2>회원가입 페이지</h2>
    <form @submit.prevent="emitSubmit">
      <!-- 이메일: 수정 불가 (readonly) -->
      <label>이메일</label>
      <input v-model="form.email" readonly />

      <label>이름</label>
      <input v-model="form.name" />

      <label>학번</label>
      <input v-model="form.student_id" />

      <label>전화번호</label>
      <input v-model="form.phone" />

      <label>학년</label>
      <input v-model="form.grade" />

      <label>레벨 (예: N2, TOPIK 4 등)</label>
      <input v-model="form.level" />

      <button type="submit">등록</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

const emit = defineEmits(['submit'])

// 폼 데이터
const form = ref({
  email: '',
  name: '',
  student_id: '',
  phone: '',
  grade: '',
  level: ''
})

// 쿼리 파라미터 읽기용
const route = useRoute()
// 컴포넌트 로드 시점에 쿼리 파라미터에서 email, name을 가져온다
onMounted(() => {
  form.value.email = route.query.email || ''
  form.value.name = route.query.name || ''
})

const emitSubmit = () => {
  emit('submit', form.value)
}
</script>
<style scoped>
/* 스타일은 필요에 따라 조정 */
input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 10px;
  width: 100%;
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