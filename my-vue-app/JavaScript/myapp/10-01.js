var person = {
    name: 'Lee',
    sayHello: function () {
        console.log(`Hello! My name is ${person.name}`);
    }
};

console.log(typeof person); // object
console.log(person); // {name: 'Lee', sayHello: f}

var empty = {}; // 빈 객체
console.log(typeof person);