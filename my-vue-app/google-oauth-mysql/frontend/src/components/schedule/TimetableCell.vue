<template>
  <div class="cell">
    <div
        v-for="item in items"
        :key="item.id || item.subject_id || `${item.day}-${item.period}`"
        :class="['item-box', getClass(item)]"
    >
      <p class="subject">
        {{
          item.event_type === 'holiday'
              ? '공휴일'
              : item.event_type === 'cancel'
                  ? '휴강 - ' + item.subject_name
                  : item.subject_name || '수업'
        }}
      </p>
      <p v-if="item.professor_name" class="professor">{{ item.professor_name }}</p>
      <p v-if="item.room" class="room">{{ item.room }}</p>
      <span v-if="getEventLabel(item)" class="tag">
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
  switch (item.event_type) {
    case 'holiday': return '공휴일'
    case 'cancel': return '휴강'
    case 'makeup': return '보강'
    case 'special': return '특강'
    case 'event': return '행사'
    default: return ''
  }
}

// 클래스 반환 (배경색 스타일 지정용)
const getClass = (item) => {
  switch (item.event_type) {
    case 'holiday': return 'holiday'
    case 'cancel': return 'cancel'
    case 'makeup': return 'makeup'
    case 'special': return 'special'
    case 'event': return 'event'
    default: return ''
  }
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
