<sectron>
    <div id="board_box">
        <h3 class="title">게시판 > 내용 보기</h3>
        <?php
            $num = isset($_GET["num"]) ? intval($_GET["num"]) : 0;
            $page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;

            $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
            $sql = "select * from board where num = $num";
            $result = mysqli_query($con, $sql);

            $row = mysqli_fetch_array($result);
            $id = $row["id"];
            $name = $row["name"];
            $regist_day = $row["regist_day"];
            $subject = $row["subject"];
            $content = $row["content"];
            $file_name = $row["file_name"];
            $file_type = $row["file_type"];
            $file_copied = $row["file_copied"];
            $hit = $row["hit"];

            $content = str_replace(" ", "&nbsp;", $content);
            $content = str_replace("\n", "<br>", $content);

            $new_hit = $hit + 1;
            $sql = "update board set hit = $new_hit where id = $id";
            mysqli_query($con, $sql);
        ?>
            <ul id="view_content">
                <li>
                    <span class="col1"><b>제목 :</b> <?=$subject?></span>
                    <span class="col2"><?=$name?> | <?=$regist_day?></span>
                </li>
            <li>
        <?php
            if ($file_name) {
                $real_name = $file_copied;
                $file_path = "./data/" . $real_name;
                $file_size = filesize($file_path);
                echo "-> 첨부파일 : $file_name ($file_size Byte) &nbsp;&nbsp;&nbsp;&nbsp;
                    <a href='board_download.php?num=$num&
                    real_name=$real_name&
                    file_name=$file_name&
                    file_type=$file_type'>[저장]</a><br><br>";
            }
        ?>
            <?=$content?>
            </li>
            </ul>
            <ul class="buttons">
                <li><button onclick="location.href='board_list.php?page=<?=$page?>'">목록</button></li>
                <li><button onclick="location.href='board_modify.php?num=<?=$num?>&page=<?=$page?>'">수정</button></li>
                <li><button onclick="location.href='board_delete.php?num=<?=$num?>&page=<?=$page?>'">삭제</button></li>
                <li><button onclick="location.href='board_form.php">글쓰기</button></li>
            </ul>
    </div>
</sectron>