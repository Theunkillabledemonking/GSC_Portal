<template>
  <div class="dashboard">
    <h1>대시보드</h1>
    <UserProfile />
  </div>
</template>

<script>
import UserProfile from "../components/UserProfile.vue";

export default {
  name: "Dashboard",
  components: { UserProfile },
};
</script>
