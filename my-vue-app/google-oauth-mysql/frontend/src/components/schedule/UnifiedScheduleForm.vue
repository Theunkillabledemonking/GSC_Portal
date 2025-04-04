<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditMode ? title.edit : title.create }}</h3>

      <form @submit.prevent="handleSubmit">
        <!-- ✅ 과목 -->
        <div class="form-group" v-if="showSubject">
          <label>과목</label>
          <select v-model="form.subject_id" required>
            <option disabled value="">과목 선택</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- ✅ 이벤트 유형 -->
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

        <!-- ✅ 휴강용 수업 선택 -->
        <div class="form-group" v-if="isCancel">
          <label>정규 수업 선택</label>
          <select v-model="form.timetable_id" required>
            <option disabled value="">수업 선택</option>
            <option v-for="tt in timetableOptions" :key="tt.id" :value="tt.id">
              {{ tt.day }} / {{ tt.subject_name }} ({{ tt.start_period }}~{{ tt.end_period }}교시)
            </option>
          </select>
        </div>

        <!-- ✅ 분반 선택 -->
        <div class="form-group" v-if="isSpecial || isEvent">
          <label>분반</label>
          <select v-model="form.group_levels[0]">
            <option disabled value="">선택</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </div>

        <!-- ✅ 요일 or 날짜 -->
        <div class="form-group">
          <label>{{ isEvent ? '이벤트 날짜' : '요일' }}</label>
          <input v-if="isEvent" type="date" v-model="form.event_date" required />
          <select v-else v-model="form.day" required>
            <option disabled value="">요일 선택</option>
            <option v-for="d in days" :key="d">{{ d }}</option>
          </select>
        </div>

        <!-- ✅ 교시 -->
        <div class="form-group" v-if="requiresPeriods">
          <label>교시</label>
          <div class="flex gap-2">
            <select v-model="form.start_period" required>
              <option v-for="n in 9" :key="n" :value="n">{{ n }}</option>
            </select>
            ~
            <select v-model="form.end_period" required>
              <option v-for="n in 9" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- ✅ 시간 -->
        <div v-if="requiresTime" class="form-group">
          <label>시작 시간</label>
          <input type="time" v-model="form.start_time" />
        </div>
        <div v-if="requiresTime" class="form-group">
          <label>종료 시간</label>
          <input type="time" v-model="form.end_time" />
        </div>

        <!-- ✅ 레벨 (이벤트) -->
        <div class="form-group" v-if="isEvent">
          <label>레벨</label>
          <select v-model="form.level">
            <option disabled value="">선택</option>
            <option v-for="lvl in levels" :key="lvl">{{ lvl }}</option>
          </select>
        </div>

        <!-- ✅ 학기 -->
        <div class="form-group" v-if="isRegularOrSpecial">
          <label>학기</label>
          <select v-model="form.semester" required>
            <option value="spring">1학기</option>
            <option value="summer">여름학기</option>
            <option value="fall">2학기</option>
            <option value="winter">겨울학기</option>
          </select>
        </div>

        <!-- ✅ 강의실 -->
        <div class="form-group" v-if="isRegularOrSpecial">
          <label>강의실</label>
          <input type="text" v-model="form.room" />
        </div>

        <!-- ✅ 교수 -->
        <div class="form-group" v-if="isRegularOrSpecial && isAdminOrProfessor">
          <label>담당 교수</label>
          <input type="text" v-model="form.professor_name" />
        </div>

        <!-- ✅ 설명 -->
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="form.description" rows="2" />
        </div>

        <!-- ✅ 버튼 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? '처리 중...' : (isEditMode ? '수정' : '등록') }}
          </button>
          <button type="button" @click="$emit('close')">닫기</button>
          <button
              v-if="isEditMode"
              type="button"
              class="danger"
              @click="handleDelete"
              :disabled="loading"
          >
            삭제
          </button>
        </div>
      </form>
    </div>
  </div>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/authStore'
import {
  fetchTimetables,
  fetchSpecialLectures,
  createTimetable,
  updateTimetable,
  deleteTimetable
} from '@/services/timetableService'
import {
  createEvent,
  updateEvent,
  deleteEvent
} from '@/services/eventService'

// ✅ props / emits
const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
  level: String,
  subjects: Array,
  formType: String,
  groupLevel: String
})

const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()
const isAdminOrProfessor = computed(() => authStore.role <= 2)

// ✅ 상태
const form = ref({})
const loading = ref(false)
const timetableOptions = ref([])

