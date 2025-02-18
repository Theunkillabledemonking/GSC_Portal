<template>
  <div>
    <h2>로그인</h2>
    <button @click="googleLogin">Google 로그인</button>
  </div>
</template>

<script>
export default {
  name: "LoginView",
  methods: {
    googleLogin() {
      // 백엔드 /auth/google 로 이동 (Oauth 시작)
      window.location.href = "http://abcqkdnxm.o-r.kr:5000/auth/google";
    }
  }
};
</script>
