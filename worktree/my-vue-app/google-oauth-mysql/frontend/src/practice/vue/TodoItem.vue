<template>
  <li>{{ todo.text }}</li>
</template>

<script>
export default {
  props: ["todo"], // 부모로부터 todo 객체를 받음
};
</script>