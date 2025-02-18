<script setup>
import {inject} from "vue";

const counter = inject("counter");
const increment = inject("increment");
</script>

<template>
<p>
  현재 카운트: {{counter.count}}
</p>
  <button @click="increment">증가</button>
</template>
