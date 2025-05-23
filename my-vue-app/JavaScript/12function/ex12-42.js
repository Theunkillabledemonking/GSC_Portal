// 즉시 실행 함수도 일반 함수처럼 값을 반환할 수 있다.
var res = (function() {
    var a = 3;
    var b = 2;
    return a * b;
}());
console.log(res); // 15

// 즉시 실행 함수에도 일반 함수처럼 인수를 전달 할 수 있다
res = (function(a, b) {
    return a + b;
}(1, 2));
console.log(res); // 3

