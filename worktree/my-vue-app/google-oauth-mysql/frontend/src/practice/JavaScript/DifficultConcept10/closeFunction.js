import * as mycounter from "@babel/types";

// 1. 함수 반환을 통한 클로저 구현 (상태를 유지하는 함수를 만들 떄 유용)
function createCounter() {
    let count = 0; // 내부 변수 (클로저로 관리될 변수)
    return function() { // 익명 함수 반환
        count += 1; // 클로저가 count를 기억하고 접근
        return count; // 현재 count값을 반환
    }
}
const myCounter = createCounter(); // createCounter 실행 -> 클로저 생성
console.log(myCounter); // 클로저 함수 출력


// 2. callback 함수를 이용해 클로저 구현 (클로저로 상태로 관리하면서, 외부 로직을 동적으로 실행할 때 유용)
function createCounter(callback) {
    let count = 0; // 내부 변수
    return function () { // 클로저 변환
        count += 1; // count 증가
        callback(count); // 현재 count 값을 콜백 함수로 전달
    }
}
const myCounter = createCounter(function(currentCount) {
    console.log('현재 카운트', currentCount); // 콜백 함수에서 count 값 출력
});
myCounter();


// 3. 객체 메서드 이용해 클로저 구현 (다중 메서드 기반 상태 관리가 필요할 때 유용)
function createCounter(callback) {
    let count = 0; // 클로저로 관리되는 내부 변수
    return {
        increment: function() { // count 값을 증가시키는 매서드
            count += 1;
            return count;
        },
        getCurrentCount: function() { // 현채 count 값을 변환하는 메서드
            return count;
        }
    }
}

const myCounter = createCounter(); // 첫번째 클로저
const myCounter2 = createCounter(); // 두번째 클로저
myCounter.increment(); // 1 => 1
myCounter.increment(); // 1 => 2
myCounter2.increment(); // 2 => 1
myCounter2.increment(); // 2 => 2
myCounter2.increment(); // 2 => 3

// 출력
console.log(myCounter.getCurrentCount());
console.log(myCounter2.getCurrentCount());