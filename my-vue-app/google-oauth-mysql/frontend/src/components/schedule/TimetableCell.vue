<template>
  <div 
    class="timetable-cell"
    :class="[cellClasses, { 'hover': isHovered }]"
    :data-level="mainEvent && mainEvent.level"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @dragend="handleDragEnd"
    @mouseenter="handleMouseEnter"
    @mouseleave="isHovered = false"
    :draggable="hasEvents && mainEvent && (['regular', 'special'].includes(getEventType(mainEvent) || ''))"
    :title="getTooltipText"
  >
    <!-- If it's a holiday -->
    <div v-if="isCellHoliday" class="holiday-indicator" :title="holidayName">
      <div class="holiday-icon">🗓️</div>
      <span class="holiday-text">공휴일</span>
    </div>
    
    <!-- If it has events -->
    <template v-else-if="hasEvents && mainEvent">
      <!-- Main event display -->
      <div class="event-main" :class="{'has-multiple': eventCount > 1}">
        <div class="event-title">{{ mainEvent?.title || mainEvent?.subject_name || '미지정 과목' }}</div>
        <div class="event-details">
          <span class="event-professor">{{ getEffectiveProfessorName(mainEvent) }}</span>
          <span class="event-room">{{ getEffectiveRoom(mainEvent) }}</span>
        </div>
        
        <!-- Additional event count -->
        <div v-if="eventCount > 1" class="event-count" :class="{'has-tooltip': isHovered}">
          <span class="event-count-badge">+{{ eventCount - 1 }}</span>
          <span class="event-count-text">더보기</span>
        </div>
        
        <!-- Status indicator for canceled events -->
        <div v-if="isCanceledEvent" class="event-status canceled">
          휴강
        </div>
      </div>

      <!-- Multi-event tooltip -->
      <div 
        v-if="isHovered && eventCount > 1" 
        class="events-tooltip"
        :class="{ 'tooltip-right': tooltipPosition === 'right', 'tooltip-left': tooltipPosition === 'left', 'tooltip-bottom': tooltipPosition === 'bottom' }"
      >
        <div class="tooltip-header">이벤트 목록 ({{ eventCount }}개)</div>
        <div v-for="(event, index) in sortedEvents" :key="index" class="tooltip-event">
          <div class="tooltip-event-type" :class="getEventTypeClass(event)">
            [{{ getEventTypeLabel(event) }}]
          </div>
          <div class="tooltip-event-title">{{ event?.title || event?.subject_name || '미지정 과목' }}</div>
          <div class="tooltip-event-details">
            <span class="tooltip-professor">{{ getEffectiveProfessorName(event) }}</span>
            <span class="tooltip-room" v-if="getEffectiveRoom(event)">/ {{ getEffectiveRoom(event) }}</span>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Empty cell -->
    <template v-else>
      <div class="empty-cell-content"></div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 상수를 직접 정의
const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

// Props definition
const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  day: {
    type: String,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  allowDrop: {
    type: Boolean,
    default: false
  },
  isDragTarget: {
    type: Boolean,
    default: false
  },
  isDragging: {
    type: Boolean,
    default: false
  },
  dayIndex: {
    type: Number,
    default: 0
  },
  timeIndex: {
    type: Number,
    default: 0
  }
})

// Drag & Auth 관련 로컬 상태 
const isDraggingLocal = ref(false)
const dragData = ref(null)
const isAdmin = ref(false) // 관리자 권한은 부모에서 받아오거나 이벤트로 확인

// Emits definition
const emit = defineEmits(['click', 'dragstart', 'dragover', 'dragend', 'cell-click', 'dragStart', 'drop'])

// Reactive state
const isHovered = ref(false)

// 툴팁 위치 계산
const tooltipPosition = ref('right') // 기본값은 오른쪽

// Event type priorities
const EVENT_TYPE_PRIORITIES = {
  holiday: 0,    // 최우선 (공휴일)
  cancel: 1,     // 휴강
  makeup: 2,     // 보강
  special: 3,    // 특강
  event: 4,      // 기타 이벤트
  regular: 5     // 정규 수업
}

