// 페이지 로드 시 공지사항 데이터 가져오기
document.addEventListener('DOMContentLoaded', function () {
    fetch('../controllers/notices/admin_notices.php')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('notices-table');
            tableBody.innerHTML = ''; // 기존 데이터를 초기화
            data.forEach(notice => {
                const row = `
                    <tr>
                        <td><input type="checkbox" name="delete_ids[]" value="${notice.id}"></td>
                        <td>${notice.id}</td>
                        <td>${notice.title}</td>
                        <td>${notice.writer}</td> <!-- 작성자 이름 추가 -->
                        <td>${notice.target}</td>
                        <td>${notice.created_at}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error('Error fetching notices:', error));
});

document.addEventListener('DOMContentLoaded', function () {
    const targetFilter = document.getElementById('target-filter');
    const noticesTable = document.getElementById('notices-table');

    // 데이터 가져오기 함수
    function fetchNotices(target = '전체') {
        fetch(`../controllers/notices/admin_notices.php?target=${target}`)
            .then(response => response.json())
            .then(data => {
                noticesTable.innerHTML = ''; // 테이블 초기화
                data.forEach((notice, index) => {
                    const row = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${notice.target}</td>
                            <td>${notice.title}</td>
                            <td>${notice.created_at}</td>
                        </tr>
                    `;
                    noticesTable.innerHTML += row;
                });
            })
            .catch(error => console.error('Error fetching notices:', error));
    }

    // 필터 변경 시 공지사항 필터링
    targetFilter.addEventListener('change', function () {
        const target = targetFilter.value;
        fetchNotices(target);
    });

    // 페이지 로드 시 전체 공지사항 로드
    fetchNotices();
});

// 삭제 버튼 클릭 시 확인 메시지와 삭제 요청
document.getElementById('delete-button').addEventListener('click', function () {
    const selected = document.querySelectorAll('input[name="delete_ids[]"]:checked');
    if (selected.length === 0) {
        alert('삭제할 공지사항을 선택하세요.');
        return;
    }
    if (confirm('선택한 공지사항을 삭제하시겠습니까?')) {
        const ids = Array.from(selected).map(checkbox => checkbox.value);
        fetch('../controllers/notices/admin_delete_notice.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_ids: ids }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('공지사항이 삭제되었습니다.');
                    location.reload();
                } else {
                    alert('삭제 중 오류가 발생했습니다.');
                }
            })
            .catch(error => console.error('Error:', error));
    }
});
