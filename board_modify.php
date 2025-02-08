<?php
    // GET 매개변수로 전달된 게시글 번호(num)와 페이지 번호(page) 가져오기
    $num = $_GET["num"]; // 게시글 번호
    $page = $_GET["page"]; // 현재 페이지 번호

    // POST 매개 변수로 전달된 제목(subject)과 내용(content) 가져오기
    $subject = $_POST["subject"]; // 수정된 제목
    $content = $_POST["content"]; // 수정된 내용

    // MySQL 데이터베이스 연결 
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    
    // SQL 쿼리: 게시글 수정 (게시물 제목, 내용 -> 특정 게시글 번호에 대해 수정)
    $sql = "update board set subject='$subject', content='$content'
             where num=$num";
    
    // SQL 쿼리 실행
    mysqli_query($con, $sql);

    // SQL 종료
    mysqli_close($con);

    // 수정 후 게시글 목록 페이지로 리다이렉트트
    echo "
        <script>
            location.href = 'board_list.php?page=$page'; // 현재 페이지 유지지
        </script>
        ";
?>