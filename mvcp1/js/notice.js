document.addEventListener("DOMContentLoaded", () => {
    // HTML 요소 선택
    const noticeList = document.getElementById("noticeList"); // 공지사항 목록을 표시한 div
    const searchInput = document.getElementById("searchInput"); // 검색 입력 필드
    const searchOption = document.getElementById("searchOption"); // 검색 옵션
    const searchBtn = document.getElementById("searchBtn"); // 검색 버튼
    const prevPageBtn = document.getElementById("prevPage"); // 이전 페이지 버튼
    const nextPageBtn = document.getElementById("nextPage"); // 다음 페이지 버튼
    const pageInfo = document.getElementById("pageInfo"); // 현재 페이지 정보 표시
    const writeBtn = document.getElementById("writeBtn"); // 글쓰기 버튼

    // URL에서 'id' 값을 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("noticeId");

    console.log("Notice ID:", noticeId); // Notice ID 디버깅

    // HTML 요소 가져오기
    const noticeTitle = document.getElementById("noticeTitle");
    const noticeAuthor = document.getElementById("noticeAuthor");
    const noticeDate = document.getElementById("noticeDate");
    const noticeContent = document.getElementById("noticeContent");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    let currentPage = 1; // 현재 페이지 번호 (초기값 : 1)
    let totalPages = 1; // 전체 페이지 개수 (초기값 : 1)

    /**
     * 사용자 권한 확인 및 글쓰기 버튼 표시
     */
    fetch('../controller/user_role.php')
        .then(response => {
            console.log("응답 상태 코드:", response.status); // 응답 상태 코드 확인
            if (!response.ok) {
                throw new Error("사용자 권한 정보를 가져올 수 없습니다.");
            }
            return response.json();
        })
        .then(data => {
            console.log("받은 사용자 데이터:", data); // 디버깅용
            if (data.role === 'admin' || data.role === 'professor') {
                writeBtn.style.display = "inline-block"; // 관리자/교수인 경우 글쓰기 버튼 표시
            } else {
                console.log("사용자 권한이 부족하여 글쓰기 버튼이 표시되지 않습니다.");
            }
        })
        .catch(error => {console.error("권한 정보 로드 실패:", error)});

    /**
     * 공지사항 목록 불러오기
     * - 검색어와 페이지 번호를 매개변수로 받아 해당 데이터를 서버에서 가져옴
     * - 검색어가 없으면 전체 게시물을 불러옴
     * - 페이지네이션 적용
     * 
     * @param {string} search 검색어 (작성자 또는 제목)
     * @param {number} page 현재 페이지 번호
     */
    function loadNotices(search = "", searchOption = "", page = 1) {
        // 서버에 검색어와 검색 옵션을 같이 전달
        const url = `../controller/notices_controller.php?action=search&search=${encodeURIComponent(search)}&option=${searchOption}&page=${page}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // data.notices 등으로 넘어오는 목록을 화면에 표시
                console.log("검색 결과:", data);

                // 목록 표시 예시 (간단히 콘솔 출력)
                // 실제로는 HTML 요소 생성해서 표시
                const noticeList = document.getElementById("noticeList");
                noticeList.innerHTML = "";
                if (data.notices && data.notices.length > 0) {
                    data.notices.forEach(notice => {
                        const div = document.createElement("div");
                        div.textContent = `[${notice.id}] ${notice.title} - ${notice.author_name}`;
                        noticeList.appendChild(div);
                    });
                } else {
                    noticeList.innerHTML = "<p>검색 결과가 없습니다.</p>";
                }

                // 페이지네이션 처리 (생략)
            })
            .catch(error => {
                console.error("데이터 로드 실패:", error);
            });
    }

    // 검색 버튼 이벤트 예시
        document.getElementById("searchBtn").addEventListener("click", () => {
            const searchValue = document.getElementById("searchInput").value.trim();
            const searchOption = document.getElementById("searchOption").value; // "title" or "author"
            loadNotices(searchValue, searchOption, 1);
        });

    /**
     * 공지사항 상세 정보 가져오기
     */
    fetch(`../controller/notices_controller.php?id=${noticeId}`)
        .then(response => response.json()) // JSON 응답을 받아오기
        .then(data => {
            if (data.error) {
                alert("게시글을 찾을 수 없습니다.");
                window.location.href = "./notice_list.php";
                return;
            }

            // HTMl 요소에  데이터 채우기
            noticeTitle.textContent = data.title;
            noticeAuthor.textContet = data.author_name;
            noticeDate.textContent = new Date(data.created_at).toLocaleDateString();
            noticeContent.textContent = data.content;

            // 사용자 권한 확인 후 수정/삭제 버튼 표시
            fetch('../controller/user_role.php')
                .then(response => response.json()) // 사용자 권한 정보 가져오기
            .then(data => {
                if (data.role === 'admin' || data.role === 'professor') {
                    editBtn.style.display = "inline-block";
                    deleteBtn.style.display = "inline-block";
                }
            });
        })
        .catch(error => { console.error("데이터 로드 실패", error); }); // 오류 처리

    /**
     * 삭제 버튼 클릭 시 이벤트 처리
     */
    deleteBtn.addEventListener("click", () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        fetch(`../controller/notices_controller.php?id=${noticeId}`, {method : "DELETE"})
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert("삭제되었습니다.");
                    window.location.href = "../view/notice_list.php"; // 목록 페이지로 이동
                } else {
                    alert("삭제 권한이 없습니다."); // 권한이 없음 메시지
                }
            })
            .catch(error => console.error("삭제 실패:", error));
    });

    /**
     * 수정 버튼 클릭 시 수정 페이지로 이동
     */
    editBtn.addEventListener("click", () => {
        window.location.href = `edit.html?id=${noticeId}`; // 수정페이지로 이동
    });


    /**
     * 검색 버튼 클릭 이벤트 리스너
     * - 사용자가 검색어를 입력한 후 검색 버튼을 클릭하면, 해당 검색어를 기반으로 데이터를 다시 불러옴
     * - 검색 결과는 첫 페이지부터 출력
     */
    searchBtn.addEventListener("click", () => {
        const searchValue = searchInput.value.trim(); // 입력된 검색어 앞뒤 공백 제거
        const searchBy = searchOption.value; // 선택된 검색 옵션션
        loadNotices(searchValue, searchBy, 1); // 첫 페이지부터 검색 결과 출력
    });

    /**
     * 이전 페이지 버튼 클릭 이벤트 리스너
     * - 현재 페이지 번호가 1보다 클 경우, 이전 페이지 데이터 불러오기
     */
    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            loadNotices(searchInput.value.trim(), searchOption.value, currentPage - 1);
        }
    });

    /**
     * 다음 페이지 버튼 클릭 이벤트 리스너
     * - 현재 페이지 번호가 전체 페이지 수보다 작을 경우, 다음 페이지 데이터 불러오기
     */
    nextPageBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            loadNotices(searchInput.value.trim(), searchOption.value, currentPage + 1);
        }
    });

    /**
     * 글쓰기 버튼 클릭 시 이동
     */
    writeBtn.addEventListener("click", () => {
        window.location.href = "../view/write_form.html"; // 글쓰기 페이지로 이동
    });

    noticeItem.addEventListener("click", () => {
        window.location.href = `notice_list.php?noticeId=${notice.id}`;
    });


    /**
     * 초기 데이터 로드
     * - 페이지가 처음 로드될 때 기본적으로 첫 번째 페이지의 데이터를 불러옴
     */
    loadNotices();
})