/**
 * 유효한 이벤트 목록 (null, undefined 제거)
 */
const validEvents = computed(() => {
  if (!props.events || !Array.isArray(props.events)) {
    return []
  }
  
  // 이벤트 필터링
  const filteredEvents = props.events.filter(event => !!event);
  
  // 휴강이 있는지 확인
  const hasCancel = filteredEvents.some(event => 
    event && (event.type === 'cancel' || event.event_type === 'cancel' || event.status === 'canceled')
  );
  
  // 휴강이 있으면 정규 수업 제외
  if (hasCancel) {
    return filteredEvents.filter(event => {
      // 정규 수업이면 제외
      if ((!event.type || event.type === 'regular') && 
          (!event.event_type || event.event_type === 'regular')) {
        // 같은 과목의 정규 수업만 제외
        return false;
      }
      return true;
    });
  }
  
  return filteredEvents;
})

/**
 * 안전하게 이벤트 타입을 확인하는 함수
 */
function getEventType(event) {
  if (!event) return ''
  
  // 명시적 타입 필드 우선 확인
  if (typeof event === 'object' && event !== null) {
    // 공휴일
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      return 'holiday'
    }
    
    // 휴강
    if (event.type === 'cancel' || event.event_type === 'cancel' || event.status === 'canceled') {
      return 'cancel'
    }
    
    // 보강
    if (event.type === 'makeup' || event.event_type === 'makeup' || 
        (event.timetable_id && (event.type === 'temporary' || event.event_type === 'temporary'))) {
      return 'makeup'
    }
    
    // 특강
    if (event.is_special_lecture === true || 
        event.is_special_lecture === 1 || 
        String(event.is_special_lecture) === '1' ||
        event.type === 'special' || 
        event.event_type === 'special' || 
        (event.level && String(event.level).startsWith('N'))) {
      return 'special'
    }
    
    // 기타 이벤트 타입이 명시적으로 있는 경우
    if (event.type) return event.type
    if (event.event_type) return event.event_type
  }
  
  // 기본값
  return 'regular'
}

/**
 * 공휴일 이벤트 체크
 */
const holidayEvent = computed(() => {
  if (validEvents.value.length === 0) return null
  
  return validEvents.value.find(event => {
    if (!event) return false
    const eventType = getEventType(event)
    return eventType === 'holiday'
  }) || null
})

// 공휴일 이벤트가 있는지 확인
const hasHolidayEvent = computed(() => !!holidayEvent.value)

// 공휴일 여부 (prop 또는 이벤트 기반)
const isCellHoliday = computed(() => props.isHoliday || hasHolidayEvent.value)

// 공휴일 이름 가져오기
const holidayName = computed(() => {
  if (props.isHoliday) return '공휴일'
  
  const event = holidayEvent.value
  if (event && typeof event === 'object') {
    return event.title || event.name || event.subject_name || '공휴일'
  }
  return '공휴일'
})

/**
 * 이벤트 타입별 정렬 후 메인 이벤트 선택
 */
const sortedEvents = computed(() => {
  if (!validEvents.value.length) return []
  
  return [...validEvents.value].sort((a, b) => {
    const typeA = getEventType(a)
    const typeB = getEventType(b)
    
    // 타입에 따른 우선순위
    const priorityA = EVENT_TYPE_PRIORITIES[typeA] !== undefined 
      ? EVENT_TYPE_PRIORITIES[typeA] 
      : EVENT_TYPE_PRIORITIES['regular']
      
    const priorityB = EVENT_TYPE_PRIORITIES[typeB] !== undefined 
      ? EVENT_TYPE_PRIORITIES[typeB] 
      : EVENT_TYPE_PRIORITIES['regular']
      
    return priorityA - priorityB
  })
})

