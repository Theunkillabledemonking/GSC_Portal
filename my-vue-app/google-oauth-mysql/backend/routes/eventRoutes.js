const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController'); // 새로운 이벤트 컨트롤러

// ✅ 이벤트 CRUD (보강, 휴강, 특강)
router.get('/', eventController.getEvents); // 모든 이벤트 조회
router.post('/', eventController.createEvent); // 이벤트 등록
router.put('/:id', eventController.updateEvent); // 이벤트 수정
router.delete('/:id', eventController.deleteEvent); // 이벤트 삭제

module.exports = router;
