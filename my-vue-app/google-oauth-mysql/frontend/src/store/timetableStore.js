// store/timetableStore.js
import { defineStore } from 'pinia';

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        timetables: [],
        events: [],
        holidays: [],
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
            }))

            return [...timetableBlocks, ...eventBlocks, ...holidayBlocks];
        }
    },
    actions: {
        setTimetableAndEvents(timetables, events, holidays = []) {
            this.timetables = timetables;
            this.events = events;
            this.holidays = holidays;
        }
    }
});

function mapDayOfWeek(dayKor) {
    const map = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
    return map[dayKor] ?? null;
}