// 메인 이벤트 (가장 우선순위가 높은 것)
const mainEvent = computed(() => {
  if (!props.events || props.events.length === 0) return null;
  
  // 이벤트가 있으면 첫번째 이벤트 반환 (우선순위 정렬 후)
  const firstEvent = props.events[0];
  
  // 디버깅 - 셀에 표시되는 특강 로깅
  if (firstEvent && (firstEvent.type === 'special' || firstEvent.event_type === 'special' || firstEvent.is_special_lecture)) {
    console.log(`🎯 특강 셀 렌더링: ${firstEvent.subject_name || firstEvent.title}, 요일=${props.dayIndex}, 교시=${props.timeIndex}, 타입=${firstEvent.type || firstEvent.event_type}, 레벨=${firstEvent.level || 'N/A'}`);
  }
  
  return firstEvent;
})

// 이벤트 갯수
const eventCount = computed(() => validEvents.value.length)

// 이벤트가 있는지 여부
const hasEvents = computed(() => eventCount.value > 0)

// 취소된 이벤트인지 확인
const isCanceledEvent = computed(() => {
  if (!mainEvent.value) return false
  const eventType = getEventType(mainEvent.value)
  return eventType === 'cancel'
})

// 이벤트 타입 텍스트 반환
function getEventTypeText(event) {
  if (!event) return ''
  
  const eventType = getEventType(event)
  
  switch(eventType) {
    case 'regular': return '정규 수업'
    case 'special': 
      // 특강의 경우 레벨 정보 추가
      if (event.level && event.level.includes('N')) {
        return `특강 (${event.level})`
      }
      return '특강'
    case 'makeup': return '보강'
    case 'cancel': return '휴강'
    case 'holiday': return '공휴일'
    default: return ''
  }
}

// 추가된 함수: 교수명 가져오기 (상속 적용)
const getEffectiveProfessorName = (event) => {
  if (!event) return '미지정'
  
  console.log(`[${event.id}] 교수명 상속 체크:`, {
    inherit_attributes: event.inherit_attributes,
    professor_name: event.professor_name,
    professor: event.professor,
    inherited_professor_name: event.inherited_professor_name
  });
  
  // inherit_attributes가 1이고 inherited_professor_name이 있으면 상속값 사용
  if (event.inherit_attributes === 1 && event.inherited_professor_name) {
    return event.inherited_professor_name
  }
  
  // 그렇지 않으면 자체 교수명 사용
  return event.professor_name || event.professor || '미지정'
}

// 추가된 함수: 강의실 가져오기 (상속 적용)
const getEffectiveRoom = (event) => {
  if (!event) return '미지정'
  
  console.log(`[${event.id}] 강의실 상속 체크:`, {
    inherit_attributes: event.inherit_attributes,
    room: event.room,
    inherited_room: event.inherited_room
  });
  
  // inherit_attributes가 1이고 inherited_room이 있으면 상속값 사용
  if (event.inherit_attributes === 1 && event.inherited_room) {
    return event.inherited_room
  }
  
  // 그렇지 않으면 자체 강의실 사용
  return event.room || '미지정'
}

// 툴팁 텍스트 생성
const getTooltipText = computed(() => {
  if (isCellHoliday.value) {
    return holidayName.value
  }
  
  if (hasEvents.value && mainEvent.value) {
    const event = mainEvent.value
    if (typeof event !== 'object' || event === null) return ''
    
    const title = event.title || event.subject_name || '미지정 과목'
    const professor = getEffectiveProfessorName(event)
    const room = getEffectiveRoom(event)
    const type = getEventTypeText(event)
    
    return `${title} (${professor}, ${room})\n${type}`
  }
  
  return ''
})

