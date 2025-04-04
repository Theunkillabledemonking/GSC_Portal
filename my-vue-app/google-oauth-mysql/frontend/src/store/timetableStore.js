// 📁 stores/timetableStore.js
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { fetchTimetableWithEvents, fetchSpecialLectures } from '@/services/timetableService'
import { getSemesterRange } from '@/utils/semester'
import { normalizeLevel } from '@/utils/level'

dayjs.extend(utc)
dayjs.extend(timezone)

function getDayFromDate(dateStr) {
    const date = dayjs.utc(dateStr).tz('Asia/Seoul')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[date.day()]
}

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        // 필터링 기준
        selectedYear: dayjs().year(),
        selectedSemester: 'spring',
        selectedLevel: '',
        selectedGroupLevel: '',

        // 데이터 저장소
        timetables: [],
        specialLectures: [],
        holidays: [],
        eventsByType: {
            cancel: [],
            makeup: [],
            special: [],
            event: []
        }
    }),

    getters: {
        getCombinedData(state) {
            const holidays = state.holidays.map(h => ({
                event_type: 'holiday',
                day: getDayFromDate(h.date),
                date: h.date,
                start_period: 1,
                end_period: 9,
                subject_name: '공휴일',
                description: h.name || '공휴일',
                professor_name: '',
                room: ''
            }))

            const specials = state.specialLectures.map(t => ({
                ...t,
                event_type: 'special'
            }))

            const events = Object.values(state.eventsByType).flat()

            return [
                ...state.timetables,
                ...specials,
                ...events,
                ...holidays
            ]
        }
    },

    actions: {
        getFilters() {
            return {
                year: this.selectedYear,
                semester: this.selectedSemester,
                level: normalizeLevel(this.selectedLevel),
                group_level: this.selectedGroupLevel || 'A'
            }
        },

        async loadAllDataBySemester() {
            const { year, semester, level, group_level } = this.getFilters()
            const { start_date, end_date } = getSemesterRange(year, semester)

            try {
                const { timetables, events, holidays } = await fetchTimetableWithEvents({
                    year,
                    semester,
                    level,
                    group_level,
                    start_date,
                    end_date
                })

                const specialLectures = await fetchSpecialLectures(
                    year, semester, level, start_date, end_date
                )

                this.setTimetableAndEvents(timetables, events, holidays)
                this.setSpecialLectures(specialLectures)
            } catch (error) {
                console.error('❌ 통합 시간표 데이터 로드 실패:', error)
            }
        },

        setTimetableAndEvents(timetables = [], events = [], holidays = []) {
            const eventsByType = {
                cancel: [],
                makeup: [],
                special: [],
                event: []
            }

            events.forEach(e => {
                const withDay = {
                    ...e,
                    day: getDayFromDate(e.event_date)
                }
                if (eventsByType[e.event_type]) {
                    eventsByType[e.event_type].push(withDay)
                } else {
                    console.warn('⚠️ Unknown event_type:', e.event_type)
                }
            })

            this.timetables = timetables
            this.holidays = holidays
            this.eventsByType = eventsByType
        },

        setSpecialLectures(specials = []) {
            this.specialLectures = specials
        },

        setFilters({ year, semester, level, group_level }) {
            this.selectedYear = year
            this.selectedSemester = semester
            this.selectedLevel = level
            this.selectedGroupLevel = group_level
        },

        resetAll() {
            this.timetables = []
            this.specialLectures = []
            this.holidays = []
            this.eventsByType = {
                cancel: [],
                makeup: [],
                special: [],
                event: []
            }
        }
    }
})
