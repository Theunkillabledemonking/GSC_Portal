<template>
  <div>
    <h1>게시판</h1>
    <input v-model="newPost" placeholder="글을 작성하세요" />
    <button @click="addPost">등록</button>
    <ul>
      <li v-for="post in boardStore.posts" :key="post.id">
        {{ post.content }}
        <button @click="removePost(post.id)">삭제</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { ref } from "vue";
  import { useBoardStore } from "../store/board.js";

  const boardStore = useBoardStore();
  const newPost = ref("");

  const addPost = () => {
    if (newPost.value.trim() !== "") {
      boardStore.addPost(newPost.value);
      newPost.value = ""; //초기화
    }
  };

  const removePost = (id) => {
    boardStore.removePost(id);
  };
</script>
