<?php
    $id = $_GET['id'];
    $pass = $_POST["pass"];
    $name = $_POST["name"];
    $role = $_POST["role"];

    $con = mysqli_connect("localhost","root","gsc1234!@#$", "school_portal");
    $sql = "update members set pass='$pass', name='$name', role='$role' where id=$id";

    mysqli_query($con, $sql);

    mysqli_close($con);

    header("location:index.php");
    ?>