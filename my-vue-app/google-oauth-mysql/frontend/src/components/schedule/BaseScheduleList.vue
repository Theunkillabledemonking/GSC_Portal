<template>
  <div class="base-schedule-list">
    <table v-if="items.length > 0">
      <thead>
      <tr>
        <th v-for="col in columns" :key="col.field">{{ col.label }}</th>
        <th v-if="canEdit">관리</th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="item in items"
          :key="item.id"
          :class="getRowClass(item)"
      >
        <td v-for="col in columns" :key="col.field">
          <!-- 커스텀 셀 렌더링 (필요 시 확장 가능) -->
          <slot :name="`cell-${col.field}`" :item="item" :value="item[col.field]">
            {{ formatCell(col, item) }}
          </slot>
        </td>
        <td v-if="canEdit">
          <slot name="actions" :item="item">
            <button @click="$emit('edit', item)">수정</button>
            <button @click="$emit('delete', item)">삭제</button>
          </slot>
        </td>
      </tr>
      </tbody>
    </table>

    <p v-else class="no-data">등록된 항목이 없습니다.</p>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  columns: {
    type: Array, // [{ label, field, format? }]
    required: true
  },
  canEdit: {
    type: Boolean,
    default: true
  }
})

// 셀 포맷 처리
function formatCell(col, row) {
  const val = row[col.field]
  return col.format ? col.format(val, row) : (val ?? '-')
}

// 행 스타일 구분: event_type > makeup > special_lecture > regular
function getRowClass(item) {
  const type = item.event_type || (item.isMakeup && 'makeup') || (item.is_special_lecture && 'special') || 'regular'
  return {
    'row-regular': type === 'regular',
    'row-makeup': type === 'makeup',
    'row-cancel': type === 'cancel',
    'row-special': type === 'special',
    'row-event': type === 'event',
    'row-holiday': type === 'holiday'
  }
}
</script>

<style scoped>
.base-schedule-list {
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
  background-color: #f9f9f9;
}

/* 🎨 타입별 스타일 (event_type 기반 or fallback) */
.row-regular { background-color: #e3f2fd; }   /* 정규 수업 - 연블루 */
.row-makeup  { background-color: #e8f5e9; }   /* 보강 - 연그린 */
.row-cancel  { background-color: #fbe9e7; }   /* 휴강 - 연코랄 */
.row-special { background-color: #fff3e0; }   /* 특강 - 연오렌지 */
.row-event   { background-color: #fce4ec; }   /* 행사 - 연핑크 */
.row-holiday { background-color: #ede7f6; }   /* 공휴일 - 연보라 */

button {
  margin: 0 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.no-data {
  margin-top: 10px;
  color: #999;
  text-align: center;
}
</style>
