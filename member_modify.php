<?php
    $id = $_GET['id'];
    $pass = $_POST["pass"];
    $name = $_POST["name"];
    $role = $_POST["role"];

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Connection failed: " . mysqli_connect_error());
    }

    $sql = "UPDATE members SET pass='$pass', name='$name', role='$role' WHERE id='$id'";
    if (mysqli_query($con, $sql)) {
        // 수정 성공 시 리디렉션
        header("Location: index.php");
    } else {
        // 오류 출력
        echo "Error updating record: " . mysqli_error($con);
    }

    mysqli_close($con);

    ?>