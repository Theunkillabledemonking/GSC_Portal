<?php
    $id = $_GET['id'];

    $pass = $_POST["pass"];
    $name = $_POST["name"];
    $email1 = $_POST["email1"];
    $email2 = $_POST["email2"];

    $eamil = $email1."@".$email2;

    $con = mysqli_connect("localhost","root","gsc1234!@#$", "school_portal");
    $sql = "update members set pass='$pass', name='$name', eamil='$eamil'";
    $sql.= " where id = '$id'";
    mysqli_query($con, $sql);

    mysqli_close($con);

    header("location:index.php");
    ?>