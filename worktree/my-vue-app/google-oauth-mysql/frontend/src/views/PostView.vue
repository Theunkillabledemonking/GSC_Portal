<template>
  <div> 
    <h1>{{ post.title }}</h1>
    <p>{ post.content }</p>
  </div>
</template>

<script>
  import { usePostStore } from "../store/board.js";
  import { useRoute } from "vue-router";

  export default {
    setup() {
      const postSotre = usePostStore();
      const route = useRoute();
      const post = postStore.getPost(route.parmas.id);
      return { post };
    }
  };
</script>
