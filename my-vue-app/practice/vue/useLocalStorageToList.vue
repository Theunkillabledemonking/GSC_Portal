<script>
export default {
  data() {
    return {
      newTodo: "",
      todos: []
    };
  },

  methods: {
    // 할 일 추가
    addTodo() {
      if (this.newTodo.trim() !== "") {
        this.todos.push(this.newTodo);
        this.newTodo = "";
        this.saveTodos(); // localstorage에 저장
      }
    },

    // 할 일 삭제
    removeTodo(index) {
      this.todos.splice(index, 1);
      this.saveTodos(); // 변경된 리스트를 LocalStorage에 저장
    },

    // Local Storage에 저장
    saveTodos() {
      localStorage.setItem("todos", JSON.stringify(this.todos));
    },

    // LocalStorage에 값 가져오기
    loadTodos() {
      const storedTodos = localStorage.getItem("todos");
      if (storedTodos) {
        this.todos = JSON.parse(storedTodos);
      }
    }
  },
  created() {
    this.loadTodos(); // 페이지가 로드될 때 LocalStorage에 데이터 불러오기
  }
};
</script>

<template>
  <div>
    <h1>To-Do List</h1> <!-- 타이틀 -->
    <input v-model="newTodo" placeholder="할 일을 입력하세요" @keyup.enter="addTodo"> <!-- 양방향 전달 -->
    <button @click="addTodo">추가</button> <!-- 클릭 이벤트 -->
    <ul>
      <li v-for="(todo, index) in todos" :key="index"> <!-- todos를 배열하며 index에 맞는 값 삭제 -->
        {{ todo }}
        <button @click="removeTodo(index)">삭제</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>