// 셀 클래스 계산
const cellClasses = computed(() => {
  if (isCellHoliday.value) return 'holiday-cell'
  
  if (!hasEvents.value) return 'empty-cell'
  
  // 메인 이벤트가 없으면 빈 셀로 처리
  if (!mainEvent.value) return 'empty-cell'
  
  // 이벤트 타입 확인
  const eventType = getEventType(mainEvent.value)
  
  // 이벤트 타입별 스타일 적용
  switch(eventType) {
    case 'holiday':
      return 'holiday-cell'
    case 'cancel':
      return 'canceled-event'
    case 'makeup':
      return 'makeup-event'
    case 'special':
      return 'special-event'
    case 'regular':
      return 'regular-event'
    default:
      return 'event-default'
  }
})

// 셀 클릭 핸들러
const handleClick = () => {
  // dayIndex와 timeIndex가 있으면 해당 정보로 이벤트 발생 (새 구조)
  if (props.dayIndex !== undefined && props.timeIndex !== undefined) {
    emit('cell-click', {
      dayIndex: props.dayIndex,
      timeIndex: props.timeIndex,
      hasEvents: hasEvents.value,
      events: sortedEvents.value,
      isHoliday: isCellHoliday.value
    })
  } else {
    // 기존 방식 유지
    emit('click', {
      day: props.day,
      period: props.period,
      events: sortedEvents.value,
      isHoliday: isCellHoliday.value
    })
  }
}

// 드래그 시작 핸들러
const handleDragStart = (event) => {
  // 공휴일이거나 휴강인 경우 드래그 불가능
  if (isCellHoliday.value || isCanceledEvent.value) {
    event.preventDefault()
    return
  }
  
  if (props.dayIndex !== undefined) {
    emit('dragStart', {
      dayIndex: props.dayIndex,
      timeIndex: props.timeIndex,
      events: sortedEvents.value,
      mainEvent: mainEvent.value
    })
  } else {
    emit('dragstart', {
      day: props.day,
      period: props.period,
      event,
      mainEvent: mainEvent.value
    })
  }
}

// 드래그 오버 핸들러
const handleDragOver = (e) => {
  // 공휴일이면 드래그 오버 불가
  if (isCellHoliday.value) {
    return
  }
  
  if (props.allowDrop) {
    e.preventDefault()
    emit('dragover', {
      day: props.day,
      period: props.period,
      hasEvents: hasEvents.value
    })
  }
}

// 드래그 엔드 핸들러
const handleDragEnd = () => {
  emit('dragend', {
    day: props.day,
    period: props.period,
    events: sortedEvents.value
  })
}

// 첫 번째 이벤트에 대한 추가 디버깅 로그 (컴포넌트 마운트 시)
onMounted(() => {
  if (props.events && props.events.length > 0) {
    const firstEvent = props.events[0];
    console.log('📌 TimetableCell - 첫 번째 이벤트 상세 정보:', {
      id: firstEvent.id,
      type: firstEvent.type || firstEvent.event_type,
      title: firstEvent.title || firstEvent.subject_name,
      timetable_id: firstEvent.timetable_id,
      inherit_attributes: firstEvent.inherit_attributes,
      professor_name: firstEvent.professor_name,
      professor: firstEvent.professor,
      inherited_professor_name: firstEvent.inherited_professor_name,
      room: firstEvent.room,
      inherited_room: firstEvent.inherited_room,
      effective_professor: getEffectiveProfessorName(firstEvent),
      effective_room: getEffectiveRoom(firstEvent),
      day: firstEvent.day,
      year: firstEvent.year,
      grade: firstEvent.grade,
      level: firstEvent.level,
      start_period: firstEvent.start_period,
      end_period: firstEvent.end_period,
      date: firstEvent.date || firstEvent.event_date
    });
  }

  // 디버깅 로그 - 특강 확인
  console.log(`📋 셀(${props.dayIndex}, ${props.timeIndex}) 이벤트 개수: ${props.events?.length || 0}`);
  if (props.events && props.events.length > 0) {
    const specialEvents = props.events.filter(e => 
      e.type === 'special' || 
      e.event_type === 'special' || 
      e.is_special_lecture === 1 || 
      e.is_special_lecture === true
    );
    
    if (specialEvents.length > 0) {
      console.log(`✨ 특강 이벤트 발견됨 (${specialEvents.length}개):`, 
        specialEvents.map(e => ({
          id: e.id,
          title: e.subject_name || e.title,
          level: e.level,
          start_period: e.start_period,
          end_period: e.end_period,
          day: e.day,
          date: e.date || e.event_date,
          year: e.year,
          grade: e.grade,
          is_special_lecture: e.is_special_lecture,
          semester: e.semester
        }))
      );
      
      console.log('📊 특강 렌더링 조건 체크:')
      specialEvents.forEach(e => {
        console.log(`  - 특강 "${e.subject_name || e.title}":`)
        console.log(`    • day: ${e.day || '없음'} (필요: 요일 정보)`)
        console.log(`    • date: ${e.date || e.event_date || '없음'} (필요: 날짜 범위 내)`)
        console.log(`    • level: ${e.level || '없음'} (레벨 필터링 정보)`)
        console.log(`    • start_period: ${e.start_period || '없음'} → 렌더링 셀: (${props.dayIndex}, ${props.timeIndex})`)
        console.log(`    • semester: ${e.semester || '없음'} (필요: spring)`)
        console.log(`    • is_special_lecture: ${e.is_special_lecture ? '✅' : '❌'} (필요: true)`)
      });
    }
  }
})

