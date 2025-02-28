const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');  // 한글깨짐 방지
        const safeName = originalname.replace(/[^a-zA-Z0-9가-힣_.-]/g, '_');  // 특수문자 제거
        const uniqueName = Date.now() + '-' + safeName;
        req.originalFileName = safeName;  // 원본 파일명 보존
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });
module.exports = upload;
