// ✅ lineStore.js
import { defineStore } from "pinia";
import { requestLineAuthCode } from "@/services/lineService";

export const useLineStore = defineStore("line", {
    state: () => ({
        authCode: null,
        loading: false,
    }),
    actions: {
        async requestAuthCode(userId) {
            this.loading = true;
            try {
                const res = await requestLineAuthCode(userId);
                this.authCode = res.code;
            } catch (err) {
                console.error("❌ 인증번호 요청 실패:", err);
                this.authCode = null;
            } finally {
                this.loading = false;
            }
        },
        reset() {
            this.authCode = null;
        },
    },
});