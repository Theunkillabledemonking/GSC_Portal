// 1. createLogger 함수 정의
// - 'type' 파라미터를 받아서, 내부에 또 다른 함수를 반환하는 함수입니다.
function createLogger (type) {
    // 2. 반환하는 함수가 클로저를 형성
    // - 이 함수 내부에서 'type'을 참조
    // - 'type'은 createLogger 함수가 끝난 뒤에도 유지됨 (클로저)
    return function(message) {
        console.log(`[${type}] ${message}]`);
    }
}

// 3. 실제로 createLogger 함수를 호출해서 Logger를 만들어 냄.

// - 'ERROR' 라는 문자열을 전달하면, 아래와 같은 클로저가 만들어짐.
// function (message) {
//  console.log(`[ERROR] ${message}]`);
//  }
const errorLogger = createLogger('ERROR');

// - INFO
const infoLogger = createLogger('INFO');
// - WARING
const warningLogger = createLogger('WARING');

// 4. 각각의 logger를 호출하면서, 메시지만 전달하면 됨.
// - errorlogger('...')를 호출하면 createLogger('ERROR') 떄 설정된 'ERROR'가 계속 유지됨.
errorLogger('이것은 에러 메시지 입니다.');
infoLogger('이것은 정보 메시지 입니다.');
warningLogger('이것은 경고 메시지 입니다.');