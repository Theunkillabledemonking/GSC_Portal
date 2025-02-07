<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ↓↓↓ 디버깅용 코드 추가 ↓↓↓
echo "<pre>";
echo "디버그: POST 데이터\n";
var_dump($_POST);
echo "\n디버그: GET 데이터\n";
var_dump($_GET);
echo "</pre>";
// ↑↑↑ 디버깅용 코드 ↑↑↑

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
    // ※ 주의: header 전에 echo를 하면 'headers already sent' 경고가 뜰 수 있음
    //header("Location: index.php");
    exit; // 헤더 후에는 exit 권장
} else {
    echo "Error updating record: " . mysqli_error($con);
}

mysqli_close($con);
?>