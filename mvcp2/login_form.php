<script type="text/javascript" src="./js/login.js"></script>

<div id="login_box">
    <!-- 로그인 상단 제목 영역 -->
    <div id="login_title">
        <span>로그인</span>
    </div>

    <!-- 로그인 폼 영역 -->
    <div id="login_form">
        <!-- 로그인 폼: name 속성을 통해 자바스크립트에서 참조하기 편리함 -->
        <form name="login_form" method="post" action="login.php">
            <ul> <!-- 순서 없는 리스트 -->
                <!-- 리스트 항목: 아이디 입력 -->
                <li><input type="text" name="id" placeholder="아이디"></li> <!-- input 요소에 name="id" 추가 -->
                <!-- 리스트 항목: 비밀번호 입력 -->
                <li><input type="password" id="pass" name="pass" placeholder="비밀번호"></li> <!-- id, name pass 지정 -->
            </ul>
            <!-- 로그인 버튼 영역 -->
            <div id="login_btn">
                <!-- type="button"으로 설정 후 check_input()을 통해 폼 유효성 체크 수행 -->
                <button type="button" onclick="check_input()">로그인</button>
            </div>
        </form>
    </div> <!-- login_form -->
</div> <!-- login_box -->