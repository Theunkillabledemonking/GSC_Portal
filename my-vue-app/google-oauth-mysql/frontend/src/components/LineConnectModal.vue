// ✅ LineConnectModal.vue – 완전체 리팩토링
<template>
  <div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-center">
    <div class="glass-card mt-24 w-full max-w-sm text-center">
      <div class="flex flex-col items-center gap-2 relative">
        <div class="qr-container">
          <div class="qr-reflection"></div>
          <img src="../assets/line-qr.png" alt="QR" class="qr-image" />
        </div>

        <button @click="requestCode" class="btn-idol">인증번호 받기</button>

        <div v-if="lineStore.authCode" class="auth-code-text">
          🔐 인증번호: <span class="font-bold text-pink-600">{{ lineStore.authCode }}</span>
        </div>

        <p v-if="socketStore.message" class="text-green-600 font-semibold">
          {{ socketStore.message }}
        </p>
      </div>

      <!-- 실시간 인증 결과 -->
      <p v-if="socketStore.message" class="text-green-600 font-semibold mb-2">
        {{ socketStore.message }}
      </p>

      <button @click="$emit('close')" class="text-sm text-idolPink hover:underline">닫기</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore, useLineStore, useLineSocketStore } from '@/store'

const authStore = useAuthStore()
const lineStore = useLineStore()
const socketStore = useLineSocketStore()

const requestCode = async () => {
  await lineStore.requestAuthCode(authStore.user?.id)
}

onMounted(() => {
  socketStore.initSocket(authStore.user?.id)
})

onUnmounted(() => {
  socketStore.resetState()
})
</script>

<style scoped>
.qr-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-image {
  width: 8rem;
  height: 8rem;
  border-radius: 0.75rem;
  box-shadow: 0 0 20px rgba(156, 39, 176, 0.3),
  0 0 40px rgba(103, 58, 183, 0.2);
  z-index: 2;
}

.qr-reflection {
  position: absolute;
  width: 8rem;
  height: 8rem;
  border-radius: 0.75rem;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%);
  filter: blur(12px);
  z-index: 1;
}

.auth-code-text {
  font-size: 0.95rem;
  color: #4b5563;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.btn-idol {
  background: linear-gradient(135deg, #f272ba, #ce8ef7);
  color: white;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}
.btn-idol:hover {
  background: linear-gradient(135deg, #ec5aa9, #b17be3);
}
</style>
