const pool = require('../config/db');
const BASE_URL = "http://localhost:5000/uploads/";
/**
* ✅ 공지사항 등록 (관리자 & 교수만 가능)
*/
exports.createNotices = async (req, res) => {
    try {
        const { title, content, grade, is_important, notify_kakao } = req.body;
        const author_id = req.user.id; // `verifyToken` 미들웨어 덕분에 req.user 사용 가능

        const gradeValue = grade === "" ? null : grade;

        const isImportantVal = parseInt(is_important, 10) === 1 ? 1 : 0;

        const attachment = req.file ? req.file.filename : null;
        const attachment_url = req.file ? `${BASE_URL}${req.file.filename}` : null;
        const originalFileName = req.originalFileName || null;

        // 2. 공지사항 등록
        const [result] = await pool.query(
            "INSERT INTO notices (title, content, author_id, grade, is_important, attachment, attachment_url, original_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [title, content, author_id, gradeValue, isImportantVal ? 1 : 0, attachment, attachment_url, originalFileName],
        );

        res.status(201).json({ message: "Notice created successfully", notice_id: result.insertId });

        // 추후 카카오톡 알람 추가 기능
        if (notify_kakao) {
            console.log('카카오톡 알림 기능은 추후 구현 예정!');
        }
    } catch (error) {
        console.log("Error creating notice:", error);
        res.status(500).json( {error: "server error"});
    }
};

/**
 * 공지사항 전체 조회 (학생은 본인 학년 공지만 조회 가능)
 */
exports.getNotices = async (req, res) => {
    try {
        const role = req.user.role;
        const grade = req.user.grade;

        let query = `
            SELECT n.id, n.title, n.content, u.name AS author, n.grade,
                   n.created_at, n.updated_at, n.is_important, n.notify_kakao, n.views,
                   n.attachment, n.attachment_url
            FROM notices n
            JOIN users u ON n.author_id = u.id
            ORDER BY n.is_important DESC, n.created_at DESC
        `;
        let params = [];

        if (role === 3) {
            query = `
                SELECT n.id, n.title, n.content, u.name AS author, n.grade,
                       n.created_at, n.updated_at, n.is_important, n.notify_kakao, n.views,
                       n.attachment, n.attachment_url
                FROM notices n
                JOIN users u ON n.author_id = u.id
                WHERE n.grade IS NULL OR n.grade = ?
                ORDER BY n.is_important DESC, n.created_at DESC
            `;
            params = [grade];
        }

        const [notices] = await pool.query(query, params);
        res.status(200).json({ notices });

    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });    3
    }
};


/**
 * 공지사항 상세 조회
 */
exports.getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. 조회수 증가
        await pool.query('UPDATE notices SET views = views + 1 WHERE id = ?', [id]);

        // 2. 공지사항 상세 정보 가져오기
        const [notices] = await pool.query(`
            SELECT n.id, n.title, n.content, u.name AS author, n.grade,
                   n.created_at, n.updated_at, n.is_important, n.notify_kakao, n.views,
                   n.attachment, n.attachment_url, n.original_filename
            FROM notices n
            JOIN users u ON n.author_id = u.id
            WHERE n.id = ?
        `, [id]);

        if (notices.length === 0 ) {
            return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
        }

        const notice = notices[0];

        // 첨부파일 URL 생성
        if (notice.attachment) {
            notice.attanchment_url = `${BASE_URL}${notice.attachment}`;
        } else {
            notice.attanchment_url = null;
        }

        if (notices.length === 0) {
            return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json(notices[0]);
    } catch (error) {
        console.log("공지사항 상세 조회 오류:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


/**
 * 공지사항 수정 (교수는 본인 글만, 관리자는 모두 가능)
 */
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_important, notify_kakao } = req.body;
        let { grade } = req.body;

        const userId = req.user.id;
        const role = req.user.role;

        // grade 정리 (빈문자열이나 'null'이 오면 null로 세팅
        if (grade === '' || grade === 'null') {
            grade = null;
        } else {
            grade = Number(grade);
        }

        const isImportant = parseInt(is_important,10) === 1 ? 1 : 0;

        // 교수는 본인 글만 수정 가능, 관리자는 모든 글 수정 가능
        const [currentNotice] = await pool.query('SELECT * FROM notices WHERE id = ?',  [id]);
        if (currentNotice.length === 0) {
            return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.'});
        }

        if (role !== 1 && currentNotice[0]?.author_id !== userId) {
            return res.status(403).json({message: '수정 권한이 없습니다.'});
        }

        let attachment = currentNotice[0].attachment;
        let attachment_url = currentNotice[0].attachment_url;
        let originalFileName = currentNotice[0].original_filename;  // 기존 파일명도 유지

        // 새로운 파일이 있으면 교체
// 새로운 파일이 올라오면 덮어쓰기
        if (req.file) {
            attachment = req.file.filename;
            attachment_url = `${BASE_URL}${req.file.filename}`;
            originalFileName = req.originalFileName || req.file.originalname;  // 업로드 시 한글깨짐 대비 저장
        }
        console.log({
            title, content, grade,is_important, attachment_url, originalFileName
        });

        // 공지사항 업데이트
        await pool.query(
            'UPDATE notices SET title = ?, content = ?, grade = ?, is_important = ?, attachment = ?, attachment_url = ?, original_filename = ?, notify_kakao = ? WHERE id = ?',
            [title, content, grade, isImportant, attachment, attachment_url, originalFileName, notify_kakao, id]
        );

        res.status(200).json({ message: '공지사항이 수정되었습니다.' });

        // 추후 카카오톡 알림 추가 기능
        if (notify_kakao) {
            console.log('수정된 공지사항 카카오톡 알림 예정!');
        }
    } catch (error) {
        console.log('공지사항 수정 오류:', error);
        res.status(500).json({ message: "서버 오류가 발생했습니다. "});
    }
};

/**
 * 공지사항 삭제 (교수는 본인 글만, 관리자는 모두 가능)
 */
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        // 교수는 본인 글만 삭제 가능, 관리자는 모든 글 삭제 가능
        const [notice] = await pool.query('SELECT author_id FROM notices WHERE id = ?', [id]);

        if (notice.length === 0) {
            return res.status(404).json({ message: "공지사항을 찾을 수 없습니다." });
        }

        if (role !== 1 && notice[0]?.author_id !== userId) {
            return res.status(403).json({ message: "삭제 권한이 없습니다."});
        }

        await pool.query('DELETE FROM notices WHERE id = ?', [id]);
        res.status(200).json({ message: "공지사항이 삭제되었습니다." });
    } catch (error) {
        console.error('공지사항 삭제 오류:', error);
        res.status(500).json({ message: "서버 오류가 발생했습니다."});
    }
}