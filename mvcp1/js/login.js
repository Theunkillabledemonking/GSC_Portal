// 1. HTML이 완전히 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
    // 2. 로그인 폼 가져오기
    const loginForm = document.getElementById("loginForm");

    // 3. 폼이 존재하는지 확인
    if (!loginForm) {
        console.error("로그인 폼을 찾을 수 없습니다.");
        return;
    }

    // 4. 폼 제출 이벤트 추가
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // 기본 폼 제출 방지

        // 5. 입력된 값 가져오기
        const studentId = document.getElementById("student_id").value.trim();
        const password = document.getElementById("password").value.trim();

        // 6. 입력값 검증
        if (studentId === "") {
            alert("학번을 입력하세요.");
            return;
        }  
        if (password === "") {
            alert("비밀번호를 입력하세요.");
            return;
        }

        // 7. 중복 제출 방지 (버튼 비활성화)
        const submitButton = loginForm.querySelector("button[type=submit]"); // 제출 버튼
        submitButton.disabled = true; // 제출 버튼 비활성화하여 줃복 버튼 방지

        try {
            // 8. 서버에 로그인 요청 (AJAX 요청)
            const response = await fetch(loginForm.action, {
                method: "POST", // HTTP POST 요청
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded" // 폼 데이터를 전송
                },
                 body: new URLSearchParams({
                     student_id: studentId,
                     password: password
                 })
            });

            // 10. 서버로부터 응답을 JSON 형식으로 파싱
            const result = await response.json();

            // 11. 서버 응답 처리
            if (result.status === "success") {
                // 성공적인 로그인: 서버가 "status: success"를 반환한 경우
                window.location.href = result.redirect; // 응답에 포함된 redirect URL로 이동
            } else {
                // 로그인 실패: 서버가 실패 응답을 반환한 경우
                alert("로그인 실패: 학번 또는 비밀번호 확인하세요")
            }
        } catch (error) {
            // 12. 네트워크 오류 또는 서버 오류 처리
            console.log("로그인 요청 중 오류 발쌩:", error); // 콘솔 에러 로그 출력
            alert("서버와 통신 중 문제가 발생했습니다."); // 사용자에게 알림 표시
        } finally {
            // 13. 요청 완료 후 버튼 활성화 (사용자가 다시 요청할 수 있도록)
            submitButton.disabled = false;
        }
    });
    
});