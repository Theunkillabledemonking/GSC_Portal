<template>
  <!-- ✅ 화면 전체 고정 + 중앙 정렬 -->
  <div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-center">
    <div class="glass-card mt-24 w-full max-w-sm text-center">
      <img src="../assets/line-qr.png" alt="QR" class="w-32 h-32 mx-auto mb-2" />

      <div class="flex items-center justify-center gap-2 text-gray-700 mb-1 text-sm">
        <img src="../assets/line_88.png" class="w-5 h-5" />
        <span class="font-semibold">LINE 친구 추가 후</span>
      </div>
      <p class="text-sm text-gray-600 mb-4">아래 인증번호를 입력해주세요.</p>

      <!-- 인증번호 요청 버튼 -->
      <button @click="requestCode" class="btn-idol mb-3">인증번호 받기</button>

      <div class="flex gap-2 mb-3">
        <input
            v-model="code"
            placeholder="인증번호 6자리"
            maxlength="6"
            class="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button @click="verify" class="btn-idol">인증하기</button>
      </div>

      <p v-if="result" class="text-sm text-gray-500 mb-2">{{ result }}</p>

      <button @click="$emit('close')" class="text-sm text-idolPink hover:underline">닫기</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const authStore = useAuthStore()
const code = ref('')
const result = ref('')

// ✅ 인증번호 요청
const requestCode = async () => {
  console.log("✅ 현재 로그인된 사용자 ID:", authStore.user)

  try {
    const res = await axios.post('/api/line/generate', {
      user_id: authStore.user?.id
    })
    result.value = `✅ 인증번호: ${res.data.code} (LINE에도 전송됨)`
  } catch (err) {
    result.value = err.response?.data?.message || '인증번호 요청 실패'
  }
}


// ✅ 인증번호 검증
const verify = async () => {
  try {
    const res = await axios.post('/api/line/verify', {
      code: code.value,
      line_user_id: authStore.user?.line_user_id || "U210a4d204e3333a1a5642bace7e49051" // 테스트용
    }, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })
    result.value = res.data.message || 'LINE 계정 연동 성공!'
  } catch (err) {
    result.value = err.response?.data?.message || '인증 실패'
  }
}
</script>