// 이벤트 타입 레이블 (툴팁 표시용)
const getEventTypeLabel = (event) => {
  const type = getEventType(event)
  
  // 특강인 경우 JLPT 레벨 표시
  if (type === 'special' && event.level) {
    return `특강 ${event.level || ''}`
  }
  
  const typeLabels = {
    'regular': '정규',
    'special': '특강',
    'makeup': '보강',
    'cancel': '휴강',
    'holiday': '공휴일',
    'event': '이벤트'
  }
  
  return typeLabels[type] || '기타'
}

// Helper function to get CSS class for event type
const getEventTypeClass = (event) => {
  const type = getEventType(event)
  return `event-type-${type}`
}

// 마우스 엔터 시 툴팁 위치 결정
const handleMouseEnter = (event) => {
  isHovered.value = true
  
  // 요소의 위치 정보 가져오기
  const rect = event.target.getBoundingClientRect()
  const tooltipWidth = 250 // 툴팁 너비 (CSS에 정의된 값과 동일하게 유지)
  
  // 화면 너비와 비교하여 위치 결정
  const screenWidth = window.innerWidth
  const rightSpace = screenWidth - rect.right
  
  // 위치 결정 로직
  if (rightSpace < tooltipWidth + 20) {
    // 오른쪽 공간이 부족하면 왼쪽에 표시
    tooltipPosition.value = 'left'
  } else {
    // 충분한 공간이 있으면 오른쪽에 표시
    tooltipPosition.value = 'right'
  }
  
  // 상단에 공간이 부족하면 하단에 표시
  if (rect.top < 150) {
    tooltipPosition.value = 'bottom'
  }
  
  // Cell position based positioning
  const day = props.dayIndex;
  const period = props.timeIndex;
  
  // Apply positioning based on edge cases
  if (day >= 4) tooltipPosition.value = 'left'; // Right edge cells
  if (period >= 9) tooltipPosition.value = 'bottom'; // Bottom edge cells
}

// 이벤트 색상 결정
const cellColor = computed(() => {
  if (!mainEvent.value) return 'transparent';
  if (props.isHoliday) return '#fee2e2'; // 공휴일 - 빨간색 배경
  
  const event = mainEvent.value;
  const type = event.type || event.event_type;
  
  // 특강은 눈에 띄게 보라색으로 표시
  if (type === 'special' || event.is_special_lecture === 1 || event.is_special_lecture === true) {
    return '#c4b5fd'; // 보라색 (특강)
  }
  
  // 다른 이벤트 타입에 따른 색상
  switch (type) {
    case 'cancel': return '#fecaca'; // 휴강 - 연한 빨간색
    case 'makeup': return '#bfdbfe'; // 보강 - 연한 파란색
    case 'event': return '#fef08a'; // 일반 이벤트 - 연한 노란색
    case 'holiday': return '#fee2e2'; // 공휴일 - 연한 빨간색
    default: return '#e5e7eb'; // 기본 - 회색
  }
});

