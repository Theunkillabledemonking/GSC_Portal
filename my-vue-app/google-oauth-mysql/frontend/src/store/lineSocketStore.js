// ✅ lineSocketStore.js
import { defineStore } from "pinia";
import { registerSocket, onLineAuthSuccess, removeListeners } from "@/services/lineSocketService";

export const useLineSocketStore = defineStore("lineSocket", {
    state: () => ({
        linked: false,
        message: null,
    }),
    actions: {
        initSocket(userId) {
            registerSocket(userId);
            onLineAuthSuccess((msg) => {
                this.linked = true;
                this.message = msg;
            });
        },
        resetState() {
            this.linked = false;
            this.message = null;
            removeListeners();
        },
    },
});
