
<?php
session_start(); // 세션 시작
// DB 연결
$con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

$scale = 10; // 한 페이지당 표시할 글 개수
// 현재 페이지 번호 가져오기 (GET)
$page = isset($_GET['page']) ? $_GET['page'] : 1;

// 1. 전체 게시글 수 계산
$sql = "select count(*) from board";
$result = mysqli_query($con, $sql);
$row = mysqli_fetch_array($result);
$total_records = $row[0];

// 2. 전체 페이지 수 ($total_page) 계산
$total_pages = ceil($total_records / $scale); // 전체 글 개수를 기준으로 페이지 수 계산

// 3. 현재 페이지의 시작 데이터 계산
$start = ($page - 1) * $scale;
$sql = "select * from board order by id desc limit $start, $scale";
$result = mysqli_query($con, $sql);
?>
<section>
    <div id="board_box">
        <h3>
            게시판 > 목록 보기
        </h3>
        <ul id="board_list">
            <li>
                <span>번호</span>
                <span>제목</span>
                <span>글쓴이</span>
                <span>첨부</span>
                <span>등록일</span>
                <span>조회</span>
            </li>
            <?php
            // 게시글 번호 계산
            $number = $total_records - $start;

            // 현재 페이지에서 출력할 게시글을 반복하여 가져오기
                while ($row = mysqli_fetch_array($result)) {

                    // 데이터 가져오기
                    $num = $row["num"]; // 글 번호
                    $id = $row["id"]; // 작성자 ID
                    $name = $row["name"]; // 작성자 이름
                    $subject = $row["subject"]; // 글 제목
                    $regist_day = $row["regist_day"]; // 작성 날짜
                    $hit = $row["hit"]; //조회수

                    // 첨부 파일이 있는 경우 썸네일 표시
                    if ($row["file_name"])
                        $file_image = "<img src='./img/file.git'>"; // 추후 이미지 썸네일
                    else
                        $file_image = "";

            ?>
                <li>
                    <span class="col1"><?=$number?></span> <!-- 게시물 번호 -->
                    <span class="col2">
                        <a href="./board_view.php?num=<?=$num?>$page=<?=$page?>"><?=$subject?></a>
                    </span> <!-- 제목 클릭 시 해당 글 보기 -->
                    <span class="col3"><?=$name?></span> <!-- 작성자 -->
                    <span class="col4"><?=$file_image?></span> <!-- 첨부 파일 여부 -->
                    <span class="col5"><?=$regist_day?></span> <!-- 등록일 -->
                    <span class="col6"><?=$hit?></span> <!-- 조회수 -->
                </li>
                <?php
                    $number--; // 다음 게시글 번호 감소
                    }
                mysqli_close($con); // 데이터베이스 연결 종료
                ?>
        </ul>

        <!-- 페이지네이션 (하단 페이지 번호) -->
        <ul id="page_num">
            <?php
            // 이전 페이지 버튼
            if ($total_pages >= 2 && $page >= 2) {
                $new_page = $page-1;
                echo "<li><a href='board_list.php?page=$new_page'><- 이전</a></li>";
            } else {
                echo "<li>&nbsp</li>";
            }

            // 페이지 번호 출력 (현제 페이지 bold 처리)
            for ($i = 1; $i <= $total_pages; $i++) {
                if ($page === $i) {
                    echo "<li><b> $i </b></li>";
                } else {
                    echo "<li><a href='board_list.php?page=$i'>$i</a></li>";
                }
            }

            // 다음 페이지 버튼
            if ($total_pages >= 2 && $page < $total_pages) {
                $new_page = $page+1;
                echo "<li><a href='board_list.php?page=$new_page'>다음 -></a></li>";
            } else {
                echo "<li>&nbsp</li>";
            }
            ?>
        </ul> <!-- 페이지네이션 끝 -->

        <!-- 글쓰기 버튼 -->
        <ul class="buttons">
            <li><button onclick="location.href='board_list.php'">목록</button></li>
            <li>
                <?php
                    // 로그인한 사용자만 글쓰기 가능
                if (isset($_SESSION['userid']) && $_SESSION['userid']) { // 세션에서 검증
                ?>
                        <button onclick="location.href='board_form.php'">글쓰기</button>
                <?php
                    } else { // 로그인하지 않은 경우 메시지 출력
                ?>
                        <a href="javascript:alert('로그인 후 이용해 주세요!')">
                            <button>글쓰기</button></a>
                <?php
                    }
                ?>
            </li> <!-- board box-->
        </ul>
    </div>
</section>