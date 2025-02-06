<?php
// 데이터 베이스 연결 설정

// 데이터베이스 접속 정보를 상수로 조회

// 데이터베이스 서버 주소
define('DB_HOST','localhost');
// 데이터베이스 사용자 이름
define('DB_USER','root');
// 데이터베이스 비밀번호
define('DB_PASSWORD', 'gsc1234!@#$');
// 사용할 데이터베이스 이름
define('DB_NAME','school_portal');

// 데이터베이스 연결 함수
function db_connect() {
        
    // mysqli 객체를 사용하여 데이터베이스에 연결
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    // 연결이 실패했을 경우 오류 메세지 출력 후 종료
    if ($conn->connect_error) {
        die("데이터베이스 연결 실패" . $conn->connect_error);
    }

    // 연결된 데이터베이스 객체 반환환  
    return $conn;
}

?>