<script>
export default {
  computed: {
    todoId() {
      return this.$route.params.id; // url 에서 id 값을 가져옴
    }
  }
};
</script>

<template>
  <div>
    <h2>할 일 상세 페이지</h2>
    <p>현재 ID : {{ todoId }}</p>
  </div>
</template>
