<template>
  <div class="subject-manage">
    <h2>📚 과목 목록</h2>

    <!-- ✅ 필터 -->
    <div class="filters">
      <div class="filter-group">
        <span>유형:</span>
        <button :class="{ active: filter.type === 'all' }" @click="filter.type = 'all'">전체</button>
        <button :class="{ active: filter.type === 'regular' }" @click="filter.type = 'regular'">정규</button>
        <button :class="{ active: filter.type === 'special' }" @click="filter.type = 'special'">특강</button>
      </div>

      <div class="filter-group">
        <span>📘 학년:</span>
        <select v-model="filter.year">
          <option value="">학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>
      </div>

      <div class="filter-group">
        <span>🧪 레벨:</span>
        <select v-model="filter.level">
          <option value="">레벨</option>
          <option v-for="level in allLevels" :key="level">{{ level }}</option>
        </select>
      </div>

      <div class="filter-group">
        <span>👤 대상:</span>
        <select v-model="filter.is_foreigner">
          <option value="">전체</option>
          <option :value="0">한국인</option>
          <option :value="1">외국인</option>
        </select>
      </div>
    </div>

    <!-- ✅ 과목 목록 -->
    <table>
      <thead>
      <tr>
        <th>과목명</th>
        <th>학년</th>
        <th>레벨</th>
        <th>대상</th>
        <th>학기</th>
        <th>분반</th>
        <th>유형</th>
        <th>관리</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="subject in filteredSubjects" :key="subject.id">
        <td>{{ subject.name }}</td>
        <td>{{ subject.year ? subject.year + '학년' : '전체' }}</td>
        <td>{{ subject.level || 'N/A' }}</td>
        <td>
          {{
            subject.is_foreigner_target === 1
                ? '외국인'
                : subject.is_foreigner_target === 0
                    ? '한국인'
                    : '전체'
          }}
        </td>
        <td>{{ semesterLabelMap[subject.semester] || 'N/A' }}</td>
        <td>{{ subject.group_level || '전체' }}</td>
        <td>
            <span class="badge" :class="subject.is_special_lecture ? 'special' : 'regular'">
              {{ subject.is_special_lecture ? '특강' : '정규' }}
            </span>
        </td>
        <td>
          <button @click="openModal(subject)">수정</button>
          <button @click="deleteSubject(subject.id)">삭제</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- ✅ 과목 추가 버튼 -->
    <div style="margin-top: 20px;">
      <button @click="openModal()">➕ 과목 추가</button>
    </div>

    <!-- ✅ 모달 -->
    <div v-if="isModalOpen" class="modal-overlay">
      <SubjectManage
          :subject="editingSubject"
          @close="closeModal"
          @saved="handleSaved"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSubjectStore } from '@/store';
import SubjectManage from './SubjectManage.vue';

const subjectStore = useSubjectStore();
const isModalOpen = ref(false);
const editingSubject = ref(null);

const allLevels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6'];

const filter = ref({
  year: '',
  level: '',
  is_foreigner: '',
  type: 'all'
});

const semesterLabelMap = {
  spring: '봄학기',
  summer: '여름학기',
  fall: '가을학기',
  winter: '겨울학기',
  null: 'N/A',
  '': 'N/A'
};

const openModal = (subject = null) => {
  editingSubject.value = subject;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingSubject.value = null;
};

const handleSaved = () => {
  closeModal();
  subjectStore.loadAllSubjects();
};

const deleteSubject = async (id) => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await subjectStore.deleteSubject(id);
    await subjectStore.loadAllSubjects();
  }
};

const filteredSubjects = computed(() => {
  return subjectStore.all.filter((s) => {
    const isSpecial = Number(s.is_special_lecture || 0) === 1;

    const matchType =
        filter.value.type === 'all' ||
        (filter.value.type === 'regular' && !isSpecial) ||
        (filter.value.type === 'special' && isSpecial);

    const matchYear =
        !filter.value.year || Number(s.year) === Number(filter.value.year);

    const matchLevel =
        !filter.value.level || s.level === filter.value.level;

    const matchTarget =
        filter.value.is_foreigner === '' ||
        s.is_foreigner_target === null ||
        Number(s.is_foreigner_target) === Number(filter.value.is_foreigner);

    return matchType && matchYear && matchLevel && matchTarget;
  });
});

onMounted(() => {
  subjectStore.loadAllSubjects();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.subject-manage {
  padding: 20px;
}
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-group button.active {
  background-color: #1E3A8A;
  color: white;
  font-weight: bold;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}
.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  color: white;
}
.badge.special {
  background: #2962ff;
}
.badge.regular {
  background: #00c853;
}
</style>