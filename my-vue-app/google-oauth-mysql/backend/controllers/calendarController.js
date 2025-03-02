// controllers/calendarController.js
const calendarService = require('../services/calendarService');

exports.createEvent = async (req, res) => {
    try {
        const { summary, description, startDate, endDate, repeatRule } = req.body;

        // 종일 vs 시간대 구분 (예시 로직)
        const allDay = (startDate?.length === 10 && endDate?.length === 10);

        const newEvent = await calendarService.createEvent({
            summary,
            description,
            startDate,
            endDate,
            allDay,
            repeatRule
        });
        res.status(201).json(newEvent);
    } catch (error) {
        console.log('구글 캘린더 이벤트 생성 오류', error);
        res.status(500).json({ message: '서버 오류 발생'});
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { summary, description, startDate, endDate, repeatRule } = req.body;

        // 종일 vs 시간대 구분 (예시 로직)
        const allDay = (startDate?.length === 10 && endDate?.length === 10);

        const updateEvent = await calendarService.updateEvent(eventId, {
            summary,
            description,
            startDate,
            endDate,
            allDay,
            repeatRule
        });

        res.status(200).json(updateEvent);
    } catch (error) {
        console.error('구글 캘린더 이벤트 수정 오류', error);
        res.status(500).json({ message: '서버 오류 발생' })
    }
}

exports.listEvents = async (req, res) => {
    try {
        const { timeMin, timeMax } = req.query;
        const events = await calendarService.listEvents(timeMin, timeMax);
        res.status(200).json(events);
    } catch (error) {
        console.error('구글 캘린더 이벤트 조회 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        await calendarService.deleteEvent(eventId);
        res.status(200).json({ message: '이벤트 삭제 완료'});
    } catch (error) {
        console.error('구글 캘린더 이벤트 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류 발생'});
    }
}