// 1. html이 완전히 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
  // 2. 회원가입 폼 가져오기
  const registerForm = document.getElementById("registerForm");
  // 3. 폼이 존재하지 않으면 콘솔에 오류 출력 후 실행 중지
  if (!registerForm) {
    alert("폼이 존재하지 않습니다");
    return;
  }

  // 4. 폼 제출 이벤트 추가
  registerForm.addEventListener("submit", (event) => {
    // 기본 폼 제출 동작 차단 (새로고침 방지)
    event.preventDefault();

    // 5. 사용자가 입력한 비밀번호 가져오기
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    // 6. 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
    } else {
      registerForm.submit();
    }
    // 비밀번호 불일치 경고창 출력
    // 비밀번호 일치하면 폼을 제출출
  });
});
