<script>
    function check_input() {
        let form = document.member_form;

        // 아이디 입력 여부 확인
        if (!form.id.value.trim()) {
            alert("아이디를 입력하세요!");
            form.id.focus();
            return;
        }

        // 비밀번호 입력 여부 확인
        if (!form.pass.value.trim()) {
            alert("비밀번호를 입력하세요!");
            form.pass.focus();
            return;
        }

        // 비밀번호 확인 입력 여부 확인
        if (!form.pass_confirm.value.trim()) {
            alert("비밀번호 확인을 입력하세요!");
            form.pass_confirm.focus();
            return;
        }

        // 비밀번호 확인 일치 여부 검사
        if (form.pass.value !== form.pass_confirm.value) {
            alert("비밀번호가 일치하지 않습니다. \n다시 입력해주세요.");
            form.pass_confirm.focus();
            return;
        }

        // 이름 입력 여부 확인
        if (!form.name.value.trim()) {
            alert("이름을 입력하세요!");
            form.name.focus();
            return;
        }

        // 이메일 입력 여부 확인 (형식 검사 추가)
        let email1 = form.email1.value.trim();
        let email2 = form.email2.value.trim();
        let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // 이메일 정규식

        if (!email1 || !email2) {
            alert("이메일을 입력하세요!");
            form.email1.focus();
            return;
        }

        let email = email1 + "@" + email2;
        if (!emailPattern.test(email)) {
            alert("올바른 이메일 형식이 아닙니다!");
            form.email1.focus();
            return;
        }

        // 모든 필드 검증 후 폼 제출
        form.submit();
    }

    function reset_form() {
        let form = document.member_form;
        form.id.value = "";
        form.pass.value = "";
        form.pass_confirm.value = "";
        form.name.value = "";
        form.email1.value = "";
        form.email2.value = "";
        form.id.focus();
        return;
    }

    function check_id() {
        let id = document.member_form.id.value.trim();

        if (!id) {
            alert("아이디를 입력하세요!");
            document.member_form.id.focus();
            return;
        }

        window.open("member_check_id.php?id=" + encodeURIComponent(id), "IDcheck",
            "left=700,top=300,width=350,height=200,scrollbars=no,resizable=yes");
    }
</script>


<div id="join_box">
    <form action="member_insert.php" method="post" name="member_form">
        <h2>회원가입</h2>
        <div class="form id">
            <div>아이디</div>
            <div>
                <input type="text" name="id">
                <button type="button" onclick="check_id()">중복 확인</button>
            </div>
        </div>

        <div class="form">
            <div>비밀번호</div>
            <div>
                <input type="password" name="pass">
            </div>
        </div>

        <div class="form">
            <div>비밀번호 확인</div>
            <div>
                <input type="password" name="pass_confirm">
            </div>
        </div>

        <div class="form">
            <div>이름</div>
            <div>
                <input type="text" name="name">
            </div>
        </div>

        <div class="form email">
            <div>이메일</div>
            <div>
                <input type="text" name="email1">@<input type="text" name="email2">
            </div>
        </div>

        <div class="bottom_line"></div>
        <div class="buttons">
            <button type="button" onclick="check_input()">확인</button>&nbsp;
            <button type="button" onclick="reset_form()">초기화</button>
        </div>
    </form>
</div>