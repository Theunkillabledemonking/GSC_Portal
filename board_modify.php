<?php
    // MySQL 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

    if(!$con) {
        die("데이터베이스 연결 실패: ". mysqli_connect_error());
    }
    // GET 매개변수로 전달된 게시글 번호(num)와 페이지 번호(page) 가져오기
    $num = isset($_POST["num"]) ? intval($_POST["num"]) : 0; // 게시글 번호
    $page = isset($_POST["page"]) ? intval($_POST["page"]) : 1; // 현재 페이지 번호

    // POST 매개 변수로 전달된 제목(subject)과 내용(content) 가져오기
    $subject = isset($_POST["subject"]) ? trim($_POST["subject"]) : ""; // 수정된 제목
    $content = isset($_POST["content"]) ? trim($_POST["content"]) : ""; // 수정된 내용

    if (empty($subject) || empty($content)) {
        echo "<script>alert('제목과 내용을 모두 입력해주세요'); history.go(-1);</script>";
    }

    if (!$con) {
        die("데이터베이스 연결 실패:" . mysqli_connect_error());
    }

    // SQL 쿼리: 게시글 수정 (게시물 제목, 내용 -> 특정 게시글 번호에 대해 수정)
    $stmt = $con -> prepare("UPDATE board SET subject = ?, content = ? WHERE num = ?");
    $stmt->bind_param("ssi", $subject, $content, $num);
    $stmt->execute();

    // 수정 후 list로 이동
    if ($stmt->affected_rows > 0) {
        echo "<script>location.href = 'board_list.php?page=$page';</script>";
    } else {
        echo "<script>alert('수정 실패. 다시 시도해주세요.'); history.go(-1);</script>";
    }
    $stmt->close();
