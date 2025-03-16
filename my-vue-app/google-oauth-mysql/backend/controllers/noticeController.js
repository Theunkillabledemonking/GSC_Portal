const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:5000/uploads/";

/**
 * ✅ 중요 공지사항 자동 해제 (기간 만료)
 * - 10분마다 실행하여 `important_until`이 지난 공지를 `is_important = 0`으로 변경
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
// ✅ 10분마다 실행
setInterval(clearExpiredImportantNotices, 10 * 60 * 1000);

/**
 * ✅ 공지사항 목록 조회 (필터링 & 정렬 적용)
 */
exports.getNotices = async (req, res) => {
    try {
        const { grade, level, subject_id, search } = req.query;
        let query = `
            SELECT 
                n.id, n.title, n.content, n.grade, n.subject_id, 
                u.name AS author, n.created_at, n.updated_at, 
                n.is_important, n.notify_kakao, n.views, 
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
                n.id, n.title, n.content, n.grade, n.subject_id,
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

        notice.attachments = attachments.map(file => ({
            id: file.id,
            url: `${BASE_URL}${file.file_url}`,
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
 * ✅ 공지사항 등록 (첨부파일 포함)
 */
exports.createNotice = async (req, res) => {
    try {
        const { title, content, grade, is_important, notify_kakao, subject_id, important_until } = req.body;
        const author_id = req.user.id;

        const query = `
            INSERT INTO notices 
                (title, content, author_id, grade, subject_id, is_important, important_until) 
            VALUES 
                (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            title, content, author_id, grade || null, subject_id || null,
            is_important ? 1 : 0, important_until || null
        ];

        const [result] = await pool.query(query, params);
        const notice_id = result.insertId;

        // ✅ 첨부파일 저장 함수 호출
        await saveAttachments(req.files, notice_id);

        res.status(201).json({ message: "공지사항이 등록되었습니다.", notice_id });

    } catch (error) {
        console.log("공지사항 등록 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 공지사항 수정 (첨부파일 포함)
 */
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, grade, level, subject_id, is_important, important_until } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        // ✅ 작성자 검증
        const [notice] = await pool.query("SELECT author_id FROM notices WHERE id = ?", [id]);

        if (!notice.length || (role !== 1 && notice[0].author_id !== userId)) {
            return res.status(403).json({ message: "수정 권한이 없습니다." });
        }

        const query = `
            UPDATE notices 
            SET title = ?, content = ?, grade = ?, level = ?, subject_id = ?, 
                is_important = ?, important_until = ?
            WHERE id = ?
        `;
        await pool.query(query, [title, content, grade, level, subject_id, is_important, important_until, id]);

        res.status(200).json({ message: "공지사항이 수정되었습니다." });

    } catch (error) {
        console.error("공지사항 수정 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};


/**
 * ✅ 공지사항 삭제 (첨부파일도 삭제)
 */
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ 첨부파일 정보 조회
        const [attachments] = await pool.query("SELECT file_url FROM notice_attachments WHERE notice_id = ?", [id]);

        // ✅ 공지사항 삭제
        await pool.query("DELETE FROM notices WHERE id = ?", [id]);

        // ✅ 첨부파일 삭제
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
 * ✅ 첨부파일 다운로드 (모든 사용자 가능)
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
        const filePath = path.join(__dirname, "../uploads", path.basename(file.file_url));

        if (fs.existsSync(filePath)) {
            res.download(filePath, file.original_filename);
        } else {
            res.status(404).json({ message: "파일이 존재하지 않습니다." });
        }
    } catch (error) {
        console.error("파일 다운로드 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * ✅ 첨부파일 저장 함수
 */
const saveAttachments = async (files, notice_id) => {
    if (files && files.length > 0) {
        const attachmentQuery = `INSERT INTO notice_attachments (notice_id, file_url, original_filename) VALUES ?`;
        const attachmentParams = files.map(file => [notice_id, `${BASE_URL}${file.filename}`, file.originalname]);

        await pool.query(attachmentQuery, [attachmentParams]);
    }
};
