<template>
  <div class="event-list">
    <table v-if="events.length > 0">
      <thead>
      <tr>
        <th>날짜</th>
        <th>유형</th>
        <th>레벨</th>
        <th>과목</th>
        <th>시간</th>
        <th>설명</th>
        <th v-if="canEdit">관리</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="e in events" :key="e.id">
        <td>{{ e.event_date }}</td>
        <td>{{ eventTypeText(e.event_type) }}</td>
        <td>{{ e.level || '-' }}</td>
        <td>{{ e.subject_name || 'N/A' }}</td>
        <td>
          {{ formatPeriodOrTime(e) }}
        </td>
        <td>{{ e.description || '-' }}</td>
        <td v-if="canEdit">
          <button @click="$emit('edit', e)">수정</button>
          <button @click="$emit('delete', e)">삭제</button>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-else class="no-data">등록된 이벤트가 없습니다.</p>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { fetchEvents } from "@/services/eventService";

const props = defineProps({
  year: Number,
  level: String,
  canEdit: {
    type: Boolean,
    default: true
  }
});
const events = ref([]);

const semesterRanges = {
  spring: ['03-01', '08-31'],
  fall: ['09-01', '02-28']
};

function getDateRange() {
  const springStart = `${props.year}-03-01`;
  const springEnd = `${props.year}-08-31`;
  const fallStart = `${props.year}-09-01`;
  const fallEnd = `${props.year + 1}-02-28`;
  return { start: springStart, end: fallEnd }; // 모든 학기 범위
}

// ✅ 데이터 로딩
async function loadEvents() {
  const { start, end } = getDateRange();
  try {
    const res = await fetchEvents({ start_date: start, end_date: end, level: props.level });
    events.value = res?.events ?? [];
    console.log("📦 이벤트 응답 구조", res);
  } catch (err) {
    console.error("❌ 이벤트 로딩 실패", err);
  }
}

// 포맷터
function eventTypeText(type) {
  return {
    cancel: "휴강",
    makeup: "보강",
    special: "특강",
    event: "행사"
  }[type] || type;
}

function formatPeriodOrTime(e) {
  if (e.start_time && e.end_time) {
    return `${e.start_time} ~ ${e.end_time}`;
  } else if (e.start_period && e.end_period) {
    return `${e.start_period}교시 ~ ${e.end_period}교시`;
  }
  return "-";
}

watch(() => [props.year, props.level], loadEvents, { immediate: true });
</script>

<style scoped>
.event-list {
  margin-top: 15px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: center;
}
th {
  background: #f0f0f0;
}
button {
  margin: 0 3px;
  padding: 4px 8px;
}
.no-data {
  margin-top: 10px;
  color: #888;
  text-align: center;
}
</style>
