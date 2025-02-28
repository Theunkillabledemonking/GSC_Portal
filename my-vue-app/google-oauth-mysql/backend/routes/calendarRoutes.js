// routes/calendarRoutes.js

const express = require('express');
const router = express.Router();
const { calendar, CALENDAR_ID } = require('../config/googleAPI');
const { createEvent, listEvents, deleteEvent } = require('../controllers/calendarController');


router.get('/test-insert', async (req, res) => {
    try {
        const newEvent = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: {
                summary: '테스트 일정',
                description: '서비스 계정으로 생성',
                start: { dateTime: '2025-03-01T10:00:00', timeZone: 'Asia/Seoul' },
                end: { dateTime: '2025-03-01T11:00:00', timeZone: 'Asia/Seoul' }
            }
        });
        res.json(newEvent.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 일정 생성
router.post('/events', createEvent);

// 일정 조회
router.get('/events', listEvents);

// 일정 삭제
router.get('/events/:eventId', deleteEvent);

module.exports = router;