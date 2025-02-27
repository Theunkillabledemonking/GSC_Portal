<?php
    // 세션 시작 
    session_start();

    // 세션에서 사용자 역할(role) 값 가져오기 (관리자인지 확인)
    // 현재 사용자가 관리자가 아닌 경우 접근 차단
    if (!isset($_SESSION['role']) || intval($_SESSION['role']) !== 1) {
        echo "
            <script>
                alert('관리자가 아닙니다! 관리자만 접근 가능합니다.');
                history.go(-1);
            </script>";
        exit;
    }

    // GET 방식으로 전달된 회원 번호 확인
    if (!isset($_GET['id']) || empty(trim($_GET['id']))) {
        echo "
            <script>
                alert('잘못된 요청입니다. 회원 번호가 없습니다.');
                history.go(-1);
            </script>";
        exit;
    }
    $id = intval($_GET['id']);

    // POST 방식으로 전달된 role 값 확인
    $role = isset($_POST['role']) ? intval($_POST['role']) : null;
    if ($role === null) {
        echo "
            <script>
                alert('역할(role) 값이 없습니다.');
                history.go(-1);
            </script>";
        exit;
    }

    // MySQL 데이터베이스 연결결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    // 기존 값 확인
    $sql_check = "SELECT role FROM members WHERE id = ?";
    $stmt_check = mysqli_prepare($con, $sql_check);
    mysqli_stmt_bind_param($stmt_check, "i", $id);
    mysqli_stmt_execute($stmt_check);
    mysqli_stmt_bind_result($stmt_check, $existing_role);
    mysqli_stmt_fetch($stmt_check);
    mysqli_stmt_close($stmt_check);

    if ($existing_role === $role) {
        echo "
        <script>
            alert('새로운 역할 값이 기존 값과 동일합니다. 업데이트를 수행하지 않았습니다.');
            location.href = 'admin.php';
        </script>";
        exit;
    }

    // 업데이트 실행
    $sql = "UPDATE members SET role = ? WHERE id = ?";
    $stmt = mysqli_prepare($con, $sql);
    mysqli_stmt_bind_param($stmt, "ii", $role, $id);

    if (mysqli_stmt_execute($stmt)) {
        $affected_rows = mysqli_stmt_affected_rows($stmt);
        if ($affected_rows > 0) {
            echo "
            <script>
                alert('회원 정보가 성공적으로 수정되었습니다.');
                location.href = 'admin.php';
            </script>";
        } else {
            echo "
            <script>
                alert('회원 정보 수정에 변경된 내용이 없습니다.');
                location.href = 'admin.php';
            </script>";
        }
    } else {
        echo "
        <script>
            alert('회원 정보 수정 중 오류가 발생했습니다: " . mysqli_error($con) . "');
            history.go(-1);
        </script>";
    }

    mysqli_stmt_close($stmt);
    mysqli_close($con);
    ?>