// config/googleApi.js
const { google } = require('googleapis')
const path = require('path');
const fs = require('fs');

// 서비스 계정 키 파일 로드
const keyPath = path.join(__dirname, 'keyfile.json');
const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

// JWT 클라이언트 초기화
const jwtClient = new google.auth.JWT(
    keyFile.client_email,
    null,
    keyFile.private_key,
    ['https://www.googleapis.com/auth/calendar']
);

// 캘린더 인스턴스
const calendar = google.calendar({ version: 'v3', auth:jwtClient });
const CALENDAR_ID = '06cacd945309081ecac9f65bbe42bb2d7079d61607dbd82edf6ab9c43d8d56bd@group.calendar.google.com';

module.exports = {
    calendar,
    CALENDAR_ID
};