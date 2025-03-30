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
            <option value="" disabled>선택</option>
            <option value="cancel">휴강</option>
            <option value="makeup">보강</option>
            <option value="special">특강</option>
            <option value="event">행사</option>
          </select>
        </div>

        <div class="form-group" v-if="form.event_type === 'cancel'">
          <label>대상 정규 수업</label>
          <select v-model.number="form.timetable_id" required>
            <option value="" disabled>수업 선택</option>
            <option v-for="tt in timetableOptions" :key="tt.id" :value="tt.id">
              {{ tt.day }}요일 / {{ tt.subject_name }} ({{ tt.start_period }}~{{ tt.end_period }}교시)
            </option>
          </select>
        </div>

        <!-- 날짜 또는 요일 -->
        <div class="form-group">
          <label>{{ isRegular ? '요일' : '이벤트 날짜' }}</label>

          <select v-if="isRegular" v-model="form.day" required>
            <option value="" disabled>요일 선택</option>
            <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
          </select>

          <input v-else type="date" v-model="form.event_date" required />
        </div>

        <!-- 교시 -->
        <div class="form-group" v-if="isRegular || requiresPeriods">
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

        <!-- 시간 -->
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
        <div class="form-group" v-if="isRegular">
          <label>강의실</label>
          <input type="text" v-model="form.room" />
        </div>

        <!-- 교수 -->
        <div class="form-group" v-if="isRegular && isAdminOrProfessor">
          <label>담당 교수</label>
          <input type="text" v-model="form.professor_name" placeholder="교수 이름 입력" />
        </div>

        <!-- 설명 -->
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="form.description" rows="2" />
        </div>

        <!-- 액션 -->
        <div class="form-actions">
          <button type="submit" :disabled="loading">
            {{ loading ? '처리 중...' : (isEditMode ? '수정' : '등록') }}
          </button>
          <button type="button" @click="$emit('close')">닫기</button>
          <button v-if="isEditMode" type="button" class="danger" @click="handleDelete" :disabled="loading">
            삭제
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { createTimetable, updateTimetable, deleteTimetable } from '@/services/timetableService'
import { createEvent, updateEvent, deleteEvent } from '@/services/eventService'
import { fetchTimetables } from '@/services/timetableService'

const props = defineProps({
  isOpen: Boolean,
  isEditMode: Boolean,
  initialData: Object,
  year: Number,
  level: String,
  subjects: Array,
  formType: String
})

const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()
const isAdminOrProfessor = computed(() => authStore.role <= 2)
const isRegular = computed(() => props.formType === 'regular')
const isEvent = computed(() => props.formType === 'event')

const days = ['월', '화', '수', '목', '금', '토']
const levels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6']
const loading = ref(false)
const timetableOptions = ref([])

const form = ref({
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
  description: ''
})

const dateModel = computed({
  get() {
    return isRegular.value ? form.value.day : form.value.event_date
  },
  set(value) {
    if (isRegular.value) form.value.day = value
    else form.value.event_date = value
  }
})

const requiresSubject = computed(() => ['cancel', 'makeup', 'special'].includes(form.value.event_type))
const requiresPeriods = computed(() => ['cancel', 'makeup', 'special'].includes(form.value.event_type))
const requiresTime = computed(() => ['makeup', 'special', 'event'].includes(form.value.event_type))
const showSubject = computed(() => isRegular.value || requiresSubject.value)

const title = computed(() => ({
  edit: isRegular.value ? '정규 수업 수정' : '이벤트 수정',
  create: isRegular.value ? '정규 수업 등록' : '이벤트 등록'
}))

watch(() => props.isOpen, (val) => {
  if (!val) resetForm()
})

watch(() => props.initialData, async (val) => {
  if (props.isEditMode && val) {
    form.value = { ...val }

    if (val.event_type === 'cancel') {
      const result = await fetchTimetables(props.year, props.level)
      timetableOptions.value = result
    }
  } else {
    resetForm()
  }
})

function resetForm() {
  form.value = {
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

async function handleSubmit() {
  console.log('🧪 제출 시점 form:', form.value)
  console.log('🧪 form.day:', form.value.day, typeof form.value.day)
  // ✅ 정규 수업
  if (isRegular.value) {
    if (!form.value.subject_id || !form.value.day) {
      return alert("과목과 요일을 입력하세요.")
    }
  }


  // ✅ 이벤트 공통
  if (isEvent.value) {
    const { event_type, event_date, subject_id, timetable_id } = form.value
    if (!event_type || !event_date) {
      return alert("이벤트 유형과 날짜를 선택해주세요.")
    }

    if (event_type === 'cancel' && !timetable_id) {
      return alert("휴강은 정규 수업(timetable_id)을 선택해야 합니다.")
    }

    if (['makeup', 'special'].includes(event_type) && !subject_id) {
      return alert("보강/특강은 과목을 선택해야 합니다.")
    }
  }

  // ✅ 교시 범위
  if (form.value.start_period > form.value.end_period) {
    return alert("교시 범위가 잘못되었습니다.")
  }

  loading.value = true
  try {
    const payload = { ...form.value, year: props.year }

    if (props.isEditMode) {
      await (isRegular.value
          ? updateTimetable(payload.id, payload)
          : updateEvent(payload.id, payload))
    } else {
      await (isRegular.value
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

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  loading.value = true
  try {
    if (isRegular.value) {
      await deleteTimetable(form.value.id)
    } else {
      await deleteEvent(form.value.id)
    }
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
  top: 0; left: 0; right: 0; bottom: 0;
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
