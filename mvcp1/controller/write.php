<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// 세션 시작 (사용자의 로그인 정보를 유지하기 위함)
require_once '../model/Notice.php'; // Notice 클래스 포함 (공지사항 관련 데이터 처리)

// 관리자나 교수만 작성 가능
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'professor'])) {
    http_response_code(403); // 403 Forbidden (접근 권한 없음)
    echo json_encode(["status" => "error", "message" => "글 작성 권한이 없습니다."]);
    exit;
}
// 세션에서 데이터 가져오기 및 폼 데이터 검증
$title = isset($_POST['title']) ? trim($_POST['title']) : ''; // 제목
$content = isset($_POST['content']) ? trim($_POST['content']) : ''; // 내용
$author_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null; // 작성자 ID

error_log("Session Debug - user_id: " . ($_SESSION['user_id'] ?? 'NULL'));
error_log("Session Debug - role: " . ($_SESSION['role'] ?? 'NULL'));

if (empty($author_id)) {
    http_response_code(403);
    echo json_encode([
        "status" => "error",
        "message" => "작성자 정보가 유효하지 않습니다.",
        "debug" => $_SESSION // 디버깅용: 세션 정보 출력
    ]);
    exit;
}

// 제목과 내용 검증
if (empty($title) || empty($content)) {
    http_response_code(400); // 400 Bad Request *(잘못된 요청)
    echo json_encode(["status" => "error", "message" => "제목과 내용을 입력해야 합니다."]);
    exit;
}

// 작성자 ID 검증
if (empty($author_id)) {
    http_response_code(403); // 권한 없음
    echo json_encode(["status" => "error", "message" => "작성자 정보가 유효하지 않습니다."]);
    exit;
}

// 공지사항 작성
if (Notice::create($title, $content, $author_id)) {
    http_response_code(200); // 성공
    echo json_encode(["status" => "success", "message" => "공지사항이 작성되었습니다."]);
} else {
    http_response_code(500); // 서버 오류
    echo json_encode(["status" => "error", "message" => "공지사항 작성에 실패했습니다."]);
}