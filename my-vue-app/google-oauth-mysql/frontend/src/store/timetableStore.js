// store/timetableStore.js
import { defineStore } from 'pinia'

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        timetables: [],        // 정규 수업
        specialLectures: [],   // 특강 수업
        events: [],            // 보강 / 휴강 / 특강 / 일반 이벤트
        holidays: [],          // 공휴일
    }),

    getters: {
        calendarEvents(state) {
            const timetableBlocks = state.timetables.map(t => ({
                id: `t-${t.id}`,
                title: `[정규] ${t.subject_name}`,
                daysOfWeek: [mapDayOfWeek(t.day)],
                startTime: t.start_time,
                endTime: t.end_time,
                backgroundColor: '#90caf9',
                display: 'auto',
                extendedProps: { ...t, type: 'timetable' }
            }));

            const specialBlocks = state.specialLectures.map(t => ({
                id: `s-${t.id}`,
                title: `[특강] ${t.subject_name}`,
                daysOfWeek: [mapDayOfWeek(t.day)],
                startTime: t.start_time,
                endTime: t.end_time,
                backgroundColor: '#ffcc80',
                display: 'auto',
                extendedProps: { ...t, type: 'special' }
            }));

            const eventBlocks = state.events.map(e => {
                const titleMap = {
                    cancel: `[휴강] ${e.subject_name}`,
                    makeup: `보강: ${e.description}`,
                    special: `특강: ${e.description}`,
                    event: `행사: ${e.description}`,
                };

                return {
                    id: `e-${e.id}`,
                    title: titleMap[e.event_type] || '이벤트',
                    start: `${e.event_date}T${e.start_time || '09:00'}`,
                    end: `${e.event_date}T${e.end_time || '18:00'}`,
                    backgroundColor: {
                        cancel: '#d3d3d3',
                        makeup: '#4caf50',
                        special: '#ff9800',
                        event: '#f06292'
                    }[e.event_type],
                    extendedProps: { ...e, type: 'event' }
                };
            });

            const holidayBlocks = state.holidays.map(h => ({
                id: `h-${h.date}`,
                title: `공휴일: ${h.name}`,
                start: h.date,
                allDay: true,
                display: 'background',
                backgroundColor: '#ffe0e0',
                borderColor: '#ffe0e0',
                extendedProps: { type: 'holiday' }
            }));

            return [...timetableBlocks, ...specialBlocks, ...eventBlocks, ...holidayBlocks];
        },

        getCombinedData(state) {
            const regulars = state.timetables.map(t => ({
                ...t,
                event_type: 'regular'
            }));

            const specials = state.specialLectures.map(t => ({
                ...t,
                event_type: 'special'
            }));

            const holidays = state.holidays.map(h => ({
                event_type: 'holiday',
                day: getDayFromDate(h.date),
                start_period: 1,
                end_period: 8,
                description: h.name,
                subject_name: '공휴일',
                professor_name: '',
                room: '',
                year: h.year ?? 1,
                level: h.level ?? null
            }));

            return [...regulars, ...specials, ...state.events, ...holidays];
        }
    },

    actions: {
        setTimetableAndEvents(timetables, events, holidays = []) {
            this.timetables = timetables;
            this.events = events;
            this.holidays = holidays;
        },

        setSpecialLectures(specials = []) {
            this.specialLectures = specials;
        }
    }
});

/**
 * 월~금 → 1~5 (FullCalendar용)
 */
function mapDayOfWeek(dayKor) {
    const map = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
    return map[dayKor] ?? null;
}

/**
 * "2025-03-29" → 요일 한글로 변환
 */
function getDayFromDate(dateStr) {
    const date = new Date(dateStr);
    const dayIdx = date.getDay(); // 0~6
    const map = ["일", "월", "화", "수", "목", "금", "토"];
    return map[dayIdx];
}