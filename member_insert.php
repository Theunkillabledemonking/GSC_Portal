<?php
    $id = $_POST["id"];
    $pass = $_POST["pass"];
    $name = $_POST["name"];
    $email1 = $_POST["email1"];
    $email2 = $_POST["email2"];

    $email = $email1 . "@" . $email2;

    $role = 3;

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

    $sql = "insert into members (id, pass, name, email, role)";
    $sql = "values ('$id', '$pass', '$name', '$email', '$role')";

    mysqli_query($con, $sql);
    mysqli_close($con);

    echo "
        <script>
            location.href = 'index.php';
        </script>
        ";
    ?>