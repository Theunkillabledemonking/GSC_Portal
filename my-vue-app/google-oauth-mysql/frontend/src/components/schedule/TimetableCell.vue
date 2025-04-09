<template>
  <div class="cell" @click="handleClick">
    <!-- 🔹 수업 없음 -->
    <div v-if="items.length === 0" class="empty-cell"></div>

    <!-- 🔸 휴강 -->
    <div
        v-else-if="hasCancelled"
        class="item-box tt-cancel"
        @mouseenter="showTooltip($event, cancelledItem)"
        @mouseleave="hideTooltip"
    >
      <p class="subject">
        <span class="cancel-icon">⛔️</span>
        휴강: {{ cancelledItem.subject_name }}
      </p>
      <p v-if="cancelledItem.description" class="description">{{ cancelledItem.description }}</p>
    </div>

    <!-- 🔸 공휴일 (첫 교시에만 크게 표시) -->
    <div
        v-else-if="hasHoliday && isFirstPeriod"
        class="item-box tt-holiday holiday-cell"
        @mouseenter="showTooltip($event, holidayItem)"
        @mouseleave="hideTooltip"
    >
      <div class="holiday-content">
        <p class="holiday-title">
          <span class="holiday-icon">📅</span>
          {{ holidayItem?.subject_name || '공휴일' }}
        </p>
        <p v-if="holidayItem?.description" class="description">{{ holidayItem.description }}</p>
      </div>
    </div>

    <!-- 🔸 공휴일 (다른 교시는 간단히 표시) -->
    <div
        v-else-if="hasHoliday"
        class="item-box tt-holiday compact-holiday"
        @mouseenter="showTooltip($event, holidayItem)"
        @mouseleave="hideTooltip"
    >
      <div class="holiday-dot"></div>
    </div>

    <!-- 🔸 단일 수업 -->
    <div
        v-else-if="filteredItems.length === 1 && filteredItems[0]"
        :class="['item-box', getClass(filteredItems[0])]"
        @mouseenter="showTooltip($event, filteredItems[0])"
        @mouseleave="hideTooltip"
    >
      <p class="subject">{{ getSubjectTitle(filteredItems[0]) }}</p>
      <p v-if="filteredItems[0].professor_name" class="professor">{{ filteredItems[0].professor_name }}</p>
      <p v-if="filteredItems[0].room" class="room">{{ filteredItems[0].room }}</p>
      <span v-if="getEventLabel(filteredItems[0])" class="tag">
        {{ getEventLabel(filteredItems[0]) }}
      </span>
    </div>

    <!-- 🔸 다중 수업 -->
    <div
        v-else-if="filteredItems.length > 1"
        class="summary-box"
        @mouseenter="showTooltip($event, filteredItems)"
        @mouseleave="hideTooltip"
    >
      <strong>📚 {{ filteredItems.length }}개 수업</strong>
      <p class="summary-text">{{ summaryLabel }}</p>
    </div>

    <!-- 툴팁 -->
    <div v-if="showingTooltip" class="tooltip" :style="tooltipStyle" @mouseenter="keepTooltip" @mouseleave="hideTooltip">
      <template v-if="Array.isArray(tooltipContent)">
        <div v-for="(item, index) in tooltipContent" :key="index" class="tooltip-item">
          <div class="tooltip-header">
            <span :class="['type-badge', getClass(item)]">{{ getEventLabel(item) || '정규' }}</span>
            <strong>{{ item.subject_name }}</strong>
          </div>
          <div class="tooltip-details">
            <p v-if="item.professor_name">👨‍🏫 {{ item.professor_name }}</p>
            <p v-if="item.room">🏫 {{ item.room }}</p>
            <p v-if="item.level">📚 {{ item.level }} {{ item.group_levels?.length ? `(${item.group_levels.join('/')})` : '' }}</p>
            <p>⏰ {{ formatTime(item) }}</p>
          </div>
          <div v-if="index < tooltipContent.length - 1" class="tooltip-divider"></div>
        </div>
      </template>
      <template v-else>
        <div class="tooltip-item">
          <div class="tooltip-header">
            <span :class="['type-badge', getClass(tooltipContent)]">{{ getEventLabel(tooltipContent) || '정규' }}</span>
            <strong>{{ tooltipContent.subject_name }}</strong>
          </div>
          <div class="tooltip-details">
            <p v-if="tooltipContent.professor_name">👨‍🏫 {{ tooltipContent.professor_name }}</p>
            <p v-if="tooltipContent.room">🏫 {{ tooltipContent.room }}</p>
            <p v-if="tooltipContent.level">📚 {{ tooltipContent.level }} {{ tooltipContent.group_levels?.length ? `(${tooltipContent.group_levels.join('/')})` : '' }}</p>
            <p>⏰ {{ formatTime(tooltipContent) }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  day: String,       // ex: '2025-04-03'
  period: Number,    // 교시
  items: Array       // 이 칸의 수업 목록
})

