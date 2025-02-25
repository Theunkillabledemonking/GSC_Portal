// dotenv 패키지를 불러옵니다.
// dotenv는 .env 파일의 환경 변수를 process.env 객체에 로드합니다.
const dotenv = require('dotenv');

// .env 파일을 로드합니다.
// 이 파일의 내용이 process.env에 추가됩니다.
dotenv.config();

// process.env를 콘솔에 출력하여 로드된 환경 변수를 확인합니다.
// ( 개발 환경에서만 사용, 실제 배포 시에는 비활성화 하세요)
console.log('환경 변수 로드 완료', process.env);

// 모듈을 내보내어 다른 파일에서도 사용 가능
module.exports = process.env;