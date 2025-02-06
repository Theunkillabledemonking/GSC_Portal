<h3>아이디 중복 체크</h3>
<p>
<?php
    if (!$id) {
        echo"<li>아이디를 입력해주세요</li>";
    } else {
      $con = mysqli_connect("localhost", "root", "gsc1234!@#$", "school_portal");
      $sql = "select * from members where id = '$id'";
      $result = mysqli_query($con, $sql);
      $num_record = mysqli_num_rows($result);

      if ($num_record) {
          echo "<li>".$id." 아이디는 중복입니다.";
          echo "<li>다른 아이디를 사용해 주세요.</li>";
      } else {
          echo "<li>".$id." 아이디는 사용가능합니다.</li>";
      }

      mysqli_close($con);
    }
    ?>
</p>
<div id="close">
    <button type="button" onclick="javascript:self.close()"></button>
</div>