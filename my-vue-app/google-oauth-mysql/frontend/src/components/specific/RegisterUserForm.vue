<template>
  <div class="register-container">
    <h1>회원가입</h1>
    <form @submit.prevent="handleSubmit">
      <!-- ✅ 이메일 수정 불가 (Google 로그인 후 자동 입력) -->
      <input v-model="user.email" type="email" placeholder="이메일" required disabled />

      <input v-model="user.name" type="text" placeholder="이름" required />
      <input v-model="user.student_id" type="text" placeholder="학번" />
      <input v-model="user.phone" type="text" placeholder="전화번호" />

      <!-- ✅ 레벨 선택 -->
      <select v-model="user.level" required>
        <option value="" disabled>레벨 선택</option>
        <option value="N3">N3</option>
        <option value="N2">N2</option>
        <option value="N1">N1</option>
        <option value="TOPIK4">TOPIK4</option>
        <option value="TOPIK6">TOPIK6</option>
        <option value="미정">미정</option>
      </select>

      <button type="submit">가입하기</button>
    </form>
    <!-- 승인 대기 메시지 추가 -->
    <p v-if="message" class="error">{{ message }}</p>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import { defineEmits } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const emits = defineEmits(["submit"]);

const user = ref({
  email: "", // ✅ Google 로그인 후 자동 입력
  name: "",
  student_id: "",
  phone: "",
  level: "",
});

const message = ref("");

// ✅ Google OAuth에서 받은 이메일을 자동 입력
onMounted(() => {
  if (route.query.email) {
    user.value.email = route.query.email;
  }
});
// ✅ 폼 제출 시 부모 컴포넌트로 데이터 전달
const handleSubmit = () => {
  emits("submit", user.value);
};

</script>
<style scoped>
.register-container {
  text-align: center;
  margin-top: 50px;
}
input, select {
  display: block;
  width: 80%;
  padding: 10px;
  margin: 10px auto;
}
.error {
  color: red;
  font-weight: bold;
  margin-top: 20px;
}
</style>
