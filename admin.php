<?php
    // 회원 정보를 가져오는 sql 쿼리리
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
    $sql = "select * from members order by id desc";
    $result = mysqli_query($con, $sql);
    $total_record = mysqli_num_rows($result); // 전체 회원 수 가져오기

    $number = $total_record; // 역순으로 번호를 부여하기 위해 설정
?>

<section>
    <div id="admin_box">
        <h3 id="member_title">
            관리자 모드 > 사용자 관리
        </h3>
    </div>

    <!-- 사용자 리스트 출력 -->
    <ul id="member_list">
        <li>
            <span class="col1">번호</span>
            <span class="col2">아이디</span>
            <span class="col3">이름</span>
            <span class="col4">권한</span>
            <span class="col5">가입일</span>
            <span class="col6">수정</span>
            <span class="col7">삭제</span>
        </li>
        <?php
        // 사용자 리스트 출력
        while ($row = mysqli_fetch_array($result)) {
            $id = $row["id"]; // 회원 아이디
            $name = $row["name"]; // 회원 이름
            $role = $row["role"]; // 회원 역할 (관리자, 교수, 학생)
            $regist_day = $row["create_at"]; // 가입일
?>
        <li>
            <!-- 회원 수정 폼 (권한 변경 가능) -->
            <form method="post" action="admin_membre_update.php?id=
                    <?=$id?>">
                    <span class="col1"><?=$number?></span>
                    <span class="col2"><?=$id?></span>
                    <span class="col3"><?=$name?></span>
                    <span class="col4"><input type="text" name="role"
                            value="<?=$role?>"></span>
                    <span class="col5"><?=$regist_day?></span>
                    <span class="col6"><button type="submit">수정
                    </button></span>
                    <span class="col7"><button type="button"
                            onclick= "location.href='admin_member_delete.php?id=<?=$id?>'">삭제</button></span>
            </form>
        </li>

        <?php
            $number--; // 회원 번호 감소 (역순 정렬)
        }
        ?>
    </ul>
    <?php mysqli_close($con); ?>

    <!-- 게시판 관리 -->
    <h3 id="member_title">관리자 모드 > 게시판 관리</h3>
    <ul id="board_list">
        <li class="title">
            <span class="col1">선택</span>
            <span class="col2">번호</span>
            <span class="col3">이름</span>
            <span class="col4">제목</span>
            <span class="col5">첨부파일명</span>
            <span class="col6">작성일</span>
        </li>

        <!-- 게시글 삭제 폼 -->
        <form action="admin_board_delete.php" method="post">
        <?php
            // 게시판 데이터 가져오기
            $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
            if (!$con) {
                die("Database connection failed: " . mysqli_connect_error());
            }

            // 게시판 글 목록 가져오기기
            $sql = "select * from board order by num desc";
            $result = mysqli_query($con, $sql);
            $total_record = mysqli_num_rows($result); // 전체 글 수

            $number = $total_record; // 역순 번호 부여

            while ($row = mysqli_fetch_array($result)) {
               $num = $row["num"]; // 게시글 번호
               $name = $row["id"]; // 작성자 이름
               $subject = $row["subject"]; // 게시글 제목
               $file_name = $row["file_name"]; // 첨부 파일명
               $regist_day = $row["create_at"]; // 등록일
               $regist_day = substr($regist_day, 0, 10); // 등록일 앞 10자리 (YYYY-MM-DD)
            
        ?>
            <li>
                <!-- 복수 선택 가능 -->
                <span class="col1"><input type="checkbox" name="item[]"
                            value="<?=$num?>"></span>
                <span class="col2"><?=$number?></span>
                <span class="col3"><?=$name?></span>
                <span class="col4"><?=$subject?></span>
                <span class="col6"><?=$file_name?></span>
                <span class="Col7"><?=$regist_day?></span>
            </li>
    <?php
            $number--; // 번호 감소소
            }
            mysqli_close($con);
    ?>      
            <button type="submit">선택된 글 삭제</button> <!-- 선택된 글 삭제 버튼 -->
        </form>
    </ul>
</section>