document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ register.js 로드 완료!"); // JS 로드 확인용 콘솔 출력

    // 회원가입 폼 요소 가져오기
    const registerForm = document.getElementById("registerForm");

    // 폼이 제대로 선택되지 않을 경우 경고 메시지 출력
    if (!registerForm) {
        console.error("❌ registerForm을 찾을 수 없습니다.");
        return;
    }

    // 폼 제출 이벤트 리스너 추가
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault(); // 기본 폼 제출 차단

        // 사용자가 입력한 비밀번호 가져오기
        const password = document.getElementById("password").value;

        // 사용자가 입력한 비밀번호 확인 값 가져오기
        const confirmPassword = document.getElementById("confirm_password").value;

        console.log("입력된 비밀번호:", password);
        console.log("비밀번호 확인:", confirmPassword);

        // 비밀번호 일치 여부 확인
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.") // 사용자 경고
        } else {
            console.log("✅ 비밀번호가 일치합니다! 폼 제출을 진행합니다.");
            registerForm.submit(); // 비밀번호가 일치할 경우 폼 제출
            alert("로그인 완료!");
            window.location.href = "../view/login_form.html"; // 로그인 페이지로 이동
        }
    });
});