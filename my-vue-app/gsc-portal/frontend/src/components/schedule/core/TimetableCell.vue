<template>
  <div 
    :class="[
      'timetable-cell', 
      { 'is-holiday': isHoliday || hasHolidayEvent, 'has-events': hasEvents, 'has-cancel': hasCancelEvent },
      cellTypeClass
    ]"
    @click="handleCellClick"
    @mouseover="showTooltip = true" 
    @mouseleave="showTooltip = false"
    ref="cellRef"
  >
    <!-- No events placeholder -->
    <div v-if="!hasEvents" class="empty-cell"></div>
    
    <!-- Single event display (main display in cell) -->
    <div v-else class="event-content">
      <div class="event-type-indicator" :class="mainEventTypeClass"></div>
      <div class="event-details">
        <div class="subject-name">{{ mainEventSubject }}</div>
        <div class="professor-room" v-if="mainEventProfessor || mainEventRoom">
          {{ mainEventProfessor }} {{ mainEventRoom ? `(${mainEventRoom})` : '' }}
        </div>
      </div>
      
      <!-- Multiple events indicator - only show if main event is not a holiday -->
      <div v-if="eventCount > 1 && !hasHolidayEvent" class="multiple-events-badge">
        +{{ eventCount - 1 }}
      </div>
    </div>
    
    <!-- Tooltip for all events -->
    <div v-if="showTooltip && hasEvents" 
      class="tooltip-container" 
      :class="{ 'tooltip-bottom': tooltipPosition === 'bottom' }"
    >
      <div class="tooltip-content">
        <!-- If holiday exists, only show the holiday event -->
        <div v-if="hasHolidayEvent" class="tooltip-event">
          <div class="tooltip-event-header">
            <div class="tooltip-event-type event-type-holiday">
              {{ getEventTypeLabel(holidayEvent) }}
            </div>
            <div class="tooltip-event-time">
              전일
            </div>
          </div>
          <div class="tooltip-event-subject">
            {{ holidayEvent.subject_name || holidayEvent.title || '공휴일' }}
          </div>
        </div>
        
        <!-- Otherwise show all events -->
        <template v-else>
          <div v-for="(event, index) in events" :key="index" class="tooltip-event">
            <div class="tooltip-event-header">
              <div class="tooltip-event-type" :class="getEventTypeClass(event)">
                {{ getEventTypeLabel(event) }}
              </div>
              <div class="tooltip-event-time">
                {{ getEventTime(event) }}
              </div>
            </div>
            <div class="tooltip-event-subject">
              {{ event.subject_name || event.title || 'Untitled Event' }}
            </div>
            <div class="tooltip-event-details" v-if="getEventProfessor(event) || getEventRoom(event)">
              {{ getEventProfessor(event) }} {{ getEventRoom(event) ? `(${getEventRoom(event)})` : '' }}
            </div>
            <div v-if="index < events.length - 1" class="tooltip-divider"></div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/store'

// 상수를 직접 정의
const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

// Interface for TimetableEvent
interface TimetableEvent {
  id?: number | string
  type?: string
  event_type?: string
  title?: string
  subject_name?: string
  summary?: string
  is_special_lecture?: boolean | number | string
  is_foreigner_target?: boolean | number | string
  professor?: string
  professor_name?: string
  inherited_professor_name?: string
  classroom?: string
  room?: string
  inherited_room?: string
  start_time?: string
  end_time?: string
  date?: string
  event_date?: string
  day?: string | number
  year?: number | string
  grade?: number | string
  level?: string
  start_period?: number
  end_period?: number
  timetable_id?: number
  subject_id?: number | string
  inherit_attributes?: boolean | number
  name?: string
  semester?: string
  status?: string
  timetable?: any
  [key: string]: any // Allow for any additional properties
}

