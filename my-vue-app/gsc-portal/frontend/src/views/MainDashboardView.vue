<template>
  <div class="bg-gray-50 min-h-screen py-6">
    <div class="container mx-auto px-4">
      <!-- 대시보드 헤더 -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">대시보드</h1>
        <p class="text-sm text-gray-600">{{ formatDate(new Date(), false, true) }} - {{ authStore.user?.name || '학생' }}님의 학습 현황</p>
      </div>

      <!-- 대시보드 그리드 레이아웃 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 첫 번째 컬럼: 공지사항 -->
        <div class="lg:col-span-1">
          <DashboardNotice />
        </div>

        <!-- 두 번째 컬럼: 오늘의 수업 -->
        <div class="lg:col-span-1">
          <DashboardTodayEvents />
        </div>

        <!-- 세 번째 컬럼: 캘린더 -->
        <div class="lg:col-span-1">
          <DashboardCalendar
              :initial-date="selectedDate"
              @date-selected="handleDateSelected"
          />
        </div>
      </div>

      <!-- 선택된 날짜의 수업 일정 -->
      <div class="mt-6">
        <DashBoardSchedule
            :selected-date="selectedDate"
            @date-change="handleDateSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useNoticeStore } from '@/store/modules/notice'
import { useTimetableStore } from '@/store/modules/timetable'
import dayjs from 'dayjs'

// 대시보드 컴포넌트 임포트
import DashboardNotice from '@/components/dashboard/DashboardNotice.vue'
import DashboardTodayEvents from '@/components/dashboard/DashboardTodayEvents.vue'
import DashboardCalendar from '@/components/dashboard/DashboardCalendar.vue'
import DashBoardSchedule from '@/components/dashboard/DashBoardSchedule.vue'

// 스토어 설정
const authStore = useAuthStore()
const noticeStore = useNoticeStore()
const timetableStore = useTimetableStore()

// 상태 변수
const selectedDate = ref(new Date())

// 날짜 관련 유틸리티 함수
function formatDate(date, withDayOfWeek = false, withYear = false) {
  if (!date) return ''
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d = dayjs(date)

  if (withYear) {
    return withDayOfWeek
        ? `${d.format('YYYY년 M월 D일')} (${days[d.day()]})`
        : d.format('YYYY년 M월 D일')
  }

  return withDayOfWeek
      ? `${d.format('M월 D일')} (${days[d.day()]})`
      : d.format('YYYY-MM-DD')
}

// 날짜 선택 핸들러
function handleDateSelected(date) {
  selectedDate.value = date
}

// 초기화 및 이벤트 핸들러
onMounted(async () => {
  // 로그인 확인
  if (!authStore.isLoggedIn) {
    authStore.initializeAuth()
  }
})
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
</style>