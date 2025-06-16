<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import AdminUserList from "@/components/admin/AdminUserTable.vue";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const pendingUsers = ref([]);

// 승인 대기 중인 사용자 불러오기
const fetchPendingUsers = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("관리자 토큰이 없습니다.");
      return;
    }

    console.log("fetchPendingUsers 실행됨"); // ✅ 실행 횟수 확인

    const response = await axios.get(`${API_BASE_URL}/admin/user/pending`, {
      headers: { Authorization: `Bearer ${token}`},
    });

    pendingUsers.value = response.data;
  } catch (error) {
    console.log('승인 대기 사용자 조회 오류:', error);
  }
};

// 사용자 승인/거부 처리
const updateUserStatus = async (userId, newStatus) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("관리자 토큰이 없습니다.");
      return;
    }

    await axios.put(`${API_BASE_URL}/admin/user/status`,
        { id: userId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    alert(`사용자가 ${newStatus === 1 ? "승인" : "거부"}되었습니다.`);
    fetchPendingUsers();
  } catch (error) {
    console.error('사용자 상태 업데이트 오류', error);
    alert('사용자 상태 업데이트 중 오류가 발생했습니다.');
  }
};

// 사용자 권한 변경 ㅊ ㅓ리
const updateUserRole = async (userId, newRole) => {
  try {
    const token = localStorage.getItem("accessToken");

    await axios.put(`${API_BASE_URL}/admin/user/role`,
    { id: userId, role: newRole },
    { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("사용자 권한이 변경되었습니다.");
    fetchPendingUsers();
  } catch (error) {
    console.error('사용자 권한 업데이트 오류', error);
    alert('사용자 권한 업데이트 중 오류가 발생했습니다.');
  }
};

onMounted(() => {
  if (pendingUsers.value.length === 0) {
    fetchPendingUsers();
  }
});

</script>

<template>
  <div class="admin-user-list">
    <h2>회원 승인 관리</h2>
    <!-- ✅ 대기 중인 사용자가 있을 때만 리스트 표시 -->
    <AdminUserList v-if="pendingUsers.length > 0" :users="pendingUsers" @updateStatus="updateUserStatus"/>

    <!-- ✅ 승인 대기 사용자가 없을 때 메시지 표시 -->
    <p v-else>승인 대기 중인 사용자가 없습니다.</p>
  </div>
</template>

<style scoped>
.admin-user-list {
  max-width: 800px;
  margin: auto;
}
</style>