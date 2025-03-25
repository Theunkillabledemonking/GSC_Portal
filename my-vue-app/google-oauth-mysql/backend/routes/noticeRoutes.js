const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/noticeController");
const { verifyToken, hasRole } = require("../middlewares/authMiddleware");

// ✅ 기존 multer 제거하고 우리가 만든 업로드 미들웨어 불러오기
const upload = require("../middlewares/uploadMiddleware");

// ✅ 공지사항 목록 조회
router.get("/", noticeController.getNotices);

// ✅ 공지사항 상세 조회
router.get("/:id", noticeController.getNoticeById);

// ✅ 공지사항 등록 (관리자 & 교수만 가능)
router.post(
    "/",
    verifyToken,
    hasRole(2),
    upload.fields([{ name: "attachments", maxCount: 5 }]), // ✅ 그대로 사용 가능
    noticeController.createNotice
);

// ✅ 공지사항 수정
router.put(
    "/:id",
    verifyToken,
    hasRole(2),
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    noticeController.updateNotice
);

// ✅ 공지사항 삭제
router.delete("/:id", verifyToken, noticeController.deleteNotice);

// ✅ 첨부파일 다운로드
router.get("/:id/download/:fileId", verifyToken, noticeController.downloadAttachment);

module.exports = router;
