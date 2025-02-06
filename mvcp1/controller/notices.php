<?php
require_once '../model/Notice.php';
header('Content-Type: application/json');

$search = isset($_GET['search']) ? $_GET['search'] : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

$data = Notice::getAll($search, $page);

echo json_encode($data);


// 사용자 권한 확인
function check_permission($notice_autor__id) {
    if ($_SESSION['role'] == 'admin') {
        return true; // 관리자는 모든 권한 허용
    } elseif ($_SESSION['role'] == 'professor' && $_SESSION['user_id'] == $notice_autor__id) {
        return true; // 교수는 본인이 작성한 공지사항 수정/삭제 가능
    } else {
        return false; // 그 외에는 권한 없음
    }
}

// // 공지사항 삭제
// if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_POST['action'] == 'delete') {
//     $notice_id = $_POST['notice_id'];
//     $notice_author_id = Notice::getAuthorId($notice_id);

//     if (check_permission($notice_author_id)) {
//         if (Notice::delete($notice_id)) {
//             echo "공지사항이 삭제되었습니다.";
//         } else {
//             echo "공지사항 삭제에 실패했습니다.";
//         }
//     } else {
//         echo "권한이 없습니다.";
//     }
// }