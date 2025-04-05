<template>
  <div class="cell" @click="handleClick">
    <!-- 🔹 수업 없음 -->
    <div v-if="items.length === 0" class="empty-cell"></div>

    <!-- 🔸 단일 수업 -->
    <div
        v-else-if="items.length === 1 && items[0]"
        :class="['item-box', getClass(items[0])]"
        :title="getTooltip(items[0])"
    >
      <p class="subject">{{ getSubjectTitle(items[0]) }}</p>
      <p v-if="items[0].professor_name" class="professor">{{ items[0].professor_name }}</p>
      <p v-if="items[0].room" class="room">{{ items[0].room }}</p>
      <span v-if="getEventLabel(items[0])" class="tag">
        {{ getEventLabel(items[0]) }}
      </span>
    </div>

    <!-- 🔸 다중 수업 -->
    <div
        v-else
        class="summary-box"
        @mouseenter="e => emit('open-detail', { items: props.items, el: e.currentTarget })"
        @mouseleave="emit('close-detail')"
        :title="summaryTooltip"
    >
      <strong>📚 {{ items.length }}개 수업</strong>
      <p class="summary-text">{{ summaryLabel }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

// 📌 다중 수업 요약 텍스트
const summaryLabel = computed(() => {
  const counts = { regular: 0, special: 0, cancel: 0, event: 0, makeup: 0, holiday: 0 }
  for (const item of props.items) {
    const type = item?.event_type || 'regular'
    counts[type]++
  }

  const labelMap = {
    regular: '정규',
    special: '특강',
    cancel: '휴강',
    event: '행사',
    makeup: '보강',
    holiday: '공휴일'
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
  font-weight: bold;
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
</style>
