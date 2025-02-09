<?php
    // 세션 시작 
    session_start();

    // 세션에서 사용자 역할(role) 값 가져오기 (관리자인지 확인)
    $role = isset($_SESSION["role"]) ? intval($_SESSION["role"]) : null;

    // 현재 사용자가 관리자가 아닌 경우 접근 차단
    if (intval($role) !== 1) {
        echo ("
            <script>
                alert('관리자가 아닙니다! 회원 정보 수정은 관리자만 가능합니다!');
                history.go(-1)
            </script>
        ");
        exit; // 코드 실행 중단
    }

    // GET 방식으로 전달된 회원 번호(id) 가져오기
    if (isset($_GET['id']) && !empty(trim($_GET['id']))) {
        $id = intval($_GET['id']); // ID를 숫자로 변환하여 보안 강화
    } else {
        echo "
            <script>
                alert('잘못된 요청입니다. 회원 번호가 없습니다.');
                history.go(-1);
            </script>
        ";
        exit;
    }
    ?>
    // MySQL 데이터베이스 연결결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    // 회원 정보(권한 role) 업데이트 SQL 실행
    $sql = "update members set role = ? where id = ?";
    $stmt = mysqli_prepare($con, $sql);
    mysqli_stmt_bind_param($stmt, "ii", $role, $id);

    if (mysqli_stmt_execute($stmt)) {
        echo ("
        <script>
            alert('회원 정보가 성곡적으로 수정되었습니다.');
            location.href = 'admin.php';
        </script>");
    }else {
        echo "
        <script>
            alert('회원 정보 수정 중 오류가 발생했습니다: " . mysqli_error($con) . "');
            history.go(-1);
        </script>
    ";
    }

    // DB 연결 종료
    mysqli_stmt_close($stmt);
    mysqli_close($con);
