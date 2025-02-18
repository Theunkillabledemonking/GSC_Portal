<script>
export default {
  props: ["title", "content"], // 부모 컴포넌트에서 전달받은 props 선언
};
</script>

<template>
  <div class="box">
    <h2>{{ title }}</h2>
    <p>{{ content}}</p>
  </div>
</template>

<style scoped>
.box {
  padding: 20px;
  border: 2px solid #ccc;
  margin: 10px;
  border-radius: 5px;
}
</style>