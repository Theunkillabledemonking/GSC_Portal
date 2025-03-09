const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

router.get('/timetable-with-events', timetableController.getTimetableWithEvents);

// ✅ 정규 시간표 CRUD
router.get('/', timetableController.getTimetables); // 모든 정규 시간표 조회
router.post('/', timetableController.createTimetable); // 정규 시간표 등록
router.put('/:id', timetableController.updateTimetable); // 정규 시간표 수정
router.delete('/:id', timetableController.deleteTimetable); // 정규 시간표 삭제

module.exports = router;
