<?php
    // 세션 시작
    session_start();

    // 세션에서 사용자 역할(role) 값 가져오기 (관리자인지 확인)
    if (isset($_SESSION["role"])) $role = $_SESSION["role"];
    else $role = "";

    // 현재 사용자가 관리자가 아닌 경우 접근 차단
    if (intval($role) !== 1) {
        echo ("
            <script>
            alert('관리자가 아닙니다! 회원 삭제는 관리자만 가능합니다!');
            history.go(-1)
            </script>    
        ");
        exit; // 이후 코드 실해 중단
    }

    // GET 방식으로 전달된 회원 번호(id) 가져오기
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = intval($_GET['id']); // 숫자로 변환하여 SQL 인젝션 방지
    } else {
        die("Invalid ID."); // ID가 없으면 종료
    }

    // Mysql 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    
    // 회원 삭제 SQL 실행 (지정된 num 값을 가진 회원 삭제)
    if (!$con) {
        die("Could not connect: " . mysqli_error($con));
    }

    $sql = "DELETE FROM members WHERE id = ?";
    $stmt = mysqli_prepare($con, $sql);
    mysqli_stmt_bind_param($stmt, "i", $id);

    if (mysqli_stmt_execute($stmt)) {
        echo "Member deleted successfully!";
        header("Location: admin.php");
    } else {
        echo "Error deleting record: " . mysqli_error($con);
    }

    // 데이터베이스 연결 종료
    mysqli_stmt_close($stmt);
    mysqli_close($con);
