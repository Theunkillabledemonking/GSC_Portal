<template>
  <div>
    <Header />
    <nav>
      <router-link to="/my-vue-app/public">홈</router-link>
      <router-link to="/login">로그인</router-link>
      <router-link to="/board">게시판</router-link>
      <router-link to="/inquiry">문의사항</router-link>
      <router-link to="/timetable">시간표</router-link>
    </nav>
    <router-view />
  </div>

  <div>
    <h1>임시 게시판</h1>
    <div v-if="isLoading">로딩...</div>
    <div v-else>
      <input v-model="newPost" placeholder="글 입력">
      <button @click="addPost">등록</button>

      <p>총 게시글 수: {{ postCount }}</p> <!-- computed로 자동 계싼 -->

      <ul>
        <li v-for="post in state.posts" :key="post.id">
          {{ post.content}}
          <button @click="removePost(post.id)">삭제</button>
        </li>
      </ul>
    </div>
  </div>
  <div>
    <ChildComponent />
  </div>

<!--  <div>-->
<!--    <ul>-->
<!--      <li v-for="post in apiStore.posts" :key="post.id"> {{ post.title }}</li>-->
<!--    </ul>-->
<!--  </div>-->
</template>

<script setup>
  import Header from "./components/Header.vue";
  import { useApiStore } from "./store/apiStore.js";
  const apiStore = useApiStore();

  apiStore.fetchPosts();

  import { ref, computed, watch, onMounted ,provide, reactive } from "vue";
  import ChildComponent from "./components/ChildComponent.vue";

  // 1. 단일 반응형 상태
  const newPost = ref("");  // 사용자가 입력할 새 글
  const isLoading = ref(true);  // 로딩 상태

  // 2. reactive() : 객체 및 배열을 반응형으로 관리
  const state = reactive({
    count: 0,
    posts: [] // 게시글 목록
  });
  // 3. computed() : posts 배열의 길이를 계산하여 자동 업데이트
  const postCount = computed(() => state.posts.length);

  // 4. watch() : 사용자가 글을 추가할 때 실행 (콘솔에 감지 로그 출력);
  watch(() => state.posts, (newValue, oldValue) => {
    console.log(`게시글이 변경되었습니다! (${oldValue.length} -> (${newValue.length})`);
  }, {deep: true}); // deep 옵션을 추가하여 배열 내부 값 변경도 감지

  // 5. omMounted() : 컴포넌트가 처음 로들될 때 실행 (더미 데이터 추가)
  onMounted(() => {
    setTimeout(() => {
      state.posts = [
        {id: 1, content: "첫 글"},
        {id: 2, content: "두 글"}
      ];
      isLoading.value = false; //데이터 로딩 완료
    }, 1000); // 1초 후 데이터 로드
  });

  // 게시글 추가 함수
  const addPost = () => {
    if (newPost.value.trim() !== "") {
      state.posts.push({ id: Date.now(), content: newPost.value });
      newPost.value = ""; // 입력 필드 초기화
    }
  };

  // 게시글 삭제 함수
  const removePost = (id) => {
    state.posts = state.posts.filter(post => post.id !== id);
  };

  // 값 증가
  const increment = () => {
    state.count++;
  };

  provide("counter", state);
  provide("increment", increment);

</script>
