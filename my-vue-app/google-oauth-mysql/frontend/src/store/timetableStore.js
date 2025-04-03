// store/timetableStore.js
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { fetchTimetableWithEvents, fetchSpecialLectures } from "@/services/timetableService";
import { getSemesterRange } from "@/utils/semester";

// 📌 타임존 설정
dayjs.extend(utc)
dayjs.extend(timezone)

function getDayFromDate(dateStr) {
    const date = dayjs.utc(dateStr).tz('Asia/Seoul');
    const dayIdx = date.day();
    const map = ["일", "월", "화", "수", "목", "금", "토"];
    return map[dayIdx];
}

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        timetables: [],
        specialLectures: [],
        holidays: [],
        eventsByType: {
            cancel: [],
            makeup: [],
            special: [],
            event: []
        },
        selectedYear: new Date().getFullYear(),
        selectedSemester: 'spring',
        selectedLevel: '1'
    }),

    getters: {
        getCombinedData(state) {
            const timetables = state.timetables;

            const specials = state.specialLectures.map(t => ({
                ...t,
                event_type: 'special'
            }));

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
            }));

            const events = Object.values(state.eventsByType).flat();

            return [...timetables, ...specials, ...events, ...holidays];
        }
    },

    actions: {
        async loadAllDataBySemester({ year, semester, level }) {
            console.log("📥 [loadAllDataBySemester] 파라미터:", { year, semester, level });

            if (!semester || !['spring', 'summer', 'fall', 'winter', 'full'].includes(semester)) {
                console.warn("⚠️ semester 값이 잘못됨:", semester);
                return;
            }

            const { start_date, end_date } = getSemesterRange(parseInt(year), semester);

            const { timetables, events, holidays } = await fetchTimetableWithEvents({
                year,
                level,
                semester, // ✅ 추가됨: semester도 명확히 넘김
                start_date,
                end_date
            });

            console.log("📡 호출: /timetables/full", {
                year,
                level,
                start_date,
                end_date
            });


            console.log("📦 받아온 이벤트 데이터:", events); // ✅ 이 줄 추가해서 콘솔 확인

            const specialLectures = await fetchSpecialLectures(level, start_date, end_date);

            this.setTimetableAndEvents(timetables, events, holidays);
            this.setSpecialLectures(specialLectures);
        },

        setTimetableAndEvents(timetables = [], events = [], holidays = []) {
            const eventsByType = {
                cancel: [],
                makeup: [],
                special: [],
                event: []
            };

            events.forEach(e => {
                if (e.event_type === 'cancel') {
                    console.log('📌 휴강 이벤트', e)
                }

                const withDay = {
                    ...e,
                    day: getDayFromDate(e.event_date)
                };

                if (eventsByType[e.event_type]) {
                    eventsByType[e.event_type].push(withDay);
                } else {
                    console.warn("⚠️ 미지원 event_type:", e.event_type, e);
                }
            });

            this.timetables = timetables;
            this.holidays = holidays;
            this.eventsByType = eventsByType;
        },

        setSpecialLectures(specials = []) {
            this.specialLectures = specials;
        },

        setFilters({ year, semester, level }) {
            this.selectedYear = year;
            this.selectedSemester = semester;
            this.selectedLevel = level;
        }
    }
});