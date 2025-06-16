// ✅ socket.js
const { Server } = require("socket.io");
const socketMap = new Map();

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.VITE_FRONTEND_URL,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🧩 소켓 연결됨:", socket.id);

        socket.on("register", (userId) => {
            socketMap.set(userId, socket.id);
            console.log(`✅ 소켓 등록: ${userId} → ${socket.id}`);
        });

        socket.on("disconnect", () => {
            for (const [userId, id] of socketMap.entries()) {
                if (id === socket.id) {
                    socketMap.delete(userId);
                    console.log(`❌ 연결 해제: ${socket.id}`);
                }
            }
        });
    });
}

module.exports = {
    initializeSocket,
    get io() {
        return io;
    },
    socketMap,
};