const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// ✅ GET /api/timetables/timetable-with-events
//    year, start_date, end_date 쿼리로 받아서 FullCalendar 형태 데이터 반환

// ✅ 정규 시간표 CRUD
router.get('/full', timetableController.getTimetableWithEvents);         // 정규 + 이벤트 + 공휴일
router.get('/', timetableController.getTimetables);                      // 정규 수업만
router.get('/special', timetableController.getSpecialLectures);          // 🔥 특강만
router.post('/', timetableController.createTimetable);                   // 정규/특강 통합 등록 (is_special_lecture 활용)
router.put('/:id', timetableController.updateTimetable);                 // 수정
router.delete('/:id', timetableController.deleteTimetable);
module.exports = router;
