<?php
    $id = $_POST["id"];
    $pass = $_POST["pass"];

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal;");
    $sql = "select * from users where id ='id'";
    $result = mysqli_query($con, $sql);

    $num_math = mysqli_num_rows($result);

    if (!$num_math) {
        echo("<script>
                window.alert('등록되지 않은 아이디입니다!')
                history.go(-1);
              </script>");
    } else {
        $row = mysqli_fetch_array($result);
        $db_pass = $row["pass"];

        mysqli_close($con);

        if ($pass != $db_pass) {
            echo("<script>
                    window.alert('비밀번호가 틀립니다!')
                    history.go(-1);
                  </script>");
            exit;
        }
        else {
            session_start();
            $_SESSION["userid"] = $row["id"];
            $_SESSION["username"] = $row["name"];
            $_SESSION["role"] = $row["role"];

            echo("<script>
                    location.href = 'index.php';
                  </script>");
        }
    }
    ?>