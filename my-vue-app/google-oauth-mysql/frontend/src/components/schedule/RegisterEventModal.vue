<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">수업 등록</h3>
        <button 
          class="close-button"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 수업 제목 -->
          <div class="form-group">
            <label>수업 제목</label>
            <input 
              v-model="formData.title"
              type="text"
              required
              placeholder="수업 제목을 입력하세요"
            />
          </div>

          <!-- 수업 유형 -->
          <div class="form-group">
            <label>수업 유형</label>
            <select v-model="formData.type" required>
              <option value="regular">정규 수업</option>
              <option value="special">특강</option>
              <option value="makeup">보강</option>
            </select>
          </div>

          <!-- 시작/종료 교시 -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label>시작 교시</label>
              <select v-model="formData.startPeriod" required>
                <option 
                  v-for="period in 9" 
                  :key="period"
                  :value="period"
                >
                  {{ period }}교시
                </option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>종료 교시</label>
              <select 
                v-model="formData.endPeriod" 
                required
                :disabled="!formData.startPeriod"
              >
                <option 
                  v-for="period in remainingPeriods" 
                  :key="period"
                  :value="period"
                >
                  {{ period }}교시
                </option>
              </select>
            </div>
          </div>

          <div class="button-group">
            <button 
              type="button" 
              class="cancel-button"
              @click="emit('close')"
            >
              취소
            </button>
            <button 
              type="submit" 
              class="submit-button"
              :disabled="!isFormValid"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
    default: () => ({
      startPeriod: 1,
      endPeriod: 1,
      day: 'mon'
    })
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  title: '',
  type: 'regular',
  startPeriod: props.initialData?.startPeriod || 1,
  endPeriod: props.initialData?.endPeriod || 1
})

const remainingPeriods = computed(() => {
  if (!formData.value.startPeriod) return []
  return Array.from(
    { length: 9 - formData.value.startPeriod + 1 },
    (_, i) => formData.value.startPeriod + i
  )
})

const isFormValid = computed(() => {
  return (
    formData.value.title &&
    formData.value.type &&
    formData.value.startPeriod &&
    formData.value.endPeriod &&
    formData.value.endPeriod >= formData.value.startPeriod
  )
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  emit('submit', {
    title: formData.value.title,
    type: formData.value.type,
    day: props.initialData?.day || 'mon',
    start_period: formData.value.startPeriod,
    end_period: formData.value.endPeriod
  })
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl w-full max-w-md mx-4;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
}

.modal-title {
  @apply text-lg font-medium text-gray-900;
}

.close-button {
  @apply text-gray-400 hover:text-gray-500;
}

.modal-body {
  @apply p-4;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-group input,
.form-group select {
  @apply w-full border-gray-300 rounded-md shadow-sm;
  @apply focus:ring-blue-500 focus:border-blue-500;
}

.form-row {
  @apply flex gap-4 mb-4;
}

.my-flex-1 {
  @apply flex-1;
}

.button-group {
  @apply flex justify-end gap-3 mt-6;
}

.cancel-button {
  @apply px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
  @apply hover:bg-gray-50;
}

.submit-button {
  @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md;
  @apply hover:bg-blue-700;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
</style> 