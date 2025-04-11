// store/userStore.js
import { defineStore } from 'pinia';
import {
    getAllUsers,
    getPendingUsers,
    updateUserStatus,
    updateUserInfo
} from '@/services/userService';

export const useUserStore = defineStore('user', {
    state: () => ({
        users: [],
        isLoading: false,
        error: null,
    }),

    getters: {
        approvedUsers: (state) => state.users.filter(u => u.status === 1),
        rejectedUsers: (state) => state.users.filter(u => u.status === 2),
        pendingUsers: (state) => state.users.filter(u => u.status === 0),
        koreanUsers: (state) => state.users.filter(u => u.is_foreigner === 0),
        foreignerUsers: (state) => state.users.filter(u => u.is_foreigner === 1),
    },

    actions: {
        // ✅ 전체 유저 불러오기
        async fetchUsers() {
            this.isLoading = true;
            try {
                const res = await getAllUsers();
                this.users = res.data;
            } catch (err) {
                this.error = err;
                console.error('❌ 전체 유저 조회 실패:', err);
            } finally {
                this.isLoading = false;
            }
        },

        // ✅ 대기 유저만 불러오기 (사용하지 않아도 됨, fetchUsers만으로 필터링 가능)
        async fetchPendingUsers() {
            this.isLoading = true;
            try {
                const res = await getPendingUsers();
                this.users = res.data;
            } catch (err) {
                this.error = err;
                console.error('❌ 승인 대기 유저 조회 실패:', err);
            } finally {
                this.isLoading = false;
            }
        },

        // ✅ 승인 상태 변경
        async updateUserStatus(id, status) {
            try {
                await updateUserStatus(id, status);
                await this.fetchUsers(); // 최신 상태 반영
            } catch (err) {
                console.error('❌ 상태 변경 실패:', err);
            }
        },

        // ✅ 개별 유저 정보 업데이트
        async updateUser(user) {
            try {
                await updateUserInfo(user.id, user);
                await this.fetchUsers();
            } catch (err) {
                console.error('❌ 유저 정보 수정 실패:', err);
            }
        },

        // ✅ id + data로 수정 (선택적 사용)
        async updateUserInfo(id, data) {
            try {
                await updateUserInfo(id, data);
                await this.fetchUsers();
            } catch (err) {
                console.error('❌ 유저 정보 수정 실패:', err);
            }
        },
    }
});
