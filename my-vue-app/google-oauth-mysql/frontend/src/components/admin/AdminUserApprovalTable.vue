<template>
  <div>
    <h2>⏳ 승인 대기 유저</h2>
    <table>
      <thead>
      <tr>
        <th>이메일</th>
        <th>이름</th>
        <th>학번</th>
        <th>전화번호</th>
        <th>대상</th>
        <th>레벨</th>
        <th>학년</th>
        <th>권한</th>
        <th>승인</th>
        <th>거부</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.email }}</td>
        <td><input v-model="user.name" /></td>
        <td><input v-model="user.student_id" /></td>
        <td><input v-model="user.phone" /></td>
        <td>
          <select v-model="user.is_foreigner" @change="handleTargetChange(user)">
            <option :value="0">한국인</option>
            <option :value="1">외국인</option>
          </select>
        </td>
        <td>
          <select v-model="user.level">
            <option
                v-for="level in getLevelOptions(user.is_foreigner)"
                :key="level"
                :value="level"
            >
              {{ level }}
            </option>
          </select>
        </td>
        <td>
          <select v-model="user.grade">
            <option :value="1">1학년</option>
            <option :value="2">2학년</option>
            <option :value="3">3학년</option>
          </select>
        </td>
        <td>
          <select v-model="user.role" @change="emit('updateRole', user.id, Number(user.role))">
            <option value="1">관리자</option>
            <option value="2">교수</option>
            <option value="3">학생</option>
          </select>
        </td>
        <td><button @click="emit('updateStatus', user.id, 1)">✅ 승인</button></td>
        <td><button @click="emit('updateStatus', user.id, 2)">❌ 거부</button></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({ users: Array });
const emit = defineEmits(["updateStatus", "updateRole"]);

// 대상에 따라 레벨 옵션 제한
const getLevelOptions = (is_foreigner) =>
    is_foreigner === 0 ? ["N3", "N2", "N1"] : ["TOPIK4", "TOPIK6"];

// 대상 바뀌면 유효하지 않은 레벨 초기화
const handleTargetChange = (user) => {
  const validLevels = getLevelOptions(user.is_foreigner);
  if (!validLevels.includes(user.level)) {
    user.level = "";
  }
};
</script>