// ✅ 타입 정의
const isRegular = computed(() => props.formType === 'regular')
const isSpecial = computed(() => props.formType === 'special')
const isEvent = computed(() => props.formType === 'event')
const isCancel = computed(() => form.value.event_type === 'cancel')
const isRegularOrSpecial = computed(() => isRegular.value || isSpecial.value)

const days = ['월', '화', '수', '목', '금', '토']
const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']

// ✅ 유틸 computed
const requiresSubject = computed(() =>
    ['makeup', 'special'].includes(form.value.event_type) || isRegularOrSpecial.value
)
const requiresPeriods = computed(() =>
    isRegularOrSpecial.value || ['cancel', 'makeup', 'event', 'special'].includes(form.value.event_type)
)
const requiresTime = computed(() =>
    ['special', 'event'].includes(form.value.event_type)
)
const showSubject = computed(() =>
    requiresSubject.value && form.value.event_type !== 'cancel'
)

const title = computed(() => ({
  edit: isRegularOrSpecial.value ? '수업 수정' : '이벤트 수정',
  create: isRegularOrSpecial.value ? '수업 등록' : '이벤트 등록'
}))

// ✅ 초기화
function resetForm() {
  form.value = {
    id: null,
    subject_id: '',
    event_type: '',
    day: '',
    event_date: '',
    start_period: 1,
    end_period: 1,
    start_time: '',
    end_time: '',
    semester: '',
    room: '',
    professor_name: '',
    level: props.level || '',
    group_levels: props.groupLevel ? [props.groupLevel] : [],
    timetable_id: '',
    description: ''
  }
}

// ✅ 초기 데이터 적용
watch(() => props.initialData, async (val) => {
  if (props.isEditMode && val) {
    form.value = {
      ...val,
      group_levels: val.group_levels ?? []
    }
    if (val.event_type === 'cancel') {
      timetableOptions.value = await fetchTimetables(props.year, val.semester, val.level)
    }
  } else {
    resetForm()
  }
})

// ✅ 모달 닫을 때 초기화
watch(() => props.isOpen, (val) => {
  if (!val) resetForm()
})

// ✅ 이벤트 유형 변경 감지
watch(() => form.value.event_type, async (type) => {
  if (type === 'cancel') {
    if (form.value.semester && form.value.level) {
      timetableOptions.value = await fetchTimetables(props.year, form.value.semester, form.value.level)
    }
  } else {
    form.value.timetable_id = ''
  }
})

// ✅ 휴강 시, 선택된 정규 수업 정보 가져와 자동 채움
watch(() => form.value.timetable_id, (id) => {
  const selected = timetableOptions.value.find(t => t.id === id)
  if (selected && form.value.event_type === 'cancel') {
    Object.assign(form.value, {
      subject_id: selected.subject_id,
      level: selected.level,
      semester: selected.semester,
      start_period: selected.start_period,
      end_period: selected.end_period
    })
  }
})

// ✅ 저장
async function handleSubmit() {
  const payload = {
    ...form.value,
    year: props.year,
    group_levels: form.value.group_levels?.filter(Boolean) ?? null
  }

  if (form.value.start_period > form.value.end_period) {
    return alert('교시 범위가 올바르지 않습니다.')
  }

  // 🔍 유효성 검사
  if (isEvent.value) {
    if (!form.value.event_type || !form.value.event_date) return alert('이벤트 유형과 날짜 필수입니다.')
    if (form.value.event_type === 'cancel' && !form.value.timetable_id) return alert('정규 수업을 선택하세요.')
    if (['makeup', 'special'].includes(form.value.event_type) && !form.value.subject_id) {
      return alert('과목을 선택하세요.')
    }
  }

  if (isRegularOrSpecial.value && (!form.value.subject_id || !form.value.day)) {
    return alert('과목과 요일을 입력하세요.')
  }

  loading.value = true
  try {
    if (isSpecial.value) payload.is_special_lecture = 1

    const result = props.isEditMode
        ? isRegularOrSpecial.value
            ? await updateTimetable(payload.id, payload)
            : await updateEvent(payload.id, payload)
        : isRegularOrSpecial.value
            ? await createTimetable(payload)
            : await createEvent(payload)

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('❌ 저장 실패:', error)
    alert('저장 중 오류 발생')
  } finally {
    loading.value = false
  }
}

// ✅ 삭제
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  loading.value = true
  try {
    await (isRegularOrSpecial.value
        ? deleteTimetable(form.value.id)
        : deleteEvent(form.value.id))
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('❌ 삭제 실패:', error)
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