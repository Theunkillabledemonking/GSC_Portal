<?php
    // 세션 시작 (로그인 상태 유지)
    session_start();

    // 세션에서 사용자 역할(role) 값 가져오기 (관리자인지 확인)
    if (isset($_SESSION["role"])) $role = $_SESSION["role"];
    else $role = "";

    // 현재 사용자가 관리자가 아닌 경우 접근 차단단
    if (intval($role) !== 1) {
        echo ("
            <script>
                alert('관리자가 아닙니데이! 회원 삭제는 관리자만 가능해요!');
                history.go(-1)
            </script>
            ");
            exit; // 이후 코드 실행 중단단
    }

    // 삭제할 게시글이 선택되었는지 확인
    if (isset($_POST["item"])) {
        $num_item = count($_POST["item"]); // 선택된 항목 개수
    } else {
        echo ("
            <script>
                alert('삭제할 게시글을 선택해주세요!');
                history.go(-1);
            </script>
        ");
    }

    // MySQL 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

    // 선택된 모든 게시글을 삭제하는 반복문 실행
    for ($i = 0; $i < count($_POST["item"]); $i++) {
        $num = $_POST["item"][$i]; // 선택된 게시글 번호 가져오기기

        // 삭제할 게시글의 정보 가져오기 (첨부 파일 확인을 위함)
        $sql = "select * from board where num = $num";
        $result = mysqli_query($con, $sql);
        $row = mysqli_fetch_array($result);

        // 파일 첨부 여부 확인
        $copied_name = $row["file_copied"];

        // 첨부 파일이 있으면 서버에서 삭제
        if ($copied_name) {
            $file_path = "./data/".$copied_name; // 파일 경로 설정
            if (file_exists($file_path)) { // 파일 존재 여부 확인
                unlink($file_path); // 파일 삭제
            }
        }

        // 게시글 삭제 쿼리 실행
        $sql = "delete from board where num = $num";
        mysqli_query($con, $sql);
    }

    // DB 종료료
    mysqli_close($con);

    echo ("
        <script>
            location.href = 'admin.php';
        </script>
    ");
?>