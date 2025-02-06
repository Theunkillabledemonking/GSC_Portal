<?php
session_start();


// URL에서 noticeId 가져오기
$noticeId = isset($_GET['noticeId']) ? $_GET['noticeId'] : null;

// noticeId 값 확인
if (!$noticeId) {
    // noticeId가 없을 경우 index.html로 리다이렉트
    error_log("잘못된 접근: noticeId가 없습니다.");
    header("Location: login_form.html");
    exit;
}

// 세션 확인
if (!isset($_SESSION['user_id'])) {
    error_log("세션 없음: 잘못된 접근입니다.");
    header("Location: login_form.html");
    exit;
}

// 세션 디버깅 정보 출력
error_log("세션 있음: " . print_r($_SESSION, true));

// 이후 공지사항 처리 로직...
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>게시판</title>
    <script src="../js/notice.js" defer></script>
    <script src="../js/logout.js" defer></script>
</head>
<body>
<h1>공지사항</h1>
<!-- 로그아웃 버튼 -->
<button id="logoutBtn">로그아웃</button>
<button id="writeBtn" style="display: none;">글쓰기</button> <!-- 기본적으로 숨김 -->

<!-- 게시판 목록 -->
<div id="noticeList"></div>

<!-- 검색 폼-->
<select id="searchOption">
    <option value="title">제목</option>
    <option value="author">작성자</option>
</select>
<input type="text" id="searchInput" placeholder="검색어 입력">
<button id="searchBtn">검색</button>

<!-- 페이지네이션-->
<div id="pagination">
    <button id="prevPage">이전</button>
    <span id="pageInfo"></span>
    <button id="nextPage">다음</button>
</div>
</body>
</html>