// services/calendarService.js
const { calendar, CALENDAR_ID } = require('../config/googleAPI');

// 일정 (이벤트) 생성
exports.createEvent = async (eventData) => {
    // eventData: { summary, description, startDate, endDate, }
    const res = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
            summary: eventData.summary,
            description: eventData.description,
            start: { dateTime: eventData.startDate},
            end: { dateTime: eventData.endDate},
            // timezone, location 등 추가 가능
        },
    });
    return res.data;
}

exports.updateEvent = async (eventId, eventData) => {
    const res = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: eventId,
        requestBody: {
            summary: eventData.summary,
            description: eventData.description,
            start: { dateTime: eventData.startDate},
            end: { dateTime: eventData.endDate},
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

