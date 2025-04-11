<template>
  <div class="subject-manage">
    <h2>📚 과목 목록 (유형별 보기)</h2>

    <!-- ✅ 필터 -->
    <div class="filters">
      <div class="filter-group">
        <span>📘 학년:</span>
        <button @click="filter.year = ''">전체</button>
        <button @click="filter.year = '1'">1학년</button>
        <button @click="filter.year = '2'">2학년</button>
        <button @click="filter.year = '3'">3학년</button>
      </div>
      <div class="filter-group">
        <span>🧪 레벨:</span>
        <select v-model="form.level">
          <option value="">레벨</option>
          <option v-for="level in availableLevels" :key="level" :value="level">{{ level }}</option>
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
    <div class="card-list">
      <div class="subject-card" v-for="subject in filteredSubjects" :key="subject.id">
        <div class="subject-header">
          <strong>{{ subject.name }}</strong>
          <span class="badge" :class="subject.is_special_lecture ? 'special' : 'regular'">
            {{ subject.is_special_lecture ? '특강' : '정규' }}
          </span>
        </div>
        <div class="meta">
          <p>📚 학년: {{ subject.year || 'N/A' }} | 🎯 레벨: {{ subject.level || 'N/A' }}</p>
          <p>👥 대상: {{ subject.is_foreigner_target === 1 ? '외국인' : subject.is_foreigner_target === 0 ? '한국인' : '공통' }}</p>
          <p>📅 학기: {{ subject.semester || 'N/A' }} | 그룹: {{ subject.group_level || '전체' }}</p>
        </div>
        <div class="actions">
          <button @click="openEditModal(subject)">✏️ 수정</button>
          <button @click="deleteSubject(subject.id)">🗑 삭제</button>
        </div>
      </div>
    </div>

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
        <select v-if="form.is_foreigner_target !== null" v-model="form.level">
          <option value="">레벨</option>
          <option v-for="level in availableLevels" :key="level" :value="level">{{ level }}</option>
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
          <option value="C">C반</option>
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

const filter = ref({ year: '', level: '', is_foreigner: '' });
const isModalOpen = ref(false);

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

const availableLevels = computed(() => {
  if (form.is_foreigner_target === 0) return ['N1', 'N2', 'N3'];
  if (form.is_foreigner_target === 1) return ['TOPIK4', 'TOPIK6'];
  return []; // 공통이면 아무것도 안 보임
});

watch(() => form.is_foreigner_target, (val) => {
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
});

const filteredSubjects = computed(() => {
  return subjectStore.all.filter((s) => {
    const matchYear = !filter.value.year || s.year == filter.value.year;
    const matchLevel = !filter.value.level || s.level === filter.value.level;
    const matchTarget =
        filter.value.is_foreigner === '' ||
        s.is_foreigner_target == filter.value.is_foreigner;
    return matchYear && matchLevel && matchTarget;
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
.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.subject-card {
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.meta {
  font-size: 14px;
  margin: 10px 0;
}
.actions {
  display: flex;
  justify-content: end;
  gap: 8px;
}
.badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
}
.badge.regular {
  background: #00c853;
  color: white;
}
.badge.special {
  background: #2962ff;
  color: white;
}

/* Modal */
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
