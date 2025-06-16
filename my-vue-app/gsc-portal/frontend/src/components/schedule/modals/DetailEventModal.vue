<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">수업 상세 정보</h3>
        <button
          class="close-button"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div v-if="!hasEvents" class="no-events">
          표시할 수업이 없습니다.
        </div>
        <div
          v-else
          v-for="event in events"
          :key="event.id"
          class="event-item"
          :style="{ borderColor: event.color }"
        >
          <div class="event-header">
            <h4 class="event-title">{{ event.title || event.subject_name || '제목 없음' }}</h4>
            <span
              class="event-status"
              :class="{ 'is-cancelled': event.status === 'cancelled' || event.type === 'cancel' || event.event_type === 'cancel' }"
            >
              {{ event.status === 'cancelled' || event.type === 'cancel' || event.event_type === 'cancel' ? '휴강' : getEventTypeText(event.type || event.event_type || 'regular') }}
            </span>
          </div>

          <div class="event-info">
            <div class="info-row">
              <span class="info-label">교시</span>
              <span class="info-value">
                {{ event.start_period }}~{{ event.end_period }}교시
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">상태</span>
              <span class="info-value">
                {{ event.status === 'cancelled' || event.type === 'cancel' || event.event_type === 'cancel' ? '휴강' : '정상' }}
              </span>
            </div>
          </div>

          <div class="event-actions">
            <button
              v-if="event.status !== 'cancelled' && event.type !== 'cancel' && event.event_type !== 'cancel'"
              class="edit-button"
              @click="emit('edit', event)"
            >
              수정
            </button>
            <button
              v-if="event.status !== 'cancelled' && event.type !== 'cancel' && event.event_type !== 'cancel'"
              class="cancel-button"
              @click="emit('cancel', event)"
            >
              휴강 처리
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-button-footer" @click="emit('close')">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['close', 'cancel', 'edit'])

const getEventTypeText = (type) => {
  switch (type) {
    case 'regular':
      return '정규'
    case 'special':
      return '특강'
    case 'makeup':
      return '보강'
    case 'holiday':
      return '공휴일'
    default:
      return ''
  }
}

const hasEvents = computed(() => {
  return Array.isArray(props.events) && props.events.length > 0
})
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
  @apply p-4 space-y-4;
}

.no-events {
  @apply py-8 text-center text-gray-500;
}

.event-item {
  @apply p-4 rounded-lg border-2;
}

.event-header {
  @apply flex items-center justify-between mb-4;
}

.event-title {
  @apply text-lg font-medium;
}

.event-status {
  @apply px-2 py-1 text-sm rounded-full;
  @apply bg-blue-100 text-blue-800;
}

.event-status.is-cancelled {
  @apply bg-red-100 text-red-800;
}

.event-info {
  @apply space-y-2;
}

.info-row {
  @apply flex items-center text-sm;
}

.info-label {
  @apply w-20 text-gray-500;
}

.info-value {
  @apply flex-1;
}

.event-actions {
  @apply mt-4 flex justify-end gap-2;
}

.edit-button {
  @apply px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded;
  @apply hover:bg-blue-50;
}

.cancel-button {
  @apply px-3 py-1 text-sm text-red-600 border border-red-600 rounded;
  @apply hover:bg-red-50;
}

.modal-footer {
  @apply p-4 border-t flex justify-end;
}

.close-button-footer {
  @apply px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300;
}
</style>