<template>
  <div class="notices">
    <h2>📢 공지사항</h2>

    <!-- 🔍 검색창 -->
    <input v-model="searchQuery" type="text" placeholder="검색할 공지 제목, 작성자, 내용..." class="search-box idol-style" />

    <!-- 🎚️ 필터 영역 -->
    <div class="filter-area">
      <div class="grade-buttons" v-if="authStore.role <= 2">
        <button @click="filterNotices('all')" :class="['filter-btn', { active: selectedGrade === 'all' }]">전체</button>
        <button v-for="grade in [1, 2, 3]" :key="grade" @click="filterNotices(grade)" :class="['filter-btn', { active: selectedGrade === grade }]">{{ grade }}학년</button>
      </div>

      <select v-model="selectedLevel" class="select-box">
        <option value="">🔍 모든 레벨</option>
        <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
      </select>

      <select v-if="authStore.role <= 2 && selectedGrade !== 'all'" v-model="selectedSubject" class="select-box">
        <option value="">🔍 전체 과목</option>
        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
      </select>

      <!-- SPA 페이지 이동 -->
      <button v-if="authStore.role <= 2" @click="goToCreateNotice" class="create-btn">+ 새 공지 등록</button>
    </div>

    <!-- 📌 공지사항 목록 -->
    <div class="notice-list" v-if="filteredNotices.length">
      <div class="notice-item" v-for="notice in paginatedNotices" :key="notice.id">
        <div class="notice-date">{{ formatDate(notice.created_at) }}</div>
        <div class="notice-content">
          <router-link :to="`/notices/${notice.id}`" class="notice-title">
            <span v-if="notice.is_important" class="badge">중요한 공지</span>
            {{ notice.title }}
          </router-link>
          <div class="notice-meta">
            {{ notice.grade !== null && notice.grade !== undefined ? `${notice.grade}학년` : '전체' }} /
            {{ notice.subject_name || '-' }} /
            {{ notice.level || '-' }} /
            작성자: {{ notice.author }} /
            조회수: {{ notice.views }}
          </div>
        </div>
      </div>
    </div>
    <p v-else>📌 해당하는 공지사항이 없습니다.</p>




    <!-- 📄 페이지네이션 -->
    <div class="pagination" v-if="totalPages > 1">
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
/* 🔍 검색창 */
.search-box.idol-style {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 15px;
  background-color: #f8f9fc;
  transition: 0.2s ease;
}

/* 🎚️ 필터 전체 정렬 */
.filter-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

/* 학년 버튼 */
.filter-btn {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 12px;
  background-color: white;
  border: 1px solid #ccc;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background-color: #f2f2f2;
}

.filter-btn.active {
  background-color: #e53935;
  color: white;
  border-color: #e53935;
}

/* 셀렉트 박스 (레벨/과목) */
.select-box {
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: white;
  color: #333;
  transition: 0.2s ease;
}

/* 등록 버튼 */
.create-btn {
  background-color: #4caf50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s ease;
}
.create-btn:hover {
  background-color: #43a047;
}

/* 📌 공지사항 리스트 스타일 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
}
.notice-item {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.notice-date {
  min-width: 120px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #999;
  text-align: center;
}
.notice-content {
  flex: 1;
}
.notice-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  text-decoration: none;
}
.notice-title:hover {
  color: #f272ba;
}

.badge {
  display: inline-block;
  background-color: #f272ba;
  color: white;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  margin-right: 8px;
  vertical-align: middle;
}

.notice-meta {
  font-size: 13px;
  color: #777;
  margin-top: 8px;
  line-height: 1.6;
}


/* 🪟 모달 스타일 */
.modal_wrap__y6GIw {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s;
}
.modal_wrap__y6GIw[aria-hidden='false'] {
  pointer-events: all;
  opacity: 1;
}
.modal_overlay__LxI7A {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal_cover__FtHSe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: rgba(90, 97, 114, 0.5);
}
.modal_dialog__lwrUq {
  background: white;
  max-width: 500px;
  width: 90%;
  margin: auto;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  transform: scale(0.8);
  opacity: 0;
  transition: 0.25s ease;
}
[aria-hidden='false'] .modal_dialog__lwrUq {
  transform: scale(1);
  opacity: 1;
}
.modal-content h3 {
  font-size: 20px;
  margin-bottom: 10px;
}
.modal-content p {
  font-size: 14px;
  margin-bottom: 20px;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 30px auto 10px;
  padding: 10px 0;
}

.pagination button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: #f0f0f0;
  color: #555;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:hover {
  background-color: #e0e0e0;
}

.pagination button.active {
  background-color: #f272ba;
  color: white;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}

</style>
