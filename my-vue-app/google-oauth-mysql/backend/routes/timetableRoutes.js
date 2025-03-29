const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// ✅ GET /api/timetables/timetable-with-events
//    year, start_date, end_date 쿼리로 받아서 FullCalendar 형태 데이터 반환
router.get('/full', timetableController.getTimetableWithEvents);

// ✅ 정규 시간표 CRUD
router.get('/', timetableController.getTimetables); // 모든 정규 시간표 조회
router.post('/', timetableController.createTimetable); // 정규 시간표 등록
router.put('/:id', timetableController.updateTimetable); // 정규 시간표 수정
router.delete('/:id', timetableController.deleteTimetable); // 정규 시간표 삭제

module.exports = router;
