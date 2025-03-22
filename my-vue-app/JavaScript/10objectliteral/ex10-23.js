// ES5
var obj = {
    name: 'Lee',
    sayHi: function () {
        console.log('Hi !' + this.name);
    }
}

console.log(obj.sayHi());

// Hi ! Lee
// undefined  함수에는 리턴이 없기 때문에 암묵적으로 undefined 반환한다