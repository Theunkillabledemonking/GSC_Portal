<template>
  <div class="pending">
    <h1>승인 대기 중입니다.</h1>
    <p>관리자가 승인하면 다시 로그인할 수 있습니다.</p>
  </div>
</template>

<script>
export default {
  name: "PendingApproval",
};
</script>

<style scoped>
.pending {
  text-align: center;
  margin-top: 50px;
}
</style>
