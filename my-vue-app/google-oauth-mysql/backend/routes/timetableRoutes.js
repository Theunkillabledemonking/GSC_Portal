const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// ============= 시간표 API 경로 =============

// 1. 시간표 조회 API
router.get('/full', timetableController.getTimetableWithEvents);         // 정규 + 이벤트 + 공휴일
router.get('/', timetableController.getTimetables);                      // 정규 수업만
router.get('/special', timetableController.getSpecialLectures);          // 특강만
router.get('/weekly', timetableController.getWeeklyTimetable);           // 주간 통합 시간표 (추가)
router.get('/events', timetableController.getEvents);                    // 이벤트만 조회

// 2. 시간표 등록/수정/삭제 API
router.post('/', timetableController.createTimetable);                   // 정규/특강 통합 등록
router.post('/events', timetableController.createEvent);                 // 보강/휴강/행사 이벤트 등록 (추가)
router.put('/:id', timetableController.updateTimetable);                 // 수정
router.put('/events/:id', timetableController.updateEvent);
router.delete('/:id', timetableController.deleteTimetable);              // 삭제
router.delete('/events/:id', timetableController.deleteEvent);

module.exports = router;
