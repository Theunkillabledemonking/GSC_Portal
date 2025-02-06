// 1. HTML이 완전히 로드된 후 실행
document.addEventListener("DomContentLoaded", () => {
    // 2. 로그인 폼 가져오기
    const loginForm = document.getElementById("loginForm");

    // 3. 폼이 존재하는지 확인
    if (!loginForm) {
        alert("로그인폼이 존재하지 않습니다.");
        return;
    }

    // 4. 폼 제출 이벤트 추가
    loginForm.addEventListener("submit", (event) => {
                // 기본 폼 제출 방지
        event.preventDefault();

        // 5. 입력된 값 가져오기
        const studentID = document.getElementById("student_id").value.trim();
        const password = document.getElementById("password").value.trim();

        // 6. 입력값 검증
        if (studentID === "" && password === "") {
            alert("학번과 비밀번호를 입력하세요");
            return;
        } else if (studentID === "") {
            alert("학번을 입력하세요.");
            return;
        } else if (password === "") {
            alert("비밀번호를 입력하세요.");
            return;
        }
        // 7. 폼 제출출
        loginForm.submit();
    });
    
});
    