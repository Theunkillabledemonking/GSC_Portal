<?php
require_once './User.php';
require_once './config.php';
session_start();

// 1. 로그인 요청 확인
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $student_id = $_POST['student_id'];
    $password = $_POST['password'];
    
    // 2. DB에서 사용자 정보 조회
    $user = User::getUserByID($student_id);

    // 3. 비밀번호 검증 및 로그인 처리
    if ($user && password_verify($password, $user['password'])) {
        // 학번 저장
        $_SESSION['student_id'] = $user['student_id'];
        // 사용자 이름 저장
        $_SESSION['user_name'] = $user['name'];
        // 사용자 권한 저장
        $_SESSION['role'] = $user['role'];

        // 역할에 따라 다른 페이지로 이동
        if ($user['role'] === 'admin') {
            header("Location: ./admin_dashboard.php");
        } else {
            header("Location: ./user_dashboard.php");
        }
        exit;
        // 관리자 & 교수 페이지로 이동

        // 일반 사용자 페이지 이동

    } else {
        echo "<script>alert('학번 또는 비밀번호가 잘못되었습니다.'); window.history.back();</script>";
    }
        
}
?>