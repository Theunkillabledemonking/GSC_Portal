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
            this.timetables.forEach(t => {
                const dayDate = getNextDayDate(t.day); // 월, 화 같은 요일을 날짜로 반환

                this.calendarEvents.push({
                    id: `t-${t.id}`,
                    title: `[${t.subject_name} ${t.professor_name}`,
                    start: dayDate,
                    allDay: true,
                    backgroundColor: "#90caf9", // 기본 시간표 색상
                    subject_id: t.subject_id    // 필요 시 과목 필터링 대비 (현재는 사용 안함)
                });
            });

            // 이벤트 (휴강, 이벤트, 특강) -> 달력 이벤트로 변환
            this.events.forEach(e => {
                this.calendarEvents.push({
                    id: `e-${e.id}`,
                    title: `${getEventTypeName(e.event_type)}: ${e.subject_name}`,
                    start: e.event_date,
                    description: e.description,
                    backgroundColor: getEventColor(e.event_type), // 이벤트 유형별 색상 구분
                    subject_id: e.subject_id                      // 필요 시 과목 필터링 대비 (현재는 사용 안함)
                });
            });
        },
    },
});

/**
 * 요일을 기준으로 다음 주 해당 요일의 날짜 반환
 * @param {string} day '월', '화', '수', '목', '금'
 * @return {string} 날짜 (yyyy--mm-dd)
 */
function getNextDayDate(day) {
    const dayMap = { "월": 1, "화": 2, "수": 3, "목": 4, "금": 5 };
    const today = new Date();
    const currentDay = today.getDay(); // 0:일요일 1:월요일 ...
    const targetDay = dayMap[day];

    const diff = (targetDay - currentDay + 7) % 7 || 7; // 다음 주 같은 요일 찾기
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + diff);

    return resultDate.toISOString().split('T')[0];
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