// Props definition
const props = defineProps({
  events: {
    type: Array as () => TimetableEvent[],
    default: () => []
  },
  day: {
    type: String,
    required: true
  },
  period: {
    type: [Number, String],
    required: true
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  isCurrentDay: {
    type: Boolean,
    default: false
  },
  isSpecialLecture: {
    type: Boolean,
    default: false
  }
})

// Emit for event handling
const emit = defineEmits(['cell-click'])

// Auth store for admin check
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

// Local state
const showTooltip = ref(false)
const cellRef = ref(null)
const tooltipPosition = ref('top')

// Check if cell has holiday event
const hasHolidayEvent = computed(() => {
  return props.events?.some(event => 
    event.type === 'holiday' || event.event_type === 'holiday'
  ) || false
})

// Get the holiday event if exists
const holidayEvent = computed(() => {
  return props.events?.find(event => 
    event.type === 'holiday' || event.event_type === 'holiday'
  ) || null
})

// Sort events by type priority (holiday > cancel > makeup > special > topik > regular)
const sortedEvents = computed(() => {
  if (!props.events || props.events.length === 0) return []
  
  // If there's a holiday event, only return that one
  if (hasHolidayEvent.value) {
    return [holidayEvent.value]
  }
  
  // Define type priority (lower number = higher priority)
  const typePriority = {
    'holiday': 1,
    'cancel': 2,
    'makeup': 3,
    'special': 4,
    'topik': 5,
    'regular': 6
  }
  
  // Helper to determine event type
  const getEventType = (event) => {
    if (!event) return 'regular'
    
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      return 'holiday'
    } else if (event.type === 'cancel' || event.event_type === 'cancel') {
      return 'cancel'
    } else if (event.type === 'makeup' || event.event_type === 'makeup') {
      return 'makeup'
    } else if (
      event.is_special_lecture === 1 || 
      event.is_special_lecture === '1' || 
      event.type === 'special' || 
      event.event_type === 'special'
    ) {
      return 'special'
    } else if (
      event.is_special_lecture === 2 || 
      event.is_special_lecture === '2' || 
      event.type === 'topik' || 
      event.event_type === 'topik'
    ) {
      return 'topik'
    }
    
    return 'regular'
  }
  
  // Sort events by priority
  return [...props.events].sort((a, b) => {
    const typeA = getEventType(a)
    const typeB = getEventType(b)
    return typePriority[typeA] - typePriority[typeB]
  })
})

// Main event to display (highest priority)
const mainEvent = computed(() => {
  return sortedEvents.value.length > 0 ? sortedEvents.value[0] : null
})

// Count of events in cell
const eventCount = computed(() => {
  return props.events?.length || 0
})

// Check if there are events
const hasEvents = computed(() => {
  return eventCount.value > 0
})

// Check if cell has cancel event
const hasCancelEvent = computed(() => {
  return props.events?.some(event => 
    event.type === 'cancel' || event.event_type === 'cancel'
  ) || false
})

// Get event type for styling
const getEventType = (event) => {
  if (!event) return 'regular'
  
  if (event.type === 'holiday' || event.event_type === 'holiday') {
    return 'holiday'
  } else if (event.type === 'cancel' || event.event_type === 'cancel') {
    return 'cancel'
  } else if (event.type === 'makeup' || event.event_type === 'makeup') {
    return 'makeup'
  } else if (
    event.is_special_lecture === 1 || 
    event.is_special_lecture === '1' || 
    event.type === 'special' || 
    event.event_type === 'special'
  ) {
    return 'special'
  } else if (
    event.is_special_lecture === 2 || 
    event.is_special_lecture === '2' || 
    event.type === 'topik' || 
    event.event_type === 'topik'
  ) {
    return 'topik'
  }
  
  return 'regular'
}

// Get class name based on event type
const getEventTypeClass = (event) => {
  const type = getEventType(event)
  return `event-type-${type}`
}

// Get label for event type
const getEventTypeLabel = (event) => {
  const type = getEventType(event)
  
  switch (type) {
    case 'holiday': return '공휴일'
    case 'cancel': return '휴강'
    case 'makeup': return '보강'
    case 'special': return '특강'
    case 'topik': return 'TOPIK'
    default: return '정규'
  }
}

// Calculate cell type class based on main event
const cellTypeClass = computed(() => {
  if (!mainEvent.value) return ''
  return getEventTypeClass(mainEvent.value)
})

// Main event type class
const mainEventTypeClass = computed(() => {
  if (!mainEvent.value) return ''
  return getEventTypeClass(mainEvent.value)
})

// Subject name for main event
const mainEventSubject = computed(() => {
  if (!mainEvent.value) return ''
  return mainEvent.value.subject_name || mainEvent.value.title || 'Untitled'
})

// Get professor name for an event
const getEventProfessor = (event) => {
  if (!event) return ''
  return event.professor_name || event.professor || ''
}

// Professor name for main event
const mainEventProfessor = computed(() => {
  if (!mainEvent.value) return ''
  return getEventProfessor(mainEvent.value)
})

// Get room for an event
const getEventRoom = (event) => {
  if (!event) return ''
  return event.room || event.classroom || ''
}

// Room for main event
const mainEventRoom = computed(() => {
  if (!mainEvent.value) return ''
  return getEventRoom(mainEvent.value)
})

// Time format for events
const getEventTime = (event) => {
  if (!event) return ''
  
  const startPeriod = event.start_period || ''
  const endPeriod = event.end_period || startPeriod
  
  if (startPeriod === endPeriod) {
    return `${startPeriod}교시`
  } else {
    return `${startPeriod}-${endPeriod}교시`
  }
}

