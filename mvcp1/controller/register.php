<?php
require_once '../config/config.php'; // 데이터베이스 연결 파일
require_once '../model/User.php'; // User 모델 포함

// 요청 메서드가 POST인지 확인인
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 사용자로부터 입력 받은 데이터 가져오기
    $student_id = $_POST['student_id']; // 학번
    $name = $_POST['name'];             // 이름
    $email = $_POST['email'];           // 이메일
    $password = $_POST['password'];     // 비밀번호
    $confirm_password = $_POST['confirm_password']; // 비밀번호 확인

    // 비밀번호와 비밀번호 확인 값이 일치하는지 확인
    if ($password !== $confirm_password) {
        die("비밀번호가 일치하지 않습니다."); // 에러 메세지 출력
    }

    // User 모델의 register 함수 호출 (회원가입 처리)
    if (User::register($student_id, $name, $email, $password)) {
        echo "회원가입이 완료되었습니다."; // 회원가입 성공 메시지
    } else {
        echo "회원가입에 실패했습니다"; // 회원가입 실패 메시지
    }
}
?>