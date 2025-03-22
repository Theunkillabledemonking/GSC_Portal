// 매개변수 primitive는 원시 값을 전달받고, 매개변수는 obj를 전달받음
function changeVal(primitive, obj) {
    primitive += 100;
    obj.name = 'Kim';
}

// 외부 상태
var num = 100;
var person = { name: 'Lee'};

console.log(num);
console.log(person);

// 원시 값은 값 자체가 복사되어 전달되고 객체는 참조 값이 복사되어 전달됨
changeVal(num, person);

// 원시 값은 훼손이 되지 않는다.
console.log(num); // 100

// 객체는 원본이 훼손된다.
console.log(person); // { name : Kim }