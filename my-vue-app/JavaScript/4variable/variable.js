function testScope() {
    if (true) {
        var a = 10;
        let b = 20;
        const c = 30;
    }
    console.log(a); // 10 (함수 스코프)
    console.log(b); // ReferenceError
    console.log(c); // ReferenceError
}

testScope();

console.log(x); // undefined
var x = 10;

console.log(y); // ReferenceError
let y = 20;

console.log(z); // ReferenceError
const z = 30;