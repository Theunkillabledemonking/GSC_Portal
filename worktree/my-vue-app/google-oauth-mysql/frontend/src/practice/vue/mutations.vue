<script>
  const store = createStore({
    state: {
      count: 0
    },
    mutations: {
      increment(state) {
        state.count++;
      }
    }
  });
</script>

<template>
  <p>{{ $store.state.count }}</p>
  <button @click="$store.count('increment')">증가</button>
</template>

<style scoped>

</style>
