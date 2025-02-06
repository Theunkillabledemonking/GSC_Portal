<?php
    session_start();
    if (isset($_SESSION['userid'])) $userid = $_SESSION['userid'];
    else $user_id = "";
    if (isset($_SESSION['username'])) $username = $_SESSION['username'];
    else $username = "";
    if (isset($_SESSION['role'])) $role = $_SESSION['role'];
    else $role = "";
?>
<div id="top">
    <h3>
        <a href="index.php">PHP 프로그래밍 입문</a>
    </h3>
    <ul id="top_menu">
        <?php
        if (!$userid) {

        ?>
        <li><a href="member_form.php">회원 가입</a></li>
        <li><a href="login_form.php">로그인</a></li>
        <?php
        } else {
            $logged = $username."(".$userid.")님[권한:".$role."]";
        ?>
        <li><?=$logged?></li>
        <li> | </li>
        <li><a href="logout.php">로그아웃</a></li>
        <li> | </li>
        <li><a href="member_modify_form.php">사용자 수정</a></li>
        <?php
            }
        ?>
        <?php
            if ($role === 1) {
                ?>
        <li> | </li>
        <li><a href="admin.php">관리자 모드</a></li>
            }
        <?php
            }
        ?>
    </ul>
</div>
    <div id="menu_bar">
        <ul>
            <li><a href="index.php">HOME</a></li>
            <li><a href="board_form.php">게시판 만들기</a></li>
            <li><a href="index.php">사이트 완성</a></li>
        </ul>
    </div>

