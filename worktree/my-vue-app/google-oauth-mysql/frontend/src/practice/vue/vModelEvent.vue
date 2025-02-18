<template>
  <input :value="message" @input="updateMessage" />
  <p>입력한 값: {{ message }}</p>
</template>

<script>
export default {
  data() {
    return {
      message: ""
    };
  },
  methods: {
    updateMessage() {
      this.message = event.target.value;
    }
  }
};
</script>

<style scoped>

</style>