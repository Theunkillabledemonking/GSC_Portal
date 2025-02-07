<meta charset="utf-8"> <!-- 문자 인코딩을 UTF-8로 설정 -->
<?php
    session_start(); // 세션 시작

    // 세션에 저장된 사용자 ID와 이름 가져오기
    isset($_SESSION['userid']) ? $_SESSION['userid'] : '';


    isset($_SESSION['username']) ? $_SESSION['username'] : '';
    // 로그인한지 않은 경우 빈 문자열로 생성

    // 로그인하지 않은 경우 게시물 작성 불가 -> 경고창을 뛰우고 이전 페이지로 이동
    if (!$userid) {
        echo ("<script> alert('게시판 글쓰기는 로그인 후 이용해주세요!');
                         history.go(-1)
              </script>");
        exit; // 실행 중단
    }

    // 폼에서 입력받은 제목과 내용 가져오기
    $subject = $_POST['subject'];
    $content = $_POST['content'];

    // HTML 특사 문자 변환 (보안 강화, XSS 방지)
    $subject = htmlspecialchars($subject, ENT_QUOTES);
    $content = htmlspecialchars($content, ENT_QUOTES);

    // 현재 날짜를 'Y-m-d' 형식으로 저장
    $regist_day = date("Y-m-d");

    // 파일 업로드를 위한 디렉토리 설정
    $upload_dir = './data/';

    // 업로드된 파일 정보 가져오기
    $upfile_name = $_FILES["upfile"]["name"]; // 원본 파일명
    $upfile_tmp_name = $_FILES["upfile"]["tmp_name"]; // 임시 저장된 파일 경로
    $upfile_type = $_FILES["upfile"]["type"]; // 파일 유형 (MINE 타입)
    $upfile_size = $_FILES["upfile"]["size"]; // 파일 크기 (바이트)
    $upfile_error = $_FILES["upfile"]["error"]; // 업로드 중 발생한 오류 코드

    // 파일이 업로드된 경우 처리 (에러가 없을 때만 실행)
    if ($upfile_name && !$upfile_error) {
        // 파일명을 '.' 기준으로 분리 (확장자 추출)
        $file = explode(".", $upfile_name);
        $file_name = $file[0]; // 파일 이름
        $file_ext = $file[1]; // 확장자 (ex: jpg, png 등)

        // 새로운 파일명 생성 (현재 날짜 및 시간 기반)
        $new_file_name = date("Y_m_d_H_i_s") . "_" . uniqid();
        $copied_file_name = $new_file_name . "." . $file_ext; // 새로운 파일명 + 확장자
        // 파일이 저장될 전체 경로 지정
        $upload_file = $upload_dir.$copied_file_name;

        // 파일 킉가 1MB를 초과하는 경우 업로드 차단
        if ($upfile_size > 1000000) {
            echo ("
            <script>
                alert('업로드 파일 크기가 지정된 용량(1MB)을 초과합니다!<br>' +
                      '파일 크기를 체크해주세요! ');
                history.go(-1)
            </script>");
            exit;
        }

        // 파일을 지정한 디렉토리로 이동 (실제 저장)
        if (!move_uploaded_file($upfile_tmp_name, $upload_file)) {
            echo ("
            <script>
                alert('파일을 지정한 디렉터리에 복사하는 데 실패했습니다.');
                history.go(-1)
            </script>");
            exit;
        }
    } else {
        // 파일이 업로드되지 않은 경우 변수 초기화
        $upfile_name = "";
        $upfile_type = "";
        $copied_file_name = "";
    }

    // MySQL 데이터베이스 연결
    $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");

    // 게시글 삽입 SQL 문 작성
    $sql = "insert into board (id, name, subject, content, regist_day, hit, file_name, file_type, file_copied)";
    $sql .= "values('$userid', '$username', '$subject', '$content', '$regist_day', 0,";
    $sql .= "'$upfile_name', '$upfile_type', '$copied_file_name')";
    mysqli_query($con, $sql); // sql에 저장된 명령 실행

    // DB 연결 종료
    mysqli_close($con);

    // 게시물 등록 후 메인 페이지로 이동
    echo ("
    <script>
        location.href = 'index.php';
    </script>");
    ?>