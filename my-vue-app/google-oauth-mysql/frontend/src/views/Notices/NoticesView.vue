<template>
  <div class="notices">
    <h2>📢 공지사항</h2>

    <!-- 🔍 검색 기능 -->
    <input v-model="searchQuery" type="text" placeholder="검색할 공지 제목, 작성자, 내용..." class="search-box" />

    <!-- 🎚️ 학년 필터 (관리자, 교수만 보임) -->
    <div class="filters" v-if="authStore.role <= 2">
      <button @click="filterNotices('all')" :class="{ active: selectedGrade === 'all' }">전체</button>
      <button v-for="grade in [1, 2, 3]" :key="grade" @click="filterNotices(grade)" :class="{ active: selectedGrade === grade }">
        {{ grade }}학년
      </button>
    </div>

    <!-- ✅ 레벨 필터 (학년과 관계없이 선택 가능) -->
    <select v-model="selectedLevel">
      <option value="">🔍 모든 레벨</option>
      <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
    </select>

    <!-- ✅ 과목 필터 (선택된 학년의 과목만 표시) -->
    <select v-if="authStore.role <= 2 && selectedGrade !== 'all'" v-model="selectedSubject">
      <option value="">🔍 전체 과목</option>
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
        <th>레벨</th>
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
        <td>{{ notice.level || '-' }}</td>
        <td>{{ notice.author }}</td>
        <td>{{ formatDate(notice.created_at) }}</td>
        <td>{{ notice.views }}</td>
      </tr>
      </tbody>
    </table>

    <p v-else>📌 해당하는 공지사항이 없습니다.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { useRouter } from "vue-router";
import axios from "axios";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const router = useRouter();

const selectedGrade = ref('all');
const selectedLevel = ref('');
const selectedSubject = ref('');
const searchQuery = ref('');
const subjects = ref([]); // ✅ 과목 목록 추가
const specialSubjects = ref([]); // ✅ 특강 과목 목록 추가


const levels = ["N3", "N2", "N1", "TOPIK4", "TOPIK6"]; // ✅ 레벨 리스트

// ✅ 학년이 변경될 때만 해당 학년의 과목을 불러옴
watch(selectedGrade, async (newGrade) => {
  if (authStore.role > 2) return;

  if (newGrade === 'all') {
    subjects.value = [];
    selectedSubject.value = '';
    return;
  }

  try {
    const res = await axios.get(`/api/subjects/year/${newGrade}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    }); // ✅ 선택한 학년의 과목 가져오기

    subjects.value = res.data.subjects;
    selectedSubject.value = '';
  } catch (error) {
    console.log("과목 목록 불러오기 실패:", error);
    subjects.value = [];
  }
});

onMounted(async () => {
  try {
    // ✅ 공지사항과 특강 데이터를 동시에 가져오기
    const [noticesRes, specialSubjectsRes] = await Promise.all([
      noticeStore.loadNotices(),
      axios.get("/api/subjects/special", {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ]);

    // ✅ 특강 과목 목록 저장
    specialSubjects.value = specialSubjectsRes.data.specialLectures || [];

  } catch (error) {
    console.error("데이터 불러오기 오류:", error);
  }
});

// ✅ 필터링된 공지사항 목록
const filteredNotices = computed(() => {
  let filtered = noticeStore.notices;

  // ✅ 학년 필터링
  if (selectedGrade.value !== 'all') {
    filtered = filtered.filter(n => Number(n.grade) === Number(selectedGrade.value));
  }

  // ✅ 레벨 필터링 (특강 과목 포함)
  if (selectedLevel.value) {
    filtered = filtered.filter(n => n.level === selectedLevel.value || n.level === null);
  }

  // ✅ 과목 필터링 (특강 포함)
  if (selectedSubject.value) {
    filtered = filtered.filter(n => n.subject_id === Number(selectedSubject.value) || specialSubjects.value.some(s => s.id === n.subject_id));
  }

  // ✅ 검색 필터링 (제목, 작성자, 내용)
  if (searchQuery.value) {
    filtered = filtered.filter(n =>
        n.title.includes(searchQuery.value) ||
        n.author.includes(searchQuery.value) ||
        n.content.includes(searchQuery.value)
    );
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
.create-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
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
