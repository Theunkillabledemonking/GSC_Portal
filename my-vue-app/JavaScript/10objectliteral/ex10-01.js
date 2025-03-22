// 객체 리터럴 생성법 ( 기본적 )
var person = {
    name: 'Lee',
    sayHello: function() { // sayHello -> 프로퍼터 : 함수 값
        console.log(`Hello World! My name is ${this.name}!`);
    }
};

console.log(typeof person);
console.log(person);