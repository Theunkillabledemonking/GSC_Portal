document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    // 로그아웃 버튼 클릭 이벤트
    logoutBtn.addEventListener("click", () => {
        fetch('../controller/logout.php', { method: 'POST'}) // 서버에 POST 요청으로 로그아웃
            .then(response => {
                if (response.ok) {
                    alert("로그아웃 되었습니다.");
                    window.location.href = "../view/login_form.html"; // 로그인 페이지로 이동
                } else {
                    alert("로그아웃 실패. 다시 시도해주세요");
                }
            })
            .catch(error => console.error("로그아웃 요청 실패", error));
    });
});