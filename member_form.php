<script>
    function check_input() {
        if (!document.member_form.id.value) {
            alert("아이디를 입력하세요");
            document.member_form.id.focus();
            return;
        }

        if (!document.member_form.pass.value) {
            alert("비밀번호를 입력하세요");
            document.member_form.pass.focus();
            return;
        }

        if (!document.member_form.pass_confirm.value) {
            alert("비밀번호 확인을 입력하세요");
            document.member_form.id.focus();
            return;
        }

        if (!document.member_form.name.value) {
            alert("이름을 입력하세요");
            document.member_form.name.focus();
            return;
        }

        if (!document.member_form.email1.value) {
            alert("이메일을 입력하세요");
            document.member_form.email1.focuse();
            return;
        }

        if (!document.member_form.email2.value) {
            alert("이메일을 입력하세요");
            document.member_form.email2.focuse();
            return;
        }

        if (!document.member_form.pass.value !=
            document.member_form.pass_confirm.value) {
            alert("비밀번호가 일치하지 않습니다. \n다시 입력해주세요");
            document.member_form.pass.focus();
            document.member_form.pass_confirm.focus();
            return;
        }

        document.member_form.submit();
    }
    function reset_form() {
        document.member_form.id.value = "";
        document.member_form.pass.value = "";
        document.member_form.pass_confirm.value = "";
        document.member_form.name.value = "";
        document.member_form.email1.value = "";
        document.member_form.email2.value = "";
        document.member_form.id.focus();
        return;
    }
    function check_id() {
        window.open("member_check_id.php?id=" + document.member_form.id.value, "IDcheck",
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
                <input type="text" name="email1">@<input type="text" name="eamil2">
            </div>
        </div>

        <div class="bottom_line"></div>
        <div class="buttons">
            <button type="button" onclick="check_input()"></button>&nbsp;
            <button type="button" onclick="reset_form()"></button>
        </div>
    </form>
</div>