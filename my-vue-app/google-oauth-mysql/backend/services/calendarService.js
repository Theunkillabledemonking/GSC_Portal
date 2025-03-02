// services/calendarService.js
const { calendar, CALENDAR_ID } = require('../config/googleAPI');

exports.createEvent = async (eventData) => {
    // eventData: { summary, description, startDate, endDate, allDay }
    let startObj, endObj;

    if (eventData.allDay) {
        // 종일
        startObj = { date: eventData.startDate };
        endObj = { date: eventData.endDate };
    } else {
        // 시간대 일정
        startObj = { dateTime: eventData.startDate };
        endObj = { dateTime: eventData.endDate };
    }

    // 반복 주기
    let recurrenceArr = null;
    if (eventData.repeatRule && eventData.repeatRule !== 'none') {
        const freq = eventData.repeatRule.toUpperCase();
        recurrenceArr = [`RRULE:FREQ=${freq}`];
    }
    console.log(recurrenceArr);

    const res = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
            summary: eventData.summary,
            description: eventData.description,
            start: startObj,
            end: endObj,
            recurrence: recurrenceArr,
        },
    });
    return res.data;
}

exports.updateEvent = async (eventId, eventData) => {
    let startObj, endObj;

    if (eventData.allDay) {
        // 종일
        startObj = { date: eventData.startDate };
        endObj = { date: eventData.endDate };
    } else {
        // 시간대 일정
        startObj = { dateTime: eventData.startDate };
        endObj = { dateTime: eventData.endDate };
    }

    // 반복 주기
    let recurrenceArr = null;
    if (eventData.repeatRule && eventData.repeatRule !== 'none') {
        const freq = eventData.repeatRule.toUpperCase();
        recurrenceArr = [`RRULE:FREQ=${freq}`];
    }
    console.log(recurrenceArr);
    const res = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: eventId,
        requestBody: {
            summary: eventData.summary,
            description: eventData.description,
            start: startObj,
            end: endObj,
            recurrence: recurrenceArr,
        },
    });
    return res.data;
};


// 일정 이벤트 조회
exports.listEvents = async (timeMin, timeMax) => {
    // timeMin, timeMax: 조회 기간
    const res = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return res.data.items;
};

// 일정 (이벤트) 삭제
exports.deleteEvent = async (eventId) => {
    await calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: eventId
    });
};

