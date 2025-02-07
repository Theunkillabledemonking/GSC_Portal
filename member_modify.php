<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    // GET 요청에서 사용자 ID 가져오기
    $id = $_GET['id'];

    // POST 요청에서 폼 데이터 가져오기
    $pass = password_hash($_POST["pass"], PASSWORD_DEFAULT);
    $role = (int)$_POST["role"];

    // 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Connection failed: " . mysqli_connect_error());
    }

    // 데이터베이스 업데이트 쿼리 실행
    $sql = "UPDATE members SET pass='$pass', role='$role' WHERE id='$id'";
    echo "id 값 확인: $id";
    if (mysqli_query($con, $sql)) {
        // 수정 성공 시 리디렉션
        echo "업데이트 성공!";
        header("Location: index.php");
    } else {
        // 오류 출력
        echo "Error updating record: " . mysqli_error($con);
    }

    mysqli_close($con);

    ?>