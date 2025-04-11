const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:5000/uploads/";

/**
 * ✅ 중요 공지사항 자동 해제 (기간 만료)
 */
const clearExpiredImportantNotices = async () => {
    try {
        const now = new Date();
        await pool.query("UPDATE notices SET is_important = 0 WHERE is_important = 1 AND important_until < ?", [now]);
        console.log("✅ 만료된 중요 공지사항이 자동 해제되었습니다.");
    } catch (error) {
        console.error("중요 공지사항 해제 오류:", error);
    }
};
setInterval(clearExpiredImportantNotices, 10 * 60 * 1000);

/**
 * ✅ 공지사항 목록 조회 (필터링 & 정렬 적용)
 */
exports.getNotices = async (req, res) => {
    try {
        const { grade, level, subject_id, search, is_foreigner } = req.query;
        let query = `
            SELECT
                n.id, n.title, n.content, n.grade, n.level, n.subject_id,
                u.name AS author, n.created_at, n.updated_at,
                n.is_important, n.notify_kakao, n.views,
                n.is_foreigner,
                s.name AS subject_name
            FROM notices n
                     JOIN users u ON n.author_id = u.id
                     LEFT JOIN subjects s ON n.subject_id = s.id
            WHERE 1=1
        `;
        let params = [];

        if (grade) {
            query += " AND (n.grade IS NULL OR n.grade = ?)";
            params.push(grade);
        }
        if (level) {
            query += " AND (n.level IS NULL OR n.level = ?)";
            params.push(level);
        }
        if (subject_id) {
            query += " AND n.subject_id = ?";
            params.push(subject_id);
        }
        if (is_foreigner !== undefined) {
            query += " AND (n.is_foreigner IS NULL OR n.is_foreigner = ?)";
            params.push(is_foreigner);
        }
        if (search) {
            query += " AND (n.title LIKE ? OR u.name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY n.is_important DESC, n.created_at DESC";

        const [notices] = await pool.query(query, params);
        res.status(200).json({ notices });
    } catch (error) {
        console.error("공지사항 조회 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 공지사항 상세 조회 (조회수 증가 포함)
 */
exports.getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;

        const noticeQuery = `
            SELECT
                n.id, n.title, n.content, n.grade, n.subject_id, n.author_id,
                u.name AS author, n.created_at, n.updated_at,
                n.is_important, n.notify_kakao, n.views,
                s.name AS subject_name
            FROM notices n
                     JOIN users u ON n.author_id = u.id
                     LEFT JOIN subjects s ON n.subject_id = s.id
            WHERE n.id = ?
        `;
        const [notices] = await pool.query(noticeQuery, [id]);

        if (notices.length === 0) {
            return res.status(404).json({ message: "공지사항을 찾을 수 없습니다." });
        }

        const notice = notices[0];

        // ✅ 첨부파일 조회
        const [attachments] = await pool.query(
            "SELECT id, file_url, original_filename FROM notice_attachments WHERE notice_id = ?",
            [id]
        );

        // ✅ 여기에서 BASE_URL을 붙여서 완전한 다운로드 링크로 만들어줌
        notice.attachments = attachments.map(file => ({
            id: file.id,
            url: `${BASE_URL}${file.file_url}`,  // ✅ URL은 여기서만 조립
            name: file.original_filename
        }));

        // ✅ 조회수 증가
        await pool.query("UPDATE notices SET views = views + 1 WHERE id = ?", [id]);

        res.status(200).json(notice);
    } catch (error) {
        console.error("공지사항 상세 조회 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 공지사항 등록 (is_foreigner 포함) - 관리자(1) 또는 교수(2)만 가능
 */
exports.createNotice = async (req, res) => {
    try {
        const { title, content, grade, level, subject_id, is_important, important_until, is_foreigner } = req.body;
        const author_id = req.user?.id;
        const role = req.user?.role;

        if (!author_id || (role > 2)) {
            return res.status(403).json({ message: "공지사항 작성 권한이 없습니다." });
        }

        const query = `
            INSERT INTO notices (title, content, author_id, grade, level, subject_id, is_important, important_until, is_foreigner)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            title,
            content,
            author_id,
            grade || null,
            level || null,
            subject_id || null,
            is_important || 0,
            important_until || null,
            is_foreigner ?? null
        ];

        await pool.query(query, params);
        res.status(201).json({ message: "공지사항이 등록되었습니다." });
    } catch (error) {
        console.error("공지사항 등록 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 공지사항 수정 (is_foreigner 포함) - 관리자(1) 전부 / 교수(2)는 본인 작성만 가능
 */
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, grade, level, subject_id, is_important, important_until, is_foreigner } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        const [noticeRows] = await pool.query("SELECT author_id FROM notices WHERE id = ?", [id]);
        const notice = noticeRows[0];

        if (!notice || (role !== 1 && notice.author_id !== userId)) {
            return res.status(403).json({ message: "공지사항 수정 권한이 없습니다." });
        }

        const query = `
            UPDATE notices
            SET title = ?, content = ?, grade = ?, level = ?, subject_id = ?,
                is_important = ?, important_until = ?, is_foreigner = ?
            WHERE id = ?
        `;

        const params = [
            title,
            content,
            grade || null,
            level || null,
            subject_id || null,
            is_important || 0,
            important_until || null,
            is_foreigner ?? null,
            id
        ];

        await pool.query(query, params);
        res.status(200).json({ message: "공지사항이 수정되었습니다." });
    } catch (error) {
        console.error("공지사항 수정 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};


/**
 * ✅ 공지사항 삭제 (첨부파일도 삭제)
 */
/**
 * ✅ 공지사항 삭제 - 관리자(1) 전부 / 교수(2)는 본인 작성만 가능
 */
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const [noticeRows] = await pool.query("SELECT author_id FROM notices WHERE id = ?", [id]);
        const notice = noticeRows[0];

        if (!notice || (role !== 1 && notice.author_id !== userId)) {
            return res.status(403).json({ message: "공지사항 삭제 권한이 없습니다." });
        }

        // 첨부파일 정보 조회 및 삭제
        const [attachments] = await pool.query("SELECT file_url FROM notice_attachments WHERE notice_id = ?", [id]);

        await pool.query("DELETE FROM notices WHERE id = ?", [id]);

        attachments.forEach(file => {
            const filePath = `./uploads/${file.file_url}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        res.status(200).json({ message: "공지사항이 삭제되었습니다." });
    } catch (error) {
        console.error("공지사항 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 파일 다운로드
 */
exports.downloadAttachment = async (req, res) => {
    try {
        const { id, fileId } = req.params;
        const [attachments] = await pool.query(
            "SELECT file_url, original_filename FROM notice_attachments WHERE notice_id = ? AND id = ?",
            [id, fileId]
        );

        if (attachments.length === 0) {
            return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
        }

        const file = attachments[0];
        // 실제 저장된 파일명
        const storedFilename = path.basename(file.file_url);
        // 다운로드 시 보여줄 파일명(한글 포함)
        const downloadName = file.original_filename;

        const filePath = path.join(__dirname, "../uploads", storedFilename);

        // 두 번째 인자로 original_filename을 넘기면 정상 한글 파일명으로 다운로드됨
        res.download(filePath, downloadName);
    } catch (error) {
        console.error("파일 다운로드 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * 첨부파일 저장 함수
 * @param {Array} files - 업로드된 파일 배열 (req.files.attachments)
 * @param {number} notice_id - 생성된 공지사항의 ID
 */
const saveAttachments = async (files, notice_id) => {
    if (!files || files.length === 0) return;

    const attachmentParams = files.map(file => {
        const originalName = file.cleanedOriginal || file.originalname;  // ✅ 변경 포인트!
        const filename = file.storedFilename || file.filename;

        console.log("✅ 실제 저장된 파일명:", filename);
        console.log("✅ 다운로드용 원래 이름:", originalName);

        return [notice_id, filename, originalName];
    });

    const attachmentQuery = `
        INSERT INTO notice_attachments (notice_id, file_url, original_filename)
        VALUES ?
    `;

    await pool.query(attachmentQuery, [attachmentParams]);
};