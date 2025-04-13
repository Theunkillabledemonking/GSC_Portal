// store/userStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    getAllUsers,
    getPendingUsers,
    updateUserStatus,
    updateUserInfo
} from '@/services/userService';

export const useUserStore = defineStore('user', () => {
    // 상태 정의
    const users = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Getters
    const approvedUsers = computed(() => users.value.filter(u => u.status === 1));
    const rejectedUsers = computed(() => users.value.filter(u => u.status === 2));
    const pendingUsers = computed(() => users.value.filter(u => u.status === 0));
    const koreanUsers = computed(() => users.value.filter(u => u.is_foreigner === 0));
    const foreignerUsers = computed(() => users.value.filter(u => u.is_foreigner === 1));

    // ✅ 전체 유저 불러오기
    async function fetchUsers() {
        isLoading.value = true;
        try {
            const res = await getAllUsers();
            users.value = res.data;
        } catch (err) {
            error.value = err;
            console.error('❌ 전체 유저 조회 실패:', err);
        } finally {
            isLoading.value = false;
        }
    }

    // ✅ 승인 대기 유저 불러오기
    async function fetchPendingUsers() {
        isLoading.value = true;
        try {
            const res = await getPendingUsers();
            users.value = res.data;
        } catch (err) {
            error.value = err;
            console.error('❌ 승인 대기 유저 조회 실패:', err);
        } finally {
            isLoading.value = false;
        }
    }

    // ✅ 유저 승인 상태 변경
    async function updateStatus(userId, status) {
        isLoading.value = true;
        try {
            await updateUserStatus(userId, status);
            // 로컬 상태 업데이트
            const userIndex = users.value.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users.value[userIndex].status = status;
            }
        } catch (err) {
            error.value = err;
            console.error('❌ 유저 상태 변경 실패:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    // ✅ 유저 정보 업데이트
    async function updateUser(userId, userData) {
        isLoading.value = true;
        try {
            await updateUserInfo(userId, userData);
            // 로컬 상태 업데이트
            const userIndex = users.value.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users.value[userIndex] = { ...users.value[userIndex], ...userData };
            }
        } catch (err) {
            error.value = err;
            console.error('❌ 유저 정보 업데이트 실패:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        // 상태
        users,
        isLoading,
        error,
        
        // Getters
        approvedUsers,
        rejectedUsers,
        pendingUsers,
        koreanUsers,
        foreignerUsers,
        
        // 액션
        fetchUsers,
        fetchPendingUsers,
        updateStatus,
        updateUser
    };
});
