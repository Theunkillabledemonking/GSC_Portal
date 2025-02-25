<template>
  <div class="register">
    <h1>회원 정보 등록</h1>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="name">이름</label>
        <input type="text" id="name" v-model="user.name" required />
      </div>

      <div class="form-group">
        <label for="phone_number">전화번호</label>
        <input type="text" id="phone_number" v-model="user.phone_number" required />
      </div>

      <div class="form-group">
        <label for="student_id">학번</label>
        <input type="text" id="student_id" v-model="user.student_id" required />
      </div>

      <div class="form-group">
        <label for="user_type">사용자 유형</label>
        <select id="user_type" v-model="user.user_type" required>
          <option value="STUDENT">학생</option>
          <option value="PROFESSOR">교수</option>
        </select>
      </div>

      <div v-if="user.user_type === 'STUDENT'" class="form-group">
        <label for="grade">학년</label>
        <input type="number" id="grade" v-model="user.grade" min="1" max="3" />
      </div>

      <div v-if="user.user_type === 'STUDENT'" class="form-group">
        <label for="level">레벨</label>
        <input type="text" id="level" v-model="user.level" />
      </div>

      <button type="submit">등록하기</button>
    </form>
  </div>
</template>

<script setup>
import { ref, toRaw } from "vue";
import axios from "../axios.js";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth.js";
import { onMounted } from "vue";

const authStore = useAuthStore();
const router = useRouter();

// 페이지 접근 제한
onMounted(async () => {
  if (!authStore.isAuthenticated) return;

  try {
    const response = await axios.get("http://localhost:5000/api/user-status", {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    });

    const { is_approved, is_first_input } = response.data;

    // ✅ 이미 입력했으면 승인 대기 페이지로 이동
    if (is_first_input === 1) {
      alert("이미 정보를 입력하셨습니다. 승인 대기 중입니다.");
      router.push("/pending-approval");
    }
  } catch (error) {
    console.error("사용자 상태 확인 중 오류 발생:", error);
  }
});

// ✅ 사용자 정보 초기화
const user = ref({
  name: "",
  phone_number: "",
  student_id: "",
  user_type: "STUDENT",
  grade: "",
  level: "",
});

// ✅ URL에서 Access Token과 Refresh Token 가져오기
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("accessToken");
const refreshToken = urlParams.get("refreshToken");

// ✅ 사용자 정보 제출 함수
const submitForm = async () => {
  try {
    console.log("accessToken:", accessToken);
    console.log("폼 데이터:", toRaw(user.value)); // ✅ 확인용

    const response = await axios.post("http://localhost:5000/api/register",
        JSON.parse(JSON.stringify(user.value)), {
      headers: {
        Authorization: `Bearer ${authoStore.accessToken}`,
      },
      withCredentials: true, // CORS credentials
    });

    console.log("등록 성공:", response.data);
    router.push("/pending-approval");
  } catch (error) {
    console.error("등록 실패", error.response?.data?.message || error.message);
  }
};
</script>

<style scoped>
.register {
  width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
</style>
