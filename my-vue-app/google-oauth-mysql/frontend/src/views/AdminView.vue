<script setup>
import { ref } from 'vue';
import AdminUserTable from '@/components/admin/AdminUserTable.vue';
import SubjectManage from '@/components/admin/SubjectManage.vue';

const currentTab = ref('users'); // default 탭
</script>

<template>
  <div class="admin-view">
    <h1>📋 관리자 페이지</h1>

    <!-- 탭 버튼 -->
    <div class="tab-controls">
      <button :class="{ active: currentTab === 'users' }" @click="currentTab = 'users'">승인 대기</button>
      <button :class="{ active: currentTab === 'subjects' }" @click="currentTab = 'subjects'">과목 관리</button>
    </div>

    <!-- 탭 내용 -->
    <div class="tab-content">
      <AdminUserTable v-if="currentTab === 'users'"
                      :users="dummyUsers"
                      @updateStatus="handleUpdateStatus"
                      @updateRole="handleUpdateRole" />

      <SubjectManage v-else />
    </div>
  </div>
</template>

<script>
// 여기선 API 연동 or store 가져오기로 교체 가능
const dummyUsers = [
  { id: 1, name: '홍길동', email: 'hong@example.com', phone: '010-0000-0000', grade: 1, level: 'N2', role: 3 },
  { id: 2, name: '김영희', email: 'kim@example.com', phone: '010-1111-1111', grade: 2, level: 'TOPIK4', role: 3 },
];

const handleUpdateStatus = (id, status) => {
  console.log('✅ 승인 상태 변경:', id, status);
};

const handleUpdateRole = (id, role) => {
  console.log('✅ 권한 변경:', id, role);
};
</script>

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