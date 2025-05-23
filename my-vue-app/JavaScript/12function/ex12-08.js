// 기명 함수 리터럴을 단독으로 사용하면 함수 선언문으로 해석함.
// 함수 선언문에서는 함수 이름을 생략 불가능.
function foo() { console.log('foo'); }

foo(); // foo

// 함수 리터럴을 피연산자로 사용하면 함수 선언문이 아니라 함수 리터럴 표현으로 해석됨.
// 함수 리터럴에서는 함수 이름을 생략할 수 있다.
(function bar() { console.log('bar'); });
bar(); // ReferenceError: bar is not defined