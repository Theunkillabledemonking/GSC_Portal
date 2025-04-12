// ✅ LineConnectModal.vue – 완전체 리팩토링
<template>
  <div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-center">
    <div class="glass-card mt-24 w-full max-w-sm text-center">
      <img src="../assets/line-qr.png" alt="QR" class="w-32 h-32 mx-auto mb-2" />

      <div class="flex items-center justify-center gap-2 text-gray-700 mb-1 text-sm">
        <img src="../assets/line_88.png" class="w-5 h-5" />
        <span class="font-semibold">LINE 친구 추가 후</span>
      </div>
      <p class="text-sm text-gray-600 mb-4">아래 인증번호를 LINE으로 전송해주세요.</p>

      <!-- 인증번호 요청 버튼 -->
      <button @click="requestCode" class="btn-idol mb-3">인증번호 받기</button>

      <!-- 인증번호 표시 -->
      <div class="text-sm mb-3 text-gray-800" v-if="lineStore.authCode">
        🔐 인증번호: <span class="font-bold text-pink-600">{{ lineStore.authCode }}</span>
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
import { useAuthStore } from '@/store/authStore'
import { useLineStore } from '@/store/lineStore'
import { useLineSocketStore } from '@/store/lineSocketStore'

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
