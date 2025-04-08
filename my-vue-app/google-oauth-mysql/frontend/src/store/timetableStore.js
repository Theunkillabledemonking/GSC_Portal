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
            start: dayjs().startOf('week').format('YYYY-MM-DD'),
            end: dayjs().startOf('week').add(6, 'day').format('YYYY-MM-DD')
        }
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
                ...state.specials.map(s => ({ ...s, priority: 3 })),
                ...state.events.map(e => ({ ...e, priority: 4 })),
                ...state.regulars.map(r => ({ ...r, priority: 5 }))
            ];

            // 정렬: 같은 시간대에는 priority 순으로
            const sorted = merged.sort((a, b) => {
                const dateA = a.date || ''
                const dateB = b.date || ''
                const periodA = a.start_period ?? 1
                const periodB = b.start_period ?? 1
                const priorityA = a.priority ?? 99
                const priorityB = b.priority ?? 99

                if (dateA === dateB) {
                    if (periodA === periodB) {
                        return priorityA - priorityB
                    }
                    return periodA - periodB
                }
                return dateA.localeCompare(dateB)
            })

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
        setFilters(filters) {
            // 필터 정규화
            const normalizedFilters = {};
            
            // year는 숫자로 변환
            if ('year' in filters) {
                normalizedFilters.year = Number(filters.year) || 1;
            }
            
            // semester는 유효한 값만 허용
            if ('semester' in filters && ['spring', 'summer', 'fall', 'winter'].includes(filters.semester)) {
                normalizedFilters.semester = filters.semester;
            }
            
            // level과 groupLevel은 문자열이 있을 때만 설정
            if ('level' in filters && filters.level) {
                normalizedFilters.level = String(filters.level);
            }
            if ('groupLevel' in filters && filters.groupLevel) {
                normalizedFilters.groupLevel = String(filters.groupLevel);
            }

            this.filters = { ...this.filters, ...normalizedFilters };
            console.log('🎯 필터 업데이트:', this.filters);
        },

        setDateRange(range) {
            // 날짜 정규화
            const start = range.start ? dayjs(range.start).format('YYYY-MM-DD') : null;
            const end = range.end ? dayjs(range.end).format('YYYY-MM-DD') : null;

            if (start && end) {
                this.dateRange = { start, end };
                console.log('📅 날짜 범위 업데이트:', this.dateRange);
            } else {
                console.warn('❌ Invalid date range:', range);
            }
        },

        async loadAllDataBySemester(params = null) {
            try {
                // 필터 업데이트
                if (params) {
                    this.setFilters(params);
                }

                // 모든 배열 초기화
                this.regulars = [];
                this.specials = [];
                this.cancels = [];
                this.makeups = [];
                this.events = [];
                this.holidays = [];

                const semesterRange = getSemesterRange(this.filters.year, this.filters.semester)


                // 데이터 로드
                const data = await fetchTimetableWithEvents({
                    year: this.filters.year,
                    semester: this.filters.semester,
                    level: this.filters.level,
                    group_level: this.filters.groupLevel,
                    start_date: this.dateRange.start,
                    end_date: this.dateRange.end,
                    type: 'all'
                });

                // 정규 수업: 학년 기준으로 필터링
                this.regulars = data.filter(item => 
                    item.event_type === 'regular' && !item.isCancelled
                ).map(t => ({
                    ...t,
                    year: t.year || this.filters.year,  // 명시적으로 year 설정
                    level: t.level || this.filters.level
                }));

                // 휴강: 정규수업의 휴강 + 휴강 이벤트
                this.cancels = [
                    ...data.filter(item => item.event_type === 'regular' && item.isCancelled),
                    ...data.filter(item => item.event_type === 'cancel')
                ].map(t => ({
                    ...t,
                    event_type: 'cancel',
                    description: t.description || '휴강',
                    year: t.year || this.filters.year,
                    level: t.level || this.filters.level,
                    date: t.date
                }))

                this.makeups = data.filter(item => 
                    item.event_type === 'makeup'
                ).map(t => ({
                    ...t,
                    year: t.year || this.filters.year,
                    level: t.level || this.filters.level,
                    date: t.date

                }));
                
                this.specials = data.filter(item => 
                    item.event_type === 'special'
                ).map(t => ({
                    ...t,
                    year: t.year || this.filters.year,
                    level: t.level || this.filters.level,
                    date: t.date
                }));
                
                this.events = data.filter(item => 
                    item.event_type === 'event'
                ).map(t => ({
                    ...t,
                    year: t.year || this.filters.year,
                    level: t.level || this.filters.level
                }));
                
                this.holidays = data.filter(item => 
                    item.event_type === 'holiday'
                ).map(t => ({
                    ...t,
                    year: t.year || this.filters.year,
                    level: t.level || this.filters.level
                }));

            } catch (error) {
                console.error('❌ loadAllDataBySemester failed:', error);
                throw error;
            }
        },

        resetAll() {
            this.regulars = []
            this.specials = []
            this.cancels = []
            this.makeups = []
            this.events = []
            this.holidays = []
            this.filters = {
                year: 1,
                semester: 'spring',
                level: null,
                groupLevel: null
            }
            this.dateRange = {
                start: dayjs().startOf('week').format('YYYY-MM-DD'),
                end: dayjs().startOf('week').add(6, 'day').format('YYYY-MM-DD')
            }
        }
    }
})
