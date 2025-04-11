<template>
  <div class="register-container">
    <h1>회원가입</h1>
    <form @submit.prevent="handleSubmit">
      <!-- ✅ 이메일 수정 불가 (Google 로그인 후 자동 입력) -->
      <input v-model="user.email" type="email" placeholder="이메일" required disabled />

      <input v-model="user.name" type="text" placeholder="이름" required />
      <input v-model="user.student_id" type="text" placeholder="학번" required />
      <input v-model="user.phone" type="text" placeholder="전화번호" required />

      <!-- 외국인/한국인 구분 먼저 선택 -->
      <select v-model="user.is_foreigner" required>
        <option disabled value="">구분 선택</option>
        <option :value="0">한국인 (일본어 수업)</option>
        <option :value="1">외국인 (한국어 수업)</option>
      </select>

      <!-- is_foreigner 따라 레벨 선택 -->
      <select v-model="user.level" :disabled="user.is_foreigner === ''" required>
        <option disabled value="">레벨 선택</option>
        <option v-for="opt in levelOptions" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
      <button type="submit">가입하기</button>
    </form>
    <!-- 승인 대기 메시지 추가 -->
    <p v-if="message" class="error">{{ message }}</p>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { defineEmits } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const emits = defineEmits(["submit"]);

const user = ref({
  email: "", // ✅ Google 로그인 후 자동 입력
  name: "",
  student_id: "",
  phone: "",
  level: "",
  is_foreigner: "",
});

const message = ref("");

// ✅ Google OAuth에서 받은 이메일을 자동 입력
onMounted(() => {
  if (route.query.email) {
    user.value.email = route.query.email;
  }
});

// 레벨 옵션: is_foreigner 값에 따라 변경
const levelOptions = computed(() => {
  if (user.value.is_foreigner === 0) {
    return ["N3", "N2", "N1"]
  } else if (user.value.is_foreigner === 1) {
    return ["TOPIK4", "TOPIK6"];
  } else {
    return [];
  }
})

// 자동 이메일 채우기
onMounted(() => {
  if (route.query.email) {
    user.value.email = route.query.email;
  }
})

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
