import { defineStore } from "pinia";

export const useTimetableStore = defineStore("timetable", {
    state: () => ({
        timetables: [],             // 정규 시간표 데이터 (DB에서 가져온 원본 데이터)
        events: [],                 // 휴강/보강/특강 이벤트 데이터 (DB에서 가져온 원본 데이터)
        calendarEvents: [],         // FullCalendar에서 표시할 이벤트 데이터 (timetables + events 합친 형태)
    }),

    actions: {
        /**
         * 시간표 및 이벤트 데이터 저장 및 calendarEvents로 변환
         * @param {Array} timetables 정규 시간표 데이터
         * @param {Array} events 휴강/보강/특강 이벤트 데이터
         */
        setTimetableAndEvents(timetables, events) {
            this.timetables = timetables;
            this.events = events;
            this.calendarEvents = [];

            // 정규 시간표 -> 달력 이벤트로 변환
            this.timetables.forEach((t) => {
                const dayOfWeek = mapDayOfWeek(t.day); // 월, 화 같은 요일을 날짜로 반환

                this.calendarEvents.push({
                    // FullCalendar 이벤트를 구분하기 위한 식별자
                    id: `t-${t.id}`,

                    // 캘린더에 표시될 제목
                    title: `[${t.subject_name} ${t.professor_name}`,

                    // 반복 이벤트 설정
                    daysOfWeek: [dayOfWeek],

                    // 하루 중 시작, 종료 시각
                    startTime: t.startTime,
                    endTime: t.endTime,

                    // 스타일
                    backgroundColor: "#90caf9", // 기본 시간표 색상
                    // 그외 필요한 정보 extendedProps에 넣어두기
                    extendedProps: {
                        timetable_id: t.id,
                        subject_id: t.subject_id,
                        description: t.description || '',
                    },
                });
            });

            // 이벤트 (휴강, 이벤트, 특강) -> 단발성 이벤트로 변환
            this.events.forEach(e => {
                // e.event_date = "2025-03-15"
                // e..event_time = "10:00:00", e.end_time = "11:00:00"
                const startDateTime = e.event_date + "T" + e.start_time;
                const endDateTime = e.event_date + "T" +e.end_time;

                this.calendarEvents.push({
                    id: `e-${e.id}`,
                    title: `${getEventTypeName(e.event_type)}: ${e.subject_name}`,
                    start: startDateTime,
                    end: endDateTime,
                    backgroundColor: getEventTypeName(e.event_type),

                    extendedProps: {
                        event_id: e.id,
                        description: e.description || '',
                        subject_id: e.subject_id,
                    },
                });
            });
        },
    },
});

/**
 * 요일 문자 ("월", "화", "수" 등)를 Fullcalendar 기준 숫자로 매핑
 * Fullcalendar 일요일=0, 월=1, 화=2, 수=3, 목=4, 금=5, 토= 6
 */
function mapDayOfWeek(dayStr) {
   const map = {
       "일": 0, "월": 1, "화":2,
       "수": 3, "목": 4, "금": 5,
       "토": 6
   };
   return map[dayStr] ?? 1;
}

/**
 * 이벤트 유형 이름 반환
 * @param {string} eventType 'cancel', 'makeup', 'special'
 * */
function getEventTypeName(eventType) {
    switch (eventType) {
        case "cancel":
            return "휴강";
        case "makeup":
            return "보강";
        case "special":
            return "특강";
        default:
            return "이벤트";
    }
}

/**
 * 이벤트 유형별 생삭 변환
 * @param {string} eventType 'cancel', 'makeup', 'special'
 * @return {string}
 */
function getEventColor(eventType) {
    switch (eventType) {
        case "cancel":
            return "#f44336";  // 빨강 (휴강)
        case "makeup":
            return "#4caf50";  // 초록 (보강)
        case "special":
            return "#ff9800";  // 주황 (특강)
        default:
            return "#607d8b";  // 회색
    }
}