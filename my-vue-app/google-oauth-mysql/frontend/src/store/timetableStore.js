// 📁 stores/timetableStore.js --------------------------------------------------
// Pinia 스토어 리팩터링 버전
//   1. fetchTimetableWithEvents 호출 시 type='regular' 로 지정 → 정규 수업만 받아옴
//   2. 휴강(cancel)·보강(makeup)·행사(event) 분류 로직 개선
//   3. 공휴일 응답(문자열 배열) → 객체 변환 시키는 util 수정
//   4. 특강(special lecture) 그룹(전체/분반) 필터를 actions에서 처리
//   5. combinedData → PRIORITY 배열로 우선순위 정렬(holiday > event > makeup > special > regular)
// ---------------------------------------------------------------------------

import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import {
    fetchTimetableWithEvents,
    fetchSpecialLectures
} from '@/services/timetableService'

import { getSemesterRange } from '@/utils/semester'
import { normalizeLevel } from '@/utils/level'
import { inferDateFromOriginalClass } from '@/utils/date'

dayjs.extend(utc)
dayjs.extend(timezone)

// util ----------------------------------------------------------------------
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const PRIORITY = ['holiday', 'cancel', 'makeup', 'short_lecture', 'special', 'event', 'regular'];

function getDayFromDate(dateStr) {
    const date = dayjs.utc(dateStr).tz('Asia/Seoul')
    return DAYS_KO[date.day()]
}

