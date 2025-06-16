// routes/calendarRoutes.js

const express = require('express');
const router = express.Router();
const { createEvent, listEvents, deleteEvent, updateEvent } = require('../controllers/calendarController');
//
// // ✅ 사용자의 Google 캘린더 이벤트 가져오기 (JWT 인증 필요)
// router.get("/calendar", verifyToken, async (req, res) => {
//     try {
//         const events = await getGoogleCalendarEvents(req.user.accessToken);
//         res.json({ events });
//     } catch (error) {
//         res.status(500).json({ message: "캘린더 데이터를 가져오지 못했습니다." });
//     }
// }); 추후 구현예정

// 일정 생성
router.post('/events', createEvent);

// 일정 수정
router.put('/events/:eventId', updateEvent);

// 일정 조회
router.get('/events', listEvents);

// 일정 삭제
router.delete('/events/:eventId', deleteEvent);

module.exports = router;