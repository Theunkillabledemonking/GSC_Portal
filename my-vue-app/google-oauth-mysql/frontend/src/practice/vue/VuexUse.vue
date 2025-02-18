<script>
import { mapState, mapMutations } from "vuex";

export default {
  computed: {
    ...mapState(["count"])
  },
  methods: {
    ...mapMutations(["increment"])
  }
};
</script>

<template>
  <div>
    <p>카운트: {{ count }}</p>
    <button @click="increment">증가</button>
  </div>
</template>

<style scoped>

</style>