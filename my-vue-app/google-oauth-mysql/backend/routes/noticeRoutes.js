const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/noticeController");
const { verifyToken, hasRole } = require("../middlewares/authMiddleware");

const multer = require("multer");
const upload = multer({ dest: "uploads" });

// ✅ 공지사항 목록 조회
router.get("/", noticeController.getNotices);

// ✅ 공지사항 상세 조회
router.get("/:id", noticeController.getNoticeById);

// ✅ 공지사항 등록 (관리자 & 교수만 가능)
router.post("/", verifyToken, hasRole(2), upload.array('attachments'), noticeController.createNotice);

// ✅ 공지사항 수정 (본인 글만, 관리자 전체)
router.put("/:id", verifyToken, upload.array('attachments'), noticeController.updateNotice);

// ✅ 공지사항 삭제
router.delete("/:id", verifyToken, noticeController.deleteNotice);

// ✅ 첨부파일 다운로드 추가
router.get("/:id/download/:fileId", verifyToken, noticeController.downloadAttachment);

module.exports = router;
