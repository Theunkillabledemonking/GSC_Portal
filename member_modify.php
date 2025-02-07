<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// GET으로 id 받기
$id = $_GET['id'];

// POST로 pass, role 받기
$pass = password_hash($_POST["pass"], PASSWORD_DEFAULT);
$role = (int)$_POST["role"];

// DB 연결
$con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
}

// 업데이트
$sql = "UPDATE members SET pass='$pass', role='$role' WHERE id='$id'";
echo "id 값 확인: $id<br>";
if (mysqli_query($con, $sql)) {
    echo "업데이트 성공!<br>";
    header("Location: index.php");
    exit; // 헤더 후에는 exit 권장
} else {
    echo "Error updating record: " . mysqli_error($con);
}

mysqli_close($con);
?>