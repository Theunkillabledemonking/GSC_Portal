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

        <!-- ✅ 한국어/외국인 필터 추가 -->
        <select v-model="selectedUserType" class="select-box">
          <option value="">🌐 모든 사용자</option>
          <option value="0">🇰🇷 한국인</option>
          <option value="1">🌏 외국인</option>
        </select>

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
          <option v-for="level in availableLevels" :key="level">{{ level }}</option>
        </select>

        <select v-if="authStore.role <= 2 && selectedGrade !== 'all'" 
               v-model="selectedSubject" 
               class="select-box">
          <option value="">🔍 전체 과목</option>
          <option v-for="subject in filteredSubjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
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
import { useNoticeStore, useAuthStore } from '@/store';
import {
  getSubjectsByYear,
  getAllSubjects,
  getSpecialLectures,
  getSubjectsByLevel,
  getFilteredSubjects
} from "@/services/subjectService";
import { useRouter } from "vue-router";
import axios from "axios";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const router = useRouter();

const selectedGrade = ref('all');
const selectedLevel = ref('');
const selectedSubject = ref('');
const selectedUserType = ref(''); // ✅ 유저 타입 추가 (0: 한국인, 1: 외국인)
const searchQuery = ref('');
const subjects = ref([]); // ✅ 과목 목록 추가
const specialSubjects = ref([]); // ✅ 특강 과목 목록 추가

// ✅ 레벨 분리
const jlptLevels = ["N3", "N2", "N1"]; 
const topikLevels = ["TOPIK4", "TOPIK6"];

// ✅ 사용자 타입에 따른 레벨 표시
const availableLevels = computed(() => {
  if (selectedUserType.value === '0') {
    return jlptLevels;
  } else if (selectedUserType.value === '1') {
    return topikLevels;
  }
  return [...jlptLevels, ...topikLevels]; // 전체 선택 시 모든 레벨
});

// ✅ 과목 목록 필터링
const filteredSubjects = computed(() => {
  if (selectedUserType.value === '') {
    return subjects.value; // 전체 사용자 선택 시 모든 과목
  }
  
  const isForeigner = selectedUserType.value === '1';
  
  return subjects.value.filter(subject => {
    // 외국인 선택 시 is_foreigner_target이 1인 과목만
    if (isForeigner) {
      return subject.is_foreigner_target === 1 || 
             (subject.level && subject.level.startsWith('TOPIK'));
    }
    
    // 한국인 선택 시 is_foreigner_target이 0이거나 없는 과목만
    return !subject.is_foreigner_target || 
           subject.is_foreigner_target === 0 ||
           (subject.level && (subject.level === 'N1' || subject.level === 'N2' || subject.level === 'N3'));
  });
});

// ✅ 레벨 변경 감지
watch(selectedLevel, async (newLevel) => {
  if (!newLevel || authStore.role > 2) return;
  
  try {
    const isForeigner = selectedUserType.value === '1' ? 1 : 0;
    
    // 필터링된 과목 목록 가져오기
    const { subjects: levelSubjects } = await getFilteredSubjects({
      level: newLevel,
      is_foreigner: isForeigner
    });
    
    subjects.value = levelSubjects;
    console.log(`🔍 레벨(${newLevel}) 과목 로드 완료: ${levelSubjects.length}개`);
    
    // 과목 선택 초기화
    selectedSubject.value = '';
    
  } catch (error) {
    console.error(`❌ 레벨별 과목 로드 오류:`, error);
  }
});

