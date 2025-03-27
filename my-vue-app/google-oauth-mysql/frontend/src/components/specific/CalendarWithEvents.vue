<template>
  <div class="calendar-with-events">

    <!-- 왼쪽 패널 -->
    <div class="left-panel glass-soft shadow-md">
      <!-- 왼쪽 일정 목록 -->
      <h3 class="text-idolPurple text-xl font-bold mb-6 flex items-center gap-2">
        📅 <span>월 전체 일정 목록</span>
      </h3>

      <transition name="fade">
        <div v-if="isLoading" class="text-center text-idolPurple font-semibold py-8 flex flex-col items-center gap-2">
          <span class="animate-spin text-2xl">🔄</span>
          <span>일정 데이터를 불러오는 중이에요...</span>
        </div>
      </transition>

      <transition-group name="event-fade" tag="div">
        <div
            v-for="(events, date) in monthlyEvents"
            :key="date"
            :ref="el => setLeftRef(date, el)"
            :class="['date-section', { selected: date === selectedDate }]"
            @click="scrollToDate(date)"
        >
          <strong class="block font-semibold text-sm text-gray-600 mb-2">{{ date }}</strong>

          <transition-group name="event-fade-inner" tag="div">
            <div
                v-for="event in events"
                :key="event.id"
                class="event-item"
                @click.stop="handleEventClick(date, event)"
            >
              <p class="truncate font-medium text-idolPurple">{{ event.summary || '제목 없음' }}</p>
              <small class="block text-xs text-gray-500">{{ event.description || '설명 없음' }}</small>
            </div>
          </transition-group>
        </div>
      </transition-group>
      </div>


    <!-- 오른쪽 패널 -->
    <div class="right-panel">

      <!-- 달 전환 애니메이션 -->
      <transition name="month-slide" mode="out-in">
        <div :key="yearMonthKey">
          <CalendarView
              ref="calendarRef"
              :monthlyEvents="monthlyEvents"
              @dateSelected="handleDateSelected"
              @monthChanged="handleMonthChanged"
          />
        </div>
      </transition>

      <!-- 신규 일정 추가 버튼 -->
      <div class="flex justify-end mt-6">
        <button class="btn-idol" @click="openModalForNew">
          신규 일정 추가
        </button>
      </div>

      <!-- EventModal 표시 -->
      <EventModal
          v-if="modalVisible"
          :isEdit="isEditMode"
          :selectedDay="selectedDay"
          :selectedEvent="selectedEvent"
          @close="modalVisible = false"
      />
    </div><!-- /.right-panel -->

  </div><!-- /.calendar-with-events -->
</template>


<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import CalendarView from './CalendarView.vue';
import EventModal from './EventModal.vue';
import { listEvents } from '@/services/calendarApi.js';

const userRole = ref(2);
const monthlyEvents = ref({});
const selectedDate = ref(null);
const modalVisible = ref(false);
const isEditMode = ref(false);
const selectedDay = ref(null);
const selectedEvent = ref(null);
const calendarRef = ref(null);
const dayRefsLeft = ref({});
const isLoading = ref(false);

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());

// 예: "2025-03" 이런 식으로 key 생성
const yearMonthKey = computed(() => {
  return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`;
});

function setLeftRef(date, el) {
  if (date && el) {
    dayRefsLeft.value[date] = el;
  }
}

const eventCache = ref({});

async function loadMonthlyEvents(year, month) {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  isLoading.value = true;

  if (eventCache.value[key]) {
    console.log('[캐시 HIT]', key);
    monthlyEvents.value = {...eventCache.value[key]};
    isLoading.value = false;
    return;
  }

  try {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();
    const events = await listEvents(start, end);

    const grouped = {};
    for (const e of events) {
      const dateKey = e.start.dateTime?.split('T')[0] || e.start.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(e);
    }

    eventCache.value[key] = grouped;
    monthlyEvents.value = grouped;
  } catch (err) {
    console.error('❌ 일정 로딩 실패', err);
    monthlyEvents.value = {}; // 💡 항상 빈 객체라도 넣어야 달력이 깨지지 않음
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  const now = new Date();
  await loadMonthlyEvents(now.getFullYear(), now.getMonth());
});

function scrollToDate(date) {
  selectedDate.value = date;
  calendarRef.value?.scrollToDate(date);
  nextTick(() => {
    const targetEl = dayRefsLeft.value[date];
    if (targetEl) {
      targetEl.classList.add('flash-highlight');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => targetEl.classList.remove('flash-highlight'), 1000);
    }
  });
}

function handleEventClick(date, event) {
  if (userRole.value === 1 || userRole.value === 2) {
    isEditMode.value = true;
    selectedDay.value = { date };
    selectedEvent.value = event;
    modalVisible.value = true;
  } else {
    scrollToDate(date);
  }
}

function handleDateSelected(date) {
  scrollToDate(date);
}

function handleMonthChanged({ year, month }) {
    selectedDate.value = null; // 이전 날짜 제거
    loadMonthlyEvents(year, month);
}

function openModalForNew() {
  isEditMode.value = false;
  selectedDay.value = { date: '' };
  selectedEvent.value = null;
  modalVisible.value = true;
}

</script>

<style scoped>
.calendar-with-events {
  @apply flex gap-6 px-8 py-10 bg-idolGray rounded-xl;
}

.left-panel {
  @apply w-5/12 max-h-[80vh] overflow-y-auto p-5 rounded-2xl border-l-[6px] border-idolPink bg-white/60 backdrop-blur-md;
}

.right-panel {
  @apply w-7/12 bg-white rounded-2xl p-6 border border-gray-200 shadow-lg;
}

.date-section {
  @apply mb-6 px-4 py-3 rounded-xl bg-white hover:bg-pink-50 transition cursor-pointer border border-transparent;
}
.date-section.selected {
  @apply border-pink-300 bg-pink-100/40 shadow-inner;
}

.event-item {
  @apply bg-white/50 border border-white/30 text-sm text-gray-800 px-3 py-2 my-2 rounded-xl shadow-sm hover:bg-white/70 transition;
}

.flash-highlight {
  animation: flashBg 1s ease-in-out;
}

@keyframes flashBg {
  0% { background-color: rgba(255, 226, 243, 0.8); }
  100% { background-color: transparent; }
}

/* 이벤트 항목 리스트 애니메이션 */
.event-fade-enter-active,
.event-fade-leave-active,
.event-fade-inner-enter-active,
.event-fade-inner-leave-active {
  transition: all 0.3s ease;
}
.event-fade-enter-from,
.event-fade-inner-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.event-fade-leave-to,
.event-fade-inner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 로딩용 fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>


