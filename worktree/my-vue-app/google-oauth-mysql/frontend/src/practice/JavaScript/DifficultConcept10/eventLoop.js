setTimeout(function () {
    console.log('setTimeout')
}, 0);
// Promise 함수가 먼저 출력 후 setTimeout 함수가 출력된다.
Promise.resolve().then(function() {
    console.log('Promise');
});