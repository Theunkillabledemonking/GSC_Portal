<template>
  <div v-if="notice" class="notice-wrapper font-idol">
    <div class="notice-card">
      <!-- 제목 + 중요뱃지 -->
      <div class="border-b border-white/30 pb-6 mb-6 flex justify-between items-start flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <span v-if="notice?.is_important" class="badge-idol">중요한 공지</span>
          <h2 class="text-3xl md:text-4xl font-extrabold text-idolPink tracking-tight">
            {{ notice.title }}
          </h2>
        </div>
        <!-- 관리자 버튼 -->
        <div v-if="canEdit" class="flex gap-2">
          <button class="btn-soft text-sm" @click="goToEditNotice">수정</button>
          <button class="btn-danger text-sm" @click="confirmDelete">삭제</button>
        </div>
      </div>

      <!-- 메타 정보 -->
      <div class="flex flex-wrap justify-between text-sm text-gray-600 mb-6">
        <span>작성자: <strong>{{ notice.author }}</strong></span>
        <span>작성일: {{ formatDate(notice.created_at) }}</span>
        <span>조회수: {{ notice.views }}</span>
      </div>

      <!-- 내용 -->
      <div class="notice-content">
        {{ notice.content }}
      </div>

      <!-- 첨부파일 -->
      <div v-if="notice.attachments?.length" class="attachments-box mt-8">
        <h3 class="font-bold text-idolPurple mb-2">📎 첨부파일</h3>
        <ul class="space-y-1 pl-4 list-disc text-idolBlue text-sm">
          <li v-for="file in notice.attachments" :key="file.id">
            <a :href="file.url" class="hover:underline" target="_blank">{{ file.name }}</a>
          </li>
        </ul>
      </div>

      <!-- 목록 버튼 -->
      <div class="mt-10 flex justify-center">
        <button class="btn-soft px-5 py-2 text-sm" @click="goBack">← 목록</button>
      </div>
    </div>
  </div>

  <!-- 로딩 중 -->
  <div v-else class="text-center py-10 text-gray-400 flex flex-col items-center">
    <span class="animate-spin h-6 w-6 border-4 border-idolPink border-t-transparent rounded-full mb-3"></span>
    <span>📡 공지를 불러오는 중입니다...</span>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoticeStore, useAuthStore } from '@/store';

const route = useRoute();
const router = useRouter();
const noticeStore = useNoticeStore();
const authStore = useAuthStore();

const notice = computed(() => noticeStore.selectedNotice);
const canEdit = computed(() => authStore.role === 1 || (authStore.role === 2 && notice.value?.author_id === authStore.user?.id));

const goBack = () => router.push('/notices');
const goToEditNotice = () => router.push(`/notices/edit/${route.params.id}`);
const confirmDelete = async () => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await noticeStore.removeNotice(route.params.id);
    goBack();
  }
};

const formatDate = (date) => new Date(date).toLocaleString();

onMounted(() => {
  if (route.params.id) noticeStore.loadNotice(route.params.id);
});

watch(() => route.params.id, (newId) => {
  if (newId) noticeStore.loadNotice(newId);
});
</script>

<style scoped>
.notice-wrapper {
  @apply min-h-screen bg-gradient-to-br from-idolGray to-white flex justify-center items-start py-20 px-4;
  background-image: url('@/assets/bg-idol-portal.svg'), linear-gradient(to bottom right, #f4f4f6, #ffffff);
  background-size: cover;
  background-repeat: no-repeat;
  background-blend-mode: lighten;
  font-family: 'Noto Sans KR', sans-serif;
}

.notice-card {
  @apply w-full max-w-5xl bg-white/25 backdrop-blur-lg border border-white/20
  rounded-[30px] shadow-[0_8px_48px_rgba(255,255,255,0.1)] p-10 md:p-14 relative overflow-hidden;
  background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(240, 240, 255, 0.05));
  backdrop-filter: blur(24px);
}

.notice-card::before {
  content: '';
  @apply absolute inset-0 rounded-[30px] pointer-events-none;
  background: linear-gradient(120deg, rgba(255,255,255,0.15), transparent 60%);
}

.notice-content {
  @apply bg-white/50 backdrop-blur-xl border border-white/30 text-idolDark text-base md:text-lg leading-relaxed p-10 rounded-xl shadow-inner whitespace-pre-wrap min-h-[300px];
  background-image: linear-gradient(to top left, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
}

.badge-idol {
  @apply inline-block bg-idolPink text-white text-xs font-semibold px-3 py-1 rounded-full shadow;
}

.btn-soft {
  @apply bg-white border border-idolPurple text-idolPurple text-xs font-semibold
  px-4 py-1.5 rounded-full shadow hover:bg-idolPurple hover:text-white transition duration-200;
}

.btn-idol {
  @apply bg-idolPink text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow
  hover:bg-pink-500 transition duration-200;
}

.btn-danger {
  @apply bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow transition;
}

.attachments-box {
  @apply bg-white/40 backdrop-blur-md border border-white/30 p-6 rounded-xl shadow-inner;
}

</style>
