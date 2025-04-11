<template>
  <div>
    <div class="tab-buttons">
      <button :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">승인 대기</button>
      <button :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">등록된 유저</button>
    </div>

    <div v-if="currentTab === 'pending'">
      <AdminUserApprovalTable
          :users="pendingUsers"
          @updateStatus="updateStatus"
          @updateRole="updateRole"
      />
    </div>

    <div v-else>
      <AdminUserListTable
          :users="approvedUsers"
          @updateUser="updateUser"
          @updateStatus="updateStatus"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AdminUserApprovalTable from './AdminUserApprovalTable.vue';
import AdminUserListTable from './AdminUserListTable.vue';

const props = defineProps({ users: Array });
const emit = defineEmits(['updateStatus', 'updateRole', 'updateUser']);

const currentTab = ref('pending');

const pendingUsers = computed(() => props.users.filter(user => user.status === 0));
const approvedUsers = computed(() => props.users.filter(user => user.status === 1 || user.status === 2));

const updateStatus = (id, status) => emit('updateStatus', id, status);
const updateRole = (id, role) => emit('updateRole', id, role);
const updateUser = (user) => emit('updateUser', user);
</script>

<style scoped>
.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.tab-buttons button {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  background: #ddd;
  font-weight: bold;
}
.tab-buttons button.active {
  background: #4caf50;
  color: white;
}
</style>
