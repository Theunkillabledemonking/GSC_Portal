
<?php
    echo "디버깅 시작";
    session_start();

    $userid = isset($_SESSION['userid']) ? $_SESSION['userid'] : "";
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : "";
    $role = isset($_SESSION['role']) ? $_SESSION['role'] : "";

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    if(!$con) {
        die("DB 연결 실패: " . mysqli_connect_error());
    }

    $sql = "select * from members where id='$userid'";
    $result = mysqli_query($con, $sql);

    if ($result) {
        $row = mysqli_fetch_array($result);

        $pass = $row["pass"];
        $name = $row["name"];
        $role = $row["role"];
        echo "데이터베이스에서 데이터 가져오기 성공!";
    } else {
        echo "데이터베이스 쿼리 실패:" . mysqli_error($con);
    }


    mysqli_close($con);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>회원 정보 수정</title>
    <script type="text/javascript" src="./js/member_form.js"></script>
</head>
<body>
<section>
    <div id="main_img_bar"></div>
    <div id="main_content">
        <div id="join_box">
            <form name="member_form" method="post" action="member_modify.php?id=<?=htmlspecialchars($userid)?>">
                <h2>회원 정보 수정</h2>

                <!-- 아이디 -->
                <div class="form id">
                    <div>아이디</div>
                    <div><?= htmlspecialchars($userid, ENT_QUOTES, 'UTF-8')?></div>
                </div>

                <!-- 비밀번호 -->
                <div class="form">
                    <div>비밀번호</div>
                    <div><input type="password" name="pass" id="pass" value="<?=htmlspecialchars($pass, ENT_QUOTES, 'UTF-8')?>"></div>
                </div>

                <!-- 비밀번호 확인 -->
                <div class="form">
                    <div>비밀번호 확인</div>
                    <div><input type="password" name="pass_confirm" value="<?=htmlspecialchars($pass, ENT_QUOTES, 'UTF-8') ?>"></div>
                </div>

                <!-- 권한 수정 -->
                <div class="form">
                    <div>권한 수정</div>
                    <div>
                        <select name="role">
                            <option value="1" <?=$role == 1 ? "selected" : ""?>>관리자</option>
                            <option value="2" <?=$role == 2 ? "selected" : ""?>>교수</option>
                            <option value="3" <?=$role == 3 ? "selected" : ""?>>학생</option>
                        </select>
                    </div>
                </div>
                <!-- 버튼 -->
            <button type="button" onclick="check_input()">수정하기</button>
                <button type="button" onclick="reset_form()">초기화</button>
            </form>
        </div>
    </div>
</section>

</body>
</html>

