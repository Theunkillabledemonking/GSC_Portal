<?php
    $id = $_POST["id"];
    $pass = password_hash($_POST["pass"], PASSWORD_DEFAULT);
    $name = $_POST["name"];
    $email1 = $_POST["email1"];
    $email2 = $_POST["email2"];

    $email = $email1 . "@" . $email2;

    $role = 3;

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    // 중복된 ID 체크
    $check_sql = "SELECT id FROM members WHERE id = ?";
    $stmt = mysqli_stmt_init($con, $check_sql);
    mysqli_stmt_bind_parnm($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);

    if (mysqli_stmt_num_rows($stmt) > 0) {
        echo "<script>
                    alert('이미 존재하는 아이디입니다. 다른 아이디를 사용하세요.');
                    history.go(-1);
                  </script>";
        mysqli_stmt_close($stmt);
        mysqli_close($con);
        exit;
    }
    mysqli_stmt_close($stmt);

    // 회원 정보 삽입
    $insert_sql = "INSERT INTO members (id, pass, name, email, role) VALUES (?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($con, $insert_sql);
    mysqli_stmt_bind_param($stmt, "ssssi", $id, $pass, $name, $email, $role);

    if (mysqli_stmt_execute($stmt)) {
        echo "<script>
                    alert('회원가입이 완료되었습니다.');
                    location.href = 'index.php';
                  </script>";
    } else {
        echo "<script>
                    alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
                    history.go(-1);
                  </script>";
    }

    // 연결 종료
    mysqli_stmt_close($stmt);
    mysqli_close($con);
    exit;
    ?>