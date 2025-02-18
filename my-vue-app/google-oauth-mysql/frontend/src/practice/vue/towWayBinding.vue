<script setup>

</script>

<template>
  <input v-model="name" />
  <p>입력한 이름: {{name}}</p>
</template>

<script>
export default {
  data() {
    return {
      name: ""
    };
  }
};
</script>

<style scoped>

</style>