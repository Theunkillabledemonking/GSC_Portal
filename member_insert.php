<?php
    $id = $_POST["id"];
    $pass = $_POST["pass"];
    $name = $_POST["name"];
    $email1 = $_POST["email1"];
    $email2 = $_POST["email2"];

    $email = $email1 . "@" . $email2;

    $role = 3;

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if (!$con) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    $sql = "insert into members (id, pass, name, email, role) 
            values ('$id', '$pass', '$name', '$email', '$role')";
    if (!mysqli_query($con, $sql)) {
        die("Error inserting data: " . mysqli_error($con));
    }

    mysqli_query($con, $sql);
    mysqli_close($con);

    echo "
        <script>
            alert('회원가입이 완료되었습니다.');
            location.href = 'http://210.101.236.159/gscconnect/index.php';
        </script>
        ";
    ?>