const emit = defineEmits(['open-detail', 'close-detail']) // 상세 팝업 제어

// 🎓 수업 제목 가공
const getSubjectTitle = (item) => {
  if (!item) return ''
  if (item.event_type === 'holiday') return '📅 공휴일'
  if (item.event_type === 'cancel') return `❌ ${item.subject_name || '휴강'}`
  if (item.event_type === 'makeup') return `🔁 보강 - ${item.subject_name}`
  if (item.event_type === 'special') return `⭐ 특강 - ${item.subject_name}`
  if (item.event_type === 'event') return `🎈 ${item.subject_name || '행사'}`
  return item.subject_name || '수업'
}

// 🔖 오른쪽 라벨 텍스트
const getEventLabel = (item) => {
  const map = {
    holiday: '공휴일',
    cancel: '휴강',
    makeup: '보강',
    special: '특강',
    event: '행사'
  }
  return map[item.event_type] || ''
}

// 🎨 타입별 색상 클래스
const getClass = (item) => `tt-${item.event_type || 'regular'}`

// 📝 Tooltip 내용
const getTooltip = (item) => {
  if (!item) return ''
  const lines = []
  if (item.subject_name) lines.push(`과목: ${item.subject_name}`)
  if (item.professor_name) lines.push(`교수: ${item.professor_name}`)
  if (item.room) lines.push(`강의실: ${item.room}`)
  if (item.description) lines.push(`비고: ${item.description}`)
  if (item.start_time && item.end_time) {
    lines.push(`시간: ${item.start_time} ~ ${item.end_time}`)
  }
  return lines.join('\n')
}

// 🏢 공휴일 여부 확인
const hasHoliday = computed(() => props.items.some(item => item?.event_type === 'holiday'))

// 🏢 공휴일 아이템 가져오기
const holidayItem = computed(() => props.items.find(item => item?.event_type === 'holiday'))

// 🏢 휴강 여부 확인
const hasCancelled = computed(() => {
  return props.items.some(item => {
    console.log('휴강 체크:', {
      id: item.id,
      type: item.event_type,
      date: item.event_date,
      subject: item.subject_name
    })
    return item.event_type === 'cancel'
  })
})

// 🏢 휴강 아이템 가져오기
const cancelledItem = computed(() => {
  const item = props.items.find(item => item.event_type === 'cancel')
  if (item) {
    // 원본 수업 정보와 병합
    const originalClass = props.items.find(i => i.id === item.timetable_id)
    if (originalClass) {
      return {
        ...item,
        subject_name: item.subject_name || originalClass.subject_name,
        professor_name: item.professor_name || originalClass.professor_name,
        room: item.room || originalClass.room
      }
    }
  }
  return item
})

// 🏢 필터링된 아이템
const filteredItems = computed(() => {
  console.log('필터링 전 아이템:', props.items.map(item => ({
    id: item.id,
    type: item.event_type,
    name: item.subject_name,
    date: item.event_date
  })))
  
  if (hasCancelled.value) {
    console.log('휴강으로 인해 다른 수업 숨김')
    return []
  }
  if (hasHoliday.value) {
    console.log('공휴일로 인해 다른 수업 숨김')
    return []
  }
  
  const filtered = props.items.filter(item => 
    item && 
    item.event_type !== 'cancel' && 
    item.event_type !== 'holiday'
  )
  
  console.log('필터링 후 아이템:', filtered.map(item => ({
    id: item.id,
    type: item.event_type,
    name: item.subject_name
  })))
  
  return filtered
})

