<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? title.edit : title.create }}</h3>

      <form @submit.prevent="handleSubmit">
        <!-- 과목 선택 -->
        <div class="form-group" v-if="showSubject">
          <label>과목</label>
          <select v-model.number="form.subject_id" required>
            <option value="" disabled>과목 선택</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 이벤트 유형 -->
        <div class="form-group" v-if="isEvent">
          <label>이벤트 유형</label>
          <select v-model="form.event_type" required>
            <option disabled value="">선택</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
            <option value="event">행사</option>
          </select>
        </div>

        <!-- 휴강 시 수업 선택 -->
        <div class="form-group" v-if="form.event_type === 'cancel'">
          <label>대상 정규 수업</label>
          <select v-model.number="form.timetable_id" required>
            <option value="" disabled>수업 선택</option>
            <option v-for="tt in timetableOptions" :key="tt.id" :value="tt.id">
              {{ tt.day }} / {{ tt.subject_name }} ({{ tt.start_period }}~{{ tt.end_period }}교시)
            </option>
          </select>
        </div>

        <!-- 요일/날짜 선택 -->
        <div class="form-group">
          <label>{{ isEvent ? '이벤트 날짜' : '요일' }}</label>
          <input v-if="isEvent" type="date" v-model="form.event_date" required />
          <select v-else v-model="form.day" required>
            <option disabled value="">요일 선택</option>
            <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <!-- 교시 선택 -->
        <div class="form-group" v-if="isRegularOrSpecial || requiresPeriods">
          <label>교시</label>
          <div class="flex gap-2">
            <select v-model="form.start_period" required>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            ~
            <select v-model="form.end_period" required>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- 시간 (보강/이벤트용) -->
        <div class="form-group" v-if="requiresTime">
          <label>시작 시간</label>
          <input type="time" v-model="form.start_time" />
        </div>
        <div class="form-group" v-if="requiresTime">
          <label>종료 시간</label>
          <input type="time" v-model="form.end_time" />
        </div>

        <!-- 레벨 -->
        <div class="form-group" v-if="isEvent">
          <label>레벨</label>
          <select v-model="form.level">
            <option disabled value="">선택</option>
            <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
          </select>
        </div>

        <!-- 강의실 -->
        <div class="form-group" v-if="isRegularOrSpecial">
          <label>강의실</label>
          <input type="text" v-model="form.room" />
        </div>

        <!-- 교수 -->
        <div class="form-group" v-if="isRegularOrSpecial && isAdminOrProfessor">
          <label>담당 교수</label>
          <input type="text" v-model="form.professor_name" />
        </div>

        <!-- 설명 -->
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="form.description" rows="2" />
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? '처리 중...' : (isEditMode ? '수정' : '등록') }}
          </button>
          <button type="button" @click="$emit('close')">닫기</button>
          <button v-if="isEditMode" type="button" class="danger" @click="handleDelete" :disabled="loading">삭제</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/authStore.js'
import {
  createTimetable, updateTimetable, deleteTimetable, fetchTimetables
} from '@/services/timetableService.js'
import {
  createEvent, updateEvent, deleteEvent
} from '@/services/eventService.js'

// Props & Emits
const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
  level: String,
  subjects: Array,
  formType: String // 'regular', 'special', 'event'
})
const emit = defineEmits(['close', 'saved'])

// 사용자 상태
const authStore = useAuthStore()
const isAdminOrProfessor = computed(() => authStore.role <= 2)

// 분기 처리
const isRegular = computed(() => props.formType === 'regular')
const isSpecial = computed(() => props.formType === 'special')
const isEvent = computed(() => props.formType === 'event')
const isRegularOrSpecial = computed(() => isRegular.value || isSpecial.value)

// 고정 값
const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const days = ['월', '화', '수', '목', '금', '토']

// 내부 상태
const loading = ref(false)
const timetableOptions = ref([])
const form = ref({})

