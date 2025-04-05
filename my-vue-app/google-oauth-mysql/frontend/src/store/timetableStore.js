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

dayjs.extend(utc)
dayjs.extend(timezone)

// util ----------------------------------------------------------------------
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const PRIORITY = ['holiday', 'event', 'makeup', 'special', 'regular']

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
        // 🎯 현재 선택된 필터 기준
        selectedYear: dayjs().year(),
        selectedSemester: 'spring',
        selectedLevel: '',
        selectedGroupLevel: 'A',

        // 📦 백엔드 데이터
        regulars: [],        // 정규 수업 (cancel 제외)
        cancels: [],         // 휴강 (정규 수업에서 분리)
        makeups: [],         // 보강 이벤트
        events: [],          // 행사(event) 타입
        specials: [],        // 특강
        holidays: []         // 공휴일
    }),

    getters: {
        /**
         * 🎯 하나의 배열로 병합 + PRIORITY 정렬
         */
        combinedData(state) {
            const merged = [
                ...state.regulars,
                ...state.specials,
                ...state.makeups,
                ...state.events,
                ...state.cancels,
                ...state.holidays
            ]

            return merged.sort((a, b) => {
                if (a.date === b.date) return a.start_period - b.start_period
                const pa = PRIORITY.indexOf(a.event_type)
                const pb = PRIORITY.indexOf(b.event_type)
                if (pa !== pb) return pa - pb
                return a.date.localeCompare(b.date)
            })
        }
    },

    actions: {
        // --------------------------------------------------- 필터 관리
        getFilters() {
            return {
                year: this.selectedYear,
                semester: this.selectedSemester,
                level: normalizeLevel(this.selectedLevel),
                group_level: this.selectedGroupLevel
            }
        },

        setFilters({ year, semester, level, group_level }) {
            if (year) this.selectedYear = year
            if (semester) this.selectedSemester = semester
            if (level !== undefined) this.selectedLevel = level
            if (group_level) this.selectedGroupLevel = group_level
        },

        // --------------------------------------------------- 데이터 로딩
        /**
         * 📡 학기 기준 모든 데이터 로딩
         *   - 정규 수업(type='regular') + 이벤트 + 공휴일
         *   - 특강(전체·분반) 별도 호출 후 병합
         */
        async loadAllDataBySemester() {
            const { year, semester, level, group_level } = this.getFilters()
            const { start_date, end_date } = getSemesterRange(year, semester)

            try {
                // 1) 정규 수업 + 이벤트 + 공휴일
                const { timetables, events, holidays } = await fetchTimetableWithEvents({
                    year,
                    semester,
                    level,
                    group_level,
                    start_date,
                    end_date,
                    type: 'regular' // 정규만 받아옴
                })

                // 2) 특강 (전체·분반)
                const specials = await fetchSpecialLectures({
                    year,
                    semester,
                    level,
                    group_level,
                    start_date,
                    end_date
                })

                // 3) 스토어에 저장
                this._saveRegularAndEvents(timetables, events)
                this.specials = specials.map(t => ({ ...t, event_type: 'special' }))
                this.holidays = holidays.map(toHolidayObj)
            } catch (err) {
                console.error('❌ loadAllDataBySemester failed:', err)
            }
        },

        // --------------------------------------------------- 내부 헬퍼
        _saveRegularAndEvents(timetables = [], events = []) {
            // 정규 수업 / 휴강 분리
            this.regulars = timetables.filter(t => t.event_type === 'regular')
            this.cancels  = timetables
                .filter(t => t.event_type === 'cancel')
                .map(t => ({
                    ...t,
                    description: '휴강',
                    event_type: 'cancel'
                }))

            // 이벤트 테이블 기반 makeups / events 분리 (cancel 은 이미 처리했으므로 제외)
            this.makeups = events
                .filter(e => e.event_type === 'makeup')
                .map(e => ({
                    ...e,
                    day: getDayFromDate(e.event_date),
                    date: e.event_date,
                    event_type: 'makeup'
                }))

            this.events = events
                .filter(e => e.event_type === 'event')
                .map(e => ({
                    ...e,
                    day: getDayFromDate(e.event_date),
                    date: e.event_date,
                    event_type: 'event'
                }))
        },

        // --------------------------------------------------- 상태 초기화
        resetAll() {
            this.regulars = []
            this.cancels  = []
            this.makeups  = []
            this.events   = []
            this.specials = []
            this.holidays = []
        }
    }
})
