<script>
    // 사용자가 제목과 내용을 입력했는지 확인하는 함수
    function check_input() {
        // 제목 입력 여부 확인
        if (!document.board_form.subject.value.trim()) {
            alert("제목을 입력하세요!"); // 제목 입력 요청 메시지
            document.board_form.subject.focus(); // 제목 입력 칸으로 포커스 이동
            return false; // 종료
        }

        // 내용 입력 여부 확인
        if (!document.board_form.content.value.trim()) {
            alert("내용을 입력하세요!"); // 내용 입력 요청 메시지지
            document.board_form.content.focus(); // 내용 입력 칸으로 포컷스 이동
            return false; // 함수 종료
        }
        // 제목과 내용이 모두 입력된 경우 폼 제출출
        document.board_form.submit();
    }
</script>

<section>
    <div id="board_box">
        <!-- 게시판 제목 -->
        <h3 id="board_title"> 게시판 > 글쓰기</h3>
    <?php
        // GET 매개변수로 전달된 글 번호(num)와 페이지 번호(page) 가져오기
        $num = isset($_GET["num"]) ? intval($_GET["num"]) : 0; // 글 번호
        $page = isset($_GET["page"]) ? intval($_GET["page"]) : 1; // 현재 페이지 번호

        if ($num === 0) {
            echo "<script>alert('유효하지 않은 접근입니다.'); history.go(-1);</script>";
            exit;
        }
        // db 연결
        $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
        
        // 글 번호(num)에 해당하는 게시물 데이터 가져오기
        $sql = "select * from board where num = ?";
        $stmt = $con->prepare($sql);
        $stmt->bind_param("i", $num);
        $stmt->execute();
        $result = $stmt->get_result();

        // 데이터 확인
        if ($result->num_rows === 0) {
            echo "<script>alert('존재하지 않는 게시물입니다.'); history.go(-1);</script>";
            exit;
        }


        // 게시글 데이터 배열로 가져오기
        $row = $result->fetch_assoc();
        // 게시글 데이터 변수에 저장
        $name = $row["name"]; // 작성자 이름
        $subject= $row["subject"]; // 게시글 제목
        $content = $row["content"]; // 게시글 내용
        $file_name = $row["file_name"]; // 첨부 파일
        $stmt->close();
        mysqli_close($con);
    ?>  
        <!-- 수정 폼 시작 -->
        <form name="board_form" method="post"
            action="board_modify.php"
            enctype="multipart/form-data"> <!-- 파일 업로드 허용하는 폼 설정 -->
            <input type="hidden" name="num" value="<?=$num?>"> <!-- 게시물 번호 유지 -->
            <input type="hidden" name="page" value="<?=$page?>"> <!-- 페이지 번호 유지 -->
            <input type="hidden" name="existing_file" value="<?=$file_name?>"> <!-- 기존 파일 유지 -->
            
            <!-- 게시글 수정 입력 폼 -->
            <ul id="board_form">
                <!-- 작성자 이름 -->
                <li>
                    <span class="col1">이름 : </span>
                    <span class="col2"><?=$name?></span>
                </li>
                <!-- 제목 입력 -->
                <li>
                    <span class="col1">제목 : </span>
                    <span class="col2"><input name="subject" type="text"
                        value="<?=htmlspecialchars($subject)?>"></span>
                </li>
                <!-- 내용 입력 -->
                <li id="text_area">
                    <span class="col1">내용 : </span>
                    <span class="col2">
                        <textarea name="content"><?=htmlspecialchars($content)?></textarea>
                    </span>
                </li>
                <!-- 첨부파일 관리 -->
                <li>
                    <span class="col1">첨부파일 : </span>
                    <span class="col2">
                        <?php if ($file_name): ?>
                            <!-- 기존 파일이 있으면 다운로드 링크 제공 -->
                            <a href="board_download.php?real_name=<?=$file_name?>"><?=$file_name?></a>
                            <input type="checkbox" name="delete_file" value="1"> 삭제
                        <?php else: ?>
                            (첨부파일 없음)
                        <?php endif; ?>
                        <br>
                        <!-- 새파일 업로드 옵션 -->
                        <input type="file" name="upfile">
                    </span>
                </li>
            </ul>
                <!-- 수정 버튼 및 목록 버튼 -->
                <ul class="buttons">
                    <li>
                        <!-- 수정 확인 후 제출 -->
                        <button type="button" onclick="check_input()">수정하기</button>
                    </li>
                    <li>
                        <!-- 목록으로 이동 -->
                        <button type="button" onclick="location.href='board_list.php'">목록</button>
                    </li>
                </ul>
        </form>
    </div>
</section>