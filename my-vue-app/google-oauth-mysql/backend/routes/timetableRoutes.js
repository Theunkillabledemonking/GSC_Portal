const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');


// 학기별 시간표 + 이벤트 조회
router.get('/timetable-with-events', timetableController.getTimetableWithEvents);

// 정규 시간표 등록
router.post('/timetables', timetableController.createTimetable);

// 정규 시간표 수정
router.put('/timetables/:id', timetableController.updateTimetable);

// 정규 시간표 삭제
router.delete('/timetables/:id', timetableController.deleteTimetable);


// 이벤트 등록
router.post('/timetables/events', timetableController.createEvent);

// 이벤트 수정
router.put('/timetables/events/:event_id', timetableController.updateEvent);

// 이벤트 삭제
router.delete('/timetables/events/:event_id', timetableController.deleteEvent);

module.exports = router;