// ✅ 사용자 타입, 학년 변경 감지
watch([selectedGrade, selectedUserType], async ([grade, userType]) => {
  if (authStore.role > 2) return;

  try {
    if (userType === '1') {
      // ✅ 외국인: TOPIK 기준 과목 조회
      console.log("🔍 외국인 과목 조회 시작");
      
      // 레벨 리셋 (TOPIK 전용 레벨로)
      if (selectedLevel.value && !selectedLevel.value.startsWith('TOPIK')) {
        selectedLevel.value = '';
      }
      
      // 외국인 대상 과목 로딩 (필터링 API 사용)
      const { subjects: foreignerSubjects } = await getFilteredSubjects({
        level: selectedLevel.value || 'TOPIK4',
        is_foreigner: 1
      });
      
      subjects.value = foreignerSubjects;
      console.log(`🔍 외국인 과목 로드 완료: ${foreignerSubjects.length}개`);
      
    } else if (userType === '0') {
      // ✅ 한국인: 학년/JLPT 기준 과목 조회
      console.log("🔍 한국인 과목 조회 시작");
      
      // 레벨 리셋 (JLPT 전용 레벨로)
      if (selectedLevel.value && selectedLevel.value.startsWith('TOPIK')) {
        selectedLevel.value = '';
      }
      
      // JLPT 레벨이 선택된 경우
      if (selectedLevel.value) {
        const { subjects: koreanSubjects } = await getFilteredSubjects({
          level: selectedLevel.value,
          is_foreigner: 0
        });
        subjects.value = koreanSubjects;
        console.log(`🔍 한국인 레벨별 과목 로드 완료: ${koreanSubjects.length}개`);
      } 
      // 학년이 선택된 경우
      else if (grade !== 'all') {
        const { subjects: byYear } = await getSubjectsByYear(grade);
        subjects.value = byYear.filter(sub => !sub.is_foreigner_target || sub.is_foreigner_target === 0);
        console.log(`🔍 한국인 학년별 과목 로드 완료: ${subjects.value.length}개`);
      } 
      // 전체 선택 시
      else {
        const { subjects: all } = await getAllSubjects();
        subjects.value = all.filter(sub => !sub.is_foreigner_target || sub.is_foreigner_target === 0);
        console.log(`🔍 한국인 전체 과목 로드 완료: ${subjects.value.length}개`);
      }
    } else {
      // ✅ 전체 사용자 선택 시
      if (grade === 'all') {
        const { subjects: all } = await getAllSubjects();
        subjects.value = all;
      } else {
        const { subjects: byYear } = await getSubjectsByYear(grade);
        subjects.value = byYear;
      }
    }
    
    // 과목 선택 초기화
    selectedSubject.value = '';
    
  } catch (error) {
    console.error("❌ 과목 로드 오류:", error);
    subjects.value = [];
  }
});

onMounted(async () => {
  try {
    await noticeStore.loadNotices();

    if (authStore.isLoggedIn) {
      const today = new Date();
      const currentSemester = today.getMonth() + 1 >= 3 && today.getMonth() + 1 <= 8 ? 'spring' : 'fall';

      const { specialLectures } = await getSpecialLectures({
        semester: currentSemester,
        level: authStore.user?.level || 'ALL',
      });

      specialSubjects.value = specialLectures;
      console.log("🔍 특강 과목 로드:", specialLectures.length);
    }
  } catch (error) {
    console.error("❌ 공지사항 데이터 로드 실패:", error);
  }
});

// ✅ 필터링된 공지사항 목록
const filteredNotices = computed(() => {
  let filtered = noticeStore.notices;

  // ✅ 학년 필터링
  if (selectedGrade.value !== 'all') {
    filtered = filtered.filter(n => Number(n.grade) === Number(selectedGrade.value));
  }

  // ✅ 유저 타입 필터링 (한국인/외국인)
  if (selectedUserType.value !== '') {
    filtered = filtered.filter(n => n.is_foreigner === Number(selectedUserType.value));
  }

  // ✅ 레벨 필터링
  if (selectedLevel.value) {
    filtered = filtered.filter(n => n.level === selectedLevel.value);
  }

  // ✅ 과목 필터링
  if (selectedSubject.value) {
    filtered = filtered.filter(n => n.subject_id === Number(selectedSubject.value));
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

