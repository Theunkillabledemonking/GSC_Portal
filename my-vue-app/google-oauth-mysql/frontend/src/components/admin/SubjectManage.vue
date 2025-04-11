<template>
  <div class="edit-form">
    <h3>{{ initial.id ? '✏️ 과목 수정' : '➕ 과목 추가' }}</h3>
    <input v-model="form.name" placeholder="과목명" />
    <select v-model="form.year">
      <option value="">학년</option>
      <option value="1">1학년</option>
      <option value="2">2학년</option>
      <option value="3">3학년</option>
    </select>
    <select v-model="form.level">
      <option value="">레벨</option>
      <option value="N1">N1</option>
      <option value="N2">N2</option>
      <option value="N3">N3</option>
      <option value="TOPIK4">TOPIK4</option>
      <option value="TOPIK6">TOPIK6</option>
    </select>
    <select v-model="form.is_foreigner_target">
      <option :value="null">공통</option>
      <option :value="0">한국인</option>
      <option :value="1">외국인</option>
    </select>
    <input v-model="form.semester" placeholder="학기 (spring 등)" />
    <input v-model="form.group_level" placeholder="그룹 (A, B 등)" />
    <label><input type="checkbox" v-model="form.is_special_lecture" /> 특강 여부</label>

    <div class="actions">
      <button @click="submit">💾 저장</button>
      <button @click="$emit('close')">취소</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs, watch } from 'vue';
import { useSubjectStore } from '@/store/subjectStore';

const props = defineProps({
  initial: Object
});

const emit = defineEmits(['close', 'saved']);
const subjectStore = useSubjectStore();

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

watch(() => props.initial, (val) => {
  if (val) Object.assign(form, val);
}, { immediate: true });

const submit = async () => {
  if (!form.name) return alert("과목명을 입력하세요");

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

  emit('saved');
};
</script>

<style scoped>
.edit-form {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-form input,
.edit-form select {
  padding: 6px;
  font-size: 14px;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
