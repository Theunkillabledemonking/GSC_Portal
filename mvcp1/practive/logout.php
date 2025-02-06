<?php
session_start();
session_unset();   // 모든 세션 삭제
session_destroy(); // 세션 종료

header("Location: ./login_form.html"); // 로그인 페이지로 이동
exit;
?>