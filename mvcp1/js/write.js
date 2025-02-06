document.addEventListener("DOMContentLoaded", () => {
    const writeForm = document.getElementById("writeForm");

    // 글쓰기 폼 제출 이벤트
    writeForm.addEventListener("submit", (event) => {
        event.preventDefault(); // 기본 제출 동작 막기

        const formData = new FormData(writeForm); // 사용자가 입력한 데이터 가져오기

        // 서버에 데이터 보내기
        fetch('../controller/write.php', {
            method: 'POST', // 데이터를 보낼 방식: POST
            body: formData // 폼 데이터를 그대로 전송
        })
            .then(response => response.json()) // 서버 응답을 JSON으로 파싱
            .then(data => {
                if (data.status === "success") {
                    alert("Success!"); // 성공 메시지 출력
                    window.location.href = "../view/notice_list.php"; // 게시판 목록으로 이동
                } else {
                    alert(data.message); // 오류 메세지 출력
                }
            })
            .catch(error => {
                // 네트워크 오류 처리
                console.log("요청 실패:", error);
                alert("네트워크 오류로 작성에 실패했습니다.");
            });
    });
});