// 📌 다중 수업 요약 텍스트
const summaryLabel = computed(() => {
  const counts = { regular: 0, special: 0, cancel: 0, event: 0, makeup: 0 }
  for (const item of filteredItems.value) {
    const type = item?.event_type || 'regular'
    if (type !== 'holiday') counts[type]++
  }

  const labelMap = {
    regular: '정규',
    special: '특강',
    cancel: '휴강',
    event: '행사',
    makeup: '보강'
  }

  return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${labelMap[type]} ${count}개`)
      .join(' · ')
})

// 🧠 전체 Tooltip (다중용)
const summaryTooltip = computed(() =>
    props.items.map(item => getTooltip(item)).join('\n---\n')
)

// 툴팁 관련 상태
const showingTooltip = ref(false)
const tooltipContent = ref(null)
const tooltipStyle = ref({})
let tooltipTimeout = null

// 툴팁 표시
function showTooltip(event, content) {
  clearTimeout(tooltipTimeout)
  tooltipContent.value = content
  
  // 위치 계산
  const rect = event.target.getBoundingClientRect()
  const tooltipWidth = 300
  const tooltipHeight = Array.isArray(content) ? content.length * 120 : 120
  
  // 기본 위치 (오른쪽)
  let left = rect.right + 10
  let top = rect.top
  
  // 오른쪽 공간이 부족하면 왼쪽에 표시
  if (left + tooltipWidth > window.innerWidth) {
    left = rect.left - tooltipWidth - 10
  }
  
  // 아래쪽 공간이 부족하면 위로 조정
  if (top + tooltipHeight > window.innerHeight) {
    top = window.innerHeight - tooltipHeight - 10
  }
  
  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  }
  
  showingTooltip.value = true
}

// 툴팁 숨기기
function hideTooltip() {
  tooltipTimeout = setTimeout(() => {
    showingTooltip.value = false
  }, 200)
}

// 툴팁 유지
function keepTooltip() {
  clearTimeout(tooltipTimeout)
}

// 시간 포맷팅
function formatTime(item) {
  if (item.start_time && item.end_time) {
    return `${item.start_time} ~ ${item.end_time}`
  }
  return `${item.start_period}~${item.end_period}교시`
}

// 🏢 첫 교시 여부 확인
const isFirstPeriod = computed(() => props.period === 1)

// 👉 클릭 시 상세 open emit
function handleClick() {
  if (props.items.length > 1) {
    emit('open-detail', { items: props.items })
  }
}
</script>

<style scoped>
.cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}
.empty-cell {
  height: 28px;
}

/* 단일 수업 박스 */
.item-box {
  padding: 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: transform 0.1s;
}
.item-box:hover {
  transform: scale(1.02);
}

/* 다중 수업 요약 */
.summary-box {
  padding: 6px;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  border: 1px dashed #d1d5db;
  font-size: 0.75rem;
}
.summary-text {
  font-size: 0.7rem;
  color: #666;
}

/* 색상 타입별 */
.tt-cancel   { background: #fee2e2; color: #991b1b; }
.tt-makeup   { background: #d1fae5; color: #065f46; }
.tt-special  { background: #fef3c7; color: #92400e; }
.tt-event    { background: #ede9fe; color: #5b21b6; }
.tt-holiday  { background: #ffe4e6; color: #be123c; }
.tt-regular  { background: #f3f4f6; color: #111827; }

.subject {
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
.professor, .room {
  font-size: 0.7rem;
  color: #555;
}
.tag {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.65rem;
  background: white;
  border-radius: 4px;
  padding: 2px 4px;
  border: 1px solid currentColor;
}

.tooltip {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 300px;
  font-size: 0.9rem;
  border: 1px solid #e5e7eb;
}

.tooltip-item {
  padding: 8px 0;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.type-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tooltip-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
  font-size: 0.85rem;
}

.tooltip-divider {
  margin: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

/* 타입별 배지 색상 */
.tt-cancel.type-badge   { background: #fee2e2; color: #991b1b; }
.tt-makeup.type-badge   { background: #d1fae5; color: #065f46; }
.tt-special.type-badge  { background: #fef3c7; color: #92400e; }
.tt-event.type-badge    { background: #ede9fe; color: #5b21b6; }
.tt-holiday.type-badge  { background: #ffe4e6; color: #be123c; }
.tt-regular.type-badge  { background: #f3f4f6; color: #111827; }

/* 공휴일 스타일 */
.holiday-cell {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: #fff1f2;
  border: 1px dashed #fecdd3;
  padding: 8px;
}

.holiday-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.holiday-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #be123c;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  width: 100%;
  word-break: keep-all;
  line-height: 1.4;
}

.holiday-icon {
  font-size: 1rem;
}

.holiday-name {
  font-size: 0.8rem;
  color: #be123c;
}

.compact-holiday {
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff1f2;
  border: 1px dashed #fecdd3;
}

.holiday-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #be123c;
}

.description {
  font-size: 0.75rem;
  color: #9b1c1c;
  margin-top: 2px;
  max-width: 200px;
}

/* 휴강 스타일 */
.tt-cancel {
  background-color: #fff5f5;
  border: 1px dashed #ffa8a8;
  padding: 8px;
  min-height: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cancel-icon {
  font-size: 1rem;
  margin-right: 4px;
  vertical-align: middle;
}
</style>
