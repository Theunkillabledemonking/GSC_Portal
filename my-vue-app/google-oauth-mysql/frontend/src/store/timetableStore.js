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

            console.log("🟢 원본 시간표 데이터:", JSON.stringify(timetables, null, 2));
            console.log("🟠 원본 이벤트 데이터:", JSON.stringify(events, null, 2));

            // 휴강 처리
            const cancelEvents = events
                .filter(ev => ev.event_type === "cancel")
                .map(ev => `${ev.timetable_id}-${ev.event_date}`);

            // 3) 정규 수업 -> 반복 이벤트로 변환
            timetables.forEach((t) => {
                const dayOfWeek = mapDayOfWeek(t.day); // 월, 화 같은 요일을 날짜로 반환
                const startTime = periodTimeMap[t.start_period]?.start || "00:00";
                const endTime = periodTimeMap[t.end_period]?.end || "23:59";

                // t.id를 포함하여 특정 시간표만 `cancel` 처리
                const eventKey = `${t.id}-${t.day}-${t.start_period}-${t.end_period}`;
                const isCancelled = cancelEvents.includes(eventKey);

                // 🚨 level이 null이거나 잘못된 값일 경우 기본값 유지
                if (t.level === null || t.level === undefined) {
                    t.level = "default";
                }

                const backgroundColor = isCancelled ? "#d3d3d3" : "#90caf9"; // 회색(휴강) or 정규
                const titlePrefix = isCancelled ? "[휴강]" : "[정규]";

                console.log(`📢 시간표 ID: ${t.id}, 휴강 여부: ${isCancelled}`);

                // ✅ 여기서 오류 수정: `if` 문 내부 닫힘 위치 조정
                this.calendarEvents.push({
                    id: `t-${t.id}`,
                    title: `${titlePrefix} ${t.subject?.name ?? '??'} (${t.room ?? ''})`,
                    daysOfWeek: [dayOfWeek],
                    startTime,
                    endTime,
                    backgroundColor,
                    extendedProps: {
                        ...t,
                        event_type: isCancelled ? "cancel" : "normal",
                    },
                });
            });

            // 4) 이벤트 (휴강, 이벤트, 특강) -> 단발성 이벤트로 변환
            events.forEach(e => {
                if (e.event_type === "makeup" || e.event_type === "special") {
                    this.calendarEvents.push({
                        id: `e-${e.id}`,
                        title: `[${getEventTypeName(e.event_type)}] ${e.subject_name ?? ""}`,
                        start: `${e.event_date}T${e.start_time || "00:00"}`,
                        end: `${e.event_date}T${e.end_time || "23:59"}`,
                        backgroundColor: getEventColor(e.event_type),
                        extendedProps: { ...e },
                    });
                }
            });

            console.log("📅 최종 Calendar 데이터:", JSON.stringify(this.calendarEvents, null, 2));

        },
    },
});