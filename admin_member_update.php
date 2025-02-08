<?php
    // 세션 시작 
    session_start();

    // 세션에서 사용자 역할(role) 값 가져오기 (관리자인지 확인)
    if (isset($_SESSION["role"])) $role = $_SESSION["role"];
    else $role = ""; // 없으면 빈 값 설정

    // 현재 사용자가 관리자가 아닌 경우 접근 차단
    if ($role !== 1) {
        echo ("
            <script>
                alert('관리자가 아닙니다! 회원 정보 수정은 관리자만 가능합니다!');
                history.go(-1)
            </script>
        ");
        exit; // 코드 실행 중단
    }

    // GET 방식으로 전달된 회원 번호(num) 가져오기
    $num = $_GET["num"];

    // POST 방식으로 전달된 새로운 role 값 가져오기
    $role = $_POST["role"];
    
    // MySQL 데이터베이스 연결결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    
    // 회원 정보(권한 role) 업데이트 SQL 실행
    $sql = "update members set role=$role where num=$num";
    mysqli_query($con, $sql); // SQL 실행

    // DB 연결 종료
    mysqli_close($con);

    // 관리자 페이지로 이동
    echo "
        <script>
            location.href = 'admin.php';
        </script>
    ";
?>