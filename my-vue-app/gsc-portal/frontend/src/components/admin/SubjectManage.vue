<template>
  <div class="modal">
    <h3>{{ form.id ? '✏️ 과목 수정' : '➕ 과목 추가' }}</h3>

    <input v-model="form.name" placeholder="과목명" />

    <select v-model="form.year" :disabled="form.is_special_lecture">
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

    <select v-model="form.level">
      <option value="">레벨</option>
      <option v-for="level in availableLevels" :key="level">{{ level }}</option>
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

    <label>
      <input type="checkbox" v-model="form.is_special_lecture" /> 특강 여부
    </label>

    <div class="actions">
      <button @click="submit">💾 저장</button>
      <button @click="$emit('close')">취소</button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useSubjectStore } from '@/store';

const props = defineProps({
  subject: Object // 수정 시 넘겨받는 값
});
const emit = defineEmits(['saved', 'close']);

const store = useSubjectStore();

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

watch(
    () => props.subject,
    (val) => {
      if (val) Object.assign(form, val);
    },
    { immediate: true }
);

const availableLevels = computed(() => {
  if (form.is_foreigner_target === 0) return ['N1', 'N2', 'N3'];
  if (form.is_foreigner_target === 1) return ['TOPIK4', 'TOPIK6'];
  return ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6'];
});

watch(() => form.is_foreigner_target, () => {
  if (!availableLevels.value.includes(form.level)) {
    form.level = '';
  }
});

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

  try {
    if (form.id) {
      await store.updateSubject(payload);
    } else {
      await store.addSubject(payload);
    }
    emit('saved');
  } catch (e) {
    alert('저장 실패');
  }
};


</script>

<style scoped>
.modal-overlay {
  position: fixed; /* ✅ 화면 고정 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000; /* ✅ 리스트 위에 떠야 하므로 높은 값 */
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3); /* ✅ 흐림 효과 */
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.modal input,
.modal select {
  padding: 6px;
  font-size: 14px;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
</style>
