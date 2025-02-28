<script>
    function check_input() {
        // 제목이 입력되지 않은 경우 경고 메시지를 뛰우고 포커스를 이동
        if (!document.board_form.subject.value) {
            alert("제목을 입력하십시오");
            document.board_form.subject.focus();
            return;
        }

        // 내용이 입력되지 않은 경구 메시지를 뛰우고 포커스를 이동
        if (!document.board_form.subject.value) {// 기존 코드에서 subject를 중복 검사하는 오류
            alert("내용을 입력하십시오");
            document.board_form.subject.focus();
            return;
        }
        // 모든 입력 값이 올바르면 폼 제출
        document.board_form.submit();
    }
</script>

<section>
    <div id="board_box"></div> <!-- 게시판을 감싸는 컨테이너 -->
    <h3 id="board_title">
        게시판 > 글쓰기 <!-- 페이지 제목 -->
    </h3>
    <form name="board_form" method="post" action="board_insert.php"
        enctype="multipart/form-data"> <!-- 게시물 작성 폼, 파일 업로드 가능하도록 설정 -->
        <ul id="board_form">
            <li>
                <span class="col1">이름 : </span> <!-- 사용자 이름 표시 -->
                <span class="col2"><?=$username?></span> <!-- 서버에서 전달받은 사용자명 출력 -->
            </li>
            <li>
                <span class="col1">제목 : </span> <!-- 게시물 제목 입력 -->
                <span class="col2"><input name="subject" type="text"></span>
            </li>
            <li id="text_area">
                <span class="col1">내용 : </span> <!-- 게시물 내용 입력 -->
                <span class="col2">
                    <textarea name="content" id="content" cols="30" rows="10"></textarea>
                </span>
            </li>
            <li>
                <span class="col1"> 첨부 파일</span> <!-- 파일 업로드 입력 -->
                <span class="col2"><input type="file" name="upfile"></span>
            </li>
        </ul>
        <ul class="buttons"> <!-- 버튼 영역 -->
            <li><button type="button" onclick="check_input()">완료</button></li> <!-- 입력 겁증 -->
            <li><button type="button" onclick="location.href='board_list.php'">목록</button></li> <!-- 목록 페이지로 이동 -->
        </ul>
    </form>
</section>