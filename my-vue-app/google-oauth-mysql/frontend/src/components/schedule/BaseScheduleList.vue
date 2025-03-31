<!-- components/BaseScheduleList.vue -->
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
          {{ formatCell(col, item) }}
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

// 정규 vs 특강 구분
function getRowClass(item) {
  return item.is_special_lecture ? 'row-special' : 'row-regular'
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

.row-regular {
  background-color: #e3f2fd; /* 연한 블루 */
}

.row-special {
  background-color: #fff3e0; /* 연한 오렌지 */
}

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
