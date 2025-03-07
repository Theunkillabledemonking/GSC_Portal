const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// 정규 시간표 등록
router.post('/timetable', timetableController.createTimetable);

// 정규 시간표 수정
router.put('/timetable/:id', timetableController.updateTimetable);

// 정규 시간표 삭제
router.delete('/timetable/:id', timetableController.deleteTimetable);

// 학기별 시간표 + 이벤트 조회
router.get('/timetable-with-events', timetableController.getTimetableWithEvents);

// 이벤트 등록
router.post('/events', timetableController.createEvent);

// 이벤트 수정
router.put('/events/:event_id', timetableController.updateEvent);

// 이벤트 삭제
router.delete('/events/:event_id', timetableController.deleteEvent);

module.exports = router;