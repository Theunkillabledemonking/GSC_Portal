<?php
session_start(); // 세션 시작

// 로그인 여부 확인
if (!isset($_SESSION['userid'])) { // 로그인 상태인지 확인
    echo "<script>alert('로그인 후 댓글을 작성할 수 있습니다.'); history.go(-1);</script>";
    // 알림창 띄우고 이전 페이지로 이동
    exit; // 이후 코드 실행 중단
}

// POST 데이터 받기 (`intval()` 사용하여 정수 변환)
$board_id = intval($_POST['board_id']); // 댓글이 달릴 게시글 ID
$parent_id = isset($_POST['parent_id']) && !empty($_POST['parent_id']) ? intval($_POST['parent_id']) : NULL; //부모 댓글 ID
$content = trim($_POST['content']); // 입력된 댓글 내용 (앞뒤 공백 제거)
$user_id = $_SESSION['userid']; // 세션에서 로그인한 사용자 ID 가져오기
$username = $_SESSION['username']; // 세션에서 로그인한 사용자 이름 가져오기

// DB 연결
$con = mysqli_connect('localhost', 'root', 'gsc1234!@#$', 'school_portal');

if ($parent_id !== NULL) {
    $stmt = $con->prepare("SELECT COUNT(*) FROM comments WHERE id = ?");
    $stmt->bind_param('i', $parent_id);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count === 0) {
        echo "<script>alert('유효하지 않은 parent_id입니다.'); history.go(-1);</script>";
        exit;
    }
}

if (!$con) {
    die("데이터베이스 연결 실패: ".mysqli_connect_error()); // DB 연결 실패 시 에러 메시지 출력
}

// 댓글 저장 (Prepared Statement 사용하여 SQL Injection 방지)
$stmt = $con->prepare("INSERT INTO comments (board_id, parent_id, content, user_id, username) VALUES(?, ?, ?, ?, ?)");
$stmt->bind_param("iisss", $board_id, $parent_id, $content, $user_id, $username);
$stmt->execute();

// DB 연결 종료
$stmt->close();
mysqli_close($con);

// 게시물 상세 페이지로 이동
echo "<script>location.href='board_view.php?num=$board_id';</script>";
?>