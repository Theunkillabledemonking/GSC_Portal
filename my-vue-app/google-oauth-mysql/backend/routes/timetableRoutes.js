const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// 정규 시간표 + 이벤트 조회 (학기별, 학년별 조회)
router.get('/timetable-with-events', timetableController.getTimetableWithEvents);

// 이벤트 등록 (휴강, 보강, 특강)
router.post('/events', timetableController.createEvent);

// 이벤트 수정 (휴강, 보강, 특강)
router.put('/events/:event_id', timetableController.updateEvent);

// 이벤트 삭제
router.delete('/events/:event_id', timetableController.deleteEvent);

module.exports = router;
