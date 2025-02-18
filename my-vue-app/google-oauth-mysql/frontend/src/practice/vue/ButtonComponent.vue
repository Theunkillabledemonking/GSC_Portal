<template>
  <button @click="handleClick">{{ label }}</button>
</template>

<script>
export default {
  props: ["label"], // 부모 컴포넌트에서 label을 전달받음
  methods: {
    handleClick() {
      this.$emit("clicked"); // 부모에게 클릭 이벤트 전달
    }
  }
}
</script>


<style scoped>
button {
  padding: 10px;
  background: blue;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>