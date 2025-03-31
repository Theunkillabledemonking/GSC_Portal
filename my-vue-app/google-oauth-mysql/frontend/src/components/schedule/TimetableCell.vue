<template>
  <div class="cell">
    <div
        v-for="item in items"
        :key="item.id || item.subject_id || `${item.day}-${item.period}`"
        :class="['item-box', getClass(item)]"
    >
      <p class="subject">
        <!-- 공휴일인 경우 -->
        {{ item.event_type === 'holiday' ? '공휴일' :
          item.isCancelled ? '휴강 - ' + item.subject_name :
              item.subject_name || '수업' }}
      </p>
      <p v-if="item.professor_name" class="professor">{{ item.professor_name }}</p>
      <p v-if="item.room" class="room">{{ item.room }}</p>
      <span
          v-if="getEventLabel(item)"
          class="tag"
      >
        {{ getEventLabel(item) }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  day: String,
  period: Number,
  items: Array
})

// 라벨 표시
const getEventLabel = (item) => {
  if (item.event_type === 'holiday') return '공휴일'
  if (item.isCancelled) return '휴강'
  const labels = {
    makeup: '보강',
    special: '특강',
    event: '행사'
  }
  return labels[item.event_type] || ''
}

// 클래스 반환
const getClass = (item) => {
  if (item.isCancelled) return 'cancel'
  if (item.event_type === 'holiday') return 'holiday'
  return item.event_type && item.event_type !== 'regular' ? item.event_type : ''
}
</script>

<style scoped>
.cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-box {
  padding: 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.2;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  background: #f3f4f6;
  position: relative;
  color: #111827;
}

.item-box.cancel {
  background: #fee2e2;
  color: #991b1b;
}

.item-box.makeup {
  background: #d1fae5;
  color: #065f46;
}

.item-box.special {
  background: #fef3c7;
  color: #92400e;
}

.item-box.event {
  background: #ede9fe;
  color: #5b21b6;
}

.item-box.holiday {
  background: #ffe4e6;
  color: #be123c;
}

.subject {
  font-weight: bold;
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