const isFirstEventOfDay = (cellEvents = []) => {
  if (!cellEvents.length) return false;
  const firstEvent = cellEvents[0];
  return firstEvent && hasId(firstEvent) && firstEvent.start_period === 1;
};

const showEvent = computed(() => {
  if (!props.events || props.events.length === 0) return null;
  return props.events[0];
});

const hasMultipleEvents = computed(() => {
  return props.events && props.events.length > 1;
});

const eventTypeDisplay = computed(() => {
  if (!showEvent.value) return '';
  
  const type = showEvent.value.type || '';
  
  if (type === 'cancel') return '취소';
  if (type === 'makeup') return '보강';
  if (type === 'special') return '특강';
  if (type === 'holiday') return '휴일';
  return '';
});

const hasId = (event) => {
  return event && (event.id !== undefined || event.timetable_id !== undefined);
};

const getEventTitle = (event) => {
  if (!event) return '';
  return event.title || event.subject_name || '';
};

const tooltipEvents = computed(() => {
  return props.events && props.events.length > 0 ? props.events : [];
});

const additionalEventCount = computed(() => {
  return Math.max(0, eventCount.value - 1);
});

const hasTooltip = computed(() => {
  return hasMultipleEvents.value || (showEvent.value && showEvent.value.description);
});

const eventColor = computed(() => {
  if (!showEvent.value) return '#e5e7eb'; // Default gray
  
  const event = showEvent.value;
  
  // 특강인 경우 레벨별 다른 색상 적용
  if (event.type === 'special' || event.event_type === 'special' || event.is_special_lecture) {
    if (event.level === 'N1') {
      return '#c7d2fe'; // 연한 인디고 (N1)
    } else if (event.level === 'N2') {
      return '#ddd6fe'; // 연한 보라색 (N2)
    } else if (event.level === 'N3') {
      return '#e9d5ff'; // 연한 자주색 (N3)
    }
    return '#d8b4fe'; // 기본 보라색 (특강)
  }
  
  if (!event.type) return '#e5e7eb';
  
  switch (event.type) {
    case 'regular':
      return '#dcfce7'; // Light green
    case 'makeup':
      return '#ffedd5'; // Light orange
    case 'cancel':
      return '#fee2e2'; // Light red
    case 'holiday':
      return '#f3e8ff'; // Light purple
    default:
      return '#e5e7eb'; // Light gray
  }
});
</script>

