
<template>
  <ul>
    <TodoItem v-for="item in todos" :key="item.id" :todo="text" />
  </ul>
</template>

<script>
import TodoItem from "./TodoItem.vue";

export default {
  components: {
    TodoItem,
  },
  data() {
    return {
      todos: [
        {id: 1, text: "Vue 공부하기"},
        {id: 2, text: "컴포넌트 학습하기"},
      ],
    };
  },
};
</script>

<style scoped>

</style>