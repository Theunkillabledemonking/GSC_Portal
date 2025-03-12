const arr = [1, 2, 3];

arr.forEach(console.log);

console.log(score); // undefined

score = 8;
var score ; // 변수 선언과 값의 할당

console.log(score); // 80
score = 90;
// undefined가 저장되어 있던 메모리 공간을 지우는 게 x,
// 새로운 메모리 공간을 확보하고 그곳에 할당 값 80을 저장한다는 점에 주의
// 불필요한 값은 가비지 콜렉터에 의해 메모리에서 자동 해제, 단 메모리에서 언제 없어질지는 모름.

// 변수 선언문은 표현식이 아닌 문임.
var x;

// 할당문은 그 자체가 표현식이지만 완전한 문이기도 함. 즉, 할당문은 표현식인 문이다.
x= 100;