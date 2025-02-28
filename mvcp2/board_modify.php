<?php
    session_start();

    // MySQL 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

    if(!$con) {
        die("데이터베이스 연결 실패: ". mysqli_connect_error());
    }
    // GET 매개변수로 전달된 게시글 번호(num)와 페이지 번호(page) 가져오기
    $num = isset($_POST["num"]) ? intval($_POST["num"]) : 0; // 게시글 번호
    $page = isset($_POST["page"]) ? intval($_POST["page"]) : 1; // 현재 페이지 번호

    // POST 매개 변수로 전달된 제목(subject)과 내용(content) 가져오기
    $subject = isset($_POST["subject"]) ? trim($_POST["subject"]) : ""; // 수정된 제목
    $content = isset($_POST["content"]) ? trim($_POST["content"]) : ""; // 수정된 내용

    if (empty($subject) || empty($content)) {
        echo "<script>alert('제목과 내용을 모두 입력해주세요'); history.go(-1);</script>";
        exit;
    }

    // 기존 파일 유지 여부 확인
    $existing_file = isset($_POST["existing_file"]) ? $_POST["existing_file"] : ""; // 기존 파일 이름
    $delete_file = isset($_POST["delete_file"]) ? $_POST["delete_file"] : 0; // 파일 삭제 여부

    // 새 파일 업로드 처리
    $upload_dir = "./data/";
    $upfile_name = $_FILES["upfile"]["name"]; // 새 파일 이름
    $upfile_tmp_name = $_FILES["upfile"]["tmp_name"]; // 임시  파일 경로
    $upfile_type = $_FILES["upfile"]["type"]; // 파일 타입
    $upfile_size = $_FILES["upfile"]["size"]; // 파일 크기
    $upfile_error = $_FILES["upfile"]["error"]; // 업로드 중 오류 발생 여부

    $new_file_name = $existing_file; // 기본적으로 기존 파일 유지

    if ($delete_file == 1) {
        // 사용자가 "삭제"를 선택한 경우 기존 파일 삭제
        if ($existing_file) {
            $file_path = $upload_dir . $existing_file;
            if (file_exists($file_path)) {
                unlink($file_path); //파일 삭제
            }
        }
        $new_file_name = ""; // 파일 삭제 빈 값으로 업데이트

    } elseif ($upfile_name && !$upfile_error) {
        // 새파일이 업로드된 경우 처리
        $file = explode(".", $upfile_name);
        $file_ext = end($file);
        // 서버 저장용 파일명
        $new_file_name = date("Y_m_d_H_i_s") . "_" . uniqid() . "." . $file_ext;
        $upload_file = $upload_dir . $new_file_name;

        // 파일 크기 제한 (1MB 이하)
        if ($upfile_size > 1000000) {
            echo "<script>alert('업로드 파일 크기가 1MB를 초과합니다.'); history.go(-1);</script>";
            exit;
        }

        // 파일 이동
        if (!move_uploaded_file($upfile_tmp_name, $upload_file)) {
            echo "<script>alert('파일 이동 실패!');history.go(-1);</script>";
        }
    } else {
        // 파일 변경 없을 경우 기존 파일 유지
        $new_file_name = $existing_file;
    }

    // SQL 문장을 동적으로 구성하여 파일이 없을 때를 처리
    // 새 파일이 업로드된 경우
    if (!empty($new_file_name)) {
        $stmt = $con->prepare("UPDATE board SET subject=?, content=?, file_name=?, file_copied=?, file_type=? WHERE num=?");
        $stmt->bind_param("sssssi", $subject, $content, $upfile_name, $new_file_name, $upfile_type, $num);
    } else {
        $stmt = $con->prepare("UPDATE board SET subject=?, content=?, file_name='', file_copied='', file_type='' WHERE num=?");
        $stmt->bind_param("ssi", $subject, $content, $num);
    }
        $stmt->execute();


// 수정 후 list로 이동
    if ($stmt->affected_rows > 0) {
        echo "<script>location.href = 'board_list.php?page=$page';</script>";
    } else {
        echo "<script>alert('수정 실패. 다시 시도해주세요.'); history.go(-1);</script>";
    }
    $stmt->close();
