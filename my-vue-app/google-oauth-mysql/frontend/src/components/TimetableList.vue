<template>
  <div class="timetable-list">
    <!-- ✅ 테이블 -->
    <table v-if="timetables.length > 0">
      <thead>
      <tr>
        <th>요일</th>
        <th>교시</th>
        <th>과목</th>
        <th>강의실</th>
        <th>교수</th>
        <th v-if="canEdit">관리</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="t in timetables" :key="t.id">
        <td>{{ t.day }}</td>
        <td>{{ t.start_period }}교시 ~ {{ t.end_period }}교시</td>
        <td>{{ t.subject_name || '미정' }}</td>
        <td>{{ t.room || '미정' }}</td>
        <td>{{ t.professor_name || '미정' }}</td>
        <td v-if="canEdit">
          <button @click="$emit('edit', t)">수정</button>
          <button @click="$emit('delete', t)">삭제</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- ❌ 데이터 없을 때 -->
    <p v-else-if="!loading" class="no-data">등록된 정규 수업이 없습니다.</p>
    <p v-else class="loading">불러오는 중...</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { fetchTimetables } from '@/services/timetableService';

const props = defineProps({
  year: Number,
  level: String,
  canEdit: {
    type: Boolean,
    default: true
  }
});

const timetables = ref([]);
const loading = ref(false);

async function loadTimetables() {
  if (!props.year || !props.level) return;

  loading.value = true;
  try {
    const res = await fetchTimetables(props.year, props.level);
    timetables.value = res?.timetables ?? [];
  } catch (err) {
    console.error("❌ 시간표 불러오기 실패", err);
    timetables.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => [props.year, props.level], loadTimetables, { immediate: true });
</script>

<style scoped>
.timetable-list {
  margin-top: 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
th {
  background-color: #f5f5f5;
}
button {
  margin-right: 5px;
  padding: 5px 10px;
  cursor: pointer;
}
.no-data,
.loading {
  margin-top: 10px;
  color: #888;
  text-align: center;
}
</style>
