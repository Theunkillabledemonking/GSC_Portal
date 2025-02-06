<?php
// notices_controller.php

// DB 연결 (PDO 예시)
require_once '../config/config.php'; // $pdo 객체 등
header('Content-Type: application/json');

// 어떤 액션인지 구분. "search"가 오면 검색 로직
$action = $_GET['action'] ?? '';

if ($action === 'search') {
    // 검색어와 옵션, 페이지 파라미터 받기
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $option = isset($_GET['option']) ? $_GET['option'] : 'title'; // 기본값 'title'
    $page   = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit  = 10; // 한 페이지에 보여줄 개수
    $offset = ($page - 1) * $limit;

    // 검색어에 %문자 추가
    $searchTerm = "%{$search}%";

    // option에 따라 쿼리 다르게 작성
    if ($option === 'author') {
        $sql = "SELECT * FROM notices WHERE author_name LIKE :search ORDER BY id DESC LIMIT :offset, :limit";
    } else {
        // 기본 title 검색
        $sql = "SELECT * FROM notices WHERE title LIKE :search ORDER BY id DESC LIMIT :offset, :limit";
    }

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':search', $searchTerm, PDO::PARAM_STR);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $notices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 전체 개수(페이지네이션용)
        $countSql = "SELECT COUNT(*) FROM notices 
                     WHERE ".($option === 'author' ? "author_name" : "title")." LIKE :search";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->bindValue(':search', $searchTerm, PDO::PARAM_STR);
        $countStmt->execute();
        $totalCount = (int) $countStmt->fetchColumn();

        // JSON 형태로 응답
        echo json_encode([
            "notices" => $notices,
            "current_page" => $page,
            "total_pages"  => ceil($totalCount / $limit)
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 3. 공지사항 삭제 요청 (`action=delete$id=숫자`)
if ($action == 'delete' && isset($_GET['id'])) {

    $user_role = $_SESSION['role'] ?? 'student'; // 사용자 역할
    $user_id = $_SESSION['user_id'] ?? null; // 로그인된 사용자 ID

    $notice_id = (int)$_GET['id']; // 삭제할 공지사항 ID 가져오기

    // 삭제 권한 확인 (관리자는 모든 글 삭제 가능, 교수는 본인 글만 삭제 가능)
    if ($user_role == 'admin' || ($user_role == 'professor' && Notice::getAuthorID($notice_id) == $user_id)) {
        if (Notice::delete($notice_id, $user_role, $user_id)) {
            echo json_encode(['success' => true]); //성공 응답
        } else {
            http_response_code(403); // 권한 없음
            echo json_encode(['error' => '삭제 실패 또는 권한이 없음']);
        }
    } else {
        http_response_code(403); // 권한 없음
        echo json_encode(["error" => "권한이 없습니다."]);
    }
    exit;
}
// ❌ 잘못된 요청 처리
http_response_code(400);
echo json_encode(["error" => "잘못된 요청입니다."]);
?>