<style scoped>
.timetable-cell {
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  min-height: 4rem;
  position: relative;
  cursor: pointer;
  border-radius: 0.25rem;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.empty-cell {
  background-color: #f9fafb;
  border-left-color: #e5e7eb;
}

.empty-cell:hover {
  background-color: #f3f4f6;
  border-left-color: #9ca3af;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-cell:active {
  background-color: #e5e7eb;
  border-left-color: #6b7280;
}

.holiday-cell {
  background-color: #fee2e2;
  border-left-color: #ef4444;
  color: #b91c1c;
}

.canceled-event {
  background-color: #f3f4f6;
  border-left-color: #9ca3af;
  opacity: 0.7;
  text-decoration: line-through;
}

.regular-event {
  background-color: #dbeafe;
  border-left-color: #3b82f6;
}

.regular-event:hover {
  background-color: #bfdbfe;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.regular-event:active {
  background-color: #93c5fd;
}

.special-event {
  background-color: #e9d5ff;
  border-left-color: #8b5cf6;
}

.special-event:hover {
  background-color: #d8b4fe;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* JLPT 레벨별 스타일 */
.special-event[data-level="N1"] {
  background-color: #c7d2fe;  /* 연한 인디고 */
  border-left-color: #4f46e5;
}

.special-event[data-level="N2"] {
  background-color: #ddd6fe;  /* 연한 보라 */
  border-left-color: #7c3aed;
}

.special-event[data-level="N3"] {
  background-color: #e9d5ff;  /* 연한 자주 */
  border-left-color: #a855f7;
}

.special-event[data-level="N1"]:hover {
  background-color: #a5b4fc;
}

.special-event[data-level="N2"]:hover {
  background-color: #c4b5fd;
}

.special-event[data-level="N3"]:hover {
  background-color: #d8b4fe;
}

.makeup-event {
  background-color: #fef9c3;
  border-left-color: #eab308;
}

.makeup-event:hover {
  background-color: #fef08a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.makeup-event:active {
  background-color: #fde047;
}

.has-events {
  background-color: #f1f5f9;
}

.is-dragging {
  border: 1.5px dashed #3b82f6;
}

.hover {
  z-index: 20;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.event-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event {
  flex-grow: 1;
  border-left: 3px solid;
}

.event-holiday {
  background-color: #fee2e2;
  border-left-color: #ef4444;
}

.event-default {
  background-color: #f5f5f5;
  border-left-color: #9e9e9e;
}

.add-hint {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.holiday-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  cursor: help;
}

.holiday-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.holiday-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.event-badge {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  background-color: rgba(0, 0, 0, 0.05);
}

.more-events {
  font-size: 0.7rem;
  color: #6b7280;
}

.cell-tooltip {
  position: absolute;
  top: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  z-index: 50;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  font-size: 0.75rem;
  max-width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
}

.timetable-cell:hover .cell-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-event {
  margin-bottom: 0.5rem;
  border-left: 3px solid;
}

.event-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.event-main.has-multiple::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 10px 10px 0;
  border-color: transparent #4b5563 transparent transparent;
}

.event-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.event-details {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #374151;
}

.event-professor, .event-room {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-count {
  margin-top: auto;
  text-align: right;
  font-size: 0.7rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.event-count.has-tooltip {
  font-weight: bold;
  color: #2563eb;
}

.event-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  color: #4b5563;
  border-radius: 9999px;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  margin-right: 3px;
}

.event-count-text {
  font-size: 0.7rem;
}

.event-status {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 500;
}

.event-status.canceled {
  background-color: #fee2e2;
  color: #991b1b;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Tooltip styles */
.events-tooltip {
  position: absolute;
  top: 0;
  left: 100%;
  width: 250px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  z-index: 50;
  font-size: 0.75rem;
  transition: opacity 0.2s, transform 0.2s;
  animation: tooltip-fade 0.2s ease;
}

@keyframes tooltip-fade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 툴팁 위치 변형 */
.tooltip-left {
  left: auto;
  right: 100%;
}

.tooltip-bottom {
  top: 100%;
  left: 0;
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.tooltip-event {
  padding: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.tooltip-event:last-child {
  border-bottom: none;
}

.tooltip-event-type {
  display: inline-block;
  font-weight: 600;
  margin-right: 0.25rem;
}

.event-type-regular {
  color: #059669;
}

.event-type-special {
  color: #2563eb;
}

.event-type-makeup {
  color: #d97706;
}

.event-type-cancel {
  color: #dc2626;
}

.event-type-holiday {
  color: #7c3aed;
}

.tooltip-event-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.tooltip-event-details {
  color: #6b7280;
  font-size: 0.7rem;
}

.tooltip-professor, .tooltip-room {
  display: inline-block;
}

/* 모바일 반응형 처리 */
@media (max-width: 768px) {
  .events-tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 85%;
    max-width: 300px;
    z-index: 1000;
    animation: tooltip-mobile 0.2s ease;
  }
  
  @keyframes tooltip-mobile {
    from {
      opacity: 0;
      transform: translate(-50%, -45%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  .tooltip-left, 
  .tooltip-right,
  .tooltip-bottom {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
  }
  
  /* 모바일에서는 백드롭 추가 */
  .events-tooltip::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}
</style>
