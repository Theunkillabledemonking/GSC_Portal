<script setup>
import { defineProps, defineEmits, ref } from "vue";

const props = defineProps(["users"]);
const emit = defineEmits(["updateStatus", "updateRole"]);

// 승인 버튼 클릭 시 부모에게 이벤트 전달
const isProcessing = ref(false);

// 승인 버튼 클릭 시 부모에게 이벤트 전달 (중복 요청 방지 추가)
const approveUser = (id) => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  emit("updateStatus", id, 1);
  setTimeout(() => (isProcessing.value = false), 500);
};

// 거부 버튼 클릭 시 부모에게 이벤트 전달
const rejectUser = (id) => {
  if (isProcessing.value) return;
  isProcessing.value = true;
  emit("updateStatus", id, 2);
  setTimeout(() => (isProcessing.value = false), 500);
};

// 권한 변경 시 부모에게 이벤트 전달
const changeUserRole = (id, newRole) => {
  emit("updateRole", id, newRole);
};
</script>

<template>
  <div class="admin-user-list">
  <table>
    <thead>
    <tr>
      <th>ID</th>
      <th>email</th>
      <th>이름</th>
      <th>전화번호</th>
      <th>학년</th>
      <th>레벨</th>
      <th>권한</th>
      <th>승인</th>
      <th>거부</th>
    </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.id }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.name }}</td>
        <td>{{ user.phone }}</td>
        <td>{{ user.grade }}</td>
        <td>{{ user.level }}</td>

        <!-- 권한 변경 드롭 다운 -->
        <td>
          <select v-model="user.role" @change="changeUserRole(user.id, Number(user.role))">
            <option value="1">관리자</option>
            <option value="2">교수</option>
            <option value="3">학생</option>
          </select>
        </td>

        <td>
          <button @click="approveUser(user.id)">승인</button>
        </td>
        <td>
          <button @click="rejectUser(user.id)">거부</button>
        </td>
      </tr>

      <!-- ✅ 승인 대기 사용자가 없을 경우 안내 문구 추가 -->
      <tr v-if="users.length === 0">
        <td colspan="8" style="text-align: center; color: gray;">승인 대기 중인 사용자가 없습니다.</td>
      </tr>
    </tbody>
  </table>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

th {
  background-color: #f4f4f4;
}

button {
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

button:first-of-type {
  background-color: #4caf50;
  color: white;
}

button:last-of-type {
  background-color: #ff4d4d;
  color: white;
}
</style>