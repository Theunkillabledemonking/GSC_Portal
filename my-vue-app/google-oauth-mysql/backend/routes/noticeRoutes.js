const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/noticeController");
const { verifyToken, hasRole } = require("../middlewares/authMiddleware");

const multer = require("multer");
const fs = require("fs");
const path = require("path");


// 업로드할 폴더와 파일명을 설정하는 multer.diskStorage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${uniqueSuffix}-${basename}${ext}`);
    }
});

// 디스크 스토리지를 사용하는 multer 인스턴스 생성
const upload = multer({ storage });

// ✅ 공지사항 목록 조회
router.get("/", noticeController.getNotices);

// ✅ 공지사항 상세 조회
router.get("/:id", noticeController.getNoticeById);

// ✅ 공지사항 등록 (관리자 & 교수만 가능)
router.post("/", verifyToken, hasRole(2), upload.fields([{ name: 'attachments', maxCount: 5 }]), noticeController.createNotice);

// ✅ 공지사항 수정 (본인 글만, 관리자 전체)
router.put("/:id", verifyToken, hasRole(2), upload.fields([{ name: 'attachments', maxCount: 5 }]), noticeController.updateNotice);

// ✅ 공지사항 삭제
router.delete("/:id", verifyToken, noticeController.deleteNotice);

// ✅ 첨부파일 다운로드 추가
router.get("/:id/download/:fileId", verifyToken, noticeController.downloadAttachment);

module.exports = router;