// Handle cell click - modify to handle holiday events specially
const handleCellClick = () => {
  // If it's a holiday, only pass the holiday event
  if (hasHolidayEvent.value) {
    emit('cell-click', {
      events: [holidayEvent.value],
      day: props.day,
      period: props.period
    })
    return
  }
  
  // Otherwise pass all events as before
  emit('cell-click', {
    events: props.events,
    day: props.day,
    period: props.period
  })
}

// Calculate tooltip position based on element's position in viewport
const calculateTooltipPosition = () => {
  if (!cellRef.value) return
  
  const rect = cellRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  
  // If cell is in upper half of viewport, show tooltip below
  // If cell is in lower half of viewport, show tooltip above
  tooltipPosition.value = rect.top < 180 ? 'bottom' : 'top'
}

// Set initial tooltip position and add window resize listener
onMounted(() => {
  calculateTooltipPosition()
  window.addEventListener('resize', calculateTooltipPosition)
  
  // Debug logging for special lecture events
  if (isAdmin.value && props.events.some(e => 
    e.is_special_lecture === 1 || 
    e.is_special_lecture === '1' || 
    e.type === 'special' || 
    e.event_type === 'special'
  )) {
    console.log(`🔍 [TimetableCell] 특강 이벤트 확인:`, props.day, props.period, props.events)
  }
})

// Watch for changes in events array
watch(() => props.events, (newEvents) => {
  if (isAdmin.value && newEvents.length > 0) {
    console.log(`📊 [TimetableCell] 이벤트 변경됨:`, props.day, props.period, newEvents)
  }
})
</script>

<style scoped>
.timetable-cell {
  position: relative;
  min-height: 70px;
  padding: 4px;
  border: 1px solid #eaeaea;
  overflow: visible;
  transition: all 0.2s ease;
}

.empty-cell {
  height: 100%;
  min-height: 70px;
}

.timetable-cell:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.event-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.event-type-indicator {
  height: 4px;
  width: 100%;
  margin-bottom: 4px;
  border-radius: 2px;
}

.event-details {
  flex-grow: 1;
  font-size: 0.9rem;
}

.subject-name {
  font-weight: 500;
  margin-bottom: 2px;
  word-break: break-word;
}

.professor-room {
  font-size: 0.8rem;
  color: #666;
}

.multiple-events-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background-color: #f0f0f0;
  color: #666;
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* Tooltip styles */
.tooltip-container {
  position: absolute;
  z-index: 10;
  width: 280px;
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
  margin-top: 5px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.tooltip-bottom {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 5px;
}

.timetable-cell:hover .tooltip-container {
  opacity: 1;
  visibility: visible;
}

.tooltip-content {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  font-size: 0.8rem;
  border: 1px solid #eaeaea;
}

.tooltip-event {
  padding: 4px 0;
}

.tooltip-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.tooltip-event-type {
  font-size: 0.7rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
}

.tooltip-event-time {
  font-size: 0.7rem;
  color: #666;
}

.tooltip-event-subject {
  font-weight: 500;
  margin-bottom: 2px;
}

.tooltip-event-details {
  font-size: 0.75rem;
  color: #666;
}

.tooltip-divider {
  height: 1px;
  background-color: #eee;
  margin: 6px 0;
}

/* Event type styles - updated to match legend */
.event-type-regular .event-type-indicator, .event-type-regular.tooltip-event-type {
  background-color: #4c6ef5; /* blue-500 */
  color: white;
}

.event-type-special .event-type-indicator, .event-type-special.tooltip-event-type {
  background-color: #f59e0b; /* orange-400 */
  color: white;
}

.event-type-cancel .event-type-indicator, .event-type-cancel.tooltip-event-type {
  background-color: #ef4444; /* red-500 */
  color: white;
}

.event-type-makeup .event-type-indicator, .event-type-makeup.tooltip-event-type {
  background-color: #059669; /* green-600 */
  color: white;
}

.event-type-holiday .event-type-indicator, .event-type-holiday.tooltip-event-type {
  background-color: #8b5cf6; /* purple-500 */
  color: white;
  font-weight: bold;
}

.event-type-topik .event-type-indicator, .event-type-topik.tooltip-event-type {
  background-color: #0ea5e9; /* sky-500 */
  color: white;
}

/* Cell status styles */
.is-holiday {
  background-color: rgba(139, 92, 246, 0.15); /* Lighter purple-500 */
}

.has-cancel {
  background-color: rgba(239, 68, 68, 0.1); /* Lighter red-500 */
}

.is-current-day {
  border: 2px solid #228be6;
}
</style>
