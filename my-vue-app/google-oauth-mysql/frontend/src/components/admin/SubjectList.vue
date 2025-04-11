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
        <!-- 학년은 정규 과목일 경우에만 -->
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
          <button @click="openEditModal(subject)">수정</button>
          <button @click="deleteSubject(subject.id)">삭제</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- ✅ 과목 추가 버튼 -->
    <div style="margin-top: 20px;">
      <button @click="openEditModal()">➕ 과목 추가</button>
    </div>

    <!-- ✅ 수정/추가 모달 -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal">
        <h3>{{ form.id ? '✏️ 과목 수정' : '➕ 과목 추가' }}</h3>
        <input v-model="form.name" placeholder="과목명" />
        <select v-model="form.year">
          <option value="">학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>
        <select v-model="form.is_foreigner_target">
          <option :value="null">공통</option>
          <option :value="0">한국인</option>
          <option :value="1">외국인</option>
        </select>
        <select v-model="filter.level">
          <option value="">레벨</option>
          <option v-for="level in allLevels" :key="level">{{ level }}</option>
        </select>
        <select v-model="form.semester">
          <option value="">학기 선택</option>
          <option value="spring">🌸 Spring</option>
          <option value="summer">☀️ Summer</option>
          <option value="fall">🍂 Fall</option>
          <option value="winter">❄️ Winter</option>
        </select>
        <select v-model="form.group_level">
          <option value="">전체</option>
          <option value="A">A반</option>
          <option value="B">B반</option>
        </select>

        <label><input type="checkbox" v-model="form.is_special_lecture" /> 특강 여부</label>

        <div class="actions">
          <button @click="submit">💾 저장</button>
          <button @click="closeModal">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useSubjectStore } from '@/store/subjectStore';

const subjectStore = useSubjectStore();
const isModalOpen = ref(false);

const semesterLabelMap = {
  spring: '봄학기',
  summer: '여름학기',
  fall: '가을학기',
  winter: '겨울학기',
  null: 'N/A',
  '': 'N/A'
};


const filter = ref({
  year: '',
  level: '',
  is_foreigner: '',
  type: 'all' // all | regular | special
});

const form = reactive({
  id: null,
  name: '',
  year: '',
  level: '',
  is_special_lecture: false,
  semester: '',
  group_level: '',
  is_foreigner_target: null
});



const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    year: '',
    level: '',
    is_special_lecture: false,
    semester: '',
    group_level: '',
    is_foreigner_target: null
  });
};

const allLevels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6'];

const availableLevels = computed(() => {
  if (form.is_foreigner_target === 0) return ['N1', 'N2', 'N3'];
  if (form.is_foreigner_target === 1) return ['TOPIK4', 'TOPIK6'];
  return [];
});

watch(() => form.is_foreigner_target, () => {
  if (!availableLevels.value.includes(form.level)) {
    form.level = '';
  }
});

const openEditModal = (subject = null) => {
  resetForm();
  if (subject) Object.assign(form, subject);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const submit = async () => {
  if (!form.name) return alert('과목명을 입력하세요');

  const payload = {
    ...form,
    is_special_lecture: form.is_special_lecture ? 1 : 0,
    year: form.is_special_lecture ? null : form.year,
    level: form.level || null,
    group_level: form.group_level || null,
    is_foreigner_target: form.is_foreigner_target
  };

  if (form.id) {
    await subjectStore.updateSubject(payload);
  } else {
    await subjectStore.addSubject(payload);
  }

  closeModal();
  await subjectStore.loadAllSubjects(); // 갱신
};

const deleteSubject = async (id) => {
  if (confirm('정말 삭제하시겠습니까?')) {
    await subjectStore.deleteSubject(id);
    await subjectStore.loadAllSubjects();
  }
};

onMounted(() => {
  subjectStore.loadAllSubjects();
  console.log("📥 과목 불러옴")
});

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
        (s.is_foreigner_target !== null &&
            Number(s.is_foreigner_target) === Number(filter.value.is_foreigner));

    const result = matchType && matchYear && matchLevel && matchTarget;

    console.log({
      name: s.name,
      isSpecial,
      matchType,
      matchYear,
      result
    });

    return result;
  });
});



</script>

<style scoped>
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal input,
.modal select {
  padding: 6px;
  font-size: 14px;
}
</style>
