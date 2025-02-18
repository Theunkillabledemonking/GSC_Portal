<script>
export default {
  methods: {
    sendData() {
      this.$emit("custom-event", "Hello from child!"); // 이벤트 발생
    }
  }
};
</script>

<template>
  <button @click="sendData">데이터 저장</button>
</template>

<style scoped>

</style>