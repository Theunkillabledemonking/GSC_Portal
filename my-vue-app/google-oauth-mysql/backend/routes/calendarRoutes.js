// routes/calendarRoutes.js

const express = require('express');
const router = express.Router();
const { createEvent, listEvents, deleteEvent, updateEvent } = require('../controllers/calendarController');

// 일정 생성
router.post('/events', createEvent);

// 일정 수정
router.put('/events/:eventId', updateEvent);

// 일정 조회
router.get('/events', listEvents);

// 일정 삭제
router.get('/events/:eventId', deleteEvent);

module.exports = router;