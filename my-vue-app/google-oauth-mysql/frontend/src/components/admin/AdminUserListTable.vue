<template>
  <div>
    <h2>👥 기존 유저 관리</h2>
    <table>
      <thead>
      <tr>
        <th>이메일</th>
        <td>학번</td>
        <th>이름</th>
        <th>전화번호</th>
        <th>학년</th>
        <th>대상</th>
        <th>레벨</th>
        <th>권한</th>
        <th>분반</th>
        <th>상태</th>
        <th>저장</th>
        <th>상태 전환</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.email }}</td>
        <td>{{ user.student_id }}</td>
        <td><input v-model="user.name" /></td>
        <td><input v-model="user.phone" /></td>
        <td>
          <select v-model="user.grade">
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </td>
        <td>
          <select v-model="user.is_foreigner" @change="onTargetChange(user)">
            <option :value="0">한국인</option>
            <option :value="1">외국인</option>
          </select>
        </td>
        <td>
          <select v-model="user.level">
            <option
                v-for="level in getAvailableLevels(user.is_foreigner)"
                :key="level"
                :value="level"
            >
              {{ level }}
            </option>
          </select>
        </td>
        <td>
          <select v-model="user.role">
            <option value="1">관리자</option>
            <option value="2">교수</option>
            <option value="3">학생</option>
          </select>
        </td>
        <td>
          <select v-model="user.group_level">
            <option value="A">A반</option>
            <option value="B">B반</option>
          </select>
        </td>
        <td>
            <span :class="['tag', user.status === 1 ? 'approved' : 'rejected']">
              {{ user.status === 1 ? '승인됨' : '거부됨' }}
            </span>
        </td>
        <td><button @click="emit('updateUser', user)">💾 저장</button></td>
        <td><button @click="toggleStatus(user)">🔁 상태</button></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({ users: Array });
const emit = defineEmits(['updateUser', 'updateStatus']);

// ✅ 상태 전환 버튼
const toggleStatus = (user) => {
  const newStatus = user.status === 1 ? 2 : 1;
  emit('updateStatus', user.id, newStatus);
};

// ✅ 레벨 조건 분기
const getAvailableLevels = (isForeigner) =>
    isForeigner === 1 ? ['TOPIK4', 'TOPIK6'] : ['N1', 'N2', 'N3'];

const onTargetChange = (user) => {
  const valid = getAvailableLevels(user.is_foreigner);
  if (!valid.includes(user.level)) user.level = '';
};
</script>

<style scoped>
.tag.approved {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}
.tag.rejected {
  background-color: #f44336;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
