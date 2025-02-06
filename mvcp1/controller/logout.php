<?php
session_start();
session_unset(); // 모든 세션 변수 삭제
session_destroy(); // 세션 종료

http_response_code(200); // 성공 응답
header("Location: ../view/login_form.html"); // 로그인 페이지로 이동
exit;
?>