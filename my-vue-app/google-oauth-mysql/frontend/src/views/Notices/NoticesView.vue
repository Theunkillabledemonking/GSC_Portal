<template>
  <div class="max-w-6xl mx-auto mt-12 px-4">
    <!-- 유리 스타일 박스 -->
    <div class="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow p-6">
      <h2 class="text-xl font-bold text-idolPurple mb-5">공지사항</h2>

      <!-- 🔍 검색 & 필터 -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <input
            v-model="searchQuery"
            placeholder="검색할 공지 제목, 작성자, 내용..."
            class="search-box idol-style w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-idolPink"
        />

        <div v-if="authStore.role <= 2" class="grade-buttons flex gap-2">
          <button
              v-for="grade in ['all', 1, 2, 3]"
              :key="grade"
              @click="filterNotices(grade)"
              :class="['filter-btn', { active: selectedGrade === grade }]"
          >
            {{ grade === 'all' ? '전체' : `${grade}학년` }}
          </button>
        </div>

        <select v-model="selectedLevel" class="select-box">
          <option value="">🔍 모든 레벨</option>
          <option v-for="level in levels" :key="level">{{ level }}</option>
        </select>

        <select v-if="authStore.role <= 2 && selectedGrade !== 'all'" v-model="selectedSubject" class="select-box">
          <option value="">🔍 전체 과목</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>

        <button
            v-if="authStore.role <= 2"
            @click="goToCreateNotice"
            class="create-btn btn-idol whitespace-nowrap"
        >
          + 새 공지 등록
        </button>
      </div>

      <!-- 📌 공지 목록 -->
      <div v-if="filteredNotices.length" class="notice-list flex flex-col gap-4">
        <div v-for="notice in paginatedNotices" :key="notice.id" class="notice-item bg-white/80 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div class="notice-date text-xs text-gray-500 mb-1">{{ formatDate(notice.created_at) }}</div>
          <router-link :to="`/notices/${notice.id}`" class="notice-title text-idolPink font-semibold hover:underline">
            <span v-if="notice.is_important" class="badge badge-idol">중요</span>
            {{ notice.title }}
          </router-link>
          <div class="notice-meta text-sm text-gray-600 mt-1">
            {{ notice.grade ? `${notice.grade}학년` : '전체' }} /
            {{ notice.subject_name || '-' }} /
            {{ notice.level || '-' }} /
            작성자: {{ notice.author }} /
            조회수: {{ notice.views }}
          </div>
        </div>
      </div>

      <p v-else class="text-center text-sm text-gray-400">📌 해당하는 공지사항이 없습니다.</p>

      <!-- 📄 페이지네이션 -->
      <div class="pagination mt-6" v-if="totalPages > 1">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">«</button>
        <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            :class="{ active: page === currentPage }"
        >
          {{ page }}
        </button>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">»</button>
      </div>
    </div>
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
    filtered = filtered.filter(n => n.level === selectedLevel.value);
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

const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => {
  return Math.ceil(filteredNotices.value.length / itemsPerPage);
});

const paginatedNotices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredNotices.value.slice(start, start + itemsPerPage);
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
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
/* 📌 필터 버튼 */
.filter-btn {
  @apply px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 transition;
}
.filter-btn:hover,
.filter-btn.active {
  @apply bg-idolPink text-white border-idolPink;
}

/* 📚 셀렉트 박스 */
.select-box {
  @apply px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-idolPink;
}

/* 📃 공지사항 뱃지 */
.badge-idol {
  @apply inline-block bg-idolPink text-white text-xs font-medium px-3 py-1 rounded-full mr-2;
}

/* 🔍 검색창 */
.search-box.idol-style {
  @apply w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-idolPink;
}

/* 📄 페이지네이션 */
.pagination {
  @apply flex justify-center items-center gap-2 mt-6;
}
.pagination button {
  @apply w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium transition;
}
.pagination button:hover,
.pagination button.active {
  @apply bg-idolPink text-white;
}
.pagination button.active {
  @apply shadow;
}
.pagination button:disabled {
  @apply opacity-40 cursor-not-allowed;
}
</style>

