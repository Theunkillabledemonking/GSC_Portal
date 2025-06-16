const multer = require("multer");
const path = require("path");
const iconv = require("iconv-lite");

const recoverBrokenFilename = (name) => {
    try {
        // 1차: binary → utf8
        const decodedBinary = iconv.decode(Buffer.from(name, "binary"), "utf8");

        // 한글이 포함되면 성공
        if (/[\uac00-\ud7af]/.test(decodedBinary)) {
            return decodedBinary.normalize("NFC");
        }

        // 2차: latin1 → utf8
        const decodedLatin = iconv.decode(Buffer.from(name, "latin1"), "utf8");
        if (/[\uac00-\ud7af]/.test(decodedLatin)) {
            return decodedLatin.normalize("NFC");
        }

        // fallback: 그냥 normalize만
        return name.normalize("NFC");
    } catch {
        return name.normalize("NFC");
    }
};


const sanitizeFilename = (name) => {
    return recoverBrokenFilename(name)
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_");
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const safeBase = sanitizeFilename(basename);

        const finalFilename = `${uniqueSuffix}-${safeBase}${ext}`;

        // ✅ Multer에서 파일 복원된 원본명을 따로 기록
        file.storedFilename = finalFilename;
        file.cleanedOriginal = `${safeBase}${ext}`; // ✅ 이게 DB에 들어갈 원래 파일명

        cb(null, finalFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;
