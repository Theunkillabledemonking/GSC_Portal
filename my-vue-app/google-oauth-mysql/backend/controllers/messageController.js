const axios = require('axios');
require('dotenv').config(); // 맨 위에 있어야 함

const sendLineMessage = async () => {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    console.log('LINE_ACCESS_TOKEN:', accessToken);


    const res = await axios.post('https://api.line.me/v2/bot/message/push', {
        to: 'U210a4d204e3333a1a5642bace7e49051',
        messages: [
            {
                type: 'text',
                text: '📢 테스트 메시지: 공지사항 연동 준비 완료!'
            }
        ]
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    console.log('✅ 메시지 전송 성공:', res.data);
};

sendLineMessage(); // ✅ 함수 호출
