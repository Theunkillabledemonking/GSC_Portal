import { defineStore } from "pinia";


/**
 * 요일 문자 (월, 화 수) 를 FullCalendar 기준 숫자로 매핑
 * @param dateStr
 * @returns {*|number}
 */
// FullCalendar에서 요일을 0~6로 매핑
function mapDayOfWeek(dateStr) {
    const map = { "일": 0, "월": 1, "화": 2, "수":3, "목":4, "금":5, "토":6};
    return map[dateStr] ?? 1 ;
}

// 🔹 교시별 시간표 매핑
const periodTimeMap = {
    1: { start: "09:00", end: "09:50" },
    2: { start: "10:00", end: "10:50" },
    3: { start: "11:00", end: "11:50" },
    4: { start: "12:00", end: "12:50" },
    5: { start: "13:00", end: "13:50" },
    6: { start: "14:00", end: "14:50" },
    7: { start: "15:00", end: "15:50" },
    8: { start: "16:00", end: "16:50" },
    9: { start: "17:00", end: "17:50" },
    10: { start: "18:00", end: "18:50" }
};

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
            // 1) 원본 데이터 보관
            this.timetables = timetables;
            this.events = events;
            // 2) FullCalendar 이벤트 배열 초기화
            this.calendarEvents = [];

            // 3) 정규 수업 -> 반복 이벤트로 변환
            timetables.forEach((t) => {
                const dayOfWeek = mapDayOfWeek(t.day); // 월, 화 같은 요일을 날짜로 반환
                const startTime =  periodTimeMap[t.start_period]?.start || "00:00";
                const endTime = periodTimeMap[t.end_period]?.end || "23:59";

                this.calendarEvents.push({
                    // FullCalendar 이벤트를 구분하기 위한 식별자
                    id: `t-${t.id}`,
                    // 캘린더에 표시될 제목
                    title: `[${t.subject?.name ?? '??'}] ${t.professor?.name ?? ''} (${t.room ?? ''})`,
                    // 반복 이벤트 설정
                    daysOfWeek: [dayOfWeek],
                    // 하루 중 시작, 종료 시각
                    startTime,
                    endTime,
                    // 스타일
                    backgroundColor: "#90caf9", // 기본 시간표 색상
                    // 그외 필요한 정보 extendedProps에 넣어두기
                    extendedProps: {
                        id: t.id,              // ⭐ DB PK
                        day: t.day,            // 월, 화, 수 ...
                        subject_id: t.subject_id,
                        start_period: t.start_period,
                        end_period: t.end_period,
                        room: t.room,
                        description: t.description ?? '',
                    },
                });
            });

            // 4) 이벤트 (휴강, 이벤트, 특강) -> 단발성 이벤트로 변환
            events.forEach(e => {
                // e.event_date = "2025-03-15"
                // e..event_time = "10:00:00", e.end_time = "11:00:00"
                const startDateTime = e.event_date + "T" + (e.start_time || "00:00");
                const endDateTime = e.event_date + "T" + (e.end_time || "23:59");

                this.calendarEvents.push({
                    id: `e-${e.id}`,
                    title: `${getEventTypeName(e.event_type)}: ${e.subject_name}`,
                    start: startDateTime,
                    end: endDateTime,
                    backgroundColor: getEventColor(e.event_type),
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

