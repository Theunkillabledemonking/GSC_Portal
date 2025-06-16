const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:5000/uploads/";
const { sendLineNotification } = require("../utils/lineNotification");

/**
 * ✅ 중요 공지사항 자동 해제 (기간 만료)
 */
const clearExpiredImportantNotices = async () => {
    try {
        const now = new Date();
        await pool.query(
            "UPDATE notices SET is_important = 0 WHERE is_important = 1 AND important_until < ?",
            [now]
        );
        console.log("✅ 만료된 중요 공지사항이 자동 해제되었습니다.");
    } catch (error) {
        console.error("중요 공지사항 해제 오류:", error);
    }
};
setInterval(clearExpiredImportantNotices, 10 * 60 * 1000);


// exports.sendLineNotification = async ({ title, content, grade, level, is_foreigner, isUpdate = false }) => {
//     let query = `SELECT line_user_id FROM users WHERE line_user_id IS NOT NULL`;
//     const params = [];
//
//     if (grade) {
//         query += " AND grade = ?";
//         params.push(grade);
//     }
//     if (level && level !== "ALL") {
//         query += " AND level = ?";
//         params.push(level);
//     }
//     if (is_foreigner !== undefined && is_foreigner !== null) {
//         query += " AND is_foreigner = ?";
//         params.push(is_foreigner);
//     }
//
//     const [targets] = await pool.query(query, params);
//     console.log("📨 LINE 전송 대상 수:", targets.length);
//
//     const message = `📢 [공지${isUpdate ? " 수정됨" : ""}] ${title}\n${content}\n👉 포털에서 확인하세요`;
//
//     for (const { line_user_id } of targets) {
//         try {
//             await sendLineMessage(line_user_id, message);
//             console.log("📤 전송 성공:", line_user_id);
//         } catch (e) {
//             console.error("❌ 전송 실패:", line_user_id, e.message);
//         }
//     }
// };

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
                IFNULL(s.name, '과목 없음') AS subject_name
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
        // 레벨이 선택되지 않았거나 "ALL"인 경우에는 조건을 추가하지 않음.
        if (level && level !== "ALL") {
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

        // 첨부파일 조회 및 URL 조립
        const [attachments] = await pool.query(
            "SELECT id, file_url, original_filename FROM notice_attachments WHERE notice_id = ?",
            [id]
        );

        notice.attachments = attachments.map(file => ({
            id: file.id,
            url: `${BASE_URL}${file.file_url}`,
            name: file.original_filename
        }));

        // 조회수 증가 처리
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
        const { title, content, grade, level, subject_id, is_important, important_until, is_foreigner, notify_line } = req.body;
        const author_id = req.user?.id;
        const role = req.user?.role;

        if (!title || !content || !author_id || role > 2) {
            return res.status(400).json({ message: "입력값 누락 또는 권한 부족" });
        }

        const [result] = await pool.query(`
            INSERT INTO notices (title, content, author_id, grade, level, subject_id, is_important, important_until, is_foreigner)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, content, author_id, grade || null, level || null, subject_id || null, is_important || 0, important_until || null, is_foreigner ?? null]
        );

        const noticeId = result.insertId;

        // 알림 전송
        if (notify_line === "true" || notify_line === true) {
            // 작성자 정보 조회
            const [[authorData]] = await pool.query("SELECT name FROM users WHERE id = ?", [author_id]);
            const authorName = authorData?.name || "관리자";
            
            // 과목 정보 조회 (subject_id가 있을 경우)
            let subjectName = null;
            if (subject_id) {
                const [[subjectData]] = await pool.query("SELECT name FROM subjects WHERE id = ?", [subject_id]);
                subjectName = subjectData?.name;
            }
            
            // LINE 알림 전송
            await sendLineNotification({
                id: noticeId,
                title,
                content,
                grade,
                level,
                is_foreigner,
                author: authorName,
                subject_name: subjectName
            });
        }

        res.status(201).json({ message: "공지사항이 등록되었습니다." });
    } catch (error) {
        console.error("공지사항 등록 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, grade, level, subject_id, is_important, important_until, is_foreigner, notify_line } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        const [noticeRows] = await pool.query("SELECT author_id FROM notices WHERE id = ?", [id]);
        const notice = noticeRows[0];

        if (!notice || (role !== 1 && notice.author_id !== userId)) {
            return res.status(403).json({ message: "공지사항 수정 권한이 없습니다." });
        }

        await pool.query(`
            UPDATE notices SET title = ?, content = ?, grade = ?, level = ?, subject_id = ?, is_important = ?, important_until = ?, is_foreigner = ?
            WHERE id = ?`,
            [title, content, grade || null, level || null, subject_id || null, is_important || 0, important_until || null, is_foreigner ?? null, id]
        );

        if (notify_line === "true" || notify_line === true) {
            // 작성자 정보 조회
            const [[authorData]] = await pool.query("SELECT name FROM users WHERE id = ?", [userId]);
            const authorName = authorData?.name || "관리자";
            
            // 과목 정보 조회 (subject_id가 있을 경우)
            let subjectName = null;
            if (subject_id) {
                const [[subjectData]] = await pool.query("SELECT name FROM subjects WHERE id = ?", [subject_id]);
                subjectName = subjectData?.name;
            }
            
            // LINE 알림 전송 (수정 모드)
            await sendLineNotification({
                id,
                title,
                content,
                grade,
                level,
                is_foreigner,
                author: authorName,
                subject_name: subjectName,
                isUpdate: true
            });
        }

        res.status(200).json({ message: "공지사항이 수정되었습니다." });
    } catch (error) {
        console.error("공지사항 수정 오류:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};


/**
 * ✅ 공지사항 삭제 (첨부파일도 삭제)
 *    - 관리자(1) 전부 / 교수(2)는 본인 작성만 가능
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

        // 첨부파일 정보 조회 후 삭제
        const [attachments] = await pool.query(
            "SELECT file_url FROM notice_attachments WHERE notice_id = ?",
            [id]
        );

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
        const storedFilename = path.basename(file.file_url);
        const downloadName = file.original_filename;
        const filePath = path.join(__dirname, "../uploads", storedFilename);

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
        const originalName = file.cleanedOriginal || file.originalname;  // 파일 이름 가공
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
