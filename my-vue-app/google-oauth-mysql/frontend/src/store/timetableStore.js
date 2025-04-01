import { defineStore } from 'pinia'

export const useTimetableStore = defineStore('timetable', {
    state: () => ({
        timetables: [],         // 정규 + 보강 포함
        specialLectures: [],    // 반복형 특강 (is_special_lecture = 1)
        holidays: [],           // 공휴일
        eventsByType: {         // 이벤트 테이블에서 분기된 이벤트
            cancel: [],
            makeup: [],
            special: [],
            event: []
        }
    }),

    getters: {
        /**
         * ✅ 시간표 + 특강 + 공휴일 하나로 합친 데이터
         * - FullCalendar나 셀 기반 렌더링에 활용
         */
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
        /**
         * ✅ 백엔드 통합 시간표 응답 저장 (정규 + 이벤트 포함)
         */
        setTimetableAndEvents(timetables = [], events = [], holidays = []) {
            // 이벤트 분리
            const eventsByType = {
                cancel: [],
                makeup: [],
                special: [],
                event: []
            };

            events.forEach(e => {
                const withDay = {
                    ...e,
                    day: getDayFromDate(e.event_date) // ✅ 핵심 포인트
                }

                if (eventsByType[e.event_type]) {
                    eventsByType[e.event_type].push(withDay);
                }
            });

            this.timetables = timetables;
            this.holidays = holidays;
            this.eventsByType = eventsByType;
        },

        /**
         * ✅ 특강 저장
         */
        setSpecialLectures(specials = []) {
            this.specialLectures = specials;
        }
    }
});

/**
 * 🔁 날짜(YYYY-MM-DD) ➜ 요일 한글 ("월" ~ "일")
 */
function getDayFromDate(dateStr) {
    const date = new Date(dateStr);
    const dayIdx = date.getDay();
    const map = ["일", "월", "화", "수", "목", "금", "토"];
    return map[dayIdx];
}
