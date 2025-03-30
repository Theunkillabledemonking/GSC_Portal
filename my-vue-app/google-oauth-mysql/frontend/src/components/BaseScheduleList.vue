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
      <tr v-for="item in items" :key="item.id">
        <td v-for="col in columns" :key="col.field">
          {{ formatCell(col, item) }}
        </td>
        <td v-if="canEdit">
          <button @click="$emit('edit', item)">수정</button>
          <button @click="$emit('delete', item)">삭제</button>
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

/**
 * 셀 렌더링 유틸
 */
function formatCell(col, row) {
  const val = row[col.field]
  return col.format ? col.format(val, row) : (val ?? '-')
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