function toHolidayObj(dateStr) {
    return {
        event_type: 'holiday',
        day: getDayFromDate(dateStr),
        date: dateStr,
        start_period: 1,
        end_period: 9,
        subject_name: '공휴일',
        description: '공휴일',
        professor_name: '',
        room: ''
    }
}

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        regulars: [],   // 정규 수업
        specials: [],   // 특강
        shortLectures: [], // 단기특강 (가끔씩 한번 하는 특강)
        cancels: [],    // 휴강
        makeups: [],    // 보강
        events: [],     // 이벤트
        holidays: [],   // 공휴일
        filters: {
            year: 1,
            semester: 'spring',
            level: null,
            groupLevel: null
        },
        dateRange: {
            start: (() => {
                let start = dayjs()
                while (start.day() !== 1) { // Adjust to Monday
                    start = start.subtract(1, 'day')
                }
                return start.format('YYYY-MM-DD')
            })(),
            end: (() => {
                let end = dayjs()
                while (end.day() !== 5) { // Adjust to Friday
                    if (end.day() > 5) {
                        end = end.subtract(1, 'day')
                    } else {
                        end = end.add(1, 'day')
                    }
                }
                return end.format('YYYY-MM-DD')
            })()
        },
        isLoading: false,
        lastLoadTime: null,
        processedItems: new Set()  // Track processed items to prevent duplicates
    }),

    getters: {
        /**
         * 🎯 하나의 배열로 병합 + PRIORITY 정렬
         *   - holiday(0) > cancel(1) > makeup(2) > special(3) > event(4) > regular(5)
         */
        combinedData(state) {
            console.log('📊 Store 데이터 현황 (병합 전):', {
                regulars: state.regulars.length,
                cancels: state.cancels.length,
                makeups: state.makeups.length,
                events: state.events.length,
                specials: state.specials.length,
                holidays: state.holidays.length
            });

            const merged = [
                ...state.holidays.map(h => ({ ...h, priority: 0 })),
                ...state.cancels.map(c => ({ ...c, priority: 1 })),
                ...state.makeups.map(m => ({ ...m, priority: 2 })),
                ...state.shortLectures.map(s => ({ ...s, priority: 3 })),
                ...state.specials.map(s => ({ ...s, priority: 4 })),
                ...state.events.map(e => ({ ...e, priority: 5 })),
                ...state.regulars.map(r => ({ ...r, priority: 6 }))
            ];

            // 정렬: 같은 시간대에는 priority 순으로
            const sorted = merged.sort((a, b) => {
                // 1) 날짜가 있는 항목과 요일 기반 항목 처리
                const dayA = a.date ? DAYS_KO.indexOf(getDayFromDate(a.date)) : DAYS_KO.indexOf(a.day);
                const dayB = b.date ? DAYS_KO.indexOf(getDayFromDate(b.date)) : DAYS_KO.indexOf(b.day);
                
                if (dayA !== dayB) {
                    return dayA - dayB;
                }

                // 2) 교시(start_period) 비교
                const periodA = Number(a.start_period) || 1;
                const periodB = Number(b.start_period) || 1;
                if (periodA !== periodB) {
                    return periodA - periodB;
                }

                // 3) 같은 교시라면 priority로 정렬
                return (a.priority || 99) - (b.priority || 99);
            });

            console.log('📊 병합 결과:', {
                total: sorted.length,
                byType: sorted.reduce((acc, item) => {
                    acc[item.event_type] = (acc[item.event_type] || 0) + 1;
                    return acc;
                }, {})
            });

            return sorted;
        }
    },

    actions: {
        setFilters(newFilters) {
            console.log('🎯 필터 업데이트:', newFilters)
            
            // year는 숫자로 변환
            if (newFilters.year) {
                this.filters.year = Number(newFilters.year) || 1
            }
            
            // semester는 유효한 값인지 확인
            if (newFilters.semester && ['spring', 'summer', 'fall', 'winter'].includes(newFilters.semester)) {
                this.filters.semester = newFilters.semester
            }
            
            // level과 groupLevel은 빈 문자열이 아닐 때만 설정
            if (newFilters.level && newFilters.level.trim() !== '') {
                this.filters.level = newFilters.level
            }
            if (newFilters.groupLevel && newFilters.groupLevel.trim() !== '') {
                this.filters.groupLevel = newFilters.groupLevel
            }
        },

        setDateRange(range) {
            console.log('📅 날짜 범위 업데이트:', range)
            
            // Validate and normalize dates
            let start = range.start ? dayjs(range.start) : dayjs()
            let end = range.end ? dayjs(range.end) : start.add(4, 'day')
            
            // Adjust start date to Monday if not already
            while (start.day() !== 1) { // 1 is Monday
                start = start.subtract(1, 'day')
            }
            
            // Adjust end date to Friday if not already
            while (end.day() !== 5) { // 5 is Friday
                if (end.day() > 5) {
                    end = end.subtract(1, 'day')
                } else {
                    end = end.add(1, 'day')
                }
            }
            
            if (!start.isValid() || !end.isValid()) {
                console.warn('❌ Invalid date format:', range)
                return
            }
            
            if (end.isBefore(start)) {
                console.warn('❌ End date cannot be before start date')
                return
            }
            
            this.dateRange = {
                start: start.format('YYYY-MM-DD'),
                end: end.format('YYYY-MM-DD')
            }
            
            console.log('📅 조정된 날짜 범위:', this.dateRange)
        },

        async loadAllDataBySemester(params = {}) {
            if (this.isLoading) {
                console.log('⏳ 데이터 로딩 중... 중복 요청 무시')
                return
            }

            try {
                this.isLoading = true
                this.lastLoadTime = Date.now()
                this.processedItems.clear()  // Reset processed items tracking

                // Initialize all data arrays
                this.regulars = []
                this.specials = []
                this.shortLectures = []
                this.cancels = []
                this.makeups = []
                this.events = []
                this.holidays = []

                // Set filters if provided
                if (params) {
                    this.setFilters(params)
                }

                // Load special lectures
                console.log('📡 [loadAllDataBySemester] Loading special lectures with params:', {
                    year: this.filters.year,
                    semester: this.filters.semester,
                    level: this.filters.level,
                    group_level: this.filters.groupLevel,
                    start_date: this.dateRange.start,
                    end_date: this.dateRange.end
                })

                const specialResult = await fetchSpecialLectures({
                    year: this.filters.year,
                    semester: this.filters.semester,
                    level: this.filters.level,
                    group_level: this.filters.groupLevel,
                    start_date: this.dateRange.start,
                    end_date: this.dateRange.end
                })

                // Process special lectures with unique key tracking
                const uniqueSpecials = new Map()
                specialResult.forEach(item => {
                    const key = `special-${item.id}-${item.date}-${item.start_period}`
                    if (!uniqueSpecials.has(key)) {
                        uniqueSpecials.set(key, item)
                    } else {
                        console.log('⚠️ 중복 특강 데이터 무시:', item)
                    }
                })
                this.specials = Array.from(uniqueSpecials.values())

                // Load regular timetable with events
                const timetableData = await fetchTimetableWithEvents({
                    year: this.filters.year,
                    semester: this.filters.semester,
                    level: this.filters.level,
                    start_date: this.dateRange.start,
                    end_date: this.dateRange.end,
                    type: 'all'
                })

                // Process timetable data with unique key tracking
                const uniqueRegulars = new Map()
                timetableData.forEach(item => {
                    const key = `${item.event_type}-${item.id}-${item.day || item.date}-${item.start_period}`
                    
                    // Normalize the item data
                    const normalizedItem = {
                        ...item,
                        start_period: Number(item.start_period) || 1,
                        end_period: Number(item.end_period) || 1,
                        level: item.level || '',
                        group_levels: item.group_levels || null
                    }

                    switch (item.event_type) {
                        case 'regular':
                            if (!uniqueRegulars.has(key)) {
                                uniqueRegulars.set(key, normalizedItem)
                            } else {
                                console.log('⚠️ 중복 정규수업 데이터 무시:', normalizedItem)
                            }
                            break
                        case 'cancel':
                            this.cancels.push(normalizedItem)
                            break
                        case 'makeup':
                            this.makeups.push(normalizedItem)
                            break
                        case 'event':
                            this.events.push(normalizedItem)
                            break
                        case 'holiday':
                            this.holidays.push(normalizedItem)
                            break
                    }
                })

                this.regulars = Array.from(uniqueRegulars.values())

                console.log('📊 [loadAllDataBySemester] Data loaded:', {
                    regular: this.regulars.length,
                    special: this.specials.length,
                    cancel: this.cancels.length,
                    makeup: this.makeups.length,
                    event: this.events.length,
                    holiday: this.holidays.length
                })
            } catch (error) {
                console.error('❌ [loadAllDataBySemester] Error:', error)
            } finally {
                this.isLoading = false
            }
        },

        resetAll() {
            this.regulars = []
            this.specials = []
            this.shortLectures = []
            this.cancels = []
            this.makeups = []
            this.events = []
            this.holidays = []
            this.isLoading = false
            this.lastLoadTime = null
        }
    }
})
