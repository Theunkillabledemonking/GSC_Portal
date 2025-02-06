<?php

// 세션 시작 (세션이 없을 경우)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once '../model/User.php'; // User 모델 포함

header('Content-Type: application/json; charset=utf-8');

// 1. 로그인 요청 확인 (POST 방식인지 확인)
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // 사용자 입력 데이터 가져오기
    $student_id = trim($_POST['student_id']); // 학번
    $password = trim($_POST['password']); // 비밀번호

    // 2. 학번을 기반으로 사용자 정보 조회
    $user = User::getUserById($student_id);

    // 3. 사용자 정보가 존재하고 비밀번호가 일치하는지 확인
    if ($user && isset($user['password']) && password_verify($password, $user['password'])) {
        // 4. 보안 강화: 세션 ID 재생성 (세션 탈취 방지)
        session_regenerate_id(true);

        // 5. 세션에 사용자 정보 저장
        $_SESSION['user_id'] = $user['id']; // 사용자 ID
        $_SESSION['role'] = $user['role'];  // 사용자 역할
        $_SESSION['name'] = $user['name'];  // 사용자 이름

        // ✅ 디버깅 로그 추가
        error_log("Login Debug - user_id: " . $_SESSION['user_id']);

        // ✅ 로그인 성공 메시지 로그 기록
        error_log("로그인 성공: user_id=".$_SESSION['user_id'].", role=".$_SESSION['role']);

        // 6. JSON 응답 반환 (AJAX 요청을 고려)
        echo json_encode(["status" => "success", "redirect" => "../view/notice_list.php"]);
        exit;
    } else {
        // 7. 로그인 실패 처리
        error_log("로그인 실패 - student_id: $student_id");
        echo "<script>alert('학번 또는 비밀번호가 잘못되었습니다.'); window.history.back();</script>";
        exit;
    }
}
?>
