function check_input() {
    if (!document.member_form.id.value) {
        alert("아이디를 입력하세요");
        document.member_form.id.focus();
        return;
    }

    if (!document.member_form.pass.value) {
        alert("비밀번호를 입력하세요");
        document.member_form.pass.focus()
        return;
    }

    if (!document.member_form.pass_confirm.value) {
        alert("비밀번호를 입력하세요;!");
        document.member_form.pass.focus();
        return;
    }

    if (document.member_form.pass_confirm.value !==
        document.member_form.pass.value) {
        alert("비밀번호가 일치하지 않습니다. \n다시 입력해주세요");
        document.member_form.pass.focus();
        return;
    }

    document.member_form.submit();
}

function reset_form() {
    document.member_form.pass.value = "";
    document.member_form.pass_confirm.value = "";
    document.member_form.role.value = "";
    document.member_form.pass.focus();
}