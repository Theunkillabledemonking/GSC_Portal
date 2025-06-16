

// ✅ lineSocketService.js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_WS || "http://localhost:5000");

// 사용자 ID 등록 (소켓 맵핑)
export const registerSocket = (userId) => {
    if (userId) {
        socket.emit("register", userId);
    }
};

// 인증 성공 수신 리스너
export const onLineAuthSuccess = (callback) => {
    socket.on("line-auth-success", callback);
};

// 리스너 제거 (언마운트 시)
export const removeListeners = () => {
    socket.off("line-auth-success");
};

export default socket;
