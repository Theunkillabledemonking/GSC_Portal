<?php
    $num = isset($_GET["num"]) ? intval($_GET['num']) : 0; // 삭제할 게시글의 고유 버호호
    $page = $_GET["page"]; // 삭제 후돌아갈 페이지 번호

    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    $sql = "select * from board where num = $num"; // 삭제 대상 게시글을 가져오는 SQL 쿼리
    $result = mysqli_query($con, $sql); // 쿼리 실행
    $row = mysqli_fetch_array($result); // 결과를 연관 배열 형태로 가져오기
    $copied_name = $row["file_copied"]; // 서버에 저장된 첨부 파일명 가져오기

    if ($copied_name) { // 첨부 파일이 있는 경우 실행행
        $file_path = "./data/".$copied_name; // 첨부 파일 경로 설정
        unlink($file_path); // 파일 삭제제
    }

    $sql_delete = "delete from board where num = $num"; // 게시글 삭제 SQL 쿼리
    if (mysqli_query($con, $sql_delete)) {
        echo "<script>alert('게시글이 삭제되었습니다.'); location.href='board_list.php';</script>";
    } else {
        echo "<script>alert('게시글 삭제에 실패했습니다.'); history.go(-1);</script>";
    }    
    mysqli_close($con); // DB 연결 종료료
    ?>