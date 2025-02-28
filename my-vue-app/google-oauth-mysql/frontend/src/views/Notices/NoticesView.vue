<template>
  <div class="notices">
    <h2>📢 공지사항</h2>

    <!-- 🔍 검색 기능 -->
    <input v-model="searchQuery" type="text" placeholder="검색할 공지 제목 입력..." class="search-box"/>

    <!-- 🎚️ 학년 필터 버튼 -->
    <div class="filters">
      <button @click="filterNotices('all')" :class="{ active: selectedGrade === 'all' }">전체</button>
      <button @click="filterNotices(1)" :class="{ active: selectedGrade === 1 }">1학년</button>
      <button @click="filterNotices(2)" :class="{ active: selectedGrade === 2 }">2학년</button>
      <button @click="filterNotices(3)" :class="{ active: selectedGrade === 3 }">3학년</button>
    </div>

    <!-- 📝 공지 등록 버튼 (관리자 & 교수만 가능) -->
    <button v-if="authStore.role <= 2" @click="goToCreateNotice" class="create-btn">+ 새 공지 등록</button>

    <!-- 📌 공지사항 목록 -->
    <table v-if="filteredNotices.length">
      <thead>
      <tr>
        <th>번호</th>
        <th>제목</th>
        <th>대상 학년</th>
        <th>작성자</th>
        <th>작성 날짜</th>
        <th>조회수</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(notice, index) in filteredNotices" :key="notice.id">
        <td>{{ index + 1 }}</td>
        <td>
          <router-link :to="`/notices/${notice.id}`">
            <span v-if="notice.is_important" class="important">🔥</span>
            {{ notice.title }}
          </router-link>
        </td>
        <td>{{ notice.grade ? `${notice.grade}학년` : '전체' }}</td>
        <td>{{ notice.author }}</td>
        <td>{{ formatDate(notice.created_at) }}</td>
        <td>{{ notice.views }}</td>
      </tr>
      </tbody>
    </table>

    <p v-else>공지사항이 없습니다.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { useRouter } from "vue-router";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const router = useRouter();
const selectedGrade = ref('all');
const searchQuery = ref('');

// ✅ 공지사항 불러오기
onMounted(() => {
  noticeStore.loadNotices();
});

// ✅ 필터링된 공지 목록 (검색 & 학년 필터 적용)
const filteredNotices = computed(() => {
  let filtered = noticeStore.notices;

  if (selectedGrade.value !== 'all') {
    filtered = filtered.filter(n => n.grade === selectedGrade.value);
  }

  if (searchQuery.value) {
    filtered = filtered.filter(n => n.title.includes(searchQuery.value));
  }

  return filtered;
});

// ✅ 학년 필터 변경
const filterNotices = (grade) => {
  selectedGrade.value = grade;
};

// ✅ 날짜 포맷 함수
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

// ✅ 공지 등록 페이지 이동
const goToCreateNotice = () => {
  router.push('/notices/create');
};
</script>

<style scoped>
.notices {
  padding: 20px;
}

.search-box {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.filters {
  margin-bottom: 15px;
}

.filters button {
  margin-right: 10px;
  padding: 5px 10px;
  cursor: pointer;
}

.filters .active {
  background-color: #ff6666;
  color: white;
}

.important {
  color: red;
  font-weight: bold;
}

.create-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;
}

.create-btn:hover {
  background-color: #45a049;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

th {
  background-color: #f4f4f4;
}
</style>
