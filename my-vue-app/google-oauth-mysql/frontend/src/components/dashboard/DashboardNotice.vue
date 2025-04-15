// components/dashboard/DashboardNotices.vue
<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden">
    <!-- 헤더 -->
    <div class="border-b border-gray-100 p-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <span class="mr-2">📋</span> 공지사항
      </h3>
    </div>
    
    <!-- 공지사항 목록 -->
    <div class="p-4">
      <div v-if="notices.length > 0">
        <div 
          v-for="notice in notices" 
          :key="notice.id" 
          @click="goToNotice(notice)"
          class="py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
        >
          <div class="flex justify-between items-start">
            <div class="pr-4">
              <h4 class="text-sm font-medium text-gray-900 line-clamp-1">{{ notice.title }}</h4>
              <div class="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                <span>{{ formatDate(notice.date || notice.created_at) }}</span>
                <span v-if="notice.author" class="px-1.5 py-0.5 bg-gray-100 rounded-full">{{ notice.author }}</span>
              </div>
            </div>
            <div v-if="!notice.read" class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
              새 글
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center">
        <div class="text-4xl mb-3">📭</div>
        <p class="text-gray-500 text-sm">최근 공지사항이 없습니다.</p>
      </div>
    </div>
    
    <!-- 푸터 -->
    <div class="border-t border-gray-100 p-3 bg-gray-50">
      <button 
        @click="viewAllNotices" 
        class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors duration-150 ease-in-out flex items-center justify-center"
      >
        모든 공지 보기
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNoticeStore } from '@/store/modules/notice.js';
import dayjs from 'dayjs';

const noticeStore = useNoticeStore();
const router = useRouter();

// 최근 공지 가져오기 (최대 5개)
const notices = computed(() => {
  return noticeStore.notices?.slice(0, 10) || [];
});

// 공지 클릭 핸들러
function goToNotice(notice) {
  router.push({ name: 'NoticeDetail', params: { id: notice.id } });
}

// 모든 공지 보기
function viewAllNotices() {
  router.push({ name: 'Notices' });
}

// 날짜 포맷
function formatDate(date) {
  if (!date) return '';
  return dayjs(date).format('YYYY.MM.DD');
}

// 컴포넌트 마운트 시 공지사항 로드
onMounted(async () => {
  try {
    await noticeStore.loadNotices();
  } catch (error) {
    console.error('공지사항 로드 실패:', error);
  }
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>