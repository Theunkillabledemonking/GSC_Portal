<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/userStore'; // ✅ 스토어 import

import AdminUserApprovalTable from '@/components/admin/AdminUserApprovalTable.vue';
import AdminUserListTable from '@/components/admin/AdminUserListTable.vue';
import SubjectList from '@/components/admin/SubjectList.vue';

const currentTab = ref('approval'); // 탭 선택 상태

const userStore = useUserStore();

// ✅ 유저 리스트 가져오기 (onMounted에 최초 호출)
onMounted(() => {
  userStore.fetchUsers(); // 서버에서 유저 전체 불러오기
});

// ✅ 승인 대기 유저
const pendingUsers = computed(() =>
    userStore.users.filter((u) => u.status === 0)
);

// ✅ 기존 유저 (승인됨 or 거부됨)
const managedUsers = computed(() =>
    userStore.users.filter((u) => u.status === 1 || u.status === 2)
);

// ✅ 이벤트 처리 함수들
const updateStatus = async (id, status) => {
  await userStore.updateStatus(id, status);
  await userStore.fetchUsers();
};

const updateRole = async (id, role) => {
  await userStore.updateRole(id, role);
  await userStore.fetchUsers();
};

const updateUser = async (user) => {
  await userStore.updateUser(user);
  await userStore.fetchUsers();
};
</script>

<template>
  <div class="admin-view">
    <h1>📋 관리자 페이지</h1>

    <!-- 탭 버튼 -->
    <div class="tab-controls">
      <button :class="{ active: currentTab === 'approval' }" @click="currentTab = 'approval'">승인 대기</button>
      <button :class="{ active: currentTab === 'users' }" @click="currentTab = 'users'">유저 관리</button>
      <button :class="{ active: currentTab === 'subjects' }" @click="currentTab = 'subjects'">과목 관리</button>
    </div>

    <!-- 탭 내용 -->
    <div class="tab-content">
      <AdminUserApprovalTable
          v-if="currentTab === 'approval'"
          :users="pendingUsers"
          @updateStatus="updateStatus"
          @updateRole="updateRole"
      />

      <AdminUserListTable
          v-else-if="currentTab === 'users'"
          :users="managedUsers"
          @updateUser="updateUser"
          @updateStatus="updateStatus"
      />

      <SubjectList v-else />
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  padding: 40px;
}
.tab-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
.tab-controls button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  font-weight: bold;
}
.tab-controls button.active {
  background-color: #1E3A8A;
  color: white;
  border-color: #1E3A8A;
}
</style>
