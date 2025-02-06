<?php
require_once '../config/config.php'; // 데이터베이스 연결 설정 포함

class User {
    // 회원가입 처리 함수
    public static function register($student_id, $name, $email, $password) {
        $conn = connect_db(); // 데이터베이스 연결
        $hashed_password = password_hash($password, PASSWORD_DEFAULT); // 비밀번호 해싱

        // 사용자 데이터 삽입 쿼리
        $sql = "INSERT INTO users (student_id, name, email, password) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $student_id, $name, $email, $hashed_password);

        // 쿼리 실행 및 결과 반환
        if ($stmt->execute()) {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료
            return true; // 성공
        } else {
            $stmt->close(); // 쿼리 종료
            $conn->close(); // 데이터베이스 연결 종료료
            return false; // 실패
        }
    }

    // 사용자 인증 (로그인) 처리 함수
    public static function getUserById($student_id) {
        $conn = connect_db(); // 데이터베이스 연결

        // 학번으로 사용자 정보 조회
        $sql = "SELECT id, student_id, name, role, password FROM users WHERE student_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $student_id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $user = $result->fetch_assoc(); // 연관 배열로 사용자 정보 가져오기

        $stmt->close();
        $conn->close();

        return $user; // 사용자 정보 배열 반환
    }
}
?>