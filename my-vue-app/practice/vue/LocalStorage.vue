<script>
// username 키에 Alice 값 저장
localStorage.setItem("username", "Alice");

// username 키를 가져옴
const username = localStorage.getItem("username");
console.log(username);

// username 키의 데이터를 삭제
localStorage.removeItem("username");

// LocalStorage에 저장된 모든 데이터 삭제
localStorage.clear();

// 객체 저장 => LocalStorage
const user = {name: "Alex", age: 25};
localStorage.setItem("user", JSON.stringify(user)); // 객체를 문자열로 변환하여 저장

// 객체 가져오기
const storedUser = JSON.parse(localStorage.getItem("user"));
console.log(storedUser.name);
console.log(storedUser.age);
</script>

<template>

</template>

<style scoped>

</style>