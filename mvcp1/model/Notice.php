<?php
require_once '../config/config.php'; // 데이터베이스 연결 설정 포함

/**
 * Notice 클래스는 공지사항(게시물) 관련 기능을 담당합니다.
 * CRUD 작업 (Create, Read, Update, Delete)을 포함하며,
 * 각 작업은 데이터베이스와 상호작용합니다.
 */
class Notice {
    /**
     * 공지사항 작성
     * 
     * @param string $title 공지사항 작성
     * @param string $content 공지사항 제목
     * @param int $author_id 작성자 ID
     * @return bool 작성 성공 여부
     */
    public static function create($title, $content, $author_id) {
        $conn = connect_db(); // 데이터베이스 연결

        // 공지사항을 데이터베이스에 삽입하는 SQL 쿼리
        // VALUES (?, ?, ?)는 파라미터 바인딩을 통해 사용자 입력값을 안전하게 처리합니다.
        $sql = "INSERT INTO notices (title, content, author_id) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $title, $content, $author_id); // 파라미터 바인딩 (s: stirng, i: int)
        
        // 쿼리 실행 후 결과 반환
        if ($stmt->execute()) {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료
            return true; // 작성 성공
        } else {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료료
            return false; // 작성 실패
        }
    }

    /**
     * 공지사항 수정
     * 
     * @param int $notice_id 수정할 공지사항 ID
     * @param string $title 수정된 제목
     * @param string $content 수정된 내용
     * @param int $author_id 작성자 ID (작성자 본인인지 확인)
     * @return bool 수정 성공 여부부
     */
    public static function update($notice_id, $title, $content, $user_role, $author_id = null) {
        $conn = connect_db(); // DB 연결

        // 공지사항을 수정하는 SQL 쿼리
        // 관리자일 경우, 작성자(author_id) 확인 없이 수정 가능
        if ($user_role === 'admin') {
            $sql = "UPDATE notices SET title = ?, content = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssi", $title, $content, $notice_id);
        } else {
            // WHERE 조건에서 id와 author_id를 확인하여
            // 작성자 본인만 수정할 수 있도록 제한합니다.
            $sql = "UPDATE notices SET title = ?, content = ? WHERE id = ? AND author_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssii", $title, $content, $notice_id, $author_id);
        }
        
        // 쿼리 실행후 결과 반환
        if ($stmt->execute()) {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료
            return true; // 수정 성공
        } else {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료료
            return false; // 수정 실패
        }
    }

    /**
     * 공지사항 삭제
     * 
     * @param int $notice_id 삭제할 공지사항 ID
     * @return bool 삭제 성공 여부
     */
    public static function delete($notice_id, $user_role, $author_id = null) {
        $conn = connect_db(); // DB 연결

        // 공지사항을 삭제하는 SQL 쿼리
        // 관리자일 경우, 작성자(author_id) 확인 없이 삭제 가능
        if ($user_role === 'admin') {
            $sql = "DELETE FROM notices WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $notice_id);
        } else {
            // WHERE 조건에서 id와 author_id를 확인하여
            // 작성자 본인만 삭제할 수 있도록 제한합니다.
            $sql = "DELETE FROM notices WHERE id = ? AND author_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $notice_id, $author_id); // 파라미터 바인딩
        }
        
        // 쿼리 실행 후 결과 반환
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // DB 종료
            return true; // 삭제 성공
        } else {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // DB 종료료
            return false; // 삭제 실패
        }
    }

    /**
     * 공지사항 작성자 ID 가져오기
     * 
     * @param int $notice_id 공지사항 ID
     * @return int 작성자 ID
     */
    public static function getAuthorID($notice_id) {
        $conn = connect_db(); // DB 연결

        // 특정 공지사항의 작성자 ID를 가져오는 SQL 쿼리리
        $sql = "SELECT author_id FROM notices WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $notice_id); // 파라미터 바인딩
        $stmt->execute();
        $stmt->bind_result($author_id); // 결과를 변수에 바인딩
        $stmt->fetch(); // 결과를 가져옴

        $stmt->close(); // 쿼리 종료
        $conn->close(); // DB 연결 종료
        return $author_id; // 작성자 ID 반환환
    }

    /**
     * 공지사항 목록 조회 (검색 및 페이지네이션)
     * 
     * @param string|null $search 검색어 (제목 또는 작성자)
     * @param int $page 현재 페이지 번호
     * @param int $limit 한 페이지당 표시할 개수
     * @return array 공지사항 목록 및 총 페이지 수 반환
     */
    public static function getAll($search = null, $option = 'title', $page = 1, $limit = 10) {
        $conn = connect_db(); // 데이터베이스 연결

        // 페이지네이션을 위한 OFFSET 계산 (0부터 시작)
        $page = max(1, (int)$page); // 페이지 번호 최소 1 이상
        $limit = max(1, (int)$limit); // 한 페이지당 표시할 개수 최소 1 이상
        $offset = ($page - 1) * $limit; // offset 계산
        
        // 검색어가 입력된 경우,, SQL 'LIKE' 연산을 사용하기 위해 % 추가
        // 검색어가 없으면 기본값 "%"를 사용해 모든 데이터 조회
        $search = isset($search) ? "%".$search."%" : "%";

        // 검색 옵션에 따라 WHERE 조건 다르게 설정
        $allowedColumns = ['author' => 'user.name', 'title' => 'notices.title'];
        $column = $allowedColumns[$option] ?? 'notices.title'; // 기본값 title

        /**
         * 공지사항 목록을 조회하는 SQL 쿼리
         * - 'JOIN users ON notices.author_id = users.id' : 작성자의 이름 (users.name) 포함
         * - 'WHERER notices.title LIKE ? OR users.name LIKE ?': 제목 또는 작성자 이름으로 검색
         * - 'ORDER BY notices.created_at DESC': 최신 게시물 순으로 정렬
         * - 'LIMIT ? OFFSET ?': 페이징 처리를 위해 제한된 개수만 조회회
         */
        $sql = "SELECT notices.id, notices.title, notices.content, notices.created_at, users.name AS author_name
                FROM notices
                JOIN users ON notices.author_id = users.id
                WHERE $column LIKE ?
                ORDER BY notices.created_at DESC
                LIMIT ? OFFSET ?";

        $stmt = $conn->prepare($sql); // sql 준비비
        $stmt->bind_param("sii", $search, $limit, $offset); // 파라미터 바인딩딩
        $stmt->execute(); // 쿼리 실행
        $result = $stmt->get_result(); // 실행 결과 가져오기

        // 조회된 게시물 데이터를 저장할 배열
        $notices = [];
        while ($row = $result->fetch_assoc()) {
            $notices[] = $row; // 각 행을 배열에 추가
        }

        /**
         * 전체 게시물 개수를 조회하는 SQL 처리
         * - 검색어 적용 (WHERE 절 포함)
         * - 페이지네이션을 위한 전체 데이터 개수를 계산
         */
        $count_sql = "SELECT COUNT(*) AS total FROM notices
                      JOIN users ON notices.author_id = users.id
                      WHERE $column LIKE ?";

        $count_stmt = $conn->prepare($count_sql); // SQL 준비
        $count_stmt->bind_param("s", $search); // 파라미터 바인딩
        $count_stmt ->execute(); // 쿼리 실행
        $count_result = $count_stmt->get_result(); // 실행 결과 가져오기
        $total_rows = $count_result->fetch_assoc()['total']; // 전체 게시물 개수 가져오기
        $total_pages = ceil($total_rows / $limit); // 총 페이지 수 계산 (올림 처리)

        $conn->close(); // DB 연결 종료

        // 결과 데이터를 배열로 반환
        return [
            'notices' => $notices, // 조회된 게시물 목록
            'total_pages' => $total_pages, // 전체 페이지 개수
            'current_page' => $page // 현재 페이지 번호
        ];
    }

    /**
     * 특정 ID에 해당하는 공지사항을 가져오는 메서드
     *
     * @param int $notice_id 공지사항 ID
     * @param array|null 공지사항 데이터 또는 null (존재하지 않는 경우)
     */
    public static function getById($notice_id){
        $conn = connect_db(); // DB 연결

        // 공지사항 정보와 작성자 이름을 함께 조회하는 SQL 쿼리
        $sql = "SELECT n.*, u.name AS author_name FROM notices n
                JOIN users u ON n.author_id = u.id WHERE n.id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $notice_id); // 공지사항 ID를 바인딩
        $stmt->execute();
        $result = $stmt->get_result();
        $notice = $result->fetch_assoc(); // 결과를 배열로 가져옴

        $stmt->close(); // 쿼리 종료
        $conn->close(); // DB 연겨 종료
        return $notice;
    }
}
?>