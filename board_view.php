<sectron>
    <div id="board_box">
        <h3 class="title">게시판 > 내용 보기</h3>
        <?php
            //GET 방식으로 전달된 게시글 번호(num)와 현재 페이지 번호(page)를 가져옴
            $num = isset($_GET["num"]) ? intval($_GET["num"]) : 0;
            $page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;

            $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
            // 특정 게시글 (num에 해당하는 글) 조회
            $sql = "select * from board where num = $num";
            $result = mysqli_query($con, $sql);
            $row = mysqli_fetch_array($result);

            // 게시글 데이터 가져오기
            $id = $row["id"]; // 작성자 ID
            $name = $row["name"]; // 작성자 이름
            $regist_day = $row["regist_day"]; // 등록 날짜
            $subject = $row["subject"]; // 글 제목
            $content = $row["content"]; // 글 내용
            $file_name = $row["file_name"]; // 업로드된 파일 이름
            $file_type = $row["file_type"];  // 업로드된 파일 타입
            $file_copied = $row["file_copied"]; // 서버에 저장된 파일명
            $hit = $row["hit"]; // 조회수

            // 글 내용에서 공백과 줄바꿈 처리
            $content = str_replace(" ", "&nbsp;", $content);
            $content = str_replace("\n", "<br>", $content);

            // 조회수 증가 (현재 조회수 + 1)
            $new_hit = $hit + 1;
            $sql = "update board set hit = $new_hit where id = $id";
            mysqli_query($con, $sql);
        ?>
            <ul id="view_content">
                <li>
                    <span class="col1"><b>제목 :</b> <?=$subject?></span>
                    <span class="col2"><?=$name?> | <?=$regist_day?></span>
                </li>
            <li>
        <?php
            // 첨부 파일이 있는 경우 다운로드 링크 표시
            if ($file_name) {
                $real_name = $file_copied;
                $file_path = "./data/" . $real_name;
                $file_size = filesize($file_path); // 파일 크기 계싼
                echo "-> 첨부파일 : $file_name ($file_size Byte) &nbsp;&nbsp;&nbsp;&nbsp;
                    <a href='board_download.php?num=$num&
                    real_name=$real_name&
                    file_name=$file_name&
                    file_type=$file_type'>[저장]</a><br><br>";
            }
        ?>
            <?=$content?> <!-- 게시글 본문 출력 -->
            </li>
            </ul>
            <!-- 버튼 영역 (목록, 수정, 삭제, 글쓰기 -->
            <ul class="buttons">
                <li><button onclick="location.href='board_list.php?page=<?=$page?>'">목록</button></li>
                <li><button onclick="location.href='board_modify.php?num=<?=$num?>&page=<?=$page?>'">수정</button></li>
                <li><button onclick="location.href='board_delete.php?num=<?=$num?>&page=<?=$page?>'">삭제</button></li>
                <li><button onclick="location.href='board_form.php">글쓰기</button></li>
            </ul>
    </div>
</sectron>

<!-- 댓글 입력 폼 -->
<form action="comment_insert.php" method="post">
    <input type="hidden" name="board_id" value="<?=$num?>"> <!-- 현재 게시글 ID -->
    <input type="hidden" name="parent_id" value=""> <!-- 최상위 댓글 (대댓글이 아니면 빈값) -->
    <textarea name="content" cols="30" rows="10" required placeholder="댓글을 입력하세요"></textarea>
    <button type="submit">댓글 작성</button>
</form>

<!-- 기존 댓글 목록 표시 -->
<ul>
    <?php
        // 현재 게시글에 해당하는 댓글 목록 조회 (최상위 댓글 -> 대댓글 순서로 정렬)
        $sql = "SELECT * FROM comments WHERE board_id = $num ORDER BY parent_id ASC, created_at ASC";
        $result = mysqli_query($con, $sql);

        // 댓글 목록 출력
        while ($row = mysqli_fetch_array($result)) {
            $comment_id = $row["id"]; // 댓글 ID
            $parent_id = $row["parent_id"]; // 부모 댓글 ID (NULL이면 최상위 댓글)
            $username = $row["username"]; // 작성자 이름
            $content = $row["content"]; // 댓글 내용
            $created_at = $row["created_at"]; // 작성 날짜

            // 댓글 출력
            echo "<li>";
            if ($parent_id) {
                echo"└"; // 대댓글이면 들여쓰기 표시
            }
            echo "<b>$username</b>: $content <small>($created_at)</small>";

            // 대댓글 입력 폼 (각 댓글 아래에 위치)
            echo "<form action='comment_insert.php' method='post' style='display:inline;'>
                    <input type='hidden' name='board_id' value='$num'>
                    <input type='hidden' name='parent_id' value='$comment_id'>
                    <input type='text' name='content' required placeholder='답글 입력'>
                    <button type='submit'>답글</button>
                  </form>";
            echo "</li>";
        }
    ?>
</ul>