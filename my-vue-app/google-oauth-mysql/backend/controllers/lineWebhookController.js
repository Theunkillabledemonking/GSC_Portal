const { findValidAuthCode, markAuthCodeUsed, linkLineIdToUser } = require("../services/lineService");
const { sendLineMessage } = require("./lineMessageController");
const { io, socketMap } = require("../socket");

exports.handleWebhook = async (req, res) => {
    const events = req.body.events;
    console.log("📩 Webhook 수신됨:", req.body);

    for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
            const code = event.message.text;
            const lineUserId = event.source.userId;
            console.log("📩 인증번호 수신:", code);

            const entry = await findValidAuthCode(code);
            if (!entry) {
                await sendLineMessage(lineUserId, "❌ 인증번호가 유효하지 않거나 만료되었습니다.");
                continue;
            }

            await linkLineIdToUser(entry.user_id, lineUserId);
            await markAuthCodeUsed(entry.id);

            await sendLineMessage(lineUserId, "✅ LINE 연동이 완료되었습니다!");

            const socketId = socketMap.get(entry.user_id);
            if (io && socketId) {
                io.to(socketId).emit("line-auth-success", "✅ LINE 연동이 완료되었습니다!");
                console.log("🚀 WebSocket 알림 전송:", socketId);
            } else {
                console.warn("⚠️ WebSocket 전송 실패 - io 또는 socketId 없음");
            }
        }
    }

    res.sendStatus(200);
};