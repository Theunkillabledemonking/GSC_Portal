// ES6
const obj = {
    name: 'Lee',
    // 메서드 축약 표현
    sayHi() {
        console.log('Hello:', this.name);
    }
}

obj.sayHi();