// 조건부 렌더링
const requiresSubject = computed(() =>
    ['cancel', 'makeup', 'special'].includes(form.value.event_type)
)
const requiresPeriods = computed(() =>
    ['cancel', 'makeup', 'special'].includes(form.value.event_type)
)
const requiresTime = computed(() =>
    ['makeup', 'special', 'event'].includes(form.value.event_type)
)
const showSubject = computed(() =>
    isRegularOrSpecial.value || (requiresSubject.value && form.value.event_type !== 'cancel')
)

// 타이틀
const title = computed(() => ({
  edit: isRegularOrSpecial.value ? '수업 수정' : '이벤트 수정',
  create: isRegularOrSpecial.value ? '수업 등록' : '이벤트 등록'
}))

// 초기화
function resetForm() {
  form.value = {
    id: null,
    subject_id: '',
    day: '',
    event_date: '',
    start_period: 1,
    end_period: 1,
    start_time: '',
    end_time: '',
    level: props.level || '',
    room: '',
    professor_name: '',
    event_type: '',
    timetable_id: '',
    description: ''
  }
}

// 수정 시 데이터 복사
watch(() => props.initialData, async (val) => {
  if (props.isEditMode && val) {
    form.value = { ...val }
    if (val.event_type === 'cancel') {
      timetableOptions.value = await fetchTimetables(props.year, props.level)
    }
  } else {
    resetForm()
  }
})

// open 상태 바뀔 때 초기화
watch(() => props.isOpen, (val) => {
  if (!val) resetForm()
})

// 휴강 이벤트 선택 시 수업 로드
watch(() => form.value.event_type, async (type) => {
  if (type === 'cancel') {
    timetableOptions.value = await fetchTimetables(props.year, props.level)
  } else {
    form.value.timetable_id = ''
  }
})

// 휴강 선택한 수업 자동 채움
watch(() => form.value.timetable_id, (id) => {
  const selected = timetableOptions.value.find(t => t.id === id)
  if (form.value.event_type === 'cancel' && selected) {
    form.value.subject_id = selected.subject_id
    form.value.level = selected.level
    form.value.start_period = selected.start_period
    form.value.end_period = selected.end_period
  }
})

// 저장 처리
async function handleSubmit() {
  const payload = { ...form.value, year: props.year }

  // 유효성 체크
  if (isRegularOrSpecial.value && (!form.value.subject_id || !form.value.day)) {
    return alert('과목과 요일을 입력하세요.')
  }
  if (form.value.start_period > form.value.end_period) {
    return alert('교시 범위가 올바르지 않습니다.')
  }
  if (isEvent.value) {
    if (!form.value.event_type || !form.value.event_date) return alert('이벤트 유형과 날짜 필수입니다.')
    if (form.value.event_type === 'cancel' && !form.value.timetable_id) return alert('정규 수업을 선택하세요.')
    if (['makeup', 'special'].includes(form.value.event_type) && !form.value.subject_id) {
      return alert('과목을 선택하세요.')
    }
  }

  loading.value = true
  try {
    // 특강이면 플래그 추가
    if (isSpecial.value) payload.is_special_lecture = 1

    if (props.isEditMode) {
      await (isRegularOrSpecial.value
          ? updateTimetable(payload.id, payload)
          : updateEvent(payload.id, payload))
    } else {
      await (isRegularOrSpecial.value
          ? createTimetable(payload)
          : createEvent(payload))
    }

    emit('saved')
    emit('close')
  } catch (err) {
    console.error('❌ 저장 실패', err)
    alert('저장 중 오류 발생')
  } finally {
    loading.value = false
  }
}

// 삭제
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  loading.value = true
  try {
    await (isRegularOrSpecial.value
        ? deleteTimetable(form.value.id)
        : deleteEvent(form.value.id))
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('❌ 삭제 실패', err)
    alert('삭제 중 오류 발생')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  width: 420px;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
}
input, select, textarea {
  width: 100%;
  padding: 6px;
}
.form-actions {
  display: flex;
  justify-content: space-between;
}
.danger {
  background-color: crimson;
  color: white;
}
</style>
