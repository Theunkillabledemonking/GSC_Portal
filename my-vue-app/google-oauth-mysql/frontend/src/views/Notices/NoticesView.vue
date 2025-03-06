<template>
  <div class="notices">
    <h2>📢 공지사항</h2>

    <!-- 🔍 검색 기능 -->
    <input v-model="searchQuery" type="text" placeholder="검색할 공지 제목 입력..." class="search-box" />

    <!-- 🎚️ 학년 필터 버튼 -->
    <!-- 학년 필터 -->
    <!-- 관리자(role=1), 교수(role=2)만 보이도록 v-if="authStore.role <= 2" -->
    <div class="filters" v-if="authStore.role <= 2">
      <button @click="filterNotices('all')" :class="{ active: selectedGrade === 'all' }">전체</button>
      <button @click="filterNotices(1)" :class="{ active: selectedGrade === 1 }">1학년</button>
      <button @click="filterNotices(2)" :class="{ active: selectedGrade === 2 }">2학년</button>
      <button @click="filterNotices(3)" :class="{ active: selectedGrade === 3 }">3학년</button>
    </div>

    <!-- 학년 필터가 'all'이 아닌 경우에만, 그리고 role<=2일 때만 노출 -->
    <select v-if="authStore.role <= 2 && selectedGrade !== 'all'" v-model="selectedSubject">
      <option value="">전체</option>
      <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
        {{ subject.name }}
      </option>
    </select>

    <!-- 📝 공지 등록 버튼 (관리자 & 교수만 가능) -->
    <button v-if="authStore.role <= 2" @click="goToCreateNotice" class="create-btn">+ 새 공지 등록</button>

    <!-- 📌 공지사항 목록 -->
    <table v-if="filteredNotices.length">
      <thead>
      <tr>
        <th>번호</th>
        <th>제목</th>
        <th>학년</th>
        <th>과목</th>
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
        <td>{{ notice.subject_name || '-' }}</td>
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
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { useRouter } from "vue-router";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const router = useRouter();

const selectedGrade = ref('all');
const searchQuery = ref('');
const subjects = ref([]);
const selectedSubject = ref('');

onMounted(() => {
  // 로그인한 유저 정보에 따라 백엔드에서 notices를 가져옴
  // 관리자/교수는 전체가 오고, 학생은 자기 학년 공지만
  noticeStore.loadNotices();
});

// 학년 바뀌면 해당 학년의 과목 목록 가져오기
watch(selectedGrade, async (newGrade) => {
  // 학생은 학년 필터 자체를 안 쓰므로 role<=2 조건을 체크
  if (authStore.role > 2) return;

  if (newGrade === 'all') {
    subjects.value = [];
    selectedSubject.value = '';
    return;
  }
  try {
    const res = await axios.get(`/api/subjects/year/${newGrade}`);
    subjects.value = res.data.subjects;
    selectedSubject.value = '';
  } catch (error) {
    console.log('과목 목록 불러오기 실패:', error);
    subjects.value = [];
  }
});


const filteredNotices = computed(() => {
  // 백엔드에서 가져온 전체(혹은 제한된) 공지들
  let filtered = noticeStore.notices;

  // ① 관리자(role=1) 또는 교수(role=2)일 때만 학년/과목 필터 적용
  if (authStore.role <= 2) {
    if (selectedGrade.value !== 'all') {
      const gradeVal = Number(selectedGrade.value);
      filtered = filtered.filter(n => Number(n.grade) === gradeVal);

      if (selectedSubject.value) {
        const subjectVal = Number(selectedSubject.value);
        filtered = filtered.filter(n => Number(n.subject_id) === subjectVal);
      }
    }
  }
  // ② 검색어 필터 (학생도 공지 검색은 가능하다고 가정)
  if (searchQuery.value) {
    filtered = filtered.filter(n => n.title.includes(searchQuery.value));
  }

  return filtered;
});


// 그 다음에 filteredNotices를 watch해서 디버깅 로그 찍기
watch(filteredNotices, (newVal) => {
  console.log("최종 필터 결과:", newVal);
}, { immediate: true, deep: true });

// 학년 필터 변경
const filterNotices = (grade) => {
  selectedGrade.value = grade;
};

// 날짜 포맷 함수
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

// 공지 등록 페이지 이동
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
