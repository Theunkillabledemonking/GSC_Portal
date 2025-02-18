<template>
  <div>
    <h2>승인 대기 중인 회원</h2>
    <ul>
      <li v-for="user in pendingUsers" :key="user.id">
        {{ user.name }} ({{ user.email }})
        <button @click="approveUser(user.id)">승인</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const pendingUsers = ref([]);

const fetchPendingUsers = async () => {
  try {
    const response = await fetch("http://localhost:5000/admin/pending-users");
    pendingUsers.value = await response.json();
  } catch (error) {
    console.error("승인 대기 회원 불러오기 실패:", error);
  }
};

const approveUser = async (userId) => {
  try {
    await fetch("http://localhost:5000/admin/approve-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    alert("회원 승인 완료");
    fetchPendingUsers(); // 리스트 새로고침
  } catch (error) {
    console.error("회원 승인 실패:", error);
  }
};

onMounted(fetchPendingUsers);
</script>
