<?php
    // URL 매개변수에서 값 가져오기
    $real_name = isset($_GET["real_name"]) ? $_GET["real_name"] : ""; // 서버 저장 파일명
    $file_name = isset($_GET["file_name"]) ? $_GET["file_name"] : ""; // 원래 업로드된 파일명
    $file_type = isset($_GET["file_type"]) ? $_GET["file_type"] : ""; // 파일 형식

    $file_path ="./data/" . $real_name; // 파일 경로 설정 

    if (!file_exists($file_path)) {
        die("<script>alert('파일이 존재하지 않습니다.'); history.go(-1)</script>");
    }
    // 사용자 브라우저 확인 (IE / Internet Explorer 검사)
    $ie = preg_match('~MSIE|Internet Explorer~i', $_SERVER['HTTP_USER_AGENT']) // MSI나 Internet Explorer를 검사 
            || (strpos($_SERVER['HTTP_USER_AGENT'], 'Trident/7.0') // Trident/7.0: IE 11 확인
            !== false && strpos($_SERVER['HTTP_USER_AGENT'], 'rv:11.0') !== false); // rv:11.0: IE 11 버전 체크
    
    // 만약 사용자가 Internet Explorer라면, 파일명이 깨지는 것을 방지하기 위한 처리
    if ($ie) {
        $file_name = iconv('utf-8', 'euc-kr', $file_name); // 파일명을 utf-8에서 euc-kr로 변환환
    }


    // HTTP 헤더를 설정하여 파일 전송 준비
    Header("Content-type: application/octet-stream"); // 파일 다운로드를 위한 설정
    Header("Content-Length: ".filesize($file_path)); // 파일 크기를 HTTP 헤더로 전달달
    Header("Content-Disposition: attachment; filename=" . urlencode($file_name)); // 다운로드할 때 사용될 파일명
    Header("Content-Transfer-Encoding: binary"); // 바이너리 데이터로 전송
    Header("Expires: 0"); // 캐싱 방지 (파일이 항상 최신으로 다운로드 되도록 설정)


    // 파일을 클라이언트로 전송
    readfile($file_path); // 파일 내용 읽 즉시 전송
    exit;
    ?>


