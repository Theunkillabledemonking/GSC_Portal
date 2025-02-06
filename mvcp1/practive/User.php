<?php
// ===============================
// 데이터베이스 연결 설정 포함
// ===============================

// 데이터베이스 연결 설정 불러오기
require_once './config.php';

// ===============================
//  User 클래스 정의 (회원관련 기능 담당)
// ===============================
Class User {
    // ===============================
    //  회원가입 처리 함수
    // ===============================
    public static function register($student_id, $name, $email, $password) {
            
    // 데이터베이스 연결
    $conn = connect_db();
    // 비밀번호 암호화 (해쉬)
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // 사용자 데이터를 데이터베이스에 삽입하는 SQL 쿼리ㅣ
    $sql = "INSERT INTO users (student_id, name, email, password) VALUES (?, ?, ?, ?)";

    // SQL 실행 문을 위한 준비
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $student_id, $name, $email, $hashed_password);
    
    // ===============================
    // SQL 실행 및 결과 확인
    // ===============================
    if ($stmt->execute()) {
        // SQL 실행이 성공했으므로 쿼리 종료
        // 데이터베이스 연결 종료
        // 회원가입 성공
        $stmt->close();
        $conn->close();
        return true;
    } else {
        // 쿼리종료
        // 데이터베이스 연결 종료
        // 회원가입 실패
        $stmt->close();
        $conn->close();
        return false;
        }
    }

    // 학번으로 사용자 정보 조회
    public static function getUserByID($student_id) {
        //  데이터 베이스 연결
        $conn = db_connect();
        // 사용자 데이터를 찾는 SQL 쿼리
        $sql = "SELECT * FROM users WHERE student_id = ?";
        // SQL 실행 문을 위한 준비
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $student_id);
        $stmt->execute();
        
        // 연관 배열 데이터 가져오기
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        // 쿼리 & SQL 종료료
        $stmt->close();
        $conn-> close();

        return $user; // 사용자 정보 배열 반환
    }
}

?>
    